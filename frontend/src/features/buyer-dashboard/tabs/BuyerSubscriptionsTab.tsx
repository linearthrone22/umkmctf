import React, { useMemo, useState } from 'react';
import { Play, Plus, Repeat, Trash2 } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import type { Product, SubscriptionFrequency } from '../../../types';
import { useSubscriptions } from '../../subscriptions/useSubscriptions';
import { useAddresses } from '../../addresses/useAddresses';

interface BuyerSubscriptionsTabProps {
    products: Product[];
}

const BuyerSubscriptionsTab: React.FC<BuyerSubscriptionsTabProps> = ({ products }) => {
    const { rows, loading, setupError, create, update, remove, runNow } = useSubscriptions();
    const { rows: addresses, defaultAddress } = useAddresses();

    const productById = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

    const [itemId, setItemId] = useState('');
    const [quantity, setQuantity] = useState(50);
    const [frequency, setFrequency] = useState<SubscriptionFrequency>('weekly');
    const [shippingAddressId, setShippingAddressId] = useState<string | null>(defaultAddress?.id || null);
    const [notes, setNotes] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [saving, setSaving] = useState(false);
    const [runningId, setRunningId] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!itemId) {
            alert('Pilih produk dulu.');
            return;
        }
        setSaving(true);
        try {
            await create({
                item_id: itemId,
                quantity: Math.max(1, Math.floor(Number(quantity) || 1)),
                frequency,
                shipping_address_id: shippingAddressId ?? null,
                notes: notes.trim() || null,
                coupon_code: couponCode.trim() || null
            });
            setItemId('');
            setQuantity(50);
            setNotes('');
            setCouponCode('');
            alert('Subscription dibuat.');
        } catch (err: any) {
            alert(`Gagal membuat subscription: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleRunNow = async (id: string) => {
        setRunningId(id);
        try {
            await runNow(id);
            alert('Order dibuat dari subscription (status pending).');
        } catch (err: any) {
            alert(`Gagal run subscription: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setRunningId(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
            <GlassCard>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Repeat className="text-emerald-600" /> Subscription / Repeat Order
                        </h2>
                        <p className="text-sm text-slate-500">MVP: simpan jadwal + tombol “Run Now” (butuh SQL `29_subscriptions.sql`).</p>
                    </div>
                    <div className="text-xs text-slate-500">{loading ? 'Memuat...' : `Total: ${rows.length}`}</div>
                </div>
                {setupError && (
                    <div className="mt-4 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                        {setupError}
                    </div>
                )}
            </GlassCard>

            <GlassCard>
                <h3 className="text-lg font-black text-slate-900 mb-4">Buat Subscription</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Produk</label>
                        <select
                            value={itemId}
                            onChange={e => setItemId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                            <option value="">Pilih produk...</option>
                            {products
                                .filter(p => p.is_active !== false)
                                .slice(0, 200)
                                .map(p => {
                                    const variant = [p.variant_grade, p.variant_size, p.variant_packaging].filter(Boolean).join(' • ');
                                    return (
                                        <option key={p.id} value={p.id}>
                                            {p.commodity}
                                            {variant ? ` (${variant})` : ''} — Rp {Number(p.price || 0).toLocaleString('id-ID')}
                                        </option>
                                    );
                                })}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Quantity (kg)</label>
                        <input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={e => setQuantity(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Frekuensi</label>
                        <select
                            value={frequency}
                            onChange={e => setFrequency(e.target.value as SubscriptionFrequency)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                            <option value="weekly">Mingguan</option>
                            <option value="biweekly">2 Minggu</option>
                            <option value="monthly">Bulanan</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Alamat Pengiriman (Opsional)</label>
                        <select
                            value={shippingAddressId || ''}
                            onChange={e => setShippingAddressId(e.target.value || null)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                            <option value="">(Tidak dipilih)</option>
                            {addresses.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.is_default ? '[Default] ' : ''}
                                    {a.label} — {a.location}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Catatan (Opsional)</label>
                        <input
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Contoh: kirim pagi, bungkus rapih"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Kupon (Opsional)</label>
                        <input
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="UMKM10"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                        />
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-end">
                    <button
                        type="button"
                        disabled={saving || !itemId}
                        onClick={() => void handleCreate()}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 transition"
                    >
                        <Plus size={16} className="inline -mt-0.5 mr-1" />
                        Buat
                    </button>
                </div>
            </GlassCard>

            <GlassCard>
                <h3 className="text-lg font-black text-slate-900 mb-4">Subscription Anda</h3>
                {rows.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        Belum ada subscription.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rows.map(s => {
                            const p = productById.get(s.item_id);
                            const title = p ? p.commodity : s.item_id.slice(0, 8);
                            const variant = p ? [p.variant_grade, p.variant_size, p.variant_packaging].filter(Boolean).join(' • ') : '';
                            return (
                                <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div>
                                        <div className="font-black text-slate-900">
                                            {title} {variant ? <span className="text-xs text-slate-500 font-bold">({variant})</span> : null}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {Math.round(Number(s.quantity || 0))}kg • {s.frequency} • {s.is_active ? 'Active' : 'Paused'}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => void update(s.id, { is_active: !s.is_active }).catch(err => alert(err?.message || 'Gagal toggle.'))}
                                            className={`px-3 py-2 rounded-xl text-xs font-black border transition ${
                                                s.is_active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-700'
                                            }`}
                                        >
                                            {s.is_active ? 'Pause' : 'Resume'}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={runningId === s.id}
                                            onClick={() => void handleRunNow(s.id)}
                                            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 disabled:opacity-50 transition"
                                        >
                                            <Play size={14} className="inline -mt-0.5 mr-1" />
                                            {runningId === s.id ? 'Running...' : 'Run Now'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!confirm('Hapus subscription ini?')) return;
                                                void remove(s.id).catch(err => alert(err?.message || 'Gagal hapus.'));
                                            }}
                                            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 transition"
                                            aria-label="Hapus"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

export default BuyerSubscriptionsTab;

