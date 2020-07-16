import { Request, Response } from 'express';
import tradingDb from '../db/trading/trading';
import { IProductOfferRecord } from '../db/trading/models/ProductOffer';

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
    const queryParams = { deactivatedAt: null, ...extractQueryParams(req) }
    const offers = await tradingDb.getProductOffers(queryParams)
    res.status(200).json(offers)
}

function extractQueryParams(req: Request): object {
    const userId: number = +req.query.userId
    const productId: string = req.query.productId as string
    const category: string = req.query.category as string
    const longitude: number = +req.query.longitude
    const latitude: number = +req.query.latitude
    const radiusInMeters: number = +req.query.radius
    const includeInactive: boolean = req.query.includeInactive === 'true'

    if (longitude && !latitude || radiusInMeters && (!longitude || !latitude))
        return {}

    return {
        ...(userId && { userId }),
        ...(productId && { productId }),
        ...(category && { category }),
        ...(longitude && { longitude }),
        ...(latitude && { latitude }),
        ...(radiusInMeters && { radiusInMeters }),
        ...(!includeInactive && { deactivatedAt: null })
    }
}

async function postOffer(req: Request, res: Response): Promise<void> {
    try {
        const offer = await tradingDb.addProductOffer(req.body as IProductOfferRecord)
        res.status(201).json(offer)
    } catch (e) {
        console.error("Error trying to create ProductOfferRecord from POST body: ", e)
        res.sendStatus(400)
        return
    }
}

async function putOffer(req: Request, res: Response): Promise<void> {
    console.log("Putting offer...")
    const offerId: string = req.params.offerId
    if (!offerId) {
        res.statusMessage = "Please provide the parameter \"offerId\" by including it in the URL path"
        res.sendStatus(400)
        return
    }

    const existingRecord = await tradingDb.getProductOffers({ _id: offerId })
    if (!existingRecord || existingRecord.length == 0) {
        res.statusMessage = `No record exists with Id ${offerId}. Please use the corresponding POST function`
        res.sendStatus(404)
        return
    }

    try {
        const updatedOffer = await tradingDb.updateProductOffer(offerId, req.body)
        console.log("Returning...")
        res.status(200).json(updatedOffer)
        console.log("Returned...")
    } catch (e) {
        console.error(`Error trying to update offer ${offerId}`, e)
        res.statusMessage = `Cannot update offer ${offerId} because of invalid arguments`
        res.sendStatus(400)
    }
}

async function deleteOffer(req: Request, res: Response): Promise<void> {
    const offerId: string = req.params.offerId
    if (!offerId) {
        res.statusMessage = "Please provide the parameter \"offerId\" by including it in the URL path"
        res.sendStatus(400)
        return
    }

    const sold = req.body.sold === 'true'
    const result = await tradingDb.deactivateProductOffer(offerId, sold)
    if (result) {
        res.sendStatus(204)
    } else {
        res.sendStatus(400)
    }
}

export default { getCategories, postCategory, getOffers, postOffer, putOffer, deleteOffer }
