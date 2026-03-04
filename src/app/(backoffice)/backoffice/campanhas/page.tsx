'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Search, Plus, TrendingUp, TrendingDown, DollarSign, Users,
    MousePointer, Target, Eye, Edit, Play, Pause, BarChart3,
    Instagram, Facebook, Globe, Mail, MessageSquare, Megaphone,
} from 'lucide-react'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const T = {
    bg: 'transparent', surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
    gold: '#486581',
}

export interface Campaign {
    id: string
    name: string
    objective: string | null
    channel: string
    status: string
    start_date: string | null
    end_date: string | null
    budget: number | null
    daily_budget: number | null
    spent: number
    impressions: number
    clicks: number
    leads: number
    conversions: number
    cost_per_lead: number | null
    ctr: number
    roi: number | null
    utm_source: string | null
    utm_campaign: string | null
    created_at: string
}

function useCampanhas(filters: { search?: string; status?: string; type?: string }) {
    return useSWR(['campanhas', filters], async () => {
        let query = supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false })

        if (filters.search) {
            query = query.ilike('name', `%${filters.search}%`)
        }
        if (filters.status && filters.status !== 'all') {
            query = query.eq('status', filters.status)
        }
        if (filters.type && filters.type !== 'all') {
            query = query.eq('channel', filters.type)
        }

        const { data, error } = await query
        if (error) throw error
        return (data || []) as Campaign[]
    })
}

const TYPE_MAP: Record<string, { label: string; icon: any }> = {
    google_ads: { label: 'Google Ads', icon: Globe },
    facebook: { label: 'Facebook', icon: Facebook },
    instagram: { label: 'Instagram', icon: Instagram },
    email: { label: 'Email', icon: Mail },
    whatsapp: { label: 'WhatsApp', icon: MessageSquare },
    sms: { label: 'SMS', icon: MessageSquare },
    organic: { label: 'Orgânico', icon: TrendingUp },
    referral: { label: 'Indicação', icon: Users },
    event: { label: 'Evento', icon: Target },
    other: { label: 'Outro', icon: BarChart3 },
}

const STATUS_MAP: Record<string, { label: string; textColor: string; bg: string; icon: any }> = {
    active: { label: 'Ativa', textColor: '#4CAF7D', bg: 'rgba(76,175,125,0.10)', icon: Play },
    paused: { label: 'Pausada', textColor: '#E8A87C', bg: 'rgba(232,168,124,0.10)', icon: Pause },
    completed: { label: 'Concluída', textColor: '#7B9EC4', bg: 'rgba(123,158,196,0.10)', icon: Target },
    draft: { label: 'Rascunho', textColor: '#A89EC4', bg: 'rgba(168,158,196,0.10)', icon: Edit },
    archived: { label: 'Arquivada', textColor: '#6B7280', bg: 'rgba(107,114,128,0.10)', icon: Eye },
}

