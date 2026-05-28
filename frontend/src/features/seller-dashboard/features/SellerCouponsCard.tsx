import React, { useMemo, useState } from 'react';
import { BadgePercent, Plus, Trash2 } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { useSellerCoupons } from '../../coupons/useCoupons';
import type { CouponDiscountType } from '../../../types';

const SellerCouponsCard: React.FC = () => {
    const { rows, loading, setupError, create, update, remove } = useSellerCoupons();

    const [code, setCode] = useState('');
    const [type, setType] = useState<CouponDiscountType>('fixed_per_kg');
    const [amount, setAmount] = useState<number>(1000);
    const [minQty, setMinQty] = useState<number>(0);
    const [saving, setSaving] = useState(false);

    const createDisabled = useMemo(() => !code.trim() || !Number.isFinite(amount) || amount <= 0, [amount, code]);

    const handleCreate = async () => {
        if (createDisabled) return;
        setSaving(true);
        try {
            await create({ code, discount_type: type, amount, min_qty: minQty });
            setCode('');
        } catch (err: any) {
            alert(`Gagal membuat kupon: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <GlassCard>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <BadgePercent size={18} className="text-emerald-600" /> Kupon / Voucher
                    </h3>
                    <p className="text-sm text-slate-500">Buat promo per kg atau persen (buyer input kode saat checkout).</p>
                </div>
                <div className="text-xs text-slate-500">{loading ? 'Memuat...' : `Total: ${rows.length}`}</div>
            </div>

            {setupError && (
                <div className="mt-4 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    {setupError}
                </div>
            )}

            <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Kode</label>
                    <input
                        value={code}
                        onChange={e => setCode(e.target.value.toUpperCase())}
                        placeholder="UMKM10"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                    />
                </div>
                <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Tipe</label>
                    <select
                        value={type}
                        onChange={e => setType(e.target.value as CouponDiscountType)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                        <option value="fixed_per_kg">Potong Rp / kg</option>
                        <option value="percent">Diskon %</option>
                    </select>
                </div>
                <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Nilai</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>
                <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Min Qty (kg)</label>
                    <input
                        type="number"
                        value={minQty}
                        onChange={e => setMinQty(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>
                <div className="md:col-span-4 flex items-center justify-end">
                    <button
                        type="button"
                        disabled={saving || createDisabled}
                        onClick={() => void handleCreate()}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 transition"
                    >
                        <Plus size={16} className="inline -mt-0.5 mr-1" />
                        Buat Kupon
                    </button>
                </div>
            </div>

            <div className="mt-6 space-y-2">
                {rows.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        Belum ada kupon.
                    </div>
                ) : (
                    rows.map(c => (
                        <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <div className="font-black text-slate-900 font-mono">{c.code}</div>
                                <div className="text-xs text-slate-500">
                                    {c.discount_type === 'percent'
                                        ? `Diskon ${Number(c.amount || 0)}%`
                                        : `Potong Rp ${Number(c.amount || 0).toLocaleString('id-ID')} / kg`}
                                    {Number(c.min_qty || 0) > 0 ? ` • Min ${Number(c.min_qty || 0)}kg` : ''}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => void update(c.id, { is_active: !c.is_active }).catch(err => alert(err?.message || 'Gagal toggle kupon.'))}
                                    className={`px-3 py-2 rounded-xl text-xs font-black border transition ${
                                        c.is_active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                                    }`}
                                >
                                    {c.is_active ? 'Aktif' : 'Nonaktif'}
                                </button>
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => {
                                        if (!confirm('Hapus kupon ini?')) return;
                                        void remove(c.id).catch(err => alert(err?.message || 'Gagal hapus kupon.'));
                                    }}
                                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 transition disabled:opacity-50"
                                    aria-label="Hapus"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </GlassCard>
    );
};

export default SellerCouponsCard;

