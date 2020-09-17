import { Request, Response } from 'express';
import { LeanProductOffer, ProductOfferPatch, ProductOfferDocument } from '../db/trading/models/ProductOffer';
import tradingDb from '../db/trading/trading';
import { PatchOfferRequest, PostCategoryRequest, DeleteNeedRequest } from '../types/trading'
import { LeanProductNeed, ProductNeedDocument } from '../db/trading/models/ProductNeed';
import { ProductQuery } from '../db/trading/models/Product';
import notifications from '../controllers/notifications'
import { isEmpty } from 'lodash';
import { LeanInventoryItem, LeanSupermarket } from '../db/trading/models/SupermarketInventory';
import { mergeSortedArrays } from '../utils';
import { updateHamsterbuyer } from '../db/achievements/achievements';

function getRequestParameters(req: Request): ProductQuery {
    const userId: string = req.query.userId as string
    const product: string = req.query.product as string
    const productCategory: string = req.query.productCategory as string
    const amountMin: number | undefined = req.query.amountMin ? +req.query.amountMin : undefined
    const amountMax: number | undefined = req.query.amountMax ? +req.query.amountMax : undefined
    const longitude: number | undefined = req.query.longitude ? +req.query.longitude : undefined
    const latitude: number | undefined = req.query.latitude ? +req.query.latitude : undefined
    const radiusInMeters: number = req.query.radiusInKm ? (+req.query.radiusInKm) * 1000 : -1
    const includeInactive: boolean = req.query.includeInactive === 'true'
    const priceMin: number | undefined = req.query.priceMin ? +req.query.priceMin : undefined
    const priceMax: number | undefined = req.query.priceMax ? +req.query.priceMax : undefined
    let sortBy: string = req.query.sortBy as string

    if (sortBy) {
        if (sortBy === 'name') {
            sortBy = 'product'
        }
        else if (sortBy === 'price') {
            sortBy = 'price'
        }
        else if (sortBy === 'distance' && longitude && latitude) {
            sortBy = 'distanceToUser'
        } else {
            sortBy = ''
        }
    }

    return { userId, product, productCategory, amountMin, amountMax, longitude, latitude, radiusInMeters, includeInactive, sortBy, priceMin, priceMax }

}

async function getCategories(_: Request, res: Response): Promise<void> {
    try {
        const categories = await tradingDb.getCategories()
        res.status(200).json(categories)
    } catch (e) {
        console.error("Error getting all categories: ", e)
        res.sendStatus(500)
    }
}

async function postCategory(req: PostCategoryRequest, res: Response): Promise<void> {
    const categoryName = req.body.name
    if (!categoryName) {
        res.status(400).send('Please provide the attribute "name" in the request body')
        return
    }

    try {
        const category = await tradingDb.addCategory(categoryName)
        res.status(201).json(category)
    } catch (e) {
        console.error(`Error adding category with name ${categoryName}`)
        res.sendStatus(500)
    }
}

async function getOffers(req: Request, res: Response): Promise<void> {
    const queryOptions = getRequestParameters(req)

    try {
        const offers = await tradingDb.getProductOffers(queryOptions)
        res.status(200).json(offers)
    } catch (e) {
        console.error(`Error getting ProductOffers for query with options "${queryOptions.toString()}": `, e)
    }
}

async function getAvailableProducts(req: Request, res: Response): Promise<void> {
    try {
        const queryOptions = getRequestParameters(req)

        const offers = await tradingDb.getProductOffers(queryOptions)
        const supermarketItems = await tradingDb.getExtendedInventoryItems(queryOptions)

        const result = mergeSortedArrays(offers, supermarketItems, queryOptions.sortBy)
        res.status(200).json(result)
    } catch (e) {
        console.error("Error getting ProductOffers or InventoryItems or merging the results: ", e)
        res.status(400)
        return
    }
}

