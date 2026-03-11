'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'
import {
    TrendingUp, Users, Building2, Scale, Plus,
    ChevronRight, Banknote, BarChart2, AlertTriangle,
    Info, ArrowUpRight, Zap, Activity,
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Link from 'next/link'
import { KPICard, MetricBar, StatusBadge, SectionHeader } from '../../components/ui'
import { AvatarGroup as OldAvatarGroup, type BrokerAvatar } from '@/components/ui/AvatarGroup'
import { AvatarGroup, AvatarGroupTooltip } from '@/components/animate-ui/components/animate/avatar-group'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { T } from '@/app/(backoffice)/lib/theme'

// ── Avatar helpers ─────────────────────────────────────────────
function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}
const PALETTES = [
    ['#60A5FA','rgba(96,165,250,0.20)'],['#4ADE80','rgba(74,222,128,0.18)'],
    ['#F472B6','rgba(244,114,182,0.18)'],['#A78BFA','rgba(167,139,250,0.18)'],
    ['#34D399','rgba(52,211,153,0.18)'],['#FBBF24','rgba(251,191,36,0.16)'],
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
    recentLeads: any[]
    recentAvaliacoes: any[]
    imoveisCount: number
    chartData: ChartPoint[]
    canalPerformance: CanalItem[]
    alertas: Alerta[]
    brokers?: BrokerAvatar[]
}

type Period = '1M' | '3M' | '6M' | '1A'

