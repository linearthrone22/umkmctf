import React from 'react';
import { MapPin, Settings } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import type { User } from '../../../types';
import SellerAvailabilityCard from '../features/SellerAvailabilityCard';
import SellerWarehousesCard from '../features/SellerWarehousesCard';
import SellerCouponsCard from '../features/SellerCouponsCard';
import SellerVerificationCard from '../features/SellerVerificationCard';

interface SellerSettingsTabProps {
    user: User | null;
    location: string;
    businessName: string;
    businessAddress: string;
    taxId: string;
    locationSaving: boolean;
    onMapsLinkChange: (value: string) => void;
    onLocationChange: (value: string) => void;
    onBusinessNameChange: (value: string) => void;
    onBusinessAddressChange: (value: string) => void;
    onTaxIdChange: (value: string) => void;
    onNormalize: () => void;
    onSave: () => void;
}

const SellerSettingsTab: React.FC<SellerSettingsTabProps> = ({
    user,
    location,
    businessName,
    businessAddress,
    taxId,
    locationSaving,
    onMapsLinkChange,
    onLocationChange,
    onBusinessNameChange,
    onBusinessAddressChange,
    onTaxIdChange,
    onNormalize,
    onSave
}) => {
    return (
        <div className="lg:col-span-3 space-y-6 animate-slide-up">
            <GlassCard>
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-slate-100 p-3 rounded-2xl text-slate-600">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900">Pengaturan Profil</h3>
                        <p className="text-sm text-slate-500">Kelola lokasi default dan preferensi akun Anda.</p>
                    </div>
                </div>

                <div className="max-w-md space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Username</label>
                        <input
                            value={user?.username}
                            disabled
                            className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-400 outline-none cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Link Google Maps</label>
                        <div className="relative">
                            <input
                                placeholder="Tempel link Google Maps di sini..."
                                onChange={e => onMapsLinkChange(e.target.value)}
                                className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                            />
                            <MapPin size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        </div>
                        <p className="text-[9px] text-slate-400">
                            Tempel URL dari browser atau aplikasi Google Maps (contoh: https://maps.app.goo.gl/...)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Lokasi / Koordinat Saat Ini</label>
                        <div className="flex gap-2">
                            <input
                                value={location}
                                onChange={e => onLocationChange(e.target.value)}
                                className="flex-1 bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-mono"
                            />
                            <button
                                onClick={onNormalize}
                                className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all"
                            >
                                Normalisasi
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                            Pastikan lokasi berupa koordinat (lat, lng) untuk akurasi rute terbaik.
                        </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                        <div className="text-sm font-black text-slate-900">Invoice & Pajak</div>
                        <p className="text-xs text-slate-500 mt-1">Dipakai di invoice PDF (nomor invoice otomatis di order).</p>

                        <div className="mt-4 space-y-3">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Nama Bisnis</label>
                                <input
                                    value={businessName}
                                    onChange={e => onBusinessNameChange(e.target.value)}
                                    placeholder="Contoh: UMKM Berkah"
                                    className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Alamat Bisnis</label>
                                <textarea
                                    value={businessAddress}
                                    onChange={e => onBusinessAddressChange(e.target.value)}
                                    placeholder="Alamat lengkap untuk invoice..."
                                    className="w-full min-h-[88px] bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">NPWP / Tax ID</label>
                                <input
                                    value={taxId}
                                    onChange={e => onTaxIdChange(e.target.value)}
                                    placeholder="Opsional"
                                    className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onSave}
                        disabled={locationSaving}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {locationSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Menyimpan...
                            </>
                        ) : (
                            'Simpan Perubahan'
                        )}
                    </button>
                </div>
            </GlassCard>

            <SellerAvailabilityCard />

            <SellerWarehousesCard />

            <SellerCouponsCard />

            <SellerVerificationCard />
        </div>
    );
};

export default SellerSettingsTab;
