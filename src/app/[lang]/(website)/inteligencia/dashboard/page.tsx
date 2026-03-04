import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, BarChart3, Clock } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Dashboard de Mercado | Inteligência IMI',
    description: 'Indicadores imobiliários em tempo real — valorização, liquidez, custo médio m² e tendências macroeconômicas para João Pessoa e região.',
}

type Indicator = {
    id: string
    metric_name: string
    value: string
    unit: string | null
    category: string | null
    description: string | null
    trend: 'up' | 'down' | 'stable'
    sort_order: number
    updated_at: string
}

async function getIndicators(): Promise<Indicator[]> {
    try {
        const supabase = await createClient()
        const { data } = await supabase
            .from('market_indicators')
            .select('*')
            .order('sort_order', { ascending: true })
        return (data as Indicator[]) ?? []
    } catch {
        return []
    }
}

const FALLBACK: Indicator[] = [
    { id: '1', metric_name: 'Valorização (12m)', value: '+15,2%', unit: null, category: 'performance', description: 'Segmento alto padrão — orla e Altiplano', trend: 'up', sort_order: 1, updated_at: new Date().toISOString() },
    { id: '2', metric_name: 'Liquidez Média', value: '60 dias', unit: null, category: 'liquidez', description: 'Ativos de R$ 800k–3M', trend: 'stable', sort_order: 2, updated_at: new Date().toISOString() },
    { id: '3', metric_name: 'Custo Médio m²', value: 'R$ 9.850', unit: 'R$/m²', category: 'preco', description: 'Bairros de orla — João Pessoa', trend: 'up', sort_order: 3, updated_at: new Date().toISOString() },
    { id: '4', metric_name: 'Lançamentos (trim.)', value: '23', unit: 'empreendimentos', category: 'oferta', description: 'João Pessoa e litoral sul', trend: 'up', sort_order: 4, updated_at: new Date().toISOString() },
    { id: '5', metric_name: 'Taxa de Absorção', value: '78%', unit: null, category: 'performance', description: 'Velocidade de vendas — lançamentos 2024', trend: 'up', sort_order: 5, updated_at: new Date().toISOString() },
    { id: '6', metric_name: 'Variação IGPM (12m)', value: '+4,8%', unit: null, category: 'macro', description: 'Referência de reajuste contratual', trend: 'stable', sort_order: 6, updated_at: new Date().toISOString() },
]

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-400" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-amber-400" />
}

function trendColor(trend: 'up' | 'down' | 'stable') {
    if (trend === 'up') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    if (trend === 'down') return 'text-red-400 bg-red-400/10 border-red-400/20'
    return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
}

function trendLabel(trend: 'up' | 'down' | 'stable') {
    if (trend === 'up') return 'Alta'
    if (trend === 'down') return 'Queda'
    return 'Estável'
}

function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    } catch {
        return '—'
    }
}

export default async function DashboardPage() {
    const rawIndicators = await getIndicators()
    const indicators = rawIndicators.length > 0 ? rawIndicators : FALLBACK
    const lastUpdated = indicators[0]?.updated_at ? formatDate(indicators[0].updated_at) : '—'

    return (
        <main className="bg-[#0D0F14] min-h-screen">
            {/* HERO */}
            <section className="relative bg-[#0D1117] text-white pt-24 pb-16 md:pt-32 md:pb-20 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-px bg-[#334E68]" />
                                <span className="text-[#486581] font-bold uppercase tracking-[0.25em] text-[11px]">Inteligência · Dashboard</span>
                            </div>
                            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                                Indicadores de <span className="text-[#486581] italic">Mercado</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 text-[#9CA3AF] text-sm border border-white/[0.08] rounded-xl px-4 py-2.5 bg-[#141420]">
                            <Clock className="w-4 h-4 text-[#486581]" />
                            <span>Atualizado em <strong className="text-white font-semibold">{lastUpdated}</strong></span>
                        </div>
                    </div>
                </div>
            </section>

            {/* KPI GRID */}
            <section className="py-12 md:py-16">
                <div className="container-custom">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {indicators.map((ind) => (
                            <div
                                key={ind.id}
                                className="p-6 sm:p-8 rounded-2xl bg-[#141420] border border-white/[0.05] hover:border-[#334E68]/30 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-5">
                                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.15em]">
                                        {ind.category ?? 'Indicador'}
                                    </span>
                                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full border ${trendColor(ind.trend)}`}>
                                        <TrendIcon trend={ind.trend} />
                                        {trendLabel(ind.trend)}
                                    </span>
                                </div>
                                <p className="text-[#9CA3AF] text-xs font-medium mb-2">{ind.metric_name}</p>
                                <div className="font-display text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                                    {ind.value}
                                </div>
                                {ind.unit && (
                                    <span className="text-[#486581] text-xs font-medium">{ind.unit}</span>
                                )}
                                {ind.description && (
                                    <p className="text-[#9CA3AF] text-xs mt-3 leading-relaxed font-light border-t border-white/[0.05] pt-3">
                                        {ind.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CHART PLACEHOLDER */}
            <section className="pb-16 md:pb-24">
                <div className="container-custom">
                    <div className="rounded-3xl bg-[#141420] border border-white/[0.05] p-8 sm:p-12">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-[#1A1E2A] text-[#486581] rounded-xl flex items-center justify-center border border-white/[0.05]">
                                <BarChart3 className="w-5 h-5" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="font-display text-xl font-bold text-white">Tendência de Preço (R$/m²)</h2>
                                <p className="text-[#9CA3AF] text-sm font-light">Segmento alto padrão — orla de João Pessoa</p>
                            </div>
                        </div>
                        <div className="h-56 flex items-center justify-center border border-dashed border-white/[0.08] rounded-2xl">
                            <div className="text-center">
                                <BarChart3 className="w-10 h-10 text-white/10 mx-auto mb-3" strokeWidth={1} />
                                <p className="text-[#9CA3AF] text-sm font-light">Gráfico interativo disponível em breve</p>
                                <p className="text-white/20 text-xs mt-1">Integração com dados históricos Supabase</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* LINK PARA INDICES */}
            <section className="bg-[#141420] py-16 border-t border-white/[0.05]">
                <div className="container-custom">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 sm:p-10 rounded-3xl bg-[#0D1117] border border-white/[0.05]">
                        <div>
                            <p className="text-[#486581] text-xs font-bold uppercase tracking-[0.2em] mb-2">Próxima Seção</p>
                            <h3 className="font-display text-2xl font-bold text-white">Índices IMI</h3>
                            <p className="text-[#9CA3AF] text-sm font-light mt-1">Metodologia proprietária de precificação</p>
                        </div>
                        <a
                            href="../inteligencia/indices"
                            className="flex items-center gap-2 text-[#486581] font-semibold text-sm hover:text-white transition-colors"
                        >
                            Ver Índices <ArrowUpRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </section>
        </main>
    )
}
