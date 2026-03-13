'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, Plus, Zap, Phone, MessageSquare, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

// Neon temperature colors (from Stitch design)
const TEMP = {
    hot:  { bg: 'rgba(255,49,49,0.15)',  text: '#FF3131', border: 'rgba(255,49,49,0.4)',  glow: '0 0 10px rgba(255,49,49,0.35)'  },
    warm: { bg: 'rgba(255,215,0,0.14)',  text: '#FFD700', border: 'rgba(255,215,0,0.45)', glow: '0 0 10px rgba(255,215,0,0.35)'  },
    cold: { bg: 'rgba(0,245,255,0.10)',  text: '#00E5FF', border: 'rgba(0,245,255,0.35)', glow: '0 0 10px rgba(0,245,255,0.28)'  },
}

// Derive STATUS_CFG from centralized constants (colors + labels)
const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = Object.fromEntries(
    ['hot', 'warm', 'cold', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'new'].map(key => {
        const cfg = getStatusConfig(key)
        return [key, { label: cfg.label.toUpperCase(), bg: `${cfg.dot}26`, text: cfg.dot }]
    })
)

const SOURCE_ICON: Record<string, string> = {
    'google':     '🔍',
    'google ads': '🔍',
    'meta':       '📘',
    'meta ads':   '📘',
    'facebook':   '📘',
    'instagram':  '📸',
    'whatsapp':   '💬',
    'organic':    '🌱',
    'referral':   '🤝',
    'email':      '📧',
}

function getTemp(status: string, score: number): 'hot' | 'warm' | 'cold' {
    if (status === 'hot' || status === 'qualified' || score >= 75) return 'hot'
    if (status === 'warm' || status === 'contacted' || status === 'proposal' || score >= 45) return 'warm'
    return 'cold'
}

function getAIReasoning(lead: any): string {
    const firstName = lead.name?.split(' ')[0] || 'Lead'
    const score = lead.score || 0
    const source = lead.source || 'orgânico'
    const interest = lead.interest || 'imóveis de alto padrão'

    if (score >= 80 || lead.status === 'hot') {
        return `${firstName} demonstrou alto interesse em ${interest}. Capturado via ${source}. IA recomenda abordagem direta com proposta personalizada e urgência.`
    }
    if (score >= 50 || lead.status === 'warm' || lead.status === 'contacted') {
        return `${firstName} está aquecendo — ${score > 0 ? `score ${score}pts` : 'em análise'}. Interesse confirmado via ${source}. Sugerido: agendar visita ou tour virtual.`
    }
    if (lead.status === 'proposal') {
        return `Proposta enviada para ${firstName}. IA monitora engajamento. Último acesso ao link de proposta detectado. Follow-up sugerido.`
    }
    return `IA em análise do perfil de ${firstName}. Entrada via ${source}. Necessita qualificação adicional — transferir para consultor especializado.`
}

function timeAgo(iso: string | null): string {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const d = Math.floor(diff / 86400000)
    const h = Math.floor(diff / 3600000)
    const m = Math.floor(diff / 60000)
    if (d > 0) return `${d}d atrás`
    if (h > 0) return `${h}h atrás`
    if (m > 1) return `${m} min`
    return 'agora'
}

type FilterKey = 'all' | 'hot' | 'warm' | 'cold'

