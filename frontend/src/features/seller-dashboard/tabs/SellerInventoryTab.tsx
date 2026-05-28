import React, { useMemo, useState } from 'react';
import { Settings, ShoppingBag, Trash2, MapPin, X } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import type { Product } from '../../../types';
import { useWarehouses } from '../../warehouses/useWarehouses';
import SellerCsvToolsCard from '../features/csv/SellerCsvToolsCard';

interface SellerInventoryTabProps {
    products: Product[];
    commodity: string;
    stock: number;
    location: string;
    imageUrl: string;
    onCommodityChange: (value: string) => void;
    onStockChange: (value: number) => void;
    onLocationChange: (value: string) => void;
    onImageUrlChange: (value: string) => void;
    onGeocode: () => void;
    onPublish: (overrides?: Partial<Product>) => Promise<void> | void;
    onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
    onDeleteProduct: (id: string) => Promise<void>;
}

const SellerInventoryTab: React.FC<SellerInventoryTabProps> = ({
    products,
    commodity,
    stock,
    location,
    imageUrl,
    onCommodityChange,
    onStockChange,
    onLocationChange,
    onImageUrlChange,
    onGeocode,
    onPublish,
    onUpdateProduct,
    onDeleteProduct
}) => {
    const { rows: warehouses, setupError: warehousesSetupError } = useWarehouses();
    const warehouseNameById = useMemo(() => new Map(warehouses.map(w => [w.id, w.name])), [warehouses]);
    const warehouseById = useMemo(() => new Map(warehouses.map(w => [w.id, w])), [warehouses]);

    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editStock, setEditStock] = useState<number>(0);
    const [editImageUrl, setEditImageUrl] = useState<string>('');
    const [editCommodity, setEditCommodity] = useState<string>('');
    const [editPrice, setEditPrice] = useState<number>(0);
    const [editLocation, setEditLocation] = useState<string>('');
    const [editCategory, setEditCategory] = useState<string>('');
    const [editDiscount, setEditDiscount] = useState<number>(0);
    const [editMinStock, setEditMinStock] = useState<number>(10);
    const [editSku, setEditSku] = useState<string>('');
    const [editVariantGrade, setEditVariantGrade] = useState<string>('');
    const [editVariantSize, setEditVariantSize] = useState<string>('');
    const [editVariantPackaging, setEditVariantPackaging] = useState<string>('');
    const [editWarehouseId, setEditWarehouseId] = useState<string>('');
    const [editSaving, setEditSaving] = useState(false);

    const [newSku, setNewSku] = useState('');
    const [newVariantGrade, setNewVariantGrade] = useState('');
    const [newVariantSize, setNewVariantSize] = useState('');
    const [newVariantPackaging, setNewVariantPackaging] = useState('');
    const [newWarehouseId, setNewWarehouseId] = useState<string>('');
    const [newPrice, setNewPrice] = useState<number | ''>('');

    const editImageUrlNormalized = useMemo(() => editImageUrl.trim(), [editImageUrl]);
    const isValidHttpUrl = (value: string) => {
        try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setEditStock(product.stock);
        setEditImageUrl(product.image_url || '');
        setEditCommodity(product.commodity || '');
        setEditPrice(Number(product.price) || 0);
        setEditLocation(product.location || '');
        setEditCategory(String(product.category || ''));
        setEditDiscount(Number(product.discount_per_kg || 0));
        setEditMinStock(Number(product.min_stock ?? 10));
        setEditSku(String((product as any).sku || ''));
        setEditVariantGrade(String((product as any).variant_grade || ''));
        setEditVariantSize(String((product as any).variant_size || ''));
        setEditVariantPackaging(String((product as any).variant_packaging || ''));
        setEditWarehouseId(String((product as any).warehouse_id || ''));
    };

    const closeEditModal = () => {
        setEditingProduct(null);
        setEditStock(0);
        setEditImageUrl('');
        setEditCommodity('');
        setEditPrice(0);
        setEditLocation('');
        setEditCategory('');
        setEditDiscount(0);
        setEditMinStock(10);
        setEditSku('');
        setEditVariantGrade('');
        setEditVariantSize('');
        setEditVariantPackaging('');
        setEditWarehouseId('');
    };

    const saveEdits = async () => {
        if (!editingProduct) return;

        const trimmed = editImageUrlNormalized;
        if (trimmed.length > 0 && !isValidHttpUrl(trimmed)) {
            alert('Link gambar tidak valid. Pastikan formatnya URL http/https.');
            return;
        }

        setEditSaving(true);
        try {
            await onUpdateProduct(editingProduct.id, {
                commodity: editCommodity.trim() || editingProduct.commodity,
                price: Number(editPrice) || 0,
                location: editLocation.trim() || editingProduct.location,
                category: editCategory.trim() || null,
                discount_per_kg: Number(editDiscount) || 0,
                min_stock: Number.isFinite(editMinStock) ? Math.max(0, Math.floor(editMinStock)) : 0,
                stock: Number(editStock) || 0,
                image_url: trimmed,
                sku: editSku.trim() || null,
                variant_grade: editVariantGrade.trim() || null,
                variant_size: editVariantSize.trim() || null,
                variant_packaging: editVariantPackaging.trim() || null,
                warehouse_id: editWarehouseId.trim() || null
            });
            alert('Produk berhasil diperbarui.');
            closeEditModal();
        } catch (err: any) {
            alert(`Gagal menyimpan perubahan: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setEditSaving(false);
        }
    };

    return (
        <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <GlassCard className="lg:col-span-1">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
                        <ShoppingBag className="text-emerald-500" /> Tambah Produk
                    </h3>
                    <form
                        className="space-y-4"
                        onSubmit={async e => {
                            e.preventDefault();
                            await onPublish({
                                sku: newSku.trim() || null,
                                variant_grade: newVariantGrade.trim() || null,
                                variant_size: newVariantSize.trim() || null,
                                variant_packaging: newVariantPackaging.trim() || null,
                                warehouse_id: newWarehouseId.trim() || null,
                                ...(newPrice === '' ? {} : { price: Number(newPrice) || 0 })
                            });
                            setNewSku('');
                            setNewVariantGrade('');
                            setNewVariantSize('');
                            setNewVariantPackaging('');
                            setNewWarehouseId('');
                            setNewPrice('');
                        }}
                    >
                        {warehousesSetupError && (
                            <div className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                                {warehousesSetupError}
                            </div>
                        )}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Komoditas</label>
                            <input
                                value={commodity}
                                onChange={e => onCommodityChange(e.target.value)}
                                className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400">SKU (Opsional)</label>
                                <input
                                    value={newSku}
                                    onChange={e => setNewSku(e.target.value)}
                                    placeholder="CABAI-MERAH-A"
                                    className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-mono"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400">Harga (Rp/kg)</label>
                                <input
                                    type="number"
                                    value={newPrice}
                                    onChange={e => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="Kosong = pakai rekomendasi AI"
                                    className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400">Grade/Kualitas</label>
                                <input
                                    value={newVariantGrade}
                                    onChange={e => setNewVariantGrade(e.target.value)}
                                    placeholder="A / B / Premium"
                                    className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400">Ukuran</label>
                                <input
                                    value={newVariantSize}
                                    onChange={e => setNewVariantSize(e.target.value)}
                                    placeholder="Besar/Sedang"
                                    className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400">Kemasan</label>
                                <input
                                    value={newVariantPackaging}
                                    onChange={e => setNewVariantPackaging(e.target.value)}
                                    placeholder="Karung/Box"
                                    className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Gudang (Opsional)</label>
                            <select
                                value={newWarehouseId}
                                onChange={e => {
                                    const next = e.target.value;
                                    setNewWarehouseId(next);
                                    const wh = next ? warehouseById.get(next) : null;
                                    if (wh?.location) onLocationChange(wh.location);
                                }}
                                className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                            >
                                <option value="">(Tidak dipilih)</option>
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>
                                        {w.is_default ? '[Default] ' : ''}
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-slate-400">Kalau dipilih, lokasi produk otomatis pakai lokasi gudang.</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Stok (kg)</label>
                            <input
                                type="number"
                                value={stock}
                                onChange={e => onStockChange(Number(e.target.value))}
                                className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Lokasi / Google Maps URL</label>
                            <div className="flex gap-2">
                                <input
                                    value={location}
                                    onChange={e => onLocationChange(e.target.value)}
                                    placeholder="Tempel URL Maps atau Ketik Alamat..."
                                    className="flex-1 bg-slate-50 border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={onGeocode}
                                    className="px-4 bg-emerald-500 text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-200"
                                >
                                    CARI
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Link Gambar Produk (URL)</label>
                            <input
                                value={imageUrl}
                                onChange={e => onImageUrlChange(e.target.value)}
                                placeholder="https://... (jpg/png/webp)"
                                className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-mono"
                            />
                            <p className="text-[10px] text-slate-400">
                                Pakai link langsung (http/https). Tidak upload file, jadi app tetap ringan.
                            </p>
                        </div>
                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                            >
                                Simpan & Publish
                            </button>
                        </div>
                    </form>
                </GlassCard>

                <GlassCard className="lg:col-span-2">
                    <SellerCsvToolsCard products={products} onUpdateProduct={onUpdateProduct} />
                    <h3 className="text-xl font-bold mb-6">Inventory Anda</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {products.map(product => (
                            <div
                                key={product.id}
                                className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                            >
                                <div className="h-24 relative">
                                    <img
                                        src={product.image_url}
                                        alt={product.commodity}
                                        className="w-full h-full object-cover"
                                        onError={e => {
                                            e.currentTarget.src =
                                                'data:image/svg+xml;charset=utf-8,' +
                                                encodeURIComponent(
                                                    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e2e8f0"/><stop offset="1" stop-color="#f8fafc"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="28">No Image</text></svg>`
                                                );
                                        }}
                                    />
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-600">
                                        {product.stock}kg
                                    </div>
                                    {Number(product.stock) <= Number(product.min_stock ?? 10) && (
                                        <div className="absolute top-2 left-2 bg-amber-500/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-black text-white">
                                            LOW
                                        </div>
                                    )}
                                    {product.is_active === false && (
                                        <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-black text-white">
                                            HIDDEN
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-slate-900 text-sm">{product.commodity}</h4>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditModal(product)}
                                                className="text-slate-300 hover:text-emerald-500 transition-colors"
                                                title="Edit Produk"
                                            >
                                                <Settings size={14} />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!confirm('Hapus produk?')) return;
                                                    await onDeleteProduct(product.id);
                                                }}
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                                title="Hapus Produk"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-bold mb-1">
                                        {(() => {
                                            const parts = [
                                                (product as any).variant_grade,
                                                (product as any).variant_size,
                                                (product as any).variant_packaging
                                            ]
                                                .map((x: any) => (typeof x === 'string' ? x.trim() : ''))
                                                .filter(Boolean);
                                            const label = parts.join(' • ');
                                            return label ? (
                                                <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-100">{label}</span>
                                            ) : null;
                                        })()}
                                        {(product as any).warehouse_id && (
                                            <span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                                                {warehouseNameById.get(String((product as any).warehouse_id)) || 'Gudang'}
                                            </span>
                                        )}
                                        {(product as any).sku && (
                                            <span className="px-2 py-1 rounded-full bg-white border border-slate-200 font-mono">
                                                {(product as any).sku}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-emerald-600 font-black text-sm">Rp {product.price.toLocaleString('id-ID')}</p>
                                    {Number(product.discount_per_kg || 0) > 0 && (
                                        <p className="text-[10px] font-bold text-rose-600 mt-0.5">
                                            Promo: -Rp {Number(product.discount_per_kg || 0).toLocaleString('id-ID')} / kg
                                        </p>
                                    )}
                                    <div className="mt-auto pt-2 text-[9px] text-slate-400 flex items-center gap-1">
                                        <MapPin size={9} /> {product.location?.split(',')[0] || 'Lokasi'}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {products.length === 0 && (
                            <div className="col-span-full py-12 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                                <ShoppingBag size={32} className="mb-2 opacity-20" />
                                <p className="text-xs font-bold">Belum ada produk.</p>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>

            {editingProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <button
                        className="absolute inset-0 bg-black/40"
                        onClick={() => {
                            if (editSaving) return;
                            closeEditModal();
                        }}
                        aria-label="Close modal"
                    />
                    <div className="relative w-full max-w-lg">
                        <GlassCard className="bg-white/90 hover:shadow-none">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Edit Produk</h3>
                                    <p className="text-xs text-slate-500">{editingProduct.commodity}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (editSaving) return;
                                        closeEditModal();
                                    }}
                                    disabled={editSaving}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                    aria-label="Close"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-slate-400">SKU</label>
                                        <input
                                            value={editSku}
                                            onChange={e => setEditSku(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-slate-400">Gudang</label>
                                        <select
                                            value={editWarehouseId}
                                            onChange={e => {
                                                const next = e.target.value;
                                                setEditWarehouseId(next);
                                                const wh = next ? warehouseById.get(next) : null;
                                                if (wh?.location) setEditLocation(wh.location);
                                            }}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                        >
                                            <option value="">(Tidak dipilih)</option>
                                            {warehouses.map(w => (
                                                <option key={w.id} value={w.id}>
                                                    {w.is_default ? '[Default] ' : ''}
                                                    {w.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-slate-400">Grade/Kualitas</label>
                                        <input
                                            value={editVariantGrade}
                                            onChange={e => setEditVariantGrade(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-slate-400">Ukuran</label>
                                        <input
                                            value={editVariantSize}
                                            onChange={e => setEditVariantSize(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-slate-400">Kemasan</label>
                                        <input
                                            value={editVariantPackaging}
                                            onChange={e => setEditVariantPackaging(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-slate-400">Komoditas</label>
                                        <input
                                            value={editCommodity}
                                            onChange={e => setEditCommodity(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-slate-400">Harga (Rp/kg)</label>
                                        <input
                                            type="number"
                                            value={editPrice}
                                            onChange={e => setEditPrice(Number(e.target.value))}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-[10px] font-bold uppercase text-slate-400">Lokasi (alamat/koordinat)</label>
                                        <input
                                            value={editLocation}
                                            onChange={e => setEditLocation(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-slate-400">Kategori</label>
                                        <input
                                            value={editCategory}
                                            onChange={e => setEditCategory(e.target.value)}
                                            placeholder="mis: sayuran"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-slate-400">Diskon (Rp/kg)</label>
                                        <input
                                            type="number"
                                            value={editDiscount}
                                            onChange={e => setEditDiscount(Number(e.target.value))}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-slate-400">Min Stok Alert (kg)</label>
                                        <input
                                            type="number"
                                            value={editMinStock}
                                            onChange={e => setEditMinStock(Number(e.target.value))}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-slate-400">Stok (kg)</label>
                                        <input
                                            type="number"
                                            value={editStock}
                                            onChange={e => setEditStock(Number(e.target.value))}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                        />
                                        <p className="text-[10px] text-slate-400">Jika stok 0, produk otomatis di-hide di marketplace.</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400">Link Gambar Produk (URL)</label>
                                    <input
                                        value={editImageUrl}
                                        onChange={e => setEditImageUrl(e.target.value)}
                                        placeholder="https://... (jpg/png/webp)"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-mono"
                                    />
                                    <p className="text-[10px] text-slate-400">Kosongkan kalau mau pakai placeholder.</p>
                                </div>

                                <div className="rounded-2xl overflow-hidden border border-slate-100 bg-white">
                                    <div className="text-[10px] font-bold text-slate-400 px-4 py-2 border-b border-slate-100">
                                        Preview
                                    </div>
                                    <div className="h-40 bg-slate-50">
                                        <img
                                            src={editImageUrlNormalized || editingProduct.image_url}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={e => {
                                                e.currentTarget.src =
                                                    'data:image/svg+xml;charset=utf-8,' +
                                                    encodeURIComponent(
                                                        `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e2e8f0"/><stop offset="1" stop-color="#f8fafc"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="28">No Image</text></svg>`
                                                    );
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        onClick={closeEditModal}
                                        disabled={editSaving}
                                        className="px-4 py-2 rounded-xl text-sm font-black text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={() => void saveEdits()}
                                        disabled={editSaving}
                                        className="px-5 py-2 rounded-xl text-sm font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-100 disabled:opacity-60"
                                    >
                                        {editSaving ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerInventoryTab;
