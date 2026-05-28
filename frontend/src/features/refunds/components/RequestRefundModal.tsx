import React, { useMemo, useState } from 'react';
import { RefreshCcw, X } from 'lucide-react';
import type { Order } from '../../../types';

interface RequestRefundModalProps {
    order: Order;
    saving?: boolean;
    onClose: () => void;
    onSubmit: (payload: { reason: string }) => void;
}

const RequestRefundModal: React.FC<RequestRefundModalProps> = ({ order, saving, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');

    const canSubmit = useMemo(() => reason.trim().length >= 10, [reason]);

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
            <div className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-xs text-slate-500">Refund / Retur</div>
                        <div className="text-lg font-black text-slate-900">{order.commodity || 'Order'}</div>
                        <div className="text-xs text-slate-400 break-all">ID: {order.id}</div>
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

                <div className="mt-5 space-y-2">
                    <div className="text-sm font-black text-slate-900">Alasan</div>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Contoh: barang rusak, salah kualitas, telat, jumlah tidak sesuai..."
                        className="w-full min-h-[120px] px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <div className="text-[11px] text-slate-500">
                        Minimal 10 karakter. Seller akan approve/reject.
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => onSubmit({ reason: reason.trim() })}
                        disabled={!canSubmit || saving}
                        className="flex-1 py-3 rounded-2xl bg-amber-600 text-white font-black hover:bg-amber-700 disabled:opacity-60 transition"
                    >
                        {saving ? 'Mengirim...' : 'Ajukan Refund'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-3 rounded-2xl border border-slate-200 bg-white font-black text-slate-700 hover:border-slate-300 transition"
                    >
                        Batal
                    </button>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3 text-[11px] text-slate-600">
                    <div className="font-black text-slate-700 flex items-center gap-2">
                        <RefreshCcw size={14} /> Flow singkat
                    </div>
                    <div className="mt-1">Requested → Approved/Rejected → Refunded (opsional).</div>
                </div>
            </div>
        </div>
    );
};

export default RequestRefundModal;

