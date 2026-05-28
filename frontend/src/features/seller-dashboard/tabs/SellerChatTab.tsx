import React from 'react';
import GlassCard from '../../../components/GlassCard';
import ChatPanel from '../../shared-chat/ChatPanel';

const SellerChatTab: React.FC = () => {
    return (
        <div className="lg:col-span-3 space-y-6">
            <GlassCard>
                <h2 className="text-xl font-black text-slate-900">Chat Buyer ↔ Seller</h2>
                <p className="text-sm text-slate-500">Negosiasi / konfirmasi langsung (Supabase).</p>
            </GlassCard>
            <ChatPanel />
        </div>
    );
};

export default SellerChatTab;

