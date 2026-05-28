import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../supabase';
import type { MarketplaceCategory } from '../types';

export const useMarketplaceCategories = () => {
    const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: qErr } = await supabase
                .from('marketplace_categories')
                .select('*')
                .order('sort_order', { ascending: true })
                .order('name', { ascending: true });
            if (qErr) throw qErr;
            setCategories((data || []) as MarketplaceCategory[]);
        } catch (e: any) {
            setCategories([]);
            setError(e?.message || 'Gagal memuat categories.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { categories, loading, error, refresh };
};

