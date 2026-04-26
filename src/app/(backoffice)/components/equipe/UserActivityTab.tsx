'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Clock, RefreshCw, Wifi, WifiOff, Coffee, AlertCircle,
    Timer, CalendarClock, User,
} from 'lucide-react'
import { T } from '../../lib/theme'

/* ── Types ───────────────────────────────────────────────────── */
interface UserActivity {
    broker_id: string
    user_id: string
    name: string
    email: string
    avatar_url: string | null
    role: string
    last_login_at: string | null
    presence_status: 'online' | 'away' | 'busy' | 'offline'
    status_message: string
    last_seen_at: string | null
    today_seconds: number
}

/* ── Config ──────────────────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    online: { label: 'Online',   color: '#4ADE80', bg: 'rgba(74,222,128,0.12)',   icon: Wifi },
    away:   { label: 'Ausente',  color: '#FBBF24', bg: 'rgba(251,191,36,0.12)',   icon: Coffee },
    busy:   { label: 'Ocupado',  color: '#F87171', bg: 'rgba(248,113,113,0.12)',  icon: AlertCircle },
    offline:{ label: 'Offline',  color: '#556170', bg: 'rgba(85,97,112,0.08)',    icon: WifiOff },
}

const ROLE_LABEL: Record<string, string> = {
    broker: 'Corretor',
    broker_manager: 'Gerente',
    admin: 'Administrador',
}

/* ── Helpers ─────────────────────────────────────────────────── */
function fmtDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

function fmtRelative(iso: string | null): string {
    if (!iso) return '—'
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'agora mesmo'
    if (mins < 60) return `há ${mins} min`
    if (hours < 24) return `há ${hours}h`
    if (days === 1) return 'ontem'
    return `há ${days} dias`
}

function initials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'
}

/* ── Avatar ──────────────────────────────────────────────────── */
function Avatar({ user, size = 40 }: { user: UserActivity; size?: number }) {
    const cfg = STATUS_CFG[user.presence_status] || STATUS_CFG.offline
    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={user.avatar_url} alt={user.name}
                    className="rounded-full object-cover w-full h-full"
                    style={{ border: `2px solid ${cfg.color}44` }}
                />
            ) : (
                <div
                    className="rounded-full flex items-center justify-center text-xs font-bold w-full h-full"
                    style={{
                        background: cfg.bg,
                        border: `2px solid ${cfg.color}44`,
                        color: cfg.color,
                    }}
                >
                    {initials(user.name)}
                </div>
            )}
            {/* Status dot */}
            <span
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full"
                style={{
                    background: cfg.color,
                    border: `2px solid var(--bg, #050B14)`,
                    boxShadow: user.presence_status === 'online' ? `0 0 6px ${cfg.color}80` : undefined,
                }}
            />
        </div>
    )
}

