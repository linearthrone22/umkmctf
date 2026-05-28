import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';
import type { Product, CartItem, Order, Shipment, Stakeholder } from '../types';

interface AppContextType {
    products: Product[];
    orders: Order[];
    shipments: Shipment[];
    stakeholders: Stakeholder[];
    publishProduct: (product: Omit<Product, 'id' | 'seller_id'>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    updateStock: (id: string, newStock: number) => Promise<void>;
    updateProductImage: (id: string, imageUrl: string) => Promise<void>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
    addToCart: (product: Product) => void;
    removeFromCart: (id: string) => void;
    updateCartQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    checkout: (
        cart: CartItem[],
        meta?: { shipping_address_id?: string | null; notes?: string | null; coupon_code?: string | null }
    ) => Promise<void>;
    cancelOrder: (id: string) => Promise<void>;
    deleteOrder: (id: string) => Promise<void>;
    updateOrderStatus: (id: string, status: string) => Promise<void>;
    saveShipment: (input: any) => Promise<void>;
    deleteShipment: (id: string) => Promise<void>;
    clearOrderHistory: () => Promise<void>;
    clearShipmentHistory: () => Promise<void>;
    cart: CartItem[];
    refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MOCK_STAKEHOLDERS: Stakeholder[] = [
    { id: '1', name: 'Gudang Pusat Bandung', location: '-6.9147, 107.6098', capacity: 1000, type: 'warehouse' },
    { id: '2', name: 'Distributor Jakarta', location: '-6.2088, 106.8456', capacity: 500, type: 'distributor' },
    { id: '3', name: 'Pasar Induk Bogor', location: '-6.5971, 106.8060', capacity: 300, type: 'market' }
];

interface ProfileRow {
    id: string;
    username: string;
    role: 'buyer' | 'seller';
    location: string | null;
    business_name?: string | null;
    business_address?: string | null;
    tax_id?: string | null;
    is_verified?: boolean | null;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);

    const refreshData = async () => {
        if (!user) return;
        try {
            // Fetch Products
            const fetchProducts = async () => {
                const base = supabase.from('items').select('*');

                if (user.role === 'seller') {
                    return base.eq('seller_id', user.id);
                }
                if (user.role === 'admin') {
                    return base;
                }

                // buyer: only active + (if exists) approved listings
                const attempt = await base.eq('is_active', true).eq('moderation_status', 'approved');
                if (!attempt.error) return attempt;

                const msg = String(attempt.error?.message || '');
                const maybeMissingColumn = msg.toLowerCase().includes('moderation_status') || msg.toLowerCase().includes('column');
                if (!maybeMissingColumn) return attempt;

                return supabase.from('items').select('*').eq('is_active', true);
            };

            const { data: productsData, error: productsError } = await fetchProducts();
            if (productsError) {
                console.error('Gagal mengambil data produk:', productsError.message);
            }
            if (productsData) setProducts(productsData as Product[]);

            // Fetch Orders (tanpa nested relation agar tidak bergantung FK PostgREST)
            const fetchOrders = async () => {
                let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
                if (user.role === 'seller') q = q.eq('seller_id', user.id);
                else if (user.role === 'buyer') q = q.eq('buyer_id', user.id);
                // admin: no filter

                // Optional soft delete column: buyer hides history without deleting row
                if (user.role === 'buyer') {
                    const attempt = await q.eq('is_deleted_by_buyer', false);
                    if (!attempt.error) return attempt;
                    const msg = String(attempt.error?.message || '').toLowerCase();
                    const maybeMissingColumn = msg.includes('is_deleted_by_buyer') || msg.includes('column');
                    if (!maybeMissingColumn) return attempt;
                }
                return q;
            };

            const { data: ordersData, error: ordersError } = await fetchOrders();
            if (ordersError) {
                console.error('Gagal mengambil data order:', ordersError.message);
                setOrders([]);
            } else if (ordersData && Array.isArray(ordersData)) {
                const itemIds = [...new Set(ordersData.map((o: any) => o.item_id).filter(Boolean))];
                const userIds = [
                    ...new Set(
                        ordersData
                            .flatMap((o: any) => [o.seller_id, o.buyer_id])
                            .filter(Boolean)
                    )
                ];

                const [itemsRes, profilesRes] = await Promise.all([
                    itemIds.length > 0
                        ? supabase.from('items').select('id, commodity, image_url').in('id', itemIds)
                        : Promise.resolve({ data: [], error: null }),
                    userIds.length > 0
                        ? supabase.from('profiles').select('id, username, location').in('id', userIds)
                        : Promise.resolve({ data: [], error: null })
                ]);

                if (itemsRes.error) {
                    console.error('Gagal mengambil detail item order:', itemsRes.error.message);
                }
                if (profilesRes.error) {
                    console.error('Gagal mengambil profil order:', profilesRes.error.message);
                }

                const itemMap = new Map(
                    (itemsRes.data || []).map((item: any) => [String(item.id), item])
                );
                const profileMap = new Map(
                    (profilesRes.data || []).map((profile: any) => [String(profile.id), profile])
                );

                setOrders(ordersData.map((o: any) => {
                    const item = itemMap.get(String(o.item_id));
                    const sellerProfile = profileMap.get(String(o.seller_id));
                    const buyerProfile = profileMap.get(String(o.buyer_id));

                    return {
                        ...o,
                        commodity: item?.commodity || 'Produk',
                        image_url: item?.image_url || '',
                        seller_name: sellerProfile?.username || 'Seller',
                        seller_location: sellerProfile?.location || '',
                        buyer_name: buyerProfile?.username || 'Buyer',
                        buyer_location: buyerProfile?.location || '-6.91, 107.61'
                    };
                }));
            }

            // Fetch Shipments
            let shipmentsQuery = supabase.from('shipments').select('*').order('created_at', { ascending: false });
            if (user.role === 'seller') {
                shipmentsQuery = shipmentsQuery.eq('seller_id', user.id);
            } else if (user.role !== 'admin') {
                shipmentsQuery = shipmentsQuery.eq('seller_id', user.id);
            }
            const { data: shipmentsData } = await shipmentsQuery;
            if (shipmentsData && Array.isArray(shipmentsData)) {
                setShipments(shipmentsData as Shipment[]);
            }
        } catch (err) {
            console.error("Gagal sinkronisasi data:", err);
        }
    };

    useEffect(() => {
        refreshData();
    }, [user]);

    const getSessionAndProfile = async () => {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error('Session Supabase tidak ditemukan. Silakan login ulang.');

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, role, location, business_name, business_address, tax_id, is_verified')
            .eq('id', session.user.id)
            .single();
        if (profileError) throw profileError;
        if (!profile) throw new Error('Profil user tidak ditemukan.');

        return { session, profile: profile as ProfileRow };
    };

    const syncSessionMetadata = async (session: Session, profile: ProfileRow) => {
        const currentMeta = session.user.user_metadata || {};
        const nextMeta = {
            username: profile.username || 'User',
            role: profile.role,
            location: profile.location || '',
            business_name: profile.business_name ?? currentMeta.business_name ?? null,
            business_address: profile.business_address ?? currentMeta.business_address ?? null,
            tax_id: profile.tax_id ?? currentMeta.tax_id ?? null,
            is_verified: profile.is_verified ?? currentMeta.is_verified ?? null
        };

        const isMetadataOutdated =
            currentMeta.username !== nextMeta.username ||
            currentMeta.role !== nextMeta.role ||
            (currentMeta.location || '') !== nextMeta.location ||
            (currentMeta.business_name || null) !== nextMeta.business_name ||
            (currentMeta.business_address || null) !== nextMeta.business_address ||
            (currentMeta.tax_id || null) !== nextMeta.tax_id ||
            (currentMeta.is_verified ?? null) !== nextMeta.is_verified;

        if (isMetadataOutdated) {
            const { error: updateUserError } = await supabase.auth.updateUser({ data: nextMeta });
            if (updateUserError) throw updateUserError;

            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) throw refreshError;
        }
    };

