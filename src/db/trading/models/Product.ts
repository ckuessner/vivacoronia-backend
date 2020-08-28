export interface ProductQuery {
    id?: string;
    userId?: string;
    product?: string;
    productCategory?: string;
    amount?: number,
    longitude?: number;
    latitude?: number;
    radiusInMeters?: number;
    includeInactive?: boolean
}
