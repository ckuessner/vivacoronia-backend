import mongoose, { Document, Schema } from "mongoose";
import { Point2DSchema } from "../../Tracking/models/LocationRecord";
import { validateCategory } from "./ProductCategory";

const ProductOfferSchema: Schema = new Schema({
    userId: {
        type: String,
        required: true
    },
    product: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: [1, 'amount cannot be negative']
    },
    productCategory: {
        type: String,
        required: true,
        index: true,
        validate: validateCategory
    },
    price: {
        // stores the money internally as cents, that's why we need get/set
        type: Number,
        required: true,
        get: getPrice,
        set: setPrice,
        min: [0, 'price cannot be negative']
    },
    details: {
        type: String,
    },
    location: {
        type: Point2DSchema,
        required: true,
        index: '2dsphere'
    },
    phoneNumber: {
        type: String,
    },
    deactivatedAt: {
        type: Date,
    },
    sold: {
        type: Boolean,
        default: false,
        index: true
    }
}, { id: false })

function getPrice(num: number) {
    return parseFloat((num / 100).toFixed(2));
}

function setPrice(num: number) {
    return Math.ceil(num * 100);
}

ProductOfferSchema.set('toObject', { getters: true });
ProductOfferSchema.set('toJSON', { getters: true });
ProductOfferSchema.set('timestamps', true);

export interface LeanProductOffer {
    userId: string;
    product: string;
    amount: number;
    productCategory: string;
    price: number;
    details: string;
    location: {
        type: 'Point';
        coordinates: Array<number>;
    };
    phoneNumber: string;
    deactivatedAt?: Date;
    sold: boolean;
}

export interface ProductOfferDocument extends Document, LeanProductOffer { }

export interface ProductOfferQuery {
    offerId?: string;
    userId?: string;
    product?: string;
    productCategory?: string;
    longitude?: number;
    latitude?: number;
    radiusInMeters?: number; // default radius 25km
    includeInactive?: boolean;
    sortBy?: string;
    priceMin?: number;
    priceMax?: number;
}

export interface ProductOfferPatch {
    product?: string;
    amount?: number;
    productCategory?: string;
    price?: number;
    details?: string;
    location?: {
        type: 'Point',
        coordinates: Array<number>;
    };
    phoneNumber?: string;
    deactivatedAt?: Date
    sold?: boolean
}

export default mongoose.model<ProductOfferDocument>('ProductOfferRecord', ProductOfferSchema);
