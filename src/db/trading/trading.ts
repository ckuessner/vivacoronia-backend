import { isNumber } from "util";
import ProductCategory, { ProductCategoryDocument } from "./models/ProductCategory";
import ProductOfferRecord, { IProductOfferPatch, IProductOfferQuery, ProductOfferDocument, LeanProductOffer } from "./models/ProductOffer";
import sanitize from "mongo-sanitize";

async function getCategories(): Promise<string[]> {
    return (await ProductCategory.find().lean()).map(doc => doc.name)
}

async function addCategory(name: string): Promise<ProductCategoryDocument> {
    return ProductCategory.create({ name })
}

async function getProductOffers(queryOptions: IProductOfferQuery): Promise<ProductOfferDocument[]> {
    return (await ProductOfferRecord.aggregate(extractAggregateQuery(queryOptions)))
}

const priceTotalConversion = {
    $addFields: {
        priceTotal: { $multiply: ["$priceTotal", .01] }
    }
}

function extractAggregateQuery(queryOptions: IProductOfferQuery): Record<string, unknown>[] {
    // Should be sanitized, to prevent query injection
    const { offerId, userId, product, productCategory, longitude, latitude, radiusInMeters, includeInactive } = sanitize(queryOptions)

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

    // The aggregation doesn't accept empty pipeline stages, if no parameters for some stage are provided, remove the empty pipeline stages.
    return [locationQuery, productQuery, priceTotalConversion].filter(query => Object.keys(query).length != 0)
}

async function addProductOffer(offer: LeanProductOffer): Promise<ProductOfferDocument> {
    return ProductOfferRecord.create(offer)
}

async function updateProductOffer(id: string, patch: IProductOfferPatch): Promise<ProductOfferDocument | null> {
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
