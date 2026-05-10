'use client'

import { useEffect, useState, useCallback } from 'react'
import { TrendingUp, TrendingDown, Building2, RefreshCw } from 'lucide-react'
import PriceHeatmap from '@/components/intelligence/PriceHeatmap'
import SubsidySimulator from './SubsidySimulator'

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Geo hierarchy ────────────────────────────────────────────────────────────

const GEO = [
    {
        continent: 'América do Sul',
        countries: [
            {
                name: 'Brasil', flag: '🇧🇷', cities: [
                    { name: 'Recife', key: 'Recife', state: 'PE' },
                    { name: 'João Pessoa', key: 'Joao Pessoa', state: 'PB' },
                    { name: 'Natal', key: 'Natal', state: 'RN' },
                    { name: 'Fortaleza', key: 'Fortaleza', state: 'CE' },
                    { name: 'Salvador', key: 'Salvador', state: 'BA' },
                    { name: 'São Paulo', key: 'Sao Paulo', state: 'SP' },
                    { name: 'Balneário Camboriú', key: 'Balneario Camboriu', state: 'SC' },
                ],
            },
        ],
    },
    {
        continent: 'Oriente Médio',
        countries: [
            {
                name: 'Emirados Árabes', flag: '🇦🇪', cities: [
                    { name: 'Dubai', key: 'Dubai', state: '' },
                ],
            },
        ],
    },
]

