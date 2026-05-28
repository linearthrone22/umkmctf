import React, { useState } from 'react';
import { CheckCircle2, Clock, Map as MapIcon, Star, Trash2, Zap } from 'lucide-react';
import type { Order } from '../../../types';
import OrderTrackingModal from '../components/OrderTrackingModal';
import ReviewModal from '../../reviews/ReviewModal';
import { useBuyerReviews } from '../../reviews/useBuyerReviews';
import { useRefundRequests } from '../../refunds/useRefundRequests';
import RequestRefundModal from '../../refunds/components/RequestRefundModal';
import { supabase } from '../../../supabase';
import { useDisputes } from '../../disputes/useDisputes';
import CreateDisputeModal from '../../disputes/components/CreateDisputeModal';
import DisputeDetailModal from '../../disputes/components/DisputeDetailModal';

interface BuyerOrdersTabProps {
    buyerOrders: Order[];
    cancelLoadingId: string | null;
    deleteLoadingId: string | null;
    orderHistoryClearing: boolean;
    onCancelOrder: (id: string) => void;
    onDeleteOrder: (id: string) => void;
    onClearHistory: () => void;
}

const BuyerOrdersTab: React.FC<BuyerOrdersTabProps> = ({
    buyerOrders,
    cancelLoadingId,
    deleteLoadingId,
    orderHistoryClearing,
    onCancelOrder,
    onDeleteOrder,
    onClearHistory
}) => {
    const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
    const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
    const [refundOrder, setRefundOrder] = useState<Order | null>(null);
    const [refundSaving, setRefundSaving] = useState(false);
    const [disputeOrder, setDisputeOrder] = useState<Order | null>(null);
    const [disputeSaving, setDisputeSaving] = useState(false);
    const [disputeDetail, setDisputeDetail] = useState<any | null>(null);
    const { byOrderId } = useBuyerReviews();
    const { requests: refundRequests, refresh: refreshRefunds } = useRefundRequests();
    const { latestByOrderId: latestDisputeByOrderId, createDispute } = useDisputes();

    const latestRefundByOrderId = new Map<string, any>();
    for (const r of refundRequests) {
        if (!latestRefundByOrderId.has(r.order_id)) {
            latestRefundByOrderId.set(r.order_id, r);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900">Order Saya</h2>
                {buyerOrders.length > 0 && (
                    <button
                        onClick={onClearHistory}
                        disabled={orderHistoryClearing}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-600 disabled:opacity-50 flex items-center gap-1"
                    >
                        <Trash2 size={14} /> {orderHistoryClearing ? 'Menghapus...' : 'Hapus Riwayat'}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {buyerOrders.map(order => (
                    <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <span
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                        order.status === 'pending'
                                            ? 'bg-amber-100 text-amber-600'
                                            : order.status === 'shipped'
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : order.status === 'cancelled'
                                                    ? 'bg-rose-100 text-rose-600'
                                                    : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                    {order.status}
                                </span>
                                <h4 className="text-lg font-bold text-slate-900 mt-2">{order.commodity}</h4>
                                <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
                                <p className="text-[11px] text-slate-500 font-bold">Qty: {Math.round(Number(order.quantity || 1))}kg</p>
                                {(order.coupon_code || (order.discount_total != null && Number(order.discount_total) > 0)) && (
                                    <p className="text-[11px] text-emerald-700 font-black">
                                        Kupon: {order.coupon_code || '-'}
                                        {order.discount_total != null && Number(order.discount_total) > 0
                                            ? ` (-Rp ${Math.round(Number(order.discount_total)).toLocaleString('id-ID')})`
                                            : ''}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-start gap-3">
                                <p className="text-lg font-black text-emerald-600">Rp {order.total_price.toLocaleString('id-ID')}</p>
                                {order.status !== 'pending' && (
                                    <button
                                        onClick={() => onDeleteOrder(order.id)}
                                        disabled={deleteLoadingId === order.id}
                                        className="p-2 -mr-2 -mt-2 text-slate-300 hover:text-rose-500 disabled:opacity-50 transition-colors"
                                        title="Hapus dari riwayat"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Zap size={14} className="text-emerald-500" />
                                <span>Seller: {order.seller_name || 'Supplier'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setTrackingOrder(order)}
                                    className="text-[10px] font-black text-slate-500 hover:text-emerald-600 flex items-center gap-1"
                                    title="Tracking"
                                >
                                    <MapIcon size={14} /> Tracking
                                </button>

                                {(order.status === 'shipped' || order.status === 'delivered') && (
                                    (() => {
                                        const d = latestDisputeByOrderId.get(order.id);
                                        const status = d?.status ? String(d.status) : null;
                                        const blocked = status === 'open' || status === 'waiting_admin';
                                        return (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (d) setDisputeDetail(d);
                                                        else setDisputeOrder(order);
                                                    }}
                                                    className="text-[10px] font-black text-amber-700 hover:text-amber-800 disabled:opacity-60 flex items-center gap-1"
                                                    title={d ? 'Lihat detail komplain' : 'Ajukan komplain (dispute center)'}
                                                >
                                                    Komplain{status ? ` (${status})` : ''}
                                                </button>
                                                {d && !blocked && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDisputeOrder(order)}
                                                        className="text-[10px] font-black text-slate-500 hover:text-slate-700"
                                                        title="Buat komplain baru (opsional)"
                                                    >
                                                        Buat baru
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })()
                                )}

                                {(order.status === 'shipped' || order.status === 'delivered') && (
                                    (() => {
                                        const rr = latestRefundByOrderId.get(order.id);
                                        const status = rr?.status ? String(rr.status) : null;
                                        const disabled = status === 'requested' || status === 'approved';
                                        return (
                                            <button
                                                type="button"
                                                onClick={() => setRefundOrder(order)}
                                                disabled={disabled}
                                                className="text-[10px] font-black text-amber-700 hover:text-amber-800 disabled:opacity-60 flex items-center gap-1"
                                                title="Ajukan refund/retur"
                                            >
                                                Refund{status ? ` (${status})` : ''}
                                            </button>
                                        );
                                    })()
                                )}
                                {order.status === 'delivered' && !byOrderId.has(order.id) && (
                                    <button
                                        type="button"
                                        onClick={() => setReviewOrder(order)}
                                        className="text-[10px] font-black text-amber-600 hover:text-amber-700 flex items-center gap-1"
                                        title="Beri review"
                                    >
                                        <Star size={14} /> Review
                                    </button>
                                )}

                                {order.status === 'pending' && (
                                    <button
                                        onClick={() => onCancelOrder(order.id)}
                                        disabled={cancelLoadingId === order.id}
                                        className="text-[10px] font-bold text-red-400 hover:text-red-600 disabled:opacity-50"
                                    >
                                        {cancelLoadingId === order.id ? 'Membatalkan...' : 'Batalkan'}
                                    </button>
                                )}
                                {order.status === 'shipped' && (
                                    <div className="flex items-center gap-1 text-emerald-500 font-bold text-[10px]">
                                        <CheckCircle2 size={14} /> DIKIRIM
                                    </div>
                                )}
                                {order.status === 'delivered' && (
                                    <div className="flex items-center gap-1 text-sky-600 font-bold text-[10px]">
                                        <CheckCircle2 size={14} /> DITERIMA
                                    </div>
                                )}
                                {order.status === 'cancelled' && (
                                    <div className="flex items-center gap-1 text-rose-500 font-bold text-[10px]">DIBATALKAN</div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {buyerOrders.length === 0 && (
                    <div className="col-span-full text-center py-20">
                        <Clock size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold">Belum ada order.</p>
                    </div>
                )}
            </div>

            {trackingOrder && <OrderTrackingModal order={trackingOrder} onClose={() => setTrackingOrder(null)} />}
            {reviewOrder && <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} />}
            {refundOrder && (
                <RequestRefundModal
                    order={refundOrder}
                    saving={refundSaving}
                    onClose={() => setRefundOrder(null)}
                    onSubmit={async ({ reason }) => {
                        setRefundSaving(true);
                        try {
                            const { error } = await supabase.from('refund_requests').insert([{ order_id: refundOrder.id, reason }]);
                            if (error) throw error;
                            await refreshRefunds();
                            alert('Refund request terkirim. Seller akan meninjau.');
                            setRefundOrder(null);
                        } catch (err: any) {
                            alert(`Gagal ajukan refund: ${err?.message || 'Terjadi kesalahan.'}`);
                        } finally {
                            setRefundSaving(false);
                        }
                    }}
                />
            )}

            {disputeOrder && (
                <CreateDisputeModal
                    order={disputeOrder}
                    saving={disputeSaving}
                    onClose={() => setDisputeOrder(null)}
                    onSubmit={async ({ subject, message }) => {
                        setDisputeSaving(true);
                        try {
                            await createDispute({ orderId: disputeOrder.id, subject, message });
                            alert('Komplain terkirim. Seller akan merespon, lalu admin memutuskan.');
                            setDisputeOrder(null);
                        } catch (err: any) {
                            alert(`Gagal kirim komplain: ${err?.message || 'Terjadi kesalahan.'}`);
                        } finally {
                            setDisputeSaving(false);
                        }
                    }}
                />
            )}

            {disputeDetail && <DisputeDetailModal dispute={disputeDetail} onClose={() => setDisputeDetail(null)} />}
        </div>
    );
};

export default BuyerOrdersTab;
