import React, { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import type { CartItem, Product } from '../../../types';
import GlassCard from '../../../components/GlassCard';
import { useAddresses } from '../../addresses/useAddresses';
import { parseCoordinatesFromInput } from '../../../utils/location';
import { haversineKm } from '../../../utils/geo';
import { useSavedCarts } from '../../saved-carts/useSavedCarts';
import { computeCouponDiscount, useCouponValidator } from '../../coupons/useCoupons';

interface BuyerCartTabProps {
    products: Product[];
    cart: CartItem[];
    checkoutLoading: boolean;
    onRemoveFromCart: (id: string) => void;
    onUpdateQuantity: (id: string, quantity: number) => void;
    onClearCart: () => void;
    onAddToCart: (product: Product, quantity?: number) => void;
    onCheckout: (meta?: { shipping_address_id?: string | null; notes?: string | null; coupon_code?: string | null }) => void;
}

const BuyerCartTab: React.FC<BuyerCartTabProps> = ({
    products,
    cart,
    checkoutLoading,
    onRemoveFromCart,
    onUpdateQuantity,
    onClearCart,
    onAddToCart,
    onCheckout
}) => {
    const { rows: addresses, defaultAddress } = useAddresses();
    const saved = useSavedCarts();
    const couponValidator = useCouponValidator();
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

    useEffect(() => {
        if (defaultAddress?.id) setSelectedAddressId(defaultAddress.id);
    }, [defaultAddress?.id]);

    const effectivePrice = (item: CartItem) => {
        const discount = Number(item.discount_per_kg || 0);
        return Math.max(0, Number(item.price || 0) - Math.max(0, discount));
    };

    const subtotal = cart.reduce((sum, item) => sum + effectivePrice(item) * (item.quantity || 1), 0);

    const couponEligible = useMemo(() => {
        const code = String(appliedCoupon?.code || '').trim();
        if (!code) return { subtotal: 0, qty: 0, sellerId: null as string | null };
        const sellerId = appliedCoupon?.seller_id ? String(appliedCoupon.seller_id) : null;
        const lines = sellerId ? cart.filter(x => x.seller_id === sellerId) : cart;
        const sub = lines.reduce((sum, item) => sum + effectivePrice(item) * (item.quantity || 1), 0);
        const qty = lines.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        return { subtotal: sub, qty, sellerId };
    }, [appliedCoupon?.code, appliedCoupon?.seller_id, cart]);

    const couponDiscount = useMemo(() => {
        if (!appliedCoupon) return 0;
        return computeCouponDiscount({ coupon: appliedCoupon, subtotal: couponEligible.subtotal, totalQty: couponEligible.qty });
    }, [appliedCoupon, couponEligible.qty, couponEligible.subtotal]);

    const total = Math.max(0, subtotal - couponDiscount);

    const selectedAddress = useMemo(
        () => addresses.find(a => a.id === selectedAddressId) || defaultAddress || null,
        [addresses, defaultAddress, selectedAddressId]
    );

    const shippingEstimates = useMemo(() => {
        const addrCoords = selectedAddress?.location ? parseCoordinatesFromInput(selectedAddress.location) : null;
        if (!addrCoords) return [];
        const perSeller = new Map<string, { sellerId: string; to: string; km: number | null; cost: number | null }>();
        for (const item of cart) {
            if (!perSeller.has(item.seller_id)) {
                const toCoords = item.location ? parseCoordinatesFromInput(item.location) : null;
                const km = toCoords ? haversineKm(addrCoords, toCoords) : null;
                const cost = km != null ? Math.round(km * 3000) : null;
                perSeller.set(item.seller_id, { sellerId: item.seller_id, to: item.location || '-', km, cost });
            }
        }
        return [...perSeller.values()];
    }, [cart, selectedAddress?.location]);

    const saveCurrentCart = async () => {
        if (cart.length === 0) return;
        const name = prompt('Nama saved cart?', `Cart ${new Date().toLocaleDateString('id-ID')}`);
        if (!name) return;
        try {
            await saved.create(name, {
                lines: cart.map(x => ({ item_id: x.id, quantity: Number(x.quantity || 1) })),
                notes: notes.trim() || null,
                coupon_code: String(appliedCoupon?.code || couponInput).trim() || null
            });
            alert('Cart disimpan.');
        } catch (err: any) {
            alert(`Gagal simpan cart: ${err?.message || 'Terjadi kesalahan.'}`);
        }
    };

    const loadSavedCart = async (row: any) => {
        const payload = (row?.cart || {}) as any;
        const lines = Array.isArray(payload?.lines) ? payload.lines : Array.isArray(payload) ? payload : [];
        if (lines.length === 0) {
            alert('Saved cart kosong atau format tidak valid.');
            return;
        }
        if (!confirm('Ganti keranjang saat ini dengan saved cart ini?')) return;
        onClearCart();
        for (const l of lines) {
            const id = String(l.item_id || '').trim();
            const qty = Math.max(1, Math.floor(Number(l.quantity) || 1));
            const product = products.find(p => p.id === id);
            if (product) onAddToCart(product, qty);
        }
        setNotes(String(payload?.notes || ''));
        const code = String(payload?.coupon_code || '').trim();
        setCouponInput(code);
        setAppliedCoupon(null);
        if (code) {
            const res = await couponValidator.validate(code);
            if (res.coupon) setAppliedCoupon(res.coupon);
        }
        alert('Saved cart dimuat.');
    };

    const applyCoupon = async () => {
        const code = couponInput.trim();
        if (!code) {
            setAppliedCoupon(null);
            return;
        }
        const res = await couponValidator.validate(code);
        if (!res.coupon) {
            alert('Kupon tidak ditemukan / tidak aktif.');
            setAppliedCoupon(null);
            return;
        }
        setAppliedCoupon(res.coupon);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
            <h2 className="text-2xl font-black text-slate-900">Keranjang Belanja</h2>

            <div className="space-y-3">
                {saved.setupError && (
                    <div className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                        {saved.setupError}
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-sm font-black text-slate-900">Saved Cart</div>
                            <div className="text-xs text-slate-500">Save/load keranjang (multi item).</div>
                        </div>
                        <button
                            type="button"
                            disabled={cart.length === 0}
                            onClick={() => void saveCurrentCart()}
                            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-black hover:bg-slate-800 disabled:opacity-50 transition"
                        >
                            Save current
                        </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {saved.rows.length === 0 ? (
                            <div className="text-xs text-slate-400">Belum ada saved cart.</div>
                        ) : (
                            saved.rows.slice(0, 8).map(r => (
                                <div key={r.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white">
                                    <button
                                        type="button"
                                        onClick={() => void loadSavedCart(r)}
                                        className="text-xs font-black text-slate-700 hover:text-emerald-700 transition"
                                    >
                                        {r.is_default ? '[Default] ' : ''}
                                        {r.name}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!confirm('Hapus saved cart ini?')) return;
                                            void saved.remove(r.id).catch(err => alert(err?.message || 'Gagal hapus.'));
                                        }}
                                        className="text-slate-300 hover:text-rose-600 transition"
                                        aria-label="Hapus saved cart"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                {cart.map(item => (
                    <div
                        key={item.id}
                        className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm"
                    >
                        <img src={item.image_url} alt={item.commodity} className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-900">{item.commodity}</h4>
                            <div className="text-xs text-emerald-600 font-bold">
                                Rp {effectivePrice(item).toLocaleString('id-ID')} / kg
                                {Number(item.discount_per_kg || 0) > 0 && (
                                    <span className="ml-2 text-[10px] text-slate-400 font-normal line-through">
                                        Rp {Number(item.price || 0).toLocaleString('id-ID')}
                                    </span>
                                )}
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <button
                                    onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) - 1)}
                                    className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                                    title="Kurangi"
                                >
                                    <Minus size={14} />
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    max={Math.max(1, item.stock || 1)}
                                    value={item.quantity || 1}
                                    onChange={e => onUpdateQuantity(item.id, Number(e.target.value))}
                                    className="w-24 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-700"
                                />
                                <span className="text-xs text-slate-400">kg</span>
                                <button
                                    onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                                    className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                                    title="Tambah"
                                >
                                    <Plus size={14} />
                                </button>
                                <div className="ml-auto text-sm font-black text-slate-900">
                                    Rp {(effectivePrice(item) * (item.quantity || 1)).toLocaleString('id-ID')}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => onRemoveFromCart(item.id)} className="p-2 text-slate-300 hover:text-red-500">
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
                {cart.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <ShoppingCart size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold">Keranjang Anda kosong.</p>
                    </div>
                )}
            </div>
            {cart.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 font-bold">Subtotal</span>
                        <span className="text-slate-900 font-black">Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    {couponDiscount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400 font-bold">Diskon kupon</span>
                            <span className="text-emerald-700 font-black">- Rp {Math.round(couponDiscount).toLocaleString('id-ID')}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 font-bold">Total</span>
                        <span className="text-slate-900 font-black">Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                    <button
                        onClick={() => setCheckoutOpen(true)}
                        disabled={checkoutLoading}
                        className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-60"
                    >
                        {checkoutLoading ? 'MEMPROSES CHECKOUT...' : 'CHECKOUT SEKARANG'}
                    </button>
                </div>
            )}

            {checkoutOpen && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                    <button className="absolute inset-0 bg-black/40" onClick={() => !checkoutLoading && setCheckoutOpen(false)} aria-label="Close" />
                    <div className="relative w-full max-w-2xl">
                        <GlassCard className="bg-white hover:shadow-none">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Checkout</h3>
                                    <p className="text-sm text-slate-500">Pilih alamat + catatan pesanan.</p>
                                </div>
                                <button
                                    type="button"
                                    disabled={checkoutLoading}
                                    onClick={() => setCheckoutOpen(false)}
                                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                                    aria-label="Tutup"
                                >
                                    <X size={18} className="text-slate-500" />
                                </button>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-4">
                                {couponValidator.setupError && (
                                    <div className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                                        {couponValidator.setupError}
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400">Kupon (Opsional)</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={couponInput}
                                            onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                            placeholder="UMKM10"
                                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                                        />
                                        <button
                                            type="button"
                                            disabled={couponValidator.loading}
                                            onClick={() => void applyCoupon()}
                                            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-black hover:bg-slate-800 disabled:opacity-50 transition"
                                        >
                                            {couponValidator.loading ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                    {appliedCoupon && (
                                        <div className="text-xs text-emerald-700 font-bold">
                                            Applied: {String(appliedCoupon.code)} • Diskon{' '}
                                            {appliedCoupon.discount_type === 'percent'
                                                ? `${Number(appliedCoupon.amount || 0)}%`
                                                : `Rp ${Number(appliedCoupon.amount || 0).toLocaleString('id-ID')}/kg`}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400">Alamat Pengiriman</label>
                                    <select
                                        value={selectedAddressId || ''}
                                        onChange={e => setSelectedAddressId(e.target.value || null)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    >
                                        <option value="">Pilih alamat...</option>
                                        {addresses.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.is_default ? `[Default] ` : ''}{a.label} — {a.location}
                                            </option>
                                        ))}
                                    </select>
                                    {addresses.length === 0 && (
                                        <p className="text-[11px] text-rose-600 font-bold">Belum ada alamat. Tambah dulu di Settings.</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400">Catatan Pesanan</label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Contoh: tolong dibungkus rapih, jam pengiriman, dll."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-sm font-black text-slate-900">Estimasi Ongkir (kasar)</div>
                                    <div className="text-xs text-slate-500">Menggunakan jarak garis lurus (Haversine).</div>
                                    <div className="mt-3 space-y-2">
                                        {shippingEstimates.length === 0 ? (
                                            <div className="text-sm text-slate-400">Pilih alamat dengan koordinat valid untuk lihat estimasi.</div>
                                        ) : (
                                            shippingEstimates.map(x => (
                                                <div key={x.sellerId} className="flex items-center justify-between text-sm">
                                                    <div className="text-slate-600">
                                                        Seller {x.sellerId.slice(0, 8)}… → {x.to}
                                                    </div>
                                                    <div className="font-black text-slate-900">
                                                        {x.cost != null ? `Rp ${x.cost.toLocaleString('id-ID')}` : 'N/A'}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    disabled={checkoutLoading}
                                    onClick={() => setCheckoutOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-slate-300 transition disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    disabled={checkoutLoading || addresses.length === 0 || !selectedAddressId}
                                    onClick={() => {
                                        onCheckout({
                                            shipping_address_id: selectedAddressId,
                                            notes,
                                            coupon_code: String(appliedCoupon?.code || couponInput).trim() || null
                                        });
                                        setCheckoutOpen(false);
                                    }}
                                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 transition"
                                >
                                    {checkoutLoading ? 'Memproses...' : 'Konfirmasi Checkout'}
                                </button>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuyerCartTab;
