import mongoose, { Document, Schema } from "mongoose";

const InventoryItemSchema: Schema = new Schema({ product: String, amount: Number}, {id: false});
const SupermarketInventorySchema: Schema = new Schema({
    supermarketId: {
        type: String,
        required: true
    },
    inventory: {
        type: [InventoryItemSchema],
        required: true
    }
}, {id: false})

SupermarketInventorySchema.set('toObject', {getters: true});
SupermarketInventorySchema.set('toJSON', {getters: true});

export interface LeanSupermarketInventory {
    supermarketId: string;
    inventory: Schema.Types.Array
}

export interface SupermarketInventoryDocument extends Document, LeanSupermarketInventory { }

export interface SupermarketInventoryPatch {
    inventory?: [[string, number]]
}

export default mongoose.model<SupermarketInventoryDocument>('SupermarketInventoryRecord', SupermarketInventorySchema);