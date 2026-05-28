import React from 'react';
import { Menu, Search } from 'lucide-react';
import type { User } from '../../../types';

interface SellerHeaderProps {
    user: User | null;
    onToggleSidebar: () => void;
}

const SellerHeader: React.FC<SellerHeaderProps> = ({ user, onToggleSidebar }) => {
    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button className="lg:hidden p-2 text-slate-500" onClick={onToggleSidebar}>
                    <Menu size={24} />
                </button>
                <h1 className="text-xl font-bold text-slate-900 hidden sm:block">UMKM Supplier Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-slate-500">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent border-none text-xs focus:ring-0 w-32"
                    />
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center font-bold text-emerald-700 uppercase">
                    {user?.username?.[0] || 'U'}
                </div>
            </div>
        </header>
    );
};

export default SellerHeader;
