import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileText, RefreshCw, Search } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { supabase } from '../../../supabase';
import type { AuditLogRow } from '../types';

type TargetFilter = 'all' | 'items' | 'orders' | 'profiles' | 'chat' | 'other';
type ActorFilter = 'all' | string;

const AdminAuditLogsTab: React.FC = () => {
    const [rows, setRows] = useState<AuditLogRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<TargetFilter>('all');
    const [actorFilter, setActorFilter] = useState<ActorFilter>('all');
    const [query, setQuery] = useState('');
    const [actorNameById, setActorNameById] = useState<Map<string, string>>(new Map());

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: qErr } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200);
            if (qErr) throw qErr;
            const list = (data || []) as AuditLogRow[];
            setRows(list);

            const actorIds = Array.from(new Set(list.map(r => r.actor_id).filter(Boolean))) as string[];
            if (actorIds.length === 0) {
                setActorNameById(new Map());
            } else {
                const { data: profs, error: pErr } = await supabase.from('profiles').select('id, username').in('id', actorIds);
                if (pErr) throw pErr;
                const map = new Map<string, string>();
                (profs || []).forEach((p: any) => map.set(String(p.id), String(p.username || p.id)));
                setActorNameById(map);
            }
        } catch (e: any) {
            setRows([]);
            setActorNameById(new Map());
            setError(e?.message || 'Gagal memuat audit logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        let data = rows;
        if (filter !== 'all') {
            if (filter === 'other') data = data.filter(r => !['items', 'orders', 'profiles', 'chat'].includes(String(r.target_table || '')));
            else data = data.filter(r => String(r.target_table || '') === filter);
        }
        if (actorFilter !== 'all') {
            data = data.filter(r => String(r.actor_id || '') === actorFilter);
        }
        if (query.trim()) {
            const q = query.trim().toLowerCase();
            data = data.filter(r => {
                const payloadStr = r.payload ? JSON.stringify(r.payload) : '';
                const blob = `${r.action || ''} ${r.target_table || ''} ${r.target_id || ''} ${payloadStr}`.toLowerCase();
                return blob.includes(q);
            });
        }
        return data;
    }, [actorFilter, filter, query, rows]);

    const actorOptions = useMemo(() => {
        const ids = Array.from(new Set(rows.map(r => r.actor_id).filter(Boolean))) as string[];
        return ids
            .map(id => ({ id, label: actorNameById.get(id) || id }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [actorNameById, rows]);

    const exportCsv = () => {
        const escape = (v: any) => {
            const s = v == null ? '' : String(v);
            const q = s.replace(/"/g, '""');
            return `"${q}"`;
        };
        const header = ['created_at', 'actor_id', 'actor_name', 'action', 'target_table', 'target_id', 'payload_json'];
        const lines = [header.join(',')];
        filtered.forEach(r => {
            lines.push(
                [
                    escape(r.created_at),
                    escape(r.actor_id || ''),
                    escape(r.actor_id ? actorNameById.get(r.actor_id) || '' : ''),
                    escape(r.action),
                    escape(r.target_table || ''),
                    escape(r.target_id || ''),
                    escape(r.payload ? JSON.stringify(r.payload) : '')
                ].join(',')
            );
        });
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <GlassCard>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <FileText className="text-emerald-600" size={18} />
                            Audit Logs
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Log perubahan penting (harga/stok/status), plus tindakan admin.</p>
                        {error && <div className="mt-3 text-xs font-bold text-rose-600">Error: {error}</div>}
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value as TargetFilter)}
                            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                            <option value="all">All</option>
                            <option value="orders">orders</option>
                            <option value="items">items</option>
                            <option value="profiles">profiles</option>
                            <option value="chat">chat</option>
                            <option value="other">other</option>
                        </select>
                        <select
                            value={actorFilter}
                            onChange={e => setActorFilter(e.target.value as ActorFilter)}
                            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            title="Filter actor"
                        >
                            <option value="all">actor: all</option>
                            {actorOptions.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.label}
                                </option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 bg-white">
                            <Search size={16} className="text-slate-400" />
                            <input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search action/target/payload…"
                                className="w-56 text-sm outline-none"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={exportCsv}
                            disabled={filtered.length === 0}
                            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-50 transition inline-flex items-center justify-center gap-2"
                            title="Export CSV"
                        >
                            <Download size={16} />
                            Export
                        </button>
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
                                <th className="text-left px-4 py-3">Time</th>
                                <th className="text-left px-4 py-3">Actor</th>
                                <th className="text-left px-4 py-3">Action</th>
                                <th className="text-left px-4 py-3">Target</th>
                                <th className="text-left px-4 py-3">Payload</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                                        {loading ? 'Memuat…' : 'Tidak ada log.'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(r => (
                                    <tr key={r.id} className="border-t border-slate-100 hover:bg-emerald-50/30">
                                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                            {new Date(r.created_at).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-700">
                                            {r.actor_id ? (
                                                <span title={r.actor_id} className="font-bold">
                                                    {actorNameById.get(r.actor_id) || r.actor_id}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">system</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-black text-slate-900">{r.action}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            <div className="font-mono">{r.target_table || '-'}</div>
                                            {r.target_id && <div className="font-mono text-[11px] text-slate-400 break-all">{r.target_id}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            <pre className="max-w-[520px] whitespace-pre-wrap break-words bg-slate-50 border border-slate-100 rounded-xl p-3 overflow-hidden">
                                                {r.payload ? JSON.stringify(r.payload, null, 2) : '-'}
                                            </pre>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
};

export default AdminAuditLogsTab;
