import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Filter, Search, Truck, XCircle } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import type { Order } from '../../../types';
import ProofOfDeliveryModal from '../../logistics/components/ProofOfDeliveryModal';
import DisputeDetailModal from '../../disputes/components/DisputeDetailModal';
import { useDisputes } from '../../disputes/useDisputes';

type SortKey = 'newest' | 'oldest' | 'highest_total' | 'lowest_total';

interface SellerOrdersTabProps {
    orders: Order[];
    onUpdateStatus: (id: string, status: string) => Promise<void>;
    onMarkDelivered: (id: string, payload: { receiver_name: string; pod_photo_url: string; pod_signature_url: string }) => Promise<void>;
}

const STATUS_OPTIONS = ['pending', 'shipped', 'delivered', 'cancelled'] as const;

const formatCurrency = (value: number) => {
    try {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
    } catch {
        return `Rp ${value || 0}`;
    }
};

const SellerOrdersTab: React.FC<SellerOrdersTabProps> = ({ orders, onUpdateStatus, onMarkDelivered }) => {
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortKey, setSortKey] = useState<SortKey>('newest');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkStatus, setBulkStatus] = useState<string>('shipped');
    const [saving, setSaving] = useState(false);
    const [detailOrder, setDetailOrder] = useState<Order | null>(null);
    const [disputeDetail, setDisputeDetail] = useState<any | null>(null);
    const [podOrder, setPodOrder] = useState<Order | null>(null);
    const [podSaving, setPodSaving] = useState(false);
    const { latestByOrderId: latestDisputeByOrderId, respondDispute } = useDisputes();
    const [disputeDraft, setDisputeDraft] = useState('');
    const [disputeSaving, setDisputeSaving] = useState(false);

    const normalizedQuery = query.trim().toLowerCase();

    const filtered = useMemo(() => {
        let data = [...orders];
        if (statusFilter !== 'all') {
            data = data.filter(o => o.status === statusFilter);
        }
        if (normalizedQuery.length > 0) {
            data = data.filter(o => {
                const hay = `${o.commodity || ''} ${o.seller_name || ''} ${o.buyer_name || ''}`.toLowerCase();
                return hay.includes(normalizedQuery);
            });
        }
        data.sort((a, b) => {
            if (sortKey === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortKey === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sortKey === 'highest_total') return (b.total_price || 0) - (a.total_price || 0);
            return (a.total_price || 0) - (b.total_price || 0);
        });
        return data;
    }, [normalizedQuery, orders, sortKey, statusFilter]);

    const allIdsOnPage = useMemo(() => filtered.map(o => o.id), [filtered]);
    const isAllSelected = selectedIds.length > 0 && selectedIds.length === allIdsOnPage.length;

    const toggleAll = () => {
        setSelectedIds(prev => (prev.length === allIdsOnPage.length ? [] : allIdsOnPage));
    };

    const toggleOne = (id: string) => {
        setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    const runBulkUpdate = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Update ${selectedIds.length} order menjadi status "${bulkStatus}"?`)) return;
        setSaving(true);
        try {
            await Promise.all(selectedIds.map(id => onUpdateStatus(id, bulkStatus)));
            setSelectedIds([]);
            alert('Status order berhasil diupdate.');
        } catch (err: any) {
            alert(`Gagal bulk update: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="lg:col-span-3 space-y-6">
            <GlassCard>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Manajemen Pesanan</h2>
                        <p className="text-sm text-slate-500">Filter, sort, dan bulk update status order.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-500">
                            Total: <span className="font-bold text-slate-900">{orders.length}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-3">
                    <div className="lg:col-span-5 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Cari buyer / komoditas..."
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                    </div>
                    <div className="lg:col-span-3 relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none"
                        >
                            <option value="all">Semua status</option>
                            {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    </div>
                    <div className="lg:col-span-4 relative">
                        <select
                            value={sortKey}
                            onChange={e => setSortKey(e.target.value as SortKey)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none"
                        >
                            <option value="newest">Terbaru</option>
                            <option value="oldest">Terlama</option>
                            <option value="highest_total">Total terbesar</option>
                            <option value="lowest_total">Total terkecil</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleAll}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition"
                        >
                            {isAllSelected ? 'Unselect All' : 'Select All'}
                        </button>
                        <div className="text-xs text-slate-500">
                            Dipilih: <span className="font-bold text-slate-900">{selectedIds.length}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={bulkStatus}
                            onChange={e => setBulkStatus(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                            <option value="shipped">shipped</option>
                            <option value="delivered">delivered</option>
                            <option value="cancelled">cancelled</option>
                            <option value="pending">pending</option>
                        </select>
                        <button
                            type="button"
                            disabled={saving || selectedIds.length === 0}
                            onClick={() => void runBulkUpdate()}
                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {saving ? 'Menyimpan...' : 'Bulk Update'}
                        </button>
                    </div>
                </div>

                <div className="mt-6 overflow-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="min-w-[860px] w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="text-left px-4 py-3 w-10" />
                                <th className="text-left px-4 py-3">Komoditas</th>
                                <th className="text-left px-4 py-3">Buyer</th>
                                <th className="text-left px-4 py-3">Qty (kg)</th>
                                <th className="text-left px-4 py-3">Total</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-left px-4 py-3">Tanggal</th>
                                <th className="text-right px-4 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-slate-400">
                                        Tidak ada order yang cocok.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(order => (
                                    <tr key={order.id} className="border-t border-slate-100 hover:bg-emerald-50/30">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(order.id)}
                                                onChange={() => toggleOne(order.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-900">{order.commodity || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{order.buyer_name || order.buyer_id}</td>
                                        <td className="px-4 py-3 text-slate-600">{order.quantity}</td>
                                        <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(order.total_price)}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                    order.status === 'pending'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : order.status === 'shipped'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : order.status === 'delivered'
                                                                ? 'bg-sky-100 text-sky-700'
                                                                : 'bg-rose-100 text-rose-700'
                                                }`}
                                            >
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {new Date(order.created_at).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setDetailOrder(order)}
                                                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition"
                                                >
                                                    Detail
                                                </button>
                                                {order.status === 'pending' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void onUpdateStatus(order.id, 'shipped')}
                                                        className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition"
                                                    >
                                                        <Truck size={14} className="inline -mt-0.5 mr-1" />
                                                        Kirim
                                                    </button>
                                                )}
                                                {order.status === 'shipped' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPodOrder(order)}
                                                        className="px-3 py-2 rounded-xl bg-sky-600 text-white text-xs font-black hover:bg-sky-700 transition"
                                                    >
                                                        <CheckCircle2 size={14} className="inline -mt-0.5 mr-1" />
                                                        Delivered
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {detailOrder && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <button
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setDetailOrder(null)}
                        aria-label="Close modal"
                    />
                    <div className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Detail Order</h3>
                                <p className="text-xs text-slate-500 break-all">ID: {detailOrder.id}</p>
                            </div>
                            <button
                                onClick={() => setDetailOrder(null)}
                                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
                                aria-label="Close"
                                type="button"
                            >
                                <XCircle size={18} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="text-[11px] font-bold uppercase text-slate-400">Komoditas</div>
                                <div className="font-bold text-slate-900">{detailOrder.commodity || '-'}</div>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="text-[11px] font-bold uppercase text-slate-400">Buyer</div>
                                <div className="font-bold text-slate-900">{detailOrder.buyer_name || detailOrder.buyer_id}</div>
                                {detailOrder.buyer_location && <div className="text-xs text-slate-500">{detailOrder.buyer_location}</div>}
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="text-[11px] font-bold uppercase text-slate-400">Quantity</div>
                                <div className="font-bold text-slate-900">{detailOrder.quantity} kg</div>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="text-[11px] font-bold uppercase text-slate-400">Total</div>
                                <div className="font-black text-slate-900">{formatCurrency(detailOrder.total_price)}</div>
                            </div>
                        </div>

                        {(() => {
                            const d = latestDisputeByOrderId.get(detailOrder.id);
                            if (!d) return null;
                            const status = String(d.status || '');
                            const canRespond = status === 'open';
                            return (
                                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                    <div className="text-sm font-black text-amber-900">Dispute Center</div>
                                    <div className="text-[11px] text-amber-800 font-bold mt-1">Status: {status}</div>
                                    <div className="mt-3 text-xs text-slate-700">
                                        <div className="font-black text-slate-900">Keluhan buyer</div>
                                        <div className="mt-1 whitespace-pre-wrap">{(d as any).buyer_message}</div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="text-xs font-black text-slate-900">Respon seller</div>
                                        <textarea
                                            value={canRespond ? disputeDraft : String((d as any).seller_response || '')}
                                            onChange={e => setDisputeDraft(e.target.value)}
                                            disabled={!canRespond || disputeSaving}
                                            placeholder="Tulis respon/penjelasan untuk admin..."
                                            className="mt-2 w-full min-h-[110px] px-4 py-3 rounded-2xl border border-amber-200 bg-white text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-60"
                                        />
                                        {canRespond && (
                                            <button
                                                type="button"
                                                disabled={disputeSaving || disputeDraft.trim().length < 10}
                                                onClick={async () => {
                                                    setDisputeSaving(true);
                                                    try {
                                                        await respondDispute({ disputeId: d.id, response: disputeDraft.trim() });
                                                        setDisputeDraft('');
                                                        alert('Respon terkirim. Menunggu keputusan admin.');
                                                    } catch (err: any) {
                                                        alert(`Gagal kirim respon: ${err?.message || 'Terjadi kesalahan.'}`);
                                                    } finally {
                                                        setDisputeSaving(false);
                                                    }
                                                }}
                                                className="mt-3 w-full py-3 rounded-2xl bg-amber-700 text-white font-black hover:bg-amber-800 disabled:opacity-60 transition"
                                            >
                                                {disputeSaving ? 'Mengirim...' : 'Kirim Respon ke Admin'}
                                            </button>
                                        )}

                                        {(d as any).admin_decision && (
                                            <div className="mt-4 rounded-xl bg-white/70 border border-amber-200 p-3 text-xs text-slate-700">
                                                <div className="font-black text-slate-900">Keputusan Admin</div>
                                                <div className="mt-1 whitespace-pre-wrap">{(d as any).admin_decision}</div>
                                                {(d as any).admin_note && (
                                                    <div className="mt-2 text-[11px] text-slate-600 whitespace-pre-wrap">
                                                        Catatan: {(d as any).admin_note}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setDisputeDetail(d as any)}
                                            className="mt-4 w-full py-3 rounded-2xl border border-amber-200 bg-white text-amber-900 font-black hover:bg-amber-50 transition"
                                        >
                                            Lihat Dispute Detail
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {detailOrder.status === 'shipped' && (
                                <button
                                    type="button"
                                    onClick={() => setPodOrder(detailOrder)}
                                    className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-black hover:bg-sky-700 transition"
                                >
                                    <CheckCircle2 size={16} className="inline -mt-0.5 mr-1" />
                                    Delivered + POD
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => void onUpdateStatus(detailOrder.id, 'cancelled')}
                                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-black hover:bg-rose-700 transition"
                            >
                                <XCircle size={16} className="inline -mt-0.5 mr-1" />
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => setDetailOrder(null)}
                                className="ml-auto px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-slate-300 transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {podOrder && (
                <ProofOfDeliveryModal
                    order={podOrder}
                    saving={podSaving}
                    onClose={() => setPodOrder(null)}
                    onSubmit={async (payload) => {
                        setPodSaving(true);
                        try {
                            await onMarkDelivered(podOrder.id, payload);
                            setPodOrder(null);
                            setDetailOrder(null);
                            alert('Order berhasil ditandai DELIVERED + POD tersimpan.');
                        } catch (err: any) {
                            alert(`Gagal simpan POD: ${err?.message || 'Terjadi kesalahan.'}`);
                        } finally {
                            setPodSaving(false);
                        }
                    }}
                />
            )}

            {disputeDetail && <DisputeDetailModal dispute={disputeDetail} onClose={() => setDisputeDetail(null)} />}
        </div>
    );
};

export default SellerOrdersTab;
