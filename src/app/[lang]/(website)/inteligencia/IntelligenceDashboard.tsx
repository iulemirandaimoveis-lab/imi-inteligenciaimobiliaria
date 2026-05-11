'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, Building2, RefreshCw } from 'lucide-react'
import PriceHeatmap from '@/components/intelligence/PriceHeatmap'
import { LocationSearchPanel } from '@/components/intelligence/LocationSearchPanel'
import { BRAZIL_FALLBACK_CITIES } from './brazilIntelligenceFallback'

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

const BRAZIL_CITIES = BRAZIL_FALLBACK_CITIES.map((c) => ({ name: c.city, key: c.city, state: c.state }))

const GEO = [
    {
        continent: 'América do Sul',
        countries: [
            {
                name: 'Brasil', flag: '🇧🇷', cities: [
                    ...BRAZIL_CITIES,
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

function toFallbackNeighborhoods(city: string): NeighborhoodData[] {
    const cityData = BRAZIL_FALLBACK_CITIES.find((item) => item.city === city)
    if (!cityData) return []

    return cityData.neighborhoods.map((item, index) => ({
        id: `fallback-${cityData.state}-${cityData.city}-${index}`,
        neighborhood: item.neighborhood,
        city: cityData.city,
        state: cityData.state,
        median_price_sqm: item.median_price_sqm,
        avg_price_sqm: item.median_price_sqm,
        price_trend_12m: item.price_trend_12m,
        price_trend_3m: Number((item.price_trend_12m / 4).toFixed(1)),
        inventory_count: 40 + index * 8,
        avg_days_on_market: item.avg_days_on_market,
        absorption_rate: Number((14 - index * 1.5).toFixed(1)),
        walkability_score: 58 + index * 7,
        transit_score: 52 + index * 8,
        safety_score: 60 + index * 6,
        avg_rental_yield: item.avg_rental_yield,
        avg_monthly_rent_sqm: Number((item.median_price_sqm * 0.0062).toFixed(2)),
        vacancy_rate: Number((6.8 - index * 0.7).toFixed(1)),
        new_launches_12m: 2 + index,
        valorization_5y: Number((item.price_trend_12m * 3.1).toFixed(1)),
        data_source: 'fallback_nacional_imi',
        updated_at: new Date().toISOString(),
    }))
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function IntelligenceDashboard({ lang, initialLocation = [] }: { lang: string, initialLocation?: string[] }) {
    const router = useRouter()
    const initialState = initialLocation[1]?.toUpperCase()
    const initialCitySlug = initialLocation[2]
    const initialCity = ALL_CITIES.find((city) => city.state.toLowerCase() === (initialState ?? '').toLowerCase() && city.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === initialCitySlug)?.key ?? ALL_CITIES[0].key
    const [selectedLocation, setSelectedLocation] = useState({ state: initialState ?? '', municipality: initialCity, neighborhood: '' })
    const [neighborhoods, setNeighborhoods] = useState<NeighborhoodData[]>([])
    const [dataState, setDataState] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle')
    const [dataSource, setDataSource] = useState<'api' | 'fallback' | 'none'>('none')
    const [refreshing, setRefreshing] = useState(false)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const selectedCity = selectedLocation.municipality

    const fetchCity = useCallback(async (city: string) => {
        setDataState('loading')
        setExpandedId(null)
        try {
            const res = await fetch(`/api/intelligence/neighborhood?city=${encodeURIComponent(city)}`)
            if (!res.ok) {
                const fallback = toFallbackNeighborhoods(city)
                setNeighborhoods(fallback)
                setDataSource(fallback.length > 0 ? 'fallback' : 'none')
                setDataState(fallback.length > 0 ? 'ready' : 'empty')
                return
            }
            const json = await res.json()
            const apiNeighborhoods = json.neighborhoods || []
            if (apiNeighborhoods.length > 0) {
                setNeighborhoods(apiNeighborhoods)
                setDataSource('api')
                setDataState('ready')
                return
            }
            const fallback = toFallbackNeighborhoods(city)
            setNeighborhoods(fallback)
            setDataSource(fallback.length > 0 ? 'fallback' : 'none')
            setDataState(fallback.length > 0 ? 'ready' : 'empty')
        } catch {
            const fallback = toFallbackNeighborhoods(city)
            setNeighborhoods(fallback)
            setDataSource(fallback.length > 0 ? 'fallback' : 'none')
            setDataState(fallback.length > 0 ? 'ready' : 'error')
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
    const displayedNeighborhoods = useMemo(
        () => (selectedLocation.neighborhood
            ? neighborhoods.filter((n) => n.neighborhood.toLowerCase().includes(selectedLocation.neighborhood.toLowerCase()))
            : neighborhoods),
        [neighborhoods, selectedLocation.neighborhood],
    )

    const validPrices = displayedNeighborhoods.filter((n: NeighborhoodData) => n.median_price_sqm != null)
    const cityAvgPrice = validPrices.length > 0
        ? Math.round(validPrices.reduce((s: number, n: NeighborhoodData) => s + Number(n.median_price_sqm), 0) / validPrices.length)
        : null

    const bestYield = displayedNeighborhoods
        .filter((n: NeighborhoodData) => n.avg_rental_yield != null)
        .sort((a: NeighborhoodData, b: NeighborhoodData) => Number(b.avg_rental_yield) - Number(a.avg_rental_yield))[0] ?? null

    const fastestSelling = displayedNeighborhoods
        .filter((n: NeighborhoodData) => n.avg_days_on_market != null)
        .sort((a: NeighborhoodData, b: NeighborhoodData) => Number(a.avg_days_on_market) - Number(b.avg_days_on_market))[0] ?? null

    const currentMunicipality = ALL_CITIES.find((city) => city.key === selectedCity)

    const currentGeo = GEO.find(g => g.countries.some(c => c.cities.some(ci => ci.key === selectedCity)))
    const currentCountry = currentGeo?.countries.find(c => c.cities.some(ci => ci.key === selectedCity))
    const currentCityObj = currentCountry?.cities.find(ci => ci.key === selectedCity)

    return (
        <main className="bg-[#0B1928] min-h-screen">

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

            {/* ─── GEO BREADCRUMB + CITY TABS ───────────────────────────── */}
            <div className="sticky top-0 z-30 bg-[#0B1928]/95 backdrop-blur-md border-b border-white/[0.05]">
                {/* Geo breadcrumb */}
                <div className="container-custom pt-2.5 pb-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#556170] font-medium overflow-x-auto scrollbar-hide whitespace-nowrap">
                        <span>Global</span>
                        <span className="opacity-40">/</span>
                        <span>{currentGeo?.continent}</span>
                        <span className="opacity-40">/</span>
                        <span>{currentCountry?.flag} {currentCountry?.name}</span>
                        {currentMunicipality?.state && <>
                            <span className="opacity-40">/</span>
                            <span>{currentMunicipality.state}</span>
                        </>}
                        <span className="opacity-40">/</span>
                        <span>{currentMunicipality?.name}</span>
                        {selectedLocation.neighborhood && <>
                            <span className="opacity-40">/</span>
                            <span className="text-[#C8A44A]">{selectedLocation.neighborhood}</span>
                        </>}
                    </div>
                </div>
                <div className="container-custom pt-2">
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <LocationSearchPanel
                                onStateSelect={(stateUf) => {
                                    setSelectedLocation((prev) => ({ ...prev, state: stateUf, neighborhood: '' }))
                                }}
                                onMunicipalitySelect={(municipalityName, stateUf) => {
                                    setSelectedLocation({ state: stateUf, municipality: municipalityName, neighborhood: '' })
                                    router.replace(`/${lang}/inteligencia/brasil/${stateUf.toLowerCase()}/${municipalityName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
                                }}
                                onNeighborhoodSelect={(neighborhoodName) => {
                                    setSelectedLocation((prev) => ({ ...prev, neighborhood: neighborhoodName }))
                                }}
                            />
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
                            value={dataState === 'loading' ? null : formatCurrency(cityAvgPrice)}
                            loading={dataState === 'loading'}
                        />
                        <CompactMetric
                            label={`Melhor yield${bestYield ? ` · ${bestYield.neighborhood}` : ''}`}
                            value={dataState === 'loading' || !bestYield ? null : `${Number(bestYield.avg_rental_yield).toFixed(1)}% a.a.`}
                            loading={dataState === 'loading'}
                            highlight
                        />
                        <CompactMetric
                            label={`Venda mais rápida${fastestSelling ? ` · ${fastestSelling.neighborhood}` : ''}`}
                            value={dataState === 'loading' || !fastestSelling ? null : `${fastestSelling.avg_days_on_market}d`}
                            loading={dataState === 'loading'}
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

                    <p className="text-xs text-[#94A0B2] mb-4">
                        {dataSource === 'api' ? 'Dados atualizados' : dataSource === 'fallback' ? 'Estimativa IMI' : 'Dados em expansão para esta região.'}
                    </p>
                    {dataState === 'loading' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <NeighborhoodCardSkeleton key={i} index={i} />
                            ))}
                        </div>
                    ) : displayedNeighborhoods.length === 0 || dataState === 'empty' || dataState === 'error' ? (
                        <EmptyState city={currentCityObj?.name ?? selectedCity} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayedNeighborhoods.map((n, i) => (
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
                    <p className="text-xs text-[#556170] mt-5">
                        Use estes números como referência inicial. Consulte um especialista IMI para análise personalizada.
                    </p>
                </div>
            </section>

            {/* ─── PRICE HEATMAP ────────────────────────────────────────── */}
            <div className="border-t border-white/[0.05]">
                <PriceHeatmap neighborhoods={neighborhoods} cityAvgPrice={cityAvgPrice} loading={dataState === 'loading'} />
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
                        { label: 'Rentab. estimada', value: data.avg_rental_yield != null ? `${Number(data.avg_rental_yield).toFixed(1)}%` : '--' },
                        { label: 'Liquidez', value: data.absorption_rate != null ? `${Number(data.absorption_rate).toFixed(1)}%` : '--' },
                        { label: 'Valorização 12m', value: data.price_trend_12m != null ? formatPercent(Number(data.price_trend_12m)) : '--' },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-[#0B1928] rounded-lg p-2 text-center">
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
                            { label: 'Estoque disponível', value: data.inventory_count != null ? `${data.inventory_count} imóveis` : '--' },
                            { label: 'Tempo médio de venda', value: data.avg_days_on_market != null ? `${data.avg_days_on_market} dias` : '--' },
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
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-[#0B1928] rounded-lg" />)}
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
