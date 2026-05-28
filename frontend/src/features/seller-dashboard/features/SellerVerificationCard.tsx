import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ShieldCheck } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../supabase';

type VerificationStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | string;

const isValidHttpUrl = (value: string) => {
    const v = value.trim();
    if (!v) return true;
    try {
        const url = new URL(v);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const SellerVerificationCard: React.FC = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState<VerificationStatus>('draft');
    const [docUrl, setDocUrl] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canUse = user?.role === 'seller' && !!user?.id;

    const badge = useMemo(() => {
        if (!user?.is_verified) {
            if (status === 'submitted') return { text: 'Submitted', cls: 'bg-amber-100 text-amber-700' };
            if (status === 'rejected') return { text: 'Rejected', cls: 'bg-rose-100 text-rose-700' };
            return { text: 'Not Verified', cls: 'bg-slate-100 text-slate-600' };
        }
        return { text: 'Verified', cls: 'bg-emerald-100 text-emerald-700' };
    }, [status, user?.is_verified]);

    const refresh = async () => {
        if (!canUse) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: qErr } = await supabase
                .from('seller_verifications')
                .select('*')
                .eq('seller_id', user!.id)
                .maybeSingle();
            if (qErr) throw qErr;
            if (data) {
                setStatus((data as any).status || 'draft');
                setDocUrl(String((data as any).doc_url || ''));
                setNote(String((data as any).note || ''));
            }
        } catch (e: any) {
            setError(e?.message || 'Gagal memuat status verifikasi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    if (!canUse) return null;

    return (
        <GlassCard>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="text-emerald-600" size={18} />
                        Verifikasi Seller
                    </h3>
                    <p className="text-xs text-slate-500">
                        KYC ringan: masukkan link dokumen (opsional). Admin akan approve/reject.
                    </p>
                </div>
                <div className={`inline-flex items-center gap-2 text-[11px] font-black px-3 py-1.5 rounded-full ${badge.cls}`}>
                    <BadgeCheck size={14} />
                    {badge.text}
                </div>
            </div>

            {error && <div className="mt-3 text-xs text-rose-600 font-bold">Error: {error}</div>}

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-8">
                    <div className="text-[11px] font-black uppercase text-slate-500">Link Dokumen</div>
                    <input
                        value={docUrl}
                        onChange={e => setDocUrl(e.target.value)}
                        placeholder="https://..."
                        className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    {docUrl.trim() && !isValidHttpUrl(docUrl) && (
                        <div className="mt-1 text-[11px] text-rose-600 font-bold">URL harus http/https.</div>
                    )}
                </div>
                <div className="lg:col-span-4">
                    <div className="text-[11px] font-black uppercase text-slate-500">Catatan</div>
                    <input
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Contoh: NPWP, KTP, izin usaha..."
                        className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
                <button
                    type="button"
                    disabled={saving || !isValidHttpUrl(docUrl)}
                    onClick={async () => {
                        setSaving(true);
                        setError(null);
                        try {
                            const { error: upErr } = await supabase.from('seller_verifications').upsert([
                                { seller_id: user!.id, doc_url: docUrl.trim() || null, note: note.trim() || null }
                            ]);
                            if (upErr) throw upErr;
                            await refresh();
                            alert('Dokumen terkirim. Menunggu verifikasi admin.');
                        } catch (e: any) {
                            setError(e?.message || 'Gagal mengirim dokumen.');
                        } finally {
                            setSaving(false);
                        }
                    }}
                    className="px-4 py-3 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 disabled:opacity-60 transition"
                >
                    {saving ? 'Mengirim...' : 'Submit Verifikasi'}
                </button>
                <button
                    type="button"
                    disabled={loading}
                    onClick={() => void refresh()}
                    className="px-4 py-3 rounded-2xl border border-slate-200 bg-white font-black text-slate-700 hover:border-slate-300 transition disabled:opacity-60"
                >
                    Refresh
                </button>
            </div>
        </GlassCard>
    );
};

export default SellerVerificationCard;
