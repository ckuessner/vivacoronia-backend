import mongoose, { Document, Schema } from "mongoose";
import { Point2DSchema } from "../../models/LocationRecord";

const ProductNeedSchema: Schema = new Schema({
    userId: {
        type: Number,
        required: true
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'ProductRecord',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'amount cannot be negative']
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
    product: Schema.Types.ObjectId;
    amount: number;
    location: {
        type: 'Point';
        coordinates: Array<number>;
    };
    deactivatedAt?: Date;
    fulfilled: boolean;
}

export default mongoose.model<IProductNeedRecord>('ProductNeedRecord', ProductNeedSchema);
