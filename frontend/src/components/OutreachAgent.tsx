import React, { useState } from 'react';
import GlassCard from './GlassCard';
import { Send, MessageSquare, ShieldCheck, Zap, Copy } from 'lucide-react';

import type { OutreachData } from '../types';

interface OutreachAgentProps {
    data: OutreachData | null;
    isLoading: boolean;
}

const OutreachAgent: React.FC<OutreachAgentProps> = ({ data, isLoading }) => {
    const [activeTab, setActiveTab] = useState<'formal' | 'casual'>('formal');

    if (isLoading) {
        return (
            <GlassCard className="h-full">
                <div className="animate-pulse space-y-6">
                    <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-48 bg-slate-200 rounded-xl"></div>
                    <div className="h-10 bg-slate-200 rounded-full"></div>
                </div>
            </GlassCard>
        );
    }

    if (!data) return null;

    const handleSendWA = () => {
        const text = activeTab === 'formal' ? data.formal_draft : data.casual_draft;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <GlassCard className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="text-emerald-500" size={20} />
                    Dynamic Outreach AI
                </h3>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                    <ShieldCheck size={12} />
                    SECURITY: {data.security_status}
                </div>
            </div>

            <div className="flex p-1 bg-slate-100 rounded-lg mb-4">
                <button 
                    onClick={() => setActiveTab('formal')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        activeTab === 'formal' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
                    }`}
                >
                    Target: Korporasi/Hotel
                </button>
                <button 
                    onClick={() => setActiveTab('casual')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        activeTab === 'casual' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
                    }`}
                >
                    Target: Katering/UMKM
                </button>
            </div>

            <div className="flex-1 relative mb-6">
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-600 h-48 overflow-y-auto leading-relaxed italic">
                    {activeTab === 'formal' ? data.formal_draft : data.casual_draft}
                </div>
                <button 
                    className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"
                    onClick={() => navigator.clipboard.writeText(activeTab === 'formal' ? data.formal_draft : data.casual_draft)}
                >
                    <Copy size={16} />
                </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-2">
                    <Zap size={14} />
                    MSME MICRO-LEARNING
                </div>
                <p className="text-xs text-emerald-600 italic">
                    "{data.packing_tip}"
                </p>
            </div>

            <button 
                onClick={handleSendWA}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 active:scale-95"
            >
                <Send size={18} />
                Kirim via WhatsApp
            </button>
        </GlassCard>
    );
};

export default OutreachAgent;
