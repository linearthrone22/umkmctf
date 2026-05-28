import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ClipboardList, FileText, LayoutDashboard, LogOut, ShieldCheck, Tags } from 'lucide-react';
import type { AdminTab } from './types';
import AdminAnomaliesTab from './tabs/AdminAnomaliesTab';
import AdminAuditLogsTab from './tabs/AdminAuditLogsTab';
import AdminCmsTab from './tabs/AdminCmsTab';
import AdminDisputesTab from './tabs/AdminDisputesTab';
import AdminModerationTab from './tabs/AdminModerationTab';
import AdminOverviewTab from './tabs/AdminOverviewTab';
import AdminVerificationTab from './tabs/AdminVerificationTab';
import { useAuth } from '../../context/AuthContext';

const AdminPage: React.FC = () => {
    const [tab, setTab] = useState<AdminTab>('overview');
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const focusItemId = params.get('item') || null;
    const focusOrderId = params.get('order') || null;

    useEffect(() => {
        const t = params.get('tab') as AdminTab | null;
        if (!t) return;
        const allowed: AdminTab[] = ['overview', 'cms', 'moderation', 'anomalies', 'disputes', 'verification', 'audit'];
        if (allowed.includes(t)) setTab(t);
    }, [params]);

    const tabs = useMemo(
        () =>
            [
                { key: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
                { key: 'cms' as const, label: 'CMS', icon: Tags },
                { key: 'moderation' as const, label: 'Moderation', icon: CheckCircle2 },
                { key: 'anomalies' as const, label: 'Anomalies', icon: AlertTriangle },
                { key: 'disputes' as const, label: 'Disputes', icon: ShieldCheck },
                { key: 'verification' as const, label: 'Verification', icon: ClipboardList },
                { key: 'audit' as const, label: 'Audit Logs', icon: FileText }
            ] as const,
        []
    );

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className="min-h-dvh bg-slate-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Admin Panel</h1>
                        <p className="text-sm text-slate-500">CMS, moderation, dispute, verification, audit, anomaly.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="sm:hidden">
                            <select
                                value={tab}
                                onChange={e => setTab(e.target.value as AdminTab)}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            >
                                {tabs.map(t => (
                                    <option key={t.key} value={t.key}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => void handleLogout()}
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-600 hover:text-red-600 hover:border-red-200 transition"
                            aria-label="Logout"
                            title={user?.username ? `Logout (${user.username})` : 'Logout'}
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 flex-wrap">
                    {tabs.map(t => {
                        const Icon = t.icon;
                        const active = t.key === tab;
                        return (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setTab(t.key)}
                                className={`px-4 py-2 rounded-2xl text-sm font-black border transition inline-flex items-center gap-2 ${
                                    active
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200'
                                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-200 hover:text-emerald-700'
                                }`}
                            >
                                <Icon size={16} />
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                {tab === 'overview' && <AdminOverviewTab />}
                {tab === 'cms' && <AdminCmsTab />}
                {tab === 'moderation' && <AdminModerationTab focusItemId={focusItemId} />}
                {tab === 'anomalies' && <AdminAnomaliesTab />}
                {tab === 'disputes' && <AdminDisputesTab focusOrderId={focusOrderId} />}
                {tab === 'verification' && <AdminVerificationTab />}
                {tab === 'audit' && <AdminAuditLogsTab />}
            </div>
        </div>
    );
};

export default AdminPage;
