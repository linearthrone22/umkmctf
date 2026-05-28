import React from 'react';
import {
    LayoutDashboard,
    BarChart3,
    Truck,
    ClipboardList,
    CreditCard,
    PackageOpen,
    MessageSquare,
    ShoppingBag,
    Settings,
    Leaf,
    LogOut
} from 'lucide-react';
import type { User } from '../../../types';
import type { SellerDashboardTab } from '../types';

interface SellerSidebarProps {
    isOpen: boolean;
    activeTab: SellerDashboardTab;
    user: User | null;
    ordersCount: number;
    onLogoClick: () => void;
    onTabChange: (tab: SellerDashboardTab) => void;
    onClose: () => void;
    onLogout: () => void;
}

const SellerSidebar: React.FC<SellerSidebarProps> = ({
    isOpen,
    activeTab,
    user,
    ordersCount,
    onLogoClick,
    onTabChange,
    onClose,
    onLogout
}) => {
    const SidebarContent = (
        <>
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
                    onClick={() => {
                        onTabChange('dashboard');
                        onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <LayoutDashboard size={20} /> Dashboard
                </button>
                <button
                    onClick={() => {
                        onTabChange('analytics');
                        onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'analytics' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <BarChart3 size={20} /> Analytics
                </button>
                <button
                    onClick={() => {
                        onTabChange('logistics');
                        onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'logistics' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Truck size={20} /> Logistics
                </button>
                <button
                    onClick={() => {
                        onTabChange('orders');
                        onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <ClipboardList size={20} /> Pesanan
                </button>
                <button
                    onClick={() => {
                        onTabChange('payments');
                        onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'payments' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <CreditCard size={20} /> Pembayaran
                </button>
                <button
                    onClick={() => {
                        onTabChange('shipments');
                        onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'shipments' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <PackageOpen size={20} /> Pengiriman
                </button>
                <button
                    onClick={() => {
                        onTabChange('chat');
                        onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'chat' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <MessageSquare size={20} /> Chat
                </button>
                <button
                    onClick={() => {
                        onTabChange('inventory');
                        onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'inventory' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <ShoppingBag size={20} /> Inventory
                </button>
                <button
                    onClick={() => {
                        onTabChange('settings');
                        onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Settings size={20} /> Settings
                </button>
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="mb-4 p-3 bg-white rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.username || 'Akun'}</p>
                    <p className="text-[11px] text-slate-500">Role: {user?.role}</p>
                    <p className="text-[11px] text-slate-500">Total order: {ordersCount}</p>
                </div>
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 transition-colors w-full"
                >
                    <LogOut size={20} /> Keluar
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200">
                {SidebarContent}
            </aside>

            {/* Mobile/Tablet drawer */}
            <div className={`lg:hidden fixed inset-0 z-[60] ${isOpen ? '' : 'pointer-events-none'}`}>
                <button
                    className={`absolute inset-0 bg-black/40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={onClose}
                    aria-label="Close sidebar"
                />
                <aside
                    className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white border-r border-slate-200 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    {SidebarContent}
                </aside>
            </div>
        </>
    );
};

export default SellerSidebar;