    const ensureSellerAccessForItems = async () => {
        const { session, profile } = await getSessionAndProfile();
        if (profile.role !== 'seller') {
            throw new Error('Akun Anda bukan seller, tidak bisa publish produk.');
        }
        await syncSessionMetadata(session, profile);
        return session.user.id;
    };

    const ensureBuyerAccessForOrders = async () => {
        const { session, profile } = await getSessionAndProfile();
        if (profile.role !== 'buyer') {
            throw new Error('Akun Anda bukan buyer, tidak bisa checkout.');
        }
        await syncSessionMetadata(session, profile);
        return session.user.id;
    };

    const publishProduct = async (pData: Omit<Product, 'id' | 'seller_id'>) => {
        if (!user?.id) {
            throw new Error('Sesi login tidak valid. Silakan login ulang.');
        }

        const sellerId = await ensureSellerAccessForItems();

        const itemPayload = {
            umkm_name: pData.umkm_name,
            commodity: pData.commodity,
            stock: pData.stock,
            price: pData.price,
            location: pData.location,
            image_url: pData.image_url,
            seller_id: sellerId,
            sku: (pData as any).sku ?? null,
            variant_grade: (pData as any).variant_grade ?? null,
            variant_size: (pData as any).variant_size ?? null,
            variant_packaging: (pData as any).variant_packaging ?? null,
            warehouse_id: (pData as any).warehouse_id ?? null
        };

        const { error } = await supabase.from('items').insert([itemPayload]);
        if (error) throw error;
        await refreshData();
    };

