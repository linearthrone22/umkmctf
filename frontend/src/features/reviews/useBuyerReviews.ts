import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';

export interface ReviewRow {
    id: string;
    buyer_id: string;
    seller_id: string;
    item_id: string;
    order_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

export const useBuyerReviews = () => {
    const { user } = useAuth();
    const buyerId = user?.id || null;
    const [rows, setRows] = useState<ReviewRow[]>([]);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!buyerId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('buyer_id', buyerId)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Reviews fetch error:', error.message);
                setRows([]);
                return;
            }
            setRows((data || []) as ReviewRow[]);
        } finally {
            setLoading(false);
        }
    }, [buyerId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const byOrderId = useMemo(() => {
        const map = new Map<string, ReviewRow>();
        for (const r of rows) map.set(String(r.order_id), r);
        return map;
    }, [rows]);

    const create = useCallback(
        async (payload: Omit<ReviewRow, 'id' | 'buyer_id' | 'created_at'>) => {
            if (!buyerId) throw new Error('Sesi buyer tidak ditemukan.');
            const { error } = await supabase.from('reviews').insert([{ buyer_id: buyerId, ...payload }]);
            if (error) throw error;
            await refresh();
        },
        [buyerId, refresh]
    );

    return { rows, byOrderId, loading, refresh, create };
};

