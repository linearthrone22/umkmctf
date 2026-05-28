import React, { useMemo, useState } from 'react';
import { Image as ImageIcon, PenLine, User2, X } from 'lucide-react';
import type { Order } from '../../../types';

interface ProofOfDeliveryModalProps {
    order: Order;
    saving?: boolean;
    onClose: () => void;
    onSubmit: (payload: { receiver_name: string; pod_photo_url: string; pod_signature_url: string }) => void;
}

const isValidHttpUrl = (value: string) => {
    const v = value.trim();
    if (!v) return true; // optional
    try {
        const url = new URL(v);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const ProofOfDeliveryModal: React.FC<ProofOfDeliveryModalProps> = ({ order, saving, onClose, onSubmit }) => {
    const [receiverName, setReceiverName] = useState(String((order as any).receiver_name || ''));
    const [photoUrl, setPhotoUrl] = useState(String((order as any).pod_photo_url || ''));
    const [signatureUrl, setSignatureUrl] = useState(String((order as any).pod_signature_url || ''));

    const canSubmit = useMemo(() => {
        if (receiverName.trim().length < 2) return false;
        if (!isValidHttpUrl(photoUrl)) return false;
        if (!isValidHttpUrl(signatureUrl)) return false;
        return true;
    }, [photoUrl, receiverName, signatureUrl]);

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
            <div className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-xs text-slate-500">Proof of Delivery</div>
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

                <div className="mt-5 space-y-3">
                    <label className="block">
                        <div className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-2">
                            <User2 size={14} /> Nama penerima
                        </div>
                        <input
                            value={receiverName}
                            onChange={e => setReceiverName(e.target.value)}
                            placeholder="Contoh: Pak Budi"
                            className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                    </label>

                    <label className="block">
                        <div className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-2">
                            <ImageIcon size={14} /> Link foto POD (opsional)
                        </div>
                        <input
                            value={photoUrl}
                            onChange={e => setPhotoUrl(e.target.value)}
                            placeholder="https://..."
                            className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                        {!isValidHttpUrl(photoUrl) && (
                            <div className="mt-1 text-[11px] text-rose-600 font-bold">URL foto harus http/https.</div>
                        )}
                    </label>

                    <label className="block">
                        <div className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-2">
                            <PenLine size={14} /> Link tanda tangan (opsional)
                        </div>
                        <input
                            value={signatureUrl}
                            onChange={e => setSignatureUrl(e.target.value)}
                            placeholder="https://..."
                            className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                        {!isValidHttpUrl(signatureUrl) && (
                            <div className="mt-1 text-[11px] text-rose-600 font-bold">URL ttd harus http/https.</div>
                        )}
                    </label>
                </div>

                <div className="mt-6 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            onSubmit({
                                receiver_name: receiverName.trim(),
                                pod_photo_url: photoUrl.trim(),
                                pod_signature_url: signatureUrl.trim()
                            })
                        }
                        disabled={!canSubmit || saving}
                        className="flex-1 py-3 rounded-2xl bg-sky-600 text-white font-black hover:bg-sky-700 disabled:opacity-60 transition"
                    >
                        {saving ? 'Menyimpan...' : 'Tandai Delivered'}
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

export default ProofOfDeliveryModal;

