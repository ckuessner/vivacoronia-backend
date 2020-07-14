import mongoose, { Document, Schema } from "mongoose";

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
})

StoreInventorySchema.set('timestamps', true);

export interface IStoreInventoryRecord extends Document {
    placeId: string;
    product: Schema.Types.ObjectId;
    amount: number;
}

export default mongoose.model<IStoreInventoryRecord>('StoreInventoryRecord', StoreInventorySchema);
