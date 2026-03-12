'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Bell, Check, CheckCheck, Loader2,
    User, Home, DollarSign, FileText, AlertCircle, Info, CheckCircle,
    Sparkles, Bug, Zap,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'

interface Notification {
    id: string
    type: string
    title: string
    message: string | null
    read: boolean
    read_at: string | null
    created_at: string
}

const TYPE_ICONS: Record<string, any> = {
    lead: User, imovel: Home, financeiro: DollarSign, contrato: FileText,
    alerta: AlertCircle, info: Info, sucesso: CheckCircle,
    system: Zap, development: Home, evaluation: Sparkles, comment: FileText,
}
const TYPE_COLORS: Record<string, string> = {
    lead: '#7B9EC4', imovel: '#6BB87B', financeiro: 'var(--bo-accent)', contrato: '#A89EC4',
    alerta: '#E57373', info: '#7B9EC4', sucesso: '#6BB87B',
    system: '#8B5CF6', development: '#6BB87B', evaluation: '#F59E0B', comment: '#64748B',
}

const timeAgo = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (diff < 1) return 'agora'
    if (diff < 60) return `${diff}min`
    if (diff < 1440) return `${Math.floor(diff / 60)}h`
    return `${Math.floor(diff / 1440)}d atrás`
}

export default function NotificacoesPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'unread'>('all')

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications?limit=100')
            if (res.ok) {
                const json = await res.json()
                // API returns { data: [...], pagination: {...} }
                setNotifications(Array.isArray(json) ? json : (json.data || []))
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchNotifications() }, [])

    const markRead = async (id: string) => {
        await fetch('/api/notifications', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }

    const markAllRead = async () => {
        await fetch('/api/notifications', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read_all: true }),
        })
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    const filtered = notifications.filter(n => filter === 'all' || !n.read)
    const unreadCount = notifications.filter(n => !n.read).length

    if (loading) {
        return (
            <div className="space-y-5 max-w-3xl mx-auto">
                <div className="animate-pulse" style={{ height: '72px', borderRadius: '16px', background: T.surface, border: `1px solid ${T.border}` }} />
                <div className="flex gap-2">
                    <div className="animate-pulse h-9 w-28 rounded-xl" style={{ background: T.elevated }} />
                    <div className="animate-pulse h-9 w-36 rounded-xl" style={{ background: T.elevated }} />
                </div>
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse flex items-start gap-3 p-4 rounded-2xl"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.elevated, flexShrink: 0 }} />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                <div style={{ height: '12px', width: '55%', borderRadius: '6px', background: T.elevated }} />
                                <div style={{ height: '10px', width: '75%', borderRadius: '6px', background: T.elevated }} />
                                <div style={{ height: '9px', width: '20%', borderRadius: '6px', background: T.elevated }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-5 max-w-3xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <PageIntelHeader
                    moduleLabel="SISTEMA · NOTIFICAÇÕES"
                    title="Notificações"
                    subtitle={unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}
                    live={unreadCount > 0}
                    actions={
                        unreadCount > 0 ? (
                            <button
                                onClick={markAllRead}
                                className="flex items-center gap-2 px-4 rounded-xl text-xs font-semibold"
                                style={{ height: '44px', background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}
                            >
                                <CheckCheck size={14} /> Marcar todas como lidas
                            </button>
                        ) : undefined
                    }
                />
            </motion.div>

            {/* Filter */}
            <div className="flex gap-2">
                {(['all', 'unread'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className="px-3.5 h-9 rounded-xl text-xs font-semibold transition-all"
                        style={{
                            background: filter === f ? T.accent : T.elevated,
                            color: filter === f ? 'white' : T.textDim,
                            border: `1px solid ${filter === f ? T.borderGold : T.border}`,
                        }}>
                        {f === 'all' ? `Todas (${notifications.length})` : `Não lidas (${unreadCount})`}
                    </button>
                ))}
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-14 text-center"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                    <div className="mb-4" style={{ opacity: 0.12 }}>
                        <Bell size={56} style={{ color: T.textMuted, margin: '0 auto' }} />
                    </div>
                    <p className="text-base font-bold mb-2" style={{ color: T.text }}>
                        {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                    </p>
                    <p className="text-sm" style={{ color: T.textMuted }}>As notificações aparecerão aqui quando houver atividade</p>
                </motion.div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((n, i) => {
                        const Icon = TYPE_ICONS[n.type] || Bell
                        const color = TYPE_COLORS[n.type] || T.accent
                        return (
                            <motion.div key={n.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                className="flex items-start gap-3 p-4 rounded-2xl transition-all cursor-pointer"
                                style={{
                                    background: n.read ? T.surface : T.elevated,
                                    border: `1px solid ${n.read ? T.border : T.borderGold}`,
                                    opacity: n.read ? 0.7 : 1,
                                }}
                                onClick={() => !n.read && markRead(n.id)}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                                    <Icon size={16} style={{ color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-semibold truncate" style={{ color: T.text }}>{n.title}</p>
                                        {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: T.accent }} />}
                                    </div>
                                    {n.message && <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: T.textDim }}>{n.message}</p>}
                                    <p className="text-[10px] mt-1" style={{ color: T.textDim }}>{timeAgo(n.created_at)}</p>
                                </div>
                                {!n.read && (
                                    <button className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                                        style={{ background: 'var(--bo-active-bg)' }} onClick={e => { e.stopPropagation(); markRead(n.id) }}>
                                        <Check size={12} style={{ color: T.accent }} />
                                    </button>
                                )}
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
