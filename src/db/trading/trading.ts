import ProductOfferRecord, { IProductOfferRecord } from "./models/ProductOffer";
import ProductCategory, { IProductCategoryRecord } from "./models/ProductCategory";

async function getCategories(): Promise<string[]> {
    return (await ProductCategory.find()).map((cat: IProductCategoryRecord) => cat.name)
}

async function addCategory(name: string): Promise<IProductCategoryRecord> {
    return ProductCategory.create({ name })
}

async function getProductOffers(queryParams: any): Promise<IProductOfferRecord[]> {
    return ProductOfferRecord.find(queryParams)
}

async function addProductOffer(offer: any): Promise<IProductOfferRecord> {
    return ProductOfferRecord.create({ ...offer, sold: false })
}

async function updateProductOffer(id: string, offer: any): Promise<IProductOfferRecord | null> {
    return ProductOfferRecord.findOneAndUpdate({ _id: id }, { ...offer }, { new: true, runValidators: true })
}

async function deactivateProductOffer(id: string, sold: boolean): Promise<boolean> {
    try {
        await ProductOfferRecord.findOneAndUpdate({ _id: id }, { deactivatedAt: new Date(), sold })
        return true
    } catch (e) {
        console.error(`Unable to delete offer with "${id}": `, e)
        return false
    }
}

export default { getCategories, addCategory, getProductOffers, addProductOffer, updateProductOffer, deactivateProductOffer }
