'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'
import {
    TrendingUp, Users, Building2, Scale, Plus,
    ChevronRight, Banknote, BarChart2, AlertTriangle,
    Info, ArrowUpRight, Zap,
    CalendarDays, Clock, MapPin, Target,
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const PerformanceChart = dynamic(
    () => import('./components/PerformanceChart'),
    {
        loading: () => (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                Carregando gráfico...
            </div>
        ),
        ssr: false,
    },
)
import { KPICard, MetricBar, StatusBadge, SectionHeader, MarketTicker } from '../../components/ui'
import { type BrokerAvatar } from '@/components/ui/AvatarGroup'
import { AvatarGroup, AvatarGroupTooltip } from '@/components/animate-ui/components/animate/avatar-group'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { T } from '@/app/(backoffice)/lib/theme'
import { staggerContainer, cardVariants } from '@/lib/motion-config'
import { createClient } from '@/lib/supabase/client'

// ── Avatar helpers ─────────────────────────────────────────────
function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}
const PALETTES = [
    ['var(--info)','rgba(96,165,250,0.20)'],['var(--success)','rgba(74,222,128,0.18)'],
    ['var(--accent-pink, #F472B6)','rgba(244,114,182,0.18)'],['var(--accent-purple, #A78BFA)','rgba(167,139,250,0.18)'],
    ['var(--success)','rgba(52,211,153,0.18)'],['var(--warning)','rgba(251,191,36,0.16)'],
]
function getPalette(name: string) {
    let h = 0
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xff
    return PALETTES[h % PALETTES.length]
}

// ── Animated counter ──────────────────────────────────────────
function AnimNum({ value, prefix = '', suffix = '', decimals = 0 }: {
    value: number; prefix?: string; suffix?: string; decimals?: number
}) {
    const ref = useRef<HTMLSpanElement>(null)
    const inView = useInView(ref, { once: true })
    const mv = useMotionValue(0)
    const spring = useSpring(mv, { stiffness: 90, damping: 22 })
    useEffect(() => { if (inView) mv.set(value) }, [inView, value, mv])
    useEffect(() => spring.on('change', v => {
        if (ref.current) ref.current.textContent = prefix + v.toFixed(decimals) + suffix
    }), [spring, prefix, suffix, decimals])
    return <span ref={ref}>{prefix}0{suffix}</span>
}

// ── Status maps ───────────────────────────────────────────────
const LEAD_STATUS_MAP: Record<string, { statusKey: string; label: string }> = {
    hot:  { statusKey: 'hot',    label: 'HOT' },
    warm: { statusKey: 'warm',   label: 'WARM' },
    cold: { statusKey: 'cold',   label: 'COLD' },
    new:  { statusKey: 'active', label: 'NOVO' },
}
const AV_STATUS_MAP: Record<string, { statusKey: string; label: string }> = {
    concluida:       { statusKey: 'done',   label: 'CONCLUÍDA' },
    em_andamento:    { statusKey: 'active', label: 'EM ANDAMENTO' },
    aguardando_docs: { statusKey: 'pend',   label: 'DOCS' },
    pgto_pendente:   { statusKey: 'pend',   label: 'PGTO PEND.' },
}

// ── Interfaces ────────────────────────────────────────────────
interface ChartPoint { mes: string; leads: number; receita: number }
interface CanalItem  { canal: string; leads: number; pct: number }
interface Alerta     { tipo: string; mensagem: string; href: string; acao: string; cor: string }

interface Props {
    stats: { total_leads: number; leads_today: number; receita_mes: number }
    avStats: { total: number; concluidas: number; em_andamento: number; honorarios_recebidos: number; honorarios_pendentes: number }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentLeads: any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentAvaliacoes: any[]
    imoveisCount: number
    chartData: ChartPoint[]
    canalPerformance: CanalItem[]
    alertas: Alerta[]
    brokers?: BrokerAvatar[]
}


