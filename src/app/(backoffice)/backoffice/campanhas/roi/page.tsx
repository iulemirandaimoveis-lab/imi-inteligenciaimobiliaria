'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
    TrendingUp, TrendingDown, DollarSign, Target, Users,
    Award, AlertTriangle, Instagram, Facebook, Globe,
    Mail, MessageSquare, Loader2, ArrowLeft, RefreshCw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader, KPICard } from '@/app/(backoffice)/components/ui'

const CHANNEL_ICONS: Record<string, React.ElementType> = {
    instagram: Instagram,
    facebook: Facebook,
    google: Globe,
    email: Mail,
    whatsapp: MessageSquare,
    linkedin: Globe,
    youtube: Globe,
    outros: Target,
}

const CHANNEL_LABELS: Record<string, string> = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    google: 'Google Ads',
    email: 'E-mail',
    whatsapp: 'WhatsApp',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    outros: 'Outros',
}

type Period = '7d' | '30d' | '90d' | '365d'

const PERIOD_LABELS: Record<Period, string> = {
    '7d': 'Última Semana',
    '30d': 'Último Mês',
    '90d': 'Trimestre',
    '365d': 'Ano',
}

interface CanalROI {
    channel: string
    budget: number
    spent: number
    leads: number
    conversions: number
    avgRoi: number
    count: number
}

interface MonthlyROI {
    month: string
    invested: number
    leads: number
    avgRoi: number
}

