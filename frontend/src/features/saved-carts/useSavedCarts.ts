import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import type { SavedCart } from '../../types';

const isMissingTableError = (err: any) => String(err?.code || '').toUpperCase() === '42P01';

export interface SavedCartLine {
    item_id: string;
    quantity: number;
}

export interface SavedCartPayload {
    lines: SavedCartLine[];
    notes?: string | null;
    coupon_code?: string | null;
}

export const useSavedCarts = () => {
    const { user } = useAuth();
    const buyerId = user?.role === 'buyer' ? user.id : null;

    const [rows, setRows] = useState<SavedCart[]>([]);
    const [loading, setLoading] = useState(false);
    const [setupError, setSetupError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!buyerId) return;
        setLoading(true);
        setSetupError(null);
        try {
            const { data, error } = await supabase
                .from('saved_carts')
                .select('*')
                .eq('buyer_id', buyerId)
                .order('is_default', { ascending: false })
                .order('updated_at', { ascending: false });
            if (error) {
                if (isMissingTableError(error)) {
                    setSetupError('Tabel `saved_carts` belum ada. Jalankan SQL: `backend/supabase/sql/26_saved_carts.sql`.');
                } else {
                    console.error('Saved carts fetch error:', error.message);
                }
                setRows([]);
                return;
            }
            setRows((data || []) as SavedCart[]);
        } finally {
            setLoading(false);
        }
    }, [buyerId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const defaultCart = useMemo(() => rows.find(r => r.is_default) || null, [rows]);

    const create = useCallback(
        async (name: string, cart: SavedCartPayload, opts?: { is_default?: boolean }) => {
            if (!buyerId) throw new Error('Sesi buyer tidak ditemukan.');
            const isDefault = Boolean(opts?.is_default);
            if (isDefault) {
                const { error: resetError } = await supabase.from('saved_carts').update({ is_default: false }).eq('buyer_id', buyerId);
                if (resetError) throw resetError;
            }
            const { error } = await supabase.from('saved_carts').insert([{ buyer_id: buyerId, name, cart, is_default: isDefault }]);
            if (error) throw error;
            await refresh();
        },
        [buyerId, refresh]
    );

    const update = useCallback(
        async (id: string, updates: Partial<Pick<SavedCart, 'name' | 'is_default'>> & { cart?: SavedCartPayload }) => {
            if (!buyerId) throw new Error('Sesi buyer tidak ditemukan.');
            if (updates.is_default) {
                const { error: resetError } = await supabase.from('saved_carts').update({ is_default: false }).eq('buyer_id', buyerId);
                if (resetError) throw resetError;
            }
            const { data, error } = await supabase
                .from('saved_carts')
                .update({ ...updates })
                .eq('id', id)
                .eq('buyer_id', buyerId)
                .select('id');
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Saved cart tidak ditemukan atau tidak bisa diubah.');
            await refresh();
        },
        [buyerId, refresh]
    );

    const remove = useCallback(
        async (id: string) => {
            if (!buyerId) throw new Error('Sesi buyer tidak ditemukan.');
            const { data, error } = await supabase.from('saved_carts').delete().eq('id', id).eq('buyer_id', buyerId).select('id');
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Saved cart tidak ditemukan atau tidak bisa dihapus.');
            await refresh();
        },
        [buyerId, refresh]
    );

    return { rows, loading, setupError, refresh, defaultCart, create, update, remove };
};

