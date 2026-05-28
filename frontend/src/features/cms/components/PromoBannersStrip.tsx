import React, { useMemo } from 'react';
import { ExternalLink, Megaphone } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { usePromoBanners } from '../hooks/usePromoBanners';

const PromoBannersStrip: React.FC = () => {
    const { banners } = usePromoBanners();

    const active = useMemo(() => (banners || []).filter(b => !!b.is_active).slice(0, 6), [banners]);
    if (active.length === 0) return null;

    return (
        <GlassCard className="p-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Megaphone size={18} className="text-emerald-600" />
                    <div className="text-sm font-black text-slate-900">Promo</div>
                </div>
                <div className="text-[11px] text-slate-400">Update dari admin</div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {active.map(b => {
                    const clickable = !!(b.link_url && String(b.link_url).trim().length > 0);
                    return (
                        <a
                            key={b.id}
                            href={clickable ? String(b.link_url) : undefined}
                            target={clickable ? '_blank' : undefined}
                            rel={clickable ? 'noreferrer' : undefined}
                            className={`group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-emerald-200 transition ${
                                clickable ? 'cursor-pointer' : 'cursor-default'
                            }`}
                        >
                            <div className="h-24 bg-slate-100 overflow-hidden">
                                {b.image_url ? (
                                    <img src={String(b.image_url)} alt={b.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Image</div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-sm font-black text-slate-900 truncate">{b.title}</div>
                                        {b.subtitle && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{b.subtitle}</div>}
                                    </div>
                                    {clickable && <ExternalLink size={16} className="text-slate-300 group-hover:text-emerald-600" />}
                                </div>
                            </div>
                        </a>
                    );
                })}
            </div>
        </GlassCard>
    );
};

export default PromoBannersStrip;

