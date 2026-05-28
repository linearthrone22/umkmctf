import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';

export interface AddressRow {
    id: string;
    buyer_id: string;
    label: string;
    address_text: string;
    location: string; // "lat, lng" recommended
    is_default: boolean;
    created_at: string;
}

export const useAddresses = () => {
    const { user } = useAuth();
    const buyerId = user?.id || null;
    const [rows, setRows] = useState<AddressRow[]>([]);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!buyerId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('addresses')
                .select('*')
                .eq('buyer_id', buyerId)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Addresses fetch error:', error.message);
                setRows([]);
                return;
            }
            setRows((data || []) as AddressRow[]);
        } finally {
            setLoading(false);
        }
    }, [buyerId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const defaultAddress = useMemo(() => rows.find(r => r.is_default) || null, [rows]);

    const create = useCallback(
        async (payload: Pick<AddressRow, 'label' | 'address_text' | 'location'>) => {
            if (!buyerId) throw new Error('Sesi buyer tidak ditemukan.');
            const { error } = await supabase.from('addresses').insert([{ buyer_id: buyerId, ...payload }]);
            if (error) throw error;
            await refresh();
        },
        [buyerId, refresh]
    );

    const update = useCallback(
        async (id: string, updates: Partial<Pick<AddressRow, 'label' | 'address_text' | 'location'>>) => {
            if (!buyerId) throw new Error('Sesi buyer tidak ditemukan.');
            const { data, error } = await supabase
                .from('addresses')
                .update(updates)
                .eq('id', id)
                .eq('buyer_id', buyerId)
                .select('id');
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Alamat tidak ditemukan atau tidak bisa diubah.');
            await refresh();
        },
        [buyerId, refresh]
    );

    const remove = useCallback(
        async (id: string) => {
            if (!buyerId) throw new Error('Sesi buyer tidak ditemukan.');
            const { data, error } = await supabase.from('addresses').delete().eq('id', id).eq('buyer_id', buyerId).select('id');
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Alamat tidak ditemukan atau tidak bisa dihapus.');
            await refresh();
        },
        [buyerId, refresh]
    );

    const setDefault = useCallback(
        async (id: string) => {
            if (!buyerId) throw new Error('Sesi buyer tidak ditemukan.');
            const { error: resetError } = await supabase.from('addresses').update({ is_default: false }).eq('buyer_id', buyerId);
            if (resetError) throw resetError;
            const { data, error } = await supabase
                .from('addresses')
                .update({ is_default: true })
                .eq('id', id)
                .eq('buyer_id', buyerId)
                .select('id');
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Alamat tidak ditemukan atau tidak bisa diubah.');
            await refresh();
        },
        [buyerId, refresh]
    );

    return { rows, loading, refresh, defaultAddress, create, update, remove, setDefault };
};
