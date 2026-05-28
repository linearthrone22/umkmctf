import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import type { Warehouse } from '../../types';

const isMissingTableError = (err: any) => String(err?.code || '').toUpperCase() === '42P01';

export const useWarehouses = () => {
    const { user } = useAuth();
    const sellerId = user?.role === 'seller' ? user.id : null;

    const [rows, setRows] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(false);
    const [setupError, setSetupError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!sellerId) return;
        setLoading(true);
        setSetupError(null);
        try {
            const { data, error } = await supabase
                .from('warehouses')
                .select('*')
                .eq('seller_id', sellerId)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });
            if (error) {
                if (isMissingTableError(error)) {
                    setSetupError('Tabel `warehouses` belum ada. Jalankan SQL: `backend/supabase/sql/24_warehouses_variants.sql`.');
                } else {
                    console.error('Warehouses fetch error:', error.message);
                }
                setRows([]);
                return;
            }
            setRows((data || []) as Warehouse[]);
        } finally {
            setLoading(false);
        }
    }, [sellerId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const defaultWarehouse = useMemo(() => rows.find(r => r.is_default) || null, [rows]);

    const create = useCallback(
        async (payload: Pick<Warehouse, 'name' | 'location'> & { is_default?: boolean }) => {
            if (!sellerId) throw new Error('Sesi seller tidak ditemukan.');
            if (payload.is_default) {
                const { error: resetError } = await supabase.from('warehouses').update({ is_default: false }).eq('seller_id', sellerId);
                if (resetError) throw resetError;
            }
            const { error } = await supabase.from('warehouses').insert([
                {
                    seller_id: sellerId,
                    name: payload.name,
                    location: payload.location,
                    is_default: Boolean(payload.is_default)
                }
            ]);
            if (error) throw error;
            await refresh();
        },
        [refresh, sellerId]
    );

    const update = useCallback(
        async (id: string, updates: Partial<Pick<Warehouse, 'name' | 'location' | 'is_default'>>) => {
            if (!sellerId) throw new Error('Sesi seller tidak ditemukan.');
            if (updates.is_default) {
                const { error: resetError } = await supabase.from('warehouses').update({ is_default: false }).eq('seller_id', sellerId);
                if (resetError) throw resetError;
            }
            const { data, error } = await supabase
                .from('warehouses')
                .update(updates)
                .eq('id', id)
                .eq('seller_id', sellerId)
                .select('id');
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Gudang tidak ditemukan atau tidak bisa diubah.');
            await refresh();
        },
        [refresh, sellerId]
    );

    const remove = useCallback(
        async (id: string) => {
            if (!sellerId) throw new Error('Sesi seller tidak ditemukan.');
            const { data, error } = await supabase.from('warehouses').delete().eq('id', id).eq('seller_id', sellerId).select('id');
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Gudang tidak ditemukan atau tidak bisa dihapus.');
            await refresh();
        },
        [refresh, sellerId]
    );

    return { rows, loading, setupError, refresh, defaultWarehouse, create, update, remove };
};
