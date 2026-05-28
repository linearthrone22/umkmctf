import React from 'react';
import GlassCard from '../../../components/GlassCard';
import ChatPanel from '../../shared-chat/ChatPanel';

const BuyerChatTab: React.FC = () => {
    return (
        <div className="space-y-6">
            <GlassCard>
                <h2 className="text-xl font-black text-slate-900">Chat</h2>
                <p className="text-sm text-slate-500">Chat langsung dengan seller untuk konfirmasi order.</p>
            </GlassCard>
            <ChatPanel />
        </div>
    );
};

export default BuyerChatTab;

