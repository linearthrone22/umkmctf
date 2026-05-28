import React, { useMemo } from 'react';
import { Calculator, Truck } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import type { RouteStats, VehicleType } from '../types';
import { calculateShippingCost, formatIdr, VEHICLE_RATES } from '../pricing';

interface ShipmentCostCardProps {
    routeStats: RouteStats | null;
    loadKg: number;
    vehicleType: VehicleType;
    onVehicleTypeChange: (next: VehicleType) => void;
    disabled?: boolean;
}

const ShipmentCostCard: React.FC<ShipmentCostCardProps> = ({
    routeStats,
    loadKg,
    vehicleType,
    onVehicleTypeChange,
    disabled
}) => {
    const estimate = useMemo(() => {
        if (!routeStats) return null;
        return calculateShippingCost({
            vehicleType,
            distanceKm: routeStats.distance_km,
            durationMins: routeStats.duration_mins,
            loadKg
        });
    }, [loadKg, routeStats, vehicleType]);

    return (
        <GlassCard>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Calculator className="text-emerald-600" size={18} />
                        Estimasi Ongkir
                    </h3>
                    <p className="text-xs text-slate-500">
                        Dinamis dari jarak rute + armada + berat (kg).
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 text-[11px] font-black px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
                    <Truck size={14} />
                    {VEHICLE_RATES[vehicleType].label}
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-5">
                    <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Armada</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                        {(Object.keys(VEHICLE_RATES) as VehicleType[]).map(type => {
                            const v = VEHICLE_RATES[type];
                            const active = type === vehicleType;
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => onVehicleTypeChange(type)}
                                    disabled={disabled}
                                    className={`text-left p-3 rounded-2xl border transition ${
                                        active
                                            ? 'border-emerald-500 bg-emerald-50'
                                            : 'border-slate-200 bg-white hover:border-emerald-200'
                                    } disabled:opacity-60`}
                                >
                                    <div className="text-sm font-black text-slate-900">{v.label}</div>
                                    <div className="text-[11px] text-slate-500">{v.description}</div>
                                    <div className="mt-2 text-[11px] font-bold text-slate-700">
                                        Base {formatIdr(v.baseFee)} · {formatIdr(v.perKm)}/km · {formatIdr(v.perKg)}/kg
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="lg:col-span-7">
                    <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Breakdown</div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        {!estimate ? (
                            <div className="text-sm text-slate-500">Jalankan rute dulu untuk lihat estimasi.</div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="text-[10px] font-black uppercase text-slate-400">Jarak</div>
                                        <div className="text-sm font-black text-slate-900">{estimate.distance_km} km</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="text-[10px] font-black uppercase text-slate-400">Durasi</div>
                                        <div className="text-sm font-black text-slate-900">{estimate.duration_mins} mnt</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="text-[10px] font-black uppercase text-slate-400">Muatan</div>
                                        <div className="text-sm font-black text-slate-900">{estimate.load_kg} kg</div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600">Base fee</span>
                                        <span className="font-black text-slate-900">{formatIdr(estimate.base_fee)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600">Biaya jarak</span>
                                        <span className="font-black text-slate-900">{formatIdr(estimate.distance_fee)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600">Biaya berat</span>
                                        <span className="font-black text-slate-900">{formatIdr(estimate.weight_fee)}</span>
                                    </div>
                                    <div className="h-px bg-slate-100" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-900 font-black">Total</span>
                                        <span className="text-emerald-700 font-black">{formatIdr(estimate.total)}</span>
                                    </div>
                                </div>

                                <div className="text-[11px] text-slate-500">{estimate.notes}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};

export default ShipmentCostCard;

