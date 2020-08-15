import { Request, Response } from 'express';
import { ProductOfferPatch, LeanProductOffer } from '../db/trading/models/ProductOffer';
import tradingDb from '../db/trading/trading';
import { PatchOfferRequest, PostCategoryRequest } from '../types/trading'

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
        res.statusMessage = 'Please provide the attribute "name" in the request body'
        res.sendStatus(400)
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
    const userId: string = req.query.userId as string
    const product: string = req.query.product as string
    const productCategory: string = req.query.productCategory as string
    const longitude: number | undefined = req.query.longitude ? +req.query.longitude : undefined
    const latitude: number | undefined = req.query.latitude ? +req.query.latitude : undefined
    const radiusInMeters: number = +(req.query.radius || 25000) // default radius 25km
    const includeInactive: boolean = req.query.includeInactive === 'true'

    const queryOptions = { userId, product, productCategory, longitude, latitude, radiusInMeters, includeInactive }
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
        reqOffer.userId = req.params.userId
        const offer = await tradingDb.addProductOffer(reqOffer)
        res.status(201).json(offer)
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

    const existingRecord = await tradingDb.getProductOffers({ offerId })
    if (!existingRecord) {
        res.statusMessage = `No record exists with Id ${offerId}.`
        res.sendStatus(404)
        return
    }

    const patch = {
        product: req.body.product,
        amount: req.body.amount && +req.body.amount,
        productCategory: req.body.productCategory,
        priceTotal: req.body.priceTotal && +req.body.priceTotal,
        details: req.body.details,
        location: req.body.location,
        deactivatedAt: req.body.deactivatedAt && new Date(req.body.deactivatedAt),
        sold: req.body.sold,
    } as ProductOfferPatch

    const userId = res.locals.userId as string

    try {
        const updatedOffer = await tradingDb.updateProductOffer(offerId, userId, patch)
        console.log(updatedOffer)
        res.status(200).json(updatedOffer)
    } catch (e) {
        console.error(`Error trying to update offer ${offerId}`, e)
        res.statusMessage = `Cannot update offer ${offerId} because of invalid arguments`
        res.sendStatus(400)
    }
}

export default { getCategories, postCategory, getOffers, postOffer, patchOffer }