async function postOffer(req: Request, res: Response): Promise<void> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        delete req.body._id
        // An array wouldn't be checked correctly by the middleware
        if (req.body instanceof Array) {
            res.sendStatus(400)
            return
        }

        const reqOffer = req.body as LeanProductOffer
        const userId = res.locals.userId

        if (userId === reqOffer.userId) {
            const offer = await tradingDb.addProductOffer(reqOffer)

            void notifyForMatchingNeeds(offer)

            res.status(201).json(offer)
        }
        else {
            res.status(400).send("User does not exist or match to token")
        }
    } catch (e) {
        console.error("Error trying to create ProductOfferRecord from POST body: ", e)
        res.sendStatus(400)
        return
    }
}

async function patchOffer(req: PatchOfferRequest, res: Response): Promise<void> {
    const offerId: string = req.params.offerId
    if (!offerId) {
        res.statusMessage = "Please provide the parameter \"offerId\" by including it in the URL path"
        res.sendStatus(400)
        return
    }

    const existingRecord = await tradingDb.getProductOffers({ id: offerId })
    if (!existingRecord) {
        res.statusMessage = `No record exists with Id ${offerId}.`
        res.sendStatus(404)
        return
    }

    const patch = {
        product: req.body.product,
        amount: req.body.amount && +req.body.amount,
        productCategory: req.body.productCategory,
        price: req.body.price && +req.body.price,
        details: req.body.details,
        location: req.body.location,
        phoneNumber: req.body.phoneNumber,
        deactivatedAt: req.body.deactivatedAt && new Date(req.body.deactivatedAt),
        sold: req.body.sold,
    } as ProductOfferPatch

    const userId = res.locals.userId
    if (userId == undefined) {
        res.sendStatus(500)
        return
    }

    try {
        const updatedOffer = await tradingDb.updateProductOffer(offerId, userId, patch)
        console.log(updatedOffer)
        // only notify if the product was not deactivated
        if (updatedOffer != null && !req.body.deactivatedAt) {
            void notifyForMatchingNeeds(updatedOffer)
        }
        res.status(200).json(updatedOffer)
    } catch (e) {
        console.error(`Error trying to update offer ${offerId}`, e)
        res.statusMessage = `Cannot update offer ${offerId} because of invalid arguments`
        res.sendStatus(400)
    }
}

//==========================================================================================
// Needs

async function getNeeds(req: Request, res: Response): Promise<void> {
    const userId = res.locals.userId

    if (!isEmpty(req.query.userId) && userId === req.query.userId) {
        const queryOptions = getRequestParameters(req)
        const needs = await tradingDb.getProductNeeds(queryOptions)
        res.status(200).json(needs)
    }
    else {
        res.status(400).send("Queried userId doesnt matches JWT")
    }
}

async function postNeed(req: Request, res: Response): Promise<void> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        delete req.body._id
        // An array wouldn't be checked correctly by the middleware
        if (req.body instanceof Array) {
            res.sendStatus(400)
            return
        }

        const reqNeed = req.body as LeanProductNeed
        const userId = res.locals.userId

        if (userId === reqNeed.userId) {
            const productNeed = await tradingDb.addProductNeed(reqNeed)

            void notifyForMatchingOffers(productNeed)

            res.status(201).json(productNeed)
        }
        else {
            res.status(400).send("User does not exist or match to token")
        }

    } catch (e) {
        console.error("Error trying to create ProductNeed from POST body: ", e)
        res.sendStatus(400)
    }

}

async function deleteNeed(req: DeleteNeedRequest, res: Response): Promise<void> {
    const id = req.params.needId
    const fulfilled = req.body.fulfilled

    if (fulfilled == null) {
        res.statusMessage = "Fulfilled has to be True or False"
        res.sendStatus(400)
        return
    }


    const existingRecord = await tradingDb.getProductNeeds({ id })
    if (!existingRecord) {
        res.statusMessage = `No record exists with Id ${id}.`
        res.sendStatus(404)
        return
    }

    const userId = res.locals.userId
    if (userId == undefined) {
        res.sendStatus(500)
        return
    }

    try {
        const need = await tradingDb.deactivateProductNeed(id, fulfilled)

        try {
            // achievement stuff for hamsterbuyer
            if (fulfilled) {
                const amount = need?.amount
                if (amount !== undefined) {
                    await updateHamsterbuyer(userId, amount)
                }
            }
        }
        catch (e) {
            console.log("Error in delete Need updating achievement hamsterbuyer")
        }

        res.status(200).json(need)
    } catch (e) {
        res.statusMessage = `Cannot delete need ${id} because of invalid arguments`
        res.sendStatus(400)
    }

}

