'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { T } from '@/app/(backoffice)/lib/theme'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Hash, Users, Building2, Briefcase, MessageSquare,
    Plus, Search, Archive, Settings, Loader2, AlertCircle,
    Circle, MoreVertical, UserPlus, Lock,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────
interface Channel {
    id: string
    name: string | null
    type: string
    description: string | null
    is_archived: boolean
    is_pinned: boolean
    is_muted: boolean
    last_message_at: string | null
    last_message_preview: string | null
    message_count: number
    created_at: string
    created_by: string | null
    unread_count?: number
    member_count?: number
    member_role?: string
}

// ── Channel type config ──────────────────────────────────────────
const TYPE_CFG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; description: string }> = {
    team:        { label: 'Equipe',       icon: Hash,        color: 'var(--info)',    bg: 'rgba(96,165,250,0.12)',  description: 'Canal para toda a equipe' },
    group:       { label: 'Grupo',        icon: Users,       color: 'var(--success)', bg: 'rgba(52,211,153,0.12)', description: 'Grupo de pessoas selecionadas' },
    direct:      { label: 'Direto',       icon: Circle,      color: 'var(--warning)', bg: 'rgba(251,191,36,0.12)', description: 'Mensagem direta entre dois usuários' },
    deal_room:   { label: 'Deal Room',    icon: Briefcase,   color: 'var(--gold, #C8A44A)', bg: 'rgba(200,164,74,0.12)', description: 'Canal vinculado a um negócio' },
    property:    { label: 'Imóvel',       icon: Building2,   color: 'var(--prp, #A78BFA)', bg: 'rgba(167,139,250,0.12)', description: 'Canal vinculado a um imóvel' },
    announcement:{ label: 'Anúncio',      icon: MessageSquare, color: 'var(--error)',  bg: 'rgba(248,113,113,0.12)', description: 'Canal de avisos (somente admins postam)' },
}

function ChannelIcon({ type, size = 16 }: { type: string; size?: number }) {
    const cfg = TYPE_CFG[type]
    if (!cfg) return <MessageSquare size={size} style={{ color: T.textDim }} />
    const Icon = cfg.icon
    return <Icon size={size} style={{ color: cfg.color }} />
}

