import mongoose, { Document, Schema } from "mongoose";

const ProductSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
})

export interface IProductRecord extends Document {
    name: string;
}

export default mongoose.model<IProductRecord>('ProductRecord', ProductSchema);
