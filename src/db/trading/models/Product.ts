export interface ProductQuery{
    id?: string;
    userId?: string;
    product?: string;
    productCategory?: string;
    longitude?: number;
    latitude?: number;
    radiusInMeters?: number; 
    includeInactive?: boolean
}