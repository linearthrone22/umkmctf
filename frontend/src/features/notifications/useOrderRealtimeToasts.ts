import { useEffect } from 'react';
import { supabase } from '../../supabase';
import type { User } from '../../types';

export const useOrderRealtimeToasts = (
    user: User | null,
    push: (toast: { type: 'success' | 'info' | 'error'; title: string; message?: string }) => void
) => {
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`orders-toasts:${user.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders', filter: user.role === 'seller' ? `seller_id=eq.${user.id}` : `buyer_id=eq.${user.id}` },
                payload => {
                    const row = payload.new as any;
                    if (user.role === 'seller') {
                        push({ type: 'success', title: 'Order masuk', message: `Qty ${row.quantity} kg • Status ${row.status}` });
                    } else {
                        push({ type: 'info', title: 'Order dibuat', message: `Qty ${row.quantity} kg • Status ${row.status}` });
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders', filter: user.role === 'seller' ? `seller_id=eq.${user.id}` : `buyer_id=eq.${user.id}` },
                payload => {
                    const row = payload.new as any;
                    push({ type: 'info', title: 'Update order', message: `Status sekarang: ${row.status}` });
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [push, user]);
};

