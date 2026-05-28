import React, { useMemo, useState } from 'react';
import { CalendarDays, Wallet } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import type { Order } from '../../../types';
import { computePayoutSummary, type PayoutPeriod } from '../utils/payout';

const formatIdr = (value: number) => {
    try {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
    } catch {
        return `Rp ${Math.round(value || 0)}`;
    }
};

interface PayoutSummaryCardProps {
    orders: Order[];
}

const PayoutSummaryCard: React.FC<PayoutSummaryCardProps> = ({ orders }) => {
    const [period, setPeriod] = useState<PayoutPeriod>('weekly');
    const summary = useMemo(() => computePayoutSummary(orders, period), [orders, period]);

    return (
        <GlassCard>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Wallet className="text-emerald-600" size={18} />
                        Rekap Payout
                    </h3>
                    <p className="text-xs text-slate-500">
                        Escrow released setelah delivered (MVP).
                    </p>
                </div>
                <div className="inline-flex items-center gap-2">
                    <CalendarDays size={16} className="text-slate-400" />
                    <select
                        value={period}
                        onChange={e => setPeriod(e.target.value as PayoutPeriod)}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                        <option value="weekly">Mingguan</option>
                        <option value="monthly">Bulanan</option>
                    </select>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="text-[11px] font-black uppercase text-emerald-700">Released</div>
                    <div className="text-xl font-black text-emerald-900 mt-1">{formatIdr(summary.releasedTotal)}</div>
                    <div className="text-xs text-emerald-700 mt-1">{summary.releasedCount} order</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="text-[11px] font-black uppercase text-slate-500">Held (Escrow)</div>
                    <div className="text-xl font-black text-slate-900 mt-1">{formatIdr(summary.heldTotal)}</div>
                    <div className="text-xs text-slate-500 mt-1">Paid tapi belum delivered</div>
                </div>
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100">
                    <div className="text-[11px] font-black uppercase text-sky-700">Paid Total</div>
                    <div className="text-xl font-black text-sky-900 mt-1">{formatIdr(summary.paidTotal)}</div>
                    <div className="text-xs text-sky-700 mt-1">
                        Range: {summary.range.start.toLocaleDateString('id-ID')} – {summary.range.end.toLocaleDateString('id-ID')}
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};

export default PayoutSummaryCard;

