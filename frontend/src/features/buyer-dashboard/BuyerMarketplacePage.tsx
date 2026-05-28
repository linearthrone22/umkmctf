import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { geocodeLocation, parseCoordinatesFromInput } from '../../utils/location';
import { chatCompletion } from '../../utils/aiClient';

import type { Product } from '../../types';
import type { BuyerDashboardTab } from './types';
import BuyerSidebar from './components/BuyerSidebar';
import BuyerHeader from './components/BuyerHeader';
import BuyerMobileNav from './components/BuyerMobileNav';
import BuyerMarketplaceTab from './tabs/BuyerMarketplaceTab';
import BuyerWishlistTab from './tabs/BuyerWishlistTab';
import BuyerCartTab from './tabs/BuyerCartTab';
import BuyerOrdersTab from './tabs/BuyerOrdersTab';
import BuyerSubscriptionsTab from './tabs/BuyerSubscriptionsTab';
import BuyerChatTab from './tabs/BuyerChatTab';
import BuyerSettingsTab from './tabs/BuyerSettingsTab';
import PromoBannersStrip from '../cms/components/PromoBannersStrip';
import { useToastStack } from '../notifications/useToastStack';
import ToastStack from '../notifications/ToastStack';
import { useOrderRealtimeToasts } from '../notifications/useOrderRealtimeToasts';
import { useDisputeRealtimeToasts } from '../notifications/useDisputeRealtimeToasts';