const formatBRL = (v: number | null | undefined) => {
    if (!v && v !== 0) return '—'
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`
    return `R$ ${v.toFixed(2)}`
}

const fmt = (v: number | null | undefined, decimals = 0) =>
    v == null ? '—' : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(decimals)

export default function CampanhasPage() {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')

    const { data: campanhas, isLoading, mutate } = useCampanhas({
        search, status: statusFilter, type: typeFilter,
    })

    const totalBudget = campanhas?.reduce((s, c) => s + (c.budget || 0), 0) || 0
    const totalSpent = campanhas?.reduce((s, c) => s + (c.spent || 0), 0) || 0
    const totalLeads = campanhas?.reduce((s, c) => s + (c.leads || 0), 0) || 0
    const totalConversions = campanhas?.reduce((s, c) => s + (c.conversions || 0), 0) || 0
    const avgCTR = campanhas?.length
        ? (campanhas.reduce((s, c) => s + (c.ctr || 0), 0) / campanhas.length).toFixed(2)
        : '0.00'

    return (
        <div className="space-y-5">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Campanhas</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textDim }}>
                        Gestão de campanhas de marketing
                    </p>
                </div>
                <button
                    onClick={() => router.push('/backoffice/campanhas/nova')}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: T.gold }}
                >
                    <Plus size={16} />
                    Nova Campanha
                </button>
            </motion.div>

            {/* KPIs */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
                className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                    { label: 'Orçamento', value: formatBRL(totalBudget), color: T.gold },
                    { label: 'Investido', value: formatBRL(totalSpent), color: '#7BA3C2' },
                    { label: 'Leads', value: String(totalLeads), color: '#A89EC4' },
                    { label: 'Conversões', value: String(totalConversions), color: '#4CAF7D' },
                    { label: 'CTR Médio', value: `${avgCTR}%`, color: '#E8A87C' },
                ].map((kpi, i) => (
                    <div key={i} className="rounded-2xl p-4 transition-all"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <p className="text-xs mb-1.5" style={{ color: T.textDim }}>{kpi.label}</p>
                        <p className="text-xl font-bold" style={{ color: isLoading ? T.textDim : kpi.color }}>
                            {isLoading ? '—' : kpi.value}
                        </p>
                    </div>
                ))}
            </motion.div>

            {/* Filtros */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
                className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: T.textDim }} />
                    <input
                        type="text" placeholder="Buscar campanhas..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 rounded-xl text-sm outline-none"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="h-10 px-3 rounded-xl text-sm outline-none"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textSub }}>
                    <option value="all">Todos os status</option>
                    <option value="active">Ativa</option>
                    <option value="paused">Pausada</option>
                    <option value="completed">Concluída</option>
                    <option value="draft">Rascunho</option>
                </select>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                    className="h-10 px-3 rounded-xl text-sm outline-none"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textSub }}>
                    <option value="all">Todas as plataformas</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="google_ads">Google Ads</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="organic">Orgânico</option>
                </select>
            </motion.div>

            {/* Loading */}
            {isLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="rounded-2xl h-52 animate-pulse"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }} />
                    ))}
                </div>
            )}

            {/* Cards */}
            {!isLoading && campanhas && campanhas.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {campanhas.map((c, i) => {
                        const type = TYPE_MAP[c.channel] || TYPE_MAP.other
                        const status = STATUS_MAP[c.status] || STATUS_MAP.draft
                        const TypeIcon = type.icon
                        const StatusIcon = status.icon
                        const progressPct = c.budget ? Math.min((c.spent / c.budget) * 100, 100) : 0

                        return (
                            <motion.div key={c.id}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="rounded-2xl overflow-hidden cursor-pointer transition-all"
                                style={{ background: T.surface, border: `1px solid ${T.border}` }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.borderGold }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border }}
                                onClick={() => router.push(`/backoffice/campanhas/${c.id}`)}
                            >
                                {/* Card header */}
                                <div className="p-5" style={{ borderBottom: `1px solid ${T.border}` }}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ background: 'rgba(72,101,129,0.12)' }}>
                                                <TypeIcon size={18} style={{ color: T.gold }} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold leading-tight" style={{ color: T.text }}>{c.name}</p>
                                                <p className="text-xs mt-0.5" style={{ color: T.textDim }}>{type.label}</p>
                                            </div>
                                        </div>
                                        <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                                            style={{ color: status.textColor, background: status.bg }}>
                                            <StatusIcon size={10} />
                                            {status.label}
                                        </span>
                                    </div>

                                    {/* Budget progress */}
                                    {c.budget && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs"
                                                style={{ color: T.textDim }}>
                                                <span>Investido</span>
                                                <span style={{ color: T.text }}>{formatBRL(c.spent)} / {formatBRL(c.budget)}</span>
                                            </div>
                                            <div className="h-1.5 rounded-full overflow-hidden"
                                                style={{ background: T.elevated }}>
                                                <div className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${progressPct}%`,
                                                        background: progressPct > 90 ? '#E87C7C' : progressPct > 70 ? '#E8A87C' : T.gold,
                                                    }} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Metrics grid */}
                                <div className="p-5 grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Impressões', value: fmt(c.impressions), color: T.textSub },
                                        { label: 'Cliques', value: fmt(c.clicks), color: '#7BA3C2' },
                                        { label: 'CTR', value: `${Number(c.ctr ?? 0).toFixed(1)}%`, color: '#A89EC4' },
                                        { label: 'Leads', value: String(c.leads || 0), color: T.gold },
                                        { label: 'Conversões', value: String(c.conversions || 0), color: '#4CAF7D' },
                                        { label: 'CPL', value: formatBRL(c.cost_per_lead), color: '#E8A87C' },
                                    ].map((m, j) => (
                                        <div key={j}>
                                            <p className="text-[10px] mb-0.5" style={{ color: T.textDim }}>{m.label}</p>
                                            <p className="text-sm font-bold" style={{ color: m.color }}>{m.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && campanhas?.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-2xl p-16 flex flex-col items-center text-center"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: 'rgba(72,101,129,0.10)' }}>
                        <Megaphone size={24} style={{ color: T.gold }} />
                    </div>
                    <p className="text-base font-semibold mb-1" style={{ color: T.text }}>
                        Nenhuma campanha encontrada
                    </p>
                    <p className="text-sm mb-6" style={{ color: T.textDim }}>
                        {search || statusFilter !== 'all' || typeFilter !== 'all'
                            ? 'Tente ajustar os filtros.'
                            : 'Crie sua primeira campanha para começar a acompanhar resultados.'}
                    </p>
                    <button
                        onClick={() => router.push('/backoffice/campanhas/nova')}
                        className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white"
                        style={{ background: T.gold }}>
                        <Plus size={15} />
                        Nova Campanha
                    </button>
                </motion.div>
            )}
        </div>
    )
}
