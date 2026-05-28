import React from 'react';
import {
    ShoppingBag,
    ShoppingCart,
    Clock,
    Heart,
    Repeat,
    MessageSquare,
    Settings,
    Leaf,
    LogOut as LogOutIcon
} from 'lucide-react';
import type { BuyerDashboardTab } from '../types';
import type { Order, User } from '../../../types';

interface BuyerSidebarProps {
    isOpen: boolean;
    activeTab: BuyerDashboardTab;
    cartCount: number;
    buyerOrders: Order[];
    user: User | null;
    onLogoClick: () => void;
    onTabChange: (tab: BuyerDashboardTab) => void;
    onLogout: () => void;
}

const BuyerSidebar: React.FC<BuyerSidebarProps> = ({
    isOpen,
    activeTab,
    cartCount,
    buyerOrders,
    user,
    onLogoClick,
    onTabChange,
    onLogout
}) => {
    const pendingCount = buyerOrders.filter(o => o.status === 'pending').length;

    return (
        <aside
            className={`hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
            <div className="p-6 flex items-center gap-2 mb-8 cursor-pointer" onClick={onLogoClick}>
                <div className="bg-emerald-500 p-2 rounded-xl text-white">
                    <Leaf size={24} />
                </div>
                <span className="text-xl font-black text-slate-900 tracking-tight">
                    DirectRoute <span className="text-emerald-500">AI</span>
                </span>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                <button
                    onClick={() => onTabChange('marketplace')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'marketplace' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <ShoppingBag size={20} /> Marketplace
                </button>
                <button
                    onClick={() => onTabChange('wishlist')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'wishlist' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Heart size={20} /> Wishlist
                </button>
                <button
                    onClick={() => onTabChange('cart')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all relative ${activeTab === 'cart' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <ShoppingCart size={20} /> Keranjang
                    {cartCount > 0 && (
                        <span className="absolute right-4 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                            {cartCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => onTabChange('orders')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all relative ${activeTab === 'orders' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Clock size={20} /> Order Saya
                    {pendingCount > 0 && (
                        <span className="absolute right-4 bg-emerald-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                            {pendingCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => onTabChange('subscriptions')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'subscriptions' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Repeat size={20} /> Subscription
                </button>
                <button
                    onClick={() => onTabChange('chat')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'chat' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <MessageSquare size={20} /> Chat
                </button>
                <button
                    onClick={() => onTabChange('settings')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Settings size={20} /> Settings
                </button>
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="mb-4 p-3 bg-white rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.username || 'Akun'}</p>
                    <p className="text-[11px] text-slate-500">Order: {buyerOrders.length}</p>
                </div>
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 transition-colors w-full"
                >
                    <LogOutIcon size={20} /> Keluar
                </button>
            </div>
        </aside>
    );
};

export default BuyerSidebar;