/* ── Row card ────────────────────────────────────────────────── */
function ActivityRow({ user, index }: { user: UserActivity; index: number }) {
    const cfg = STATUS_CFG[user.presence_status] || STATUS_CFG.offline
    const StatusIcon = cfg.icon

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3 }}
            className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-white/3"
            style={{ background: T.surface, border: `1px solid ${user.presence_status === 'online' ? cfg.color + '33' : T.border}` }}
        >
            <Avatar user={user} size={42} />

            {/* Name + role */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold truncate" style={{ color: T.text }}>
                        {user.name}
                    </span>
                    <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ color: cfg.color, background: cfg.bg }}
                    >
                        <StatusIcon size={9} />
                        {cfg.label}
                    </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-[11px]" style={{ color: T.textDim }}>
                        {ROLE_LABEL[user.role] || user.role}
                    </span>
                    {user.status_message && (
                        <span className="text-[11px] italic truncate max-w-[140px]" style={{ color: T.textMuted }}>
                            "{user.status_message}"
                        </span>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 flex-shrink-0">
                {/* Último acesso */}
                <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1 justify-end">
                        <CalendarClock size={10} style={{ color: T.textDim }} />
                        <span className="text-[10px] font-medium" style={{ color: T.textDim }}>Último acesso</span>
                    </div>
                    <p className="text-xs font-semibold" style={{ color: user.last_login_at ? T.text : T.textDim }}>
                        {fmtRelative(user.last_login_at)}
                    </p>
                </div>

                {/* Tempo hoje */}
                <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                        <Timer size={10} style={{ color: T.textDim }} />
                        <span className="text-[10px] font-medium" style={{ color: T.textDim }}>Hoje</span>
                    </div>
                    <p
                        className="text-xs font-bold"
                        style={{ color: user.today_seconds > 0 ? '#4ADE80' : T.textDim }}
                    >
                        {user.today_seconds > 0 ? fmtDuration(user.today_seconds) : '—'}
                    </p>
                </div>

                {/* Last seen */}
                {user.last_seen_at && user.presence_status !== 'online' && (
                    <div className="text-right hidden md:block">
                        <div className="flex items-center gap-1 justify-end">
                            <Clock size={10} style={{ color: T.textDim }} />
                            <span className="text-[10px] font-medium" style={{ color: T.textDim }}>Visto</span>
                        </div>
                        <p className="text-xs" style={{ color: T.textMuted }}>
                            {fmtRelative(user.last_seen_at)}
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

/* ── KPI summary ─────────────────────────────────────────────── */
function KPIBar({ data }: { data: UserActivity[] }) {
    const online  = data.filter(u => u.presence_status === 'online').length
    const away    = data.filter(u => u.presence_status === 'away').length
    const busy    = data.filter(u => u.presence_status === 'busy').length
    const offline = data.filter(u => u.presence_status === 'offline').length

    const totalTodaySecs = data.reduce((s, u) => s + u.today_seconds, 0)

    const pill = (color: string, label: string, count: number) => (
        <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: count > 0 ? `0 0 6px ${color}80` : undefined }} />
            <span className="text-[11px] font-semibold" style={{ color: count > 0 ? color : T.textDim }}>
                {count} {label}
            </span>
        </div>
    )

    return (
        <div
            className="flex items-center flex-wrap gap-x-5 gap-y-2 px-4 py-3 rounded-xl"
            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
        >
            {pill('#4ADE80', 'online',  online)}
            {pill('#FBBF24', 'ausente', away)}
            {pill('#F87171', 'ocupado', busy)}
            {pill('#556170', 'offline', offline)}
            <div className="ml-auto flex items-center gap-1.5">
                <Timer size={12} style={{ color: T.textDim }} />
                <span className="text-[11px]" style={{ color: T.textMuted }}>
                    Total hoje:
                </span>
                <span className="text-[11px] font-bold" style={{ color: '#4ADE80' }}>
                    {totalTodaySecs > 0 ? fmtDuration(totalTodaySecs) : '0m'}
                </span>
            </div>
        </div>
    )
}

/* ── Main component ──────────────────────────────────────────── */
export function UserActivityTab() {
    const [data, setData] = useState<UserActivity[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
    const [refreshing, setRefreshing] = useState(false)

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)
        setError(null)
        try {
            const res = await fetch('/api/admin/user-activity', { cache: 'no-store' })
            if (res.status === 403) {
                setError('Acesso restrito a administradores e gerentes.')
                return
            }
            if (!res.ok) throw new Error('Erro ao carregar dados')
            const json = await res.json()
            setData(json.data || [])
            setLastRefresh(new Date())
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erro desconhecido')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        load()
        // Auto-refresh every 30s
        const interval = setInterval(() => load(true), 30_000)
        return () => clearInterval(interval)
    }, [load])

    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl animate-pulse"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }} />
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-xl p-10 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <User size={28} className="mx-auto mb-3 opacity-30" style={{ color: T.textMuted }} />
                <p className="text-sm font-semibold" style={{ color: T.text }}>{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold" style={{ color: T.textDim }}>
                        {data.length} {data.length === 1 ? 'membro' : 'membros'} ativos
                    </p>
                    <p className="text-[10px]" style={{ color: T.textDim }}>
                        Atualizado {fmtRelative(lastRefresh.toISOString())}
                    </p>
                </div>
                <button
                    onClick={() => load(true)}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
                >
                    <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
                    Atualizar
                </button>
            </div>

            {/* KPI bar */}
            {data.length > 0 && <KPIBar data={data} />}

            {/* Activity list */}
            <AnimatePresence mode="wait">
                {data.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="rounded-xl p-12 text-center"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }}
                    >
                        <User size={28} className="mx-auto mb-3 opacity-30" style={{ color: T.textMuted }} />
                        <p className="text-sm font-semibold" style={{ color: T.text }}>Nenhum membro encontrado</p>
                    </motion.div>
                ) : (
                    <motion.div key="list" className="space-y-2">
                        {data.map((u: UserActivity, i: number) => (
                            <ActivityRow key={u.broker_id} user={u} index={i} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
