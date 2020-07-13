import mongoose, { Document, Schema } from "mongoose";
import { Point2DSchema } from "../../models/LocationRecord";

const ProductOfferSchema: Schema = new Schema({
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
    priceTotal: {
        // stores the money internally as cents, that's why we need get/set
        type: Number,
        required: true,
        get: getPrice,
        set: setPrice,
    },
    details: {
        type: String,
    },
    location: {
        type: Point2DSchema,
        required: true,
        index: '2dsphere'
    },
    deactivationTimestamp: {
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
    return num * 100;
}

ProductOfferSchema.set('toObject', { getters: true });
ProductOfferSchema.set('toJSON', { getters: true });
ProductOfferSchema.set('timestamps', true);

export interface IProductOfferRecord extends Document {
    userId: number;
    productId: Schema.Types.ObjectId;
    amount: number;
    priceTotal: number;
    details: string;
    location: {
        type: 'Point';
        coordinates: Array<number>;
    };
    deactivationTimestamp?: Date;
    sold: boolean;
}

export default mongoose.model<IProductOfferRecord>('ProductOfferRecord', ProductOfferSchema);
