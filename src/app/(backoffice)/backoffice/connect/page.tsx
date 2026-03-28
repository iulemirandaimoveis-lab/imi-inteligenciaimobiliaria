'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChannels } from '@/features/connect/hooks/useChannels'
import { useChat } from '@/features/connect/hooks/useChat'
import type { ChatChannel, ChatMessage } from '@/features/connect/types'
import { T, cardStyle } from '@/app/(backoffice)/lib/theme'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
    MessageSquare, Plus, Send, Hash, Users, Building2,
    Briefcase, Search, MoreVertical, Smile, Paperclip,
    ArrowLeft, Bell, BellOff, Pin, Archive, UserPlus,
    Circle, CheckCheck, Loader2,
} from 'lucide-react'

// ── Channel Icon ─────────────────────────────────────────
function ChannelIcon({ type, size = 16 }: { type: string; size?: number }) {
    switch (type) {
        case 'deal_room': return <Briefcase size={size} />
        case 'team': return <Hash size={size} />
        case 'direct': return <Circle size={size} style={{ fill: 'var(--success)', color: 'var(--success)' }} />
        case 'group': return <Users size={size} />
        case 'property': return <Building2 size={size} />
        default: return <MessageSquare size={size} />
    }
}

// ── Time formatter ───────────────────────────────────────
function formatTime(dateStr: string | null) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60_000) return 'agora'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`
    if (diff < 86_400_000) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// ── Avatar ───────────────────────────────────────────────
function ChatAvatar({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
    const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    const hue = name.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xff, 0) % 360

    if (url) {
        return (
            <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
        )
    }

    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            background: `hsl(${hue}, 40%, 20%)`,
            color: `hsl(${hue}, 60%, 70%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.36, fontWeight: 700, letterSpacing: '-0.02em',
        }}>
            {initials}
        </div>
    )
}

// ── Message Bubble ───────────────────────────────────────
function MessageBubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
    if (msg.content_type === 'system') {
        return (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <span style={{
                    fontSize: 11, color: T.textDim,
                    background: T.subtle, padding: '4px 12px',
                    borderRadius: T.radius.full, fontStyle: 'italic',
                }}>
                    {msg.content}
                </span>
            </div>
        )
    }

    return (
        <div style={{
            display: 'flex', gap: 8, padding: '4px 0',
            flexDirection: isOwn ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
        }}>
            {!isOwn && <ChatAvatar name={msg.sender_name ?? 'U'} url={msg.sender_avatar} size={32} />}
            <div style={{ maxWidth: '70%', minWidth: 0 }}>
                {!isOwn && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 2 }}>
                        {msg.sender_name}
                    </div>
                )}
                <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: isOwn ? T.accent : T.surface,
                    color: isOwn ? T.textInverse : T.text,
                    fontSize: 14, lineHeight: '20px',
                    border: isOwn ? 'none' : `1px solid ${T.borderLight}`,
                    wordBreak: 'break-word',
                }}>
                    {msg.content}
                </div>
                <div style={{
                    fontSize: 11, color: T.textDim, marginTop: 2,
                    textAlign: isOwn ? 'right' : 'left',
                    fontFamily: T.font.mono,
                }}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {isOwn && <CheckCheck size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
                </div>
            </div>
        </div>
    )
}

