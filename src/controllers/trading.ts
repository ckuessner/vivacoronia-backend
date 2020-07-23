import { Request, Response } from 'express';
import tradingDb from '../db/trading/trading';
import { IProductOfferRecord, IProductOfferQuery } from '../db/trading/models/ProductOffer';

async function getCategories(_: Request, res: Response): Promise<void> {
    try {
        const categories = await tradingDb.getCategories()
        res.status(200).json(categories)
    } catch (e) {
        console.error("Error getting all categories: ", e)
        res.sendStatus(500)
    }
}

async function postCategory(req: Request, res: Response): Promise<void> {
    const categoryName = req.body?.name as string
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
    const userId: number = +req.query.userId
    const product: string = req.query.product as string
    const productCategory: string = req.query.productCategory as string
    const longitude: number = +req.query.longitude
    const latitude: number = +req.query.latitude
    const radiusInMeters: number = +req.query.radius || 25000 // default radius 25km
    const includeInactive: boolean = req.query.includeInactive === 'true'

    const queryOptions = { userId, product, productCategory, longitude, latitude, radiusInMeters, includeInactive } as IProductOfferQuery
    const offers = await tradingDb.getProductOffers(queryOptions)
    res.status(200).json(offers)
}

async function postOffer(req: Request, res: Response): Promise<void> {
    try {
        delete req.body._id
        const offer = await tradingDb.addProductOffer(req.body as IProductOfferRecord)
        res.status(201).json(offer)
    } catch (e) {
        console.error("Error trying to create ProductOfferRecord from POST body: ", e)
        res.sendStatus(400)
        return
    }
}

async function patchOffer(req: Request, res: Response): Promise<void> {
    const offerId: string = req.params.offerId
    if (!offerId) {
        res.statusMessage = "Please provide the parameter \"offerId\" by including it in the URL path"
        res.sendStatus(400)
        return
    }

    const existingRecord = await tradingDb.getProductOffers([{ $match: { _id: offerId } }])
    if (!existingRecord) {
        res.statusMessage = `No record exists with Id ${offerId}.`
        res.sendStatus(404)
        return
    }

    try {
        const updatedOffer = await tradingDb.updateProductOffer(offerId, req.body)
        res.status(200).json(updatedOffer)
    } catch (e) {
        console.error(`Error trying to update offer ${offerId}`, e)
        res.statusMessage = `Cannot update offer ${offerId} because of invalid arguments`
        res.sendStatus(400)
    }
}

export default { getCategories, postCategory, getOffers, postOffer, patchOffer }