import { ProductOfferDocument } from "./db/trading/models/ProductOffer";
import { ExtendedInventoryItem } from "./db/trading/models/SupermarketInventory";

interface OfferSearchResult extends ProductOfferDocument {
    distanceToUser?: number
}

interface InventoryItemSearchResult extends ExtendedInventoryItem {
    distanceToUser?: number
}

/**
 * Merges two already sorted arrays of search results with a sorting strategy.
 * @param a sortedArray of offers to be merged into result
 * @param b sortedArray pf supermarketItems to be merged into result
 * @param comparator returns true if the first value is less (smaller) than the second value, else false
 */
function mergeSortedArrays(a: OfferSearchResult[], b: InventoryItemSearchResult[], sortingStrategy: string | undefined): unknown[] {
    const comparator = getComparator(sortingStrategy)
    const result = new Array<unknown>(a.length + b.length)
    let indexA = 0, indexB = 0, indexResult = 0;

    while (indexA < a.length && indexB < b.length) {
        if (comparator(a[indexA], b[indexB])) {
            result[indexResult] = a[indexA];
            indexA++;
        }
        else {
            result[indexResult] = b[indexB];
            indexB++;
        }
        indexResult++;
    }
    while (indexA < a.length) {
        result[indexResult] = a[indexA];
        indexA++;
        indexResult++;
    }
    while (indexB < b.length) {
        result[indexResult] = b[indexB];
        indexB++;
        indexResult++;
    }
    return result;
}

function getComparator(sortingStrategy: string | undefined): (valA: OfferSearchResult, valB: InventoryItemSearchResult) => boolean {
    if (sortingStrategy == 'product') {
        return (valA, valB) => valA.product < valB.product
    }
    else if (sortingStrategy == 'price') {
        return () => false
    }
    else if (sortingStrategy == 'distanceToUser') {
        return (valA, valB) => valA?.distanceToUser != undefined && valB?.distanceToUser != undefined
            ? valA.distanceToUser < valB.distanceToUser
            : valA.distanceToUser != undefined
    }
    else {
        return () => false
    }
}

export { mergeSortedArrays };