// ── Main Connect Page ────────────────────────────────────
export default function ConnectPage() {
    const [user, setUser] = useState<{ id: string; name: string; avatar_url?: string } | null>(null)
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null)
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [showNewChannel, setShowNewChannel] = useState(false)
    const [newChannelName, setNewChannelName] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [newChannelMode, setNewChannelMode] = useState<'team' | 'direct'>('direct')
    const [brokerSearch, setBrokerSearch] = useState('')
    const [availableBrokers, setAvailableBrokers] = useState<Array<{ id: string; name: string; email: string; avatar_url: string | null }>>([])
    const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null)
    const [loadingBrokers, setLoadingBrokers] = useState(false)
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const typingTimeout = useRef<NodeJS.Timeout>()

    // Load current user
    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                supabase.from('profiles').select('name, avatar_url').eq('id', data.user.id).single()
                    .then(({ data: profile }) => {
                        setUser({
                            id: data.user!.id,
                            name: profile?.name ?? data.user!.email ?? 'Usuário',
                            avatar_url: profile?.avatar_url,
                        })
                    })
            }
        })
    }, [])

    const { channels, loading: channelsLoading, totalUnread, createChannel, reload: reloadChannels } = useChannels(user?.id ?? null)
    const { messages, loading: messagesLoading, typingUsers, sendMessage, sendTyping, markAsRead } = useChat(
        activeChannelId,
        user ?? { id: '', name: '' }
    )

    const activeChannel = channels.find(c => c.id === activeChannelId)

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Mark as read when viewing
    useEffect(() => {
        if (activeChannelId && messages.length > 0) markAsRead()
    }, [activeChannelId, messages.length])

    // Filter channels
    const filteredChannels = channels.filter(ch =>
        !searchQuery || ch.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Send message handler
    const handleSend = async () => {
        if (!newMessage.trim() || sending) return
        setSending(true)
        const result = await sendMessage(newMessage)
        if (result?.error) {
            console.error('[Chat] Send failed:', result.error)
            toast.error(`Erro ao enviar: ${result.error.message || 'Tente novamente'}`)
            setSending(false)
            return
        }
        setNewMessage('')
        setSending(false)
        inputRef.current?.focus()
    }

    // Typing indicator
    const handleTyping = () => {
        if (typingTimeout.current) clearTimeout(typingTimeout.current)
        sendTyping()
        typingTimeout.current = setTimeout(() => {}, 3000)
    }

    // Fetch brokers when modal opens
    useEffect(() => {
        if (!showNewChannel || !user) return
        setLoadingBrokers(true)
        const supabase = createClient()
        // Fetch ALL profiles (not just is_active=true) since auto-created profiles may not have that flag
        supabase.from('profiles')
            .select('id, name, email, avatar_url')
            .neq('id', user.id)
            .order('name')
            .then(({ data }) => {
                // Filter out test accounts but include all real users
                const real = (data ?? []).filter(b => b.email && !b.email.includes('teste@') && !b.email.includes('testando@'))
                setAvailableBrokers(real)
                setLoadingBrokers(false)
            })
    }, [showNewChannel, user])

    const filteredBrokers = availableBrokers.filter(b =>
        !brokerSearch || b.name?.toLowerCase().includes(brokerSearch.toLowerCase()) || b.email?.toLowerCase().includes(brokerSearch.toLowerCase())
    )

    // Create channel (team or direct)
    const handleCreateChannel = async () => {
        if (newChannelMode === 'direct') {
            if (!selectedBrokerId) return
            const broker = availableBrokers.find(b => b.id === selectedBrokerId)
            if (!broker) return
            // Check if direct channel already exists between these two users
            const existingDirect = channels.find(ch =>
                ch.type === 'direct' && ch.name?.includes(broker.name)
            )
            if (existingDirect) {
                setActiveChannelId(existingDirect.id)
                setShowNewChannel(false)
                setSelectedBrokerId(null)
                setBrokerSearch('')
                setMobileView('chat')
                return
            }
            const channelName = `${user?.name ?? 'Eu'} ↔ ${broker.name}`
            const ch = await createChannel({ type: 'direct', name: channelName, memberIds: [selectedBrokerId] })
            if (ch) {
                setActiveChannelId(ch.id)
                setShowNewChannel(false)
                setSelectedBrokerId(null)
                setBrokerSearch('')
                setMobileView('chat')
            }
        } else {
            if (!newChannelName.trim()) return
            const ch = await createChannel({ type: 'team', name: newChannelName.trim() })
            if (ch) {
                setActiveChannelId(ch.id)
                setShowNewChannel(false)
                setNewChannelName('')
                setMobileView('chat')
            }
        }
    }

    if (!user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.textDim }}>
                <Loader2 size={24} className="animate-spin" />
            </div>
        )
    }

    // ── Channel List Sidebar ─────────────────────────────
    const channelList = (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            borderRight: `1px solid ${T.border}`,
            background: T.base,
        }}>
            {/* Header */}
            <div style={{
                padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `1px solid ${T.border}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageSquare size={20} style={{ color: T.gold }} />
                    <span style={{ fontSize: 16, fontWeight: 700, fontFamily: T.font.serif, color: T.text }}>
                        Connect
                    </span>
                    {totalUnread > 0 && (
                        <span style={{
                            background: T.error, color: 'var(--text-inverse)',
                            fontSize: 11, fontWeight: 700, padding: '2px 6px',
                            borderRadius: T.radius.full, fontFamily: T.font.mono,
                        }}>
                            {totalUnread}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setShowNewChannel(true)}
                    style={{
                        position: 'relative', overflow: 'hidden',
                        width: 32, height: 32, borderRadius: 6,
                        background: '#0A1624', color: '#fff',
                        border: '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <Plus size={16} />
                    <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' }} />
                </button>
            </div>

            {/* Search */}
            <div style={{ padding: '12px 16px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: T.elevated, borderRadius: T.radius.md,
                    padding: '0 12px', height: 36,
                    border: `1px solid ${T.borderLight}`,
                }}>
                    <Search size={14} style={{ color: T.textDim, flexShrink: 0 }} />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar conversas..."
                        style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            fontSize: 13, color: T.text, fontFamily: T.font.sans,
                        }}
                    />
                </div>
            </div>

            {/* Channel list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {channelsLoading ? (
                    <div style={{ padding: 16 }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="animate-pulse" style={{
                                height: 56, borderRadius: T.radius.lg, marginBottom: 4,
                                background: T.elevated,
                            }} />
                        ))}
                    </div>
                ) : filteredChannels.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                            background: T.activeBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <MessageSquare size={28} style={{ color: T.gold }} />
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>
                            Nenhuma conversa ainda
                        </p>
                        <p style={{ fontSize: 13, color: T.textDim, marginBottom: 20, maxWidth: 200, margin: '0 auto 20px' }}>
                            Inicie uma conversa com sua equipe ou crie um canal
                        </p>
                        <button
                            onClick={() => setShowNewChannel(true)}
                            style={{
                                position: 'relative', overflow: 'hidden',
                                background: 'var(--n, #0A1624)', color: '#fff',
                                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '12px 22px',
                                fontFamily: "var(--fu, 'Outfit', sans-serif)",
                                fontWeight: 600, fontSize: 11, letterSpacing: '1px',
                                textTransform: 'uppercase' as const, cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                            }}
                        >
                            <Plus size={15} /> Iniciar Conversa
                            <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' }} />
                        </button>
                    </div>
                ) : (
                    filteredChannels.map(ch => (
                        <div
                            key={ch.id}
                            onClick={() => { setActiveChannelId(ch.id); setMobileView('chat') }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '12px 16px', cursor: 'pointer',
                                background: ch.id === activeChannelId ? T.activeBg : 'transparent',
                                borderLeft: ch.id === activeChannelId ? `3px solid ${T.gold}` : '3px solid transparent',
                                transition: `all ${T.transition.fast}`,
                            }}
                            onMouseEnter={e => { if (ch.id !== activeChannelId) e.currentTarget.style.background = T.hover }}
                            onMouseLeave={e => { if (ch.id !== activeChannelId) e.currentTarget.style.background = 'transparent' }}
                        >
                            <div style={{
                                width: 40, height: 40, borderRadius: T.radius.lg,
                                background: T.elevated, display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                color: ch.id === activeChannelId ? T.gold : T.textMuted,
                                flexShrink: 0,
                            }}>
                                <ChannelIcon type={ch.type} size={18} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{
                                        fontSize: 13, fontWeight: ch.unread_count > 0 ? 700 : 500,
                                        color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {ch.name ?? 'Canal'}
                                    </span>
                                    <span style={{ fontSize: 11, color: T.textDim, fontFamily: T.font.mono, flexShrink: 0 }}>
                                        {formatTime(ch.last_message_at)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                                    <span style={{
                                        fontSize: 12, color: T.textDim,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        fontWeight: ch.unread_count > 0 ? 600 : 400,
                                    }}>
                                        {ch.last_message_preview ?? 'Sem mensagens'}
                                    </span>
                                    {ch.unread_count > 0 && (
                                        <span style={{
                                            background: T.gold, color: T.textInverse,
                                            fontSize: 11, fontWeight: 700, padding: '2px 8px',
                                            borderRadius: T.radius.full, fontFamily: T.font.mono,
                                            minWidth: 18, textAlign: 'center', flexShrink: 0,
                                        }}>
                                            {ch.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )

    // ── Chat Area ────────────────────────────────────────
    const chatArea = (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: T.base }}>
            {activeChannel ? (
                <>
                    {/* Chat Header */}
                    <div style={{
                        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
                        borderBottom: `1px solid ${T.border}`, background: T.surface,
                    }}>
                        <button
                            className="md:hidden"
                            onClick={() => setMobileView('list')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text, padding: 4 }}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div style={{
                            width: 36, height: 36, borderRadius: T.radius.lg,
                            background: T.elevated, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: T.gold,
                        }}>
                            <ChannelIcon type={activeChannel.type} size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                                {activeChannel.name}
                            </div>
                            <div style={{ fontSize: 11, color: T.textDim }}>
                                {activeChannel.message_count} mensagens
                            </div>
                        </div>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: 4 }}>
                            <MoreVertical size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                        {messagesLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Loader2 size={24} className="animate-spin" style={{ color: T.textDim }} />
                            </div>
                        ) : messages.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <MessageSquare size={48} style={{ color: T.gold, marginBottom: 16, opacity: 0.5 }} />
                                <p style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 4 }}>
                                    Comece a conversa
                                </p>
                                <p style={{ fontSize: 13, color: T.textDim }}>
                                    Envie a primeira mensagem neste canal
                                </p>
                            </div>
                        ) : (
                            <>
                                {messages.map(msg => (
                                    <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender_id === user.id} />
                                ))}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Typing indicator */}
                    <AnimatePresence>
                        {typingUsers.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 24 }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ padding: '0 20px', fontSize: 12, color: T.textDim, fontStyle: 'italic' }}
                            >
                                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'está' : 'estão'} digitando...
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Composer */}
                    <div style={{
                        padding: '12px 20px', borderTop: `1px solid ${T.border}`,
                        display: 'flex', alignItems: 'center', gap: 8, background: T.surface,
                    }}>
                        <button style={{
                            width: 36, height: 36, borderRadius: T.radius.md,
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: T.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Paperclip size={18} />
                        </button>
                        <input
                            ref={inputRef}
                            value={newMessage}
                            onChange={e => { setNewMessage(e.target.value); handleTyping() }}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                            placeholder="Mensagem..."
                            style={{
                                flex: 1, height: 40, padding: '0 16px',
                                background: T.elevated, border: `1px solid ${T.borderLight}`,
                                borderRadius: T.radius.full, color: T.text,
                                fontSize: 14, fontFamily: T.font.sans, outline: 'none',
                                transition: `all ${T.transition.fast}`,
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = T.borderGold}
                            onBlur={e => e.currentTarget.style.borderColor = T.borderLight}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!newMessage.trim() || sending}
                            style={{
                                width: 40, height: 40, borderRadius: T.radius.full,
                                background: newMessage.trim() ? T.accent : T.elevated,
                                color: newMessage.trim() ? T.textInverse : T.textDisabled,
                                border: 'none', cursor: newMessage.trim() ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: `all ${T.transition.fast}`,
                            }}
                        >
                            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </>
            ) : (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: '100%', color: T.textDim,
                }}>
                    <MessageSquare size={48} style={{ color: T.gold, marginBottom: 16, opacity: 0.3 }} />
                    <p style={{ fontSize: 16, fontWeight: 600, color: T.text }}>IMI Connect</p>
                    <p style={{ fontSize: 13, color: T.textDim, marginTop: 4 }}>
                        Selecione uma conversa para começar
                    </p>
                </div>
            )}
        </div>
    )

    return (
        <div style={{ height: 'calc(100vh - 64px)', display: 'flex', overflow: 'hidden' }}>
            {/* New Channel / Direct Message Modal */}
            <AnimatePresence>
                {showNewChannel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setShowNewChannel(false); setNewChannelMode('direct'); setSelectedBrokerId(null); setBrokerSearch('') }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 50,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 8 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                ...cardStyle, padding: 24, width: 440, maxWidth: '90vw',
                                boxShadow: 'var(--shadow-lg)',
                            }}
                        >
                            <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: T.font.serif, color: T.text, marginBottom: 16 }}>
                                Nova Conversa
                            </h3>

                            {/* Mode tabs */}
                            <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: T.elevated, borderRadius: T.radius.md, padding: 3 }}>
                                {([['direct', 'Mensagem Direta'], ['team', 'Canal de Equipe']] as const).map(([mode, label]) => (
                                    <button
                                        key={mode}
                                        onClick={() => { setNewChannelMode(mode); setSelectedBrokerId(null); setBrokerSearch(''); setNewChannelName('') }}
                                        style={{
                                            flex: 1, height: 34, borderRadius: T.radius.sm,
                                            background: newChannelMode === mode ? T.accent : 'transparent',
                                            color: newChannelMode === mode ? T.textInverse : T.textMuted,
                                            border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                            transition: `all ${T.transition.fast}`,
                                        }}
                                    >
                                        {mode === 'direct' ? <UserPlus size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> : <Hash size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />}
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {newChannelMode === 'direct' ? (
                                <>
                                    {/* Broker search */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        background: T.elevated, borderRadius: T.radius.md,
                                        padding: '0 12px', height: 40, marginBottom: 12,
                                        border: `1.5px solid ${T.border}`,
                                    }}>
                                        <Search size={14} style={{ color: T.textDim, flexShrink: 0 }} />
                                        <input
                                            value={brokerSearch}
                                            onChange={e => setBrokerSearch(e.target.value)}
                                            placeholder="Buscar corretor por nome ou email..."
                                            autoFocus
                                            style={{
                                                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                                fontSize: 13, color: T.text, fontFamily: T.font.sans,
                                            }}
                                        />
                                    </div>

                                    {/* Broker list */}
                                    <div style={{
                                        maxHeight: 240, overflowY: 'auto', marginBottom: 16,
                                        border: `1px solid ${T.borderLight}`, borderRadius: T.radius.md,
                                    }}>
                                        {loadingBrokers ? (
                                            <div style={{ padding: 16, textAlign: 'center', color: T.textDim, fontSize: 13 }}>
                                                <Loader2 size={16} className="animate-spin" style={{ display: 'inline-block', marginRight: 6 }} />
                                                Carregando...
                                            </div>
                                        ) : filteredBrokers.length === 0 ? (
                                            <div style={{ padding: 16, textAlign: 'center', color: T.textDim, fontSize: 13 }}>
                                                Nenhum corretor encontrado
                                            </div>
                                        ) : filteredBrokers.map(broker => (
                                            <button
                                                key={broker.id}
                                                onClick={() => setSelectedBrokerId(broker.id === selectedBrokerId ? null : broker.id)}
                                                style={{
                                                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                                    padding: '10px 12px', border: 'none', cursor: 'pointer',
                                                    background: broker.id === selectedBrokerId ? 'var(--bg-active)' : 'transparent',
                                                    borderBottom: `1px solid ${T.borderLight}`,
                                                    transition: `background ${T.transition.fast}`,
                                                }}
                                            >
                                                <ChatAvatar name={broker.name} url={broker.avatar_url} size={32} />
                                                <div style={{ flex: 1, textAlign: 'left' }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{broker.name}</div>
                                                    <div style={{ fontSize: 11, color: T.textDim }}>{broker.email}</div>
                                                </div>
                                                {broker.id === selectedBrokerId && (
                                                    <CheckCheck size={16} style={{ color: T.success, flexShrink: 0 }} />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <input
                                    value={newChannelName}
                                    onChange={e => setNewChannelName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleCreateChannel() }}
                                    placeholder="Nome do canal..."
                                    autoFocus
                                    style={{
                                        width: '100%', height: 40, padding: '0 14px',
                                        background: T.elevated, border: `1.5px solid ${T.border}`,
                                        borderRadius: T.radius.md, color: T.text,
                                        fontSize: 14, fontFamily: T.font.sans, outline: 'none',
                                        marginBottom: 16,
                                    }}
                                />
                            )}

                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => { setShowNewChannel(false); setNewChannelMode('direct'); setSelectedBrokerId(null); setBrokerSearch('') }}
                                    style={{
                                        height: 36, padding: '0 16px', borderRadius: T.radius.md,
                                        background: 'transparent', border: `1px solid ${T.border}`,
                                        color: T.text, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateChannel}
                                    disabled={newChannelMode === 'direct' ? !selectedBrokerId : !newChannelName.trim()}
                                    style={{
                                        height: 36, padding: '0 16px', borderRadius: T.radius.md,
                                        background: T.accent, border: 'none',
                                        color: T.textInverse, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                        opacity: (newChannelMode === 'direct' ? selectedBrokerId : newChannelName.trim()) ? 1 : 0.5,
                                    }}
                                >
                                    {newChannelMode === 'direct' ? 'Iniciar Conversa' : 'Criar Canal'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop layout: sidebar + chat */}
            <div className="hidden md:flex" style={{ width: '100%', height: '100%' }}>
                <div style={{ width: 320, flexShrink: 0 }}>{channelList}</div>
                {chatArea}
            </div>

            {/* Mobile layout: list OR chat */}
            <div className="flex md:hidden" style={{ width: '100%', height: '100%' }}>
                {mobileView === 'list' ? channelList : chatArea}
            </div>
        </div>
    )
}
