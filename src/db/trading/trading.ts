import { isNumber } from "util";
import ProductCategory, { IProductCategoryRecord } from "./models/ProductCategory";
import ProductOfferRecord, { IProductOfferPatch, IProductOfferQuery, IProductOfferRecord } from "./models/ProductOffer";

async function getCategories(): Promise<string[]> {
    return (await ProductCategory.find()).map((cat: IProductCategoryRecord) => cat.name)
}

async function addCategory(name: string): Promise<IProductCategoryRecord> {
    return ProductCategory.create({ name })
}

async function getProductOffers(queryOptions: IProductOfferQuery): Promise<IProductOfferRecord[]> {
    return ProductOfferRecord.aggregate(extractQuery(queryOptions))
}

function extractQuery(queryOptions: IProductOfferQuery): Record<string, unknown>[] {
    const { offerId, userId, product, productCategory, longitude, latitude, radiusInMeters, includeInactive } = queryOptions

    const productQuery = {
        $match: {
            ...(offerId && { offerId }),
            ...(userId && { userId }),
            ...(product && { product: new RegExp("^" + product) }),
            ...(productCategory && { productCategory }),
            ...(!includeInactive && { deactivatedAt: null }),
        }
    }

    const locationQuery = {
        ...(longitude && latitude &&
        {
            $geoNear: {
                near: { type: "Point", coordinates: [longitude, latitude] },
                distanceField: "distanceToUser",
                maxDistance: radiusInMeters
            }
        })
    }

    return [locationQuery, productQuery].filter(query => Object.keys(query).length != 0)
}

async function addProductOffer(offer: IProductOfferRecord): Promise<IProductOfferRecord> {
    return ProductOfferRecord.create({ ...offer, sold: false })
}

async function updateProductOffer(id: string, patch: IProductOfferPatch): Promise<IProductOfferRecord | null> {
    const update = patch as Record<string, unknown>
    Object.keys(update).forEach(key =>
        (update[key] === undefined
            || (isNumber(update[key]) && isNaN(update[key] as number)))
        && delete update[key]
    )
    return ProductOfferRecord.findOneAndUpdate({ _id: id }, update, { new: true, runValidators: true })
}

async function deactivateProductOffer(id: string, sold: boolean): Promise<boolean> {
    try {
        await ProductOfferRecord.findOneAndUpdate({ _id: id }, { deactivatedAt: new Date(), sold })
        return true
    } catch (e) {
        console.error(`Unable to delete offer with "${id}": `, e)
        return false
    }
}

export default { getCategories, addCategory, getProductOffers, addProductOffer, updateProductOffer, deactivateProductOffer }
