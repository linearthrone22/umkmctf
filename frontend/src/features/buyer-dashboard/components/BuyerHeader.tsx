import React from 'react';
import { Settings } from 'lucide-react';
import type { User } from '../../../types';

interface BuyerHeaderProps {
    user: User | null;
    onOpenSettings: () => void;
}

const BuyerHeader: React.FC<BuyerHeaderProps> = ({ user, onOpenSettings }) => {
    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-slate-900">Buyer Marketplace</h1>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onOpenSettings}
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition"
                    aria-label="Buka pengaturan"
                    type="button"
                >
                    <Settings size={18} />
                </button>
                <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center font-bold text-emerald-700 uppercase">
                    {user?.username?.[0] || 'B'}
                </div>
            </div>
        </header>
    );
};

export default BuyerHeader;
