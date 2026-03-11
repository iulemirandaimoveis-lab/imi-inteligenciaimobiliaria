'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    MessageCircle, Mail, Instagram, Facebook, Linkedin,
    Send, Sparkles, RefreshCw, Search, CheckCheck,
    Clock, User, Bot, ChevronRight, X, Loader2, AtSign,
    Phone, Globe, Star, Archive, Reply, MoreHorizontal,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────────────

type Channel = 'all' | 'whatsapp' | 'instagram' | 'gmail' | 'facebook' | 'linkedin'

interface Message {
    id: string
    channel: Exclude<Channel, 'all'>
    from: string
    fromHandle?: string
    avatar?: string
    subject?: string
    preview: string
    body?: string
    timestamp: string
    unread: boolean
    threadId?: string
    messageId?: string
    starred?: boolean
}

const CHANNEL_CFG: Record<Exclude<Channel, 'all'>, { label: string; color: string; bg: string; icon: any }> = {
    whatsapp:  { label: 'WhatsApp',  color: '#25D366', bg: 'rgba(37,211,102,0.12)',  icon: MessageCircle },
    instagram: { label: 'Instagram', color: '#E1306C', bg: 'rgba(225,48,108,0.12)',  icon: Instagram },
    gmail:     { label: 'Gmail',     color: '#EA4335', bg: 'rgba(234,67,53,0.12)',   icon: Mail },
    facebook:  { label: 'Facebook',  color: '#1877F2', bg: 'rgba(24,119,242,0.12)', icon: Facebook },
    linkedin:  { label: 'LinkedIn',  color: '#0A66C2', bg: 'rgba(10,102,194,0.12)', icon: Linkedin },
}

// ── AI Suggest ─────────────────────────────────────────────────────────

async function suggestReply(msg: Message, channel: string): Promise<string> {
    const res = await fetch('/api/ai/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'suggest_reply',
            channel,
            from: msg.from,
            subject: msg.subject,
            message: msg.body || msg.preview,
        }),
    })
    const data = await res.json()
    return data.reply || data.content || ''
}

// ── Message Card ───────────────────────────────────────────────────────

function MessageCard({
    msg,
    selected,
    onClick,
}: {
    msg: Message
    selected: boolean
    onClick: () => void
}) {
    const cfg = CHANNEL_CFG[msg.channel]
    const Icon = cfg.icon
    const ts = new Date(msg.timestamp)
    const isToday = new Date().toDateString() === ts.toDateString()
    const timeStr = isToday
        ? ts.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : ts.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

    return (
        <motion.button
            className="w-full text-left px-4 py-3.5 flex gap-3 items-start relative"
            style={{
                background: selected ? 'var(--bo-active-bg)' : 'transparent',
                borderLeft: selected ? `3px solid ${cfg.color}` : '3px solid transparent',
                borderBottom: `1px solid ${T.border}`,
            }}
            onClick={onClick}
            whileHover={{ backgroundColor: 'var(--bo-hover)' }}
            transition={{ duration: 0.1 }}
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px]"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {msg.from.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: cfg.color }}>
                    <Icon size={9} color="white" />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[13px] font-semibold truncate"
                        style={{ color: msg.unread ? T.text : T.textMuted }}>
                        {msg.from}
                    </span>
                    <span className="text-[10px] flex-shrink-0" style={{ color: T.textMuted }}>{timeStr}</span>
                </div>
                {msg.subject && (
                    <p className="text-[11px] font-medium truncate mb-0.5" style={{ color: T.text }}>{msg.subject}</p>
                )}
                <p className="text-[11px] truncate" style={{ color: T.textMuted }}>{msg.preview}</p>
            </div>

            {/* Unread dot */}
            {msg.unread && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: cfg.color }} />
            )}
        </motion.button>
    )
}

// ── Main ───────────────────────────────────────────────────────────────

