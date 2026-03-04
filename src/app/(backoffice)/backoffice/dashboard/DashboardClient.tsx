'use client'

import { useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'
import {
    TrendingUp, Users, Building2, Scale, Plus,
    ChevronRight, Banknote, BarChart2, AlertTriangle,
    Clock, Info, ArrowUpRight,
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Link from 'next/link'

// ── Design tokens ──────────────────────────────────────────────
const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)',
    textSub: 'var(--bo-text-muted)',
    gold: '#486581',
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

// ── Status badge ───────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, { label: string; color: string; bg: string }> = {
        concluida:      { label: 'Concluída',     color: '#6BB87B', bg: 'rgba(107,184,123,0.12)' },
        em_andamento:   { label: 'Em Andamento',  color: '#486581', bg: 'rgba(72,101,129,0.15)' },
        aguardando_docs:{ label: 'Aguard. Docs',  color: '#A89EC4', bg: 'rgba(168,158,196,0.12)' },
        pgto_pendente:  { label: 'Pgto. Pendente',color: '#E8A87C', bg: 'rgba(232,168,124,0.12)' },
        hot:  { label: 'Quente',  color: '#E8A87C', bg: 'rgba(232,168,124,0.12)' },
        warm: { label: 'Morno',   color: '#486581', bg: 'rgba(72,101,129,0.15)' },
        cold: { label: 'Frio',    color: '#7B9EC4', bg: 'rgba(123,158,196,0.12)' },
        new:  { label: 'Novo',    color: '#6BB87B', bg: 'rgba(107,184,123,0.12)' },
    }
    const c = cfg[status] || cfg.cold
    return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ color: c.color, background: c.bg }}>
            {c.label}
        </span>
    )
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
}

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export default function DashboardClient({
    stats, avStats, recentLeads, recentAvaliacoes,
    imoveisCount, chartData, canalPerformance, alertas,
}: Props) {
    const router = useRouter()

    const now = new Date()
    const dayNames  = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado']
    const monthNames = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
    const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} de ${monthNames[now.getMonth()]}`

    const KPIS = [
        {
            label: 'Honorários Recebidos', icon: Banknote,
            value: fmt(avStats.honorarios_recebidos),
            delta: avStats.honorarios_pendentes > 0 ? `+${fmt(avStats.honorarios_pendentes)} pendente` : null,
            up: null,
            sub: `${avStats.concluidas} avaliações concluídas`,
            href: '/backoffice/financeiro',
        },
        {
            label: 'Leads Ativos', icon: Users,
            value: String(stats.total_leads),
            delta: stats.leads_today > 0 ? `+${stats.leads_today} hoje` : null,
            up: stats.leads_today > 0,
            sub: 'no pipeline',
            href: '/backoffice/leads',
        },
        {
            label: 'Honorários a Receber', icon: Scale,
            value: fmt(avStats.honorarios_pendentes),
            delta: null, up: null,
            sub: `${avStats.em_andamento} laudos em andamento`,
            href: '/backoffice/avaliacoes',
        },
        {
            label: 'Imóveis no Portfólio', icon: Building2,
            value: String(imoveisCount),
            delta: null, up: null,
            sub: 'cadastrados',
            href: '/backoffice/imoveis',
        },
    ]

    const ACTIONS = [
        { label: 'Nova Avaliação',  href: '/backoffice/avaliacoes/nova', icon: Scale },
        { label: 'Novo Lead',       href: '/backoffice/leads/novo',      icon: Users },
        { label: 'Novo Imóvel',     href: '/backoffice/imoveis/novo',    icon: Building2 },
        { label: 'Ver Relatórios',  href: '/backoffice/relatorios',      icon: BarChart2 },
    ]

    const alertaIcon: Record<string, any> = {
        warning: AlertTriangle,
        danger:  AlertTriangle,
        info:    Info,
    }
    const alertaColor: Record<string, { border: string; bg: string; text: string; btn: string }> = {
        warning: { border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.06)', text: '#F59E0B', btn: 'rgba(245,158,11,0.15)' },
        danger:  { border: 'rgba(239,68,68,0.3)',  bg: 'rgba(239,68,68,0.06)',  text: '#EF4444', btn: 'rgba(239,68,68,0.15)' },
        info:    { border: 'rgba(72,101,129,0.4)', bg: 'rgba(72,101,129,0.08)', text: '#486581', btn: 'rgba(72,101,129,0.18)' },
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
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Painel Executivo</h1>
                    <p className="text-sm mt-0.5 capitalize" style={{ color: T.textSub }}>{dateStr}</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => router.push('/backoffice/avaliacoes/nova')}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                    style={{ background: T.gold }}
                >
                    <Plus size={15} />
                    <span className="hidden sm:inline">Nova Avaliação</span>
                    <span className="sm:hidden">+</span>
                </motion.button>
            </motion.div>

            {/* ── Alertas Críticos ─────────────────────────────── */}
            {alertas.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.35 }}
                    className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide"
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
                                <p className="text-xs font-medium flex-1" style={{ color: T.text }}>{alerta.mensagem}</p>
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

            {/* ── KPI Grid ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {KPIS.map((kpi, i) => {
                    const Icon = kpi.icon
                    return (
                        <motion.div
                            key={kpi.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Link href={kpi.href}>
                                <div
                                    className="hover-card relative overflow-hidden rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-200 group"
                                    style={{
                                        background: T.elevated,
                                        border: `1px solid ${T.borderGold}`,
                                        boxShadow: 'var(--bo-shadow)',
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ background: 'rgba(72,101,129,0.12)' }}>
                                            <Icon size={18} style={{ color: T.gold }} />
                                        </div>
                                        {kpi.delta && (
                                            <span className="text-[10px] font-semibold px-2 py-1 rounded-lg"
                                                style={{
                                                    color: kpi.up === true ? '#6BB87B' : kpi.up === false ? '#E57373' : T.textSub,
                                                    background: kpi.up === true ? 'rgba(107,184,123,0.12)' : kpi.up === false ? 'rgba(229,115,115,0.12)' : 'rgba(72,101,129,0.1)',
                                                }}>
                                                {kpi.up === true ? '↑ ' : kpi.up === false ? '↓ ' : ''}{kpi.delta}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xl sm:text-2xl font-bold tracking-tight mb-1" style={{ color: T.text }}>
                                        {kpi.value}
                                    </p>
                                    <p className="text-xs font-medium" style={{ color: T.textSub }}>{kpi.label}</p>
                                    {kpi.sub && (
                                        <p className="text-[11px] mt-1" style={{ color: T.textSub, opacity: 0.7 }}>{kpi.sub}</p>
                                    )}
                                </div>
                            </Link>
                        </motion.div>
                    )
                })}
            </div>

            {/* ── Gráfico + Ações Rápidas ─────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Gráfico de Leads e Receita */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="md:col-span-2 lg:col-span-2 rounded-2xl p-5"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-sm font-semibold" style={{ color: T.text }}>Performance — últimos 6 meses</h3>
                            <p className="text-xs mt-0.5" style={{ color: T.textSub }}>Leads captados vs Receita (R$ mil)</p>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: T.gold }} />
                                <span style={{ color: T.textSub }}>Leads</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#6BB87B' }} />
                                <span style={{ color: T.textSub }}>Receita</span>
                            </span>
                        </div>
                    </div>
                    <div style={{ height: 150 }}>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                                    <defs>
                                        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#486581" stopOpacity={0.22} />
                                            <stop offset="95%" stopColor="#486581" stopOpacity={0.01} />
                                        </linearGradient>
                                        <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#6BB87B" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#6BB87B" stopOpacity={0.01} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="mes" axisLine={false} tickLine={false}
                                        tick={{ fill: '#4E5669', fontSize: 10, fontWeight: 500 }} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{
                                            background: T.elevated,
                                            border: `1px solid ${T.borderGold}`,
                                            borderRadius: 10, color: T.text, fontSize: 11,
                                            boxShadow: 'var(--bo-shadow-elevated)',
                                        }}
                                        formatter={(v: any, name?: string) => [
                                            name === 'leads' ? `${v} leads` : `R$ ${v}k`,
                                            name === 'leads' ? 'Leads' : 'Receita',
                                        ] as [string, string]}
                                    />
                                    <Area type="monotone" dataKey="leads" stroke="#486581" strokeWidth={2}
                                        fill="url(#goldGrad)" dot={false}
                                        activeDot={{ r: 4, fill: '#486581', strokeWidth: 0 }} />
                                    <Area type="monotone" dataKey="receita" stroke="#6BB87B" strokeWidth={2}
                                        fill="url(#greenGrad)" dot={false}
                                        activeDot={{ r: 4, fill: '#6BB87B', strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-xs" style={{ color: T.textSub }}>Sem dados suficientes</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Ações Rápidas */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    className="rounded-2xl p-5"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                    <h3 className="text-sm font-semibold mb-4" style={{ color: T.text }}>Ações Rápidas</h3>
                    <div className="space-y-1.5">
                        {ACTIONS.map((a, i) => (
                            <Link key={a.href} href={a.href}>
                                <motion.div
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.37 + i * 0.05 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="hover-card flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group"
                                    style={{ background: 'transparent' }}
                                >
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'rgba(72,101,129,0.1)' }}>
                                        <a.icon size={14} style={{ color: T.gold }} />
                                    </div>
                                    <span className="text-sm font-medium flex-1" style={{ color: T.textSub }}>{a.label}</span>
                                    <ChevronRight size={14} style={{ color: T.textSub, opacity: 0.5 }}
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
                    transition={{ delay: 0.42, duration: 0.4 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                    <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                        <h3 className="text-sm font-semibold" style={{ color: T.text }}>Performance por Canal</h3>
                        <p className="text-[11px] mt-0.5" style={{ color: T.textSub }}>Origem dos últimos 6 meses</p>
                    </div>
                    {canalPerformance.length > 0 ? (
                        <div className="divide-y" style={{ borderColor: T.border }}>
                            {canalPerformance.map((item, i) => (
                                <div key={item.canal} className="flex items-center gap-3 px-5 py-3">
                                    <div className="w-6 text-center">
                                        <span className="text-[10px] font-bold" style={{ color: T.textSub }}>#{i + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate" style={{ color: T.text }}>{item.canal}</p>
                                        <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(72,101,129,0.12)' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.pct}%` }}
                                                transition={{ delay: 0.5 + i * 0.08, duration: 0.5 }}
                                                className="h-full rounded-full"
                                                style={{ background: T.gold }}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs font-bold" style={{ color: T.text }}>{item.leads}</p>
                                        <p className="text-[10px]" style={{ color: T.textSub }}>{item.pct}%</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-5 py-8 text-center">
                            <p className="text-xs" style={{ color: T.textSub }}>Sem dados de canal ainda</p>
                        </div>
                    )}
                </motion.div>

                {/* Leads Recentes */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.47, duration: 0.4 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                    <div className="flex items-center justify-between px-5 py-4"
                        style={{ borderBottom: `1px solid ${T.border}` }}>
                        <h3 className="text-sm font-semibold" style={{ color: T.text }}>Leads Recentes</h3>
                        <Link href="/backoffice/leads">
                            <span className="text-xs font-medium flex items-center gap-1" style={{ color: T.gold }}>
                                Ver todos <ArrowUpRight size={11} />
                            </span>
                        </Link>
                    </div>
                    <div className="divide-y" style={{ borderColor: T.border }}>
                        {recentLeads.length > 0 ? recentLeads.slice(0, 4).map((lead: any) => (
                            <Link key={lead.id} href={`/backoffice/leads/${lead.id}`}>
                                <div className="hover-card flex items-center gap-3 px-5 py-3 cursor-pointer transition-all">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                                        style={{ background: 'rgba(72,101,129,0.15)', color: T.gold }}>
                                        {lead.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate" style={{ color: T.text }}>{lead.name}</p>
                                        <p className="text-[10px] truncate" style={{ color: T.textSub }}>
                                            {lead.source} {lead.interest ? `· ${lead.interest}` : ''}
                                        </p>
                                    </div>
                                    <StatusBadge status={lead.status} />
                                </div>
                            </Link>
                        )) : (
                            <div className="px-5 py-8 text-center">
                                <p className="text-xs" style={{ color: T.textSub }}>Nenhum lead cadastrado</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Avaliações Recentes */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.52, duration: 0.4 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                    <div className="flex items-center justify-between px-5 py-4"
                        style={{ borderBottom: `1px solid ${T.border}` }}>
                        <h3 className="text-sm font-semibold" style={{ color: T.text }}>Avaliações Recentes</h3>
                        <Link href="/backoffice/avaliacoes">
                            <span className="text-xs font-medium flex items-center gap-1" style={{ color: T.gold }}>
                                Ver todas <ArrowUpRight size={11} />
                            </span>
                        </Link>
                    </div>
                    <div className="divide-y" style={{ borderColor: T.border }}>
                        {recentAvaliacoes.length > 0 ? recentAvaliacoes.slice(0, 4).map((av: any) => (
                            <div key={av.id} className="hover-card flex items-center gap-3 px-5 py-3 cursor-pointer transition-all">
                                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(72,101,129,0.1)' }}>
                                    <Scale size={13} style={{ color: T.gold }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate" style={{ color: T.text }}>
                                        {av.protocolo}
                                    </p>
                                    <p className="text-[10px] truncate" style={{ color: T.textSub }}>
                                        {av.tipo_imovel} · {av.bairro}
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-[11px] font-semibold" style={{ color: T.gold }}>
                                        {fmt(av.honorarios || 0)}
                                    </p>
                                    <StatusBadge status={av.status} />
                                </div>
                            </div>
                        )) : (
                            <div className="px-5 py-8 text-center">
                                <p className="text-xs" style={{ color: T.textSub }}>Nenhuma avaliação cadastrada</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

        </div>
    )
}
