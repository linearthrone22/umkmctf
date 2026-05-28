import type { ShippingCostBreakdown, VehicleRate, VehicleType } from './types';

export const VEHICLE_RATES: Record<VehicleType, VehicleRate> = {
    motor: {
        type: 'motor',
        label: 'Motor',
        description: 'Cepat & hemat untuk jarak dekat.',
        baseFee: 8000,
        perKm: 2500,
        perKg: 50
    },
    pickup: {
        type: 'pickup',
        label: 'Pickup',
        description: 'Cocok untuk muatan menengah.',
        baseFee: 20000,
        perKm: 4500,
        perKg: 35
    },
    truck: {
        type: 'truck',
        label: 'Truck',
        description: 'Kapasitas besar untuk multi-drop.',
        baseFee: 40000,
        perKm: 8000,
        perKg: 25
    }
};

const safeNumber = (value: any, fallback = 0) => {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : fallback;
};

export const calculateShippingCost = (input: {
    vehicleType: VehicleType;
    distanceKm: number;
    durationMins: number;
    loadKg: number;
}): ShippingCostBreakdown => {
    const vehicleType = input.vehicleType;
    const rate = VEHICLE_RATES[vehicleType];

    const distance_km = Math.max(0, safeNumber(input.distanceKm));
    const duration_mins = Math.max(0, Math.round(safeNumber(input.durationMins)));
    const load_kg = Math.max(0, safeNumber(input.loadKg));

    const base_fee = Math.max(0, safeNumber(rate.baseFee));
    const distance_fee = Math.round(Math.max(0, safeNumber(rate.perKm)) * distance_km);
    const weight_fee = Math.round(Math.max(0, safeNumber(rate.perKg)) * load_kg);
    const total = Math.max(0, Math.round(base_fee + distance_fee + weight_fee));

    return {
        vehicle_type: vehicleType,
        distance_km: Number(distance_km.toFixed(1)),
        duration_mins,
        load_kg: Math.round(load_kg),
        base_fee,
        distance_fee,
        weight_fee,
        total,
        notes: 'Estimasi ongkir MVP (base + per km + per kg).'
    };
};

export const formatIdr = (value: number) => {
    try {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
    } catch {
        return `Rp ${Math.round(value || 0)}`;
    }
};

