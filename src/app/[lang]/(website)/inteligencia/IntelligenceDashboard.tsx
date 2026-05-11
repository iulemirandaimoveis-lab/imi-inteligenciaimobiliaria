'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, Building2, RefreshCw, ChevronDown, ChevronUp, Percent, Clock, DollarSign } from 'lucide-react'
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
    const initialCity = ALL_CITIES.find((city) => city.state.toLowerCase() === (initialState ?? '').toLowerCase() && city.name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === initialCitySlug)?.key ?? ALL_CITIES[0].key
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

    const breadcrumbParts = [
        { label: 'Global', muted: true },
        { label: currentGeo?.continent ?? 'América do Sul', muted: true },
        { label: `${currentCountry?.flag ?? '🇧🇷'} ${currentCountry?.name ?? 'Brasil'}`, muted: true },
        ...(currentMunicipality?.state ? [{ label: currentMunicipality.state, muted: false }] : []),
        { label: currentCityObj?.name ?? selectedCity, muted: false },
        ...(selectedLocation.neighborhood ? [{ label: selectedLocation.neighborhood, muted: false, gold: true }] : []),
    ]

    return (
        <main className="bg-[#0B1928] min-h-screen">

            {/* ─── HERO ──────────────────────────────────────────────────── */}
            <section className="relative bg-[#0B1928] text-white pt-20 pb-12 md:pt-28 md:pb-18 overflow-hidden border-b border-white/[0.05]">
                {/* Gold radial glow */}
                <div className="absolute top-0 right-0 w-2/3 h-full opacity-[0.05]"
                    style={{ backgroundImage: 'radial-gradient(ellipse at 85% 40%, #C8A44A 0%, transparent 55%)' }} />
                {/* Grid texture */}
                <div className="absolute inset-0 opacity-[0.025]"
                    style={{ backgroundImage: 'linear-gradient(rgba(200,164,74,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(200,164,74,0.4) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(to bottom, transparent, #0B1928)' }} />

                <div className="container-custom relative z-10">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-px bg-[#C8A44A] opacity-60" />
                        <span className="text-[#C8A44A] font-bold uppercase tracking-[0.3em] text-[10px]">Market Intelligence</span>
                    </div>
                    <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-5 tracking-tight leading-[1.1] text-white">
                        Inteligência<br />
                        <span className="text-[#C8A44A] italic">Imobiliária</span>
                    </h1>
                    <p className="text-[#7A8FA6] text-base sm:text-lg font-light leading-relaxed max-w-xl mb-8">
                        Decisões orientadas por dados. Explore preços, tendências e indicadores
                        por bairro nas principais cidades do mercado.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <HeroBadge icon="📍" label="27 estados cobertos" />
                        <HeroBadge icon="🏙️" label="Dados por bairro" />
                        <HeroBadge icon="📈" label="Atualização contínua" />
                    </div>
                </div>
            </section>

            {/* ─── STICKY SEARCH BAR ────────────────────────────────────── */}
            <div className="sticky top-0 z-30 bg-[#0B1928]/95 backdrop-blur-md border-b border-white/[0.06]">
                {/* Breadcrumb */}
                <div className="container-custom pt-3 pb-0">
                    <nav aria-label="Localização" className="flex items-center gap-1 text-[10px] text-[#3D5166] font-medium overflow-x-auto scrollbar-hide whitespace-nowrap">
                        {breadcrumbParts.map((part, i) => (
                            <span key={i} className="flex items-center gap-1">
                                {i > 0 && <span className="opacity-30 select-none">/</span>}
                                <span className={part.gold ? 'text-[#C8A44A]' : part.muted ? 'text-[#3D5166]' : 'text-[#7A8FA6]'}>
                                    {part.label}
                                </span>
                            </span>
                        ))}
                    </nav>
                </div>
                {/* Search + refresh */}
                <div className="container-custom pt-2 pb-3">
                    <div className="flex items-start gap-2">
                        <div className="flex-1">
                            <LocationSearchPanel
                                onStateSelect={(stateUf) => {
                                    setSelectedLocation((prev) => ({ ...prev, state: stateUf, neighborhood: '' }))
                                }}
                                onMunicipalitySelect={(municipalityName, stateUf) => {
                                    setSelectedLocation({ state: stateUf, municipality: municipalityName, neighborhood: '' })
                                    router.replace(`/${lang}/inteligencia/brasil/${stateUf.toLowerCase()}/${municipalityName.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
                                }}
                                onNeighborhoodSelect={(neighborhoodName) => {
                                    setSelectedLocation((prev) => ({ ...prev, neighborhood: neighborhoodName }))
                                }}
                            />
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            title="Atualizar dados"
                            className="shrink-0 w-9 h-9 mt-0.5 flex items-center justify-center rounded-lg bg-[#0B1928] text-[#C8A44A] hover:text-[#556170] border border-[#C8A44A]/30 hover:border-white/[0.06] transition-all duration-200 disabled:opacity-30"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── CITY METRICS BAR ─────────────────────────────────────── */}
            <section className="py-5 md:py-7 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                        <CompactMetric
                            icon={<DollarSign className="w-3.5 h-3.5" />}
                            label="Preço médio/m²"
                            value={dataState === 'loading' ? null : formatCurrency(cityAvgPrice)}
                            loading={dataState === 'loading'}
                        />
                        <CompactMetric
                            icon={<Percent className="w-3.5 h-3.5" />}
                            label={bestYield ? `Melhor yield · ${bestYield.neighborhood}` : 'Melhor yield'}
                            value={dataState === 'loading' || !bestYield ? null : `${Number(bestYield.avg_rental_yield).toFixed(1)}% a.a.`}
                            loading={dataState === 'loading'}
                            highlight
                        />
                        <CompactMetric
                            icon={<Clock className="w-3.5 h-3.5" />}
                            label={fastestSelling ? `Vende mais rápido · ${fastestSelling.neighborhood}` : 'Venda mais rápida'}
                            value={dataState === 'loading' || !fastestSelling ? null : `${fastestSelling.avg_days_on_market}d`}
                            loading={dataState === 'loading'}
                        />
                    </div>
                </div>
            </section>

            {/* ─── NEIGHBORHOOD CARDS ───────────────────────────────────── */}
            <section className="py-10 md:py-14">
                <div className="container-custom">
                    {/* Section header */}
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-5 h-px bg-[#C8A44A] opacity-50" />
                                <span className="text-[#C8A44A] font-bold uppercase tracking-[0.25em] text-[10px]">Bairros</span>
                            </div>
                            <h2 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight">
                                Panorama em{' '}
                                <span className="text-[#C8A44A] italic">{currentCityObj?.name ?? selectedCity}</span>
                            </h2>
                        </div>
                        <DataSourceBadge source={dataSource} state={dataState} />
                    </div>

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

                    <p className="text-[10px] text-[#3D5166] mt-6 flex items-center gap-1.5">
                        <span className="inline-block w-3 h-px bg-[#3D5166]" />
                        Use estes números como referência inicial. Consulte um especialista IMI para análise personalizada.
                    </p>
                </div>
            </section>

            {/* ─── PRICE HEATMAP ────────────────────────────────────────── */}
            <div className="border-t border-white/[0.05]">
                <PriceHeatmap neighborhoods={neighborhoods} cityAvgPrice={cityAvgPrice} loading={dataState === 'loading'} />
            </div>

            {/* ─── CTA ──────────────────────────────────────────────────── */}
            <section className="bg-[#0B1928] text-white py-20 md:py-28 text-center relative overflow-hidden border-t border-white/[0.05]">
                <div className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(200,164,74,0.07) 0%, transparent 65%)' }} />
                <div className="absolute inset-0 opacity-[0.02]"
                    style={{ backgroundImage: 'linear-gradient(rgba(200,164,74,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(200,164,74,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                <div className="container-custom relative z-10 max-w-lg mx-auto">
                    <div className="flex items-center justify-center gap-3 mb-5">
                        <div className="w-8 h-px bg-[#C8A44A] opacity-40" />
                        <span className="text-[#C8A44A] font-bold uppercase tracking-[0.28em] text-[10px]">IMI Consultoria</span>
                        <div className="w-8 h-px bg-[#C8A44A] opacity-40" />
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight">
                        Precisa de uma{' '}
                        <span className="text-[#C8A44A] italic">Análise Personalizada</span>?
                    </h2>
                    <p className="text-[#7A8FA6] text-sm sm:text-base mb-10 font-light leading-relaxed">
                        Dossiê de bairro, estudo de viabilidade ou laudo técnico com metodologia ABNT.
                    </p>
                    <a
                        href="https://wa.me/5581997230455"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2.5 h-12 px-8 rounded-xl bg-[#C8A44A] text-[#060D16] font-bold text-xs uppercase tracking-[0.16em] hover:bg-[#D4B86A] active:scale-95 transition-all duration-200 shadow-lg shadow-[#C8A44A]/15"
                    >
                        Solicitar Estudo de Mercado
                    </a>
                </div>
            </section>

            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </main>
    )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroBadge({ icon, label }: { icon: string; label: string }) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <span className="text-sm leading-none">{icon}</span>
            <span className="text-[11px] text-[#7A8FA6] font-medium">{label}</span>
        </div>
    )
}

function DataSourceBadge({ source, state }: { source: 'api' | 'fallback' | 'none'; state: string }) {
    if (state === 'loading' || state === 'idle') return null
    const cfg = {
        api: { label: 'Dados atualizados', dot: '#4ADE80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)', text: '#4ADE80' },
        fallback: { label: 'Estimativa IMI', dot: '#C8A44A', bg: 'rgba(200,164,74,0.08)', border: 'rgba(200,164,74,0.2)', text: '#C8A44A' },
        none: { label: 'Dados em expansão', dot: '#556170', bg: 'rgba(85,97,112,0.08)', border: 'rgba(85,97,112,0.2)', text: '#556170' },
    }[source]
    return (
        <span
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0"
            style={{ color: cfg.text, background: cfg.bg, borderColor: cfg.border }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
            {cfg.label}
        </span>
    )
}

function CompactMetric({ icon, label, value, loading, highlight }: {
    icon: React.ReactNode; label: string; value: string | null; loading: boolean; highlight?: boolean
}) {
    return (
        <div className={`p-3 md:p-4 rounded-xl border transition-colors ${highlight
            ? 'bg-gradient-to-br from-[rgba(200,164,74,0.07)] to-[rgba(200,164,74,0.03)] border-[rgba(200,164,74,0.18)]'
            : 'bg-[#0B1928] border-white/[0.06]'
            }`}>
            <div className="flex items-center gap-1.5 mb-2">
                <span className={highlight ? 'text-[#C8A44A]/60' : 'text-[#3D5166]'}>{icon}</span>
                <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#3D5166] leading-tight truncate">{label}</div>
            </div>
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

    const priceRatio = price != null && cityAvgPrice != null ? price / cityAvgPrice : null
    const accentColor = priceRatio == null
        ? 'rgba(85,97,112,0.4)'
        : priceRatio < 0.85 ? 'rgba(74,222,128,0.5)'
        : priceRatio <= 1.15 ? 'rgba(200,164,74,0.5)'
        : 'rgba(248,113,113,0.5)'

    return (
        <div
            onClick={onToggle}
            className="group rounded-xl bg-[#0B1928] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 cursor-pointer overflow-hidden relative"
            style={{
                animationDelay: `${index * 40}ms`,
                animation: 'fadeSlideUp 0.4s ease forwards',
                opacity: 0,
            }}
        >
            {/* Left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-all duration-300"
                style={{ background: accentColor, opacity: expanded ? 1 : 0.5 }} />

            <div className="p-4 pl-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white group-hover:text-[#C8A44A] transition-colors leading-tight truncate">
                            {data.neighborhood}
                        </h3>
                        <span className="text-[10px] text-[#3D5166]">{data.city}{data.state ? `, ${data.state}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2" style={{ color: trendColor }}>
                        {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : trend != null ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                        <span className="text-xs font-bold">{formatPercent(trend)}</span>
                    </div>
                </div>

                <div className="mb-3">
                    <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#3D5166] mb-0.5">Preço/m²</div>
                    <div className="text-2xl font-bold text-white tracking-tight leading-none">{formatCurrency(price)}</div>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                    {[
                        { label: 'Rentab.', value: data.avg_rental_yield != null ? `${Number(data.avg_rental_yield).toFixed(1)}%` : '--' },
                        { label: 'Liquidez', value: data.absorption_rate != null ? `${Number(data.absorption_rate).toFixed(1)}%` : '--' },
                        { label: 'Val. 12m', value: data.price_trend_12m != null ? formatPercent(Number(data.price_trend_12m)) : '--' },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-[#0B1928] rounded-lg p-2 text-center">
                            <div className="text-xs font-bold text-white">{value}</div>
                            <div className="text-[8px] text-[#3D5166] mt-0.5">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Expand toggle */}
            <div className="px-5 pb-2 flex items-center justify-end">
                <span className="flex items-center gap-1 text-[10px] text-[#3D5166] group-hover:text-[#556170] transition-colors">
                    {expanded ? <><ChevronUp className="w-3 h-3" /> menos</> : <><ChevronDown className="w-3 h-3" /> mais detalhes</>}
                </span>
            </div>

            {/* Expanded metrics */}
            <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: expanded ? 300 : 0, opacity: expanded ? 1 : 0 }}>
                <div className="px-5 pb-4 pt-1 border-t border-white/[0.05]">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
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
                                <div className="text-[9px] text-[#3D5166] uppercase tracking-wider mb-0.5">{label}</div>
                                <div className="text-xs font-semibold text-white">{value}</div>
                            </div>
                        ))}
                    </div>
                    {cityAvgPrice != null && price != null && (
                        <div className="mt-3 pt-3 border-t border-white/[0.05] text-[10px]" style={{ color: accentColor }}>
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
        <div className="rounded-xl bg-[#0B1928] border border-white/[0.05] p-4 pl-5 animate-pulse overflow-hidden relative" style={{ animationDelay: `${index * 80}ms` }}>
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-white/[0.04] rounded-l-xl" />
            <div className="h-4 w-2/3 bg-white/[0.05] rounded mb-2" />
            <div className="h-3 w-1/3 bg-white/[0.04] rounded mb-4" />
            <div className="h-7 w-1/2 bg-white/[0.05] rounded mb-3" />
            <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-[#0B1928] rounded-lg" />)}
            </div>
        </div>
    )
}

function EmptyState({ city }: { city: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#0B1928] border border-white/[0.06] flex items-center justify-center mb-5">
                <Building2 className="w-7 h-7 text-[#1A3250]" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Dados em construção para {city}</h3>
            <p className="text-[#556170] text-sm max-w-xs font-light leading-relaxed">
                Estamos coletando e validando indicadores de inteligência para esta região.
            </p>
        </div>
    )
}
