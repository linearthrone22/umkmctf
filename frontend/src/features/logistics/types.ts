export type VehicleType = 'motor' | 'pickup' | 'truck';

export interface VehicleRate {
    type: VehicleType;
    label: string;
    description: string;
    baseFee: number; // IDR
    perKm: number; // IDR per km
    perKg: number; // IDR per kg (rough)
}

export interface ShippingCostBreakdown {
    vehicle_type: VehicleType;
    distance_km: number;
    duration_mins: number;
    load_kg: number;
    base_fee: number;
    distance_fee: number;
    weight_fee: number;
    total: number;
    notes?: string;
}

export interface RouteStats {
    distance_km: number;
    duration_mins: number;
    waypoint_order: number[] | null;
}

