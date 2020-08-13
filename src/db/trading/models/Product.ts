export interface ProductQuery{
    id?: string;
    userId?: number;
    product?: string;
    productCategory?: string;
    longitude?: number;
    latitude?: number;
    radiusInMeters?: number; 
    includeInactive?: boolean
}