import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import type { Product } from '../../types';
import { parseCoordinatesFromInput } from '../../utils/location';
import { haversineKm } from '../../utils/geo';
import { useReviewsSummary } from '../reviews/useReviewsSummary';
import Stars from '../reviews/Stars';

const effectivePrice = (p: Product) => {
    const discount = Number(p.discount_per_kg || 0);
    return Math.max(0, Number(p.price || 0) - Math.max(0, discount));
};

interface CompareModalProps {
    open: boolean;
    products: Product[];
    buyerLocation: string;
    onClose: () => void;
}

const CompareModal: React.FC<CompareModalProps> = ({ open, products, buyerLocation, onClose }) => {
    const buyerCoords = buyerLocation ? parseCoordinatesFromInput(buyerLocation) : null;
    const ids = useMemo(() => products.map(p => p.id), [products]);
    const { summaryByItemId } = useReviewsSummary(ids);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
            <div className="relative w-full max-w-5xl">
                <GlassCard className="bg-white hover:shadow-none">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Komparasi Produk</h3>
                            <p className="text-sm text-slate-500">Bandingkan harga, stok, jarak, rating.</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
                            aria-label="Tutup"
                        >
                            <X size={18} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="mt-4 overflow-auto rounded-2xl border border-slate-200 bg-white">
                        <table className="min-w-[960px] w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs">
                                <tr>
                                    <th className="text-left px-4 py-3">Produk</th>
                                    <th className="text-right px-4 py-3">Harga /kg</th>
                                    <th className="text-right px-4 py-3">Stok</th>
                                    <th className="text-right px-4 py-3">Jarak</th>
                                    <th className="text-right px-4 py-3">ETA</th>
                                    <th className="text-left px-4 py-3">Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => {
                                    const coords = p.location ? parseCoordinatesFromInput(p.location) : null;
                                    const km = buyerCoords && coords ? haversineKm(buyerCoords, coords) : null;
                                    const etaMin = km == null ? null : Math.max(1, Math.round((km / 30) * 60)); // 30 km/h rough estimate
                                    const rating = summaryByItemId.get(p.id) || null;
                                    const variant = [p.variant_grade, p.variant_size, p.variant_packaging].filter(Boolean).join(' • ');
                                    return (
                                        <tr key={p.id} className="border-t border-slate-100">
                                            <td className="px-4 py-3">
                                                <div className="font-black text-slate-900">{p.commodity}</div>
                                                {variant && <div className="text-xs text-slate-500">{variant}</div>}
                                                <div className="text-xs text-slate-400">Seller {p.seller_id.slice(0, 8)}…</div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-emerald-700">
                                                Rp {effectivePrice(p).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 text-right">{Math.round(Number(p.stock || 0)).toLocaleString('id-ID')} kg</td>
                                            <td className="px-4 py-3 text-right">{km == null ? '-' : `${km.toFixed(1)} km`}</td>
                                            <td className="px-4 py-3 text-right">{etaMin == null ? '-' : `${etaMin} mnt`}</td>
                                            <td className="px-4 py-3">
                                                {rating ? (
                                                    <div className="flex items-center gap-2">
                                                        <Stars value={rating.avg} />
                                                        <span className="text-xs text-slate-500">
                                                            {rating.avg.toFixed(1)} ({rating.count})
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default CompareModal;
