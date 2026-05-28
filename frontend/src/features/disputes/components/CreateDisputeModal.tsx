import React, { useMemo, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Order } from '../../../types';

interface CreateDisputeModalProps {
    order: Order;
    saving?: boolean;
    onClose: () => void;
    onSubmit: (payload: { subject: string; message: string }) => void;
}

const CreateDisputeModal: React.FC<CreateDisputeModalProps> = ({ order, saving, onClose, onSubmit }) => {
    const [subject, setSubject] = useState('Komplain pesanan');
    const [message, setMessage] = useState('');

    const canSubmit = useMemo(() => subject.trim().length >= 4 && message.trim().length >= 15, [message, subject]);

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
            <div className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-amber-600" />
                            Dispute Center
                        </div>
                        <div className="text-lg font-black text-slate-900">{order.commodity || 'Order'}</div>
                        <div className="text-xs text-slate-400 break-all">Order ID: {order.id}</div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
                        aria-label="Tutup"
                    >
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                <div className="mt-5 space-y-3">
                    <label className="block">
                        <div className="text-[11px] font-black uppercase text-slate-500">Subject</div>
                        <input
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                    </label>
                    <label className="block">
                        <div className="text-[11px] font-black uppercase text-slate-500">Keluhan (detail)</div>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Contoh: barang rusak, telat, kualitas tidak sesuai, jumlah kurang..."
                            className="mt-2 w-full min-h-[140px] px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                        <div className="mt-1 text-[11px] text-slate-500">Minimal 15 karakter.</div>
                    </label>
                </div>

                <div className="mt-6 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => onSubmit({ subject: subject.trim(), message: message.trim() })}
                        disabled={!canSubmit || saving}
                        className="flex-1 py-3 rounded-2xl bg-amber-600 text-white font-black hover:bg-amber-700 disabled:opacity-60 transition"
                    >
                        {saving ? 'Mengirim...' : 'Kirim Komplain'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-3 rounded-2xl border border-slate-200 bg-white font-black text-slate-700 hover:border-slate-300 transition"
                    >
                        Batal
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateDisputeModal;

