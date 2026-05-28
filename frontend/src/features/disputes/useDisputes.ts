import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import type { Dispute } from './types';

export const useDisputes = () => {
    const { user } = useAuth();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        setError(null);
        try {
            let q = supabase.from('disputes').select('*').order('created_at', { ascending: false });
            if (user.role === 'buyer') q = q.eq('buyer_id', user.id);
            else if (user.role === 'seller') q = q.eq('seller_id', user.id);
            // admin: no filter
            const { data, error: qErr } = await q;
            if (qErr) throw qErr;
            setDisputes((data || []) as Dispute[]);
        } catch (e: any) {
            setDisputes([]);
            setError(e?.message || 'Gagal memuat disputes.');
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.role]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const latestByOrderId = useMemo(() => {
        const map = new Map<string, Dispute>();
        for (const d of disputes) {
            if (!map.has(d.order_id)) map.set(d.order_id, d);
        }
        return map;
    }, [disputes]);

    const createDispute = useCallback(async (input: { orderId: string; subject: string; message: string }) => {
        const { orderId, subject, message } = input;
        const { error } = await supabase.from('disputes').insert([
            {
                order_id: orderId,
                subject,
                buyer_message: message
            }
        ]);
        if (error) throw error;
        await refresh();
    }, [refresh]);

    const respondDispute = useCallback(async (input: { disputeId: string; response: string }) => {
        const { disputeId, response } = input;
        const { data, error } = await supabase
            .from('disputes')
            .update({ seller_response: response, status: 'waiting_admin' })
            .eq('id', disputeId)
            .select('id');
        if (error) throw error;
        if (!data || data.length === 0) {
            throw new Error('Dispute tidak ditemukan atau tidak bisa diubah.');
        }
        await refresh();
    }, [refresh]);

    const decideDispute = useCallback(async (input: { disputeId: string; status: 'resolved' | 'rejected'; decision: string; note?: string }) => {
        const { disputeId, status, decision, note } = input;
        const { data, error } = await supabase
            .from('disputes')
            .update({
                status,
                admin_decision: decision,
                admin_note: note ?? null
            })
            .eq('id', disputeId)
            .select('id');
        if (error) throw error;
        if (!data || data.length === 0) {
            throw new Error('Dispute tidak ditemukan atau tidak bisa diubah.');
        }
        await refresh();
    }, [refresh]);

    return { disputes, latestByOrderId, loading, error, refresh, createDispute, respondDispute, decideDispute };
};

