import ProductOfferRecord, { IProductOfferRecord, IProductOfferQuery } from "./models/ProductOffer";
import ProductCategory, { IProductCategoryRecord } from "./models/ProductCategory";

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
    const { userId, product, productCategory, longitude, latitude, radiusInMeters, includeInactive } = queryOptions

    const productQuery = {
        $match: {
            ...(userId && { userId }),
            ...(product && { product: new RegExp("^" + product) }),
            ...(productCategory && { productCategory }),
            ...(!includeInactive && { deactivatedAt: null })
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

async function updateProductOffer(id: string, offer: Record<string, unknown>): Promise<IProductOfferRecord | null> {
    return ProductOfferRecord.findOneAndUpdate({ _id: id }, offer, { new: true, runValidators: true })
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
