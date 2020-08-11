import { escapeRegExp } from 'lodash';
import sanitize from "mongo-sanitize";
import ProductCategory, { ProductCategoryDocument } from "./models/ProductCategory";
import ProductOfferRecord, { LeanProductOffer, ProductOfferDocument, ProductOfferPatch, ProductOfferQuery } from "./models/ProductOffer";
import ProductNeedRecord, { ProductNeedDocument, LeanProductNeed, ProductNeedQuery } from "./models/ProductNeed";

async function getCategories(): Promise<string[]> {
    return (await ProductCategory.find().lean()).map(doc => doc.name)
}

async function addCategory(name: string): Promise<ProductCategoryDocument> {
    return ProductCategory.create({ name })
}

async function getProductOffers(queryOptions: ProductOfferQuery): Promise<ProductOfferDocument[]> {
    return (await ProductOfferRecord.aggregate(extractAggregateOfferQuery(queryOptions)))
}

const priceConversion = {
    $addFields: {
        price: { $multiply: ["$price", .01] }
    }
}

function getLocationQuery(lon: number, lat: number, radiusInMeters: number): {
    $geoNear?: {
        near: {
            type: string;
            coordinates: number[];
        };
        distanceField: string;
        maxDistance: number;
    };
} {
    return {
        ...(lon && lat &&
        {
            $geoNear: {
                near: { type: "Point", coordinates: [lon, lat] },
                distanceField: "distanceToUser",
                maxDistance: radiusInMeters
            }
        })
    }
}

function extractAggregateOfferQuery(queryOptions: ProductOfferQuery): Record<string, unknown>[] {
    // Should be sanitized, to prevent query injection
    queryOptions.product = escapeRegExp(queryOptions.product)
    const { offerId, userId, product, productCategory, longitude, latitude, radiusInMeters, includeInactive, sortBy, priceMin, priceMax } = sanitize(queryOptions)

    const productQuery = {
        $match: {
            ...(offerId && { offerId }),
            ...(userId && { userId }),
            ...(product && { product: new RegExp(product, 'i') }),
            ...(productCategory && { productCategory }),
            ...(!includeInactive && { deactivatedAt: null }),
            ...((priceMin || priceMax) && {
                price: {
                    ...(priceMin && { $gte: priceMin * 100 }),
                    ...(priceMax && { $lte: priceMax * 100 })
                }
            }),
        }
    }

    const locationQuery = getLocationQuery(longitude as number, latitude as number, radiusInMeters as number)

    const sortQuery = {
        ...(sortBy) &&
        {
            $sort: {
                [sortBy]: 1
            }
        }
    }

    // The aggregation doesn't accept empty pipeline stages, if no parameters for some stage are provided, remove the empty pipeline stages.
    return [locationQuery, productQuery, priceConversion, sortQuery].filter(query => Object.keys(query).length != 0)
}

function extractAggregateNeedQuery(queryOptions: ProductNeedQuery): Record<string, unknown>[] {
    queryOptions.product = escapeRegExp(queryOptions.product)
    const { needId, userId, product, productCategory, longitude, latitude, radiusInMeters } = sanitize(queryOptions)

    const productQuery = {
        $match: {
            ...(needId && { needId }),
            ...(userId && { userId }),
            ...(product && { product: new RegExp(product, 'i') }),
            ...(productCategory && { productCategory }),
        }
    }

    const locationQuery = getLocationQuery(longitude as number, latitude as number, radiusInMeters as number)

    return [locationQuery, productQuery].filter(query => Object.keys(query).length != 0)
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

async function updateProductOffer(id: string, userId: string, patch: ProductOfferPatch): Promise<ProductOfferDocument | null> {
    const sanitizedPatch = sanitizeProductOfferPatch(patch as Record<string, unknown>)
    return ProductOfferRecord.findOneAndUpdate({ _id: id, userId: userId }, sanitizedPatch, { new: true, runValidators: true })
}

async function deactivateProductOffer(id: string, userId: string, sold: boolean): Promise<boolean> {
    try {
        await ProductOfferRecord.findOneAndUpdate({ _id: id, userId: userId }, { deactivatedAt: new Date(), sold })
        return true
    } catch (e) {
        console.error(`Unable to delete offer with "${id}": `, e)
        return false
    }
}

// Product needs from here
async function getProductNeeds(queryOptions: ProductNeedQuery): Promise<ProductNeedDocument[]> {
    return (await ProductNeedRecord.aggregate(extractAggregateNeedQuery(queryOptions)))
}

async function addProductNeed(productNeed: LeanProductNeed): Promise<ProductNeedDocument> {
    return ProductNeedRecord.create(productNeed)
}

export default { getCategories, addCategory, getProductOffers, addProductOffer, updateProductOffer, deactivateProductOffer, addProductNeed, getProductNeeds }
