import React, { useMemo, useState } from 'react';
import { MapPin, Pencil, Plus, Save, Star, Trash2, X } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { parseCoordinatesFromInput, searchLocationCandidates } from '../../utils/location';
import { useAddresses, type AddressRow } from './useAddresses';

const isValidHttpUrl = (value: string) => {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const AddressesManager: React.FC = () => {
    const { rows, loading, create, update, remove, setDefault } = useAddresses();

    const [isOpen, setOpen] = useState(false);
    const [editing, setEditing] = useState<AddressRow | null>(null);
    const [label, setLabel] = useState('');
    const [addressText, setAddressText] = useState('');
    const [locationInput, setLocationInput] = useState('');
    const [saving, setSaving] = useState(false);

    const resetForm = () => {
        setLabel('');
        setAddressText('');
        setLocationInput('');
        setEditing(null);
    };

    const openCreate = () => {
        resetForm();
        setOpen(true);
    };

    const openEdit = (row: AddressRow) => {
        setEditing(row);
        setLabel(row.label || '');
        setAddressText(row.address_text || '');
        setLocationInput(row.location || '');
        setOpen(true);
    };

    const normalizedLocation = useMemo(() => locationInput.trim(), [locationInput]);

    const normalizeLocation = async () => {
        const raw = normalizedLocation;
        if (!raw) return;
        const parsed = parseCoordinatesFromInput(raw);
        if (parsed) {
            setLocationInput(`${parsed.lat}, ${parsed.lng}`);
            return;
        }

        // Support maps URL; or free-text (fallback to Nominatim if Google isn't active).
        const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
        try {
            const [candidate] = await searchLocationCandidates(raw, apiKey, 1);
            if (candidate?.coords) setLocationInput(candidate.coords);
        } catch (err: any) {
            alert(`Gagal normalisasi lokasi: ${err?.message || 'Terjadi kesalahan.'}`);
        }
    };

    const handleSave = async () => {
        const payload = {
            label: label.trim() || 'Alamat',
            address_text: addressText.trim() || '',
            location: normalizedLocation
        };

        if (!payload.location) {
            alert('Lokasi wajib diisi (disarankan format "lat, lng").');
            return;
        }
        if (isValidHttpUrl(payload.location)) {
            alert('Untuk alamat, jangan simpan URL maps. Klik "Cari/Normalize" dulu agar jadi koordinat.');
            return;
        }

        setSaving(true);
        try {
            if (editing) {
                await update(editing.id, payload);
            } else {
                await create(payload);
            }
            setOpen(false);
            resetForm();
        } catch (err: any) {
            alert(`Gagal menyimpan alamat: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <GlassCard>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <MapPin size={18} className="text-emerald-600" />
                            Alamat Pengiriman
                        </h3>
                        <p className="text-sm text-slate-500">Multi alamat + set default.</p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 transition"
                    >
                        <Plus size={16} className="inline -mt-0.5 mr-1" />
                        Tambah
                    </button>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        <div className="col-span-full py-10 text-center text-slate-400">Memuat alamat...</div>
                    ) : rows.length === 0 ? (
                        <div className="col-span-full py-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                            Belum ada alamat. Tambah dulu ya.
                        </div>
                    ) : (
                        rows.map(row => (
                            <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-black text-slate-900">{row.label}</div>
                                            {row.is_default && (
                                                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        {row.address_text && <div className="text-sm text-slate-600 mt-1">{row.address_text}</div>}
                                        <div className="text-xs text-slate-500 mt-1">Koordinat: {row.location}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!row.is_default && (
                                            <button
                                                type="button"
                                                onClick={() => void setDefault(row.id)}
                                                className="p-2 rounded-xl border border-slate-200 hover:border-emerald-200 hover:text-emerald-700 transition"
                                                title="Jadikan default"
                                            >
                                                <Star size={16} />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => openEdit(row)}
                                            className="p-2 rounded-xl border border-slate-200 hover:border-emerald-200 hover:text-emerald-700 transition"
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!confirm('Hapus alamat ini?')) return;
                                                void remove(row.id).catch(err => alert(err?.message || 'Gagal menghapus.'));
                                            }}
                                            className="p-2 rounded-xl border border-slate-200 hover:border-rose-200 hover:text-rose-700 transition"
                                            title="Hapus"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </GlassCard>

            {isOpen && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                    <button
                        className="absolute inset-0 bg-black/40"
                        onClick={() => {
                            if (saving) return;
                            setOpen(false);
                            resetForm();
                        }}
                        aria-label="Close modal"
                    />
                    <div className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h4 className="text-lg font-black text-slate-900">{editing ? 'Edit Alamat' : 'Tambah Alamat'}</h4>
                                <p className="text-xs text-slate-500">Gunakan koordinat untuk estimasi ongkir/ETA.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (saving) return;
                                    setOpen(false);
                                    resetForm();
                                }}
                                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
                                aria-label="Close"
                            >
                                <X size={18} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400">Label</label>
                                <input
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400">Koordinat / Maps</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        value={locationInput}
                                        onChange={e => setLocationInput(e.target.value)}
                                        placeholder="-6.2, 106.8"
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => void normalizeLocation()}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-black hover:border-emerald-200 hover:text-emerald-700 transition"
                                    >
                                        Cari
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400">Boleh paste link Google Maps, nanti dinormalisasi.</p>
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400">Alamat detail</label>
                                <textarea
                                    value={addressText}
                                    onChange={e => setAddressText(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (saving) return;
                                    setOpen(false);
                                    resetForm();
                                }}
                                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-slate-300 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => void handleSave()}
                                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 transition"
                            >
                                <Save size={16} className="inline -mt-0.5 mr-1" />
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AddressesManager;

