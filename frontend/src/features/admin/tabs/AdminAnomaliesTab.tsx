import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { supabase } from '../../../supabase';
import type { AdminAnomalyRow } from '../types';
import { useNavigate } from 'react-router-dom';

const severityBadge = (severity: number) => {
    if (severity >= 3) return { text: 'High', cls: 'bg-rose-100 text-rose-700' };
    if (severity === 2) return { text: 'Med', cls: 'bg-amber-100 text-amber-700' };
    return { text: 'Low', cls: 'bg-slate-100 text-slate-600' };
};

const AdminAnomaliesTab: React.FC = () => {
    const navigate = useNavigate();
    const [rows, setRows] = useState<AdminAnomalyRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: qErr } = await supabase.rpc('get_admin_anomalies');
            if (qErr) throw qErr;
            setRows((data || []) as AdminAnomalyRow[]);
        } catch (e: any) {
            setRows([]);
            setError(e?.message || 'Gagal memuat anomalies.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const grouped = useMemo(() => {
        const map = new Map<string, AdminAnomalyRow[]>();
        for (const r of rows) {
            const key = String(r.kind || 'other');
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(r);
        }
        return Array.from(map.entries());
    }, [rows]);

    return (
        <div className="space-y-6">
            <GlassCard>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <AlertTriangle className="text-amber-600" size={18} />
                            Anomaly Dashboard
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Deteksi cepat: stok negatif, pending terlalu lama, listing pending, dll.</p>
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

                <div className="mt-6 space-y-4">
                    {grouped.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">{loading ? 'Memuat…' : 'Tidak ada anomaly.'}</div>
                    ) : (
                        grouped.map(([kind, list]) => (
                            <div key={kind} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                                <div className="px-4 py-3 bg-slate-50 text-slate-700 font-black text-sm flex items-center justify-between">
                                    <span className="uppercase tracking-wider text-[11px] text-slate-500">{kind}</span>
                                    <span className="text-[11px] font-black text-slate-500">{list.length} item</span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {list.map(r => {
                                        const badge = severityBadge(Number(r.severity) || 1);
                                        return (
                                            <div key={`${r.entity_table}-${r.entity_id}-${r.created_at}`} className="px-4 py-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="font-black text-slate-900">{r.title}</div>
                                                        <div className="text-xs text-slate-500 mt-1 break-all">{r.details}</div>
                                                        <div className="text-[11px] text-slate-400 mt-2">
                                                            {r.entity_table}:{' '}
                                                            <span className="font-mono break-all">{r.entity_id}</span> •{' '}
                                                            {new Date(r.created_at).toLocaleString('id-ID')}
                                                        </div>
                                                    </div>
                                                    <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black ${badge.cls}`}>
                                                        {badge.text}
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    {r.entity_table === 'items' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate(`/admin?tab=moderation&item=${encodeURIComponent(String(r.entity_id))}`)}
                                                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition"
                                                        >
                                                            Open Item
                                                        </button>
                                                    )}
                                                    {r.entity_table === 'orders' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate(`/admin?tab=disputes&order=${encodeURIComponent(String(r.entity_id))}`)}
                                                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition"
                                                        >
                                                            Open Order
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            try {
                                                                await navigator.clipboard.writeText(String(r.entity_id));
                                                            } catch {
                                                                // ignore
                                                            }
                                                            alert('ID disalin ke clipboard.');
                                                        }}
                                                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:border-slate-300 transition"
                                                    >
                                                        Copy ID
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </GlassCard>
        </div>
    );
};

export default AdminAnomaliesTab;
