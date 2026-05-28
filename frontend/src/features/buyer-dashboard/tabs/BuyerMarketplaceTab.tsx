import React, { useEffect, useMemo, useState } from 'react';
import { Columns2, Heart, HeartOff, MapPin, Search, ShoppingCart, Sparkles, Zap } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import type { Product } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useWishlist } from '../../wishlist/useWishlist';
import { useReviewsSummary } from '../../reviews/useReviewsSummary';
import Stars from '../../reviews/Stars';
import CompareModal from '../../comparison/CompareModal';
import { recommendBestValue, recommendNearest, recommendSimilar } from '../../recommendations/recommendations';
import { trackProductEvent } from '../../analytics/productEvents';
import { useAvailabilityMap } from '../../availability/useSellerAvailability';
import { badgeForSellerState } from '../../availability/availabilityUtils';
import { useSellerVerificationMap } from '../../verification/useSellerVerificationMap';

interface BuyerMarketplaceTabProps {
    products: Product[];
    filteredProducts: Product[] | null;
    searchQuery: string;
    aiMatching: boolean;
    onSearchQueryChange: (value: string) => void;
    onAiMatch: () => void;
    buyerLocation?: string;
    onAddToCart: (product: Product, quantity?: number) => void;
}

const BuyerMarketplaceTab: React.FC<BuyerMarketplaceTabProps> = ({
    products,
    filteredProducts,
    searchQuery,
    aiMatching,
    onSearchQueryChange,
    onAiMatch,
    buyerLocation = '',
    onAddToCart
}) => {
    const { user } = useAuth();
    const { isWishlisted, toggle } = useWishlist();
    const [inStockOnly, setInStockOnly] = useState(true);
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [minRating, setMinRating] = useState<number | ''>('');
    const [keyword, setKeyword] = useState('');
    const [minPrice, setMinPrice] = useState<number | ''>('');
    const [maxPrice, setMaxPrice] = useState<number | ''>('');
    const [sortKey, setSortKey] = useState<'newest' | 'price_asc' | 'price_desc' | 'stock_desc'>('newest');
    const [qtyById, setQtyById] = useState<Record<string, number>>({});
    const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
    const [compareOpen, setCompareOpen] = useState(false);

    const base = filteredProducts || products;

    const listing = useMemo(() => {
        let data = [...base];
        if (inStockOnly) data = data.filter(p => (Number(p.stock) || 0) > 0);
        if (minPrice !== '') data = data.filter(p => (Number(p.price) || 0) >= Number(minPrice));
        if (maxPrice !== '') data = data.filter(p => (Number(p.price) || 0) <= Number(maxPrice));
        if (keyword.trim()) {
            const q = keyword.trim().toLowerCase();
            data = data.filter(p => {
                const blob = `${p.commodity || ''} ${p.umkm_name || ''} ${p.location || ''} ${p.category || ''}`.toLowerCase();
                return blob.includes(q);
            });
        }
        data.sort((a, b) => {
            if (sortKey === 'price_asc') return (a.price || 0) - (b.price || 0);
            if (sortKey === 'price_desc') return (b.price || 0) - (a.price || 0);
            if (sortKey === 'stock_desc') return (b.stock || 0) - (a.stock || 0);
            return 0;
        });
        return data;
    }, [base, inStockOnly, keyword, maxPrice, minPrice, sortKey]);

    const itemIdsForSummary = useMemo(() => listing.map(p => p.id), [listing]);
    const { summaryByItemId } = useReviewsSummary(itemIdsForSummary);

    const sellerIds = useMemo(() => listing.map(p => p.seller_id), [listing]);
    const { bySellerId } = useAvailabilityMap(sellerIds);
    const { bySellerId: verifiedBySellerId } = useSellerVerificationMap(sellerIds);

    const filteredListing = useMemo(() => {
        let data = listing;
        if (verifiedOnly) data = data.filter(p => !!verifiedBySellerId.get(p.seller_id));
        if (minRating !== '') {
            const min = Number(minRating);
            data = data.filter(p => {
                const s = summaryByItemId.get(p.id);
                if (!s) return false;
                return s.avg >= min;
            });
        }
        return data;
    }, [listing, minRating, summaryByItemId, verifiedBySellerId, verifiedOnly]);

    const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
    useEffect(() => {
        if (!user || user.role !== 'buyer') return;
        const buyerId = user.id;
        const top = listing.slice(0, 12);
        const unseen = top.filter(p => !viewedIds.has(p.id));
        if (unseen.length === 0) return;
        setViewedIds(prev => {
            const next = new Set(prev);
            unseen.forEach(p => next.add(p.id));
            return next;
        });
        unseen.forEach(p => {
            void trackProductEvent({ buyerId, itemId: p.id, eventType: 'view' });
        });
    }, [listing, user, viewedIds]);

    const bestValue = useMemo(() => recommendBestValue(filteredListing, 4), [filteredListing]);
    const nearest = useMemo(() => recommendNearest(filteredListing, buyerLocation, 4), [filteredListing, buyerLocation]);
    const seedSimilar = useMemo(() => {
        const wished = filteredListing.find(p => isWishlisted(p.id)) || filteredListing[0] || null;
        return wished;
    }, [filteredListing, isWishlisted]);
    const similar = useMemo(() => recommendSimilar(filteredListing, seedSimilar, 4), [filteredListing, seedSimilar]);

    const compareProducts = useMemo(() => listing.filter(p => compareIds.has(p.id)).slice(0, 4), [compareIds, listing]);

    const toggleCompare = (id: string) => {
        setCompareIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else {
                if (next.size >= 4) {
                    alert('Maksimal 4 produk untuk compare.');
                    return next;
                }
                next.add(id);
            }
            return next;
        });
    };

    const getQty = (product: Product) => {
        const raw = qtyById[product.id];
        const safe = Number.isFinite(raw) ? Math.floor(raw) : 1;
        const max = Math.max(1, Math.floor(Number(product.stock) || 1));
        return Math.min(Math.max(1, safe), max);
    };

    return (
        <div className="space-y-8 animate-slide-up">
            <CompareModal open={compareOpen} products={compareProducts} buyerLocation={buyerLocation} onClose={() => setCompareOpen(false)} />
            <GlassCard className="!bg-emerald-900 !text-white overflow-hidden p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 space-y-4">
                        <h2 className="text-2xl font-black flex items-center gap-3">
                            <Sparkles size={24} className="text-emerald-400" /> AI Smart Match
                        </h2>
                        <p className="text-emerald-100/70 text-sm">
                            Cari produk dengan bahasa alami. Biarkan AI kami menemukan supplier terbaik untuk Anda.
                        </p>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => onSearchQueryChange(e.target.value)}
                                placeholder="Contoh: Butuh cabai 50kg di Bogor..."
                                className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 pl-12 text-white placeholder:text-white/30 focus:bg-white/20 transition-all outline-none"
                            />
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                            <button
                                onClick={onAiMatch}
                                disabled={aiMatching}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2 rounded-xl text-sm font-black transition-all shadow-lg"
                            >
                                {aiMatching ? 'Matching...' : 'Match!'}
                            </button>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <Zap size={80} className="text-emerald-400 opacity-20 animate-pulse" />
                    </div>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <GlassCard className="p-5">
                    <div className="text-sm font-black text-slate-900">Best Value</div>
                    <div className="text-xs text-slate-500">Harga efektif termurah.</div>
                    <div className="mt-3 space-y-2">
                        {bestValue.length === 0 ? (
                            <div className="text-xs text-slate-400">-</div>
                        ) : (
                            bestValue.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => onAddToCart(p, getQty(p))}
                                    className="w-full text-left px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 transition"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="font-black text-slate-900 text-sm truncate">{p.commodity}</div>
                                        <div className="text-xs font-black text-emerald-700">
                                            Rp {Math.max(0, Number(p.price || 0) - Math.max(0, Number(p.discount_per_kg || 0))).toLocaleString('id-ID')}/kg
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-500">Stok: {Math.round(Number(p.stock || 0))}kg</div>
                                </button>
                            ))
                        )}
                    </div>
                </GlassCard>

                <GlassCard className="p-5">
                    <div className="text-sm font-black text-slate-900">Seller Terdekat</div>
                    <div className="text-xs text-slate-500">Butuh koordinat lokasi buyer.</div>
                    <div className="mt-3 space-y-2">
                        {nearest.length === 0 ? (
                            <div className="text-xs text-slate-400">Isi lokasi buyer di Settings untuk rekomendasi jarak.</div>
                        ) : (
                            nearest.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => onAddToCart(p, getQty(p))}
                                    className="w-full text-left px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 transition"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="font-black text-slate-900 text-sm truncate">{p.commodity}</div>
                                        <div className="text-xs font-black text-slate-700">Stok {Math.round(Number(p.stock || 0))}kg</div>
                                    </div>
                                    <div className="text-[10px] text-slate-500">Lokasi: {p.location.split(',')[0]}</div>
                                </button>
                            ))
                        )}
                    </div>
                </GlassCard>

                <GlassCard className="p-5">
                    <div className="text-sm font-black text-slate-900">Produk Mirip</div>
                    <div className="text-xs text-slate-500">Berdasar wishlist / listing.</div>
                    <div className="mt-3 space-y-2">
                        {similar.length === 0 ? (
                            <div className="text-xs text-slate-400">-</div>
                        ) : (
                            similar.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => onAddToCart(p, getQty(p))}
                                    className="w-full text-left px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 transition"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="font-black text-slate-900 text-sm truncate">{p.commodity}</div>
                                        <div className="text-xs font-black text-emerald-700">
                                            Rp {Math.max(0, Number(p.price || 0) - Math.max(0, Number(p.discount_per_kg || 0))).toLocaleString('id-ID')}/kg
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-500">Kategori: {p.category || '-'}</div>
                                </button>
                            ))
                        )}
                    </div>
                </GlassCard>
            </div>

            <GlassCard className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                            <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} />
                            In-stock saja
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                            <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} />
                            Verified saja
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Rating</span>
                            <select
                                value={minRating}
                                onChange={e => setMinRating(e.target.value === '' ? '' : Number(e.target.value))}
                                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                title="Minimum rating"
                            >
                                <option value="">All</option>
                                <option value="4">4.0+</option>
                                <option value="4.5">4.5+</option>
                                <option value="5">5.0</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Search size={16} className="text-slate-400" />
                            <input
                                value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                                placeholder="Cari komoditas/UMKM/lokasi…"
                                className="w-56 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Min</span>
                            <input
                                type="number"
                                value={minPrice}
                                onChange={e => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-28 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                            <span className="text-xs text-slate-500">Max</span>
                            <input
                                type="number"
                                value={maxPrice}
                                onChange={e => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-28 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Sort</span>
                        <select
                            value={sortKey}
                            onChange={e => setSortKey(e.target.value as any)}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                            <option value="newest">Default</option>
                            <option value="price_asc">Harga termurah</option>
                            <option value="price_desc">Harga termahal</option>
                            <option value="stock_desc">Stok terbanyak</option>
                        </select>
                        <div className="text-xs text-slate-500">
                            Hasil: <span className="font-black text-slate-900">{filteredListing.length}</span>
                        </div>
                        <button
                            type="button"
                            disabled={compareIds.size < 2}
                            onClick={() => setCompareOpen(true)}
                            className="ml-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-50 transition"
                            title="Pilih minimal 2 produk untuk compare"
                        >
                            <Columns2 size={16} className="inline -mt-0.5 mr-1" />
                            Compare ({compareIds.size})
                        </button>
                    </div>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredListing.map(product => (
                    <div
                        key={product.id}
                        className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col"
                    >
                        <div className="h-48 relative overflow-hidden">
                            <img
                                src={product.image_url}
                                alt={product.commodity}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <button
                                type="button"
                                onClick={() => void toggle(product.id)}
                                className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-sm hover:scale-105 transition"
                                title={isWishlisted(product.id) ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
                            >
                                {isWishlisted(product.id) ? (
                                    <HeartOff size={16} className="text-rose-600" />
                                ) : (
                                    <Heart size={16} className="text-slate-500" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleCompare(product.id)}
                                className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-full text-[10px] font-black shadow-sm transition ${
                                    compareIds.has(product.id)
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-white/90 backdrop-blur-md text-slate-700 hover:text-emerald-700'
                                }`}
                                title="Tambah ke compare"
                            >
                                {compareIds.has(product.id) ? 'Compared' : 'Compare'}
                            </button>
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-emerald-600 shadow-sm">
                                {product.stock}kg Stok
                            </div>
                            {verifiedBySellerId.get(product.seller_id) && (
                                <div className="absolute top-14 left-4 bg-emerald-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black shadow-sm">
                                    Verified
                                </div>
                            )}
                            {(() => {
                                const badge = badgeForSellerState({ availability: bySellerId.get(product.seller_id) || null });
                                if (badge.label === 'STATUS?' || badge.label === 'N/A') return null;
                                const tone =
                                    badge.tone === 'emerald'
                                        ? 'bg-emerald-600 text-white'
                                        : badge.tone === 'amber'
                                            ? 'bg-amber-500 text-white'
                                            : badge.tone === 'rose'
                                                ? 'bg-rose-500 text-white'
                                                : 'bg-slate-700 text-white';
                                return (
                                    <div className={`absolute top-14 right-4 px-3 py-1.5 rounded-full text-[10px] font-black shadow-sm ${tone}`}>
                                        {badge.label}
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="p-6 flex-1 flex flex-col space-y-4">
                            <div>
                                <div className="flex items-center justify-between gap-3 mb-1">
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                                        {product.umkm_name}
                                    </p>
                                    {verifiedBySellerId.get(product.seller_id) && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                                            VERIFIED
                                        </span>
                                    )}
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 leading-tight">{product.commodity}</h4>
                                {[product.variant_grade, product.variant_size, product.variant_packaging].filter(Boolean).length > 0 && (
                                    <div className="mt-1 text-[10px] text-slate-500 font-bold">
                                        {[product.variant_grade, product.variant_size, product.variant_packaging].filter(Boolean).join(' • ')}
                                    </div>
                                )}
                                {summaryByItemId.has(product.id) && (
                                    <div className="mt-1 flex items-center gap-2">
                                        <Stars value={summaryByItemId.get(product.id)!.avg} />
                                        <div className="text-xs text-slate-500">
                                            {summaryByItemId.get(product.id)!.avg.toFixed(1)} ({summaryByItemId.get(product.id)!.count})
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-2">
                                    <MapPin size={12} /> {product.location.split(',')[0]}
                                </div>
                            </div>
                            <div className="mt-auto pt-4 border-t border-slate-50 space-y-3">
                                <div className="flex items-end justify-between gap-3">
                                    <p className="text-xl font-black text-emerald-600 leading-none">
                                        Rp {Math.max(0, Number(product.price || 0) - Math.max(0, Number(product.discount_per_kg || 0))).toLocaleString('id-ID')}
                                        <span className="text-[10px] text-slate-400 font-normal">/kg</span>
                                    </p>
                                    {Number(product.discount_per_kg || 0) > 0 && (
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-rose-600">
                                                Hemat Rp {Number(product.discount_per_kg || 0).toLocaleString('id-ID')}/kg
                                            </div>
                                            <div className="text-[10px] text-slate-400 line-through">
                                                Rp {Number(product.price || 0).toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500 font-bold">Qty</span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={Math.max(1, Math.floor(Number(product.stock) || 1))}
                                            value={getQty(product)}
                                            onChange={e =>
                                                setQtyById(prev => ({
                                                    ...prev,
                                                    [product.id]: Number(e.target.value)
                                                }))
                                            }
                                            className="w-20 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        />
                                        <span className="text-xs text-slate-400">kg</span>
                                    </div>
                                </div>
                                {product.stock > 0 ? (
                                    <button
                                        onClick={() => onAddToCart(product, getQty(product))}
                                        className="w-full py-2.5 rounded-2xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 transition-all active:scale-[0.99]"
                                        title="Tambah ke keranjang"
                                    >
                                        <ShoppingCart size={18} className="inline -mt-0.5 mr-2" />
                                        Tambah ke keranjang
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full py-2.5 rounded-2xl bg-slate-100 text-slate-300 text-sm font-black cursor-not-allowed"
                                        title="Stok habis"
                                    >
                                        <ShoppingCart size={18} className="inline -mt-0.5 mr-2" />
                                        Stok habis
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BuyerMarketplaceTab;

