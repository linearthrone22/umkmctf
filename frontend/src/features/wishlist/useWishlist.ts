import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';

interface WishlistRow {
    id: string;
    buyer_id: string;
    item_id: string;
    created_at: string;
}

export const useWishlist = () => {
    const { user } = useAuth();
    const [rows, setRows] = useState<WishlistRow[]>([]);
    const [loading, setLoading] = useState(false);

    const buyerId = user?.id || null;

    const refresh = useCallback(async () => {
        if (!buyerId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('wishlists')
                .select('id,buyer_id,item_id,created_at')
                .eq('buyer_id', buyerId)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Wishlist fetch error:', error.message);
                setRows([]);
                return;
            }
            setRows((data || []) as WishlistRow[]);
        } finally {
            setLoading(false);
        }
    }, [buyerId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const itemIds = useMemo(() => new Set(rows.map(r => r.item_id)), [rows]);

    const isWishlisted = useCallback((itemId: string) => itemIds.has(itemId), [itemIds]);

    const add = useCallback(
        async (itemId: string) => {
            if (!buyerId) throw new Error('Sesi buyer tidak ditemukan.');
            const { error } = await supabase.from('wishlists').insert([{ buyer_id: buyerId, item_id: itemId }]);
            if (error) throw error;
            await refresh();
        },
        [buyerId, refresh]
    );

    const remove = useCallback(
        async (itemId: string) => {
            if (!buyerId) throw new Error('Sesi buyer tidak ditemukan.');
            const { error } = await supabase.from('wishlists').delete().eq('buyer_id', buyerId).eq('item_id', itemId);
            if (error) throw error;
            await refresh();
        },
        [buyerId, refresh]
    );

    const toggle = useCallback(
        async (itemId: string) => {
            if (isWishlisted(itemId)) {
                await remove(itemId);
            } else {
                await add(itemId);
            }
        },
        [add, isWishlisted, remove]
    );

    return { rows, itemIds, loading, refresh, isWishlisted, add, remove, toggle };
};
