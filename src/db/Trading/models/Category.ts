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
    }],
})

CategorySchema.add({
    subCategories: [{
        type: Schema.Types.ObjectId,
        ref: 'CategoryRecord',
        required: true,
    }]
})

export interface ICategoryRecord extends Document {
    name: string;
    products: [Schema.Types.ObjectId];
    subCategories: [Schema.Types.ObjectId]
}

export default mongoose.model<ICategoryRecord>('CategoryRecord', CategorySchema);
