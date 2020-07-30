import ProductCategory, { ProductCategoryDocument } from "./models/ProductCategory";
import ProductOfferRecord, { ProductOfferPatch, ProductOfferQuery, ProductOfferDocument, LeanProductOffer } from "./models/ProductOffer";
import sanitize from "mongo-sanitize";
import { escapeRegExp } from 'lodash'

async function getCategories(): Promise<string[]> {
    return (await ProductCategory.find().lean()).map(doc => doc.name)
}

async function addCategory(name: string): Promise<ProductCategoryDocument> {
    return ProductCategory.create({ name })
}

async function getProductOffers(queryOptions: ProductOfferQuery): Promise<ProductOfferDocument[]> {
    return (await ProductOfferRecord.aggregate(extractAggregateQuery(queryOptions)))
}

const priceTotalConversion = {
    $addFields: {
        priceTotal: { $multiply: ["$priceTotal", .01] }
    }
}

function extractAggregateQuery(queryOptions: ProductOfferQuery): Record<string, unknown>[] {
    // Should be sanitized, to prevent query injection
    queryOptions.product = escapeRegExp(queryOptions.product)
    const { offerId, userId, product, productCategory, longitude, latitude, radiusInMeters, includeInactive } = sanitize(queryOptions)

    const productQuery = {
        $match: {
            ...(offerId && { offerId }),
            ...(userId && { userId }),
            ...(product && { product: new RegExp(product, 'i') }),
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

function sanitizeProductOfferPatch(patch: Record<string, unknown>): ProductOfferPatch {
    Object.keys(patch).forEach(key => {
        if (patch[key] === undefined || (typeof patch[key] === 'number' && isNaN(patch[key] as number))) {
            delete patch[key]
        }
    })
    delete patch['userId']
    return patch
}

async function updateProductOffer(id: string, patch: ProductOfferPatch): Promise<ProductOfferDocument | null> {
    const sanitizedPatch = sanitizeProductOfferPatch(patch as Record<string, unknown>)
    // TODO: add userId from JWT to query, so that users can't modify other users ProductOffers
    return ProductOfferRecord.findOneAndUpdate({ _id: id }, sanitizedPatch, { new: true, runValidators: true })
}

async function deactivateProductOffer(id: string, sold: boolean): Promise<boolean> {
    try {
        // TODO: add userId from JWT to query, so that users can't modify other users ProductOffers
        await ProductOfferRecord.findOneAndUpdate({ _id: id }, { deactivatedAt: new Date(), sold })
        return true
    } catch (e) {
        console.error(`Unable to delete offer with "${id}": `, e)
        return false
    }
}

export default { getCategories, addCategory, getProductOffers, addProductOffer, updateProductOffer, deactivateProductOffer }
