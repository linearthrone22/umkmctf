import React from 'react';
import GlassCard from './GlassCard';
import { TrendingUp, AlertCircle, Coins } from 'lucide-react';

import type { PriceData } from '../types';

interface PriceStrategistCardProps {
    data: PriceData | null;
    isLoading: boolean;
    stock: number;
}

const PriceStrategistCard: React.FC<PriceStrategistCardProps> = ({ data, isLoading, stock }) => {
    if (isLoading) {
        return (
            <GlassCard className="h-full">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-24 bg-slate-200 rounded-xl"></div>
                        <div className="h-24 bg-slate-200 rounded-xl"></div>
                    </div>
                    <div className="h-20 bg-slate-200 rounded-xl"></div>
                </div>
            </GlassCard>
        );
    }

    if (!data) return null;

    const totalImpact = data.extra_profit_per_kg * stock;

    return (
        <GlassCard className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="text-emerald-500" size={20} />
                    AI Price Discovery
                </h3>
                <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                    Real-time Analysis
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <div className="text-xs text-emerald-600 font-medium mb-1">Direct Recommended Price</div>
                    <div className="text-2xl font-bold text-emerald-700">
                        Rp {data.recommended_price.toLocaleString('id-ID')}<span className="text-sm font-normal text-emerald-500">/kg</span>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="text-xs text-slate-500 font-medium mb-1">Estimated Middleman Price</div>
                    <div className="text-2xl font-bold text-slate-400">
                        Rp {data.middleman_price_est.toLocaleString('id-ID')}<span className="text-sm font-normal text-slate-400">/kg</span>
                    </div>
                </div>
            </div>

            {/* Impact Metric Calculator */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl text-white shadow-lg shadow-emerald-200 mb-6 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 text-white/10 rotate-12 transition-transform group-hover:scale-110">
                    <Coins size={100} />
                </div>
                <div className="relative z-10">
                    <div className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">
                        Estimasi Nilai Dampak Sosial
                    </div>
                    <div className="text-3xl font-black">
                        +Rp {totalImpact.toLocaleString('id-ID')}
                    </div>
                    <div className="text-emerald-100 text-[10px] mt-2 flex items-center gap-1">
                        <AlertCircle size={10} />
                        Berdasarkan selisih harga tengkulak x total stok {stock}kg
                    </div>
                </div>
            </div>

            <div className="mt-auto">
                <div className="text-sm font-semibold text-slate-900 mb-2">Strategi AI:</div>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                    "{data.rationale}"
                </p>
                {Array.isArray(data.sources) && data.sources.length > 0 && (
                    <div className="mt-4 text-xs text-slate-500">
                        <div className="font-semibold text-slate-700 mb-1">Sumber:</div>
                        <ul className="list-disc pl-5 space-y-1">
                            {data.sources.slice(0, 4).map((s, idx) => (
                                <li key={`${s.link}-${idx}`}>
                                    <a
                                        href={s.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-emerald-700 hover:underline"
                                    >
                                        {s.title || s.link}
                                    </a>
                                    {typeof s.price_rp_per_kg === 'number' && Number.isFinite(s.price_rp_per_kg) && (
                                        <span className="text-slate-400"> — Rp {Math.round(s.price_rp_per_kg).toLocaleString('id-ID')}/kg</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </GlassCard>
    );
};

export default PriceStrategistCard;
