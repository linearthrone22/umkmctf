import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';

export const useSellerVerificationMap = (sellerIds: string[]) => {
    const [bySellerId, setBySellerId] = useState<Map<string, boolean>>(new Map());

    const unique = useMemo(() => [...new Set(sellerIds.filter(Boolean))], [sellerIds]);

    useEffect(() => {
        const run = async () => {
            if (unique.length === 0) {
                setBySellerId(new Map());
                return;
            }
            const { data, error } = await supabase.from('profiles').select('id, is_verified').in('id', unique);
            if (error) {
                setBySellerId(new Map());
                return;
            }
            const map = new Map<string, boolean>();
            (data || []).forEach((row: any) => map.set(String(row.id), !!row.is_verified));
            setBySellerId(map);
        };
        void run();
    }, [unique.join('|')]);

    return { bySellerId };
};