const BuyerMarketplacePage: React.FC = () => {
    const navigate = useNavigate();
    const { products, orders, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, checkout, cancelOrder, deleteOrder, clearOrderHistory } = useApp();
    const { logout, user, updateProfile } = useAuth();

    const [isSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<BuyerDashboardTab>('marketplace');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [cancelLoadingId, setCancelLoadingId] = useState<string | null>(null);
    const [orderHistoryClearing, setOrderHistoryClearing] = useState(false);
    const [locationInput, setLocationInput] = useState(user?.location || '');
    const [locationSaving, setLocationSaving] = useState(false);
    const toast = useToastStack();

    useOrderRealtimeToasts(user, toast.push);
    useDisputeRealtimeToasts(user, toast.push);

    const buyerOrders = orders.filter(o => o.buyer_id === user?.id);
    const cartTotalQty = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const pendingOrders = buyerOrders.filter(o => o.status === 'pending').length;

    const handleCancelOrder = async (id: string) => {
        if (!confirm('Yakin ingin membatalkan pesanan ini?')) return;
        setCancelLoadingId(id);
        try {
            await cancelOrder(id);
            alert('Pesanan berhasil dibatalkan.');
        } catch (err: any) {
            alert(`Gagal membatalkan pesanan: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setCancelLoadingId(null);
        }
    };

    const handleClearOrderHistory = async () => {
        if (buyerOrders.length === 0) return;
        if (!confirm('Hapus semua riwayat pesanan?')) return;
        setOrderHistoryClearing(true);
        try {
            await clearOrderHistory();
            alert('Riwayat pesanan berhasil dihapus.');
        } catch (err: any) {
            alert(`Gagal menghapus riwayat pesanan: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setOrderHistoryClearing(false);
        }
    };

    const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
    const handleDeleteOrder = async (id: string) => {
        if (!confirm('Hapus order ini dari riwayat?')) return;
        setDeleteLoadingId(id);
        try {
            await deleteOrder(id);
            alert('Order berhasil dihapus dari riwayat.');
        } catch (err: any) {
            alert(`Gagal menghapus order: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setDeleteLoadingId(null);
        }
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [aiMatching, setAiMatching] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState<Product[] | null>(null);

    const handleAiMatch = async () => {
        if (!searchQuery) return;
        setAiMatching(true);
        try {
            const data = await chatCompletion({
                model: import.meta.env.VITE_LLM_MODEL || 'ollama:qwen2.5-coder:1.5b',
                format: 'json',
                messages: [
                    {
                        role: 'user',
                        content: `Daftar Produk: ${JSON.stringify(products)}\nKebutuhan Pembeli: "${searchQuery}"\nKembalikan HANYA array ID produk yang relevan dalam format JSON.`
                    }
                ]
            });

            const content = String(data?.choices?.[0]?.message?.content || '')
                .replace(/```json|```/g, '')
                .trim();
            const matchedIds = JSON.parse(content);
            const matched = products.filter(p => matchedIds.includes(p.id));
            setFilteredProducts(matched);
        } catch (error) {
            console.error('AI Match failed', error);
        } finally {
            setAiMatching(false);
        }
    };

    const handleCheckout = async (meta?: { shipping_address_id?: string | null; notes?: string | null; coupon_code?: string | null }) => {
        if (cart.length === 0) return;
        setCheckoutLoading(true);
        try {
            await checkout(cart, meta);
            alert('Checkout Berhasil! Pesanan Anda sedang diproses oleh Seller.');
            setActiveTab('orders');
        } catch (err: any) {
            alert(`Checkout gagal: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setCheckoutLoading(false);
        }
    };

    useEffect(() => {
        setLocationInput(user?.location || '');
    }, [user?.location]);

    const handleLookupLocation = async () => {
        const raw = locationInput.trim();
        if (!raw) return;

        try {
            const parsed = parseCoordinatesFromInput(raw);
            if (parsed) {
                setLocationInput(`${parsed.lat}, ${parsed.lng}`);
                return;
            }
            const { coords } = await geocodeLocation(raw, import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
            setLocationInput(coords);
        } catch (err: any) {
            alert(`Gagal mencari lokasi: ${err?.message || 'Terjadi kesalahan.'}`);
        }
    };

    const handleUpdateLocation = async () => {
        const raw = locationInput.trim();
        if (!raw) {
            alert('Lokasi tidak boleh kosong.');
            return;
        }

        setLocationSaving(true);
        try {
            const parsed = parseCoordinatesFromInput(raw);
            const normalizedLocation = parsed
                ? `${parsed.lat}, ${parsed.lng}`
                : (await geocodeLocation(raw, import.meta.env.VITE_GOOGLE_MAPS_API_KEY)).coords;
            await updateProfile({ location: normalizedLocation });
            setLocationInput(normalizedLocation);
            alert('Lokasi berhasil diupdate di database!');
        } catch (err: any) {
            alert(`Gagal update lokasi: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setLocationSaving(false);
        }
    };

    return (
        <div className="flex min-h-dvh bg-slate-50 overflow-hidden font-sans">
            <ToastStack toasts={toast.toasts} onClose={toast.remove} />
            <BuyerSidebar
                isOpen={isSidebarOpen}
                activeTab={activeTab}
                cartCount={cartTotalQty}
                buyerOrders={buyerOrders}
                user={user}
                onLogoClick={() => navigate('/')}
                onTabChange={setActiveTab}
                onLogout={logout}
            />

            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <BuyerHeader user={user} onOpenSettings={() => setActiveTab('settings')} />

                <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-8 pb-24 lg:pb-8">
                    {activeTab === 'marketplace' && (
                        <>
                            <PromoBannersStrip />
                            <BuyerMarketplaceTab
                                products={products}
                                filteredProducts={filteredProducts}
                                searchQuery={searchQuery}
                                aiMatching={aiMatching}
                                onSearchQueryChange={setSearchQuery}
                                onAiMatch={handleAiMatch}
                                buyerLocation={user?.location || ''}
                                onAddToCart={(product, quantity) => {
                                    addToCart(product);
                                    if (typeof quantity === 'number' && Number.isFinite(quantity)) {
                                        updateCartQuantity(product.id, quantity);
                                    }
                                    alert('Produk ditambahkan ke keranjang!');
                                }}
                            />
                        </>
                    )}

                    {activeTab === 'wishlist' && <BuyerWishlistTab />}

                    {activeTab === 'cart' && (
                        <BuyerCartTab
                            products={products}
                            cart={cart}
                            checkoutLoading={checkoutLoading}
                            onRemoveFromCart={removeFromCart}
                            onUpdateQuantity={updateCartQuantity}
                            onClearCart={clearCart}
                            onAddToCart={(product, quantity) => {
                                addToCart(product);
                                if (typeof quantity === 'number' && Number.isFinite(quantity)) {
                                    updateCartQuantity(product.id, quantity);
                                }
                            }}
                            onCheckout={handleCheckout}
                        />
                    )}

                    {activeTab === 'orders' && (
                        <BuyerOrdersTab
                            buyerOrders={buyerOrders}
                            cancelLoadingId={cancelLoadingId}
                            deleteLoadingId={deleteLoadingId}
                            orderHistoryClearing={orderHistoryClearing}
                            onCancelOrder={id => void handleCancelOrder(id)}
                            onDeleteOrder={id => void handleDeleteOrder(id)}
                            onClearHistory={() => void handleClearOrderHistory()}
                        />
                    )}

                    {activeTab === 'subscriptions' && <BuyerSubscriptionsTab products={products} />}

                    {activeTab === 'chat' && <BuyerChatTab />}

                    {activeTab === 'settings' && (
                        <BuyerSettingsTab
                            locationInput={locationInput}
                            locationSaving={locationSaving}
                            onLocationInputChange={setLocationInput}
                            onMapsLinkChange={val => {
                                if (val.includes('maps') || val.includes('goo.gl')) {
                                    setLocationInput(val);
                                }
                            }}
                            onLookup={() => void handleLookupLocation()}
                            onSave={() => void handleUpdateLocation()}
                        />
                    )}
                </div>
            </main>

            <BuyerMobileNav
                activeTab={activeTab}
                cartCount={cartTotalQty}
                pendingOrders={pendingOrders}
                onTabChange={setActiveTab}
            />
        </div>
    );
};

export default BuyerMarketplacePage;
