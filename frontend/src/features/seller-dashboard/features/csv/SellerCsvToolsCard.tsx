import React, { useMemo, useState } from 'react';
import { Download, UploadCloud } from 'lucide-react';
import GlassCard from '../../../../components/GlassCard';
import type { Product } from '../../../../types';
import { parseCsv, toCsv } from './csvUtils';

const HEADERS = [
    'id',
    'commodity',
    'sku',
    'variant_grade',
    'variant_size',
    'variant_packaging',
    'warehouse_id',
    'price',
    'stock',
    'discount_per_kg',
    'min_stock',
    'category',
    'location',
    'image_url',
    'is_active'
];

interface SellerCsvToolsCardProps {
    products: Product[];
    onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
}

const SellerCsvToolsCard: React.FC<SellerCsvToolsCardProps> = ({ products, onUpdateProduct }) => {
    const [importRows, setImportRows] = useState<Array<Record<string, string>>>([]);
    const [importing, setImporting] = useState(false);

    const download = () => {
        const rows = products.map(p => ({
            id: p.id,
            commodity: p.commodity,
            sku: (p as any).sku ?? '',
            variant_grade: (p as any).variant_grade ?? '',
            variant_size: (p as any).variant_size ?? '',
            variant_packaging: (p as any).variant_packaging ?? '',
            warehouse_id: (p as any).warehouse_id ?? '',
            price: p.price ?? 0,
            stock: p.stock ?? 0,
            discount_per_kg: p.discount_per_kg ?? 0,
            min_stock: p.min_stock ?? 10,
            category: p.category ?? '',
            location: p.location ?? '',
            image_url: p.image_url ?? '',
            is_active: p.is_active ?? true
        }));

        const csv = toCsv(HEADERS, rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const parseFile = async (file: File) => {
        const text = await file.text();
        const rows = parseCsv(text);
        setImportRows(rows);
    };

    const existingIds = useMemo(() => new Set(products.map(p => p.id)), [products]);
    const updatable = useMemo(() => importRows.filter(r => existingIds.has(String(r.id || '').trim())), [existingIds, importRows]);

    const applyUpdates = async () => {
        if (updatable.length === 0) return;
        if (!confirm(`Apply update ke ${updatable.length} baris? (Hanya id yang match)`)) return;
        setImporting(true);
        try {
            for (const r of updatable) {
                const id = String(r.id || '').trim();
                const updates: any = {};
                if (r.price !== undefined && String(r.price).trim() !== '') updates.price = Number(r.price) || 0;
                if (r.stock !== undefined && String(r.stock).trim() !== '') updates.stock = Number(r.stock) || 0;
                if (r.discount_per_kg !== undefined && String(r.discount_per_kg).trim() !== '') updates.discount_per_kg = Number(r.discount_per_kg) || 0;
                if (r.min_stock !== undefined && String(r.min_stock).trim() !== '') updates.min_stock = Number(r.min_stock) || 0;
                if (r.category !== undefined) updates.category = String(r.category).trim() || null;
                if (r.location !== undefined) updates.location = String(r.location).trim();
                if (r.image_url !== undefined) updates.image_url = String(r.image_url).trim();
                if (r.sku !== undefined) updates.sku = String(r.sku).trim() || null;
                if (r.variant_grade !== undefined) updates.variant_grade = String(r.variant_grade).trim() || null;
                if (r.variant_size !== undefined) updates.variant_size = String(r.variant_size).trim() || null;
                if (r.variant_packaging !== undefined) updates.variant_packaging = String(r.variant_packaging).trim() || null;
                if (r.warehouse_id !== undefined) updates.warehouse_id = String(r.warehouse_id).trim() || null;
                await onUpdateProduct(id, updates);
            }
            alert('Bulk update selesai.');
            setImportRows([]);
        } catch (err: any) {
            alert(`Bulk update gagal: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setImporting(false);
        }
    };

    return (
        <GlassCard className="mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <div className="text-sm font-black text-slate-900">Import/Export CSV</div>
                    <div className="text-xs text-slate-500">Bulk edit harga/stok dengan CSV. (MVP: update berdasarkan `id`)</div>
                </div>
                <button
                    type="button"
                    onClick={download}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:border-slate-300 transition"
                >
                    <Download size={16} className="inline -mt-0.5 mr-1" />
                    Export CSV
                </button>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm font-black cursor-pointer">
                    <UploadCloud size={16} />
                    <span>Pilih CSV</span>
                    <input
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) void parseFile(f);
                        }}
                    />
                </label>
                <div className="text-xs text-slate-500">
                    {importRows.length > 0 ? `Terbaca: ${importRows.length} baris (match id: ${updatable.length})` : 'Belum ada file.'}
                </div>
                <div className="sm:ml-auto">
                    <button
                        type="button"
                        disabled={importing || updatable.length === 0}
                        onClick={() => void applyUpdates()}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-black hover:bg-slate-800 disabled:opacity-50 transition"
                    >
                        Apply Update
                    </button>
                </div>
            </div>
        </GlassCard>
    );
};

export default SellerCsvToolsCard;