const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const fmtCompact = (v: number) => {
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
    if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}k`
    return fmt(v)
}

// ── Widget 1: Taxa de Conversão por Fonte (live from DB) ──────
const SOURCE_COLORS: Record<string, string> = {
    referral: 'var(--success)',
    whatsapp: 'var(--info)',
    instagram: 'var(--accent-purple, #A78BFA)',
    facebook: 'var(--warning)',
    organico: 'var(--accent-pink, #F472B6)',
    google: 'var(--accent-400)',
    email: 'var(--info)',
    site: 'var(--success)',
    outro: 'var(--text-tertiary)',
}
const SOURCE_LABELS: Record<string, string> = {
    referral: 'Referral', whatsapp: 'WhatsApp', instagram: 'Instagram',
    facebook: 'Facebook', organico: 'Orgânico', google: 'Google',
    email: 'Email', site: 'Site', outro: 'Outro',
}

function ConversaoFonteWidget() {
    const [data, setData] = useState<{ fonte: string; count: number; pct: number; color: string }[]>([])

    useEffect(() => {
        (async () => {
            const supabase = createClient()
            // Try to get real data from leads source field
            const { data: leads } = await supabase
                .from('leads')
                .select('source')
            if (leads && leads.length > 0) {
                const counts: Record<string, number> = {}
                for (const l of leads) {
                    const src = (l.source || 'outro').toLowerCase()
                    counts[src] = (counts[src] || 0) + 1
                }
                const total = leads.length
                const sorted = Object.entries(counts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([key, count]) => ({
                        fonte: SOURCE_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1),
                        count,
                        pct: Math.round((count / total) * 100),
                        color: SOURCE_COLORS[key] || 'var(--text-tertiary)',
                    }))
                setData(sorted)
            } else {
                // Fallback when no leads exist
                setData([
                    { fonte: 'Referral', count: 0, pct: 0, color: 'var(--success)' },
                    { fonte: 'WhatsApp', count: 0, pct: 0, color: 'var(--info)' },
                ])
            }
        })()
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52, duration: 0.35 }}
            className="rounded-[10px] overflow-hidden"
            style={{
                background: 'rgba(14,28,48,.52)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(200,164,74,.12)',
                borderRadius: '10px',
                boxShadow: '0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.04)',
                padding: '20px',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(200,164,74,.30)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(200,164,74,.12)')}
        >
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={13} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Conversão por Fonte
                </span>
            </div>
            <div className="space-y-2.5">
                {data.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Sem dados de fonte ainda</p>
                ) : data.map((item) => (
                    <div key={item.fonte}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                                {item.fonte}
                            </span>
                            <span className="text-[11px] font-bold tabular-nums" style={{ color: item.color }}>
                                {item.pct}%
                            </span>
                        </div>
                        <div className="h-[4px] rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.pct}%` }}
                                transition={{ delay: 0.6, duration: 0.7, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ background: item.color }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}

// ── Widget 2: Próximos Compromissos ──────────────────────────
interface AgendaItem {
    id: string
    title: string
    description: string | null
    event_type: string
    start_time: string
    end_time: string | null
    all_day: boolean
    location: string | null
    color: string
    created_at: string
}

