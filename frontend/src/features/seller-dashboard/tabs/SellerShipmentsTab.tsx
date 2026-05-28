import React, { useMemo, useState } from 'react';
import { History, Map, Trash2 } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import type { Shipment } from '../../../types';

interface SellerShipmentsTabProps {
    shipments: Shipment[];
    onDeleteShipment: (id: string) => Promise<void>;
    onOpenInLogistics: (routeData: any) => void;
}

const extractSummary = (routeData: any) => {
    const batches = Array.isArray(routeData?.batches) ? routeData.batches : [];
    const first = batches[0];
    const seq = Array.isArray(first?.sequence) ? first.sequence : [];
    const title = seq.length > 0 ? seq.slice(0, 3).join(' → ') + (seq.length > 3 ? ' …' : '') : 'Rute';
    const km = Number(first?.est_distance_km) || 0;
    const mins = Number(first?.est_time_mins) || 0;
    const estCost = km > 0 ? Math.round(km * 3000) : 0;
    return { title, km, mins, batchesCount: batches.length, estCost };
};

const SellerShipmentsTab: React.FC<SellerShipmentsTabProps> = ({ shipments, onDeleteShipment, onOpenInLogistics }) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const items = useMemo(
        () =>
            [...shipments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        [shipments]
    );

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus riwayat pengiriman ini?')) return;
        setDeletingId(id);
        try {
            await onDeleteShipment(id);
            alert('Riwayat pengiriman dihapus.');
        } catch (err: any) {
            alert(`Gagal menghapus: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="lg:col-span-3 space-y-6">
            <GlassCard>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <History className="text-emerald-600" /> Riwayat Pengiriman
                        </h2>
                        <p className="text-sm text-slate-500">Detail rute + tombol “ulang rute”.</p>
                    </div>
                    <div className="text-xs text-slate-500">
                        Total: <span className="font-bold text-slate-900">{shipments.length}</span>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {items.length === 0 ? (
                        <div className="col-span-full py-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                            Belum ada riwayat pengiriman.
                        </div>
                    ) : (
                        items.map(sh => {
                            const summary = extractSummary(sh.route_data);
                            const metaFromRoute = (sh.route_data as any)?.meta || {};
                            const vehicle = (sh as any).vehicle_type || metaFromRoute?.vehicle_type || '-';
                            const costTotal =
                                Number((sh as any).shipping_cost_total) ||
                                Number(metaFromRoute?.shipping_cost?.total) ||
                                Number(metaFromRoute?.shipping_cost_total) ||
                                0;
                            const km =
                                Number((sh as any).route_distance_km) ||
                                Number(metaFromRoute?.route_distance_km) ||
                                summary.km ||
                                0;
                            const mins =
                                Number((sh as any).route_duration_mins) ||
                                Number(metaFromRoute?.route_duration_mins) ||
                                summary.mins ||
                                0;
                            return (
                                <div key={sh.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-xs text-slate-500">{new Date(sh.created_at).toLocaleString('id-ID')}</div>
                                            <div className="mt-1 font-black text-slate-900">{summary.title}</div>
                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                                                    {summary.batchesCount} batch
                                                </span>
                                                <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 font-bold">
                                                    Armada: {String(vehicle)}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 font-bold">
                                                    {km ? `${km} km` : '0 km'}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 font-bold">
                                                    {mins ? `${mins} mnt` : '0 mnt'}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold">
                                                    Ongkir: Rp {(costTotal || summary.estCost).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onOpenInLogistics(sh.route_data)}
                                                className="p-2 rounded-xl border border-slate-200 hover:border-emerald-200 hover:text-emerald-700 transition"
                                                aria-label="Ulang rute"
                                            >
                                                <Map size={18} />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={deletingId === sh.id}
                                                onClick={() => void handleDelete(sh.id)}
                                                className="p-2 rounded-xl border border-slate-200 hover:border-rose-200 hover:text-rose-700 transition disabled:opacity-50"
                                                aria-label="Hapus"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </GlassCard>
        </div>
    );
};

export default SellerShipmentsTab;
