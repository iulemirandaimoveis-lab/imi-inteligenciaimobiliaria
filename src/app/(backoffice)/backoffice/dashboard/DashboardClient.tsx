'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'
import {
    TrendingUp, Users, Building2, DollarSign, FileText, ArrowRight,
    CheckCircle2, MapPin, Calendar, ChevronRight, Scale, Plus,
    Clock, AlertCircle, Banknote, BarChart2, Sparkles, Zap
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import Link from 'next/link'

// ── Design tokens ──────────────────────────────────────────────
const T = {
    bg: 'transparent',
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    overlay: 'var(--bo-surface)',
    border: 'var(--bo-border)',
    borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)',
    textSub: 'var(--bo-text-muted)',
    textDim: 'var(--bo-text-muted)',
    gold: '#C49D5B',
    goldLight: '#D4AF70',
    goldDim: 'rgba(196,157,91,0.60)',
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

// ── Glass KPI Card ─────────────────────────────────────────────
function KPICard({ kpi, index }: { kpi: any; index: number }) {
    const Icon = kpi.icon
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <Link href={kpi.href}>
                <div
                    className="relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all duration-200 group"
                    style={{
                        background: 'var(--bo-elevated)',
                        border: '1px solid var(--bo-border-gold)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        boxShadow: 'var(--bo-shadow)',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.border = '1px solid rgba(196,157,91,0.35)'
                            ; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--bo-shadow-elevated)'
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.border = '1px solid var(--bo-border-gold)'
                            ; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--bo-shadow)'
                    }}
                >
                    {/* Subtle gold corner glow */}
                    <div
                        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ background: 'radial-gradient(circle, rgba(196,157,91,0.12) 0%, transparent 70%)' }}
                    />

                    <div className="flex items-start justify-between mb-4">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(196,157,91,0.12)' }}
                        >
                            <Icon size={18} style={{ color: T.gold }} />
                        </div>
                        {kpi.delta && (
                            <span
                                className="text-[11px] font-semibold px-2 py-1 rounded-lg"
                                style={{
                                    color: kpi.up ? '#6BB87B' : '#E57373',
                                    background: kpi.up ? 'rgba(107,184,123,0.12)' : 'rgba(229,115,115,0.12)',
                                }}
                            >
                                {kpi.up ? '↑' : '↓'} {kpi.delta}
                            </span>
                        )}
                    </div>

                    <p className="text-2xl font-bold tracking-tight mb-1" style={{ color: T.text }}>
                        {kpi.value}
                    </p>
                    <p className="text-xs font-medium" style={{ color: T.textSub }}>{kpi.label}</p>
                    {kpi.sub && (
                        <p className="text-[11px] mt-1.5" style={{ color: T.textDim }}>{kpi.sub}</p>
                    )}
                </div>
            </Link>
        </motion.div>
    )
}

// ── Status badge ───────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, { label: string; color: string; bg: string }> = {
        concluida: { label: 'Concluída', color: '#6BB87B', bg: 'rgba(107,184,123,0.12)' },
        em_andamento: { label: 'Em Andamento', color: '#C49D5B', bg: 'rgba(196,157,91,0.12)' },
        aguardando_docs: { label: 'Aguard. Docs', color: '#A89EC4', bg: 'rgba(168,158,196,0.12)' },
        hot: { label: 'Quente', color: '#E8A87C', bg: 'rgba(232,168,124,0.12)' },
        warm: { label: 'Morno', color: '#C49D5B', bg: 'rgba(196,157,91,0.12)' },
        cold: { label: 'Frio', color: '#7B9EC4', bg: 'rgba(123,158,196,0.12)' },
    }
    const c = cfg[status] || cfg.cold
    return (
        <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ color: c.color, background: c.bg }}
        >
            {c.label}
        </span>
    )
}

interface Props {
    stats: any
    avStats: any
    recentLeads: any[]
    recentAvaliacoes: any[]
    imoveisCount: number
    chartData?: any[]
}

