import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { supabase } from '../../../supabase';
import type { Product } from '../../../types';

type ModerationFilter = 'pending' | 'rejected' | 'approved' | 'all';

const reasonTemplates = [
    'Gambar/teks tidak relevan dengan komoditas',
    'Informasi harga/stok tidak jelas',
    'Konten duplikat/spam',
    'Lokasi tidak valid',
    'Melanggar kebijakan marketplace'
];

const badgeClass = (status: string) => {
    if (status === 'approved') return 'bg-emerald-100 text-emerald-700';
    if (status === 'rejected') return 'bg-rose-100 text-rose-700';
    return 'bg-amber-100 text-amber-700';
};

interface AdminModerationTabProps {
    focusItemId?: string | null;
}

const AdminModerationTab: React.FC<AdminModerationTabProps> = ({ focusItemId = null }) => {
    const [filter, setFilter] = useState<ModerationFilter>('pending');
    const [items, setItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [active, setActive] = useState<Product | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: qErr } = await supabase.from('items').select('*').order('created_at', { ascending: false });
            if (qErr) throw qErr;
            setItems((data || []) as Product[]);
        } catch (e: any) {
            setItems([]);
            setError(e?.message || 'Gagal memuat items.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        if (filter === 'all') return items;
        return items.filter(i => String(i.moderation_status || 'approved') === filter);
    }, [filter, items]);

    useEffect(() => {
        if (!focusItemId) return;
        const found = items.find(i => i.id === focusItemId);
        if (found) {
            setActive(found);
            setDecision('approved');
            setReason(String(found.moderation_reason || ''));
        }
    }, [focusItemId, items]);

    const allVisibleSelected = useMemo(
        () => filtered.length > 0 && filtered.every(i => selectedIds.has(i.id)),
        [filtered, selectedIds]
    );

    const toggleOne = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAllVisible = () => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allVisibleSelected) filtered.forEach(i => next.delete(i.id));
            else filtered.forEach(i => next.add(i.id));
            return next;
        });
    };

    const bulkUpdate = async (nextStatus: 'approved' | 'rejected') => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        if (nextStatus === 'rejected' && !reason.trim()) {
            alert('Isi reason dulu untuk bulk reject.');
            return;
        }
        if (!confirm(`Update ${ids.length} item menjadi ${nextStatus}?`)) return;
        setSaving(true);
        try {
            const patch: any = { moderation_status: nextStatus, moderation_reason: reason.trim() || null };
            const { data, error: upErr } = await supabase.from('items').update(patch).in('id', ids).select('id');
            if (upErr) throw upErr;
            if (!data || data.length === 0) throw new Error('Tidak ada item yang ter-update (cek RLS).');
            setSelectedIds(new Set());
            await refresh();
        } catch (e: any) {
            alert(e?.message || 'Gagal bulk update moderation.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <GlassCard>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Listing Moderation</h2>
                        <p className="text-sm text-slate-500 mt-1">Approve/reject listing + reason template.</p>
                        {error && <div className="mt-3 text-xs font-bold text-rose-600">Error: {error}</div>}
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value as ModerationFilter)}
                            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                            <option value="approved">Approved</option>
                            <option value="all">All</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => void refresh()}
                            disabled={loading}
                            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={16} />
                            {loading ? 'Memuat…' : 'Refresh'}
                        </button>
                    </div>
                </div>

                <div className="mt-6 overflow-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="min-w-[1200px] w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="text-left px-4 py-3">
                                    <label className="inline-flex items-center gap-2 text-xs font-black text-slate-600">
                                        <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
                                        Bulk
                                    </label>
                                </th>
                                <th className="text-left px-4 py-3">Item</th>
                                <th className="text-left px-4 py-3">Seller</th>
                                <th className="text-left px-4 py-3">Stock</th>
                                <th className="text-left px-4 py-3">Price</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-left px-4 py-3">Reason</th>
                                <th className="text-right px-4 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                                        {loading ? 'Memuat…' : 'Tidak ada data.'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(i => (
                                    <tr key={i.id} className="border-t border-slate-100 hover:bg-emerald-50/30">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(i.id)}
                                                onChange={() => toggleOne(i.id)}
                                                className="w-4 h-4"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
                                                    {i.image_url ? (
                                                        <img src={i.image_url} alt={i.commodity} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                                                            No Img
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-black text-slate-900 truncate">{i.commodity}</div>
                                                    <div className="text-xs text-slate-500 truncate">{i.location}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">{i.seller_id}</td>
                                        <td className="px-4 py-3 font-bold text-slate-900">{i.stock}</td>
                                        <td className="px-4 py-3 font-black text-slate-900">Rp {Number(i.price || 0).toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black ${badgeClass(
                                                    String(i.moderation_status || 'approved')
                                                )}`}
                                            >
                                                {String(i.moderation_status || 'approved')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{i.moderation_reason || '-'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActive(i);
                                                    setDecision('approved');
                                                    setReason(String(i.moderation_reason || ''));
                                                }}
                                                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div>
                            <div className="text-sm font-black text-slate-900">Bulk Actions</div>
                            <div className="text-xs text-slate-500 mt-1">Pilih item via checkbox, lalu approve/reject sekaligus.</div>
                        </div>
                        <div className="text-xs text-slate-500 font-bold">
                            Selected: <span className="text-slate-900">{selectedIds.size}</span>
                        </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-12 gap-3">
                        <div className="lg:col-span-8">
                            <div className="text-[11px] font-black uppercase text-slate-500">Reason (untuk reject)</div>
                            <input
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Pakai template atau isi manual…"
                                className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                            <div className="mt-2 flex flex-wrap gap-2">
                                {reasonTemplates.slice(0, 4).map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setReason(t)}
                                        className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black hover:bg-slate-200"
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="lg:col-span-4 flex flex-col gap-2">
                            <button
                                type="button"
                                disabled={saving || selectedIds.size === 0}
                                onClick={() => void bulkUpdate('approved')}
                                className="w-full px-4 py-3 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 disabled:opacity-60 transition"
                            >
                                Bulk Approve
                            </button>
                            <button
                                type="button"
                                disabled={saving || selectedIds.size === 0}
                                onClick={() => void bulkUpdate('rejected')}
                                className="w-full px-4 py-3 rounded-2xl bg-rose-600 text-white font-black hover:bg-rose-700 disabled:opacity-60 transition"
                            >
                                Bulk Reject
                            </button>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {active && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                    <button className="absolute inset-0 bg-black/40" onClick={() => setActive(null)} aria-label="Close modal" />
                    <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-lg font-black text-slate-900">Moderate Item</div>
                                <div className="text-xs text-slate-500 mt-1 break-all">ID: {active.id}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActive(null)}
                                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-slate-300 transition"
                            >
                                Tutup
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="text-[11px] font-black uppercase text-slate-500">Komoditas</div>
                                <div className="font-black text-slate-900 mt-1">{active.commodity}</div>
                                <div className="text-xs text-slate-500 mt-1">{active.location}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="text-[11px] font-black uppercase text-slate-500">Seller</div>
                                <div className="font-mono text-xs text-slate-600 mt-1 break-all">{active.seller_id}</div>
                                <div className="text-xs text-slate-500 mt-2">Stock: {active.stock} kg</div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <div className="text-[11px] font-black uppercase text-slate-500">Decision</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDecision('approved')}
                                    className={`px-4 py-2 rounded-2xl text-sm font-black border transition inline-flex items-center gap-2 ${
                                        decision === 'approved'
                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-200'
                                    }`}
                                >
                                    <CheckCircle2 size={16} />
                                    Approve
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDecision('rejected')}
                                    className={`px-4 py-2 rounded-2xl text-sm font-black border transition inline-flex items-center gap-2 ${
                                        decision === 'rejected'
                                            ? 'bg-rose-600 text-white border-rose-600'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-rose-200'
                                    }`}
                                >
                                    <XCircle size={16} />
                                    Reject
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <div className="text-[11px] font-black uppercase text-slate-500">Reason Template</div>
                                <select
                                    value=""
                                    onChange={e => {
                                        const value = e.target.value;
                                        if (!value) return;
                                        setReason(value);
                                    }}
                                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                >
                                    <option value="">Pilih template…</option>
                                    {reasonTemplates.map(t => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <div className="text-[11px] font-black uppercase text-slate-500">Reason (final)</div>
                                <input
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder="Opsional (untuk reject)"
                                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={async () => {
                                    setSaving(true);
                                    try {
                                        const patch: any = {
                                            moderation_status: decision,
                                            moderation_reason: reason.trim() || null
                                        };
                                        const { data, error: upErr } = await supabase
                                            .from('items')
                                            .update(patch)
                                            .eq('id', active.id)
                                            .select('id');
                                        if (upErr) throw upErr;
                                        if (!data || data.length === 0) throw new Error('Item tidak ditemukan atau tidak bisa diubah (cek RLS).');
                                        setActive(null);
                                        await refresh();
                                    } catch (e: any) {
                                        alert(e?.message || 'Gagal update moderation.');
                                    } finally {
                                        setSaving(false);
                                    }
                                }}
                                disabled={saving || (decision === 'rejected' && !reason.trim())}
                                className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 disabled:opacity-60 transition"
                            >
                                {saving ? 'Menyimpan…' : 'Simpan Keputusan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminModerationTab;