const PERIOD_OPTS: { label: string; value: Period; months: number }[] = [
    { label: '1M', value: '1M', months: 1 },
    { label: '3M', value: '3M', months: 3 },
    { label: '6M', value: '6M', months: 6 },
    { label: '1A', value: '1A', months: 12 },
]

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const fmtCompact = (v: number) => {
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
    if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}k`
    return fmt(v)
}

export default function DashboardClient({
    stats, avStats, recentLeads, recentAvaliacoes,
    imoveisCount, chartData, canalPerformance, alertas, brokers = [],
}: Props) {
    const router = useRouter()
    const [period, setPeriod] = useState<Period>('6M')

    const periodMonths = PERIOD_OPTS.find(p => p.value === period)?.months ?? 6
    const filteredChartData = chartData.slice(-periodMonths)

    const now = new Date()
    const dayNames   = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado']
    const monthNames = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
    const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} de ${monthNames[now.getMonth()]}`

    const ACTIONS = [
        { label: 'Nova Avaliação',  href: '/backoffice/avaliacoes/nova', icon: Scale,    color: 'rgba(59,130,246,0.12)',  fg: 'var(--imi-blue-bright)', raw: '59,130,246' },
        { label: 'Novo Lead',       href: '/backoffice/leads/novo',      icon: Users,    color: 'rgba(74,222,128,0.10)',  fg: 'var(--s-done)',          raw: '74,222,128' },
        { label: 'Novo Imóvel',     href: '/backoffice/imoveis/novo',    icon: Building2,color: 'rgba(34,211,238,0.10)',  fg: 'var(--s-cold)',          raw: '34,211,238' },
        { label: 'Ver Relatórios',  href: '/backoffice/relatorios',      icon: BarChart2,color: 'rgba(251,191,36,0.10)',  fg: 'var(--s-warm)',          raw: '251,191,36' },
    ]

    const alertaIcon: Record<string, any> = {
        warning: AlertTriangle,
        danger:  AlertTriangle,
        info:    Info,
    }
    const alertaColor: Record<string, { border: string; bg: string; text: string; btn: string }> = {
        warning: { border: 'rgba(245,158,11,0.3)',  bg: 'rgba(245,158,11,0.06)',  text: '#F59E0B', btn: 'rgba(245,158,11,0.15)' },
        danger:  { border: 'rgba(239,68,68,0.3)',   bg: 'rgba(239,68,68,0.06)',   text: '#EF4444', btn: 'rgba(239,68,68,0.15)' },
        info:    { border: 'rgba(59,130,246,0.3)',  bg: 'rgba(59,130,246,0.06)',  text: '#3B82F6', btn: 'rgba(59,130,246,0.15)' },
    }

    const completionRate = avStats.total > 0
        ? Math.round((avStats.concluidas / avStats.total) * 100)
        : 0

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
                            background: 'var(--imi-blue-bright)',
                            boxShadow: '0 0 8px var(--imi-blue-bright)',
                            display: 'inline-block', flexShrink: 0,
                        }} />
                        <span style={{
                            fontSize: '9px', fontWeight: 700,
                            color: 'var(--imi-blue-bright)',
                            textTransform: 'uppercase', letterSpacing: '0.14em',
                        }}>
                            INTELLIGENCE OS
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{
                            background: 'rgba(74,222,128,0.10)',
                            border: '1px solid rgba(74,222,128,0.22)',
                        }}>
                            <span className="live-dot" />
                            <span style={{
                                fontSize: '8px', fontWeight: 700,
                                color: 'var(--imi-ai-green)',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>LIVE</span>
                        </span>
                    </div>
                    {/* Avatars — only on sm+ */}
                    {brokers.length > 0 && (
                        <Link href="/backoffice/settings/corretores"
                            className="hidden sm:flex items-center gap-2 group">
                            <AvatarGroup translate="-8px" invertOverlap={false}>
                                {brokers.slice(0, 5).map(b => {
                                    const [fg, bg] = getPalette(b.name)
                                    return (
                                        <Avatar key={b.id} size={26} style={{ border: '2px solid var(--bo-bg)', flexShrink: 0 }}>
                                            <AvatarImage src={b.avatar_url ?? undefined} />
                                            <AvatarFallback style={{ background: bg, color: fg, fontSize: 9, fontWeight: 700 }}>
                                                {getInitials(b.name)}
                                            </AvatarFallback>
                                            <AvatarGroupTooltip>{b.name.split(' ').slice(0, 2).join(' ')}</AvatarGroupTooltip>
                                        </Avatar>
                                    )
                                })}
                            </AvatarGroup>
                            <span className="text-[10px] font-medium opacity-50 group-hover:opacity-80 transition-opacity"
                                style={{ color: 'var(--bo-text-muted)' }}>
                                {brokers.length}
                            </span>
                        </Link>
                    )}
                </div>

                {/* Title + CTA row */}
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <h1 className="gradient-text" style={{
                            fontSize: '26px', fontWeight: 800,
                            lineHeight: 1.15, letterSpacing: '-0.03em', margin: 0,
                        }}>
                            Painel Executivo
                        </h1>
                        <p className="capitalize mt-0.5" style={{ color: 'var(--bo-text-muted)', fontSize: '11px' }}>
                            {dateStr}
                        </p>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => router.push('/backoffice/avaliacoes/nova')}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold text-white flex-shrink-0"
                        style={{
                            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                            boxShadow: '0 4px 20px rgba(37,99,235,0.40), 0 1px 0 rgba(255,255,255,0.10) inset',
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
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl flex-shrink-0"
                                style={{ background: c.bg, border: `1px solid ${c.border}`, minWidth: 230 }}
                            >
                                <IconComp size={14} style={{ color: c.text, flexShrink: 0 }} />
                                <p className="text-[11px] font-medium flex-1" style={{ color: 'var(--bo-text)' }}>
                                    {alerta.mensagem}
                                </p>
                                <Link href={alerta.href}>
                                    <span className="text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap"
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
                className="relative overflow-hidden rounded-2xl"
                style={{
                    background: '#07101E',
                    border: '1px solid rgba(59,130,246,0.28)',
                    boxShadow: '0 0 0 1px rgba(59,130,246,0.06) inset, 0 8px 40px rgba(0,0,0,0.50)',
                    padding: '18px 20px',
                }}
            >
                {/* Blue accent overlay — top-left radial glow, fully decorative */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'radial-gradient(ellipse 60% 80% at 0% 0%, rgba(37,99,235,0.22) 0%, transparent 70%)',
                }} />
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px]"
                    style={{ background: 'linear-gradient(90deg, rgba(59,130,246,0.80) 0%, rgba(59,130,246,0.30) 60%, transparent 100%)' }} />

                <div className="relative flex items-center justify-between gap-4 flex-wrap">
                    {/* Primary metric */}
                    <div>
                        <p style={{ fontSize: '9px', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>
                            Honorários Totais Recebidos
                        </p>
                        <div style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: '#FFFFFF' }}>
                            {fmtCompact(avStats.honorarios_recebidos)}
                        </div>
                        <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.8)', marginTop: 5 }}>
                            {avStats.concluidas} avaliação{avStats.concluidas !== 1 ? 'ões' : ''} concluída{avStats.concluidas !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Secondary stats */}
                    <div className="flex items-center gap-5 flex-wrap">
                        <div>
                            <p style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 3 }}>
                                A Receber
                            </p>
                            <p style={{ fontSize: '22px', fontWeight: 800, color: '#FBBF24', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                                {fmtCompact(avStats.honorarios_pendentes)}
                            </p>
                            <p style={{ fontSize: '10px', color: 'rgba(148,163,184,0.6)', marginTop: 2 }}>{avStats.em_andamento} em andamento</p>
                        </div>
                        <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.08)' }} />
                        <div>
                            <p style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 3 }}>
                                Conclusão
                            </p>
                            <p style={{ fontSize: '22px', fontWeight: 800, color: '#4ADE80', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                                {completionRate}%
                            </p>
                            <p style={{ fontSize: '10px', color: 'rgba(148,163,184,0.6)', marginTop: 2 }}>{avStats.total} total</p>
                        </div>
                        <div className="w-px h-10 hidden sm:block" style={{ background: 'rgba(255,255,255,0.08)' }} />
                        <div className="hidden sm:block">
                            <p style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 3 }}>
                                Leads
                            </p>
                            <p style={{ fontSize: '22px', fontWeight: 800, color: '#60A5FA', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                                {stats.total_leads}
                            </p>
                            <p style={{ fontSize: '10px', color: 'rgba(148,163,184,0.6)', marginTop: 2 }}>
                                {stats.leads_today > 0 ? `+${stats.leads_today} hoje` : 'pipeline'}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── KPI Row ──────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.35 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            >
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

            {/* ── Gráfico + Ações Rápidas ─────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Gráfico de Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22, duration: 0.35 }}
                    className="md:col-span-2 lg:col-span-2 rounded-2xl overflow-hidden"
                    style={{
                        background: 'rgba(13,20,36,0.92)',
                        border: '1px solid rgba(59,130,246,0.20)',
                        boxShadow: '0 0 24px rgba(59,130,246,0.08), 0 4px 24px rgba(0,0,0,0.28)',
                        padding: '18px',
                    }}
                >
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <Activity size={13} style={{ color: 'var(--imi-blue-bright)' }} />
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bo-text)', letterSpacing: '-0.01em' }}>
                                    Performance
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] mt-1.5">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#3B82F6' }} />
                                    <span style={{ color: 'var(--bo-text-muted)' }}>Leads</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#22C55E' }} />
                                    <span style={{ color: 'var(--bo-text-muted)' }}>Receita</span>
                                </span>
                            </div>
                        </div>
                        {/* Period tabs */}
                        <div className="flex items-center gap-0.5 flex-shrink-0 p-0.5 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--bo-border)' }}>
                            {PERIOD_OPTS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPeriod(opt.value)}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                                    style={{
                                        background: period === opt.value ? 'rgba(59,130,246,0.18)' : 'transparent',
                                        color: period === opt.value ? 'var(--imi-blue-bright)' : 'var(--bo-text-muted)',
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: 170 }}>
                        {filteredChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={filteredChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                                    <defs>
                                        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.28} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01} />
                                        </linearGradient>
                                        <linearGradient id="greenGrad2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.24} />
                                            <stop offset="95%" stopColor="#22C55E" stopOpacity={0.01} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="mes" axisLine={false} tickLine={false}
                                        tick={{ fill: 'var(--bo-text-muted)', fontSize: 10, fontWeight: 500 }} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#0D1424',
                                            border: '1px solid rgba(59,130,246,0.25)',
                                            borderRadius: 10,
                                            color: 'var(--bo-text)',
                                            fontSize: 11,
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.40)',
                                        }}
                                        formatter={(v: any, name?: string) => [
                                            name === 'leads' ? `${v} leads` : `R$ ${v}k`,
                                            name === 'leads' ? 'Leads' : 'Receita',
                                        ] as [string, string]}
                                    />
                                    <Area type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={2}
                                        fill="url(#blueGrad)" dot={false}
                                        activeDot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }} />
                                    <Area type="monotone" dataKey="receita" stroke="#22C55E" strokeWidth={2}
                                        fill="url(#greenGrad2)" dot={false}
                                        activeDot={{ r: 4, fill: '#22C55E', strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>
                                    Sem dados para o período
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Ações Rápidas */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28, duration: 0.35 }}
                    className="rounded-2xl overflow-hidden"
                    style={{
                        background: 'rgba(13,20,36,0.92)',
                        border: '1px solid var(--bo-border)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.28)',
                        padding: '18px',
                    }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Zap size={13} style={{ color: 'var(--s-warm)' }} />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bo-text)', letterSpacing: '-0.01em' }}>
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
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group"
                                    style={{ background: 'transparent' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bo-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{
                                            background: a.color,
                                            border: `1px solid rgba(${a.raw},0.20)`,
                                        }}>
                                        <a.icon size={14} style={{ color: a.fg }} />
                                    </div>
                                    <span className="text-[13px] font-medium flex-1" style={{ color: 'var(--bo-text)' }}>
                                        {a.label}
                                    </span>
                                    <ChevronRight size={13} style={{ color: 'var(--bo-text-muted)', opacity: 0.4 }}
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
                    className="rounded-2xl overflow-hidden"
                    style={{
                        background: 'rgba(13,20,36,0.92)',
                        border: '1px solid var(--bo-border)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.28)',
                        padding: '18px',
                    }}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <BarChart2 size={13} style={{ color: 'var(--bo-text-muted)' }} />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bo-text)', letterSpacing: '-0.01em' }}>
                            Canais de Captação
                        </span>
                    </div>
                    <p className="text-[10px] mb-4" style={{ color: 'var(--bo-text-muted)' }}>últimos 6 meses</p>
                    {canalPerformance.length > 0 ? (
                        <div className="space-y-3">
                            {canalPerformance.map((item, i) => (
                                <MetricBar
                                    key={item.canal}
                                    label={`#${i + 1} ${item.canal}`}
                                    value={item.pct}
                                    valueLabel={`${item.leads} leads · ${item.pct}%`}
                                    color="var(--imi-blue-bright)"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <p className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>
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
                    className="rounded-2xl overflow-hidden"
                    style={{
                        background: 'rgba(13,20,36,0.92)',
                        border: '1px solid var(--bo-border)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.28)',
                    }}
                >
                    <div className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: '1px solid var(--bo-border)' }}>
                        <div className="flex items-center gap-2">
                            <Users size={13} style={{ color: 'var(--imi-blue-bright)' }} />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bo-text)', letterSpacing: '-0.01em' }}>
                                Leads Recentes
                            </span>
                        </div>
                        <Link href="/backoffice/leads">
                            <span className="text-[10px] font-semibold flex items-center gap-1"
                                style={{ color: 'var(--imi-blue-bright)' }}>
                                Ver todos <ArrowUpRight size={10} />
                            </span>
                        </Link>
                    </div>
                    <div>
                        {recentLeads.length > 0 ? recentLeads.slice(0, 4).map((lead: any) => {
                            const s = LEAD_STATUS_MAP[lead.status] ?? { statusKey: 'cold', label: lead.status }
                            return (
                                <Link key={lead.id} href={`/backoffice/leads/${lead.id}`}>
                                    <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all"
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bo-hover)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                                            style={{ background: 'rgba(59,130,246,0.14)', color: 'var(--imi-blue-bright)' }}>
                                            {lead.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--bo-text)' }}>
                                                {lead.name}
                                            </p>
                                            <p className="text-[10px] truncate" style={{ color: 'var(--bo-text-muted)' }}>
                                                {lead.source}{lead.interest ? ` · ${lead.interest}` : ''}
                                            </p>
                                        </div>
                                        <StatusBadge status={s.statusKey} label={s.label} size="xs" glow />
                                    </div>
                                </Link>
                            )
                        }) : (
                            <div className="px-4 py-8 text-center">
                                <p className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>
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
                    className="rounded-2xl overflow-hidden"
                    style={{
                        background: 'rgba(13,20,36,0.92)',
                        border: '1px solid var(--bo-border)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.28)',
                    }}
                >
                    <div className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: '1px solid var(--bo-border)' }}>
                        <div className="flex items-center gap-2">
                            <Scale size={13} style={{ color: 'var(--s-warm)' }} />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bo-text)', letterSpacing: '-0.01em' }}>
                                Avaliações Recentes
                            </span>
                        </div>
                        <Link href="/backoffice/avaliacoes">
                            <span className="text-[10px] font-semibold flex items-center gap-1"
                                style={{ color: 'var(--imi-blue-bright)' }}>
                                Ver todas <ArrowUpRight size={10} />
                            </span>
                        </Link>
                    </div>
                    <div>
                        {recentAvaliacoes.length > 0 ? recentAvaliacoes.slice(0, 4).map((av: any) => {
                            const s = AV_STATUS_MAP[av.status] ?? { statusKey: 'pend', label: av.status }
                            return (
                                <div key={av.id}
                                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all"
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bo-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'rgba(251,191,36,0.12)' }}>
                                        <Scale size={13} style={{ color: 'var(--s-warm)' }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--bo-text)' }}>
                                            {av.protocolo}
                                        </p>
                                        <p className="text-[10px] truncate" style={{ color: 'var(--bo-text-muted)' }}>
                                            {av.tipo_imovel} · {av.bairro}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-[11px] font-bold mb-1 tabular-nums" style={{ color: 'var(--s-warm)' }}>
                                            {fmt(av.honorarios || 0)}
                                        </p>
                                        <StatusBadge status={s.statusKey} label={s.label} size="xs" />
                                    </div>
                                </div>
                            )
                        }) : (
                            <div className="px-4 py-8 text-center">
                                <p className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>
                                    Nenhuma avaliação cadastrada
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

        </div>
    )
}