export default function DashboardClient({ stats, avStats, recentLeads, recentAvaliacoes, imoveisCount, chartData }: Props) {
    const router = useRouter()
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

    const KPIS = [
        {
            label: 'Receita do Mês', icon: Banknote,
            value: fmt(stats.receita_mes || 0),
            delta: '0%', up: true,
            sub: 'vs. mês anterior',
            href: '/backoffice/financeiro',
        },
        {
            label: 'Leads Ativos', icon: Users,
            value: stats.total_leads || 0,
            delta: `+${stats.leads_today || 0} hoje`, up: true,
            sub: 'no pipeline',
            href: '/backoffice/leads',
        },
        {
            label: 'Honorários a Receber', icon: Scale,
            value: fmt(avStats.honorarios_pendentes || 0),
            delta: null, up: null,
            sub: `${avStats.em_andamento || 0} laudos em andamento`,
            href: '/backoffice/avaliacoes',
        },
        {
            label: 'Imóveis no Portfólio', icon: Building2,
            value: imoveisCount,
            delta: null, up: null,
            sub: 'ativos cadastrados',
            href: '/backoffice/imoveis',
        },
    ]

    const ACTIONS = [
        { label: 'Nova Avaliação', href: '/backoffice/avaliacoes/nova', icon: Scale },
        { label: 'Novo Lead', href: '/backoffice/leads/novo', icon: Users },
        { label: 'Novo Imóvel', href: '/backoffice/imoveis/novo', icon: Building2 },
        { label: 'Gerar Relatório', href: '/backoffice/relatorios', icon: BarChart2 },
    ]

    // Format date
    const now = new Date()
    const dayNames = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
    const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
    const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} de ${monthNames[now.getMonth()]}`

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* ── Page Header ─────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex items-start justify-between gap-4"
            >
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Dashboard</h1>
                    <p className="text-sm mt-0.5 capitalize" style={{ color: T.textDim }}>{dateStr}</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => router.push('/backoffice/avaliacoes/nova')}
                    className="flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                    style={{
                        background: '#C49D5B',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                >
                    <Plus size={16} />
                    <span className="hidden sm:inline">Nova Avaliação</span>
                    <span className="sm:hidden">+</span>
                </motion.button>
            </motion.div>

            {/* ── KPI Grid ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {KPIS.map((kpi, i) => <KPICard key={kpi.label} kpi={kpi} index={i} />)}
            </div>

            {/* ── Revenue Chart + Quick Actions ──────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                    className="lg:col-span-2 rounded-2xl p-5"
                    style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                    }}
                >
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-sm font-semibold" style={{ color: T.text }}>Receita — últimos 6 meses</h3>
                            <p className="text-xs mt-0.5" style={{ color: T.textDim }}>Em milhares R$</p>
                        </div>
                        <div
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                            style={{ color: '#6BB87B', background: 'rgba(107,184,123,0.12)' }}
                        >
                            ↑ +18%
                        </div>
                    </div>
                    <div style={{ height: 140 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData || []}>
                                <defs>
                                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#C49D5B" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#C49D5B" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="mes"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#4E5669', fontSize: 10, fontWeight: 500 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: T.elevated,
                                        border: `1px solid ${T.borderGold}`,
                                        borderRadius: 10,
                                        color: T.text,
                                        fontSize: 11,
                                        boxShadow: 'var(--bo-shadow-elevated)',
                                    }}
                                    formatter={(v: any) => [`${formatCurrency(v)}`, 'Receita']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="honorarios"
                                    stroke="#C49D5B"
                                    strokeWidth={2}
                                    fill="url(#goldGrad)"
                                    dot={false}
                                    activeDot={{ r: 4, fill: '#C49D5B', strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.30, duration: 0.4 }}
                    className="rounded-2xl p-5"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                    <h3 className="text-sm font-semibold mb-4" style={{ color: T.text }}>Ações Rápidas</h3>
                    <div className="space-y-2">
                        {ACTIONS.map((a, i) => (
                            <Link key={a.href} href={a.href}>
                                <motion.div
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.32 + i * 0.05 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group"
                                    style={{ background: 'transparent' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = T.elevated)}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:bg-[rgba(196,157,91,0.18)]"
                                        style={{ background: 'rgba(196,157,91,0.08)' }}
                                    >
                                        <a.icon size={15} style={{ color: T.gold }} />
                                    </div>
                                    <span className="text-sm font-medium flex-1" style={{ color: T.textSub }}>{a.label}</span>
                                    <ChevronRight size={14} style={{ color: T.textDim }} className="group-hover:translate-x-0.5 transition-transform" />
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ── Recent Activity ──────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Recent Leads */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.38, duration: 0.4 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                    <div
                        className="flex items-center justify-between px-5 py-4"
                        style={{ borderBottom: `1px solid ${T.border}` }}
                    >
                        <h3 className="text-sm font-semibold" style={{ color: T.text }}>Leads Recentes</h3>
                        <Link href="/backoffice/leads">
                            <span className="text-xs font-medium" style={{ color: T.gold }}>Ver todos →</span>
                        </Link>
                    </div>
                    <div className="divide-y" style={{ borderColor: 'var(--bo-border)' }}>
                        {recentLeads.length === 0 ? (
                            <div className="px-5 py-8 text-center" style={{ color: T.textDim }}>
                                <p className="text-xs font-medium">Nenhum lead recebido ainda.</p>
                            </div>
                        ) : recentLeads.slice(0, 4).map((lead: any, i) => (
                            <div
                                key={lead.id}
                                className="flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all"
                                style={{}}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bo-hover)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                    style={{
                                        background: 'rgba(196,157,91,0.15)',
                                        color: T.gold,
                                    }}
                                >
                                    {lead.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate" style={{ color: T.text }}>{lead.name}</p>
                                    <p className="text-[11px] truncate" style={{ color: T.textDim }}>
                                        {lead.source || 'Lead'} · {lead.interest_type || 'Geral'}
                                    </p>
                                </div>
                                <StatusBadge status={lead.status || 'new'} />
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Recent Avaliacoes */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.43, duration: 0.4 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                    <div
                        className="flex items-center justify-between px-5 py-4"
                        style={{ borderBottom: `1px solid ${T.border}` }}
                    >
                        <h3 className="text-sm font-semibold" style={{ color: T.text }}>Avaliações Recentes</h3>
                        <Link href="/backoffice/avaliacoes">
                            <span className="text-xs font-medium" style={{ color: T.gold }}>Ver todas →</span>
                        </Link>
                    </div>
                    <div className="divide-y" style={{ borderColor: 'var(--bo-border)' }}>
                        {recentAvaliacoes.length === 0 ? (
                            <div className="px-5 py-8 text-center" style={{ color: T.textDim }}>
                                <p className="text-xs font-medium">Nenhuma avaliação recente.</p>
                            </div>
                        ) : recentAvaliacoes.slice(0, 4).map((av: any) => (
                            <div
                                key={av.id}
                                className="flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all"
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bo-hover)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <div
                                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(196,157,91,0.08)' }}
                                >
                                    <Scale size={14} style={{ color: T.gold }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate" style={{ color: T.text }}>
                                        {av.protocolo || 'AVL-XXXX'}
                                    </p>
                                    <p className="text-[11px] truncate" style={{ color: T.textDim }}>
                                        {av.tipo_imovel || 'Imóvel'} · {av.bairro || 'Sem registro'}
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-xs font-semibold" style={{ color: T.gold }}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(av.honorarios || 0)}
                                    </p>
                                    <StatusBadge status={av.status || 'new'} />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

        </div>
    )
}
