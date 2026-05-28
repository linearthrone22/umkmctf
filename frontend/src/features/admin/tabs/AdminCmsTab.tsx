import React, { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { supabase } from '../../../supabase';
import type { MarketplaceCategory, PromoBanner } from '../../cms/types';
import { slugify } from '../utils/slug';

type CmsTab = 'categories' | 'banners';

const AdminCmsTab: React.FC = () => {
    const [subTab, setSubTab] = useState<CmsTab>('categories');

    const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
    const [banners, setBanners] = useState<PromoBanner[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editCategory, setEditCategory] = useState<MarketplaceCategory | null>(null);
    const [editBanner, setEditBanner] = useState<PromoBanner | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const [cats, bans] = await Promise.all([
                supabase.from('marketplace_categories').select('*').order('sort_order', { ascending: true }),
                supabase.from('promo_banners').select('*').order('sort_order', { ascending: true })
            ]);
            if (cats.error) throw cats.error;
            if (bans.error) throw bans.error;
            setCategories((cats.data || []) as MarketplaceCategory[]);
            setBanners((bans.data || []) as PromoBanner[]);
        } catch (e: any) {
            setCategories([]);
            setBanners([]);
            setError(e?.message || 'Gagal memuat CMS data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const activeCategories = useMemo(() => categories.filter(c => !!c.is_active), [categories]);
    const activeBanners = useMemo(() => banners.filter(b => !!b.is_active), [banners]);
    const categoryIdSet = useMemo(() => new Set(categories.map(c => c.id)), [categories]);
    const bannerIdSet = useMemo(() => new Set(banners.map(b => b.id)), [banners]);

    return (
        <div className="space-y-6">
            <GlassCard>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">CMS</h2>
                        <p className="text-sm text-slate-500 mt-1">Kelola kategori marketplace & banner promo.</p>
                        {error && <div className="mt-3 text-xs font-bold text-rose-600">Error: {error}</div>}
                    </div>
                    <button
                        type="button"
                        onClick={() => void refresh()}
                        disabled={loading}
                        className="shrink-0 px-4 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition disabled:opacity-60 inline-flex items-center gap-2"
                    >
                        <RefreshCw size={16} />
                        {loading ? 'Memuat…' : 'Refresh'}
                    </button>
                </div>

                <div className="mt-5 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setSubTab('categories')}
                        className={`px-4 py-2 rounded-2xl text-sm font-black border transition ${
                            subTab === 'categories'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-200 hover:text-emerald-700'
                        }`}
                    >
                        Categories ({activeCategories.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSubTab('banners')}
                        className={`px-4 py-2 rounded-2xl text-sm font-black border transition ${
                            subTab === 'banners'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-200 hover:text-emerald-700'
                        }`}
                    >
                        Banners ({activeBanners.length})
                    </button>
                </div>
            </GlassCard>

            {subTab === 'categories' ? (
                <GlassCard>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-sm font-black text-slate-900">Marketplace Categories</div>
                            <div className="text-xs text-slate-500 mt-1">Dipakai untuk filter/label listing (opsional).</div>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setEditCategory({
                                    id: crypto.randomUUID(),
                                    name: '',
                                    slug: '',
                                    is_active: true,
                                    sort_order: categories.length,
                                    created_at: new Date().toISOString()
                                })
                            }
                            className="px-4 py-2 rounded-2xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 transition inline-flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Add
                        </button>
                    </div>

                    <div className="mt-4 overflow-auto rounded-2xl border border-slate-200 bg-white">
                        <table className="min-w-[900px] w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="text-left px-4 py-3">Name</th>
                                    <th className="text-left px-4 py-3">Slug</th>
                                    <th className="text-left px-4 py-3">Active</th>
                                    <th className="text-left px-4 py-3">Sort</th>
                                    <th className="text-right px-4 py-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">
                                            {loading ? 'Memuat…' : 'Belum ada kategori.'}
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map(c => (
                                        <tr key={c.id} className="border-t border-slate-100 hover:bg-emerald-50/30">
                                            <td className="px-4 py-3 font-bold text-slate-900">{c.name}</td>
                                            <td className="px-4 py-3 text-slate-600 font-mono text-xs">{c.slug}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black ${
                                                        c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {c.is_active ? 'active' : 'off'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{c.sort_order}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditCategory(c)}
                                                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            ) : (
                <GlassCard>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-sm font-black text-slate-900">Promo Banners</div>
                            <div className="text-xs text-slate-500 mt-1">Tampil di homepage (LandingPage).</div>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setEditBanner({
                                    id: crypto.randomUUID(),
                                    title: '',
                                    subtitle: '',
                                    image_url: '',
                                    link_url: '',
                                    is_active: true,
                                    sort_order: banners.length,
                                    created_at: new Date().toISOString()
                                } as PromoBanner)
                            }
                            className="px-4 py-2 rounded-2xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 transition inline-flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Add
                        </button>
                    </div>

                    <div className="mt-4 overflow-auto rounded-2xl border border-slate-200 bg-white">
                        <table className="min-w-[980px] w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="text-left px-4 py-3">Title</th>
                                    <th className="text-left px-4 py-3">Image</th>
                                    <th className="text-left px-4 py-3">Link</th>
                                    <th className="text-left px-4 py-3">Active</th>
                                    <th className="text-left px-4 py-3">Sort</th>
                                    <th className="text-right px-4 py-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {banners.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                                            {loading ? 'Memuat…' : 'Belum ada banner.'}
                                        </td>
                                    </tr>
                                ) : (
                                    banners.map(b => (
                                        <tr key={b.id} className="border-t border-slate-100 hover:bg-emerald-50/30">
                                            <td className="px-4 py-3 font-bold text-slate-900">{b.title}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500">
                                                {b.image_url ? (
                                                    <a
                                                        className="font-mono underline"
                                                        href={String(b.image_url)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        image
                                                    </a>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500">
                                                {b.link_url ? (
                                                    <a className="font-mono underline" href={String(b.link_url)} target="_blank" rel="noreferrer">
                                                        link
                                                    </a>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black ${
                                                        b.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {b.is_active ? 'active' : 'off'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{b.sort_order}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditBanner(b)}
                                                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            )}

            {editCategory && (
                <CategoryModal
                    category={editCategory}
                    existing={categoryIdSet.has(editCategory.id)}
                    onClose={() => setEditCategory(null)}
                    onSaved={async () => {
                        setEditCategory(null);
                        await refresh();
                    }}
                    onDeleted={async () => {
                        setEditCategory(null);
                        await refresh();
                    }}
                />
            )}

            {editBanner && (
                <BannerModal
                    banner={editBanner}
                    existing={bannerIdSet.has(editBanner.id)}
                    onClose={() => setEditBanner(null)}
                    onSaved={async () => {
                        setEditBanner(null);
                        await refresh();
                    }}
                    onDeleted={async () => {
                        setEditBanner(null);
                        await refresh();
                    }}
                />
            )}
        </div>
    );
};

const ModalShell: React.FC<{ title: string; children: React.ReactNode; onClose: () => void }> = ({ title, children, onClose }) => (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close modal" />
        <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="text-lg font-black text-slate-900">{title}</div>
                <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-slate-300 transition"
                >
                    Tutup
                </button>
            </div>
            <div className="mt-5">{children}</div>
        </div>
    </div>
);

const CategoryModal: React.FC<{
    category: MarketplaceCategory;
    existing: boolean;
    onClose: () => void;
    onSaved: () => Promise<void>;
    onDeleted: () => Promise<void>;
}> = ({ category, existing, onClose, onSaved, onDeleted }) => {
    const [name, setName] = useState(category.name || '');
    const [slug, setSlug] = useState(category.slug || '');
    const [isActive, setIsActive] = useState(!!category.is_active);
    const [sortOrder, setSortOrder] = useState<number>(Number(category.sort_order) || 0);
    const [saving, setSaving] = useState(false);

    const computedSlug = useMemo(() => slugify(name), [name]);

    return (
        <ModalShell title="Edit Category" onClose={onClose}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                    <div className="text-[11px] font-black uppercase text-slate-500">Name</div>
                    <input
                        value={name}
                        onChange={e => {
                            setName(e.target.value);
                            if (!slug.trim()) setSlug(slugify(e.target.value));
                        }}
                        className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>
                <div className="sm:col-span-2">
                    <div className="flex items-center justify-between">
                        <div className="text-[11px] font-black uppercase text-slate-500">Slug</div>
                        {computedSlug && (
                            <button
                                type="button"
                                onClick={() => setSlug(computedSlug)}
                                className="text-[11px] font-black text-emerald-700 hover:text-emerald-800"
                                title="Auto-generate slug"
                            >
                                Auto
                            </button>
                        )}
                    </div>
                    <input
                        value={slug}
                        onChange={e => setSlug(e.target.value)}
                        className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                    />
                </div>
                <div>
                    <div className="text-[11px] font-black uppercase text-slate-500">Sort Order</div>
                    <input
                        type="number"
                        value={sortOrder}
                        onChange={e => setSortOrder(Number(e.target.value))}
                        className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>
                <div>
                    <div className="text-[11px] font-black uppercase text-slate-500">Active</div>
                    <label className="mt-2 w-full inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700">
                        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                        {isActive ? 'On' : 'Off'}
                    </label>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                <button
                    type="button"
                    disabled={saving || !name.trim() || !slug.trim()}
                    onClick={async () => {
                        setSaving(true);
                        try {
                            const payload = { name: name.trim(), slug: slug.trim(), sort_order: sortOrder, is_active: isActive };
                            const { error } = await supabase.from('marketplace_categories').upsert([{ id: category.id, ...payload }]);
                            if (error) throw error;
                            await onSaved();
                        } catch (e: any) {
                            alert(e?.message || 'Gagal simpan category.');
                        } finally {
                            setSaving(false);
                        }
                    }}
                    className="px-4 py-3 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 disabled:opacity-60 transition inline-flex items-center gap-2"
                >
                    <Save size={16} />
                    {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
                {existing && (
                    <button
                        type="button"
                        disabled={saving}
                        onClick={async () => {
                            if (!confirm('Hapus kategori ini?')) return;
                            setSaving(true);
                            try {
                                const { error } = await supabase.from('marketplace_categories').delete().eq('id', category.id);
                                if (error) throw error;
                                await onDeleted();
                            } catch (e: any) {
                                alert(e?.message || 'Gagal hapus category.');
                            } finally {
                                setSaving(false);
                            }
                        }}
                        className="px-4 py-3 rounded-2xl bg-rose-600 text-white font-black hover:bg-rose-700 disabled:opacity-60 transition inline-flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                )}
            </div>
        </ModalShell>
    );
};

const BannerModal: React.FC<{
    banner: PromoBanner;
    existing: boolean;
    onClose: () => void;
    onSaved: () => Promise<void>;
    onDeleted: () => Promise<void>;
}> = ({ banner, existing, onClose, onSaved, onDeleted }) => {
    const [title, setTitle] = useState(String(banner.title || ''));
    const [subtitle, setSubtitle] = useState(String(banner.subtitle || ''));
    const [imageUrl, setImageUrl] = useState(String(banner.image_url || ''));
    const [linkUrl, setLinkUrl] = useState(String(banner.link_url || ''));
    const [isActive, setIsActive] = useState(!!banner.is_active);
    const [sortOrder, setSortOrder] = useState<number>(Number(banner.sort_order) || 0);
    const [saving, setSaving] = useState(false);

    return (
        <ModalShell title="Edit Banner" onClose={onClose}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                    <div className="text-[11px] font-black uppercase text-slate-500">Title</div>
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>
                <div className="sm:col-span-2">
                    <div className="text-[11px] font-black uppercase text-slate-500">Subtitle</div>
                    <input
                        value={subtitle}
                        onChange={e => setSubtitle(e.target.value)}
                        className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>
                <div className="sm:col-span-2">
                    <div className="text-[11px] font-black uppercase text-slate-500">Image URL</div>
                    <input
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                    />
                </div>
                <div className="sm:col-span-2">
                    <div className="text-[11px] font-black uppercase text-slate-500">Link URL</div>
                    <input
                        value={linkUrl}
                        onChange={e => setLinkUrl(e.target.value)}
                        placeholder="https://..."
                        className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                    />
                </div>
                <div>
                    <div className="text-[11px] font-black uppercase text-slate-500">Sort Order</div>
                    <input
                        type="number"
                        value={sortOrder}
                        onChange={e => setSortOrder(Number(e.target.value))}
                        className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>
                <div>
                    <div className="text-[11px] font-black uppercase text-slate-500">Active</div>
                    <label className="mt-2 w-full inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700">
                        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                        {isActive ? 'On' : 'Off'}
                    </label>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                <button
                    type="button"
                    disabled={saving || !title.trim()}
                    onClick={async () => {
                        setSaving(true);
                        try {
                            const payload = {
                                title: title.trim(),
                                subtitle: subtitle.trim() || null,
                                image_url: imageUrl.trim() || null,
                                link_url: linkUrl.trim() || null,
                                sort_order: sortOrder,
                                is_active: isActive
                            };
                            const { error } = await supabase.from('promo_banners').upsert([{ id: banner.id, ...payload }]);
                            if (error) throw error;
                            await onSaved();
                        } catch (e: any) {
                            alert(e?.message || 'Gagal simpan banner.');
                        } finally {
                            setSaving(false);
                        }
                    }}
                    className="px-4 py-3 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 disabled:opacity-60 transition inline-flex items-center gap-2"
                >
                    <Save size={16} />
                    {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
                {existing && (
                    <button
                        type="button"
                        disabled={saving}
                        onClick={async () => {
                            if (!confirm('Hapus banner ini?')) return;
                            setSaving(true);
                            try {
                                const { error } = await supabase.from('promo_banners').delete().eq('id', banner.id);
                                if (error) throw error;
                                await onDeleted();
                            } catch (e: any) {
                                alert(e?.message || 'Gagal hapus banner.');
                            } finally {
                                setSaving(false);
                            }
                        }}
                        className="px-4 py-3 rounded-2xl bg-rose-600 text-white font-black hover:bg-rose-700 disabled:opacity-60 transition inline-flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                )}
            </div>
        </ModalShell>
    );
};

export default AdminCmsTab;
