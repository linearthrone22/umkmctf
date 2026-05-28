import React, { useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Download, Filter, XCircle } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { supabase } from '../../../supabase';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import type { Order } from '../../../types';
import { downloadInvoicePdf } from '../utils/invoicePdf';
import PayoutSummaryCard from '../../payments/components/PayoutSummaryCard';
import RefundRequestsCard from '../../refunds/components/RefundRequestsCard';

type PaymentFilter = 'all' | 'paid' | 'unpaid';

const formatCurrency = (value: number) => {
    try {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
    } catch {
        return `Rp ${value || 0}`;
    }
};

const normalizePaymentStatus = (value: any): 'paid' | 'unpaid' => {
    if (value === 'paid') return 'paid';
    return 'unpaid';
};

interface SellerPaymentsTabProps {
    orders: Order[];
}

const SellerPaymentsTab: React.FC<SellerPaymentsTabProps> = ({ orders }) => {
    const { user } = useAuth();
    const { refreshData } = useApp();
    const [filter, setFilter] = useState<PaymentFilter>('all');
    const [savingId, setSavingId] = useState<string | null>(null);

    const computed = useMemo(() => {
        const withPayment = orders.map(o => ({
            ...o,
            payment_status: normalizePaymentStatus((o as any).payment_status)
        }));
        if (filter === 'all') return withPayment;
        return withPayment.filter(o => o.payment_status === filter);
    }, [filter, orders]);

    const updatePaymentStatus = async (orderId: string, next: 'paid' | 'unpaid') => {
        setSavingId(orderId);
        try {
            const { data, error } = await supabase
                .from('orders')
                .update({ payment_status: next })
                .eq('id', orderId)
                .select('id');

            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error('Order tidak ditemukan atau tidak bisa diubah (cek RLS policy UPDATE orders).');
            }

            await refreshData();
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="lg:col-span-3 space-y-6">
            <PayoutSummaryCard orders={orders} />
            <RefundRequestsCard orders={orders} />
            <GlassCard>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <CreditCard className="text-emerald-600" /> Konfirmasi Pembayaran
                        </h2>
                        <p className="text-sm text-slate-500">Status paid/unpaid + export invoice PDF.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value as PaymentFilter)}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                            <option value="all">Semua</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 overflow-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="min-w-[1060px] w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="text-left px-4 py-3">Invoice</th>
                                <th className="text-left px-4 py-3">Komoditas</th>
                                <th className="text-left px-4 py-3">Buyer</th>
                                <th className="text-left px-4 py-3">Total</th>
                                <th className="text-left px-4 py-3">Payment</th>
                                <th className="text-left px-4 py-3">Escrow</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-right px-4 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {computed.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-slate-400">
                                        Belum ada order.
                                    </td>
                                </tr>
                            ) : (
                                computed.map(order => (
                                    <tr key={order.id} className="border-t border-slate-100 hover:bg-emerald-50/30">
                                        <td className="px-4 py-3 text-slate-600 font-bold">
                                            {(order as any).invoice_no || '-'}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-900">{order.commodity || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{order.buyer_name || order.buyer_id}</td>
                                        <td className="px-4 py-3 font-black text-slate-900">{formatCurrency(order.total_price)}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                    order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                }`}
                                            >
                                                {order.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
                                                {String((order as any).escrow_status || 'none')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{order.status}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => downloadInvoicePdf(order, user)}
                                                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition"
                                                >
                                                    <Download size={14} className="inline -mt-0.5 mr-1" />
                                                    Invoice
                                                </button>
                                                {order.payment_status === 'paid' ? (
                                                    <button
                                                        type="button"
                                                        disabled={savingId === order.id}
                                                        onClick={() => void updatePaymentStatus(order.id, 'unpaid')}
                                                        className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 disabled:opacity-50 transition"
                                                    >
                                                        <XCircle size={14} className="inline -mt-0.5 mr-1" />
                                                        Unpaid
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={savingId === order.id}
                                                        onClick={() => void updatePaymentStatus(order.id, 'paid')}
                                                        className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 disabled:opacity-50 transition"
                                                    >
                                                        <CheckCircle2 size={14} className="inline -mt-0.5 mr-1" />
                                                        Paid
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
        </div>
    );
};

export default SellerPaymentsTab;