    const deleteProduct = async (id: string) => {
        const sellerId = await ensureSellerAccessForItems();
        // Soft delete: avoid FK conflicts with orders referencing items.
        const { data, error } = await supabase
            .from('items')
            .update({ is_active: false })
            .eq('id', id)
            .eq('seller_id', sellerId)
            .select('id');
        if (error) throw error;
        if (!data || data.length === 0) {
            throw new Error('Produk tidak ditemukan atau tidak bisa dihapus.');
        }
        await refreshData();
    };

    const updateProduct = async (id: string, updates: Partial<Product>) => {
        const sellerId = await ensureSellerAccessForItems();
        const payload: any = { ...updates };

        if (typeof payload.stock === 'number') {
            const safeStock = Number.isFinite(payload.stock) ? Math.max(0, Math.floor(payload.stock)) : 0;
            payload.stock = safeStock;
            payload.is_active = safeStock > 0;
        }

        const { data, error } = await supabase
            .from('items')
            .update(payload)
            .eq('id', id)
            .eq('seller_id', sellerId)
            .select('id');
        if (error) throw error;
        if (!data || data.length === 0) {
            throw new Error('Produk tidak ditemukan atau tidak bisa diubah.');
        }
        await refreshData();
    };

    const updateStock = async (id: string, stock: number) => {
        await updateProduct(id, { stock });
    };

    const updateProductImage = async (id: string, image_url: string) => {
        await updateProduct(id, { image_url });
    };

    const logProductEvent = async (event_type: 'view' | 'click' | 'add_to_cart' | 'checkout', item_id: string, buyer_id: string) => {
        try {
            const { error } = await supabase.from('product_events').insert([{ buyer_id, item_id, event_type }]);
            if (error) {
                // Ignore missing table / RLS noise so it doesn't block main flow
                if (String((error as any)?.code || '').toUpperCase() !== '42P01') {
                    console.warn('product_events insert error:', error.message);
                }
            }
        } catch {
            // ignore
        }
    };

