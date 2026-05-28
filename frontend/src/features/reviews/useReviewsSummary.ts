import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';

export const useReviewsSummary = (itemIds: string[]) => {
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<Array<{ item_id: string; rating: number }>>([]);

    useEffect(() => {
        const run = async () => {
            const ids = itemIds.filter(Boolean);
            if (ids.length === 0) {
                setRows([]);
                return;
            }
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('reviews')
                    .select('item_id,rating')
                    .in('item_id', ids);
                if (error) {
                    console.error('Reviews summary fetch error:', error.message);
                    setRows([]);
                    return;
                }
                setRows((data || []) as any);
            } finally {
                setLoading(false);
            }
        };
        void run();
    }, [itemIds.join('|')]);

    const summaryByItemId = useMemo(() => {
        const map = new Map<string, { avg: number; count: number }>();
        for (const r of rows) {
            const key = String(r.item_id);
            const curr = map.get(key) || { avg: 0, count: 0 };
            const nextCount = curr.count + 1;
            const nextAvg = (curr.avg * curr.count + Number(r.rating || 0)) / nextCount;
            map.set(key, { avg: nextAvg, count: nextCount });
        }
        return map;
    }, [rows]);

    return { loading, summaryByItemId };
};

