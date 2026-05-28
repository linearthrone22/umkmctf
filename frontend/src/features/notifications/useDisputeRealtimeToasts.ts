import { useEffect } from 'react';
import { supabase } from '../../supabase';
import type { User } from '../../types';

export const useDisputeRealtimeToasts = (
    user: User | null,
    push: (toast: { type: 'success' | 'info' | 'error'; title: string; message?: string }) => void
) => {
    useEffect(() => {
        if (!user) return;

        const filter = user.role === 'seller' ? `seller_id=eq.${user.id}` : `buyer_id=eq.${user.id}`;

        const channel = supabase
            .channel(`disputes-toasts:${user.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'disputes', filter }, payload => {
                const row = payload.new as any;
                if (user.role === 'seller') {
                    push({ type: 'info', title: 'Komplain masuk', message: row.subject || 'Dispute baru' });
                } else {
                    push({ type: 'success', title: 'Komplain terkirim', message: row.subject || 'Dispute dibuat' });
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'disputes', filter }, payload => {
                const row = payload.new as any;
                push({ type: 'info', title: 'Update komplain', message: `Status: ${row.status}` });
            })
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [push, user]);
};

