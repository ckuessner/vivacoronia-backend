import mongoose, { Document, Schema } from "mongoose";
import { validateCategory } from "./ProductCategory";

const StoreInventorySchema: Schema = new Schema({
    placeId: {
        type: String,
        required: true
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'ProductRecord',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    productCategory: {
        type: String,
        required: true,
        index: true,
        validate: validateCategory
    }
})

StoreInventorySchema.set('timestamps', true);

export interface LeanStoreInventory {
    placeId: string;
    product: string;
    amount: number;
    productCategory: string;
}

export interface StoreInventoryDocument extends LeanStoreInventory, Document { }

export default mongoose.model<StoreInventoryDocument>('StoreInventoryRecord', StoreInventorySchema);