function fmtBRL(v: number) {
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
    if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0).replace('.', ',')}k`
    return `R$ ${v.toFixed(0)}`
}

function fmtROI(v: number) {
    const prefix = v > 0 ? '+' : ''
    return `${prefix}${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`
}

export default function CampanhasROIPage() {
    const router = useRouter()
    const [period, setPeriod] = useState<Period>('30d')
    const [loading, setLoading] = useState(true)
    const [refreshKey, setRefreshKey] = useState(0)
    const [campaigns, setCampaigns] = useState<any[]>([])

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const supabase = createClient()
                const days = parseInt(period)
                const since = new Date()
                since.setDate(since.getDate() - days)

                const { data, error } = await supabase
                    .from('campaigns')
                    .select('id, name, channel, status, budget, spent, leads, conversions, roi, created_at')
                    .gte('created_at', since.toISOString())
                    .not('budget', 'is', null)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setCampaigns(data || [])
            } catch {
                toast.error('Erro ao carregar campanhas')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [period, refreshKey])

    // Aggregate ROI by channel
    const canaisROI = useMemo<CanalROI[]>(() => {
        const map: Record<string, { budget: number; spent: number; leads: number; conversions: number; roiSum: number; count: number }> = {}
        for (const c of campaigns) {
            const ch = (c.channel || 'outros').toLowerCase()
            if (!map[ch]) map[ch] = { budget: 0, spent: 0, leads: 0, conversions: 0, roiSum: 0, count: 0 }
            map[ch].budget += Number(c.budget) || 0
            map[ch].spent += Number(c.spent) || 0
            map[ch].leads += Number(c.leads) || 0
            map[ch].conversions += Number(c.conversions) || 0
            map[ch].roiSum += Number(c.roi) || 0
            map[ch].count += 1
        }
        return Object.entries(map)
            .map(([channel, d]) => ({
                channel,
                budget: d.budget,
                spent: d.spent,
                leads: d.leads,
                conversions: d.conversions,
                avgRoi: d.count > 0 ? d.roiSum / d.count : 0,
                count: d.count,
            }))
            .sort((a, b) => b.avgRoi - a.avgRoi)
    }, [campaigns])

    // Monthly evolution (last 6 months)
    const evolucaoMensal = useMemo<MonthlyROI[]>(() => {
        const months: Record<string, { invested: number; leads: number; roiSum: number; count: number }> = {}
        for (const c of campaigns) {
            const d = new Date(c.created_at)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            if (!months[key]) months[key] = { invested: 0, leads: 0, roiSum: 0, count: 0 }
            months[key].invested += Number(c.spent) || 0
            months[key].leads += Number(c.leads) || 0
            months[key].roiSum += Number(c.roi) || 0
            months[key].count += 1
        }
        return Object.entries(months)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([key, d]) => {
                const [yr, mo] = key.split('-')
                const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                return {
                    month: `${MONTHS[parseInt(mo) - 1]}/${yr.slice(2)}`,
                    invested: d.invested,
                    leads: d.leads,
                    avgRoi: d.count > 0 ? d.roiSum / d.count : 0,
                }
            })
    }, [campaigns])

    // Top / Bottom performers (by roi column from DB)
    const campSorted = useMemo(() => {
        return [...campaigns]
            .filter(c => c.spent > 0 && c.roi != null)
            .map(c => ({ ...c, roi: Number(c.roi) }))
            .sort((a, b) => b.roi - a.roi)
    }, [campaigns])

    const topPerformers = campSorted.slice(0, 3)
    const bottomPerformers = campSorted.filter(c => c.roi < 0 || c.roi < 50).slice(-2).reverse()

    // KPIs
    const totalSpent = campaigns.reduce((s, c) => s + (Number(c.spent) || 0), 0)
    const totalBudget = campaigns.reduce((s, c) => s + (Number(c.budget) || 0), 0)
    const totalLeads = campaigns.reduce((s, c) => s + (Number(c.leads) || 0), 0)
    const totalConversions = campaigns.reduce((s, c) => s + (Number(c.conversions) || 0), 0)
    const avgROI = campaigns.length > 0
        ? campaigns.reduce((s, c) => s + (Number(c.roi) || 0), 0) / campaigns.length
        : 0
    const cpl = totalLeads > 0 ? totalSpent / totalLeads : 0

    // Auto-insights
    const insights: string[] = useMemo(() => {
        const out: string[] = []
        if (canaisROI.length > 0) {
            const best = canaisROI[0]
            out.push(`${CHANNEL_LABELS[best.channel] ?? best.channel} tem o melhor ROI médio (${fmtROI(best.avgRoi)}) com ${best.leads} leads gerados`)
        }
        if (topPerformers.length > 0) {
            out.push(`Campanha "${topPerformers[0].name}" tem ROI de ${fmtROI(topPerformers[0].roi)} — ${topPerformers[0].leads || 0} leads`)
        }
        if (canaisROI.length > 1) {
            const worst = canaisROI[canaisROI.length - 1]
            if (worst.avgRoi < 0) {
                out.push(`${CHANNEL_LABELS[worst.channel] ?? worst.channel} tem ROI negativo (${fmtROI(worst.avgRoi)}) — realocar budget`)
            } else {
                out.push(`${CHANNEL_LABELS[worst.channel] ?? worst.channel} tem ROI mais baixo — oportunidade de otimização`)
            }
        }
        if (totalBudget > totalSpent && totalBudget > 0) {
            const pct = ((totalBudget - totalSpent) / totalBudget * 100).toFixed(0)
            out.push(`${pct}% do budget ainda disponível para aplicar neste período`)
        }
        if (cpl > 0) {
            out.push(`Custo por lead atual: ${fmtBRL(cpl)} · ${totalConversions} conversões registradas`)
        }
        return out
    }, [canaisROI, topPerformers, totalBudget, totalSpent, cpl, totalConversions])

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="CAMPANHAS"
                title="ROI das Campanhas"
                subtitle="Análise de retorno sobre investimento — dados reais"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.back()}
                            className="w-11 h-11 flex items-center justify-center rounded-xl transition-opacity hover:opacity-80"
                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                        >
                            <ArrowLeft size={16} style={{ color: T.textMuted }} />
                        </button>
                        <button
                            onClick={() => setRefreshKey(k => k + 1)}
                            className="w-11 h-11 flex items-center justify-center rounded-xl transition-opacity hover:opacity-80"
                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                            title="Atualizar dados"
                        >
                            <RefreshCw size={14} style={{ color: T.textMuted }} />
                        </button>
                        <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                            {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([k, v]) => (
                                <button
                                    key={k}
                                    onClick={() => setPeriod(k)}
                                    className="px-3 h-10 text-[10px] font-bold transition-colors whitespace-nowrap"
                                    style={{
                                        background: period === k ? T.accent : 'transparent',
                                        color: period === k ? '#fff' : T.textMuted,
                                    }}
                                >
                                    {k === '7d' ? '7d' : k === '30d' ? '30d' : k === '90d' ? '90d' : '1a'}
                                </button>
                            ))}
                        </div>
                    </div>
                }
            />

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin" style={{ color: T.accent }} />
                </div>
            ) : campaigns.length === 0 ? (
                <div className="rounded-2xl p-12 text-center" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                    <Target size={40} className="mx-auto mb-3 opacity-30" style={{ color: T.textMuted }} />
                    <p className="font-semibold" style={{ color: T.text }}>Nenhuma campanha neste período</p>
                    <p className="text-sm mt-1" style={{ color: T.textMuted }}>Crie campanhas com budget definido para visualizar ROI</p>
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        <KPICard label="ROI Médio"     value={fmtROI(avgROI)}         icon={<TrendingUp size={14} />}  accent={avgROI >= 0 ? 'green' : 'hot'} size="sm" />
                        <KPICard label="Investido"     value={fmtBRL(totalSpent)}      icon={<DollarSign size={14} />}  size="sm" />
                        <KPICard label="Leads Gerados" value={String(totalLeads)}      icon={<Users size={14} />}       accent="blue" size="sm" />
                        <KPICard label="CPL"           value={fmtBRL(cpl)}             icon={<Target size={14} />}      size="sm" />
                    </div>

                    {/* ROI por Canal */}
                    {canaisROI.length > 0 && (
                        <div className="rounded-2xl p-6" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <h2 className="text-base font-bold mb-5" style={{ color: T.text }}>ROI por Canal</h2>
                            <div className="space-y-4">
                                {canaisROI.map((canal, idx) => {
                                    const Icon = CHANNEL_ICONS[canal.channel] ?? Target
                                    const maxROI = Math.max(...canaisROI.map(c => Math.abs(c.avgRoi)), 1)
                                    const barW = Math.max(4, (Math.abs(canal.avgRoi) / maxROI) * 100)
                                    const isPositive = canal.avgRoi >= 0
                                    return (
                                        <div key={idx}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: T.surface }}>
                                                        <Icon size={18} style={{ color: T.textMuted }} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold" style={{ color: T.text }}>
                                                            {CHANNEL_LABELS[canal.channel] ?? canal.channel}
                                                        </p>
                                                        <p className="text-xs" style={{ color: T.textMuted }}>
                                                            {fmtBRL(canal.spent)} investido · {canal.leads} leads · {canal.count} camp.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-base font-bold"
                                                        style={{ color: isPositive ? 'var(--bo-success)' : 'var(--bo-error)' }}>
                                                        {fmtROI(canal.avgRoi)}
                                                    </p>
                                                    <p className="text-xs" style={{ color: T.textMuted }}>{canal.conversions} conv.</p>
                                                </div>
                                            </div>
                                            <div className="h-2 rounded-full overflow-hidden" style={{ background: T.surface }}>
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${barW}%`, background: isPositive ? 'var(--bo-success)' : 'var(--bo-error)' }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Top & Bottom */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Top performers */}
                        <div className="rounded-2xl p-6" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <div className="flex items-center gap-2 mb-4">
                                <Award size={18} style={{ color: 'var(--bo-success)' }} />
                                <h2 className="text-base font-bold" style={{ color: T.text }}>Top Performers</h2>
                            </div>
                            {topPerformers.length === 0 ? (
                                <p className="text-sm text-center py-6" style={{ color: T.textMuted }}>Sem dados de ROI</p>
                            ) : (
                                <div className="space-y-3">
                                    {topPerformers.map((camp, idx) => (
                                        <div key={camp.id} className="p-3 rounded-xl" style={{ background: 'rgba(107,184,123,0.06)', border: '1px solid rgba(107,184,123,0.15)' }}>
                                            <div className="flex items-start justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--bo-success)', color: '#0F0F1E' }}>
                                                        {idx + 1}
                                                    </div>
                                                    <p className="text-sm font-semibold line-clamp-1" style={{ color: T.text }}>{camp.name}</p>
                                                </div>
                                                <p className="text-sm font-bold ml-2 shrink-0" style={{ color: 'var(--bo-success)' }}>{fmtROI(camp.roi)}</p>
                                            </div>
                                            <p className="text-xs pl-7" style={{ color: T.textMuted }}>
                                                {fmtBRL(Number(camp.spent))} investido · {camp.leads || 0} leads · {camp.conversions || 0} conv.
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Needs attention */}
                        <div className="rounded-2xl p-6" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle size={18} style={{ color: '#E8A87C' }} />
                                <h2 className="text-base font-bold" style={{ color: T.text }}>Requerem Atenção</h2>
                            </div>
                            {bottomPerformers.length === 0 ? (
                                <p className="text-sm text-center py-6" style={{ color: T.textMuted }}>Todas campanhas com bom ROI</p>
                            ) : (
                                <div className="space-y-3">
                                    {bottomPerformers.map(camp => (
                                        <div key={camp.id} className="p-3 rounded-xl" style={{ background: 'rgba(232,168,124,0.06)', border: '1px solid rgba(232,168,124,0.15)' }}>
                                            <div className="flex items-start justify-between mb-1">
                                                <p className="text-sm font-semibold line-clamp-1" style={{ color: T.text }}>{camp.name}</p>
                                                <p className="text-sm font-bold ml-2 shrink-0"
                                                    style={{ color: camp.roi < 0 ? 'var(--bo-error)' : '#E8A87C' }}>
                                                    {fmtROI(camp.roi)}
                                                </p>
                                            </div>
                                            <p className="text-xs" style={{ color: T.textMuted }}>
                                                {fmtBRL(Number(camp.spent))} investido · {camp.leads || 0} leads · Canal: {CHANNEL_LABELS[(camp.channel || '').toLowerCase()] ?? camp.channel}
                                            </p>
                                            <p className="text-xs mt-1" style={{ color: '#E8A87C' }}>Considerar otimização ou realocação de budget</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Evolução Mensal */}
                    {evolucaoMensal.length > 1 && (
                        <div className="rounded-2xl p-6" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <h2 className="text-base font-bold mb-5" style={{ color: T.text }}>Evolução Mensal</h2>
                            <div className="space-y-3">
                                {evolucaoMensal.map((m, idx) => {
                                    const maxROI = Math.max(...evolucaoMensal.map(x => Math.abs(x.avgRoi)), 1)
                                    const barW = Math.max(4, (Math.abs(m.avgRoi) / maxROI) * 100)
                                    const prev = idx > 0 ? evolucaoMensal[idx - 1] : null
                                    const trend = prev ? m.avgRoi >= prev.avgRoi : true
                                    const isPositive = m.avgRoi >= 0
                                    return (
                                        <div key={m.month}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold w-16" style={{ color: T.text }}>{m.month}</span>
                                                    {trend
                                                        ? <TrendingUp size={12} style={{ color: 'var(--bo-success)' }} />
                                                        : <TrendingDown size={12} style={{ color: 'var(--bo-error)' }} />}
                                                    <span className="text-xs font-medium"
                                                        style={{ color: isPositive ? 'var(--bo-success)' : 'var(--bo-error)' }}>
                                                        {fmtROI(m.avgRoi)}
                                                    </span>
                                                </div>
                                                <span className="text-xs" style={{ color: T.textMuted }}>
                                                    {fmtBRL(m.invested)} · {m.leads} leads
                                                </span>
                                            </div>
                                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.surface }}>
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${barW}%`, background: isPositive ? 'var(--bo-success)' : 'var(--bo-error)' }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Insights */}
                    {insights.length > 0 && (
                        <div className="rounded-2xl p-5" style={{ background: `${T.elevated}`, border: `1px solid ${T.border}` }}>
                            <h3 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: T.accent }}>Insights Automáticos</h3>
                            <ul className="space-y-1.5">
                                {insights.map((ins, i) => (
                                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: T.textMuted }}>
                                        <span style={{ color: T.accent, flexShrink: 0 }}>·</span> {ins}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