function ProximosCompromissosWidget() {
    const [items, setItems] = useState<AgendaItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0]
        fetch(`/api/agenda?from=${today}&limit=4`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (Array.isArray(data)) setItems(data)
                else if (data?.items) setItems(data.items)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr)
        const day = d.getDate()
        const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
        return `${day} ${months[d.getMonth()]}`
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.56, duration: 0.35 }}
            className="rounded-[10px] overflow-hidden"
            style={{
                background: 'rgba(14,28,48,.52)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(200,164,74,.12)',
                borderRadius: '10px',
                boxShadow: '0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.04)',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(200,164,74,.30)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(200,164,74,.12)')}
        >
            <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid var(--border-default)' }}>
                <div className="flex items-center gap-2">
                    <CalendarDays size={13} style={{ color: 'var(--info)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Próximos Compromissos
                    </span>
                </div>
                <Link href="/backoffice/agenda">
                    <span className="text-[11px] font-semibold flex items-center gap-1"
                        style={{ color: 'var(--accent-400)' }}>
                        Ver agenda <ArrowUpRight size={10} />
                    </span>
                </Link>
            </div>
            <div>
                {loading ? (
                    <div className="px-4 py-3 space-y-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
                        ))}
                    </div>
                ) : items.length > 0 ? (
                    items.slice(0, 4).map((item) => (
                        <div key={item.id}
                            className="flex items-center gap-3 px-4 py-2.5 transition-all cursor-pointer"
                            style={{ borderBottom: '1px solid var(--border-subtle)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <div className="flex-shrink-0 flex flex-col items-center justify-center"
                                style={{
                                    width: 36, height: 36, borderRadius: 6,
                                    background: 'var(--info-bg, rgba(96,165,250,0.10))',
                                    border: '1px solid var(--info-border, rgba(96,165,250,0.20))',
                                }}>
                                <span className="text-[11px] font-bold tabular-nums leading-none" style={{ color: 'var(--info)' }}>
                                    {new Date(item.start_time).getDate()}
                                </span>
                                <span className="text-[11px] uppercase" style={{ color: 'var(--text-muted)' }}>
                                    {['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][new Date(item.start_time).getMonth()]}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                    {item.title || 'Sem título'}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                        <Clock size={9} /> {new Date(item.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Recife' })}
                                    </span>
                                    {item.location && (
                                        <span className="flex items-center gap-1 text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                                            <MapPin size={9} /> {item.location}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-8 text-center">
                        <CalendarDays size={20} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Nenhum compromisso próximo
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

// ── Widget 3: Top Imóveis com Interesse ───────────────────────
const TOP_IMOVEIS_PLACEHOLDER = [
    { id: '1', nome: 'Edifício Atlântico',  engajamento: 92, leads: 24, tipo: 'Residencial' },
    { id: '2', nome: 'Vila Harmonia',       engajamento: 78, leads: 18, tipo: 'Comercial'   },
    { id: '3', nome: 'Residencial Serra',   engajamento: 61, leads: 11, tipo: 'Residencial' },
    { id: '4', nome: 'Parque das Flores',   engajamento: 44, leads: 7,  tipo: 'Misto'       },
]

function TopImoveisWidget() {
    const [data, setData] = useState(TOP_IMOVEIS_PLACEHOLDER)

    useEffect(() => {
        fetch('/api/developers?limit=4&order=leads_count')
            .then(r => r.ok ? r.json() : null)
            .then(json => {
                if (Array.isArray(json) && json.length > 0) {
                    const mapped = json.map((d: any, i: number) => ({
                        id: d.id,
                        nome: d.name ?? d.nome ?? 'Empreendimento',
                        engajamento: Math.max(10, 92 - i * 15),
                        leads: d.leads_count ?? d.leads ?? 0,
                        tipo: d.tipo ?? d.type ?? 'Residencial',
                    }))
                    setData(mapped)
                }
            })
            .catch(() => {})
    }, [])

    const barColors = ['var(--accent-400)','var(--info)','var(--success)','var(--accent-purple, #A78BFA)']

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.60, duration: 0.35 }}
            className="rounded-[10px] overflow-hidden"
            style={{
                background: 'rgba(14,28,48,.52)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(200,164,74,.12)',
                borderRadius: '10px',
                boxShadow: '0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.04)',
                padding: '20px',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(200,164,74,.30)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(200,164,74,.12)')}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Building2 size={13} style={{ color: 'var(--accent-400)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Top Imóveis com Interesse
                    </span>
                </div>
                <Link href="/backoffice/imoveis">
                    <span className="text-[11px] font-semibold flex items-center gap-1"
                        style={{ color: 'var(--accent-400)' }}>
                        Ver todos <ArrowUpRight size={10} />
                    </span>
                </Link>
            </div>
            <div className="space-y-3">
                {data.map((imovel, i) => (
                    <Link key={imovel.id} href={`/backoffice/imoveis/${imovel.id}`}>
                        <div className="group cursor-pointer">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[11px] font-bold tabular-nums flex-shrink-0"
                                        style={{ color: barColors[i] }}>
                                        #{i + 1}
                                    </span>
                                    <span className="text-[12px] font-semibold truncate"
                                        style={{ color: 'var(--text-primary)' }}>
                                        {imovel.nome}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                        {imovel.leads} leads
                                    </span>
                                    <span className="text-[11px] font-bold tabular-nums"
                                        style={{ color: barColors[i] }}>
                                        {imovel.engajamento}%
                                    </span>
                                </div>
                            </div>
                            <div className="h-[4px] rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${imovel.engajamento}%` }}
                                    transition={{ delay: 0.65 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                                    className="h-full rounded-full"
                                    style={{ background: barColors[i] }}
                                />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </motion.div>
    )
}

// ── Widget 4: Velocidade de Resposta ─────────────────────────
function VelocidadeRespostaWidget() {
    const [avgHours, setAvgHours] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const TARGET_HOURS = 2

    useEffect(() => {
        fetch('/api/leads/response-time')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.avg_hours != null) setAvgHours(data.avg_hours)
                else setAvgHours(1.4) // Fallback demo value
            })
            .catch(() => setAvgHours(1.4))
            .finally(() => setLoading(false))
    }, [])

    const getStatus = (h: number) => {
        if (h < TARGET_HOURS) return { color: 'var(--success)', bg: 'rgba(52,211,153,0.10)', label: 'Excelente', border: 'rgba(52,211,153,0.25)' }
        if (h <= 4)           return { color: 'var(--warning)', bg: 'rgba(245,158,11,0.08)', label: 'Atenção', border: 'rgba(245,158,11,0.25)' }
        return                       { color: 'var(--error)', bg: 'rgba(239,68,68,0.08)', label: 'Crítico', border: 'rgba(239,68,68,0.25)' }
    }

    const status = avgHours != null ? getStatus(avgHours) : null
    const progressPct = avgHours != null ? Math.min(100, (avgHours / 8) * 100) : 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.64, duration: 0.35 }}
            className="rounded-[10px] overflow-hidden"
            style={{
                background: status ? status.bg : 'rgba(14,28,48,.52)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${status ? status.border : 'rgba(200,164,74,.12)'}`,
                borderRadius: '10px',
                boxShadow: '0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.04)',
                padding: '20px',
            }}
        >
            <div className="flex items-center gap-2 mb-4">
                <Clock size={13} style={{ color: status?.color ?? 'var(--text-muted)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Velocidade de Resposta
                </span>
                {status && (
                    <span className="ml-auto text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[6px]"
                        style={{ color: status.color, background: `${status.color}18` }}>
                        {status.label}
                    </span>
                )}
            </div>

            {loading ? (
                <div className="h-16 rounded-lg animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
            ) : (
                <>
                    <div className="flex items-end gap-2 mb-3">
                        <span style={{
                            fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em',
                            lineHeight: 1, color: status?.color ?? 'var(--text-primary)',
                            fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
                        }}>
                            {avgHours?.toFixed(1)}h
                        </span>
                        <div className="mb-1.5">
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                média de resposta
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Target size={9} style={{ color: 'var(--text-muted)' }} />
                                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                    meta: &lt; {TARGET_HOURS}h
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Progress bar — fills toward the 8h danger zone */}
                    <div className="h-[4px] rounded-full overflow-hidden mb-2" style={{ background: 'var(--bg-elevated)' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ delay: 0.7, duration: 0.7, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: status?.color ?? 'var(--success)' }}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>0h</span>
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Meta 2h</span>
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>8h+</span>
                    </div>
                </>
            )}
        </motion.div>
    )
}

// ── AI Daily Summary Card ────────────────────────────────────
function AIDailySummary() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [summary, setSummary] = useState<any | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // Check cache
        if (typeof window === 'undefined') return
        const cached = localStorage.getItem('imi_daily_summary')
        if (cached) {
            try {
                const { data, ts } = JSON.parse(cached)
                if (Date.now() - ts < 8 * 60 * 60 * 1000) { setSummary(data); return }
            } catch { /* ignore */ }
        }

        // Auto-fetch on first load
        setLoading(true)
        fetch('/api/ai/daily-summary')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.summary) {
                    setSummary(data.summary)
                    localStorage.setItem('imi_daily_summary', JSON.stringify({ data: data.summary, ts: Date.now() }))
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    if (!summary && !loading) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg p-5"
            style={{
                background: 'linear-gradient(135deg, var(--surface-raised, var(--bg-surface)) 0%, rgba(200,164,74,0.06) 100%)',
                border: '1px solid var(--surface-border-gold, rgba(200,164,74,0.30))',
                borderLeft: '3px solid var(--color-gold, var(--accent-400))',
                boxShadow: 'var(--shadow-gold-glow, 0 0 30px rgba(200,164,74,0.20))',
            }}
        >
            {loading ? (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full animate-pulse" style={{ background: T.accent }} />
                    <span className="text-xs" style={{ color: T.textMuted }}>Gerando resumo do dia com IA...</span>
                </div>
            ) : summary ? (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span style={{ color: 'var(--color-gold, var(--accent-400))', fontSize: '16px' }}>✦</span>
                        <span style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '18px',
                            fontStyle: 'italic',
                            fontWeight: 400,
                            color: 'var(--color-gold, var(--accent-400))',
                        }}>
                            Briefing IA
                        </span>
                    </div>
                    <p className="text-xs font-medium mb-2" style={{ color: T.text }}>{summary.greeting}</p>
                    <div className="space-y-1 mb-2">
                        {summary.highlights?.map((h: string, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className="text-[11px] mt-0.5" style={{ color: T.accent }}>▸</span>
                                <span className="text-xs" style={{ color: T.textMuted }}>{h}</span>
                            </div>
                        ))}
                    </div>
                    {summary.alert && (
                        <div className="flex items-start gap-2 px-2 py-1.5 rounded-lg mb-2"
                            style={{ background: 'rgba(245,158,11,0.08)' }}>
                            <AlertTriangle size={11} className="mt-0.5" style={{ color: 'var(--warning)' }} />
                            <span className="text-[11px]" style={{ color: 'var(--warning)' }}>{summary.alert}</span>
                        </div>
                    )}
                    {summary.suggestion && (
                        <p className="text-[11px]" style={{ color: T.accent }}>
                            💡 {summary.suggestion}
                        </p>
                    )}
                </div>
            ) : null}
        </motion.div>
    )
}

export default function DashboardClient({
    stats, avStats, recentLeads, recentAvaliacoes,
    imoveisCount, chartData, canalPerformance, alertas, brokers = [],
}: Props) {
    const router = useRouter()
    const now = new Date()
    const dayNames   = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado']
    const monthNames = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
    const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} de ${monthNames[now.getMonth()]}`

    const ACTIONS = [
        { label: 'Nova Avaliação',  href: '/backoffice/avaliacoes/nova', icon: Scale,    color: 'rgba(96,165,250,0.12)',  fg: 'var(--accent-400)', raw: '96,165,250' },
        { label: 'Novo Lead',       href: '/backoffice/leads/novo',      icon: Users,    color: 'rgba(74,222,128,0.10)',  fg: 'var(--success)',          raw: '74,222,128' },
        { label: 'Novo Imóvel',     href: '/backoffice/imoveis/novo',    icon: Building2,color: 'rgba(34,211,238,0.10)',  fg: 'var(--info)',          raw: '34,211,238' },
        { label: 'Ver Relatórios',  href: '/backoffice/relatorios',      icon: BarChart2,color: 'rgba(251,191,36,0.10)',  fg: 'var(--warning)',          raw: '251,191,36' },
    ]

    const alertaIcon: Record<string, any> = {
        warning: AlertTriangle,
        danger:  AlertTriangle,
        info:    Info,
    }
    const alertaColor: Record<string, { border: string; bg: string; text: string; btn: string }> = {
        warning: { border: 'rgba(245,158,11,0.3)',  bg: 'rgba(245,158,11,0.06)',  text: 'var(--warning)', btn: 'rgba(245,158,11,0.15)' },
        danger:  { border: 'rgba(239,68,68,0.3)',   bg: 'rgba(239,68,68,0.06)',   text: 'var(--error)', btn: 'rgba(239,68,68,0.15)' },
        info:    { border: 'rgba(96,165,250,0.3)',  bg: 'rgba(96,165,250,0.06)',  text: 'var(--info)', btn: 'rgba(96,165,250,0.15)' },
    }

    const completionRate = avStats.total > 0
        ? Math.round((avStats.concluidas / avStats.total) * 100)
        : 0

    const uniqueLeads = recentLeads ? recentLeads.filter((l: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === l.id) === i) : []
    const uniqueAvaliacoes = recentAvaliacoes ? recentAvaliacoes.filter((a: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === a.id) === i) : []

    const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
    useEffect(() => {
        const supabase = createClient()
        const channel = supabase.channel('dashboard-presence')
        channel.subscribe((status) => {
            setIsRealtimeConnected(status === 'SUBSCRIBED')
        })
        return () => { supabase.removeChannel(channel) }
    }, [])

    return (
        <div className="space-y-4 max-w-7xl mx-auto">

            {/* ── Page Header ─────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.30 }}
            >
                {/* Eyebrow row */}
                <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                        <span style={{
                            width: 4, height: 4, borderRadius: '50%',
                            background: 'var(--accent-400)',
                            boxShadow: '0 0 8px var(--accent-400)',
                            display: 'inline-block', flexShrink: 0,
                        }} />
                        <span style={{
                            fontSize: '11px', fontWeight: 700,
                            color: 'var(--accent-400)',
                            textTransform: 'uppercase', letterSpacing: '0.14em',
                        }}>
                            INTELLIGENCE OS
                        </span>
                        {isRealtimeConnected && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-[6px]" style={{
                                background: 'rgba(74,222,128,0.10)',
                                border: '1px solid rgba(74,222,128,0.22)',
                            }}>
                                <span className="live-dot" />
                                <span style={{
                                    fontSize: '11px', fontWeight: 700,
                                    color: 'var(--imi-ai-green)',
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                }}>LIVE</span>
                            </span>
                        )}
                    </div>
                    {/* Avatars — only on sm+ */}
                    {brokers.length > 0 && (
                        <Link href="/backoffice/settings/corretores"
                            className="hidden sm:flex items-center gap-2 group">
                            <AvatarGroup translate="-8px" invertOverlap={false}>
                                {brokers.slice(0, 5).map(b => {
                                    const [fg, bg] = getPalette(b.name)
                                    return (
                                        <Avatar key={b.id} size={26} style={{ border: '2px solid var(--bg-base)', flexShrink: 0 }}>
                                            <AvatarImage src={b.avatar_url ?? undefined} />
                                            <AvatarFallback style={{ background: bg, color: fg, fontSize: 11, fontWeight: 700 }}>
                                                {getInitials(b.name)}
                                            </AvatarFallback>
                                            <AvatarGroupTooltip>{b.name.split(' ').slice(0, 2).join(' ')}</AvatarGroupTooltip>
                                        </Avatar>
                                    )
                                })}
                            </AvatarGroup>
                            <span className="text-[11px] font-medium opacity-50 group-hover:opacity-80 transition-opacity"
                                style={{ color: 'var(--text-muted)' }}>
                                {brokers.length}
                            </span>
                        </Link>
                    )}
                </div>

                {/* Title + CTA row */}
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <h1 className="gradient-text" style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: 32, fontWeight: 400,
                            lineHeight: 1.20, letterSpacing: '-0.01em', margin: 0,
                        }}>
                            Painel Executivo
                        </h1>
                        <p className="capitalize mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                            {dateStr}
                        </p>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => router.push('/backoffice/avaliacoes/nova')}
                        className="flex items-center gap-2 h-9 px-4 rounded-[6px] text-[13px] font-semibold text-white flex-shrink-0"
                        style={{
                            background: T.accent,
                            boxShadow: 'var(--shadow-md)',
                        }}
                    >
                        <Plus size={14} />
                        <span className="hidden sm:inline">Nova Avaliação</span>
                        <span className="sm:hidden">Nova</span>
                    </motion.button>
                </div>
            </motion.div>

            {/* ── Alertas Críticos ─────────────────────────────── */}
            {alertas.length > 0 && (
                <motion.div
                    data-tour="alerts"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.30 }}
                    className="flex gap-2.5 overflow-x-auto pb-1"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {alertas.map((alerta, i) => {
                        const IconComp = alertaIcon[alerta.cor] || Info
                        const c = alertaColor[alerta.cor] || alertaColor.info
                        return (
                            <motion.div
                                key={alerta.tipo}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.08 + i * 0.05 }}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg flex-shrink-0"
                                style={{ background: c.bg, border: `1px solid ${c.border}`, minWidth: 230 }}
                            >
                                <IconComp size={14} style={{ color: c.text, flexShrink: 0 }} />
                                <p className="text-[11px] font-medium flex-1" style={{ color: 'var(--text-primary)' }}>
                                    {alerta.mensagem}
                                </p>
                                <Link href={alerta.href}>
                                    <span className="text-[11px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap"
                                        style={{ color: c.text, background: c.btn }}>
                                        {alerta.acao}
                                    </span>
                                </Link>
                            </motion.div>
                        )
                    })}
                </motion.div>
            )}

            {/* ── Hero Revenue Strip ───────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.35 }}
                className="relative overflow-hidden rounded-[10px]"
                style={{
                    background: 'rgba(14,28,48,.52)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--info-border, rgba(96,165,250,0.28))',
                    borderRadius: '10px',
                    boxShadow: '0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.04)',
                    padding: '20px',
                }}
            >
                {/* Blue accent overlay — top-left radial glow, fully decorative */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'radial-gradient(ellipse 60% 80% at 0% 0%, rgba(37,99,235,0.22) 0%, transparent 70%)',
                }} />
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px]"
                    style={{ background: 'linear-gradient(90deg, rgba(96,165,250,0.80) 0%, rgba(96,165,250,0.30) 60%, transparent 100%)' }} />

                <div className="relative flex items-center justify-between gap-4 flex-wrap">
                    {/* Primary metric */}
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--info)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                            Honorários Totais Recebidos
                        </p>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                            {fmtCompact(avStats.honorarios_recebidos)}
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                            {avStats.concluidas} avaliação{avStats.concluidas !== 1 ? 'ões' : ''} concluída{avStats.concluidas !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Secondary stats */}
                    <div className="flex items-center gap-5 flex-wrap">
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                                A Receber
                            </p>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 400, color: 'var(--warning)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                                {fmtCompact(avStats.honorarios_pendentes)}
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{avStats.em_andamento} em andamento</p>
                        </div>
                        <div className="w-px h-10" style={{ background: 'var(--border-subtle)' }} />
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                                Conclusão
                            </p>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 400, color: 'var(--success)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                                {completionRate}%
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{avStats.total} total</p>
                        </div>
                        <div className="w-px h-10 hidden sm:block" style={{ background: 'var(--border-subtle)' }} />
                        <div className="hidden sm:block">
                            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                                Leads
                            </p>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 400, color: 'var(--info)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                                {stats.total_leads}
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                                {stats.leads_today > 0 ? `+${stats.leads_today} hoje` : 'pipeline'}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── AI Daily Summary ────────────────────────────── */}
            <AIDailySummary />

            {/* ── Market Ticker ────────────────────────────────── */}
            <div className="mb-4">
                <MarketTicker
                    paused
                    items={[
                        // Brasil — Mercado Imobiliário
                        { label: '🇧🇷 Ipanema • RJ', value: 'R$ 24.800/m²', change: 2.3, type: 'price' },
                        { label: '🇧🇷 Leblon • RJ', value: 'R$ 28.400/m²', change: -0.8, type: 'price' },
                        { label: '🇧🇷 Jardins • SP', value: 'R$ 22.100/m²', change: 1.4, type: 'price' },
                        { label: '🇧🇷 Itaim Bibi • SP', value: 'R$ 19.600/m²', change: 0.9, type: 'price' },
                        { label: '🇧🇷 Boa Viagem • PE', value: 'R$ 11.200/m²', change: 3.2, type: 'price' },
                        { label: '🇧🇷 Barra da Tijuca • RJ', value: 'R$ 12.600/m²', change: 1.5, type: 'price' },
                        { label: '🇧🇷 Yield Médio BR', value: '5.8% a.a.', change: 0.2, type: 'yield' },
                        { label: '🇧🇷 CDI', value: '10.5% a.a.', change: 0.0, type: 'index' },
                        { label: '🇧🇷 IGPM 12m', value: '4.83%', change: 0.3, type: 'index' },
                        { label: '🇧🇷 FII HGLG11', value: 'R$ 156,20', change: -1.2, type: 'index' },
                        // EUA — Real Estate
                        { label: '🇺🇸 Miami Beach', value: '$ 1.850/sqft', change: 3.8, type: 'price' },
                        { label: '🇺🇸 Manhattan • NY', value: '$ 2.450/sqft', change: -0.5, type: 'price' },
                        { label: '🇺🇸 Beverly Hills • LA', value: '$ 2.100/sqft', change: 1.2, type: 'price' },
                        { label: '🇺🇸 Brickell • Miami', value: '$ 980/sqft', change: 4.6, type: 'price' },
                        { label: '🇺🇸 US Prime Rate', value: '5.50% a.a.', change: 0.0, type: 'index' },
                        { label: '🇺🇸 DJIA', value: '39.142', change: 0.4, type: 'index' },
                        // Emirados Árabes
                        { label: '🇦🇪 Dubai Marina', value: 'AED 3.200/sqft', change: 8.4, type: 'price' },
                        { label: '🇦🇪 Palm Jumeirah', value: 'AED 5.800/sqft', change: 12.1, type: 'price' },
                        { label: '🇦🇪 Downtown Dubai', value: 'AED 4.100/sqft', change: 6.7, type: 'price' },
                        { label: '🇦🇪 Abu Dhabi • Al Reem', value: 'AED 1.850/sqft', change: 5.3, type: 'price' },
                        { label: '🇦🇪 Yield Dubai', value: '6.8% a.a.', change: 0.4, type: 'yield' },
                        { label: '🇦🇪 DFM Index', value: '4.238', change: 1.1, type: 'index' },
                    ]}
                />
            </div>

            {/* ── KPI Row ──────────────────────────────────────── */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                data-tour="kpis"
            >
                <motion.div variants={cardVariants}>
                    <Link href="/backoffice/financeiro">
                        <KPICard
                            label="Honorários Recebidos"
                            value={fmtCompact(avStats.honorarios_recebidos)}
                            sublabel={`${avStats.concluidas} concluídas`}
                            icon={<Banknote size={14} />}
                            accent="green"
                            size="md"
                        />
                    </Link>
                </motion.div>
                <motion.div variants={cardVariants}>
                    <Link href="/backoffice/leads">
                        <KPICard
                            label="Leads Ativos"
                            value={String(stats.total_leads)}
                            sublabel={stats.leads_today > 0 ? `+${stats.leads_today} hoje` : 'pipeline'}
                            icon={<Users size={14} />}
                            accent="blue"
                            size="md"
                        />
                    </Link>
                </motion.div>
                <motion.div variants={cardVariants}>
                    <Link href="/backoffice/avaliacoes">
                        <KPICard
                            label="A Receber"
                            value={fmtCompact(avStats.honorarios_pendentes)}
                            sublabel={`${avStats.em_andamento} em andamento`}
                            icon={<Scale size={14} />}
                            accent="warm"
                            size="md"
                        />
                    </Link>
                </motion.div>
                <motion.div variants={cardVariants}>
                    <Link href="/backoffice/imoveis">
                        <KPICard
                            label="Portfólio"
                            value={String(imoveisCount)}
                            sublabel="imóveis cadastrados"
                            icon={<Building2 size={14} />}
                            accent="cold"
                            size="md"
                        />
                    </Link>
                </motion.div>
            </motion.div>

            {/* ── Gráfico + Ações Rápidas ─────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Gráfico de Performance */}
                <motion.div
                    data-tour="chart"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22, duration: 0.35 }}
                    className="md:col-span-2 lg:col-span-2 rounded-[10px] overflow-hidden"
                    style={{
                        background: 'rgba(14,28,48,.52)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(200,164,74,.12)',
                        borderRadius: '10px',
                        boxShadow: '0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.04)',
                        padding: '20px',
                    }}
                >
                    <PerformanceChart chartData={chartData} />
                </motion.div>

                {/* Ações Rápidas */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28, duration: 0.35 }}
                    className="rounded-[10px] overflow-hidden"
                    style={{
                        background: 'rgba(14,28,48,.52)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(200,164,74,.12)',
                        borderRadius: '10px',
                        boxShadow: '0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.04)',
                        padding: '20px',
                    }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Zap size={13} style={{ color: 'var(--warning)' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Ações Rápidas
                        </span>
                    </div>
                    <div className="space-y-1">
                        {ACTIONS.map((a, i) => (
                            <Link key={a.href} href={a.href}>
                                <motion.div
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.30 + i * 0.05 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all group"
                                    style={{ background: 'transparent' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{
                                            background: a.color,
                                            border: `1px solid rgba(${a.raw},0.20)`,
                                        }}>
                                        <a.icon size={14} style={{ color: a.fg }} />
                                    </div>
                                    <span className="text-[13px] font-medium flex-1" style={{ color: 'var(--text-primary)' }}>
                                        {a.label}
                                    </span>
                                    <ChevronRight size={13} style={{ color: 'var(--text-muted)', opacity: 0.4 }}
                                        className="group-hover:translate-x-0.5 transition-transform" />
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ── Performance por Canal + Atividade Recente ──── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Performance por Canal */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.35 }}
                    className="rounded-[10px] overflow-hidden"
                    style={{
                        background: 'rgba(14,28,48,.52)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(200,164,74,.12)',
                        borderRadius: '10px',
                        boxShadow: '0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.04)',
                        padding: '20px',
                    }}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <BarChart2 size={13} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Canais de Captação
                        </span>
                    </div>
                    <p className="text-[11px] mb-4" style={{ color: 'var(--text-muted)' }}>últimos 6 meses</p>
                    {canalPerformance.length > 0 ? (
                        <div className="space-y-3">
                            {canalPerformance.map((item, i) => (
                                <MetricBar
                                    key={item.canal}
                                    label={`#${i + 1} ${item.canal}`}
                                    value={item.pct}
                                    valueLabel={`${item.leads} leads · ${item.pct}%`}
                                    color="var(--accent-400)"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                Sem dados de canal ainda
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* Leads Recentes */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.40, duration: 0.35 }}
                    className="rounded-[10px] overflow-hidden"
                    style={{
                        background: 'rgba(14,28,48,.52)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(200,164,74,.12)',
                        borderRadius: '10px',
                        boxShadow: '0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.04)',
                    }}
                >
                    <div className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: '1px solid var(--border-default)' }}>
                        <div className="flex items-center gap-2">
                            <Users size={13} style={{ color: 'var(--accent-400)' }} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Leads Recentes
                            </span>
                        </div>
                        <Link href="/backoffice/leads">
                            <span className="text-[11px] font-semibold flex items-center gap-1"
                                style={{ color: 'var(--accent-400)' }}>
                                Ver todos <ArrowUpRight size={10} />
                            </span>
                        </Link>
                    </div>
                    <div>
                        {uniqueLeads.length > 0 ? uniqueLeads.slice(0, 4).map((lead: any) => {
                            const s = LEAD_STATUS_MAP[lead.status] ?? { statusKey: 'cold', label: lead.status }
                            return (
                                <Link key={lead.id} href={`/backoffice/leads/${lead.id}`}>
                                    <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all"
                                        style={{ borderBottom: `1px solid ${T.border}` }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                                            style={{ background: 'var(--info-bg, rgba(96,165,250,0.14))', color: 'var(--accent-400)' }}>
                                            {lead.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                                {lead.name}
                                            </p>
                                            <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                                                {lead.source}{lead.interest ? ` · ${lead.interest}` : ''}
                                            </p>
                                        </div>
                                        <StatusBadge status={s.statusKey} label={s.label} size="xs" glow />
                                    </div>
                                </Link>
                            )
                        }) : (
                            <div className="px-4 py-8 text-center">
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Nenhum lead cadastrado
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Avaliações Recentes */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.35 }}
                    className="rounded-[10px] overflow-hidden"
                    style={{
                        background: 'rgba(14,28,48,.52)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(200,164,74,.12)',
                        borderRadius: '10px',
                        boxShadow: '0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.04)',
                    }}
                >
                    <div className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: '1px solid var(--border-default)' }}>
                        <div className="flex items-center gap-2">
                            <Scale size={13} style={{ color: 'var(--warning)' }} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Avaliações Recentes
                            </span>
                        </div>
                        <Link href="/backoffice/avaliacoes">
                            <span className="text-[11px] font-semibold flex items-center gap-1"
                                style={{ color: 'var(--accent-400)' }}>
                                Ver todas <ArrowUpRight size={10} />
                            </span>
                        </Link>
                    </div>
                    <div>
                        {uniqueAvaliacoes.length > 0 ? uniqueAvaliacoes.slice(0, 4).map((av: any) => {
                            const s = AV_STATUS_MAP[av.status] ?? { statusKey: 'pend', label: av.status }
                            return (
                                <div key={av.id}
                                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all"
                                    style={{ borderBottom: `1px solid ${T.border}` }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'rgba(251,191,36,0.12)' }}>
                                        <Scale size={13} style={{ color: 'var(--warning)' }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                            {av.protocolo}
                                        </p>
                                        <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                                            {av.tipo_imovel} · {av.bairro}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-[11px] font-bold mb-1" style={{ color: 'var(--warning)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                                            {fmt(av.honorarios || 0)}
                                        </p>
                                        <StatusBadge status={s.statusKey} label={s.label} size="xs" />
                                    </div>
                                </div>
                            )
                        }) : (
                            <div className="px-4 py-8 text-center">
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Nenhuma avaliação cadastrada
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* ── Inteligência de Negócio ──────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.50, duration: 0.30 }}
            >
                {/* Section header */}
                <div className="flex items-center gap-3 mb-3">
                    <div style={{ width: 4, height: 14, borderRadius: 6, background: 'var(--accent-400)', flexShrink: 0 }} />
                    <span style={{
                        fontSize: '11px', fontWeight: 700,
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase', letterSpacing: '0.14em',
                        fontFamily: 'var(--font-mono)',
                    }}>
                        Inteligência de Negócio
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                </div>

                {/* 2×2 grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ConversaoFonteWidget />
                    <ProximosCompromissosWidget />
                    <TopImoveisWidget />
                    <VelocidadeRespostaWidget />
                </div>
            </motion.div>

        </div>
    )
}
