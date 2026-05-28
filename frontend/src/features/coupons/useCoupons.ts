import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import type { Coupon, CouponDiscountType } from '../../types';

const isMissingTableError = (err: any) => String(err?.code || '').toUpperCase() === '42P01';

export const useSellerCoupons = () => {
    const { user } = useAuth();
    const sellerId = user?.role === 'seller' ? user.id : null;

    const [rows, setRows] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(false);
    const [setupError, setSetupError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!sellerId) return;
        setLoading(true);
        setSetupError(null);
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('seller_id', sellerId)
                .order('created_at', { ascending: false });
            if (error) {
                if (isMissingTableError(error)) {
                    setSetupError('Tabel `coupons` belum ada. Jalankan SQL: `backend/supabase/sql/27_coupons.sql`.');
                } else {
                    console.error('Coupons fetch error:', error.message);
                }
                setRows([]);
                return;
            }
            setRows((data || []) as Coupon[]);
        } finally {
            setLoading(false);
        }
    }, [sellerId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const create = useCallback(
        async (payload: { code: string; discount_type: CouponDiscountType; amount: number; min_qty?: number; valid_to?: string | null }) => {
            if (!sellerId) throw new Error('Sesi seller tidak ditemukan.');
            const { error } = await supabase.from('coupons').insert([
                {
                    seller_id: sellerId,
                    code: payload.code.trim(),
                    discount_type: payload.discount_type,
                    amount: payload.amount,
                    min_qty: payload.min_qty ?? 0,
                    valid_to: payload.valid_to ?? null,
                    is_active: true
                }
            ]);
            if (error) throw error;
            await refresh();
        },
        [refresh, sellerId]
    );

    const update = useCallback(
        async (id: string, updates: Partial<Pick<Coupon, 'is_active' | 'amount' | 'min_qty' | 'valid_to'>>) => {
            if (!sellerId) throw new Error('Sesi seller tidak ditemukan.');
            const { data, error } = await supabase
                .from('coupons')
                .update(updates)
                .eq('id', id)
                .eq('seller_id', sellerId)
                .select('id');
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Kupon tidak ditemukan atau tidak bisa diubah.');
            await refresh();
        },
        [refresh, sellerId]
    );

    const remove = useCallback(
        async (id: string) => {
            if (!sellerId) throw new Error('Sesi seller tidak ditemukan.');
            const { data, error } = await supabase.from('coupons').delete().eq('id', id).eq('seller_id', sellerId).select('id');
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Kupon tidak ditemukan atau tidak bisa dihapus.');
            await refresh();
        },
        [refresh, sellerId]
    );

    return { rows, loading, setupError, refresh, create, update, remove };
};

export const useCouponValidator = () => {
    const [loading, setLoading] = useState(false);
    const [setupError, setSetupError] = useState<string | null>(null);

    const validate = useCallback(async (code: string) => {
        const trimmed = code.trim();
        if (!trimmed) return { coupon: null as Coupon | null, reason: 'empty' as const };
        setLoading(true);
        setSetupError(null);
        try {
            const { data, error } = await supabase.from('coupons').select('*').ilike('code', trimmed).limit(1);
            if (error) {
                if (isMissingTableError(error)) {
                    setSetupError('Tabel `coupons` belum ada. Jalankan SQL: `backend/supabase/sql/27_coupons.sql`.');
                } else {
                    console.error('Coupon validate error:', error.message);
                }
                return { coupon: null, reason: 'error' as const };
            }
            const coupon = (data && data.length > 0 ? (data[0] as Coupon) : null) as Coupon | null;
            if (!coupon) return { coupon: null, reason: 'not_found' as const };
            if (!coupon.is_active) return { coupon: null, reason: 'inactive' as const };
            return { coupon, reason: 'ok' as const };
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, setupError, validate };
};

export const computeCouponDiscount = (args: {
    coupon: Coupon;
    subtotal: number;
    totalQty: number;
}) => {
    const subtotal = Math.max(0, Number(args.subtotal || 0));
    const totalQty = Math.max(0, Number(args.totalQty || 0));
    const minQty = Math.max(0, Number(args.coupon.min_qty || 0));
    if (totalQty < minQty) return 0;

    const amount = Math.max(0, Number(args.coupon.amount || 0));
    if (args.coupon.discount_type === 'percent') {
        return Math.min(subtotal, subtotal * (amount / 100));
    }
    if (args.coupon.discount_type === 'fixed_per_kg') {
        return Math.min(subtotal, totalQty * amount);
    }
    return 0;
};
