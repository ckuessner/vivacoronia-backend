import mongoose, { Document, Schema } from "mongoose";

const StoreInventorySchema: Schema = new Schema({
    placeId: {
        type: String,
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
})

StoreInventorySchema.set('timestamps', true);

export interface IStoreInventoryRecord extends Document {
    placeId: string;
    productId: Schema.Types.ObjectId;
    amount: number;
}

export default mongoose.model<IStoreInventoryRecord>('StoreInventoryRecord', StoreInventorySchema);