    const checkout = async (
        items: CartItem[],
        meta?: { shipping_address_id?: string | null; notes?: string | null; coupon_code?: string | null }
    ) => {
        if (!items.length) {
            throw new Error('Keranjang masih kosong.');
        }

        const buyerId = await ensureBuyerAccessForOrders();

        const orderEntriesBase = items.map(item => {
            const discount = Number(item.discount_per_kg || 0);
            const unitPrice = Math.max(0, Number(item.price || 0) - Math.max(0, discount));
            const qty = item.quantity || 1;
            return {
                buyer_id: buyerId,
                seller_id: item.seller_id,
                item_id: item.id,
                quantity: qty,
                total_price: unitPrice * qty,
                status: 'pending'
            };
        });

        const orderEntriesWithMeta = orderEntriesBase.map(entry => ({
            ...entry,
            shipping_address_id: meta?.shipping_address_id ?? null,
            notes: meta?.notes ?? null,
            coupon_code: meta?.coupon_code ?? null
        }));

        // Backward compatible: kalau kolom `shipping_address_id/notes` belum ada, retry insert tanpa meta.
        const attemptInsert = async (rows: any[]) => {
            const { error } = await supabase.from('orders').insert(rows);
            if (error) throw error;
        };

        try {
            await attemptInsert(orderEntriesWithMeta);
        } catch (err: any) {
            const msg = String(err?.message || '');
            const maybeMissingColumn = msg.includes('shipping_address_id') || msg.includes('notes') || msg.includes('coupon_code');
            if (!maybeMissingColumn) throw err;
            await attemptInsert(orderEntriesBase);
        }

        if (user?.role === 'buyer' && buyerId) {
            for (const item of items) {
                void logProductEvent('checkout', item.id, buyerId);
            }
        }

        setCart([]);
        await refreshData();
    };

    const cancelOrder = async (id: string) => {
        const buyerId = await ensureBuyerAccessForOrders();

        const { data, error } = await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .eq('buyer_id', buyerId)
            .eq('status', 'pending')
            .select('id');

        if (error) throw error;
        if (!data || data.length === 0) {
            throw new Error('Pesanan tidak ditemukan atau tidak bisa dibatalkan.');
        }

        await refreshData();
    };

    const deleteOrder = async (id: string) => {
        const buyerId = await ensureBuyerAccessForOrders();

        // Prefer soft delete if column exists
        const trySoft = async () => {
            const { data, error } = await supabase
                .from('orders')
                .update({ is_deleted_by_buyer: true })
                .eq('id', id)
                .eq('buyer_id', buyerId)
                .neq('status', 'pending')
                .select('id');
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Order tidak ditemukan atau tidak bisa diubah.');
        };

        try {
            await trySoft();
        } catch (err: any) {
            const msg = String(err?.message || '');
            const maybeMissingColumn = msg.toLowerCase().includes('is_deleted_by_buyer') || msg.toLowerCase().includes('column');
            if (!maybeMissingColumn) throw err;

            const { data, error } = await supabase
                .from('orders')
                .delete()
                .eq('id', id)
                .eq('buyer_id', buyerId)
                .neq('status', 'pending')
                .select('id');
            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error('Order tidak ditemukan atau tidak bisa dihapus. Pastikan bukan status pending, dan policy DELETE orders sudah ada di Supabase.');
            }
        }

