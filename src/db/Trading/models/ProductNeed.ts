import mongoose, { Document, Schema } from "mongoose";
import { Point2DSchema } from "../../models/LocationRecord";
import { validateCategory } from "./ProductCategory";

const ProductNeedSchema: Schema = new Schema({
    userId: {
        type: Number,
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

export interface IProductNeedRecord extends Document {
    userId: number;
    product: string;
    productCategory: string;
    location: {
        type: 'Point';
        coordinates: Array<number>;
    };
    deactivatedAt?: Date;
    fulfilled: boolean;
}

export default mongoose.model<IProductNeedRecord>('ProductNeedRecord', ProductNeedSchema);
