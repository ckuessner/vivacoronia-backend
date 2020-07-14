import mongoose, { Document, Schema } from "mongoose";

const CategorySchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    products: [{
        type: Schema.Types.ObjectId,
        ref: 'ProductRecord',
        required: true
    }]
})

export interface ICategoryRecord extends Document {
    name: string;
    products: [Schema.Types.ObjectId];
}

export default mongoose.model<ICategoryRecord>('CategoryRecord', CategorySchema);