        await refreshData();
    };

    const updateOrderStatus = async (id: string, status: string) => {
        const { error } = await supabase.from('orders').update({ status }).eq('id', id);
        if (error) throw error;
        await refreshData();
    };

    const saveShipment = async (input: any) => {
        const isObject = input && typeof input === 'object' && !Array.isArray(input);
        const payload = isObject && 'route_data' in input ? input : { route_data: input };

        const baseRow: any = {
            seller_id: user?.id,
            route_data: payload.route_data
        };

        const optionalKeys = [
            'vehicle_type',
            'shipping_cost_total',
            'shipping_cost_breakdown',
            'route_distance_km',
            'route_duration_mins',
            'waypoint_order'
        ];

        for (const k of optionalKeys) {
            if (k in payload && payload[k] !== undefined) {
                baseRow[k] = payload[k];
            }
        }

        const attemptInsert = async (row: any) => {
            const { error } = await supabase.from('shipments').insert([row]);
            if (error) throw error;
        };

        try {
            await attemptInsert(baseRow);
        } catch (err: any) {
            const msg = String(err?.message || '');
            const maybeMissingColumn =
                msg.includes('column') ||
                msg.includes('vehicle_type') ||
                msg.includes('shipping_cost') ||
                msg.includes('route_distance') ||
                msg.includes('waypoint_order');

            if (!maybeMissingColumn) throw err;
            await attemptInsert({ seller_id: user?.id, route_data: payload.route_data });
        }

        await refreshData();
    };

    const deleteShipment = async (id: string) => {
        const sellerId = await ensureSellerAccessForItems();
        const { data, error } = await supabase
            .from('shipments')
            .delete()
            .eq('id', id)
            .eq('seller_id', sellerId)
            .select('id');
        if (error) throw error;
        if (!data || data.length === 0) {
            throw new Error('Riwayat pengiriman tidak ditemukan.');
        }
        await refreshData();
    };

    const clearOrderHistory = async () => {
        const buyerId = await ensureBuyerAccessForOrders();
        try {
            const { error } = await supabase
                .from('orders')
                .update({ is_deleted_by_buyer: true })
                .eq('buyer_id', buyerId)
                .neq('status', 'pending');
            if (error) throw error;
        } catch (err: any) {
            const msg = String(err?.message || '');
            const maybeMissingColumn = msg.toLowerCase().includes('is_deleted_by_buyer') || msg.toLowerCase().includes('column');
            if (!maybeMissingColumn) throw err;
            const { error } = await supabase.from('orders').delete().eq('buyer_id', buyerId).neq('status', 'pending');
            if (error) throw error;
        }
        await refreshData();
    };

    const clearShipmentHistory = async () => {
        const sellerId = await ensureSellerAccessForItems();
        const { error } = await supabase
            .from('shipments')
            .delete()
            .eq('seller_id', sellerId);
        if (error) throw error;
        await refreshData();
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const availableStock = Number.isFinite(product.stock) ? Math.max(0, Math.floor(product.stock)) : null;
            if (availableStock !== null && availableStock <= 0) {
                return prev;
            }
            const existing = prev.find(item => item.id === product.id);
            if (!existing) {
                return [...prev, { ...product, quantity: 1 }];
            }
            const nextQty = (existing.quantity || 1) + 1;
            if (availableStock !== null) {
                return prev.map(item => (item.id === product.id ? { ...item, quantity: Math.min(nextQty, availableStock) } : item));
            }
            return prev.map(item => (item.id === product.id ? { ...item, quantity: nextQty } : item));
        });
        if (user?.role === 'buyer' && user.id) {
            void logProductEvent('add_to_cart', product.id, user.id);
        }
    };

    const updateCartQuantity = (id: string, quantity: number) => {
        const safeQty = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
        setCart(prev =>
            prev
                .map(item => {
                    if (item.id !== id) return item;
                    const minQty = 1;
                    const maxQty = Number.isFinite(item.stock) ? Math.max(0, Math.floor(item.stock)) : null;
                    const clamped = Math.max(minQty, safeQty);
                    if (maxQty !== null) {
                        return { ...item, quantity: Math.min(clamped, maxQty) };
                    }
                    return { ...item, quantity: clamped };
                })
                .filter(item => (Number.isFinite(item.stock) ? item.quantity > 0 && item.quantity <= Math.max(0, Math.floor(item.stock)) : true))
        );
    };

    const removeFromCart = (id: string) => setCart(prev => prev.filter(p => p.id !== id));
    const clearCart = () => setCart([]);

    return (
        <AppContext.Provider value={{ 
            products, orders, shipments, stakeholders: MOCK_STAKEHOLDERS, cart,
            publishProduct, deleteProduct, updateStock, addToCart, removeFromCart, clearCart,
            updateCartQuantity,
            updateProductImage,
            updateProduct,
            checkout, cancelOrder, deleteOrder, updateOrderStatus, saveShipment, deleteShipment, clearOrderHistory, clearShipmentHistory, refreshData
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within an AppProvider');
    return context;
};
