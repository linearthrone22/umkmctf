import React from 'react';
import { LayoutDashboard, Truck, ClipboardList, MessageSquare } from 'lucide-react';
import type { SellerDashboardTab } from '../types';

interface SellerMobileNavProps {
    activeTab: SellerDashboardTab;
    onTabChange: (tab: SellerDashboardTab) => void;
}

const SellerMobileNav: React.FC<SellerMobileNavProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-4 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] flex items-center justify-between z-50">
            <button
                onClick={() => onTabChange('dashboard')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}
            >
                <LayoutDashboard size={20} />
                <span className="text-[10px] font-bold">Dash</span>
            </button>
            <button
                onClick={() => onTabChange('orders')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'orders' ? 'text-emerald-600' : 'text-slate-400'}`}
            >
                <ClipboardList size={20} />
                <span className="text-[10px] font-bold">Order</span>
            </button>
            <button
                onClick={() => onTabChange('logistics')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'logistics' ? 'text-emerald-600' : 'text-slate-400'}`}
            >
                <Truck size={20} />
                <span className="text-[10px] font-bold">Route</span>
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

export default SellerMobileNav;
