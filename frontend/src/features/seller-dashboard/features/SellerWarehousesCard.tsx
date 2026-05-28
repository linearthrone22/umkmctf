import React, { useMemo, useState } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import GlassCard from '../../../components/GlassCard';
import { useWarehouses } from '../../warehouses/useWarehouses';

const SellerWarehousesCard: React.FC = () => {
    const { rows, loading, setupError, create, update, remove } = useWarehouses();

    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [saving, setSaving] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editLocation, setEditLocation] = useState('');

    const defaultId = useMemo(() => rows.find(r => r.is_default)?.id || null, [rows]);

    const startEdit = (id: string) => {
        const row = rows.find(r => r.id === id);
        if (!row) return;
        setEditingId(id);
        setEditName(row.name);
        setEditLocation(row.location || '');
    };

    const stopEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditLocation('');
    };

    const handleCreate = async () => {
        const trimmedName = name.trim();
        const trimmedLocation = location.trim();
        if (!trimmedName || !trimmedLocation) {
            alert('Nama gudang dan lokasi wajib diisi.');
            return;
        }
        setSaving(true);
        try {
            await create({ name: trimmedName, location: trimmedLocation, is_default: isDefault });
            setName('');
            setLocation('');
            setIsDefault(false);
        } catch (err: any) {
            alert(`Gagal membuat gudang: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        const trimmedName = editName.trim();
        const trimmedLocation = editLocation.trim();
        if (!trimmedName || !trimmedLocation) {
            alert('Nama gudang dan lokasi wajib diisi.');
            return;
        }
        setSaving(true);
        try {
            await update(editingId, { name: trimmedName, location: trimmedLocation });
            stopEdit();
        } catch (err: any) {
            alert(`Gagal update gudang: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <GlassCard>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-black text-slate-900">Gudang / Lokasi Seller</h3>
                    <p className="text-sm text-slate-500">Buat beberapa lokasi. Saat publish produk, pilih gudang agar lokasi otomatis terisi.</p>
                </div>
                <div className="text-xs text-slate-500">{loading ? 'Memuat...' : `Total: ${rows.length}`}</div>
            </div>

            {setupError && (
                <div className="mt-4 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    {setupError}
                </div>
            )}

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Nama Gudang</label>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Gudang Pusat Bandung"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>
                <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Lokasi (Koordinat / Maps URL)</label>
                    <div className="relative">
                        <input
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder="-6.9147, 107.6098"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                        />
                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                </div>
                <div className="md:col-span-3 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                        <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
                        Jadikan default
                    </label>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleCreate()}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 transition"
                    >
                        <Plus size={16} className="inline -mt-0.5 mr-1" />
                        Tambah Gudang
                    </button>
                </div>
            </div>

            <div className="mt-6 space-y-2">
                {rows.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        Belum ada gudang.
                    </div>
                ) : (
                    rows.map(w => {
                        const isEditing = editingId === w.id;
                        return (
                            <div key={w.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                                {isEditing ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none"
                                        />
                                        <input
                                            value={editLocation}
                                            onChange={e => setEditLocation(e.target.value)}
                                            className="md:col-span-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none font-mono"
                                        />
                                        <div className="md:col-span-3 flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                disabled={saving}
                                                onClick={stopEdit}
                                                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-slate-300 transition disabled:opacity-50"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="button"
                                                disabled={saving}
                                                onClick={() => void handleSaveEdit()}
                                                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 transition"
                                            >
                                                Simpan
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <div className="font-black text-slate-900 flex items-center gap-2">
                                                {w.name}
                                                {w.is_default && <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Default</span>}
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono">{w.location}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!w.is_default && (
                                                <button
                                                    type="button"
                                                    disabled={saving}
                                                    onClick={() => void update(w.id, { is_default: true }).catch(err => alert(err?.message || 'Gagal set default.'))}
                                                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition disabled:opacity-50"
                                                >
                                                    Jadikan default
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                disabled={saving}
                                                onClick={() => startEdit(w.id)}
                                                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:border-slate-300 transition disabled:opacity-50"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                disabled={saving || w.id === defaultId}
                                                onClick={() => {
                                                    if (!confirm('Hapus gudang ini? Item yang pakai gudang ini akan jadi warehouse_id = null.')) return;
                                                    void remove(w.id).catch(err => alert(err?.message || 'Gagal menghapus gudang.'));
                                                }}
                                                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 transition disabled:opacity-50"
                                                aria-label="Hapus"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </GlassCard>
    );
};

export default SellerWarehousesCard;

