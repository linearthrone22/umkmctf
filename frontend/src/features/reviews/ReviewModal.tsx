import React, { useState } from 'react';
import { X } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import type { Order } from '../../types';
import Stars from './Stars';
import { useBuyerReviews } from './useBuyerReviews';

interface ReviewModalProps {
    order: Order;
    onClose: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ order, onClose }) => {
    const { create } = useBuyerReviews();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!order.item_id || !order.seller_id) return;
        setSaving(true);
        try {
            await create({
                seller_id: order.seller_id,
                item_id: order.item_id,
                order_id: order.id,
                rating,
                comment: comment.trim() || null
            } as any);
            alert('Review tersimpan.');
            onClose();
        } catch (err: any) {
            alert(`Gagal menyimpan review: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
            <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
            <div className="relative w-full max-w-xl">
                <GlassCard className="bg-white hover:shadow-none">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-xs text-slate-500">Review</div>
                            <div className="text-lg font-black text-slate-900">{order.commodity || 'Produk'}</div>
                            <div className="text-xs text-slate-400">Seller: {order.seller_name || order.seller_id}</div>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50" aria-label="Tutup">
                            <X size={18} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="mt-4 space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-sm font-black text-slate-900">Rating</div>
                            <div className="mt-2">
                                <Stars value={rating} onChange={setRating} size={22} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Komentar (opsional)</label>
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                placeholder="Ceritain pengalaman belinya..."
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-slate-300 transition disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => void save()}
                                disabled={saving}
                                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 transition"
                            >
                                {saving ? 'Menyimpan...' : 'Kirim Review'}
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default ReviewModal;