function formatRelative(dateStr: string | null) {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60_000) return 'agora'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`
    if (diff < 86_400_000) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// ── New Channel Modal ────────────────────────────────────────────
function NewChannelModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState('')
    const [type, setType] = useState<string>('team')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)

    const handleCreate = async () => {
        if (!name.trim()) { toast.error('Nome é obrigatório'); return }
        setLoading(true)
        try {
            const res = await fetch('/api/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), type, description: description.trim() || null }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro ao criar canal')
            toast.success(`Canal "${name}" criado com sucesso`)
            onCreated()
            onClose()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao criar canal')
        } finally {
            setLoading(false)
        }
    }

    const creatable = ['team', 'group', 'announcement']

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.2 }}
                style={{
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 12, padding: 28, width: '100%', maxWidth: 440,
                }}
                onClick={e => e.stopPropagation()}
            >
                <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 20 }}>
                    Novo Canal
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Type selector */}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                            Tipo
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                            {creatable.map(t => {
                                const cfg = TYPE_CFG[t]
                                const Icon = cfg.icon
                                const selected = type === t
                                return (
                                    <button
                                        key={t}
                                        onClick={() => setType(t)}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            gap: 6, padding: '12px 8px', borderRadius: 8,
                                            border: selected ? `1px solid ${cfg.color}` : `1px solid ${T.borderLight}`,
                                            background: selected ? cfg.bg : 'transparent',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                        }}
                                    >
                                        <Icon size={18} style={{ color: cfg.color }} />
                                        <span style={{ fontSize: 11, color: selected ? cfg.color : T.textMuted, fontWeight: selected ? 600 : 400 }}>
                                            {cfg.label}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                            Nome
                        </label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="ex: geral, vendas, leads-zona-sul"
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: 8,
                                background: T.elevated, border: `1px solid ${T.borderLight}`,
                                color: T.text, fontSize: 14, outline: 'none',
                                boxSizing: 'border-box',
                            }}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                            Descrição <span style={{ color: T.textDim, fontWeight: 400 }}>(opcional)</span>
                        </label>
                        <input
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Para que serve este canal?"
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: 8,
                                background: T.elevated, border: `1px solid ${T.borderLight}`,
                                color: T.text, fontSize: 14, outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{
                        padding: '9px 18px', borderRadius: 8, border: `1px solid ${T.borderLight}`,
                        background: 'transparent', color: T.textMuted, fontSize: 14, cursor: 'pointer',
                    }}>
                        Cancelar
                    </button>
                    <button onClick={handleCreate} disabled={loading || !name.trim()} style={{
                        padding: '9px 18px', borderRadius: 8, border: 'none',
                        background: loading || !name.trim() ? T.borderLight : T.accent,
                        color: loading || !name.trim() ? T.textDim : '#000',
                        fontSize: 14, fontWeight: 600, cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                        Criar Canal
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

// ── Channel Card ─────────────────────────────────────────────────
function ChannelCard({ channel, index }: { channel: Channel; index: number }) {
    const cfg = TYPE_CFG[channel.type]
    const isAdmin = channel.member_role === 'admin' || channel.member_role === 'moderator'

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
        >
            <Link
                href="/backoffice/connect"
                style={{ textDecoration: 'none', display: 'block' }}
            >
                <div style={{
                    background: T.surface, border: `1px solid ${T.borderLight}`,
                    borderRadius: 10, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    cursor: 'pointer', transition: 'all 0.15s',
                }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = T.border
                        e.currentTarget.style.background = T.elevated
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = T.borderLight
                        e.currentTarget.style.background = T.surface
                    }}
                >
                    {/* Icon */}
                    <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: cfg?.bg ?? 'rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ChannelIcon type={channel.type} size={18} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {channel.name ?? 'Sem nome'}
                            </span>
                            {cfg && (
                                <span style={{
                                    fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                                    background: cfg.bg, color: cfg.color, flexShrink: 0,
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                }}>
                                    {cfg.label}
                                </span>
                            )}
                            {isAdmin && (
                                <span style={{
                                    fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                                    background: 'rgba(200,164,74,0.12)', color: T.gold, flexShrink: 0,
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                }}>
                                    Admin
                                </span>
                            )}
                        </div>
                        {channel.description && (
                            <p style={{ fontSize: 12, color: T.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {channel.description}
                            </p>
                        )}
                        {channel.last_message_preview && (
                            <p style={{ fontSize: 12, color: T.textDim, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {channel.last_message_preview}
                            </p>
                        )}
                    </div>

                    {/* Right side */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: T.textDim }}>
                            {formatRelative(channel.last_message_at)}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {channel.member_count != null && (
                                <span style={{ fontSize: 11, color: T.textDim, display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Users size={11} /> {channel.member_count}
                                </span>
                            )}
                            {(channel.unread_count ?? 0) > 0 && (
                                <div style={{
                                    minWidth: 20, height: 20, borderRadius: 10,
                                    background: T.accent, color: '#0A1624',
                                    fontSize: 11, fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '0 5px',
                                }}>
                                    {channel.unread_count}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}

// ── Main Page ────────────────────────────────────────────────────
export default function CanaisPage() {
    const supabase = createClient()
    const [channels, setChannels] = useState<Channel[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'team' | 'group' | 'deal_room' | 'announcement'>('all')
    const [showArchived, setShowArchived] = useState(false)
    const [showNewModal, setShowNewModal] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    const loadChannels = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { setError('Não autenticado'); setLoading(false); return }
            setUserId(user.id)

            // Get user's memberships
            const { data: memberships, error: mErr } = await supabase
                .from('chat_members')
                .select('channel_id, unread_count, role')
                .eq('user_id', user.id)

            if (mErr) {
                setError('Tabelas de chat não encontradas. Execute a migração do banco de dados.')
                setLoading(false)
                return
            }

            if (!memberships?.length) {
                setChannels([])
                setLoading(false)
                return
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const typedMemberships = memberships as any[]
            const channelIds = typedMemberships.map((m: any) => m.channel_id)
            const membershipMap = new Map<string, { unread_count: number; role: string }>(
                typedMemberships.map((m: any) => [m.channel_id, { unread_count: m.unread_count ?? 0, role: m.role ?? 'member' }])
            )

            let query = supabase
                .from('chat_channels')
                .select('*')
                .in('id', channelIds)
                .eq('is_archived', showArchived)
                .order('last_message_at', { ascending: false, nullsFirst: false })

            if (filter !== 'all') {
                query = query.eq('type', filter)
            }

            const { data, error: chErr } = await query
            if (chErr) { setError(chErr.message); setLoading(false); return }

            // Get member counts
            const { data: counts } = await supabase
                .from('chat_members')
                .select('channel_id')
                .in('channel_id', channelIds)

            const countMap = new Map<string, number>()
            for (const row of counts ?? []) {
                countMap.set(row.channel_id, (countMap.get(row.channel_id) ?? 0) + 1)
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const enriched: Channel[] = ((data ?? []) as any[]).map((ch: any) => ({
                ...ch,
                unread_count: membershipMap.get(ch.id)?.unread_count ?? 0,
                member_role: membershipMap.get(ch.id)?.role ?? 'member',
                member_count: countMap.get(ch.id) ?? 0,
            }))

            setChannels(enriched)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido')
        } finally {
            setLoading(false)
        }
    }, [supabase, filter, showArchived])

    useEffect(() => { loadChannels() }, [loadChannels])

    const filtered = channels.filter(ch => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
            ch.name?.toLowerCase().includes(q) ||
            ch.description?.toLowerCase().includes(q) ||
            ch.last_message_preview?.toLowerCase().includes(q)
        )
    })

    const totalUnread = channels.reduce((s, ch) => s + (ch.unread_count ?? 0), 0)

    const FILTERS: { key: typeof filter; label: string }[] = [
        { key: 'all', label: 'Todos' },
        { key: 'team', label: 'Equipe' },
        { key: 'group', label: 'Grupos' },
        { key: 'deal_room', label: 'Deal Rooms' },
        { key: 'announcement', label: 'Anúncios' },
    ]

    return (
        <div style={{ padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>
                        Canais da Equipe
                    </h1>
                    <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>
                        {channels.length} canal{channels.length !== 1 ? 'is' : ''}{totalUnread > 0 ? ` · ${totalUnread} não lida${totalUnread !== 1 ? 's' : ''}` : ''}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Link href="/backoffice/connect" style={{ textDecoration: 'none' }}>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '9px 16px', borderRadius: 8,
                            border: `1px solid ${T.borderLight}`, background: 'transparent',
                            color: T.textMuted, fontSize: 13, cursor: 'pointer',
                        }}>
                            <MessageSquare size={14} />
                            Abrir Chat
                        </button>
                    </Link>
                    <button
                        onClick={() => setShowNewModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '9px 16px', borderRadius: 8,
                            border: 'none', background: 'var(--btn-primary-bg)',
                            color: 'var(--btn-primary-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        <Plus size={14} />
                        Novo Canal
                    </button>
                </div>
            </div>

            {/* Filters + Search */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            style={{
                                padding: '6px 14px', borderRadius: 20, fontSize: 13,
                                border: filter === f.key ? `1px solid ${T.accent}` : `1px solid ${T.borderLight}`,
                                background: filter === f.key ? T.accentBg : 'transparent',
                                color: filter === f.key ? T.accent : T.textMuted,
                                cursor: 'pointer', fontWeight: filter === f.key ? 600 : 400,
                                transition: 'all 0.15s',
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.textDim }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar canais..."
                        style={{
                            width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8,
                            background: T.surface, border: `1px solid ${T.borderLight}`,
                            color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                        }}
                    />
                </div>
                <button
                    onClick={() => setShowArchived(v => !v)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 12px', borderRadius: 8,
                        border: showArchived ? `1px solid ${T.accent}` : `1px solid ${T.borderLight}`,
                        background: showArchived ? T.accentBg : 'transparent',
                        color: showArchived ? T.accent : T.textMuted,
                        fontSize: 12, cursor: 'pointer',
                    }}
                >
                    <Archive size={13} />
                    Arquivados
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12, color: T.textDim }}>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 14 }}>Carregando canais...</span>
                </div>
            ) : error ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: 60, gap: 12, textAlign: 'center',
                }}>
                    <AlertCircle size={32} style={{ color: 'var(--error)' }} />
                    <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>{error}</p>
                    <button onClick={loadChannels} style={{
                        padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.borderLight}`,
                        background: 'transparent', color: T.textMuted, fontSize: 13, cursor: 'pointer',
                    }}>
                        Tentar novamente
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: 60, gap: 16, textAlign: 'center',
                }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'rgba(200,164,74,0.08)', border: `1px solid ${T.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Hash size={24} style={{ color: T.accent }} />
                    </div>
                    <div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: '0 0 4px' }}>
                            {search ? 'Nenhum canal encontrado' : channels.length === 0 ? 'Você não participa de nenhum canal' : 'Nenhum canal nesta categoria'}
                        </p>
                        <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
                            {search ? 'Tente outro termo de busca' : 'Crie um canal ou peça para ser adicionado a um existente'}
                        </p>
                    </div>
                    {!search && (
                        <button
                            onClick={() => setShowNewModal(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 20px', borderRadius: 8,
                                border: 'none', background: 'var(--btn-primary-bg)',
                                color: 'var(--btn-primary-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            <Plus size={14} />
                            Criar primeiro canal
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {filtered.map((ch, i) => (
                        <ChannelCard key={ch.id} channel={ch} index={i} />
                    ))}
                </div>
            )}

            {/* New Channel Modal */}
            <AnimatePresence>
                {showNewModal && (
                    <NewChannelModal onClose={() => setShowNewModal(false)} onCreated={loadChannels} />
                )}
            </AnimatePresence>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
