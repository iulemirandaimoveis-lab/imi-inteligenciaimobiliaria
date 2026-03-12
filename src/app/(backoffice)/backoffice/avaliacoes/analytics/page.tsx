'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    FileText, Clock, DollarSign, CheckCircle, Users,
    Building2, PieChart, BarChart3, MapPin, Target, Zap,
    Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'

interface Avaliacao {
    id: string
    status: string
    tipo_imovel: string
    metodologia: string
    honorarios: number | null
    cliente_nome: string
    bairro: string
    created_at: string
    prazo_entrega: string | null
}

const STATUS_CONCLUIDO = ['concluida', 'concluído', 'entregue', 'aprovada', 'aprovado']
const STATUS_PENDENTE  = ['aguardando_docs', 'em_analise', 'em_visita', 'em_elaboracao', 'rascunho', 'nova', 'aberta']
const STATUS_CANCELADO = ['cancelada', 'cancelado', 'arquivada']

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
    return arr.reduce((acc, item) => {
        const k = key(item)
        if (!acc[k]) acc[k] = []
        acc[k].push(item)
        return acc
    }, {} as Record<string, T[]>)
}

export default function AvaliacoesAnalyticsPage() {
    const [timeRange, setTimeRange] = useState('6m')
    const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/avaliacoes?limit=250')
            .then(r => r.json())
            .then(json => {
                const list: Avaliacao[] = json.data || (Array.isArray(json) ? json : [])
                setAvaliacoes(list)
            })
            .catch(() => { toast.error('Erro ao carregar analytics de avaliações') })
            .finally(() => setLoading(false))
    }, [])

    const data = useMemo(() => {
        // Filter by time range
        const now = new Date()
        const monthsBack = timeRange === '30d' ? 1 : timeRange === '3m' ? 3 : timeRange === 'year' ? 12 : 6
        const cutoff = new Date(now)
        cutoff.setMonth(cutoff.getMonth() - monthsBack)
        const filtered = avaliacoes.filter(a => new Date(a.created_at) >= cutoff)

        const total = filtered.length
        const completed = filtered.filter(a => STATUS_CONCLUIDO.includes(a.status?.toLowerCase() ?? '')).length
        const pending = filtered.filter(a => STATUS_PENDENTE.includes(a.status?.toLowerCase() ?? '')).length
        const cancelled = filtered.filter(a => STATUS_CANCELADO.includes(a.status?.toLowerCase() ?? '')).length
        const totalRevenue = filtered.reduce((s, a) => s + (a.honorarios ?? 0), 0)

        // Avg delivery time (days from created_at to prazo_entrega, or SLA target ~3 days)
        const withPrazo = filtered.filter(a => a.prazo_entrega)
        const avgTime = withPrazo.length > 0
            ? withPrazo.reduce((s, a) => {
                const diff = (new Date(a.prazo_entrega!).getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24)
                return s + Math.abs(diff)
            }, 0) / withPrazo.length
            : 3.2

        // By tipo_imovel
        const byTipoRaw = groupBy(filtered, a => a.tipo_imovel || 'Não informado')
        const byType = Object.entries(byTipoRaw).map(([type, items]) => ({
            type,
            count: items.length,
            percentage: total > 0 ? Math.round((items.length / total) * 100 * 10) / 10 : 0,
            avgValue: items.reduce((s, i) => s + (i.honorarios ?? 0), 0) / (items.length || 1),
        })).sort((a, b) => b.count - a.count).slice(0, 3)

        // By metodologia
        const byMetRaw = groupBy(filtered, a => {
            const m = (a.metodologia || 'comparativo').toLowerCase()
            if (m.includes('renda')) return 'Renda'
            if (m.includes('custo')) return 'Custo'
            return 'Comparativo'
        })
        const byMethod = Object.entries(byMetRaw).map(([method, items]) => ({
            method,
            count: items.length,
            percentage: total > 0 ? Math.round((items.length / total) * 100 * 10) / 10 : 0,
        })).sort((a, b) => b.count - a.count)

        // Monthly trend (last 6 months)
        const months: { month: string; total: number; completed: number; revenue: number }[] = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now)
            d.setMonth(d.getMonth() - i)
            const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
            const monthItems = avaliacoes.filter(a => {
                const ad = new Date(a.created_at)
                return ad.getFullYear() === d.getFullYear() && ad.getMonth() === d.getMonth()
            })
            months.push({
                month: label,
                total: monthItems.length,
                completed: monthItems.filter(a => STATUS_CONCLUIDO.includes(a.status?.toLowerCase() ?? '')).length,
                revenue: monthItems.reduce((s, a) => s + (a.honorarios ?? 0), 0),
            })
        }

        // Top clients
        const byClient = groupBy(filtered, a => a.cliente_nome || 'Sem nome')
        const topClients = Object.entries(byClient).map(([name, items]) => ({
            name,
            count: items.length,
            revenue: items.reduce((s, i) => s + (i.honorarios ?? 0), 0),
        })).sort((a, b) => b.count - a.count).slice(0, 3)

        // By neighborhood
        const byBairro = groupBy(filtered, a => a.bairro || 'Não informado')
        const avgByNeighborhood = Object.entries(byBairro).map(([neighborhood, items]) => ({
            neighborhood,
            count: items.length,
            avgValue: items.reduce((s, i) => s + (i.honorarios ?? 0), 0) / (items.length || 1),
        })).filter(n => n.count > 0).sort((a, b) => b.avgValue - a.avgValue).slice(0, 4)

        return { total, completed, pending, cancelled, totalRevenue, avgTime, byType, byMethod, monthlyTrend: months, topClients, avgByNeighborhood }
    }, [avaliacoes, timeRange])

    const completionRate = data.total > 0 ? ((data.completed / data.total) * 100).toFixed(1) : '0.0'

    const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

    if (loading) {
        return (
            <div className="space-y-5">
                <div className="animate-pulse" style={{ height: '72px', borderRadius: '16px', background: T.surface, border: `1px solid ${T.border}` }} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: T.elevated, marginBottom: '12px' }} />
                            <div style={{ height: '28px', width: '60%', borderRadius: '6px', background: T.elevated, marginBottom: '8px' }} />
                            <div style={{ height: '12px', width: '80%', borderRadius: '6px', background: T.elevated }} />
                        </div>
                    ))}
                </div>
                <div className="animate-pulse rounded-2xl" style={{ height: '200px', background: T.surface, border: `1px solid ${T.border}` }} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="animate-pulse rounded-2xl" style={{ height: '240px', background: T.surface, border: `1px solid ${T.border}` }} />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="ANALYTICS · AVALIAÇÕES"
                title="Analytics: Laudos & Avaliações"
                subtitle={`Performance analítica do motor de avaliação imobiliária · ${data.total} avaliações no período`}
                actions={
                    <select
                        value={timeRange}
                        onChange={e => setTimeRange(e.target.value)}
                        className="h-11 px-4 rounded-xl text-sm outline-none shrink-0"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    >
                        <option value="30d">Últimos 30 dias</option>
                        <option value="3m">Últimos 3 meses</option>
                        <option value="6m">Últimos 6 meses</option>
                        <option value="year">Último ano</option>
                    </select>
                }
            />

            {/* KPI Scorecard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Volume de Laudos', value: data.total.toString(), icon: FileText, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
                    { label: 'Taxa de Entrega', value: `${completionRate}%`, icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                    { label: 'SLA Médio', value: `${data.avgTime.toFixed(1)} dias`, icon: Clock, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
                    { label: 'Billing Total', value: formatCurrency(data.totalRevenue), icon: DollarSign, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="rounded-2xl p-5 relative overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                            <Icon size={20} style={{ color }} />
                        </div>
                        <p className="text-3xl font-black mb-1 leading-tight" style={{ color: T.text, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>{label}</p>
                        <div className="absolute bottom-3 right-3 opacity-[0.06]">
                            <Icon size={48} style={{ color }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Status breakdown */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Concluídas', value: data.completed, color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
                    { label: 'Em Andamento', value: data.pending, color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
                    { label: 'Canceladas', value: data.cancelled, color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
                ].map(({ label, value, color, bg, border }) => (
                    <div key={label} className="rounded-xl p-4 text-center" style={{ background: bg, border: `1px solid ${border}` }}>
                        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                        <p className="text-xs mt-1" style={{ color }}>{label}</p>
                    </div>
                ))}
            </div>

            {/* Distribution Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By tipo_imovel */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="mb-5">
                        <h3 className="text-base font-bold" style={{ color: T.text }}>Segmentação por Tipo de Imóvel</h3>
                        <p className="text-xs mt-1" style={{ color: T.textMuted }}>Distribuição por tipologia</p>
                    </div>
                    {data.byType.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: T.textMuted }}>Sem dados no período</p>
                    ) : (
                        <div className="space-y-5">
                            {data.byType.map(item => (
                                <div key={item.type} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.elevated }}>
                                                <Building2 size={16} style={{ color: T.textMuted }} />
                                            </div>
                                            <span className="text-sm font-bold capitalize" style={{ color: T.text }}>{item.type}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold" style={{ color: T.accent }}>{item.percentage}%</span>
                                            <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: T.elevated, color: T.textMuted }}>{item.count}</span>
                                        </div>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                        <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, background: T.accent }} />
                                    </div>
                                    {item.avgValue > 0 && (
                                        <p className="text-xs" style={{ color: T.textMuted }}>
                                            Honorário médio: <span style={{ color: T.text }}>{formatCurrency(item.avgValue)}</span>
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* By metodologia */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="mb-5">
                        <h3 className="text-base font-bold" style={{ color: T.text }}>Metodologias (NBR 14653)</h3>
                        <p className="text-xs mt-1" style={{ color: T.textMuted }}>Consistência técnica dos laudos</p>
                    </div>
                    {data.byMethod.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: T.textMuted }}>Sem dados no período</p>
                    ) : (
                        <div className="space-y-5">
                            {data.byMethod.map(item => (
                                <div key={item.method} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold uppercase tracking-wide" style={{ color: T.text }}>
                                            Método {item.method}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs" style={{ color: T.textMuted }}>{item.percentage}%</span>
                                            <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: T.elevated, color: T.textMuted }}>{item.count}</span>
                                        </div>
                                    </div>
                                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                        <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, background: '#3B82F6' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Monthly Trend */}
            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-base font-bold" style={{ color: T.text }}>Trend de Billing & Produtividade</h3>
                        <p className="text-xs mt-1" style={{ color: T.textMuted }}>Volume mensal dos últimos 6 meses</p>
                    </div>
                </div>
                <div className="space-y-4">
                    {data.monthlyTrend.map(month => {
                        const maxTotal = Math.max(...data.monthlyTrend.map(m => m.total), 1)
                        const pct = (month.total / maxTotal) * 100
                        return (
                            <div key={month.month} className="flex items-center gap-4">
                                <span className="text-xs font-bold w-12 shrink-0 uppercase" style={{ color: T.textMuted }}>{month.month}</span>
                                <div className="flex-1 h-10 rounded-xl overflow-hidden relative" style={{ background: T.elevated }}>
                                    <div
                                        className="h-full transition-all duration-700"
                                        style={{ width: `${pct}%`, background: `${T.accent}30`, borderRight: `3px solid ${T.accent}` }}
                                    />
                                    <div className="absolute inset-y-0 left-4 flex items-center gap-3">
                                        <span className="text-xs font-bold" style={{ color: T.text }}>{month.total} demandas</span>
                                        <span className="text-xs font-bold" style={{ color: '#10B981' }}>{month.completed} entregas</span>
                                    </div>
                                </div>
                                <div className="w-24 text-right shrink-0">
                                    <p className="text-xs font-bold" style={{ color: T.text }}>{formatCurrency(month.revenue)}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Bottom row: top clients + by neighborhood */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top clients */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="mb-5">
                        <h3 className="text-base font-bold" style={{ color: T.text }}>Top Contratantes</h3>
                        <p className="text-xs mt-1" style={{ color: T.textMuted }}>Por volume de ordens</p>
                    </div>
                    {data.topClients.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: T.textMuted }}>Sem dados no período</p>
                    ) : (
                        <div className="space-y-3">
                            {data.topClients.map((client, i) => (
                                <div key={client.name} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: T.elevated }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                                        style={{ background: T.surface, color: T.accent, border: `1px solid ${T.border}` }}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate" style={{ color: T.text }}>{client.name}</p>
                                        <p className="text-xs" style={{ color: T.textMuted }}>{client.count} avaliações</p>
                                    </div>
                                    {client.revenue > 0 && (
                                        <p className="text-sm font-bold shrink-0" style={{ color: T.text }}>
                                            {formatCurrency(client.revenue)}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* By bairro */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="mb-5">
                        <h3 className="text-base font-bold" style={{ color: T.text }}>Valorização por Bairro</h3>
                        <p className="text-xs mt-1" style={{ color: T.textMuted }}>Honorário médio por localização</p>
                    </div>
                    {data.avgByNeighborhood.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: T.textMuted }}>Sem dados no período</p>
                    ) : (
                        <div className="space-y-4">
                            {data.avgByNeighborhood.map(item => {
                                const maxVal = Math.max(...data.avgByNeighborhood.map(i => i.avgValue), 1)
                                const pct = (item.avgValue / maxVal) * 100
                                return (
                                    <div key={item.neighborhood} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: T.text }}>{item.neighborhood}</span>
                                            <div className="flex items-center gap-3">
                                                {item.avgValue > 0 && <span className="text-xs font-bold" style={{ color: '#10B981' }}>{formatCurrency(item.avgValue)}</span>}
                                                <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: T.elevated, color: T.textMuted }}>{item.count}</span>
                                            </div>
                                        </div>
                                        <div className="h-3 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#10B981' }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Executive Summary */}
            <div className="rounded-2xl p-8 relative overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <PieChart size={180} />
                </div>
                <h3 className="text-base font-bold mb-6" style={{ color: T.text }}>Executive Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { label: 'Efficiency Score', value: `${completionRate}%`, sub: `${data.completed} Entregas / ${data.total} Demandas`, color: '#34D399' },
                        {
                            label: 'Unit Billing Médio',
                            value: data.completed > 0 ? `R$${(data.totalRevenue / data.completed).toFixed(0)}` : '—',
                            sub: 'Por laudo entregue',
                            color: T.accent
                        },
                        {
                            label: 'Velocidade Mensal',
                            value: (data.total / 6).toFixed(1),
                            sub: 'Avaliações/mês (histórico)',
                            color: '#60A5FA'
                        },
                    ].map(({ label, value, sub, color }) => (
                        <div key={label} className="text-center p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
                            <p className="text-4xl font-black mb-1" style={{ color }}>{value}</p>
                            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
