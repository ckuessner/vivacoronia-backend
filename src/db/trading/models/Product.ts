export interface ProductQuery {
    id?: string;
    userId?: string;
    product?: string;
    productCategory?: string;
    amountMin?: number,
    amountMax?: number,
    longitude?: number;
    latitude?: number;
    radiusInMeters?: number;
    includeInactive?: boolean;
    sortBy?: string;
    priceMin?: number;
    priceMax?: number
}