export default function LeadsInboxPage() {
    const router = useRouter()
    const [leads, setLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [filter, setFilter] = useState<FilterKey>('all')
    const [showSearch, setShowSearch] = useState(false)
    const [search, setSearch] = useState('')

    const loadLeads = async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)
        const supabase = createClient()
        const { data } = await supabase
            .from('leads')
            .select('*')
            .not('status', 'eq', 'lost')
            .order('updated_at', { ascending: false })
            .limit(80)
        setLeads(data || [])
        setLoading(false)
        setRefreshing(false)
    }

    useEffect(() => { loadLeads() }, [])

    const counts: Record<FilterKey, number> = {
        all:  leads.length,
        hot:  leads.filter(l => getTemp(l.status, l.score || 0) === 'hot').length,
        warm: leads.filter(l => getTemp(l.status, l.score || 0) === 'warm').length,
        cold: leads.filter(l => getTemp(l.status, l.score || 0) === 'cold').length,
    }

    const filtered = leads.filter(l => {
        const temp = getTemp(l.status, l.score || 0)
        if (filter !== 'all' && temp !== filter) return false
        if (search) {
            const q = search.toLowerCase()
            return l.name?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.phone?.includes(q)
        }
        return true
    })

    const TABS: { key: FilterKey; label: string; tc?: typeof TEMP.hot }[] = [
        { key: 'all',  label: `Tudo (${counts.all})` },
        { key: 'hot',  label: '🔥 HOT',  tc: TEMP.hot  },
        { key: 'warm', label: '⚡ Warm', tc: TEMP.warm },
        { key: 'cold', label: '❄️ Cold', tc: TEMP.cold  },
    ]

    return (
        <div className="max-w-2xl mx-auto pb-28">

            {/* Header */}
            <PageIntelHeader
                moduleLabel="LEADS"
                title="Inbox de Qualificação"
                subtitle="IA em tempo real · Scoring automático"
                live
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => loadLeads(true)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}
                            title="Atualizar"
                        >
                            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} style={{ color: T.textMuted }} />
                        </button>
                        <button
                            onClick={() => setShowSearch(v => !v)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                            style={{
                                background: showSearch ? T.accent : T.elevated,
                                border: `1px solid ${T.border}`,
                                boxShadow: showSearch ? '0 0 14px rgba(59,130,246,0.28)' : 'inset 0 1px 0 rgba(255,255,255,0.06)',
                            }}
                        >
                            <Search size={14} style={{ color: showSearch ? '#fff' : T.textMuted }} />
                        </button>
                        <button
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}
                        >
                            <SlidersHorizontal size={14} style={{ color: T.textMuted }} />
                        </button>
                    </div>
                }
            />

            {/* Search */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden mb-4"
                    >
                        <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por nome, email ou telefone..."
                            className="w-full h-10 px-4 rounded-xl text-sm outline-none"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filter tabs */}
            <div data-tour="filters" className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {TABS.map(tab => {
                    const isActive = filter === tab.key
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className="flex-shrink-0 h-8 px-4 rounded-full text-[11px] font-bold transition-all"
                            style={{
                                background: isActive ? (tab.tc?.bg ?? 'rgba(72,101,129,0.2)') : 'transparent',
                                border: `1px solid ${isActive ? (tab.tc?.border ?? T.accent) : T.border}`,
                                color: isActive ? (tab.tc?.text ?? T.accent) : T.textMuted,
                                boxShadow: isActive && tab.tc ? tab.tc.glow : 'none',
                            }}
                        >
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse rounded-2xl"
                            style={{ background: T.elevated, height: 120, opacity: 1 - i * 0.25 }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <div style={{ fontSize: 40 }}>📭</div>
                    <p className="text-sm font-medium" style={{ color: T.textMuted }}>
                        {filter !== 'all' ? `Sem leads ${filter.toUpperCase()} no momento` : 'Inbox vazio'}
                    </p>
                    <Link href="/backoffice/leads/novo"
                        className="mt-2 h-9 px-5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
                        style={{ background: T.accent }}
                    >
                        <Plus size={13} /> Capturar Lead
                    </Link>
                </div>
            ) : (
                <div data-tour="lead-list" className="space-y-3">
                    {filtered.map((lead, idx) => {
                        const temp = getTemp(lead.status, lead.score || 0)
                        const tc = TEMP[temp]
                        const status = lead.status || 'new'
                        const sc = STATUS_CFG[status] || STATUS_CFG.new
                        const reasoning = getAIReasoning(lead)
                        const srcIcon = SOURCE_ICON[(lead.source || '').toLowerCase()] || '🌐'

                        return (
                            <motion.div
                                key={lead.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04, duration: 0.22 }}
                            >
                                <button
                                    onClick={() => router.push(`/backoffice/leads/inbox/${lead.id}`)}
                                    className="w-full text-left rounded-2xl p-4 hover:scale-[1.01] active:scale-[0.998]"
                                    style={{
                                        background: T.elevated,
                                        border: `1px solid ${T.border}`,
                                        display: 'block',
                                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                                        transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                                    }}
                                >
                                    {/* Row 1: Name + Temp + Time */}
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-bold text-[14px] truncate" style={{ color: T.text }}>
                                                {lead.name}
                                            </span>
                                            <span
                                                className="flex-shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider"
                                                style={{
                                                    background: tc.bg,
                                                    color: tc.text,
                                                    border: `1px solid ${tc.border}`,
                                                    boxShadow: tc.glow,
                                                }}
                                            >
                                                {temp.toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-[10px] flex-shrink-0" style={{ color: T.textMuted }}>
                                            {timeAgo(lead.updated_at || lead.created_at)}
                                        </span>
                                    </div>

                                    {/* Row 2: Status + Interest */}
                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                        <span
                                            className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
                                            style={{ background: sc.bg, color: sc.text }}
                                        >
                                            {sc.label}
                                        </span>
                                        {lead.interest && (
                                            <span className="text-[11px] flex items-center gap-1" style={{ color: T.textMuted }}>
                                                <span style={{ opacity: 0.4 }}>·</span>
                                                {lead.interest}
                                            </span>
                                        )}
                                        {lead.source && (
                                            <span className="text-[11px] ml-auto flex items-center gap-1" style={{ color: T.textMuted }}>
                                                {srcIcon}
                                                <span className="hidden sm:inline">{lead.source}</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* AI Reasoning */}
                                    <div
                                        className="flex items-start gap-2 pt-2"
                                        style={{ borderTop: `1px solid ${T.border}` }}
                                    >
                                        <Zap size={11} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--bo-success)' }} />
                                        <p className="text-[11px] leading-[1.55]" style={{ color: T.textMuted }}>
                                            {reasoning}
                                        </p>
                                    </div>

                                    {/* Score if available */}
                                    {(lead.score ?? 0) > 0 && (
                                        <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-1.5 rounded-full overflow-hidden" style={{ width: 80, background: 'rgba(255,255,255,0.08)' }}>
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${Math.min(lead.score, 100)}%`,
                                                            background: lead.score >= 75 ? tc.text : lead.score >= 45 ? 'var(--bo-warning)' : '#94A3B8',
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold" style={{ color: tc.text }}>
                                                    {lead.score} pts
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`tel:${lead.phone}`}
                                                    onClick={e => e.stopPropagation()}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:scale-110"
                                                    style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)' }}
                                                >
                                                    <Phone size={12} style={{ color: '#60A5FA' }} />
                                                </a>
                                                <a
                                                    href={`https://wa.me/55${(lead.phone || '').replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:scale-110"
                                                    style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)' }}
                                                >
                                                    <MessageSquare size={12} style={{ color: '#25D366' }} />
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </button>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* FAB */}
            <Link
                href="/backoffice/leads/novo"
                className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
                style={{ background: 'var(--bo-accent)', zIndex: 50 }}
            >
                <Plus size={22} color="white" />
            </Link>
        </div>
    )
}
