import mongoose, { Document, Schema, SchemaTypeOpts } from "mongoose";
import ProductCategory, { validateCategory } from "./ProductCategory";

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

export interface IStoreInventoryRecord extends Document {
    placeId: string;
    product: string;
    amount: number;
    productCategory: string;
}

export default mongoose.model<IStoreInventoryRecord>('StoreInventoryRecord', StoreInventorySchema);
