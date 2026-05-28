import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import type { SellerAvailability } from '../../types';

const isMissingTableError = (err: any) => String(err?.code || '').toUpperCase() === '42P01';

const normalizeRow = (row: any): SellerAvailability => ({
    seller_id: String(row.seller_id),
    allows_preorder: Boolean(row.allows_preorder),
    lead_days: Number(row.lead_days || 0),
    cutoff_time: row.cutoff_time ?? null,
    closed_weekdays: Array.isArray(row.closed_weekdays) ? row.closed_weekdays.map((x: any) => Number(x)) : [],
    holidays: Array.isArray(row.holidays) ? row.holidays.map((x: any) => String(x)) : [],
    timezone: String(row.timezone || 'Asia/Jakarta'),
    updated_at: String(row.updated_at || new Date().toISOString())
});

export const useMyAvailability = () => {
    const { user } = useAuth();
    const sellerId = user?.role === 'seller' ? user.id : null;

    const [row, setRow] = useState<SellerAvailability | null>(null);
    const [loading, setLoading] = useState(false);
    const [setupError, setSetupError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!sellerId) return;
        setLoading(true);
        setSetupError(null);
        try {
            const { data, error } = await supabase.from('seller_availability').select('*').eq('seller_id', sellerId).maybeSingle();
            if (error) {
                if (isMissingTableError(error)) {
                    setSetupError('Tabel `seller_availability` belum ada. Jalankan SQL: `backend/supabase/sql/25_seller_availability.sql`.');
                } else {
                    console.error('Availability fetch error:', error.message);
                }
                setRow(null);
                return;
            }
            setRow(data ? normalizeRow(data) : null);
        } finally {
            setLoading(false);
        }
    }, [sellerId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const upsert = useCallback(
        async (updates: Partial<SellerAvailability>) => {
            if (!sellerId) throw new Error('Sesi seller tidak ditemukan.');
            const payload: any = { seller_id: sellerId, ...updates };
            const { error } = await supabase.from('seller_availability').upsert([payload], { onConflict: 'seller_id' });
            if (error) throw error;
            await refresh();
        },
        [refresh, sellerId]
    );

    return { row, loading, setupError, refresh, upsert };
};

export const useAvailabilityMap = (sellerIds: string[]) => {
    const idsKey = useMemo(() => [...new Set(sellerIds.filter(Boolean))].sort().join(','), [sellerIds]);
    const [rows, setRows] = useState<SellerAvailability[]>([]);

    useEffect(() => {
        const ids = idsKey ? idsKey.split(',') : [];
        if (ids.length === 0) {
            setRows([]);
            return;
        }
        let cancelled = false;
        (async () => {
            const { data, error } = await supabase.from('seller_availability').select('*').in('seller_id', ids);
            if (cancelled) return;
            if (error) {
                if (!isMissingTableError(error)) {
                    console.error('Availability map fetch error:', error.message);
                }
                setRows([]);
                return;
            }
            setRows(((data || []) as any[]).map(normalizeRow));
        })();
        return () => {
            cancelled = true;
        };
    }, [idsKey]);

    const bySellerId = useMemo(() => new Map(rows.map(r => [r.seller_id, r])), [rows]);
    return { rows, bySellerId };
};

