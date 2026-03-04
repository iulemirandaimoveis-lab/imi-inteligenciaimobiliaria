'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Sun, Moon, Plus, Users, CalendarDays,
    Phone, MessageCircle, ChevronRight,
    Flame, Clock, ArrowRight, Building2, Zap,
    Sparkles, TrendingUp,
} from 'lucide-react'

// ── Design tokens ───────────────────────────────────────────────
const T = {
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)',
    textSub: 'var(--bo-text-muted)',
    gold: '#486581',
    surface: 'var(--bo-surface)',
}

// ── Helpers ─────────────────────────────────────────────────────
function getGreeting(): { text: string; Icon: any } {
    const h = new Date().getHours()
    if (h < 12) return { text: 'Bom dia', Icon: Sun }
    if (h < 18) return { text: 'Boa tarde', Icon: Sun }
    return { text: 'Boa noite', Icon: Moon }
}

function todayLabel() {
    return new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    })
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ── Subcomponents ────────────────────────────────────────────────
function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div
            className="rounded-2xl p-3 flex flex-col gap-0.5"
            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
        >
            <p className="text-2xl font-bold leading-none" style={{ color }}>{value}</p>
            <p className="text-[11px] mt-1 leading-tight" style={{ color: T.textSub }}>{label}</p>
        </div>
    )
}