async function getSupermarkets(_: Request, res: Response): Promise<void> {
    try {
        const supermarkets = await tradingDb.getAllSupermarkets()
        res.status(200).json(supermarkets)
    } catch (e) {
        console.error("Error getting all supermarkets: ", e)
        res.sendStatus(500)
    }
}

async function getSupermarketData(req: Request, res: Response): Promise<void> {
    const supermarketId = req.params.supermarketId
    try {
        const inventory = await tradingDb.getSupermarket(supermarketId)
        if (inventory == null) {
            res.sendStatus(404)
            return
        }
        res.status(200).json(inventory)
    } catch (e) {
        console.error(`Error trying to get supermarket data with supermarketId ${supermarketId}: `, e)
        res.sendStatus(400)
        return
    }
}
// notifications
async function notifyForMatchingOffers(need: ProductNeedDocument): Promise<void> {
    const offers = await tradingDb.getOffersMatchesWithNeed(need)
    await notifications.sendMatchingProductsNotification(need, offers)
}

async function notifyForMatchingNeeds(offer: ProductOfferDocument): Promise<void> {
    const needs = await tradingDb.getNeedsMatchesWithOffer(offer)
    await notifications.sendNoficationAfterOfferPost(offer, needs)
}

async function postSupermarket(req: Request, res: Response): Promise<void> {
    try {
        const supermarket = await tradingDb.addSupermarket(req.body as LeanSupermarket)
        res.status(201).json(supermarket)
    } catch (e) {
        console.error("Error trying to create Supermarket from POST body: ", e)
        res.sendStatus(400)
        return
    }
}

async function deleteSupermarket(req: Request, res: Response): Promise<void> {
    try {
        const deleted = await tradingDb.deleteSupermarket(req.params.supermarketId)
        if (deleted) {
            res.sendStatus(200)
        } else {
            res.sendStatus(404)
        }
    } catch (e) {
        console.error(`Error trying to delete supermarket with id ${req.params.supermarketId}`)
        res.sendStatus(400)
    }
}

async function postInventoryItem(req: Request, res: Response): Promise<void> {
    const supermarketId = req.params.supermarketId
    const item = req.body as LeanInventoryItem
    try {
        const inventory = await tradingDb.addInventoryItem(supermarketId, item)
        res.status(201).json(inventory)
    }
    catch (e) {
        console.error("Error trying to create SupermarketInventory from POST body: ", e)
        res.sendStatus(400)
        return
    }
}

async function patchInventoryItem(req: Request, res: Response): Promise<void> {
    const supermarketId = req.params.supermarketId
    const itemId = req.params.itemId
    const { availabilityLevel } = req.body as { availabilityLevel?: number }
    if (availabilityLevel === undefined || supermarketId == undefined || !itemId) {
        console.log("No availability level specified")
        res.sendStatus(400)
        return
    }

    try {
        const item = await tradingDb.patchInventoryItem(supermarketId, itemId, availabilityLevel)
        res.status(200).json(item)
    } catch (e) {
        console.error(`Error trying to patch availability level of item "${itemId}" in supermarket "${supermarketId}" to "${availabilityLevel}"`, e)
        res.sendStatus(400)
    }
}

export default {
    getCategories,
    postCategory,
    getOffers,
    postOffer,
    patchOffer,
    postNeed,
    getNeeds,
    deleteNeed,
    getAvailableProducts,
    getSupermarketData,
    getSupermarkets,
    postSupermarket,
    deleteSupermarket,
    postInventoryItem,
    patchInventoryItem
}

