import React from 'react';
import { Truck, Trash2 } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import type { Order, Shipment } from '../../../types';

interface SellerLogisticsPanelProps {
    shippableOrders: Order[];
    selectedOrderIds: string[];
    shipments: Shipment[];
    loading: boolean;
    shipmentClearing: boolean;
    shipmentDeletingId: string | null;
    onToggleOrderSelection: (id: string) => void;
    onRunAgent: () => void;
    onClearShipmentHistory: () => void;
    onDeleteShipment: (id: string) => void;
    onSelectShipmentRoute: (routeData: any) => void;
}

const SellerLogisticsPanel: React.FC<SellerLogisticsPanelProps> = ({
    shippableOrders,
    selectedOrderIds,
    shipments,
    loading,
    shipmentClearing,
    shipmentDeletingId,
    onToggleOrderSelection,
    onRunAgent,
    onClearShipmentHistory,
    onDeleteShipment,
    onSelectShipmentRoute
}) => {
    return (
        <div className="lg:col-span-1 space-y-6 animate-slide-up">
            <GlassCard className="h-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Truck size={20} className="text-emerald-500" /> Pilih Pesanan Dikirim
                    </h3>
                </div>
                <p className="text-xs text-slate-500 mb-6">Pilih buyer/pesanan yang ingin Anda proses pengirimannya hari ini.</p>

                <div className="space-y-3">
                    {shippableOrders.map(order => (
                        <label
                            key={order.id}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedOrderIds.includes(order.id) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedOrderIds.includes(order.id)}
                                onChange={() => onToggleOrderSelection(order.id)}
                                className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <div className="flex-1">
                                <div className="text-sm font-bold text-slate-900">{order.buyer_name}</div>
                                <div className="text-[10px] text-slate-500">
                                    {order.commodity} • {order.quantity}kg
                                </div>
                            </div>
                        </label>
                    ))}
                    {shippableOrders.length === 0 && (
                        <div className="text-center py-10 text-slate-400 text-xs italic">Belum ada pesanan masuk.</div>
                    )}
                </div>

                {/* SHIPMENT HISTORY */}
                <div className="mt-8 pt-8 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Riwayat Pengiriman</h4>
                        {shipments.length > 0 && (
                            <button
                                onClick={onClearShipmentHistory}
                                disabled={shipmentClearing}
                                className="text-[9px] font-bold text-rose-500 hover:text-rose-600 disabled:opacity-50 flex items-center gap-1"
                            >
                                <Trash2 size={12} /> {shipmentClearing ? 'Menghapus...' : 'Hapus Riwayat'}
                            </button>
                        )}
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {shipments.map(ship => (
                            <div key={ship.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-slate-900">
                                        {new Date(ship.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-bold">SENT</span>
                                </div>
                                <div className="text-[10px] text-slate-500 line-clamp-1">
                                    {ship.route_data.batches?.[0]?.sequence.join(' → ')}
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <button
                                        onClick={() => onSelectShipmentRoute(ship.route_data)}
                                        className="text-[9px] font-bold text-emerald-500 hover:underline"
                                    >
                                        LIHAT RUTE
                                    </button>
                                    <button
                                        onClick={() => onDeleteShipment(ship.id)}
                                        disabled={shipmentDeletingId === ship.id}
                                        className="text-[9px] font-bold text-rose-500 hover:text-rose-600 disabled:opacity-50 flex items-center gap-1"
                                    >
                                        <Trash2 size={11} /> {shipmentDeletingId === ship.id ? 'Menghapus...' : 'Hapus'}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {shipments.length === 0 && <p className="text-[10px] text-slate-300 italic">Belum ada riwayat.</p>}
                    </div>
                </div>

                {selectedOrderIds.length > 0 && (
                    <button
                        onClick={onRunAgent}
                        disabled={loading}
                        className="w-full mt-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                    >
                        {loading ? 'MENGHITUNG RUTE...' : 'DAPATKAN REKOMENDASI RUTE'}
                    </button>
                )}


                <div className="mt-4 text-[11px] text-slate-400">
                    Konfirmasi pengiriman ada di panel kanan (estimasi ongkir & armada).
                </div>
            </GlassCard>
        </div>
    );
};

export default SellerLogisticsPanel;
