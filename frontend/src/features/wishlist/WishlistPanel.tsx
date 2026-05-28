import React, { useMemo, useState } from 'react';
import { HeartOff, ShoppingCart, Trash2 } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { useApp } from '../../context/AppContext';
import { useWishlist } from './useWishlist';

const WishlistPanel: React.FC = () => {
    const { products, addToCart } = useApp();
    const { rows, loading, remove } = useWishlist();
    const [removingId, setRemovingId] = useState<string | null>(null);

    const productById = useMemo(() => {
        const map = new Map<string, any>();
        for (const p of products) map.set(p.id, p);
        return map;
    }, [products]);

    const items = useMemo(() => {
        return rows
            .map(r => ({ wishlist: r, product: productById.get(r.item_id) }))
            .filter(x => !!x.product);
    }, [productById, rows]);

    const handleRemove = async (itemId: string) => {
        setRemovingId(itemId);
        try {
            await remove(itemId);
        } catch (err: any) {
            alert(`Gagal menghapus wishlist: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <GlassCard>
            {loading ? (
                <div className="py-12 text-center text-slate-400">Memuat wishlist...</div>
            ) : items.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 mb-3">
                        <HeartOff />
                    </div>
                    <div className="font-bold text-slate-700">Wishlist masih kosong</div>
                    <div className="text-sm">Tap ikon hati di Marketplace untuk menyimpan produk.</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map(({ wishlist, product }) => (
                        <div key={wishlist.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                            <div className="h-36 bg-slate-100">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.commodity} className="w-full h-full object-cover" />
                                ) : null}
                            </div>
                            <div className="p-4">
                                <div className="font-black text-slate-900">{product.commodity}</div>
                                <div className="text-sm text-emerald-700 font-bold">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.price || 0)}
                                    <span className="text-slate-400 font-normal"> / kg</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">{product.umkm_name}</div>

                                <div className="mt-4 flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            addToCart(product);
                                            alert('Produk ditambahkan ke keranjang.');
                                        }}
                                        className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition"
                                    >
                                        <ShoppingCart size={14} className="inline -mt-0.5 mr-1" />
                                        Repeat order
                                    </button>
                                    <button
                                        type="button"
                                        disabled={removingId === product.id}
                                        onClick={() => void handleRemove(product.id)}
                                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-600 hover:border-rose-200 hover:text-rose-700 transition disabled:opacity-50"
                                    >
                                        <Trash2 size={14} className="inline -mt-0.5 mr-1" />
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </GlassCard>
    );
};

export default WishlistPanel;

