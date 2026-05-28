import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import type { Subscription, SubscriptionFrequency } from '../../types';

const isMissingTableError = (err: any) => String(err?.code || '').toUpperCase() === '42P01';

export const useSubscriptions = () => {
    const { user } = useAuth();
    const buyerId = user?.role === 'buyer' ? user.id : null;

    const [rows, setRows] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(false);
    const [setupError, setSetupError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!buyerId) return;
        setLoading(true);
        setSetupError(null);
        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('buyer_id', buyerId)
                .order('created_at', { ascending: false });
            if (error) {
                if (isMissingTableError(error)) {
                    setSetupError('Tabel `subscriptions` belum ada. Jalankan SQL: `backend/supabase/sql/29_subscriptions.sql`.');
                } else {
                    console.error('Subscriptions fetch error:', error.message);
                }
                setRows([]);
                return;
            }
            setRows((data || []) as Subscription[]);
        } finally {
            setLoading(false);
        }
    }, [buyerId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const create = useCallback(
        async (payload: {
            item_id: string;
            quantity: number;
            frequency: SubscriptionFrequency;
            shipping_address_id?: string | null;
            notes?: string | null;
            coupon_code?: string | null;
        }) => {
            if (!buyerId) throw new Error('Sesi buyer tidak ditemukan.');
            const { error } = await supabase.from('subscriptions').insert([
                {
                    buyer_id: buyerId,
                    item_id: payload.item_id,
                    quantity: payload.quantity,
                    frequency: payload.frequency,
                    shipping_address_id: payload.shipping_address_id ?? null,
                    notes: payload.notes ?? null,
                    coupon_code: payload.coupon_code ?? null,
                    is_active: true
                }
            ]);
            if (error) throw error;
            await refresh();
        },
        [buyerId, refresh]
    );

    const update = useCallback(
        async (id: string, updates: Partial<Pick<Subscription, 'quantity' | 'frequency' | 'is_active' | 'notes' | 'coupon_code' | 'shipping_address_id'>>) => {
            if (!buyerId) throw new Error('Sesi buyer tidak ditemukan.');
            const { data, error } = await supabase
                .from('subscriptions')
                .update(updates)
                .eq('id', id)
                .eq('buyer_id', buyerId)
                .select('id');
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Subscription tidak ditemukan atau tidak bisa diubah.');
            await refresh();
        },
        [buyerId, refresh]
    );

    const remove = useCallback(
        async (id: string) => {
            if (!buyerId) throw new Error('Sesi buyer tidak ditemukan.');
            const { data, error } = await supabase.from('subscriptions').delete().eq('id', id).eq('buyer_id', buyerId).select('id');
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Subscription tidak ditemukan atau tidak bisa dihapus.');
            await refresh();
        },
        [buyerId, refresh]
    );

    const runNow = useCallback(
        async (subscriptionId: string) => {
            const { data, error } = await supabase.rpc('create_order_from_subscription', { p_subscription_id: subscriptionId });
            if (error) throw error;
            return data as string;
        },
        []
    );

    return { rows, loading, setupError, refresh, create, update, remove, runNow };
};

