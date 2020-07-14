import mongoose, { Document, Schema } from "mongoose";
import { Point2DSchema } from "../../models/LocationRecord";

const ProductOfferSchema: Schema = new Schema({
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
    priceTotal: {
        // stores the money internally as cents, that's why we need get/set
        type: Number,
        required: true,
        get: getPrice,
        set: setPrice,
        min: [0, 'priceTotal cannot be negative']
    },
    details: {
        type: String,
    },
    location: {
        type: Point2DSchema,
        required: true,
        index: '2dsphere'
    },
    deactivatedAt: {
        type: Date,
    },
    sold: {
        type: Boolean,
        default: false,
        index: true
    }
})

function getPrice(num: number) {
    return parseFloat((num / 100).toFixed(2));
}

function setPrice(num: number) {
    return Math.ceil(num * 100);
}

ProductOfferSchema.set('toObject', { getters: true });
ProductOfferSchema.set('toJSON', { getters: true });
ProductOfferSchema.set('timestamps', true);

export interface IProductOfferRecord extends Document {
    userId: number;
    product: Schema.Types.ObjectId;
    amount: number;
    priceTotal: number;
    details: string;
    location: {
        type: 'Point';
        coordinates: Array<number>;
    };
    deactivatedAt?: Date;
    sold: boolean;
}

export default mongoose.model<IProductOfferRecord>('ProductOfferRecord', ProductOfferSchema);
