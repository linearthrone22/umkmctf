import React, { useEffect, useState } from 'react';
import { Activity, Database, RefreshCw } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { supabase } from '../../../supabase';
import type { AdminStats } from '../types';

const StatBox: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="text-[11px] font-black uppercase text-slate-500">{label}</div>
        <div className="text-2xl font-black text-slate-900 mt-1">{value}</div>
    </div>
);

const AdminOverviewTab: React.FC = () => {
    const [stats, setStats] = useState<AdminStats>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const [items, orders, reviews, profiles, disputes, verifications] = await Promise.all([
                supabase.from('items').select('id', { count: 'exact', head: true }),
                supabase.from('orders').select('id', { count: 'exact', head: true }),
                supabase.from('reviews').select('id', { count: 'exact', head: true }),
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
                supabase.from('disputes').select('id', { count: 'exact', head: true }),
                supabase.from('seller_verifications').select('seller_id', { count: 'exact', head: true })
            ]);

            const firstErr =
                items.error || orders.error || reviews.error || profiles.error || disputes.error || verifications.error;
            if (firstErr) throw firstErr;

            setStats({
                items: items.count ?? undefined,
                orders: orders.count ?? undefined,
                reviews: reviews.count ?? undefined,
                profiles: profiles.count ?? undefined,
                disputes: disputes.count ?? undefined,
                verifications: verifications.count ?? undefined
            });
        } catch (e: any) {
            setStats({});
            setError(e?.message || 'Gagal memuat stats admin.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-6">
            <GlassCard>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Database className="text-emerald-600" size={18} />
                            Overview
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Ringkasan data & status setup SQL/RLS.</p>
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

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatBox label="Items" value={loading ? '…' : stats.items ?? '-'} />
                    <StatBox label="Orders" value={loading ? '…' : stats.orders ?? '-'} />
                    <StatBox label="Reviews" value={loading ? '…' : stats.reviews ?? '-'} />
                    <StatBox label="Profiles" value={loading ? '…' : stats.profiles ?? '-'} />
                    <StatBox label="Disputes" value={loading ? '…' : stats.disputes ?? '-'} />
                    <StatBox label="Verifications" value={loading ? '…' : stats.verifications ?? '-'} />
                </div>
            </GlassCard>

            <GlassCard>
                <div className="flex items-center gap-2">
                    <Activity className="text-emerald-600" size={18} />
                    <div className="text-sm font-black text-slate-900">Catatan Setup</div>
                </div>
                <ul className="mt-3 text-sm text-slate-600 space-y-2 list-disc pl-5">
                    <li>CMS & Moderation butuh SQL: `37_admin_cms.sql` + `38_listing_moderation.sql`.</li>
                    <li>Dispute center: `33_disputes.sql`.</li>
                    <li>Seller verification: `34_seller_verification.sql`.</li>
                    <li>Audit logs & triggers: `30_admin_audit.sql` + `36_audit_logs_triggers.sql`.</li>
                    <li>Anomaly dashboard: `39_admin_anomalies.sql` (RPC).</li>
                </ul>
            </GlassCard>
        </div>
    );
};

export default AdminOverviewTab;

