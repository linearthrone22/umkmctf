import React from 'react';
import { ShieldAlert } from 'lucide-react';
import type { Dispute } from '../types';

const badge = (status: string) => {
    if (status === 'resolved') return { cls: 'bg-emerald-100 text-emerald-700', text: 'resolved' };
    if (status === 'rejected') return { cls: 'bg-rose-100 text-rose-700', text: 'rejected' };
    if (status === 'waiting_admin') return { cls: 'bg-amber-100 text-amber-700', text: 'waiting_admin' };
    return { cls: 'bg-slate-100 text-slate-600', text: status || 'open' };
};

interface DisputeDetailModalProps {
    dispute: Dispute;
    onClose: () => void;
}

const DisputeDetailModal: React.FC<DisputeDetailModalProps> = ({ dispute, onClose }) => {
    const b = badge(String(dispute.status || 'open'));
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close modal" />
            <div className="relative w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <ShieldAlert className="text-amber-600" size={18} />
                            Dispute Detail
                        </div>
                        <div className="text-xs text-slate-500 mt-1 break-all">Order: {dispute.order_id}</div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-slate-300 transition"
                    >
                        Tutup
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-black ${b.cls}`}>{b.text}</span>
                    <div className="text-[11px] text-slate-400">
                        Update: {new Date(dispute.updated_at).toLocaleString('id-ID')}
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[11px] font-black uppercase text-slate-500">Subject</div>
                        <div className="mt-2 font-black text-slate-900">{dispute.subject}</div>
                        <div className="mt-4 text-[11px] font-black uppercase text-slate-500">Buyer Message</div>
                        <div className="mt-2 text-slate-700 whitespace-pre-wrap">{dispute.buyer_message}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[11px] font-black uppercase text-slate-500">Seller Response</div>
                        <div className="mt-2 text-slate-700 whitespace-pre-wrap">{dispute.seller_response || '-'}</div>

                        <div className="mt-4 text-[11px] font-black uppercase text-slate-500">Admin Decision</div>
                        <div className="mt-2 text-slate-700 whitespace-pre-wrap">{dispute.admin_decision || '-'}</div>
                        {dispute.admin_note && (
                            <div className="mt-3 text-xs text-slate-500 whitespace-pre-wrap">
                                Catatan: {dispute.admin_note}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DisputeDetailModal;

