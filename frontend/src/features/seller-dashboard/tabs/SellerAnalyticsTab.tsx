import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, RefreshCw, TrendingUp, Users } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { supabase } from '../../../supabase';
import { useAuth } from '../../../context/AuthContext';
import type { Order, Product } from '../../../types';

interface ProductEventRow {
    id: string;
    item_id: string;
    buyer_id: string | null;
    event_type: 'view' | 'click' | 'add_to_cart' | 'checkout';
    created_at: string;
}

const isMissingTableError = (err: any) => String(err?.code || '').toUpperCase() === '42P01';

interface SellerAnalyticsTabProps {
    orders: Order[];
    products: Product[];
}

const SellerAnalyticsTab: React.FC<SellerAnalyticsTabProps> = ({ orders, products }) => {
    const { user } = useAuth();
    const sellerId = user?.role === 'seller' ? user.id : null;

    const [events, setEvents] = useState<ProductEventRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [setupError, setSetupError] = useState<string | null>(null);

    const productById = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

    const refreshEvents = async () => {
        if (!sellerId) return;
        const itemIds = products.map(p => p.id);
        if (itemIds.length === 0) {
            setEvents([]);
            return;
        }
        setLoading(true);
        setSetupError(null);
        try {
            const since = new Date();
            since.setDate(since.getDate() - 30);
            const { data, error } = await supabase
                .from('product_events')
                .select('*')
                .in('item_id', itemIds.slice(0, 200)) // MVP: cap to avoid query limits
                .gte('created_at', since.toISOString())
                .order('created_at', { ascending: false });
            if (error) {
                if (isMissingTableError(error)) {
                    setSetupError('Tabel `product_events` belum ada. Jalankan SQL: `backend/supabase/sql/31_product_events.sql`.');
                } else {
                    console.error('Analytics events error:', error.message);
                }
                setEvents([]);
                return;
            }
            setEvents((data || []) as ProductEventRow[]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refreshEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sellerId, products.length]);

    const totals = useMemo(() => {
        const revenue = orders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
        const totalQty = orders.reduce((sum, o) => sum + Number(o.quantity || 0), 0);
        const buyersCount = new Set(orders.map(o => o.buyer_id)).size;
        const repeatBuyers = [...orders.reduce((m, o) => m.set(o.buyer_id, (m.get(o.buyer_id) || 0) + 1), new Map<string, number>()).entries()].filter(
            ([, count]) => count >= 2
        ).length;
        return { revenue, totalQty, buyersCount, repeatBuyers };
    }, [orders]);

    const topProducts = useMemo(() => {
        const byItem = new Map<string, { item_id: string; qty: number; revenue: number }>();
        for (const o of orders) {
            const key = o.item_id;
            const entry = byItem.get(key) || { item_id: key, qty: 0, revenue: 0 };
            entry.qty += Number(o.quantity || 0);
            entry.revenue += Number(o.total_price || 0);
            byItem.set(key, entry);
        }
        return [...byItem.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
    }, [orders]);

    const conversion = useMemo(() => {
        const viewsByItem = new Map<string, number>();
        for (const e of events) {
            if (e.event_type !== 'view') continue;
            viewsByItem.set(e.item_id, (viewsByItem.get(e.item_id) || 0) + 1);
        }
        const ordersByItem = new Map<string, number>();
        for (const o of orders) {
            ordersByItem.set(o.item_id, (ordersByItem.get(o.item_id) || 0) + 1);
        }
        const rows = products.map(p => {
            const views = viewsByItem.get(p.id) || 0;
            const ord = ordersByItem.get(p.id) || 0;
            const rate = views > 0 ? (ord / views) * 100 : null;
            return { item_id: p.id, views, orders: ord, rate };
        });
        return rows.sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1)).slice(0, 8);
    }, [events, orders, products]);

    return (
        <div className="lg:col-span-3 space-y-6 animate-slide-up">
            <GlassCard>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <BarChart3 className="text-emerald-600" /> Analytics
                        </h2>
                        <p className="text-sm text-slate-500">Ringkasan penjualan + repeat buyer + conversion sederhana (30 hari).</p>
                    </div>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => void refreshEvents()}
                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-slate-300 transition disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={`inline -mt-0.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {setupError && (
                    <div className="mt-4 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                        {setupError}
                    </div>
                )}

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-xs text-slate-500">Revenue</div>
                        <div className="mt-1 text-xl font-black text-slate-900">Rp {Math.round(totals.revenue).toLocaleString('id-ID')}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-xs text-slate-500">Total Qty</div>
                        <div className="mt-1 text-xl font-black text-slate-900">{Math.round(totals.totalQty).toLocaleString('id-ID')} kg</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Users size={14} /> Buyers
                        </div>
                        <div className="mt-1 text-xl font-black text-slate-900">{totals.buyersCount}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                            <TrendingUp size={14} /> Repeat Buyers
                        </div>
                        <div className="mt-1 text-xl font-black text-slate-900">{totals.repeatBuyers}</div>
                    </div>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard>
                    <h3 className="text-lg font-black text-slate-900 mb-4">Top Produk</h3>
                    <div className="overflow-auto rounded-2xl border border-slate-200 bg-white">
                        <table className="min-w-[560px] w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs">
                                <tr>
                                    <th className="text-left px-4 py-3">Produk</th>
                                    <th className="text-right px-4 py-3">Qty</th>
                                    <th className="text-right px-4 py-3">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-6 text-slate-400" colSpan={3}>
                                            Belum ada order.
                                        </td>
                                    </tr>
                                ) : (
                                    topProducts.map(x => {
                                        const p = productById.get(x.item_id);
                                        const title = p ? p.commodity : x.item_id.slice(0, 8);
                                        const variant = [p?.variant_grade, p?.variant_size, p?.variant_packaging].filter(Boolean).join(' • ');
                                        return (
                                            <tr key={x.item_id} className="border-t border-slate-100">
                                                <td className="px-4 py-3">
                                                    <div className="font-black text-slate-900">{title}</div>
                                                    {variant && <div className="text-xs text-slate-500">{variant}</div>}
                                                </td>
                                                <td className="px-4 py-3 text-right font-black text-slate-900">{Math.round(x.qty).toLocaleString('id-ID')} kg</td>
                                                <td className="px-4 py-3 text-right font-black text-emerald-700">Rp {Math.round(x.revenue).toLocaleString('id-ID')}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>

                <GlassCard>
                    <h3 className="text-lg font-black text-slate-900 mb-4">Conversion (View → Order)</h3>
                    <div className="text-xs text-slate-500 mb-3">MVP: butuh `product_events` aktif, dihitung 30 hari.</div>
                    <div className="overflow-auto rounded-2xl border border-slate-200 bg-white">
                        <table className="min-w-[560px] w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs">
                                <tr>
                                    <th className="text-left px-4 py-3">Produk</th>
                                    <th className="text-right px-4 py-3">Views</th>
                                    <th className="text-right px-4 py-3">Orders</th>
                                    <th className="text-right px-4 py-3">Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conversion.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-6 text-slate-400" colSpan={4}>
                                            Belum ada data.
                                        </td>
                                    </tr>
                                ) : (
                                    conversion.map(r => {
                                        const p = productById.get(r.item_id);
                                        const title = p ? p.commodity : r.item_id.slice(0, 8);
                                        return (
                                            <tr key={r.item_id} className="border-t border-slate-100">
                                                <td className="px-4 py-3 font-black text-slate-900">{title}</td>
                                                <td className="px-4 py-3 text-right">{r.views}</td>
                                                <td className="px-4 py-3 text-right">{r.orders}</td>
                                                <td className="px-4 py-3 text-right font-black text-slate-900">
                                                    {r.rate == null ? '-' : `${r.rate.toFixed(1)}%`}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default SellerAnalyticsTab;

