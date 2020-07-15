import mongoose, { Document, Schema, SchemaTypeOpts } from "mongoose";

const ProductCategorySchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
})

export interface IProductCategoryRecord extends Document {
    name: string;
}

const ProductCategory = mongoose.model<IProductCategoryRecord>('CategoryRecord', ProductCategorySchema);

export default ProductCategory

export const validateCategory = {
    validator: async function (cat: string): Promise<boolean> {
        return await ProductCategory.exists({ name: cat })
    },
    message: (v: SchemaTypeOpts.ValidatorProps): string =>
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `"${v.value}" is not a valid category!`
}
