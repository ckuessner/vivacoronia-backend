import mongoose, { Document, Schema } from "mongoose";
import { Point2DSchema } from "../../models/LocationRecord";

const ProductNeedSchema: Schema = new Schema({
    userId: {
        type: Number,
        required: true
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'ProductRecord',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    location: {
        type: Point2DSchema,
        required: true,
        index: '2dsphere'
    },
    deactivationTimestamp: {
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
    productId: Schema.Types.ObjectId;
    amount: number;
    location: {
        type: 'Point';
        coordinates: Array<number>;
    };
    deactivationTimestamp?: Date;
    fulfilled: boolean;
}

export default mongoose.model<IProductNeedRecord>('ProductNeedRecord', ProductNeedSchema);
