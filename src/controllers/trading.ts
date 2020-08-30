import { Request, Response } from 'express';
import { LeanProductOffer, ProductOfferPatch, ProductOfferDocument } from '../db/trading/models/ProductOffer';
import tradingDb from '../db/trading/trading';
import { PatchOfferRequest, PostCategoryRequest, DeleteNeedRequest } from '../types/trading'
import { LeanProductNeed, ProductNeedDocument } from '../db/trading/models/ProductNeed';
import { ProductQuery } from '../db/trading/models/Product';
import notifications from '../controllers/notifications'
import { isEmpty } from 'lodash';

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
    const offers = await tradingDb.getProductOffers(queryOptions)
    res.status(200).json(offers)
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
        res.status(200).json(need)
    } catch (e) {
        res.statusMessage = `Cannot delete need ${id} because of invalid arguments`
        res.sendStatus(400)
    }

}

async function getInventory(req: Request, res: Response): Promise<void>{
    console.log("Get Inventory")
    console.log(req.query.supermarketId)
    const supermarketId = req.query.supermarketId as string
    const inventory = await tradingDb.getInventory(supermarketId)
    res.status(200).json(inventory)
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

export default { getCategories, postCategory, getOffers, postOffer, patchOffer, postNeed, getNeeds, deleteNeed }

async function postInventory(req: Request, res: Response): Promise<void>{
    console.log("Post Inventory")
    console.log(req.body)
    const supermarketId = req.query.supermarketId as string
    const items = req.body as [[string, number]]
    if(!Array.isArray(req.body)){
        res.sendStatus(400)
    }
    else {
        try{
            const inventory = await tradingDb.addInventory(supermarketId, items)
            res.status(201).json(inventory)
        }
        catch (e) {
            console.error("Error trying to create SupermarketInventory from POST body: ", e)
            res.sendStatus(400)
            return
        }
    }
}

//async function patchInventory(req: Request, res: Response): Promise<void>{

//}

export default { getCategories, postCategory, getOffers, postOffer, patchOffer, postNeed, getNeeds, deleteNeed, getInventory, postInventory }//, patchInventory }
