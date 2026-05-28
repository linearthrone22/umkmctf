import React, { useMemo, useState } from 'react';
import { CheckCircle2, RefreshCcw, XCircle } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { supabase } from '../../../supabase';
import type { Order } from '../../../types';
import { useRefundRequests } from '../useRefundRequests';
import type { RefundRequest, RefundStatus } from '../types';

const formatIdr = (value: number) => {
    try {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
    } catch {
        return `Rp ${Math.round(value || 0)}`;
    }
};

const normalizeStatus = (s: any): RefundStatus => {
    const v = String(s || '').toLowerCase();
    if (v === 'approved') return 'approved';
    if (v === 'rejected') return 'rejected';
    if (v === 'refunded') return 'refunded';
    return 'requested';
};

interface RefundRequestsCardProps {
    orders: Order[];
}

const RefundRequestsCard: React.FC<RefundRequestsCardProps> = ({ orders }) => {
    const { requests, loading, error, refresh } = useRefundRequests();
    const [savingId, setSavingId] = useState<string | null>(null);

    const orderMap = useMemo(() => new Map(orders.map(o => [o.id, o])), [orders]);

    const items = useMemo(() => {
        return (requests || []).map(r => ({ ...r, status: normalizeStatus((r as any).status) })) as RefundRequest[];
    }, [requests]);

    const updateStatus = async (id: string, next: RefundStatus) => {
        setSavingId(id);
        try {
            const note = next === 'rejected' ? prompt('Catatan penolakan (opsional):') : next === 'approved' ? prompt('Catatan approval (opsional):') : null;
            const { data, error } = await supabase
                .from('refund_requests')
                .update({ status: next, seller_note: note ?? null })
                .eq('id', id)
                .select('id');

            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error('Refund request tidak ditemukan atau tidak bisa diubah (cek RLS policy UPDATE refund_requests).');
            }
            await refresh();
        } finally {
            setSavingId(null);
        }
    };

    return (
        <GlassCard>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <RefreshCcw className="text-amber-600" size={18} />
                        Refund / Retur
                    </h3>
                    <p className="text-xs text-slate-500">Flow approval seller (requested → approved/rejected → refunded).</p>
                </div>
                <button
                    type="button"
                    onClick={() => void refresh()}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:border-amber-200 hover:text-amber-700 transition"
                >
                    Refresh
                </button>
            </div>

            {error && <div className="mt-3 text-xs text-rose-600 font-bold">Error: {error}</div>}

            <div className="mt-5 overflow-auto rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-[980px] w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="text-left px-4 py-3">Order</th>
                            <th className="text-left px-4 py-3">Buyer</th>
                            <th className="text-left px-4 py-3">Amount</th>
                            <th className="text-left px-4 py-3">Status</th>
                            <th className="text-left px-4 py-3">Reason</th>
                            <th className="text-right px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                                    Memuat refund requests...
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                                    Belum ada refund request.
                                </td>
                            </tr>
                        ) : (
                            items.map(r => {
                                const o = orderMap.get(r.order_id);
                                return (
                                    <tr key={r.id} className="border-t border-slate-100 hover:bg-amber-50/30">
                                        <td className="px-4 py-3">
                                            <div className="font-black text-slate-900">{o?.commodity || 'Order'}</div>
                                            <div className="text-[11px] text-slate-400 break-all">{r.order_id}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{o?.buyer_name || r.buyer_id}</td>
                                        <td className="px-4 py-3 font-black text-slate-900">{formatIdr(Number(r.amount) || 0)}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black ${
                                                    r.status === 'approved'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : r.status === 'rejected'
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : r.status === 'refunded'
                                                                ? 'bg-sky-100 text-sky-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                }`}
                                            >
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 max-w-[420px]">
                                            <div className="line-clamp-2">{r.reason}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                {r.status === 'requested' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={savingId === r.id}
                                                            onClick={() => void updateStatus(r.id, 'approved')}
                                                            className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 disabled:opacity-60 transition"
                                                        >
                                                            <CheckCircle2 size={14} className="inline -mt-0.5 mr-1" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={savingId === r.id}
                                                            onClick={() => void updateStatus(r.id, 'rejected')}
                                                            className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 disabled:opacity-60 transition"
                                                        >
                                                            <XCircle size={14} className="inline -mt-0.5 mr-1" />
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {r.status === 'approved' && (
                                                    <button
                                                        type="button"
                                                        disabled={savingId === r.id}
                                                        onClick={() => void updateStatus(r.id, 'refunded')}
                                                        className="px-3 py-2 rounded-xl bg-sky-600 text-white text-xs font-black hover:bg-sky-700 disabled:opacity-60 transition"
                                                    >
                                                        Mark Refunded
                                                    </button>
                                                )}
                                                {(r.status === 'rejected' || r.status === 'refunded') && (
                                                    <span className="text-[11px] text-slate-400">No action</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
};

export default RefundRequestsCard;

