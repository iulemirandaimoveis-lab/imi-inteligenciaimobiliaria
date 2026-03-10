'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'
import {
    TrendingUp, Users, Building2, Scale, Plus,
    ChevronRight, Banknote, BarChart2, AlertTriangle,
    Info, ArrowUpRight, Zap,
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Link from 'next/link'
import { KPICard, MetricBar, StatusBadge, SectionHeader } from '../../components/ui'
import { AvatarGroup, type BrokerAvatar } from '@/components/ui/AvatarGroup'
import { T } from '@/app/(backoffice)/lib/theme'

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

// ── Status maps for library StatusBadge ──────────────────────
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

export default function DashboardClient({
    stats, avStats, recentLeads, recentAvaliacoes,
    imoveisCount, chartData, canalPerformance, alertas, brokers = [],
}: Props) {
    const router = useRouter()
    const [period, setPeriod] = useState<Period>('6M')

    // Slice chart data based on selected period
    const periodMonths = PERIOD_OPTS.find(p => p.value === period)?.months ?? 6
    const filteredChartData = chartData.slice(-periodMonths)

    const now = new Date()
    const dayNames   = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado']
    const monthNames = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
    const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} de ${monthNames[now.getMonth()]}`

    const ACTIONS = [
        { label: 'Nova Avaliação',  href: '/backoffice/avaliacoes/nova', icon: Scale,    color: 'rgba(59,130,246,0.14)',  fg: 'var(--imi-blue-bright)' },
        { label: 'Novo Lead',       href: '/backoffice/leads/novo',      icon: Users,    color: 'rgba(74,222,128,0.12)',  fg: 'var(--s-done)' },
        { label: 'Novo Imóvel',     href: '/backoffice/imoveis/novo',    icon: Building2,color: 'rgba(34,211,238,0.12)',  fg: 'var(--s-cold)' },
        { label: 'Ver Relatórios',  href: '/backoffice/relatorios',      icon: BarChart2,color: 'rgba(251,191,36,0.12)',  fg: 'var(--s-warm)' },
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

    return (
        <div className="space-y-5 max-w-7xl mx-auto">

            {/* ── Page Header ─────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex items-start justify-between gap-4"
            >
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span style={{
                            width: 4, height: 4, borderRadius: '50%',
                            background: 'var(--imi-blue-bright)',
                            boxShadow: '0 0 6px var(--imi-blue-bright)',
                            display: 'inline-block', flexShrink: 0,
                        }} />
                        <span style={{
                            fontSize: '9px', fontWeight: 700,
                            color: 'var(--imi-blue-bright)',
                            textTransform: 'uppercase', letterSpacing: '0.12em',
                        }}>
                            INTELLIGENCE OS
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{
                            background: 'rgba(74,222,128,0.10)',
                            border: '1px solid rgba(74,222,128,0.20)',
                        }}>
                            <span className="live-dot" />
                            <span style={{
                                fontSize: '8px', fontWeight: 700,
                                color: 'var(--imi-ai-green)',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>LIVE</span>
                        </span>
                    </div>
                    <h1 className="gradient-text" style={{
                        fontSize: '22px', fontWeight: 800,
                        lineHeight: 1.2, letterSpacing: '-0.02em', margin: 0,
                    }}>
                        Painel Executivo
                    </h1>
                    <p className="text-sm mt-0.5 capitalize" style={{ color: 'var(--bo-text-muted)' }}>
                        {dateStr}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    {brokers.length > 0 && (
                        <AvatarGroup
                            brokers={brokers}
                            max={5}
                            size={30}
                            href="/backoffice/settings/corretores"
                            label="Equipe"
                        />
                    )}
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => router.push('/backoffice/avaliacoes/nova')}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                        style={{
                            background: 'linear-gradient(135deg, var(--bo-accent) 0%, #1D4ED8 100%)',
                            boxShadow: '0 4px 16px rgba(37,99,235,0.30)',
                        }}
                    >
                        <Plus size={14} />
                        <span className="hidden sm:inline">Nova Avaliação</span>
                        <span className="sm:hidden">+</span>
                    </motion.button>
                </div>
            </motion.div>

            {/* ── Alertas Críticos ─────────────────────────────── */}
            {alertas.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.35 }}
                    className="flex gap-3 overflow-x-auto pb-1"
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
                                className="flex items-center gap-3 px-4 py-3 rounded-xl flex-shrink-0"
                                style={{ background: c.bg, border: `1px solid ${c.border}`, minWidth: 240 }}
                            >
                                <IconComp size={15} style={{ color: c.text, flexShrink: 0 }} />
                                <p className="text-xs font-medium flex-1" style={{ color: 'var(--bo-text)' }}>
                                    {alerta.mensagem}
                                </p>
                                <Link href={alerta.href}>
                                    <span
                                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap"
                                        style={{ color: c.text, background: c.btn }}
                                    >
                                        {alerta.acao}
                                    </span>
                                </Link>
                            </motion.div>
                        )
                    })}
                </motion.div>
            )}

            {/* ── KPI Row ──────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            >
                <Link href="/backoffice/financeiro">
                    <KPICard
                        label="Honorários Recebidos"
                        value={fmt(avStats.honorarios_recebidos)}
                        sublabel={`${avStats.concluidas} avaliações concluídas`}
                        icon={<Banknote size={14} />}
                        accent="green"
                    />
                </Link>
                <Link href="/backoffice/leads">
                    <KPICard
                        label="Leads Ativos"
                        value={String(stats.total_leads)}
                        sublabel={stats.leads_today > 0 ? `+${stats.leads_today} hoje` : 'no pipeline'}
                        icon={<Users size={14} />}
                        accent="blue"
                    />
                </Link>
                <Link href="/backoffice/avaliacoes">
                    <KPICard
                        label="A Receber"
                        value={fmt(avStats.honorarios_pendentes)}
                        sublabel={`${avStats.em_andamento} laudos em andamento`}
                        icon={<Scale size={14} />}
                        accent="warm"
                    />
                </Link>
                <Link href="/backoffice/imoveis">
                    <KPICard
                        label="Imóveis Portfólio"
                        value={String(imoveisCount)}
                        sublabel="cadastrados"
                        icon={<Building2 size={14} />}
                        accent="cold"
                    />
                </Link>
            </motion.div>

            {/* ── Gráfico + Ações Rápidas ─────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Gráfico de Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22, duration: 0.4 }}
                    className="md:col-span-2 lg:col-span-2 intel-card card-accent-blue"
                    style={{ padding: '16px' }}
                >
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                            <SectionHeader title="Performance" />
                            <div className="flex items-center gap-3 text-[11px] mt-1">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full inline-block"
                                        style={{ background: '#3B82F6' }} />
                                    <span style={{ color: 'var(--bo-text-muted)' }}>Leads</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full inline-block"
                                        style={{ background: '#22C55E' }} />
                                    <span style={{ color: 'var(--bo-text-muted)' }}>Receita</span>
                                </span>
                            </div>
                        </div>
                        {/* Period tabs */}
                        <div className="flex items-center gap-0.5 flex-shrink-0 p-0.5 rounded-xl"
                            style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)' }}>
                            {PERIOD_OPTS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPeriod(opt.value)}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                                    style={{
                                        background: period === opt.value ? 'var(--bo-elevated)' : 'transparent',
                                        color: period === opt.value ? 'var(--bo-text)' : 'var(--bo-text-muted)',
                                        boxShadow: period === opt.value ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: 150 }}>
                        {filteredChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={filteredChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                                    <defs>
                                        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.22} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01} />
                                        </linearGradient>
                                        <linearGradient id="greenGrad2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#22C55E" stopOpacity={0.01} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="mes" axisLine={false} tickLine={false}
                                        tick={{ fill: 'var(--bo-text-muted)', fontSize: 10, fontWeight: 500 }} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--bo-elevated)',
                                            border: '1px solid var(--bo-border)',
                                            borderRadius: 10,
                                            color: 'var(--bo-text)',
                                            fontSize: 11,
                                            boxShadow: 'var(--bo-shadow-elevated)',
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
                    transition={{ delay: 0.28, duration: 0.4 }}
                    className="intel-card"
                    style={{ padding: '16px' }}
                >
                    <SectionHeader title="Ações Rápidas" className="mb-4" />
                    <div className="space-y-1.5">
                        {ACTIONS.map((a, i) => (
                            <Link key={a.href} href={a.href}>
                                <motion.div
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.05 }}
                                    whileTap={{ scale: 0.97 }}
                                    whileHover={{ x: 2 }}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group"
                                    style={{ background: 'transparent' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bo-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: a.color }}>
                                        <a.icon size={14} style={{ color: a.fg }} />
                                    </div>
                                    <span className="text-sm font-medium flex-1" style={{ color: 'var(--bo-text)' }}>
                                        {a.label}
                                    </span>
                                    <ChevronRight size={14} style={{ color: 'var(--bo-text-muted)', opacity: 0.5 }}
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
                    transition={{ delay: 0.35, duration: 0.4 }}
                    className="intel-card"
                    style={{ padding: '16px' }}
                >
                    <SectionHeader title="Performance por Canal" className="mb-1" />
                    <p className="text-[10px] mb-4" style={{ color: 'var(--bo-text-muted)' }}>origem dos últimos 6 meses</p>
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
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="intel-card overflow-hidden"
                    style={{ padding: 0 }}
                >
                    <div className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: '1px solid var(--bo-border)' }}>
                        <SectionHeader title="Leads Recentes" />
                        <Link href="/backoffice/leads">
                            <span className="text-xs font-semibold flex items-center gap-1"
                                style={{ color: 'var(--imi-blue-bright)' }}>
                                Ver todos <ArrowUpRight size={11} />
                            </span>
                        </Link>
                    </div>
                    <div>
                        {recentLeads.length > 0 ? recentLeads.slice(0, 4).map((lead: any) => {
                            const s = LEAD_STATUS_MAP[lead.status] ?? { statusKey: 'cold', label: lead.status }
                            return (
                                <Link key={lead.id} href={`/backoffice/leads/${lead.id}`}>
                                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
                                        style={{ borderBottom: '1px solid var(--bo-border)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bo-hover)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                                            style={{ background: 'var(--imi-blue-dim)', color: 'var(--imi-blue-bright)' }}>
                                            {lead.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--bo-text)' }}>
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
                    transition={{ delay: 0.45, duration: 0.4 }}
                    className="intel-card overflow-hidden"
                    style={{ padding: 0 }}
                >
                    <div className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: '1px solid var(--bo-border)' }}>
                        <SectionHeader title="Avaliações Recentes" />
                        <Link href="/backoffice/avaliacoes">
                            <span className="text-xs font-semibold flex items-center gap-1"
                                style={{ color: 'var(--imi-blue-bright)' }}>
                                Ver todas <ArrowUpRight size={11} />
                            </span>
                        </Link>
                    </div>
                    <div>
                        {recentAvaliacoes.length > 0 ? recentAvaliacoes.slice(0, 4).map((av: any) => {
                            const s = AV_STATUS_MAP[av.status] ?? { statusKey: 'pend', label: av.status }
                            return (
                                <div key={av.id}
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
                                    style={{ borderBottom: '1px solid var(--bo-border)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bo-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'var(--imi-blue-dim)' }}>
                                        <Scale size={13} style={{ color: 'var(--imi-blue-bright)' }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--bo-text)' }}>
                                            {av.protocolo}
                                        </p>
                                        <p className="text-[10px] truncate" style={{ color: 'var(--bo-text-muted)' }}>
                                            {av.tipo_imovel} · {av.bairro}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--imi-blue-bright)' }}>
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
