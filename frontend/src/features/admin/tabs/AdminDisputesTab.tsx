import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ShieldCheck, ThumbsDown, ThumbsUp } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { useDisputes } from '../../disputes/useDisputes';
import type { Dispute } from '../../disputes/types';

type DisputeFilter = 'all' | 'open' | 'waiting_admin' | 'resolved' | 'rejected';

const badge = (status: string) => {
    if (status === 'resolved') return { cls: 'bg-emerald-100 text-emerald-700', text: 'resolved' };
    if (status === 'rejected') return { cls: 'bg-rose-100 text-rose-700', text: 'rejected' };
    if (status === 'waiting_admin') return { cls: 'bg-amber-100 text-amber-700', text: 'waiting_admin' };
    return { cls: 'bg-slate-100 text-slate-600', text: status || 'open' };
};

interface AdminDisputesTabProps {
    focusOrderId?: string | null;
}

const AdminDisputesTab: React.FC<AdminDisputesTabProps> = ({ focusOrderId = null }) => {
    const { disputes, loading, error, refresh, decideDispute } = useDisputes();
    const [filter, setFilter] = useState<DisputeFilter>('waiting_admin');
    const [active, setActive] = useState<Dispute | null>(null);

    const [decisionStatus, setDecisionStatus] = useState<'resolved' | 'rejected'>('resolved');
    const [decisionText, setDecisionText] = useState('');
    const [decisionNote, setDecisionNote] = useState('');
    const [saving, setSaving] = useState(false);

    const filtered = useMemo(() => {
        if (filter === 'all') return disputes;
        return disputes.filter(d => String(d.status || 'open') === filter);
    }, [disputes, filter]);

    useEffect(() => {
        if (!focusOrderId) return;
        const found = disputes.find(d => d.order_id === focusOrderId) || null;
        if (found) {
            setActive(found);
            setDecisionStatus('resolved');
            setDecisionText(String(found.admin_decision || ''));
            setDecisionNote(String(found.admin_note || ''));
        } else {
            void refresh();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusOrderId, disputes.length]);

    return (
        <div className="space-y-6">
            <GlassCard>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <ShieldCheck className="text-emerald-600" size={18} />
                            Dispute Center
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Buyer komplain → seller respon → admin keputusan.</p>
                        {error && <div className="mt-3 text-xs font-bold text-rose-600">Error: {error}</div>}
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value as DisputeFilter)}
                            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                            <option value="waiting_admin">waiting_admin</option>
                            <option value="open">open</option>
                            <option value="resolved">resolved</option>
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
                    <table className="min-w-[1100px] w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="text-left px-4 py-3">Created</th>
                                <th className="text-left px-4 py-3">Subject</th>
                                <th className="text-left px-4 py-3">Order</th>
                                <th className="text-left px-4 py-3">Buyer</th>
                                <th className="text-left px-4 py-3">Seller</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-right px-4 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                                        {loading ? 'Memuat…' : 'Tidak ada dispute.'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(d => {
                                    const b = badge(String(d.status || 'open'));
                                    return (
                                        <tr key={d.id} className="border-t border-slate-100 hover:bg-emerald-50/30">
                                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                                {new Date(d.created_at).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 font-black text-slate-900">{d.subject}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500 font-mono">{d.order_id}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500 font-mono">{d.buyer_id}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500 font-mono">{d.seller_id}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black ${b.cls}`}>
                                                    {b.text}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActive(d);
                                                        setDecisionStatus('resolved');
                                                        setDecisionText(String(d.admin_decision || ''));
                                                        setDecisionNote(String(d.admin_note || ''));
                                                    }}
                                                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition"
                                                >
                                                    Detail
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
                <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                    <button className="absolute inset-0 bg-black/40" onClick={() => setActive(null)} aria-label="Close modal" />
                    <div className="relative w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-lg font-black text-slate-900">Dispute Detail</div>
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

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="text-[11px] font-black uppercase text-slate-500">Buyer Message</div>
                                <div className="mt-2 text-slate-700 whitespace-pre-wrap">{active.buyer_message}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="text-[11px] font-black uppercase text-slate-500">Seller Response</div>
                                <div className="mt-2 text-slate-700 whitespace-pre-wrap">{active.seller_response || '-'}</div>
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-[11px] font-black uppercase text-slate-500">Admin Decision</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDecisionStatus('resolved')}
                                    className={`px-4 py-2 rounded-2xl text-sm font-black border transition inline-flex items-center gap-2 ${
                                        decisionStatus === 'resolved'
                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-200'
                                    }`}
                                >
                                    <ThumbsUp size={16} />
                                    Resolve
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDecisionStatus('rejected')}
                                    className={`px-4 py-2 rounded-2xl text-sm font-black border transition inline-flex items-center gap-2 ${
                                        decisionStatus === 'rejected'
                                            ? 'bg-rose-600 text-white border-rose-600'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-rose-200'
                                    }`}
                                >
                                    <ThumbsDown size={16} />
                                    Reject
                                </button>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3">
                                <div>
                                    <div className="text-[11px] font-black uppercase text-slate-500">Keputusan</div>
                                    <textarea
                                        value={decisionText}
                                        onChange={e => setDecisionText(e.target.value)}
                                        placeholder="Tulis keputusan admin…"
                                        className="mt-2 w-full min-h-[92px] px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <div className="text-[11px] font-black uppercase text-slate-500">Catatan Internal (opsional)</div>
                                    <input
                                        value={decisionNote}
                                        onChange={e => setDecisionNote(e.target.value)}
                                        placeholder="Catatan singkat…"
                                        className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-end">
                                <button
                                    type="button"
                                    disabled={saving || !decisionText.trim()}
                                    onClick={async () => {
                                        setSaving(true);
                                        try {
                                            await decideDispute({
                                                disputeId: active.id,
                                                status: decisionStatus,
                                                decision: decisionText.trim(),
                                                note: decisionNote.trim() || undefined
                                            });
                                            setActive(null);
                                        } catch (e: any) {
                                            alert(e?.message || 'Gagal menyimpan keputusan.');
                                        } finally {
                                            setSaving(false);
                                        }
                                    }}
                                    className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 disabled:opacity-60 transition"
                                >
                                    {saving ? 'Menyimpan…' : 'Simpan Keputusan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDisputesTab;