const ALL_CITIES = GEO.flatMap(g => g.countries.flatMap(c => c.cities))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(v: number | null): string {
    if (v == null) return '--'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function formatPercent(v: number | null): string {
    if (v == null) return '--'
    return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function IntelligenceDashboard({ lang, initialLocation = [] }: { lang: string, initialLocation?: string[] }) {
    const [selectedCity, setSelectedCity] = useState(ALL_CITIES[0].key)
    const [neighborhoods, setNeighborhoods] = useState<NeighborhoodData[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const fetchCity = useCallback(async (city: string) => {
        setLoading(true)
        setExpandedId(null)
        try {
            const res = await fetch(`/api/intelligence/neighborhood?city=${encodeURIComponent(city)}`)
            if (!res.ok) { setNeighborhoods([]); return }
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
            if (res.ok) await fetchCity(selectedCity)
        } catch { /* silent */ } finally {
            setRefreshing(false)
        }
    }, [fetchCity, selectedCity])

    useEffect(() => { fetchCity(selectedCity) }, [selectedCity, fetchCity])

    const validPrices = neighborhoods.filter((n: NeighborhoodData) => n.median_price_sqm != null)
    const cityAvgPrice = validPrices.length > 0
        ? Math.round(validPrices.reduce((s: number, n: NeighborhoodData) => s + Number(n.median_price_sqm), 0) / validPrices.length)
        : null

    const bestYield = neighborhoods
        .filter((n: NeighborhoodData) => n.avg_rental_yield != null)
        .sort((a: NeighborhoodData, b: NeighborhoodData) => Number(b.avg_rental_yield) - Number(a.avg_rental_yield))[0] ?? null

    const fastestSelling = neighborhoods
        .filter((n: NeighborhoodData) => n.avg_days_on_market != null)
        .sort((a: NeighborhoodData, b: NeighborhoodData) => Number(a.avg_days_on_market) - Number(b.avg_days_on_market))[0] ?? null

    const currentGeo = GEO.find(g => g.countries.some(c => c.cities.some(ci => ci.key === selectedCity)))
    const currentCountry = currentGeo?.countries.find(c => c.cities.some(ci => ci.key === selectedCity))
    const currentCityObj = currentCountry?.cities.find(ci => ci.key === selectedCity)

    return (
        <main className="bg-[#060D16] min-h-screen">

            {/* ─── HERO ──────────────────────────────────────────────────── */}
            <section className="relative bg-[#0B1928] text-white pt-20 pb-10 md:pt-28 md:pb-16 overflow-hidden border-b border-white/[0.05]">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.04]"
                    style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #C8A44A 0%, transparent 60%)' }} />
                <div className="absolute inset-0 opacity-[0.025]"
                    style={{ backgroundImage: 'linear-gradient(rgba(200,164,74,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(200,164,74,0.3) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
                <div className="container-custom relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-px bg-[#C8A44A] opacity-60" />
                        <span className="text-[#C8A44A] font-bold uppercase tracking-[0.28em] text-[10px]">Market Intelligence</span>
                    </div>
                    <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight leading-tight text-white">
                        Inteligência<br />
                        <span className="text-[#C8A44A] italic">Imobiliária</span>
                    </h1>
                    <p className="text-[#94A0B2] text-base sm:text-lg font-light leading-relaxed max-w-xl">
                        Decisões orientadas por dados. Explore preços, tendências e indicadores
                        por bairro nas principais cidades do mercado.
                    </p>
                </div>
            </section>

            {/* ─── MOTOR DE DECISÃO ─────────────────────────────────────── */}
            <section className="py-10 md:py-16 border-b border-white/[0.05]">
                <div className="container-custom">
                    {/* Pitch — hidden on mobile, visible md+ */}
                    <div className="hidden md:grid md:grid-cols-2 gap-10 items-start">
                        <div className="md:sticky md:top-24">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-px bg-[#334E68]" />
                                <span className="text-[#C8A44A] font-bold uppercase tracking-[0.25em] text-[10px]">Motor de Decisão</span>
                            </div>
                            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                                Quanto você pode{' '}
                                <span className="text-[#C8A44A] italic">receber de subsídio</span>?
                            </h2>
                            <p className="text-[#94A0B2] text-sm md:text-base font-light leading-relaxed mb-6 max-w-md">
                                Descubra se você tem direito ao MCMV ou Habite Seguro, quanto de desconto
                                no imóvel e como estruturar duas compras com subsídios separados.
                            </p>
                            <div className="space-y-3">
                                {[
                                    { label: 'MCMV Faixa 1', desc: 'Até R$ 55.000 de subsídio', gold: true },
                                    { label: 'Habite Seguro', desc: 'Policiais, bombeiros e guardas', gold: false },
                                    { label: 'Estratégia dupla', desc: 'Dois CPFs, dois subsídios', gold: false },
                                ].map(({ label, desc, gold }) => (
                                    <div key={label} className={`flex items-center gap-3 p-3.5 rounded-xl border ${gold ? 'bg-[rgba(200,164,74,0.06)] border-[rgba(200,164,74,0.18)]' : 'bg-[#0B1928] border-white/[0.05]'}`}>
                                        <div className={`w-1 h-8 rounded-full shrink-0 ${gold ? 'bg-[#C8A44A]' : 'bg-[#1A3250]'}`} />
                                        <div>
                                            <div className="text-sm font-bold text-white">{label}</div>
                                            <div className="text-[11px] text-[#556170]">{desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <SubsidySimulator lang={lang} />
                    </div>
                    {/* Mobile: simulator only, full width */}
                    <div className="md:hidden">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-px bg-[#334E68]" />
                            <span className="text-[#C8A44A] font-bold uppercase tracking-[0.25em] text-[10px]">Motor de Decisão</span>
                        </div>
                        <SubsidySimulator lang={lang} />
                    </div>
                </div>
            </section>

            {/* ─── GEO BREADCRUMB + CITY TABS ───────────────────────────── */}
            <div className="sticky top-0 z-30 bg-[#060D16]/95 backdrop-blur-md border-b border-white/[0.05]">
                {/* Geo breadcrumb */}
                <div className="container-custom pt-2.5 pb-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#556170] font-medium overflow-x-auto scrollbar-hide whitespace-nowrap">
                        <span>Global</span>
                        <span className="opacity-40">/</span>
                        <span>{currentGeo?.continent}</span>
                        <span className="opacity-40">/</span>
                        <span>{currentCountry?.flag} {currentCountry?.name}</span>
                        {currentCityObj?.state && <>
                            <span className="opacity-40">/</span>
                            <span>{currentCityObj.state}</span>
                        </>}
                        <span className="opacity-40">/</span>
                        <span className="text-[#C8A44A]">{currentCityObj?.name}</span>
                    </div>
                </div>
                {/* City tabs */}
                <div className="container-custom py-2">
                    <div className="flex items-center gap-2">
                        <div className="flex overflow-x-auto gap-1 scrollbar-hide -mx-1 px-1 flex-1 min-w-0">
                            {ALL_CITIES.map((city) => (
                                <button
                                    key={city.key}
                                    onClick={() => setSelectedCity(city.key)}
                                    className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-[0.08em] transition-all duration-200 ${
                                        selectedCity === city.key
                                            ? 'bg-[#C8A44A] text-[#060D16] shadow-lg shadow-[#C8A44A]/20'
                                            : 'bg-[#0B1928] text-[#556170] hover:text-white hover:bg-[#142438] border border-white/[0.05]'
                                    }`}
                                >
                                    {city.name}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-[#0B1928] text-[#556170] hover:text-white border border-white/[0.05] transition-colors disabled:opacity-40"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── CITY METRICS BAR ─────────────────────────────────────── */}
            <section className="py-4 md:py-6 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                        <CompactMetric
                            label="Preço médio/m²"
                            value={loading ? null : formatCurrency(cityAvgPrice)}
                            loading={loading}
                        />
                        <CompactMetric
                            label={`Melhor yield${bestYield ? ` · ${bestYield.neighborhood}` : ''}`}
                            value={loading || !bestYield ? null : `${Number(bestYield.avg_rental_yield).toFixed(1)}% a.a.`}
                            loading={loading}
                            highlight
                        />
                        <CompactMetric
                            label={`Venda mais rápida${fastestSelling ? ` · ${fastestSelling.neighborhood}` : ''}`}
                            value={loading || !fastestSelling ? null : `${fastestSelling.avg_days_on_market}d`}
                            loading={loading}
                        />
                    </div>
                </div>
            </section>

            {/* ─── NEIGHBORHOOD CARDS GRID ──────────────────────────────── */}
            <section className="py-8 md:py-12">
                <div className="container-custom">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-6 h-px bg-[#334E68]" />
                        <span className="text-[#C8A44A] font-bold uppercase tracking-[0.22em] text-[10px]">Bairros</span>
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-6">
                        Panorama em{' '}
                        <span className="text-[#C8A44A] italic">{currentCityObj?.name ?? selectedCity}</span>
                    </h2>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <NeighborhoodCardSkeleton key={i} index={i} />
                            ))}
                        </div>
                    ) : neighborhoods.length === 0 ? (
                        <EmptyState city={currentCityObj?.name ?? selectedCity} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <PriceHeatmap neighborhoods={neighborhoods} cityAvgPrice={cityAvgPrice} loading={loading} />
            </div>

            {/* ─── CTA ──────────────────────────────────────────────────── */}
            <section className="bg-[#0B1928] text-white py-16 md:py-24 text-center relative overflow-hidden border-t border-white/[0.05]">
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: 'radial-gradient(circle at center, #C8A44A 0%, transparent 60%)', filter: 'blur(60px)' }} />
                <div className="container-custom relative z-10 max-w-lg mx-auto">
                    <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight">
                        Precisa de uma{' '}
                        <span className="text-[#C8A44A] italic">Análise Personalizada</span>?
                    </h2>
                    <p className="text-[#94A0B2] text-sm sm:text-base mb-8 font-light leading-relaxed">
                        Dossiê de bairro, estudo de viabilidade ou laudo técnico com metodologia ABNT.
                    </p>
                    <a
                        href="https://wa.me/5581997230455"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-[#C8A44A] text-[#060D16] font-bold text-xs uppercase tracking-[0.14em] hover:bg-[#D4B86A] transition-colors shadow-lg shadow-[#C8A44A]/20"
                    >
                        Solicitar Estudo de Mercado
                    </a>
                </div>
            </section>

            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </main>
    )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CompactMetric({ label, value, loading, highlight }: {
    label: string; value: string | null; loading: boolean; highlight?: boolean
}) {
    return (
        <div className={`p-3 md:p-4 rounded-xl border ${highlight ? 'bg-[rgba(200,164,74,0.06)] border-[rgba(200,164,74,0.15)]' : 'bg-[#0B1928] border-white/[0.05]'}`}>
            <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] text-[#556170] mb-1.5 leading-tight">{label}</div>
            {loading ? (
                <div className="h-5 w-3/4 rounded bg-white/[0.05] animate-pulse" />
            ) : (
                <div className={`text-sm md:text-base font-bold leading-none tracking-tight ${highlight ? 'text-[#C8A44A]' : 'text-white'}`}>
                    {value ?? '--'}
                </div>
            )}
        </div>
    )
}

function NeighborhoodCard({ data, cityAvgPrice, index, expanded, onToggle }: {
    data: NeighborhoodData; cityAvgPrice: number | null
    index: number; expanded: boolean; onToggle: () => void
}) {
    const price = data.median_price_sqm != null ? Number(data.median_price_sqm) : null
    const trend = data.price_trend_12m != null ? Number(data.price_trend_12m) : null
    const isUp = trend != null && trend > 0
    const trendColor = trend == null ? '#556170' : isUp ? '#4ADE80' : '#F87171'

    return (
        <div
            onClick={onToggle}
            className="group rounded-xl bg-[#0B1928] border border-white/[0.05] hover:border-[rgba(200,164,74,0.25)] transition-all duration-300 cursor-pointer overflow-hidden"
            style={{ animationDelay: `${index * 40}ms`, animation: 'fadeSlideUp 0.4s ease forwards', opacity: 0 }}
        >
            <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white group-hover:text-[#C8A44A] transition-colors leading-tight truncate">
                            {data.neighborhood}
                        </h3>
                        <span className="text-[10px] text-[#556170]">{data.city}{data.state ? `, ${data.state}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2" style={{ color: trendColor }}>
                        {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : trend != null ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                        <span className="text-xs font-bold">{formatPercent(trend)}</span>
                    </div>
                </div>

                <div className="mb-3">
                    <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#556170] mb-0.5">Preço/m²</div>
                    <div className="text-xl font-bold text-white tracking-tight">{formatCurrency(price)}</div>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                    {[
                        { label: 'Caminhab.', value: data.walkability_score != null ? `${data.walkability_score}` : '--' },
                        { label: 'Segurança', value: data.safety_score != null ? `${data.safety_score}` : '--' },
                        { label: 'Yield', value: data.avg_rental_yield != null ? `${Number(data.avg_rental_yield).toFixed(1)}%` : '--' },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-[#060D16] rounded-lg p-2 text-center">
                            <div className="text-xs font-bold text-white">{value}</div>
                            <div className="text-[8px] text-[#556170] mt-0.5">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: expanded ? 280 : 0, opacity: expanded ? 1 : 0 }}>
                <div className="px-4 pb-4 pt-2 border-t border-white/[0.05]">
                    <div className="grid grid-cols-2 gap-2.5">
                        {[
                            { label: 'Estoque', value: data.inventory_count != null ? `${data.inventory_count} imóveis` : '--' },
                            { label: 'Tempo venda', value: data.avg_days_on_market != null ? `${data.avg_days_on_market} dias` : '--' },
                            { label: 'Absorção/mês', value: data.absorption_rate != null ? `${Number(data.absorption_rate).toFixed(1)}%` : '--' },
                            { label: 'Vacância', value: data.vacancy_rate != null ? `${Number(data.vacancy_rate).toFixed(1)}%` : '--' },
                            { label: 'Aluguel/m²', value: data.avg_monthly_rent_sqm != null ? formatCurrency(Number(data.avg_monthly_rent_sqm)) : '--' },
                            { label: 'Lançamentos 12m', value: data.new_launches_12m != null ? `${data.new_launches_12m}` : '--' },
                            { label: 'Valorização 5a', value: data.valorization_5y != null ? formatPercent(Number(data.valorization_5y)) : '--' },
                            { label: 'Transporte', value: data.transit_score != null ? `${data.transit_score}/100` : '--' },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <div className="text-[9px] text-[#556170] uppercase tracking-wider">{label}</div>
                                <div className="text-xs font-semibold text-white">{value}</div>
                            </div>
                        ))}
                    </div>
                    {cityAvgPrice != null && price != null && (
                        <div className="mt-3 pt-3 border-t border-white/[0.05] text-[10px] text-[#556170]">
                            {price > cityAvgPrice
                                ? `${((price / cityAvgPrice - 1) * 100).toFixed(0)}% acima da média da cidade`
                                : `${((1 - price / cityAvgPrice) * 100).toFixed(0)}% abaixo da média da cidade`}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function NeighborhoodCardSkeleton({ index }: { index: number }) {
    return (
        <div className="rounded-xl bg-[#0B1928] border border-white/[0.05] p-4 animate-pulse" style={{ animationDelay: `${index * 80}ms` }}>
            <div className="h-4 w-2/3 bg-white/[0.05] rounded mb-2" />
            <div className="h-3 w-1/3 bg-white/[0.05] rounded mb-4" />
            <div className="h-6 w-1/2 bg-white/[0.05] rounded mb-3" />
            <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-[#060D16] rounded-lg" />)}
            </div>
        </div>
    )
}

function EmptyState({ city }: { city: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="w-10 h-10 text-[#1A3250] mb-4" />
            <h3 className="text-base font-bold text-white mb-2">Dados em construção para {city}</h3>
            <p className="text-[#556170] text-sm max-w-sm font-light">
                Estamos coletando e validando os dados de inteligência para esta cidade.
            </p>
        </div>
    )
}
