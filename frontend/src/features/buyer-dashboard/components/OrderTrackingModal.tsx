import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { MapContainer, Polyline, TileLayer, CircleMarker } from 'react-leaflet';
import type { Order } from '../../../types';
import { parseCoordinatesFromInput } from '../../../utils/location';
import { haversineKm } from '../../../utils/geo';

interface OrderTrackingModalProps {
    order: Order;
    onClose: () => void;
}

const getStepState = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s === 'cancelled') return { active: 'cancelled' as const };
    if (s === 'delivered') return { active: 'delivered' as const };
    if (s === 'shipped') return { active: 'shipped' as const };
    return { active: 'pending' as const };
};

const badgeClass = (active: boolean) =>
    `w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
        active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
    }`;

const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ order, onClose }) => {
    const step = getStepState(order.status);
    const sellerCoords = useMemo(() => (order.seller_location ? parseCoordinatesFromInput(order.seller_location) : null), [order.seller_location]);
    const buyerCoords = useMemo(() => (order.buyer_location ? parseCoordinatesFromInput(order.buyer_location) : null), [order.buyer_location]);

    const distanceKm = useMemo(() => {
        if (!sellerCoords || !buyerCoords) return null;
        return haversineKm(sellerCoords, buyerCoords);
    }, [buyerCoords, sellerCoords]);

    const etaText = useMemo(() => {
        if (step.active === 'cancelled') return 'Pesanan dibatalkan.';
        if (step.active === 'delivered') return 'Pesanan sudah diterima.';
        if (step.active === 'pending') return 'Menunggu diproses seller.';
        if (distanceKm == null) return 'Dalam perjalanan (ETA belum tersedia).';
        const mins = Math.max(10, Math.round(distanceKm * 6)); // rough: 10 min per ~1.6 km
        return `Estimasi tiba: ~${mins} menit`;
    }, [distanceKm, step.active]);

    const mapCenter = useMemo(() => {
        if (sellerCoords && buyerCoords) {
            return { lat: (sellerCoords.lat + buyerCoords.lat) / 2, lng: (sellerCoords.lng + buyerCoords.lng) / 2 };
        }
        return sellerCoords || buyerCoords || { lat: -6.2, lng: 106.8 };
    }, [buyerCoords, sellerCoords]);

    const hasMap = !!(sellerCoords && buyerCoords);

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
            <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
                    <div>
                        <div className="text-xs text-slate-500">Tracking Order</div>
                        <div className="text-lg font-black text-slate-900">{order.commodity || 'Produk'}</div>
                        <div className="text-xs text-slate-400 break-all">ID: {order.id}</div>
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

                <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-5 space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-black text-slate-900 mb-2">Timeline</div>
                            {step.active === 'cancelled' ? (
                                <div className="text-sm text-rose-600 font-bold">Status: CANCELLED</div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className={badgeClass(true)}>1</div>
                                        <div>
                                            <div className="font-bold text-slate-900">Pending</div>
                                            <div className="text-xs text-slate-500">Order dibuat.</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={badgeClass(step.active === 'shipped' || step.active === 'delivered')}>2</div>
                                        <div>
                                            <div className="font-bold text-slate-900">Shipped</div>
                                            <div className="text-xs text-slate-500">Dalam pengiriman.</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={badgeClass(step.active === 'delivered')}>3</div>
                                        <div>
                                            <div className="font-bold text-slate-900">Delivered</div>
                                            <div className="text-xs text-slate-500">Pesanan diterima.</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-sm font-black text-slate-900">ETA</div>
                            <div className="text-sm text-slate-600 mt-1">{etaText}</div>
                            {distanceKm != null && (
                                <div className="text-xs text-slate-500 mt-1">Jarak perkiraan: {distanceKm.toFixed(1)} km</div>
                            )}
                            {(order as any).vehicle_type && (
                                <div className="text-xs text-slate-500 mt-1">Armada: {(order as any).vehicle_type}</div>
                            )}
                            {(order as any).shipping_cost_total != null && (
                                <div className="text-xs text-slate-500 mt-1">
                                    Ongkir: Rp {Math.round(Number((order as any).shipping_cost_total) || 0).toLocaleString('id-ID')}
                                </div>
                            )}
                        </div>

                        {step.active === 'delivered' && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="text-sm font-black text-slate-900">Proof of Delivery</div>
                                <div className="text-sm text-slate-600 mt-1">
                                    Penerima: {(order as any).receiver_name || '-'}
                                </div>
                                {(order as any).delivered_at && (
                                    <div className="text-xs text-slate-500 mt-1">
                                        Diterima: {new Date((order as any).delivered_at).toLocaleString('id-ID')}
                                    </div>
                                )}
                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                    {(order as any).pod_photo_url ? (
                                        <a
                                            href={(order as any).pod_photo_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 hover:bg-emerald-100"
                                        >
                                            Lihat Foto
                                        </a>
                                    ) : (
                                        <span className="px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 font-bold border border-slate-100">
                                            Foto: -
                                        </span>
                                    )}
                                    {(order as any).pod_signature_url ? (
                                        <a
                                            href={(order as any).pod_signature_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-100 hover:bg-sky-100"
                                        >
                                            Lihat TTD
                                        </a>
                                    ) : (
                                        <span className="px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 font-bold border border-slate-100">
                                            TTD: -
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-black text-slate-900">Kontak</div>
                            <div className="text-sm text-slate-600 mt-1">Seller: {order.seller_name || order.seller_id}</div>
                            <div className="text-xs text-slate-500 mt-1">Buka tab Chat untuk konfirmasi / nego.</div>
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                            <div className="px-4 py-3 border-b border-slate-100">
                                <div className="text-sm font-black text-slate-900">Map</div>
                                <div className="text-xs text-slate-500">
                                    {hasMap ? 'Rute garis lurus (estimasi).' : 'Koordinat seller/buyer belum valid.'}
                                </div>
                            </div>
                            <div className="h-[320px]">
                                <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={hasMap ? 11 : 5} className="h-full w-full">
                                    <TileLayer
                                        attribution="&copy; OpenStreetMap contributors"
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    {sellerCoords && (
                                        <CircleMarker center={[sellerCoords.lat, sellerCoords.lng]} radius={8} pathOptions={{ color: '#10b981', fillColor: '#10b981' }} />
                                    )}
                                    {buyerCoords && (
                                        <CircleMarker center={[buyerCoords.lat, buyerCoords.lng]} radius={8} pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9' }} />
                                    )}
                                    {hasMap && (
                                        <Polyline
                                            positions={[
                                                [sellerCoords!.lat, sellerCoords!.lng],
                                                [buyerCoords!.lat, buyerCoords!.lng]
                                            ]}
                                            pathOptions={{ color: '#64748b' }}
                                        />
                                    )}
                                </MapContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTrackingModal;
