import React, { useEffect, useState } from 'react';
import { CalendarClock, Save } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { useMyAvailability } from '../../availability/useSellerAvailability';

const WEEKDAYS: Array<{ i: number; label: string }> = [
    { i: 1, label: 'Sen' },
    { i: 2, label: 'Sel' },
    { i: 3, label: 'Rab' },
    { i: 4, label: 'Kam' },
    { i: 5, label: 'Jum' },
    { i: 6, label: 'Sab' },
    { i: 0, label: 'Min' }
];

const SellerAvailabilityCard: React.FC = () => {
    const { row, loading, setupError, upsert } = useMyAvailability();

    const [allowsPreorder, setAllowsPreorder] = useState(row?.allows_preorder ?? false);
    const [leadDays, setLeadDays] = useState<number>(row?.lead_days ?? 0);
    const [cutoffTime, setCutoffTime] = useState<string>(row?.cutoff_time ?? '');
    const [closed, setClosed] = useState<Set<number>>(new Set((row?.closed_weekdays || []) as number[]));
    const [holidays, setHolidays] = useState<string>((row?.holidays || []).join(','));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setAllowsPreorder(row?.allows_preorder ?? false);
        setLeadDays(row?.lead_days ?? 0);
        setCutoffTime(row?.cutoff_time ?? '');
        setClosed(new Set((row?.closed_weekdays || []) as number[]));
        setHolidays((row?.holidays || []).join(','));
    }, [row?.updated_at]);

    const toggleClosed = (i: number) => {
        setClosed(prev => {
            const next = new Set(prev);
            if (next.has(i)) next.delete(i);
            else next.add(i);
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const holidayList = holidays
                .split(',')
                .map(x => x.trim())
                .filter(Boolean);
            await upsert({
                allows_preorder: allowsPreorder,
                lead_days: Math.max(0, Math.floor(Number(leadDays) || 0)),
                cutoff_time: cutoffTime.trim() || null,
                closed_weekdays: [...closed.values()].sort(),
                holidays: holidayList
            } as any);
            alert('Availability tersimpan.');
        } catch (err: any) {
            alert(`Gagal simpan availability: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <GlassCard>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <CalendarClock size={18} className="text-emerald-600" /> Jadwal Ketersediaan
                    </h3>
                    <p className="text-sm text-slate-500">Pre-order, cut-off jam, hari libur.</p>
                </div>
                <div className="text-xs text-slate-500">{loading ? 'Memuat...' : row ? 'Tersimpan' : 'Belum diset'}</div>
            </div>

            {setupError && (
                <div className="mt-4 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    {setupError}
                </div>
            )}

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                    <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                        <input type="checkbox" checked={allowsPreorder} onChange={e => setAllowsPreorder(e.target.checked)} />
                        Izinkan pre-order
                    </label>
                    <p className="text-[11px] text-slate-500 mt-1">Jika aktif, buyer bisa order meskipun jadwal tutup (diproses sesuai lead time).</p>
                </div>
                <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Cut-off (Jam)</label>
                    <input
                        type="time"
                        value={cutoffTime}
                        onChange={e => setCutoffTime(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>
                <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Lead Time (Hari)</label>
                    <input
                        type="number"
                        min={0}
                        value={leadDays}
                        onChange={e => setLeadDays(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>
            </div>

            <div className="mt-5">
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-2">Hari Tutup</div>
                <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map(d => (
                        <button
                            key={d.i}
                            type="button"
                            onClick={() => toggleClosed(d.i)}
                            className={`px-3 py-2 rounded-xl text-xs font-black border transition ${
                                closed.has(d.i)
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            {d.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-5 space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400">Hari Libur (YYYY-MM-DD, pisah koma)</div>
                <input
                    value={holidays}
                    onChange={e => setHolidays(e.target.value)}
                    placeholder="2026-05-01, 2026-12-25"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                />
            </div>

            <div className="mt-5 flex items-center justify-end">
                <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                    <Save size={16} className="inline -mt-0.5 mr-1" />
                    Simpan
                </button>
            </div>
        </GlassCard>
    );
};

export default SellerAvailabilityCard;
