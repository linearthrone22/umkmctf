import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { supabase } from '../../../supabase';
import type { SellerVerificationRow } from '../types';

type VerificationFilter = 'submitted' | 'approved' | 'rejected' | 'all';

const statusBadge = (status: string) => {
    if (status === 'approved') return { cls: 'bg-emerald-100 text-emerald-700', text: 'approved' };
    if (status === 'rejected') return { cls: 'bg-rose-100 text-rose-700', text: 'rejected' };
    if (status === 'submitted') return { cls: 'bg-amber-100 text-amber-700', text: 'submitted' };
    return { cls: 'bg-slate-100 text-slate-600', text: status || 'draft' };
};

const AdminVerificationTab: React.FC = () => {
    const [filter, setFilter] = useState<VerificationFilter>('submitted');
    const [rows, setRows] = useState<SellerVerificationRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sellerNameById, setSellerNameById] = useState<Map<string, string>>(new Map());
    const [sellerVerifiedById, setSellerVerifiedById] = useState<Map<string, boolean>>(new Map());

    const [active, setActive] = useState<SellerVerificationRow | null>(null);
    const [nextStatus, setNextStatus] = useState<'approved' | 'rejected'>('approved');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: qErr } = await supabase
                .from('seller_verifications')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(300);
            if (qErr) throw qErr;
            const list = (data || []) as SellerVerificationRow[];
            setRows(list);

            const ids = Array.from(new Set(list.map(r => r.seller_id).filter(Boolean))) as string[];
            if (ids.length === 0) {
                setSellerNameById(new Map());
                setSellerVerifiedById(new Map());
            } else {
                const { data: profs, error: pErr } = await supabase.from('profiles').select('id, username, is_verified').in('id', ids);
                if (pErr) throw pErr;
                const nameMap = new Map<string, string>();
                const verifiedMap = new Map<string, boolean>();
                (profs || []).forEach((p: any) => {
                    nameMap.set(String(p.id), String(p.username || p.id));
                    verifiedMap.set(String(p.id), !!p.is_verified);
                });
                setSellerNameById(nameMap);
                setSellerVerifiedById(verifiedMap);
            }
        } catch (e: any) {
            setRows([]);
            setSellerNameById(new Map());
            setSellerVerifiedById(new Map());
            setError(e?.message || 'Gagal memuat verifications.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        if (filter === 'all') return rows;
        return rows.filter(r => String(r.status || 'draft') === filter);
    }, [filter, rows]);

    const openDecision = (row: SellerVerificationRow) => {
        setActive(row);
        setNextStatus('approved');
        setNote(String(row.note || ''));
    };

    return (
        <div className="space-y-6">
            <GlassCard>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <BadgeCheck className="text-emerald-600" size={18} />
                            Seller Verification
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Approve/reject pengajuan verifikasi seller (KYC ringan) + badge.</p>
                        {error && <div className="mt-3 text-xs font-bold text-rose-600">Error: {error}</div>}
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value as VerificationFilter)}
                            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                            <option value="submitted">submitted</option>
                            <option value="approved">approved</option>
                            <option value="rejected">rejected</option>
                            <option value="all">all</option>
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
                                <th className="text-left px-4 py-3">Seller</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-left px-4 py-3">Doc</th>
                                <th className="text-left px-4 py-3">Submitted</th>
                                <th className="text-left px-4 py-3">Decided</th>
                                <th className="text-right px-4 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                                        {loading ? 'Memuat…' : 'Tidak ada data.'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(r => {
                                    const b = statusBadge(String(r.status || 'draft'));
                                    const sellerName = sellerNameById.get(r.seller_id) || r.seller_id;
                                    const isVerified = !!sellerVerifiedById.get(r.seller_id);
                                    return (
                                        <tr key={r.seller_id} className="border-t border-slate-100 hover:bg-emerald-50/30">
                                            <td className="px-4 py-3">
                                                <div className="font-black text-slate-900">{sellerName}</div>
                                                <div className="text-[11px] text-slate-400 font-mono break-all">{r.seller_id}</div>
                                                {isVerified && (
                                                    <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
                                                        profile.is_verified=true
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black ${b.cls}`}>
                                                    {b.text}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500">
                                                {r.doc_url ? (
                                                    <a className="underline font-mono" href={String(r.doc_url)} target="_blank" rel="noreferrer">
                                                        doc_url
                                                    </a>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                                {r.submitted_at ? new Date(r.submitted_at).toLocaleString('id-ID') : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                                {r.decided_at ? new Date(r.decided_at).toLocaleString('id-ID') : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => openDecision(r)}
                                                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition"
                                                >
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {active && (
                <DecisionModal
                    row={active}
                    sellerName={sellerNameById.get(active.seller_id) || active.seller_id}
                    nextStatus={nextStatus}
                    setNextStatus={setNextStatus}
                    note={note}
                    setNote={setNote}
                    saving={saving}
                    onClose={() => setActive(null)}
                    onSave={async () => {
                        setSaving(true);
                        try {
                            const { data, error: upErr } = await supabase
                                .from('seller_verifications')
                                .update({ status: nextStatus, note: note.trim() || null })
                                .eq('seller_id', active.seller_id)
                                .select('seller_id');
                            if (upErr) throw upErr;
                            if (!data || data.length === 0) throw new Error('Row tidak ditemukan atau tidak bisa diubah (cek RLS).');
                            setActive(null);
                            await refresh();
                        } finally {
                            setSaving(false);
                        }
                    }}
                />
            )}
        </div>
    );
};

const DecisionModal: React.FC<{
    row: SellerVerificationRow;
    sellerName: string;
    nextStatus: 'approved' | 'rejected';
    setNextStatus: (v: 'approved' | 'rejected') => void;
    note: string;
    setNote: (v: string) => void;
    saving: boolean;
    onClose: () => void;
    onSave: () => Promise<void>;
}> = ({ row, sellerName, nextStatus, setNextStatus, note, setNote, saving, onClose, onSave }) => {
    const b = statusBadge(String(row.status || 'draft'));

    const docValid = useMemo(() => {
        const v = String(row.doc_url || '').trim();
        if (!v) return false;
        try {
            const url = new URL(v);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }, [row.doc_url]);

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close modal" />
            <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-lg font-black text-slate-900">Review Verification</div>
                        <div className="text-xs text-slate-500 mt-1">
                            Seller: <span className="font-black text-slate-900">{sellerName}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-slate-300 transition"
                    >
                        Tutup
                    </button>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[11px] font-black uppercase text-slate-500">Status</div>
                        <div className="mt-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black ${b.cls}`}>{b.text}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-3">
                            Submitted: {row.submitted_at ? new Date(row.submitted_at).toLocaleString('id-ID') : '-'}
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[11px] font-black uppercase text-slate-500">Doc URL</div>
                        <div className="mt-2 text-xs text-slate-600 break-all font-mono">
                            {row.doc_url ? String(row.doc_url) : '-'}
                        </div>
                        {docValid && (
                            <a
                                className="mt-2 inline-flex text-xs font-black text-emerald-700 hover:text-emerald-800 underline"
                                href={String(row.doc_url)}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Buka dokumen
                            </a>
                        )}
                    </div>
                </div>

                <div className="mt-4">
                    <div className="text-[11px] font-black uppercase text-slate-500">Keputusan</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setNextStatus('approved')}
                            className={`px-4 py-2 rounded-2xl text-sm font-black border transition inline-flex items-center gap-2 ${
                                nextStatus === 'approved'
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-200'
                            }`}
                        >
                            <ThumbsUp size={16} />
                            Approve
                        </button>
                        <button
                            type="button"
                            onClick={() => setNextStatus('rejected')}
                            className={`px-4 py-2 rounded-2xl text-sm font-black border transition inline-flex items-center gap-2 ${
                                nextStatus === 'rejected'
                                    ? 'bg-rose-600 text-white border-rose-600'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-rose-200'
                            }`}
                        >
                            <ThumbsDown size={16} />
                            Reject
                        </button>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="text-[11px] font-black uppercase text-slate-500">Note</div>
                    <input
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Catatan admin (opsional)…"
                        className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => void onSave().catch(e => alert(e?.message || 'Gagal simpan keputusan.'))}
                        className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 disabled:opacity-60 transition"
                    >
                        {saving ? 'Menyimpan…' : 'Simpan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminVerificationTab;