export default function SocialInboxPage() {
    const [channel, setChannel] = useState<Channel>('all')
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<Message | null>(null)
    const [reply, setReply] = useState('')
    const [aiLoading, setAiLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [search, setSearch] = useState('')
    const [gmailConnected, setGmailConnected] = useState(false)
    const replyRef = useRef<HTMLTextAreaElement>(null)

    const fetchMessages = useCallback(async () => {
        setLoading(true)
        const all: Message[] = []

        // Fetch Gmail
        try {
            const gmailRes = await fetch('/api/gmail')
            if (gmailRes.ok) {
                const gmailData = await gmailRes.json()
                setGmailConnected(true)
                if (gmailData.messages) {
                    all.push(...gmailData.messages.map((m: any) => ({
                        id: m.id,
                        channel: 'gmail' as const,
                        from: m.from.replace(/<.*>/, '').trim() || m.from,
                        fromHandle: m.from,
                        subject: m.subject,
                        preview: m.snippet,
                        timestamp: m.date ? new Date(m.date).toISOString() : new Date().toISOString(),
                        unread: m.unread,
                        threadId: m.threadId,
                        messageId: m.id,
                    })))
                }
            } else {
                setGmailConnected(false)
            }
        } catch { /* gmail not connected */ }

        // Fetch WhatsApp conversations from DB
        try {
            const waRes = await fetch('/api/omnichannel/messages')
            if (waRes.ok) {
                const waData = await waRes.json()
                if (waData.messages) all.push(...waData.messages)
            }
        } catch { /* whatsapp not connected */ }

        // Sort by timestamp desc
        all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setMessages(all)
        setLoading(false)
    }, [])

    useEffect(() => { fetchMessages() }, [fetchMessages])

    const filtered = messages.filter(m => {
        if (channel !== 'all' && m.channel !== channel) return false
        if (search && !m.from.toLowerCase().includes(search.toLowerCase()) &&
            !m.preview.toLowerCase().includes(search.toLowerCase()) &&
            !m.subject?.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    const handleAiSuggest = async () => {
        if (!selected) return
        setAiLoading(true)
        try {
            const suggestion = await suggestReply(selected, selected.channel)
            setReply(suggestion)
            setTimeout(() => replyRef.current?.focus(), 100)
        } catch {
            toast.error('Erro ao gerar sugestão')
        } finally {
            setAiLoading(false)
        }
    }

    const handleSend = async () => {
        if (!selected || !reply.trim()) return
        setSending(true)
        try {
            if (selected.channel === 'gmail') {
                await fetch('/api/gmail', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: selected.fromHandle || selected.from,
                        subject: `Re: ${selected.subject || ''}`,
                        body: reply,
                        threadId: selected.threadId,
                        replyToMessageId: selected.messageId,
                    }),
                })
                toast.success('Email enviado!')
            } else if (selected.channel === 'whatsapp') {
                await fetch('/api/omnichannel/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message_id: selected.id, reply }),
                })
                toast.success('Mensagem enviada via WhatsApp!')
            } else {
                // Future feature — intentional toast.info
                toast.info(`Resposta via ${CHANNEL_CFG[selected.channel].label} em breve!`)
            }
            setReply('')
        } catch (e: any) {
            toast.error('Erro ao enviar: ' + e.message)
        } finally {
            setSending(false)
        }
    }

    const unreadCount = messages.filter(m => m.unread).length
    const channelCount = (ch: Exclude<Channel, 'all'>) => messages.filter(m => m.channel === ch).length

    return (
        <div className="flex flex-col overflow-hidden rounded-2xl"
            style={{ height: 'calc(100vh - 80px)', background: T.elevated, border: `1px solid ${T.border}` }}>

            {/* Header bar */}
            <div className="px-5 py-3.5 flex items-center justify-between flex-shrink-0"
                style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--bo-active-bg)' }}>
                        <MessageCircle size={17} style={{ color: 'var(--bo-accent)' }} />
                    </div>
                    <div>
                        <h1 className="text-[14px] font-bold" style={{ color: T.text }}>Social Inbox</h1>
                        <p className="text-[11px]" style={{ color: T.textMuted }}>
                            {unreadCount > 0 ? `${unreadCount} não lidas` : 'Tudo em dia'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchMessages}
                        className="p-2 rounded-xl transition-colors hover:opacity-70"
                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}>
                        <RefreshCw size={13} style={{ color: T.textMuted }} className={loading ? 'animate-spin' : ''} />
                    </button>
                    {!gmailConnected && (
                        <a href="/api/auth/google"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                            style={{ background: 'rgba(234,67,53,0.12)', color: '#EA4335' }}>
                            <Mail size={12} />
                            Conectar Gmail
                        </a>
                    )}
                </div>
            </div>

            {/* Channel tabs */}
            <div className="flex gap-1 px-4 py-2 overflow-x-auto flex-shrink-0"
                style={{ borderBottom: `1px solid ${T.border}`, scrollbarWidth: 'none' }}>
                <button
                    onClick={() => setChannel('all')}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                    style={{
                        background: channel === 'all' ? 'var(--bo-active-bg)' : 'rgba(255,255,255,0.04)',
                        color: channel === 'all' ? 'var(--bo-accent)' : T.textMuted,
                    }}>
                    Todos {messages.length > 0 && `(${messages.length})`}
                </button>
                {(Object.entries(CHANNEL_CFG) as [Exclude<Channel, 'all'>, any][]).map(([ch, cfg]) => {
                    const count = channelCount(ch)
                    if (count === 0 && ch !== 'whatsapp' && ch !== 'gmail') return null
                    const Icon = cfg.icon
                    return (
                        <button key={ch}
                            onClick={() => setChannel(ch)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                            style={{
                                background: channel === ch ? cfg.bg : 'rgba(255,255,255,0.04)',
                                color: channel === ch ? cfg.color : T.textMuted,
                            }}>
                            <Icon size={11} />
                            {cfg.label}
                            {count > 0 && <span className="text-[10px]">({count})</span>}
                        </button>
                    )
                })}
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
                {/* Message list */}
                <div className="w-[300px] flex-shrink-0 flex flex-col overflow-hidden"
                    style={{ borderRight: `1px solid ${T.border}` }}>
                    {/* Search */}
                    <div className="px-3 py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${T.border}` }}>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}>
                            <Search size={12} style={{ color: T.textMuted }} />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar mensagens..."
                                className="flex-1 bg-transparent text-[12px] outline-none placeholder:opacity-40"
                                style={{ color: T.text }} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-16 gap-2">
                                <Loader2 size={17} className="animate-spin" style={{ color: T.textMuted }} />
                                <span className="text-[12px]" style={{ color: T.textMuted }}>Carregando...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 px-4 text-center">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <MessageCircle size={20} style={{ color: T.textMuted }} />
                                </div>
                                <p className="text-[12px]" style={{ color: T.textMuted }}>
                                    {search ? 'Nenhum resultado' : 'Nenhuma mensagem'}
                                </p>
                                {!gmailConnected && channel === 'all' && (
                                    <a href="/api/auth/google"
                                        className="text-[11px] font-semibold px-3 py-1.5 rounded-xl"
                                        style={{ background: 'rgba(234,67,53,0.12)', color: '#EA4335' }}>
                                        Conectar Gmail
                                    </a>
                                )}
                            </div>
                        ) : (
                            filtered.map(msg => (
                                <MessageCard key={msg.id} msg={msg}
                                    selected={selected?.id === msg.id}
                                    onClick={() => { setSelected(msg); setReply('') }} />
                            ))
                        )}
                    </div>
                </div>

                {/* Message detail + reply */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {!selected ? (
                        <div className="flex flex-col items-center justify-center flex-1 gap-4">
                            <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
                                style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <MessageCircle size={28} style={{ color: T.textMuted, opacity: 0.4 }} />
                            </div>
                            <div className="text-center">
                                <p className="text-[14px] font-semibold" style={{ color: T.text }}>Selecione uma mensagem</p>
                                <p className="text-[12px] mt-1" style={{ color: T.textMuted }}>Leia e responda com sugestão de IA</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Detail header */}
                            <div className="px-5 py-4 flex items-start gap-3 flex-shrink-0"
                                style={{ borderBottom: `1px solid ${T.border}` }}>
                                {(() => {
                                    const cfg = CHANNEL_CFG[selected.channel]
                                    const Icon = cfg.icon
                                    return (
                                        <>
                                            <div className="relative flex-shrink-0">
                                                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[15px]"
                                                    style={{ background: cfg.bg, color: cfg.color }}>
                                                    {selected.from.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center"
                                                    style={{ background: cfg.color, width: 18, height: 18 }}>
                                                    <Icon size={10} color="white" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[14px] font-bold" style={{ color: T.text }}>{selected.from}</span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                        style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                                                </div>
                                                {selected.subject && (
                                                    <p className="text-[12px] font-medium" style={{ color: T.textMuted }}>{selected.subject}</p>
                                                )}
                                                <p className="text-[11px]" style={{ color: T.textMuted }}>
                                                    {new Date(selected.timestamp).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                        </>
                                    )
                                })()}
                            </div>

                            {/* Message body */}
                            <div className="flex-1 overflow-y-auto px-5 py-4">
                                <div className="rounded-2xl p-4"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}>
                                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: T.text }}>
                                        {selected.body || selected.preview}
                                    </p>
                                </div>
                            </div>

                            {/* Reply area */}
                            <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: `1px solid ${T.border}` }}>
                                <div className="rounded-2xl overflow-hidden"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}>
                                    <textarea
                                        ref={replyRef}
                                        value={reply}
                                        onChange={e => setReply(e.target.value)}
                                        placeholder={`Responder via ${CHANNEL_CFG[selected.channel].label}...`}
                                        rows={4}
                                        className="w-full bg-transparent px-4 pt-3 text-[13px] outline-none resize-none placeholder:opacity-40"
                                        style={{ color: T.text }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend()
                                        }}
                                    />
                                    <div className="flex items-center justify-between px-3 py-2"
                                        style={{ borderTop: `1px solid ${T.border}` }}>
                                        <button onClick={handleAiSuggest} disabled={aiLoading}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-50"
                                            style={{ background: 'rgba(167,139,250,0.12)', color: '#A78BFA' }}>
                                            {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                            Sugerir com IA
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px]" style={{ color: T.textMuted }}>⌘↵ enviar</span>
                                            <button
                                                onClick={handleSend}
                                                disabled={!reply.trim() || sending}
                                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-40"
                                                style={{
                                                    background: reply.trim() ? CHANNEL_CFG[selected.channel].color : 'rgba(255,255,255,0.05)',
                                                    color: reply.trim() ? 'white' : T.textMuted,
                                                }}>
                                                {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                                                Enviar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
