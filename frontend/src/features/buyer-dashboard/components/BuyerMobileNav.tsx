import React from 'react';
import { Clock, ShoppingBag, ShoppingCart, Heart, MessageSquare, Repeat } from 'lucide-react';
import type { BuyerDashboardTab } from '../types';

interface BuyerMobileNavProps {
    activeTab: BuyerDashboardTab;
    cartCount: number;
    pendingOrders: number;
    onTabChange: (tab: BuyerDashboardTab) => void;
}

const BuyerMobileNav: React.FC<BuyerMobileNavProps> = ({ activeTab, cartCount, pendingOrders, onTabChange }) => {
    return (
        <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-2 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] grid grid-cols-6 items-center z-50">
            <button
                onClick={() => onTabChange('marketplace')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'marketplace' ? 'text-emerald-600' : 'text-slate-400'}`}
            >
                <ShoppingBag size={20} />
                <span className="text-[10px] font-bold">Shop</span>
            </button>
            <button
                onClick={() => onTabChange('wishlist')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'wishlist' ? 'text-emerald-600' : 'text-slate-400'}`}
            >
                <Heart size={20} />
                <span className="text-[10px] font-bold">Wish</span>
            </button>
            <button
                onClick={() => onTabChange('cart')}
                className={`relative flex flex-col items-center gap-1 ${activeTab === 'cart' ? 'text-emerald-600' : 'text-slate-400'}`}
            >
                <ShoppingCart size={20} />
                <span className="text-[10px] font-bold">Cart</span>
                {cartCount > 0 && (
                    <span className="absolute -right-2 -top-1 bg-red-500 text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                        {cartCount}
                    </span>
                )}
            </button>
            <button
                onClick={() => onTabChange('orders')}
                className={`relative flex flex-col items-center gap-1 ${activeTab === 'orders' ? 'text-emerald-600' : 'text-slate-400'}`}
            >
                <Clock size={20} />
                <span className="text-[10px] font-bold">Orders</span>
                {pendingOrders > 0 && (
                    <span className="absolute -right-2 -top-1 bg-emerald-500 text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                        {pendingOrders}
                    </span>
                )}
            </button>
            <button
                onClick={() => onTabChange('subscriptions')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'subscriptions' ? 'text-emerald-600' : 'text-slate-400'}`}
            >
                <Repeat size={20} />
                <span className="text-[10px] font-bold">Subs</span>
            </button>
            <button
                onClick={() => onTabChange('chat')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'chat' ? 'text-emerald-600' : 'text-slate-400'}`}
            >
                <MessageSquare size={20} />
                <span className="text-[10px] font-bold">Chat</span>
            </button>
        </div>
    );
};

export default BuyerMobileNav;
