import { escapeRegExp } from 'lodash';
import sanitize from "mongo-sanitize";
import ProductCategory, { ProductCategoryDocument } from "./models/ProductCategory";
import ProductOfferRecord, { ProductOfferPatch, ProductOfferDocument, LeanProductOffer } from "./models/ProductOffer";
import ProductNeedRecord, { ProductNeedDocument, LeanProductNeed } from "./models/ProductNeed";
import { ProductQuery } from "./models/Product"

async function getCategories(): Promise<string[]> {
    return (await ProductCategory.find().lean()).map(doc => doc.name)
}

async function addCategory(name: string): Promise<ProductCategoryDocument> {
    return ProductCategory.create({ name })
}

async function getProductOffers(queryOptions: ProductQuery): Promise<ProductOfferDocument[]> {
    return (await ProductOfferRecord.aggregate(extractAggregateProductQuery(queryOptions, true)))
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
        distanceMultiplier: number,
        spherical: boolean,
        maxDistance?: number
    };
} {
    return {
        ...(lon && lat &&
        {
            $geoNear: {
                near: { type: "Point", coordinates: [lon, lat] },
                distanceField: "distanceToUser",
                distanceMultiplier: 0.001,
                spherical: true,
                ...(radiusInMeters && radiusInMeters > 0 && { maxDistance: radiusInMeters })
            }
        })
    }
}

function extractAggregateProductQuery(queryOptions: ProductQuery, offer: boolean): Record<string, unknown>[] {
    // Should be sanitized, to prevent query injection
    queryOptions.product = escapeRegExp(queryOptions.product)
    const { id, userId, product, productCategory, longitude, latitude, radiusInMeters, includeInactive, sortBy, priceMin, priceMax } = sanitize(queryOptions)

    const productQuery = {
        $match: {
            ...(id && { id }),
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
        ...(sortBy &&
        {
            $sort: {
                [sortBy]: 1
            }
        })
    }

    if (offer) {
        // The aggregation doesn't accept empty pipeline stages, if no parameters for some stage are provided, remove the empty pipeline stages.
        return [locationQuery, productQuery, priceConversion, sortQuery].filter(query => Object.keys(query).length != 0)
    }
    else {
        return [locationQuery, productQuery].filter(query => Object.keys(query).length != 0)
    }
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
async function getProductNeeds(queryOptions: ProductQuery): Promise<ProductNeedDocument[]> {
    return (await ProductNeedRecord.aggregate(extractAggregateProductQuery(queryOptions, false)))
}

async function addProductNeed(productNeed: LeanProductNeed): Promise<ProductNeedDocument> {
    return ProductNeedRecord.create(productNeed)
}

async function deactivateProductNeed(id: string, fulfilled: boolean): Promise<ProductNeedDocument | null> {
    return ProductNeedRecord.findOneAndUpdate({ _id: id }, { deactivatedAt: new Date(), fulfilled }, { new: true, runValidators: true })
}

export default { getCategories, addCategory, getProductOffers, addProductOffer, updateProductOffer, addProductNeed, getProductNeeds, deactivateProductNeed, deactivateProductOffer }
