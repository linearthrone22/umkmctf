import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquarePlus, Send, Users } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../supabase';

interface ConversationRow {
    id: string;
    buyer_id: string;
    seller_id: string;
    order_id: string | null;
    created_at: string;
    last_message_at: string | null;
}

interface MessageRow {
    id: string;
    conversation_id: string;
    sender_id: string;
    body: string;
    created_at: string;
}

const ChatPanel: React.FC = () => {
    const { user } = useAuth();
    const { orders } = useApp();

    const [conversations, setConversations] = useState<ConversationRow[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [messages, setMessages] = useState<MessageRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [draft, setDraft] = useState('');
    const [starting, setStarting] = useState(false);
    const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
    const [cooldownLeft, setCooldownLeft] = useState(0);

    const listRef = useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const myId = user?.id || null;

    const counterpartCandidates = useMemo(() => {
        if (!myId) return [];
        const ids = new Set<string>();
        for (const o of orders) {
            if (user?.role === 'buyer') ids.add(o.seller_id);
            if (user?.role === 'seller') ids.add(o.buyer_id);
        }
        return [...ids].slice(0, 20);
    }, [myId, orders, user?.role]);

    const fetchConversations = async () => {
        if (!myId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .or(`buyer_id.eq.${myId},seller_id.eq.${myId}`)
                .order('last_message_at', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Chat fetch conversations error:', error.message);
                setConversations([]);
                return;
            }
            setConversations((data || []) as ConversationRow[]);
            if (!activeId && data && data.length > 0) {
                setActiveId((data[0] as any).id);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
        if (error) {
            console.error('Chat fetch messages error:', error.message);
            setMessages([]);
            return;
        }
        setMessages((data || []) as MessageRow[]);
    };

    const scrollToBottom = () => {
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }));
    };

    useEffect(() => {
        if (!cooldownUntil) {
            setCooldownLeft(0);
            return;
        }
        const tick = () => {
            const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
            setCooldownLeft(left);
            if (left <= 0) setCooldownUntil(null);
        };
        tick();
        const t = setInterval(tick, 250);
        return () => clearInterval(t);
    }, [cooldownUntil]);

    useEffect(() => {
        void fetchConversations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myId]);

    useEffect(() => {
        if (!activeId) return;
        void fetchMessages(activeId).then(scrollToBottom);

        const channel = supabase
            .channel(`messages:${activeId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` },
                payload => {
                    const row = payload.new as any;
                    setMessages(prev => {
                        const id = String(row?.id || '');
                        if (id && prev.some(m => String(m.id) === id)) return prev;
                        return [...prev, row as MessageRow];
                    });
                    scrollToBottom();
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [activeId]);

    const startConversation = async (otherUserId: string) => {
        if (!myId) throw new Error('Sesi tidak ditemukan.');
        if (!otherUserId) return;

        const buyerId = user?.role === 'buyer' ? myId : otherUserId;
        const sellerId = user?.role === 'seller' ? myId : otherUserId;

        setStarting(true);
        try {
            const existing = conversations.find(c => c.buyer_id === buyerId && c.seller_id === sellerId);
            if (existing) {
                setActiveId(existing.id);
                return;
            }
            const { data, error } = await supabase
                .from('conversations')
                .insert([{ buyer_id: buyerId, seller_id: sellerId }])
                .select('*')
                .single();
            if (error) throw error;
            setConversations(prev => [data as any, ...prev]);
            setActiveId((data as any).id);
        } finally {
            setStarting(false);
        }
    };

    const sendMessage = async () => {
        const body = draft.trim();
        if (!body || !myId || !activeId) return;
        if (cooldownUntil && Date.now() < cooldownUntil) return;
        setSending(true);
        const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const optimisticRow: MessageRow = {
            id: optimisticId,
            conversation_id: activeId,
            sender_id: myId,
            body,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticRow]);
        scrollToBottom();
        try {
            let insertedRow: any = null;

            const returningRes = await supabase
                .from('messages')
                .insert([{ conversation_id: activeId, sender_id: myId, body }])
                .select('*')
                .single();

            if (!returningRes.error) {
                insertedRow = returningRes.data;
            } else {
                // Fallback: still try insert without returning, then refetch messages.
                const fallbackRes = await supabase.from('messages').insert([{ conversation_id: activeId, sender_id: myId, body }]);
                if (fallbackRes.error) {
                    throw returningRes.error;
                }
            }

            if (insertedRow) {
                setMessages(prev => {
                    const id = String(insertedRow?.id || '');
                    const withoutOptimistic = prev.filter(m => String(m.id) !== optimisticId);
                    if (id && withoutOptimistic.some(m => String(m.id) === id)) return withoutOptimistic;
                    return [...withoutOptimistic, insertedRow as MessageRow];
                });
                scrollToBottom();
            } else {
                await fetchMessages(activeId);
                setMessages(prev => prev.filter(m => String(m.id) !== optimisticId));
                scrollToBottom();
            }

            setDraft('');
            await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', activeId);
            setCooldownUntil(Date.now() + 2500);
        } catch (err: any) {
            setMessages(prev => prev.filter(m => String(m.id) !== optimisticId));
            const raw = String(err?.message || 'Terjadi kesalahan.');
            const lower = raw.toLowerCase();
            if (lower.includes('rate limit') || lower.includes('terlalu cepat')) {
                setCooldownUntil(Date.now() + 15000);
                alert('Terlalu cepat kirim chat. Tunggu 15 detik ya.');
            } else if (lower.includes('duplicate')) {
                alert('Pesan yang sama barusan sudah terkirim. Coba tunggu sebentar.');
            } else {
                alert(`Gagal kirim pesan: ${raw}`);
            }
        } finally {
            setSending(false);
        }
    };

    const active = useMemo(() => conversations.find(c => c.id === activeId) || null, [activeId, conversations]);
    const title = useMemo(() => {
        if (!active || !myId) return 'Pilih percakapan';
        const otherId = active.buyer_id === myId ? active.seller_id : active.buyer_id;
        return `Chat: ${otherId.slice(0, 8)}…`;
    }, [active, myId]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <GlassCard className="lg:col-span-4 p-0 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="font-black text-slate-900 flex items-center gap-2">
                        <Users size={18} className="text-emerald-600" />
                        Percakapan
                    </div>
                    {user?.role !== 'admin' && (
                        <div className="relative">
                            <button
                                type="button"
                                disabled={starting || counterpartCandidates.length === 0}
                                onClick={() => {
                                    const first = counterpartCandidates[0];
                                    if (first) void startConversation(first).catch(err => alert(err?.message || 'Gagal mulai chat.'));
                                }}
                                className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 disabled:opacity-50 transition"
                                title="Mulai chat dari daftar order"
                            >
                                <MessageSquarePlus size={14} className="inline -mt-0.5 mr-1" />
                                Mulai
                            </button>
                        </div>
                    )}
                </div>

                <div ref={listRef} className="max-h-[520px] overflow-auto">
                    {loading ? (
                        <div className="p-6 text-sm text-slate-400">Memuat percakapan...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-6 text-sm text-slate-400">
                            Belum ada chat. Buat order dulu biar bisa mulai chat otomatis.
                        </div>
                    ) : (
                        conversations.map(c => {
                            const isActive = c.id === activeId;
                            const otherId = myId ? (c.buyer_id === myId ? c.seller_id : c.buyer_id) : '';
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setActiveId(c.id)}
                                    className={`w-full text-left px-5 py-4 border-b border-slate-100 hover:bg-emerald-50/30 transition ${
                                        isActive ? 'bg-emerald-50/60' : 'bg-white'
                                    }`}
                                >
                                    <div className="font-black text-slate-900">User {otherId.slice(0, 8)}…</div>
                                    <div className="text-xs text-slate-500">
                                        {c.last_message_at
                                            ? `Aktif: ${new Date(c.last_message_at).toLocaleString('id-ID')}`
                                            : `Dibuat: ${new Date(c.created_at).toLocaleString('id-ID')}`}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </GlassCard>

            <GlassCard className="lg:col-span-8 p-0 overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                    <div className="font-black text-slate-900">{title}</div>
                    <div className="text-xs text-slate-500">Kirim pesan untuk negosiasi/konfirmasi.</div>
                </div>

                <div className="p-5 max-h-[520px] overflow-auto bg-slate-50/50">
                    {!activeId ? (
                        <div className="py-14 text-center text-slate-400">Pilih percakapan dulu.</div>
                    ) : messages.length === 0 ? (
                        <div className="py-14 text-center text-slate-400">Belum ada pesan.</div>
                    ) : (
                        <div className="space-y-3">
                            {messages.map(m => {
                                const mine = m.sender_id === myId;
                                return (
                                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                                mine ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-800'
                                            }`}
                                        >
                                            <div className="whitespace-pre-wrap break-words">{m.body}</div>
                                            <div className={`mt-1 text-[10px] ${mine ? 'text-emerald-50/90' : 'text-slate-400'}`}>
                                                {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-white">
                    <div className="flex items-center gap-2">
                        <input
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            placeholder={activeId ? 'Tulis pesan...' : 'Pilih percakapan dulu'}
                            disabled={!activeId || sending || !!cooldownUntil}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    void sendMessage();
                                }
                            }}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                        />
                        <button
                            type="button"
                            disabled={!activeId || sending || draft.trim().length === 0 || !!cooldownUntil}
                            onClick={() => void sendMessage()}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 transition whitespace-nowrap"
                        >
                            <Send size={16} className="inline -mt-0.5 mr-1" />
                            {cooldownLeft > 0 ? `Tunggu ${cooldownLeft}s` : 'Kirim'}
                        </button>
                    </div>
                    {cooldownLeft > 0 && (
                        <div className="mt-2 text-[11px] text-amber-700 font-black">
                            Cooldown aktif untuk anti-spam. Coba lagi sebentar.
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    );
};

export default ChatPanel;
