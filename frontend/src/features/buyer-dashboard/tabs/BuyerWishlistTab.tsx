import React from 'react';
import GlassCard from '../../../components/GlassCard';
import WishlistPanel from '../../wishlist/WishlistPanel';

const BuyerWishlistTab: React.FC = () => {
    return (
        <div className="space-y-6">
            <GlassCard>
                <h2 className="text-xl font-black text-slate-900">Wishlist</h2>
                <p className="text-sm text-slate-500">Simpan produk favorit + repeat order.</p>
            </GlassCard>
            <WishlistPanel />
        </div>
    );
};

export default BuyerWishlistTab;

