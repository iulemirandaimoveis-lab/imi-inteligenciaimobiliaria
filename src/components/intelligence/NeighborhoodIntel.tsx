'use client'

import { useEffect, useState } from 'react'

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

interface CityAverage {
    median_price_sqm: number | null
    avg_price_sqm: number | null
    price_trend_12m: number | null
    walkability_score: number | null
    transit_score: number | null
    safety_score: number | null
    avg_rental_yield: number | null
    avg_days_on_market: number | null
    vacancy_rate: number | null
    neighborhood_count: number
}

interface NeighborhoodIntelProps {
    neighborhood: string
    city: string
    compact?: boolean
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const NAVY = '#0B1928'
const GOLD = '#C8A44A'
const LIGHT_BG = '#F8F6F2'
const MUTED = '#948F84'

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

function TrendArrow({ value }: { value: number | null }) {
    if (value == null) return <span style={{ color: MUTED }}>--</span>
    const isUp = value > 0
    const color = isUp ? '#10B981' : '#EF4444'
    return (
        <span style={{ color, fontWeight: 700, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            {isUp ? '\u2191' : '\u2193'} {Math.abs(value).toFixed(1)}%
        </span>
    )
}

function ScoreBar({ label, value, maxValue = 100, cityAvg }: {
    label: string
    value: number | null
    maxValue?: number
    cityAvg?: number | null
}) {
    const pct = value != null ? Math.min((value / maxValue) * 100, 100) : 0
    const avgPct = cityAvg != null ? Math.min((cityAvg / maxValue) * 100, 100) : null

    const getColor = (v: number) => {
        if (v >= 75) return '#10B981'
        if (v >= 50) return GOLD
        return '#EF4444'
    }

    return (
        <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: MUTED, fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>
                    {value != null ? value : '--'}
                    <span style={{ fontSize: 10, fontWeight: 400, color: MUTED }}>/100</span>
                </span>
            </div>
            <div style={{
                position: 'relative', height: 6, borderRadius: 3,
                background: '#E8E5DF', overflow: 'visible',
            }}>
                <div style={{
                    height: '100%', borderRadius: 3,
                    background: value != null ? getColor(value) : '#E8E5DF',
                    width: `${pct}%`,
                    transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
                }} />
                {avgPct != null && (
                    <div
                        style={{
                            position: 'absolute', top: -3, left: `${avgPct}%`,
                            width: 2, height: 12, background: NAVY, borderRadius: 1,
                            opacity: 0.4,
                        }}
                        title={`Media da cidade: ${cityAvg}`}
                    />
                )}
            </div>
        </div>
    )
}

function StatCard({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
    return (
        <div style={{
            background: LIGHT_BG, borderRadius: 12, padding: '12px 14px',
            flex: '1 1 0', minWidth: 100,
        }}>
            <div style={{ fontSize: 10, color: MUTED, fontWeight: 500, marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                {label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: NAVY, letterSpacing: '-0.02em' }}>
                {value}
            </div>
            {subtext && (
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{subtext}</div>
            )}
        </div>
    )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton({ compact = false }: { compact?: boolean }) {
    return (
        <div style={{
            background: 'white', borderRadius: 20,
            padding: compact ? 16 : 24,
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            animation: 'pulseIntel 1.5s ease-in-out infinite',
        }}>
            {/* Header skeleton */}
            <div style={{
                background: NAVY, borderRadius: '16px 16px 0 0', margin: compact ? '-16px -16px 16px' : '-24px -24px 20px',
                padding: compact ? '14px 18px' : '18px 22px',
            }}>
                <div style={{ height: 10, width: '30%', background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: compact ? 16 : 20, width: '55%', background: 'rgba(255,255,255,0.08)', borderRadius: 6 }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: compact ? 12 : 20, flexWrap: 'wrap' as const }}>
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ flex: '1 1 80px', height: compact ? 55 : 70, background: '#F3F1ED', borderRadius: 12 }} />
                ))}
            </div>
            <div style={{ height: 12, width: '40%', background: '#E8E5DF', borderRadius: 6, marginBottom: 12 }} />
            <div style={{ height: 6, background: '#F3F1ED', borderRadius: 3, marginBottom: 14 }} />
            <div style={{ height: 6, background: '#F3F1ED', borderRadius: 3, marginBottom: 14 }} />
            <div style={{ height: 6, background: '#F3F1ED', borderRadius: 3 }} />
            {!compact && (
                <>
                    <div style={{ height: 12, width: '35%', background: '#E8E5DF', borderRadius: 6, marginTop: 20, marginBottom: 12 }} />
                    <div style={{ display: 'flex', gap: 10 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ flex: 1, height: 55, background: '#F3F1ED', borderRadius: 12 }} />
                        ))}
                    </div>
                </>
            )}
            <style>{`@keyframes pulseIntel { 0%,100% { opacity:1; } 50% { opacity:0.6; } }`}</style>
        </div>
    )
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function NeighborhoodIntel({ neighborhood, city, compact = false }: NeighborhoodIntelProps) {
    const [data, setData] = useState<NeighborhoodData | null>(null)
    const [cityAvg, setCityAvg] = useState<CityAverage | null>(null)
    const [nearby, setNearby] = useState<NeighborhoodData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!neighborhood?.trim() || !city?.trim()) return

        const fetchData = async () => {
            setLoading(true)
            setError(null)
            try {
                const params = new URLSearchParams({ city, neighborhood })
                const res = await fetch(`/api/intelligence/neighborhood?${params}`)
                if (!res.ok) {
                    if (res.status === 404) {
                        setError('not_found')
                    } else {
                        setError('fetch_error')
                    }
                    return
                }
                const json = await res.json()
                setData(json.neighborhood)
                setCityAvg(json.cityAverage || null)
                setNearby(json.nearby || [])
            } catch {
                setError('fetch_error')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [neighborhood, city])

    if (loading) return <Skeleton compact={compact} />
    if (error === 'not_found' || !data) return null
    if (error) return null

    const updatedDate = data.updated_at
        ? new Date(data.updated_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        : null

    return (
        <div style={{
            background: 'white', borderRadius: 20,
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        }}>
            {/* Header */}
            <div style={{
                background: NAVY, color: 'white',
                padding: compact ? '16px 20px' : '20px 24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div>
                    <div style={{
                        fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const,
                        letterSpacing: '0.12em', color: GOLD, marginBottom: 4,
                    }}>
                        Inteligencia do Bairro
                    </div>
                    <div style={{ fontSize: compact ? 16 : 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
                        {data.neighborhood}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                        {data.city}, {data.state}
                    </div>
                </div>
                {updatedDate && (
                    <div style={{
                        fontSize: 9, color: 'rgba(255,255,255,0.4)',
                        textTransform: 'uppercase' as const, letterSpacing: '0.05em',
                    }}>
                        Atualizado {updatedDate}
                    </div>
                )}
            </div>

            <div style={{ padding: compact ? '16px 20px' : '20px 24px' }}>
                {/* Price metrics row */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                    <StatCard
                        label="Preco / m2"
                        value={formatCurrency(data.median_price_sqm ? Number(data.median_price_sqm) : null)}
                        subtext={data.price_trend_12m != null
                            ? `${Number(data.price_trend_12m) > 0 ? '\u2191' : '\u2193'} ${formatPercent(Number(data.price_trend_12m))} em 12m`
                            : undefined}
                    />
                    <StatCard
                        label="Yield Aluguel"
                        value={data.avg_rental_yield != null ? `${Number(data.avg_rental_yield).toFixed(1)}%` : '--'}
                        subtext={data.avg_monthly_rent_sqm != null
                            ? `${formatCurrency(Number(data.avg_monthly_rent_sqm))}/m2/mes`
                            : undefined}
                    />
                    <StatCard
                        label="Tempo de Venda"
                        value={data.avg_days_on_market != null ? `${data.avg_days_on_market}d` : '--'}
                        subtext={data.absorption_rate != null
                            ? `${Number(data.absorption_rate).toFixed(1)}% absorcao/mes`
                            : undefined}
                    />
                </div>

                {/* Trend row */}
                <div style={{
                    display: 'flex', gap: 16, marginBottom: 20,
                    padding: '12px 16px', background: LIGHT_BG, borderRadius: 12,
                    flexWrap: 'wrap',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto' }}>
                        <span style={{ fontSize: 11, color: MUTED }}>12 meses:</span>
                        <TrendArrow value={data.price_trend_12m != null ? Number(data.price_trend_12m) : null} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto' }}>
                        <span style={{ fontSize: 11, color: MUTED }}>3 meses:</span>
                        <TrendArrow value={data.price_trend_3m != null ? Number(data.price_trend_3m) : null} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto' }}>
                        <span style={{ fontSize: 11, color: MUTED }}>5 anos:</span>
                        <TrendArrow value={data.valorization_5y != null ? Number(data.valorization_5y) : null} />
                    </div>
                </div>

                {/* Scores section */}
                <div style={{ marginBottom: compact ? 0 : 20 }}>
                    <div style={{
                        fontSize: 11, fontWeight: 700, color: NAVY,
                        textTransform: 'uppercase' as const, letterSpacing: '0.08em',
                        marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        Qualidade de Vida
                        {cityAvg && (
                            <span style={{
                                fontSize: 9, fontWeight: 500, color: MUTED,
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                            }}>
                                <span style={{ width: 8, height: 2, background: NAVY, opacity: 0.4, borderRadius: 1, display: 'inline-block' }} />
                                media {data.city}
                            </span>
                        )}
                    </div>
                    <ScoreBar
                        label="Caminhabilidade"
                        value={data.walkability_score}
                        cityAvg={cityAvg?.walkability_score}
                    />
                    <ScoreBar
                        label="Transporte"
                        value={data.transit_score}
                        cityAvg={cityAvg?.transit_score}
                    />
                    <ScoreBar
                        label="Seguranca"
                        value={data.safety_score}
                        cityAvg={cityAvg?.safety_score}
                    />
                </div>

                {/* Market snapshot */}
                {!compact && (
                    <div style={{
                        display: 'flex', gap: 10, marginBottom: nearby.length > 0 ? 20 : 0,
                        flexWrap: 'wrap',
                    }}>
                        <StatCard
                            label="Estoque"
                            value={data.inventory_count != null ? `${data.inventory_count}` : '--'}
                            subtext="imoveis disponiveis"
                        />
                        <StatCard
                            label="Vacancia"
                            value={data.vacancy_rate != null ? `${Number(data.vacancy_rate).toFixed(1)}%` : '--'}
                        />
                        <StatCard
                            label="Lancamentos 12m"
                            value={data.new_launches_12m != null ? `${data.new_launches_12m}` : '--'}
                            subtext="novos empreendimentos"
                        />
                    </div>
                )}

                {/* Nearby comparison */}
                {!compact && nearby && nearby.length > 0 && (
                    <div>
                        <div style={{
                            fontSize: 11, fontWeight: 700, color: NAVY,
                            textTransform: 'uppercase' as const, letterSpacing: '0.08em',
                            marginBottom: 10,
                        }}>
                            Comparar com bairros proximos
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {nearby.slice(0, 5).map((n) => {
                                const priceDiff = data.median_price_sqm && n.median_price_sqm
                                    ? ((Number(n.median_price_sqm) - Number(data.median_price_sqm)) / Number(data.median_price_sqm)) * 100
                                    : null
                                return (
                                    <div key={n.id} style={{
                                        background: LIGHT_BG, borderRadius: 10, padding: '8px 12px',
                                        flex: '0 0 auto', minWidth: 110,
                                    }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 2 }}>
                                            {n.neighborhood}
                                        </div>
                                        <div style={{ fontSize: 11, color: MUTED }}>
                                            {formatCurrency(n.median_price_sqm ? Number(n.median_price_sqm) : null)}/m2
                                        </div>
                                        {priceDiff != null && (
                                            <div style={{
                                                fontSize: 10, marginTop: 2,
                                                color: priceDiff > 0 ? '#EF4444' : '#10B981',
                                                fontWeight: 600,
                                            }}>
                                                {priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(0)}% vs {data.neighborhood}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer branding */}
            <div style={{
                borderTop: '1px solid rgba(0,0,0,0.04)',
                padding: '10px 24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <span style={{ fontSize: 9, color: MUTED, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                    IMI Inteligencia Imobiliaria
                </span>
                <span style={{ fontSize: 9, color: 'rgba(0,0,0,0.2)' }}>
                    Fonte: {data.data_source || 'imi_internal'}
                </span>
            </div>
        </div>
    )
}
