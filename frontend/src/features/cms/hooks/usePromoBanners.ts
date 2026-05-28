import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../supabase';
import type { PromoBanner } from '../types';

export const usePromoBanners = () => {
    const [banners, setBanners] = useState<PromoBanner[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: qErr } = await supabase
                .from('promo_banners')
                .select('*')
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: false });
            if (qErr) throw qErr;
            setBanners((data || []) as PromoBanner[]);
        } catch (e: any) {
            setBanners([]);
            setError(e?.message || 'Gagal memuat promo banners.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { banners, loading, error, refresh };
};

