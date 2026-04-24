'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Shield, Footprints, DollarSign, Timer, Building2, ArrowUpRight, RefreshCw } from 'lucide-react'
import PriceHeatmap from '@/components/intelligence/PriceHeatmap'
import SubsidySimulator from './SubsidySimulator'

// ─── Types ──────────────────────────────────────────────────────────────────

interface NeighborhoodData {
    id: string
    neighborhood: string
    city: string
    state: string
    median_price_sqm: number | null
    avg_price_sqm: number | null
    price_trend_12m: number | null
    price_trend_3m: number | null
    inventory_count: number | null
    avg_days_on_market: number | null
    absorption_rate: number | null
    walkability_score: number | null
    transit_score: number | null
    safety_score: number | null
    avg_rental_yield: number | null
    avg_monthly_rent_sqm: number | null
    vacancy_rate: number | null
    new_launches_12m: number | null
    valorization_5y: number | null
    data_source: string | null
    updated_at: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CITIES = [
    { name: 'Recife', key: 'Recife' },
    { name: 'Joao Pessoa', key: 'Joao Pessoa' },
    { name: 'Natal', key: 'Natal' },
    { name: 'Sao Paulo', key: 'Sao Paulo' },
    { name: 'Balneario Camboriu', key: 'Balneario Camboriu' },
    { name: 'Dubai', key: 'Dubai' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(v: number | null): string {
    if (v == null) return '--'
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
    }).format(v)
}

function formatPercent(v: number | null): string {
    if (v == null) return '--'
    return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function IntelligenceDashboard({ lang }: { lang: string }) {
    const [selectedCity, setSelectedCity] = useState(CITIES[0].key)
    const [neighborhoods, setNeighborhoods] = useState<NeighborhoodData[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const fetchCity = useCallback(async (city: string) => {
        setLoading(true)
        setExpandedId(null)
        try {
            const res = await fetch(`/api/intelligence/neighborhood?city=${encodeURIComponent(city)}`)
            if (!res.ok) {
                setNeighborhoods([])
                return
            }
            const json = await res.json()
            setNeighborhoods(json.neighborhoods || [])
        } catch {
            setNeighborhoods([])
        } finally {
            setLoading(false)
        }
    }, [])

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        try {
            const res = await fetch('/api/intelligence/refresh', { method: 'POST' })
            if (res.ok) {
                // Re-fetch current city data after refresh
                await fetchCity(selectedCity)
            }
        } catch {
            // Silently fail — data stays as-is
        } finally {
            setRefreshing(false)
        }
    }, [fetchCity, selectedCity])

    useEffect(() => {
        fetchCity(selectedCity)
    }, [selectedCity, fetchCity])

    // ─── Computed metrics ───────────────────────────────────────────────

    const validPrices = neighborhoods.filter(n => n.median_price_sqm != null)
    const cityAvgPrice = validPrices.length > 0
        ? Math.round(validPrices.reduce((s, n) => s + Number(n.median_price_sqm), 0) / validPrices.length)
        : null

    const bestYield = neighborhoods
        .filter(n => n.avg_rental_yield != null)
        .sort((a, b) => Number(b.avg_rental_yield) - Number(a.avg_rental_yield))[0] ?? null

    const fastestSelling = neighborhoods
        .filter(n => n.avg_days_on_market != null)
        .sort((a, b) => Number(a.avg_days_on_market) - Number(b.avg_days_on_market))[0] ?? null

    return (
        <main className="bg-[#0D0F14] min-h-screen">
            {/* ─── HERO ─────────────────────────────────────────────────── */}
            <section className="relative bg-[#0D1117] text-white pt-24 pb-16 md:pt-32 md:pb-20 overflow-hidden border-b border-white/[0.05]">
                <div
                    className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #334E68 0%, transparent 60%)' }}
                />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(72,101,129,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(72,101,129,0.4) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />
                <div className="container-custom relative z-10">
                    <div className="max-w-4xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-px bg-[#334E68]" />
                            <span className="text-[#C8A44A] font-bold uppercase tracking-[0.25em] text-[11px]">
                                Market Intelligence
                            </span>
                        </div>
                        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight text-white">
                            Inteligencia <br />
                            <span className="text-[#C8A44A] italic">Imobiliaria</span>
                        </h1>
                        <p className="text-[#9CA3AF] text-lg sm:text-xl font-light leading-relaxed max-w-2xl">
                            Decisoes orientadas por dados. Explore precos, tendencias e indicadores de qualidade de vida
                            por bairro nas principais cidades do mercado.
                        </p>
                    </div>
                </div>
            </section>

            {/* ─── SUBSIDY SIMULATOR ────────────────────────────────────── */}
            <section className="py-12 md:py-16 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                        {/* Left: pitch */}
                        <div className="lg:sticky lg:top-24">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-px bg-[#334E68]" />
                                <span className="text-[#C8A44A] font-bold uppercase tracking-[0.25em] text-[11px]">
                                    Motor de Decisão
                                </span>
                            </div>
                            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
                                Quanto você pode{' '}
                                <span className="text-[#C8A44A] italic">receber de subsídio</span>?
                            </h2>
                            <p className="text-[#9CA3AF] text-base font-light leading-relaxed mb-8 max-w-md">
                                Descubra em minutos se você tem direito ao MCMV ou Habite Seguro, quanto
                                de desconto no imóvel e como estruturar duas compras com subsídios separados.
                            </p>
                            <div className="space-y-4">
                                {[
                                    { label: 'MCMV Faixa 1', desc: 'Até R$ 55.000 de subsídio', highlight: true },
                                    { label: 'Habite Seguro', desc: 'Para policiais, bombeiros e guardas', highlight: false },
                                    { label: 'Estratégia dupla', desc: 'Dois CPFs, dois subsídios', highlight: false },
                                ].map(({ label, desc, highlight }) => (
                                    <div key={label} className={`flex items-center gap-3 p-4 rounded-xl border ${highlight ? 'bg-[rgba(200,164,74,0.06)] border-[rgba(200,164,74,0.18)]' : 'bg-[#0B1928] border-white/[0.05]'}`}>
                                        <div className={`w-1.5 h-10 rounded-full shrink-0 ${highlight ? 'bg-[#C8A44A]' : 'bg-[#1A3250]'}`} />
                                        <div>
                                            <div className="text-sm font-bold text-white">{label}</div>
                                            <div className="text-[11px] text-[#9CA3AF]">{desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Right: simulator */}
                        <SubsidySimulator lang={lang} />
                    </div>
                </div>
            </section>

            {/* ─── CITY SELECTOR TABS ───────────────────────────────────── */}
            <section className="sticky top-0 z-30 bg-[#0D0F14]/95 backdrop-blur-md border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="flex items-center gap-2 py-3">
                        <div className="flex overflow-x-auto gap-1 scrollbar-hide -mx-1 px-1 flex-1 min-w-0">
                            {CITIES.map((city) => (
                                <button
                                    key={city.key}
                                    onClick={() => setSelectedCity(city.key)}
                                    className={`
                                        shrink-0 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200
                                        ${selectedCity === city.key
                                            ? 'bg-[#C8A44A] text-[#0B1928] shadow-lg shadow-[#C8A44A]/20'
                                            : 'bg-[#0B1928] text-[#9CA3AF] hover:text-white hover:bg-[#142438] border border-white/[0.05]'
                                        }
                                    `}
                                >
                                    {city.name}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            title="Atualizar dados"
                            className="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0B1928] text-[#9CA3AF] hover:text-white hover:bg-[#142438] border border-white/[0.05] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Atualizar dados</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* ─── TOP METRICS BAR ──────────────────────────────────────── */}
            <section className="py-6 md:py-8 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <MetricCard
                            icon={<DollarSign className="w-5 h-5" />}
                            label="Preco Medio da Cidade"
                            value={loading ? '--' : formatCurrency(cityAvgPrice)}
                            sublabel="R$/m2 mediana"
                            loading={loading}
                        />
                        <MetricCard
                            icon={<TrendingUp className="w-5 h-5" />}
                            label="Melhor Yield"
                            value={loading || !bestYield ? '--' : `${Number(bestYield.avg_rental_yield).toFixed(1)}% a.a.`}
                            sublabel={bestYield?.neighborhood ?? ''}
                            loading={loading}
                        />
                        <MetricCard
                            icon={<Timer className="w-5 h-5" />}
                            label="Venda Mais Rapida"
                            value={loading || !fastestSelling ? '--' : `${fastestSelling.avg_days_on_market} dias`}
                            sublabel={fastestSelling?.neighborhood ?? ''}
                            loading={loading}
                        />
                    </div>
                </div>
            </section>

            {/* ─── NEIGHBORHOOD CARDS GRID ───────────────────────────────── */}
            <section className="py-12 md:py-16">
                <div className="container-custom">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-px bg-[#334E68]" />
                        <span className="text-[#C8A44A] font-bold uppercase tracking-[0.25em] text-[11px]">
                            Bairros
                        </span>
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-8">
                        Panorama por Bairro em{' '}
                        <span className="text-[#C8A44A] italic">{selectedCity}</span>
                    </h2>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <NeighborhoodCardSkeleton key={i} index={i} />
                            ))}
                        </div>
                    ) : neighborhoods.length === 0 ? (
                        <EmptyState city={selectedCity} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {neighborhoods.map((n, i) => (
                                <NeighborhoodCard
                                    key={n.id}
                                    data={n}
                                    cityAvgPrice={cityAvgPrice}
                                    index={i}
                                    expanded={expandedId === n.id}
                                    onToggle={() => setExpandedId(expandedId === n.id ? null : n.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ─── PRICE HEATMAP ────────────────────────────────────────── */}
            <div className="border-t border-white/[0.05]">
                <PriceHeatmap
                    neighborhoods={neighborhoods}
                    cityAvgPrice={cityAvgPrice}
                    loading={loading}
                />
            </div>

            {/* ─── CTA ──────────────────────────────────────────────────── */}
            <section className="bg-[#0B1928] text-white py-20 md:py-28 text-center relative overflow-hidden border-t border-white/[0.05]">
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{ backgroundImage: 'radial-gradient(circle at center, #334E68 0%, transparent 60%)', filter: 'blur(80px)' }}
                />
                <div className="container-custom relative z-10">
                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
                        Precisa de uma <span className="text-[#C8A44A] italic">Analise Personalizada</span>?
                    </h2>
                    <p className="text-[#9CA3AF] text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed">
                        Dossie de bairro, estudo de viabilidade ou laudo tecnico — nossa equipe entrega com
                        metodologia ABNT e dados exclusivos.
                    </p>
                    <a
                        href="https://wa.me/5581997230455"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 h-14 px-8 md:px-10 rounded-xl bg-[#102A43] text-white font-bold text-sm uppercase tracking-wider hover:bg-[#1A3F5C] transition-all shadow-[0_4px_14px_rgba(16,42,67,0.4)]"
                    >
                        Solicitar Estudo de Mercado
                    </a>
                </div>
            </section>
        </main>
    )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function MetricCard({
    icon,
    label,
    value,
    sublabel,
    loading,
}: {
    icon: React.ReactNode
    label: string
    value: string
    sublabel: string
    loading: boolean
}) {
    return (
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#0B1928] border border-white/[0.05]">
            <div className="w-11 h-11 rounded-xl bg-[#1A1E2A] text-[#C8A44A] flex items-center justify-center border border-white/[0.05] shrink-0">
                {icon}
            </div>
            <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-1">
                    {label}
                </div>
                {loading ? (
                    <div className="h-6 w-28 rounded bg-white/[0.05] animate-pulse" />
                ) : (
                    <>
                        <div className="text-lg sm:text-xl font-bold text-white leading-none tracking-tight truncate">
                            {value}
                        </div>
                        {sublabel && (
                            <div className="text-[11px] text-[#C8A44A] mt-0.5 truncate max-w-[160px] sm:max-w-none">{sublabel}</div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

function NeighborhoodCard({
    data,
    cityAvgPrice,
    index,
    expanded,
    onToggle,
}: {
    data: NeighborhoodData
    cityAvgPrice: number | null
    index: number
    expanded: boolean
    onToggle: () => void
}) {
    const price = data.median_price_sqm != null ? Number(data.median_price_sqm) : null
    const trend = data.price_trend_12m != null ? Number(data.price_trend_12m) : null
    const isUp = trend != null && trend > 0
    const trendColor = trend == null ? '#9CA3AF' : isUp ? '#10B981' : '#EF4444'

    return (
        <div
            onClick={onToggle}
            className="group rounded-2xl bg-[#0B1928] border border-white/[0.05] hover:border-[#334E68]/40 transition-all duration-300 cursor-pointer overflow-hidden"
            style={{
                animationDelay: `${index * 50}ms`,
                animation: 'fadeSlideUp 0.5s ease forwards',
                opacity: 0,
            }}
        >
            {/* Card Header */}
            <div className="p-5 pb-4">
                <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#C8A44A] transition-colors leading-tight truncate">
                            {data.neighborhood}
                        </h3>
                        <span className="text-[11px] text-[#9CA3AF]">{data.city}, {data.state}</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#C8A44A] transition-colors shrink-0 mt-1" />
                </div>

                {/* Price + Trend */}
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF] mb-1">
                            Preco/m2
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                            {formatCurrency(price)}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-[#9CA3AF] mb-1">12 meses</div>
                        <div className="flex items-center gap-1" style={{ color: trendColor }}>
                            {isUp ? (
                                <TrendingUp className="w-4 h-4" />
                            ) : trend != null ? (
                                <TrendingDown className="w-4 h-4" />
                            ) : null}
                            <span className="text-sm font-bold">{formatPercent(trend)}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-3 gap-2">
                    <QuickStat
                        icon={<Footprints className="w-3 h-3" />}
                        label="Caminhab."
                        value={data.walkability_score != null ? `${data.walkability_score}` : '--'}
                    />
                    <QuickStat
                        icon={<Shield className="w-3 h-3" />}
                        label="Seguranca"
                        value={data.safety_score != null ? `${data.safety_score}` : '--'}
                    />
                    <QuickStat
                        icon={<BarChart3 className="w-3 h-3" />}
                        label="Yield"
                        value={data.avg_rental_yield != null ? `${Number(data.avg_rental_yield).toFixed(1)}%` : '--'}
                    />
                </div>
            </div>

            {/* Expanded Details */}
            <div
                className="overflow-hidden transition-all duration-300"
                style={{
                    maxHeight: expanded ? 300 : 0,
                    opacity: expanded ? 1 : 0,
                }}
            >
                <div className="px-5 pb-5 pt-2 border-t border-white/[0.05]">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <DetailRow label="Estoque" value={data.inventory_count != null ? `${data.inventory_count} imoveis` : '--'} />
                        <DetailRow label="Tempo de Venda" value={data.avg_days_on_market != null ? `${data.avg_days_on_market} dias` : '--'} />
                        <DetailRow label="Absorcao/Mes" value={data.absorption_rate != null ? `${Number(data.absorption_rate).toFixed(1)}%` : '--'} />
                        <DetailRow label="Vacancia" value={data.vacancy_rate != null ? `${Number(data.vacancy_rate).toFixed(1)}%` : '--'} />
                        <DetailRow label="Aluguel/m2" value={data.avg_monthly_rent_sqm != null ? formatCurrency(Number(data.avg_monthly_rent_sqm)) : '--'} />
                        <DetailRow label="Lancamentos 12m" value={data.new_launches_12m != null ? `${data.new_launches_12m}` : '--'} />
                        <DetailRow label="Valorizacao 5a" value={data.valorization_5y != null ? formatPercent(Number(data.valorization_5y)) : '--'} />
                        <DetailRow label="Transporte" value={data.transit_score != null ? `${data.transit_score}/100` : '--'} />
                    </div>
                    {cityAvgPrice != null && price != null && (
                        <div className="mt-3 pt-3 border-t border-white/[0.05] text-[11px] text-[#9CA3AF]">
                            {price > cityAvgPrice
                                ? `${((price / cityAvgPrice - 1) * 100).toFixed(0)}% acima da media da cidade`
                                : `${((1 - price / cityAvgPrice) * 100).toFixed(0)}% abaixo da media da cidade`}
                        </div>
                    )}
                </div>
            </div>

            {/* Keyframes (injected once) */}
            {index === 0 && (
                <style>{`
                    @keyframes fadeSlideUp {
                        from { opacity: 0; transform: translateY(16px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            )}
        </div>
    )
}

function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="bg-[#0D1117] rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[#C8A44A] mb-1">
                {icon}
            </div>
            <div className="text-xs font-bold text-white">{value}</div>
            <div className="text-[9px] text-[#9CA3AF] mt-0.5">{label}</div>
        </div>
    )
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">{label}</div>
            <div className="text-sm font-semibold text-white">{value}</div>
        </div>
    )
}

function NeighborhoodCardSkeleton({ index }: { index: number }) {
    return (
        <div
            className="rounded-2xl bg-[#0B1928] border border-white/[0.05] p-5 animate-pulse"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="h-5 w-2/3 bg-white/[0.05] rounded mb-3" />
            <div className="h-3 w-1/3 bg-white/[0.05] rounded mb-6" />
            <div className="h-8 w-1/2 bg-white/[0.05] rounded mb-4" />
            <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 bg-[#0D1117] rounded-lg" />
                ))}
            </div>
        </div>
    )
}

function EmptyState({ city }: { city: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="w-12 h-12 text-[#334E68] mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
                Dados em construcao para {city}
            </h3>
            <p className="text-[#9CA3AF] text-sm max-w-md font-light">
                Estamos coletando e validando os dados de inteligencia para esta cidade.
                Em breve voce tera acesso ao panorama completo.
            </p>
        </div>
    )
}
