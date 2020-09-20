import mongoose, { Document, Schema } from "mongoose";
import { Point2DSchema } from "../../Tracking/models/LocationRecord";
import { validateCategory } from "./ProductCategory";

const InventoryItemSchema: Schema = new Schema({
    product: {
        type: String,
        index: true
    },
    productCategory: {
        type: String,
        required: true,
        index: true,
        validate: validateCategory
    },
    availabilityLevel: {
        type: Number,
        required: true,
        validate: {
            validator: (a: number) => Number.isInteger(a) && a >= 0 && a <= 3
        }
    }
});

InventoryItemSchema.set('timestamps', true);

const SupermarketSchema: Schema = new Schema({
    supermarketId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    location: {
        type: Point2DSchema,
        required: true,
        index: '2dsphere'
    },
    inventory: {
        type: [InventoryItemSchema],
        required: true
    }
}, { id: false })

SupermarketSchema.set('toObject', { getters: true });
SupermarketSchema.set('toJSON', { getters: true });

export interface LeanInventoryItem {
    product: string,
    productCategory: string,
    availabilityLevel: number
}

export interface ExtendedInventoryItem extends LeanInventoryItem {
    supermarketId: string;
    name: string;
    location: {
        type: 'Point';
        coordinates: Array<number>;
    };
    distanceToUser?: number;
}

export interface LeanSupermarket {
    supermarketId: string;
    name: string;
    location: {
        type: 'Point';
        coordinates: Array<number>;
    };
    inventory: Array<LeanInventoryItem>;
}

export interface SupermarketDocument extends Document, LeanSupermarket { }

export interface InventoryItemPatch {
    availabilityLevel: number
}

export default mongoose.model<SupermarketDocument>('SupermarketRecord', SupermarketSchema);
