import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import type { RefundRequest } from './types';

export const useRefundRequests = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<RefundRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canLoad = useMemo(() => !!user?.id, [user?.id]);

    const refresh = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        setError(null);
        try {
            let q = supabase.from('refund_requests').select('*').order('created_at', { ascending: false });
            if (user.role === 'seller') q = q.eq('seller_id', user.id);
            else q = q.eq('buyer_id', user.id);

            const { data, error: qErr } = await q;
            if (qErr) throw qErr;
            setRequests((data || []) as RefundRequest[]);
        } catch (e: any) {
            setRequests([]);
            setError(e?.message || 'Gagal memuat refund requests.');
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.role]);

    useEffect(() => {
        if (!canLoad) return;
        void refresh();
    }, [canLoad, refresh]);

    return { requests, loading, error, refresh };
};

