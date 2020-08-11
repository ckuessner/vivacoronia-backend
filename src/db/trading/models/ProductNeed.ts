import mongoose, { Document, Schema } from "mongoose";
import { Point2DSchema } from "../../Tracking/models/LocationRecord";
import { validateCategory } from "./ProductCategory";

const ProductNeedSchema: Schema = new Schema({
    userId: {
        type: String,
        required: true
    },
    product: {
        type: String,
        required: true
    },
    productCategory: {
        type: String,
        required: true,
        index: true,
        validate: validateCategory
    },
    location: {
        type: Point2DSchema,
        required: true,
        index: '2dsphere'
    },
    deactivatedAt: {
        type: Date,
    },
    fulfilled: {
        type: Boolean,
        default: false,
        index: true
    }
})

ProductNeedSchema.set('timestamps', true);

export interface LeanProductNeed {
    userId: string;
    product: string;
    productCategory: string;
    location: {
        type: 'Point';
        coordinates: Array<number>;
    };
    deactivatedAt?: Date;
    fulfilled: boolean;
}

export interface ProductNeedDocument extends LeanProductNeed, Document { }

export interface ProductNeedQuery{
    needId?: string;
    userId?: number;
    product?: string;
    productCategory?: string;
    longitude?: number;
    latitude?: number;
    radiusInMeters?: number; 
}

export default mongoose.model<ProductNeedDocument>('ProductNeedRecord', ProductNeedSchema);