// ── Main Page ────────────────────────────────────────────────────
export default function HojePage() {
    const router = useRouter()
    const [leads, setLeads] = useState<any[]>([])
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const { text: greetText, Icon: GreetIcon } = getGreeting()
    const todayISO = new Date().toISOString().split('T')[0]
    const currentMonth = todayISO.slice(0, 7)

    useEffect(() => {
        Promise.all([
            fetch('/api/leads').then(r => r.json()).catch(() => []),
            fetch(`/api/agenda?month=${currentMonth}`).then(r => r.json()).catch(() => []),
        ]).then(([leadsData, eventsData]) => {
            setLeads(Array.isArray(leadsData) ? leadsData : [])
            setEvents(Array.isArray(eventsData) ? eventsData : [])
            setLoading(false)
        })
    }, [currentMonth])

    // Today's events
    const todayEvents = events.filter(e => e.start_time?.startsWith(todayISO))

    // Hot leads needing attention
    const hotLeads = leads.filter(l => l.status === 'hot').slice(0, 5)

    // Stats
    const hotCount = leads.filter(l => l.status === 'hot').length
    const warmCount = leads.filter(l => l.status === 'warm').length

    const QUICK_ACTIONS = [
        { label: 'Novo Lead', icon: Users, href: '/backoffice/leads/novo', color: '#486581' },
        { label: 'Evento', icon: CalendarDays, href: '/backoffice/agenda', color: '#8B5CF6' },
        { label: 'WhatsApp', icon: MessageCircle, href: '/backoffice/whatsapp', color: '#25D366' },
    ]

    if (loading) {
        return (
            <div className="space-y-4 max-w-2xl mx-auto">
                <div className="skeleton h-6 w-40 rounded-xl" />
                <div className="skeleton h-4 w-56 rounded-xl" />
                <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map(i => <div key={i} className="skeleton-card h-20 rounded-2xl" />)}
                </div>
                <div className="skeleton-card h-36 rounded-2xl" />
                <div className="skeleton-card h-48 rounded-2xl" />
            </div>
        )
    }

    return (
        <div className="space-y-4 max-w-2xl mx-auto">

            {/* ── Greeting ────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex items-center gap-2 mb-0.5">
                    <GreetIcon size={16} style={{ color: '#E8A87C' }} />
                    <p className="text-sm font-medium" style={{ color: T.textSub }}>
                        {greetText}, Iule
                    </p>
                </div>
                <h1
                    className="text-xl font-bold capitalize"
                    style={{ color: T.text }}
                >
                    {todayLabel()}
                </h1>
            </motion.div>

            {/* ── Quick Actions ─────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid grid-cols-3 gap-2"
            >
                {QUICK_ACTIONS.map((a, i) => (
                    <motion.button
                        key={a.label}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.08 + i * 0.04 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => router.push(a.href)}
                        className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                    >
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: `${a.color}1A` }}
                        >
                            <a.icon size={16} style={{ color: a.color }} />
                        </div>
                        <span className="text-[11px] font-semibold leading-tight text-center" style={{ color: T.textSub }}>
                            {a.label}
                        </span>
                    </motion.button>
                ))}
            </motion.div>

            {/* ── Stats Row ─────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="grid grid-cols-3 gap-2"
            >
                <StatBadge label="Leads Quentes" value={hotCount} color="#E8A87C" />
                <StatBadge label="Eventos Hoje" value={todayEvents.length} color="#486581" />
                <StatBadge label="Total Leads" value={leads.length} color="var(--bo-text-muted)" />
            </motion.div>

            {/* ── Agenda de Hoje ────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: `1px solid ${T.border}` }}
                >
                    <div className="flex items-center gap-2">
                        <CalendarDays size={14} style={{ color: T.gold }} />
                        <span className="text-sm font-bold" style={{ color: T.text }}>
                            Agenda de Hoje
                        </span>
                        {todayEvents.length > 0 && (
                            <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: `${T.gold}20`, color: T.gold }}
                            >
                                {todayEvents.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => router.push('/backoffice/agenda')}
                        className="flex items-center gap-1 text-xs font-semibold"
                        style={{ color: T.gold }}
                    >
                        Agenda <ChevronRight size={12} />
                    </button>
                </div>

                {/* Content */}
                {todayEvents.length === 0 ? (
                    <div className="py-7 px-4 text-center">
                        <CalendarDays
                            size={22}
                            className="mx-auto mb-2"
                            style={{ color: T.textSub, opacity: 0.25 }}
                        />
                        <p className="text-sm mb-3" style={{ color: T.textSub }}>
                            Nenhum evento agendado para hoje
                        </p>
                        <button
                            onClick={() => router.push('/backoffice/agenda')}
                            className="text-xs font-semibold px-4 py-2 rounded-xl"
                            style={{ background: `${T.gold}18`, color: T.gold }}
                        >
                            + Agendar compromisso
                        </button>
                    </div>
                ) : (
                    todayEvents.map((ev, i) => (
                        <div
                            key={ev.id}
                            className="flex items-center gap-3 px-4 py-3"
                            style={{
                                borderBottom: i < todayEvents.length - 1 ? `1px solid ${T.border}` : 'none',
                            }}
                        >
                            <div
                                className="w-1 h-9 rounded-full flex-shrink-0"
                                style={{ background: ev.color || T.gold }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: T.text }}>
                                    {ev.title}
                                </p>
                                <p className="text-xs flex items-center gap-1" style={{ color: T.textSub }}>
                                    <Clock size={10} />
                                    {formatTime(ev.start_time)}
                                    {ev.location && ` · ${ev.location}`}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </motion.div>

            {/* ── Leads Quentes ─────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: `1px solid ${T.border}` }}
                >
                    <div className="flex items-center gap-2">
                        <Flame size={14} style={{ color: '#E8A87C' }} />
                        <span className="text-sm font-bold" style={{ color: T.text }}>
                            Leads Quentes
                        </span>
                        {hotCount > 0 && (
                            <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: 'rgba(232,168,124,0.15)', color: '#E8A87C' }}
                            >
                                {hotCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => router.push('/backoffice/leads')}
                        className="flex items-center gap-1 text-xs font-semibold"
                        style={{ color: T.gold }}
                    >
                        Ver todos <ChevronRight size={12} />
                    </button>
                </div>

                {/* Content */}
                {hotLeads.length === 0 ? (
                    <div className="py-7 px-4 text-center">
                        <Users
                            size={22}
                            className="mx-auto mb-2"
                            style={{ color: T.textSub, opacity: 0.25 }}
                        />
                        <p className="text-sm mb-3" style={{ color: T.textSub }}>
                            Nenhum lead quente no momento
                        </p>
                        <button
                            onClick={() => router.push('/backoffice/leads/novo')}
                            className="text-xs font-semibold px-4 py-2 rounded-xl"
                            style={{ background: `${T.gold}18`, color: T.gold }}
                        >
                            + Novo Lead
                        </button>
                    </div>
                ) : (
                    hotLeads.map((l, i) => (
                        <motion.button
                            key={l.id}
                            whileTap={{ scale: 0.985 }}
                            onClick={() => router.push(`/backoffice/leads/${l.id}`)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                            style={{
                                borderBottom: i < hotLeads.length - 1 ? `1px solid ${T.border}` : 'none',
                            }}
                        >
                            {/* Avatar */}
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                style={{ background: 'rgba(232,168,124,0.15)', color: '#E8A87C' }}
                            >
                                {(l.name || '?').charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: T.text }}>
                                    {l.name || 'Sem nome'}
                                </p>
                                <p className="text-xs truncate" style={{ color: T.textSub }}>
                                    {l.interest || l.city || 'Sem interesse definido'}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <motion.div
                                    whileTap={{ scale: 0.85 }}
                                    onClick={e => {
                                        e.stopPropagation()
                                        if (l.phone) window.location.href = `tel:${l.phone}`
                                    }}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
                                    style={{ background: 'rgba(232,168,124,0.12)' }}
                                >
                                    <Phone size={13} style={{ color: '#E8A87C' }} />
                                </motion.div>
                                <motion.div
                                    whileTap={{ scale: 0.85 }}
                                    onClick={e => {
                                        e.stopPropagation()
                                        if (l.phone) window.open(`https://wa.me/${l.phone?.replace(/\D/g, '')}`)
                                    }}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
                                    style={{ background: 'rgba(37,211,102,0.1)' }}
                                >
                                    <MessageCircle size={13} style={{ color: '#25D366' }} />
                                </motion.div>
                            </div>
                        </motion.button>
                    ))
                )}
            </motion.div>

            {/* ── Pipeline Shortcut ─────────────────────── */}
            <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/backoffice/leads')}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${T.gold}18` }}
                    >
                        <TrendingUp size={16} style={{ color: T.gold }} />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold" style={{ color: T.text }}>
                            Pipeline completo
                        </p>
                        <p className="text-xs" style={{ color: T.textSub }}>
                            {leads.length} leads · {hotCount} quentes · {warmCount} mornos
                        </p>
                    </div>
                </div>
                <ArrowRight size={16} style={{ color: T.textSub }} />
            </motion.button>

            {/* ── Imóveis Shortcut ──────────────────────── */}
            <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.27 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/backoffice/imoveis')}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(139,92,246,0.12)' }}
                    >
                        <Building2 size={16} style={{ color: '#8B5CF6' }} />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold" style={{ color: T.text }}>
                            Portfólio de Imóveis
                        </p>
                        <p className="text-xs" style={{ color: T.textSub }}>
                            Ver e gerenciar empreendimentos
                        </p>
                    </div>
                </div>
                <ArrowRight size={16} style={{ color: T.textSub }} />
            </motion.button>

        </div>
    )
}
