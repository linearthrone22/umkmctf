import React from 'react';
import { MapPin } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import AddressesManager from '../../addresses/AddressesManager';

interface BuyerSettingsTabProps {
    locationInput: string;
    locationSaving: boolean;
    onLocationInputChange: (value: string) => void;
    onMapsLinkChange: (value: string) => void;
    onLookup: () => void;
    onSave: () => void;
}

const BuyerSettingsTab: React.FC<BuyerSettingsTabProps> = ({
    locationInput,
    locationSaving,
    onLocationInputChange,
    onMapsLinkChange,
    onLookup,
    onSave
}) => {
    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
            <h2 className="text-2xl font-black text-slate-900">Settings</h2>
            <GlassCard className="p-8 space-y-8">
                <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-900">Link Google Maps</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tempel link Google Maps (browser/app)..."
                            onChange={e => onMapsLinkChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                        <MapPin size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                        Gunakan link dari Google Maps untuk akurasi lokasi pengiriman yang lebih baik.
                    </p>
                </div>

                <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-900">Lokasi Pengiriman Default</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            value={locationInput}
                            onChange={e => onLocationInputChange(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 font-mono"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={onLookup}
                                className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-all"
                            >
                                Cek
                            </button>
                            <button
                                onClick={onSave}
                                disabled={locationSaving}
                                className="px-8 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-60 shadow-lg shadow-slate-200"
                            >
                                {locationSaving ? 'Saving...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            </GlassCard>

            <AddressesManager />
        </div>
    );
};

export default BuyerSettingsTab;
