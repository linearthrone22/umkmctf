import React from 'react';
import { Play, ShoppingBag } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import ProgressStepper from '../../../components/ProgressStepper';

interface SellerHeroCardProps {
    commodity: string;
    stock: number;
    location: string;
    imageUrl: string;
    imageSearching: boolean;
    currentStep: number;
    loading: boolean;
    onCommodityChange: (value: string) => void;
    onStockChange: (value: number) => void;
    onLocationChange: (value: string) => void;
    onImageUrlChange: (value: string) => void;
    onGeocode: () => void;
    onAutoImage: () => void;
    onRunAgent: () => void;
    onPublish: () => void;
}

const SellerHeroCard: React.FC<SellerHeroCardProps> = ({
    commodity,
    stock,
    location,
    imageUrl,
    imageSearching,
    currentStep,
    loading,
    onCommodityChange,
    onStockChange,
    onLocationChange,
    onImageUrlChange,
    onGeocode,
    onAutoImage,
    onRunAgent,
    onPublish
}) => {
    const isValidHttpUrl = (value: string) => {
        try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    };

    const trimmedImageUrl = (imageUrl || '').trim();
    const hasCustomImage = trimmedImageUrl.length > 0;
    const canPreviewCustom = hasCustomImage && isValidHttpUrl(trimmedImageUrl);
    const fallbackPreview = `https://source.unsplash.com/800x600/?${encodeURIComponent(commodity || 'commodity')}`;
    const previewSrc = canPreviewCustom ? trimmedImageUrl : fallbackPreview;

    return (
        <GlassCard className="!bg-emerald-900 !text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10">
                <div className="flex flex-col lg:flex-row items-start gap-8">
                    <h2 className="text-2xl font-black mb-2">Automate Your Supply Chain</h2>
                    <p className="text-emerald-100/70 text-sm mb-6 max-w-md">
                        Input komoditas dan stok Anda, biar AI yang bekerja mencari harga terbaik, rute tercepat, dan pembeli potensial.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-9 min-w-0 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider font-bold text-emerald-300">Komoditas</label>
                                <input
                                    value={commodity}
                                    onChange={e => onCommodityChange(e.target.value)}
                                    className="w-full bg-white/10 border-white/20 rounded-lg px-3 py-2 text-sm focus:bg-white/20 focus:outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider font-bold text-emerald-300">Stok (kg)</label>
                                <input
                                    type="number"
                                    value={stock}
                                    onChange={e => onStockChange(Number(e.target.value))}
                                    className="w-full bg-white/10 border-white/20 rounded-lg px-3 py-2 text-sm focus:bg-white/20 focus:outline-none"
                                />
                            </div>
                            <div className="space-y-1 sm:col-span-2 min-w-0">
                                <label className="text-[10px] uppercase tracking-wider font-bold text-emerald-300">Lokasi / Google Maps URL</label>
                                <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                                    <input
                                        value={location}
                                        onChange={e => onLocationChange(e.target.value)}
                                        placeholder="Nama tempat atau URL Maps..."
                                        className="flex-1 min-w-0 bg-white/10 border-white/20 rounded-lg px-3 py-2 text-sm focus:bg-white/20 focus:outline-none placeholder:text-emerald-300/30"
                                    />
                                    <button
                                        onClick={onGeocode}
                                        className="shrink-0 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap"
                                    >
                                        CARI
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1 sm:col-span-2 min-w-0">
                                <label className="text-[10px] uppercase tracking-wider font-bold text-emerald-300">Link Gambar (URL)</label>
                                <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                                    <input
                                        value={imageUrl}
                                        onChange={e => onImageUrlChange(e.target.value)}
                                        placeholder="https://..."
                                        className="flex-1 min-w-0 bg-white/10 border-white/20 rounded-lg px-3 py-2 text-sm focus:bg-white/20 focus:outline-none placeholder:text-emerald-300/30 font-mono"
                                        title={trimmedImageUrl}
                                    />
                                    <button
                                        type="button"
                                        onClick={onAutoImage}
                                        disabled={imageSearching}
                                        className="shrink-0 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-[10px] font-bold transition-all disabled:opacity-60 whitespace-nowrap"
                                        title="Cari otomatis link gambar"
                                    >
                                        {imageSearching ? '...' : 'AUTO'}
                                    </button>
                                </div>
                                {hasCustomImage && !canPreviewCustom && (
                                    <p className="mt-1 text-[10px] text-amber-200/90 font-bold">
                                        URL tidak valid. Pakai format http/https (contoh: https://...).
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={onRunAgent}
                                disabled={loading}
                                className="px-8 py-3 bg-white text-emerald-900 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Play size={18} fill="currentColor" />
                                {loading ? 'AI AGENT RUNNING...' : 'ANALISIS DIRECTROUTE AI'}
                            </button>

                            {currentStep === 3 && (
                                <button
                                    onClick={onPublish}
                                    className="px-8 py-3 bg-emerald-400 text-emerald-950 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-emerald-300 transition-all active:scale-95 animate-pulse"
                                >
                                    <ShoppingBag size={18} />
                                    PUBLISH KE MARKETPLACE
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-4">
                        <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                            <div className="px-3 py-2 text-[10px] font-black text-emerald-100/80 border-b border-white/10 flex items-center justify-between gap-2">
                                <span>Preview</span>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={previewSrc}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] font-black text-white/80 hover:text-white transition"
                                        title="Buka gambar di tab baru"
                                    >
                                        Buka
                                    </a>
                                </div>
                            </div>
                            <div className="relative aspect-[4/3] bg-slate-950/20">
                                <img
                                    src={previewSrc}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={e => {
                                        e.currentTarget.src =
                                            'data:image/svg+xml;charset=utf-8,' +
                                            encodeURIComponent(
                                                `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#0f172a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="24">No Image</text></svg>`
                                            );
                                    }}
                                />
                                {imageSearching && (
                                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
                                        <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-[11px] font-black text-white flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Cari gambar...
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                            <ProgressStepper currentStep={currentStep} />
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};

export default SellerHeroCard;
