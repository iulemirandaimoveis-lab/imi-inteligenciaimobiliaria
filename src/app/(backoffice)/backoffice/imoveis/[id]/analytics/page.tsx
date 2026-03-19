'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, MousePointer, Users, Clock, Target,
    MapPin, Loader2, BarChart3, Link2, TrendingUp,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { MobileGlobalStyles, MobileAppBar, MobileBottomNav } from '../../mobile-ui'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const PIE_COLORS = ['var(--imi-gold-500)', 'var(--info)', '#6BB87B', '#A89EC4', '#E8A87C', '#7B9EC4']

interface AnalyticsData {
    development: { id: string; name: string; slug?: string; city?: string; state?: string; neighborhood?: string }
    kpis: {
        totalClicks: number; totalEvents: number; totalLeads: number
        convertedLeads: number; taxaConversao: number; trackedLinksCount: number
    }
    performanceTemporal: { date: string; views: number; clicks: number; leads: number }[]
    fontesTrafico: { source: string; visits: number; percentage: number }[]
    devices: Record<string, number>
    topLocations: { city: string; percentage: number }[]
    topCampaigns: { name: string; clicks: number; leads: number }[]
    timeRange: string
}

// ─── Mobile Analytics Component ───────────────────────────────────────────────

interface MobileAnalyticsProps {
    data: AnalyticsData
    periodoFilter: string
    setPeriodoFilter: (v: string) => void
    params: { id: string | string[] }
    router: ReturnType<typeof useRouter>
}

function MobileAnalytics({ data, periodoFilter, setPeriodoFilter, params, router }: MobileAnalyticsProps) {
    const { kpis, performanceTemporal, fontesTrafico, devices, topLocations, topCampaigns, development } = data

    const KPI_CARDS = [
        { label: 'Total Cliques', value: kpis.totalClicks.toLocaleString('pt-BR'), icon: MousePointer, color: '#A89EC4' },
        { label: 'Links Ativos', value: String(kpis.trackedLinksCount), icon: Link2, color: 'var(--imi-gold-500)' },
        { label: 'Leads Gerados', value: String(kpis.totalLeads), icon: Users, color: '#E8A87C' },
        { label: 'Conversões', value: String(kpis.convertedLeads), icon: Target, color: 'var(--success)' },
        { label: 'Taxa Conv.', value: `${kpis.taxaConversao}%`, icon: TrendingUp, color: 'var(--imi-gold-500)' },
        { label: 'Eventos', value: String(kpis.totalEvents), icon: BarChart3, color: '#A89EC4' },
    ]

    const maxDailyClicks = Math.max(...performanceTemporal.map(d => d.clicks), 1)
    const maxDailyLeads = Math.max(...performanceTemporal.map(d => d.leads), 1)

    const totalDeviceHits = Object.values(devices).reduce((s, v) => s + v, 0) || 1
    const deviceList = Object.entries(devices)
        .sort((a, b) => b[1] - a[1])
        .map(([device, count]) => ({
            device: device === 'mobile' ? 'Mobile' : device === 'desktop' ? 'Desktop' : device === 'tablet' ? 'Tablet' : device,
            count,
            percentage: Math.round((count / totalDeviceHits) * 100),
        }))

    const periodLabel = periodoFilter === '7d' ? '7' : periodoFilter === '90d' ? '90' : '30'
    const recentDays = performanceTemporal.slice(-7)

    const PERIOD_CHIPS = [
        { value: '7d', label: '7d' },
        { value: '30d', label: '30d' },
        { value: '90d', label: '90d' },
    ]

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
            <MobileGlobalStyles />

            {/* Fixed AppBar */}
            <MobileAppBar
                title="Analytics"
                subtitle={development.name}
                onBack={() => router.push(`/backoffice/imoveis/${params.id}`)}
            />

            {/* Content */}
            <div style={{ paddingTop: 72, paddingBottom: 72, background: 'var(--bg-base)' }}>

                {/* Period Selector */}
                <div style={{
                    display: 'flex', gap: 8,
                    overflowX: 'auto', scrollbarWidth: 'none',
                    padding: '16px 16px 0',
                }}>
                    <style suppressHydrationWarning>{`.mob-scroll-hide::-webkit-scrollbar{display:none}`}</style>
                    {PERIOD_CHIPS.map(chip => {
                        const isActive = periodoFilter === chip.value
                        return (
                            <button
                                key={chip.value}
                                onClick={() => setPeriodoFilter(chip.value)}
                                className="mob-chip-tap"
                                style={{
                                    flexShrink: 0,
                                    height: 36, minWidth: 52,
                                    padding: '0 16px',
                                    borderRadius: 6,
                                    background: isActive ? 'var(--imi-gold-500)' : 'rgba(184,148,58,0.08)',
                                    border: `1px solid ${isActive ? 'var(--imi-gold-500)' : 'rgba(184,148,58,0.2)'}`,
                                    color: isActive ? T.text : 'var(--text-tertiary)',
                                    fontFamily: 'var(--font-montserrat, sans-serif)',
                                    fontSize: 12, fontWeight: isActive ? 700 : 500,
                                    cursor: 'pointer',
                                    letterSpacing: '0.3px',
                                    touchAction: 'manipulation',
                                }}
                            >
                                {chip.label}
                            </button>
                        )
                    })}
                </div>

                {/* KPI Grid — 2 columns × 3 rows */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    padding: '16px 14px 0',
                }}>
                    {KPI_CARDS.map(k => (
                        <div
                            key={k.label}
                            style={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid rgba(184,148,58,0.12)',
                                borderRadius: 6,
                                padding: 14,
                            }}
                        >
                            {/* Icon container */}
                            <div style={{
                                width: 32, height: 32,
                                borderRadius: 6,
                                background: `${k.color}18`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 10,
                            }}>
                                <k.icon size={14} style={{ color: k.color }} />
                            </div>
                            {/* Value */}
                            <div style={{
                                fontFamily: 'var(--font-dm-mono, monospace)',
                                fontSize: 20, fontWeight: 700,
                                color: 'var(--imi-cream)',
                                lineHeight: 1.1,
                                fontVariantNumeric: 'tabular-nums',
                            }}>
                                {k.value}
                            </div>
                            {/* Label */}
                            <div style={{
                                fontFamily: 'var(--font-montserrat, sans-serif)',
                                fontSize: 11, fontWeight: 600,
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                color: 'var(--text-secondary)',
                                marginTop: 5,
                            }}>
                                {k.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Performance Temporal */}
                <div style={{ padding: '20px 14px 0' }}>
                    <div style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid rgba(184,148,58,0.12)',
                        borderRadius: 6,
                        padding: 14,
                    }}>
                        <div style={{
                            fontFamily: 'var(--font-playfair, serif)',
                            fontSize: 16, fontWeight: 600,
                            color: 'var(--imi-cream)',
                            marginBottom: 4,
                        }}>
                            Performance Temporal
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-montserrat, sans-serif)',
                            fontSize: 11, color: 'var(--text-secondary)',
                            marginBottom: 14,
                        }}>
                            Últimos {periodLabel} dias · Cliques &amp; Leads
                        </div>

                        {recentDays.length === 0 || recentDays.every(d => d.clicks === 0) ? (
                            <div style={{
                                textAlign: 'center', padding: '20px 0',
                                fontFamily: 'var(--font-montserrat, sans-serif)',
                                fontSize: 12, color: 'var(--text-secondary)',
                            }}>
                                Sem dados de tracking nesse período
                            </div>
                        ) : (() => {
                            const mobileChartData = recentDays.map(d => ({
                                label: new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                                value: d.clicks,
                                leads: d.leads,
                            }))
                            return (
                                <ResponsiveContainer width="100%" height={160}>
                                    <AreaChart data={mobileChartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="mobileViewsGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--imi-gold-500)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--imi-gold-500)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(184,148,58,0.08)" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-montserrat)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                                        <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid rgba(184,148,58,0.25)', borderRadius: 6, fontSize: 11, color: 'var(--imi-cream)' }} cursor={{ stroke: 'rgba(184,148,58,0.2)' }} />
                                        <Area type="monotone" dataKey="value" name="Cliques" stroke="var(--imi-gold-500)" strokeWidth={2} fill="url(#mobileViewsGrad)" dot={false} />
                                        <Area type="monotone" dataKey="leads" name="Leads" stroke="#5DB887" strokeWidth={1.5} fill="rgba(93,184,135,0.08)" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )
                        })()}
                    </div>
                </div>

                {/* Traffic Sources */}
                <div style={{ padding: '16px 14px 0' }}>
                    <div style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid rgba(184,148,58,0.12)',
                        borderRadius: 6,
                        padding: 14,
                    }}>
                        <div style={{
                            fontFamily: 'var(--font-playfair, serif)',
                            fontSize: 16, fontWeight: 600,
                            color: 'var(--imi-cream)',
                            marginBottom: 4,
                        }}>
                            Fontes de Tráfego
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-montserrat, sans-serif)',
                            fontSize: 11, color: 'var(--text-secondary)',
                            marginBottom: 14,
                        }}>
                            Origem dos acessos
                        </div>

                        {fontesTrafico.length === 0 ? (
                            <div style={{
                                textAlign: 'center', padding: '16px 0',
                                fontFamily: 'var(--font-montserrat, sans-serif)',
                                fontSize: 12, color: 'var(--text-secondary)',
                            }}>
                                Sem dados de fonte
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {fontesTrafico.map((f, idx) => (
                                    <div key={idx}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: 5,
                                        }}>
                                            <span style={{
                                                fontFamily: 'var(--font-montserrat, sans-serif)',
                                                fontSize: 12, fontWeight: 600, color: 'var(--imi-cream)',
                                            }}>{f.source}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{
                                                    fontFamily: 'var(--font-dm-mono, monospace)',
                                                    fontSize: 12, fontWeight: 700, color: 'var(--imi-cream)',
                                                }}>{f.visits}</span>
                                                <span style={{
                                                    fontFamily: 'var(--font-montserrat, sans-serif)',
                                                    fontSize: 11, fontWeight: 700,
                                                    color: 'var(--imi-gold-500)',
                                                    background: 'rgba(184,148,58,0.12)',
                                                    borderRadius: 6,
                                                    padding: '2px 8px',
                                                }}>{f.percentage}%</span>
                                            </div>
                                        </div>
                                        <div style={{
                                            height: 4, borderRadius: 6,
                                            background: 'rgba(184,148,58,0.12)',
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                height: '100%', borderRadius: 6,
                                                width: `${f.percentage}%`,
                                                background: 'var(--imi-gold-500)',
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Locations */}
                {topLocations.length > 0 && (
                    <div style={{ padding: '16px 14px 0' }}>
                        <div style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid rgba(184,148,58,0.12)',
                            borderRadius: 6,
                            padding: 14,
                        }}>
                            <div style={{
                                fontFamily: 'var(--font-playfair, serif)',
                                fontSize: 16, fontWeight: 600,
                                color: 'var(--imi-cream)',
                                marginBottom: 4,
                            }}>
                                Top Localizações
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-montserrat, sans-serif)',
                                fontSize: 11, color: 'var(--text-secondary)',
                                marginBottom: 14,
                            }}>
                                Cidades com mais acessos
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {topLocations.map((loc, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 12px',
                                        background: 'var(--bg-muted)',
                                        borderRadius: 6,
                                        border: '1px solid rgba(184,148,58,0.08)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{
                                                width: 28, height: 28, borderRadius: 6,
                                                background: 'rgba(184,148,58,0.12)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                <MapPin size={12} style={{ color: 'var(--imi-gold-500)' }} />
                                            </div>
                                            <span style={{
                                                fontFamily: 'var(--font-montserrat, sans-serif)',
                                                fontSize: 12, fontWeight: 500, color: 'var(--imi-cream)',
                                            }}>{loc.city}</span>
                                        </div>
                                        <span style={{
                                            fontFamily: 'var(--font-dm-mono, monospace)',
                                            fontSize: 12, fontWeight: 700,
                                            color: 'var(--imi-gold-500)',
                                            background: 'rgba(184,148,58,0.10)',
                                            borderRadius: 6,
                                            padding: '4px 8px',
                                        }}>{loc.percentage}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Devices */}
                {deviceList.length > 0 && (
                    <div style={{ padding: '16px 14px 0' }}>
                        <div style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid rgba(184,148,58,0.12)',
                            borderRadius: 6,
                            padding: 14,
                        }}>
                            <div style={{
                                fontFamily: 'var(--font-playfair, serif)',
                                fontSize: 16, fontWeight: 600,
                                color: 'var(--imi-cream)',
                                marginBottom: 4,
                            }}>
                                Dispositivos
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-montserrat, sans-serif)',
                                fontSize: 11, color: 'var(--text-secondary)',
                                marginBottom: 14,
                            }}>
                                Breakdown por dispositivo
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {deviceList.map((d, idx) => (
                                    <div key={idx}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: 5,
                                        }}>
                                            <span style={{
                                                fontFamily: 'var(--font-montserrat, sans-serif)',
                                                fontSize: 12, fontWeight: 600, color: 'var(--imi-cream)',
                                            }}>{d.device}</span>
                                            <span style={{
                                                fontFamily: 'var(--font-dm-mono, monospace)',
                                                fontSize: 12, fontWeight: 700, color: 'var(--imi-cream)',
                                            }}>{d.percentage}%</span>
                                        </div>
                                        <div style={{
                                            height: 6, borderRadius: 6,
                                            background: 'rgba(168,158,196,0.15)',
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                height: '100%', borderRadius: 6,
                                                width: `${d.percentage}%`,
                                                background: '#A89EC4',
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Campaigns */}
                {topCampaigns.length > 0 && (
                    <div style={{ padding: '16px 14px 0' }}>
                        <div style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid rgba(184,148,58,0.12)',
                            borderRadius: 6,
                            padding: 14,
                        }}>
                            <div style={{
                                fontFamily: 'var(--font-playfair, serif)',
                                fontSize: 16, fontWeight: 600,
                                color: 'var(--imi-cream)',
                                marginBottom: 4,
                            }}>
                                Top Campanhas
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-montserrat, sans-serif)',
                                fontSize: 11, color: 'var(--text-secondary)',
                                marginBottom: 14,
                            }}>
                                Campanhas rastreadas
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {topCampaigns.map((c, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 12px',
                                        background: 'var(--bg-muted)',
                                        borderRadius: 6,
                                        border: '1px solid rgba(184,148,58,0.08)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                            <div style={{
                                                width: 28, height: 28, borderRadius: 6,
                                                background: 'rgba(184,148,58,0.12)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0,
                                                fontFamily: 'var(--font-dm-mono, monospace)',
                                                fontSize: 11, fontWeight: 700, color: 'var(--imi-gold-500)',
                                            }}>
                                                {idx + 1}
                                            </div>
                                            <span style={{
                                                fontFamily: 'var(--font-montserrat, sans-serif)',
                                                fontSize: 12, fontWeight: 500, color: 'var(--imi-cream)',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>{c.name}</span>
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 14,
                                            flexShrink: 0, marginLeft: 8,
                                        }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{
                                                    fontFamily: 'var(--font-dm-mono, monospace)',
                                                    fontSize: 12, fontWeight: 700, color: 'var(--imi-cream)',
                                                }}>{c.clicks}</div>
                                                <div style={{
                                                    fontFamily: 'var(--font-montserrat, sans-serif)',
                                                    fontSize: 11, color: 'var(--text-secondary)',
                                                }}>cliques</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{
                                                    fontFamily: 'var(--font-dm-mono, monospace)',
                                                    fontSize: 12, fontWeight: 700, color: 'var(--success)',
                                                }}>{c.leads}</div>
                                                <div style={{
                                                    fontFamily: 'var(--font-montserrat, sans-serif)',
                                                    fontSize: 11, color: 'var(--text-secondary)',
                                                }}>leads</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom spacer */}
                <div style={{ height: 16 }} />
            </div>

            <MobileBottomNav />
        </div>
    )
}

// ─── Loading / Empty states ────────────────────────────────────────────────────

function MobileLoading() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MobileGlobalStyles />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <Loader2 size={28} style={{ color: 'var(--imi-gold-500)', animation: 'spin 1s linear infinite' }} />
                <style suppressHydrationWarning>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <span style={{ fontFamily: 'var(--font-montserrat, sans-serif)', fontSize: 12, color: 'var(--text-secondary)' }}>
                    Carregando analytics...
                </span>
            </div>
        </div>
    )
}

function MobileEmpty({ onBack }: { onBack: () => void }) {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
            <MobileGlobalStyles />
            <BarChart3 size={40} style={{ color: 'rgba(184,148,58,0.25)' }} />
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 18, fontWeight: 600, color: 'var(--imi-cream)', marginBottom: 6 }}>
                    Sem dados de analytics
                </div>
                <div style={{ fontFamily: 'var(--font-montserrat, sans-serif)', fontSize: 12, color: 'var(--text-secondary)' }}>
                    Nenhum dado de analytics encontrado
                </div>
            </div>
            <button
                onClick={onBack}
                style={{
                    height: 44, padding: '0 24px', borderRadius: 6,
                    background: 'rgba(184,148,58,0.12)',
                    border: '1px solid rgba(184,148,58,0.25)',
                    color: 'var(--imi-gold-500)',
                    fontFamily: 'var(--font-montserrat, sans-serif)',
                    fontSize: 12, fontWeight: 700,
                    cursor: 'pointer',
                }}
            >
                Voltar
            </button>
        </div>
    )
}

function DesktopLoading() {
    return (
        <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: T.accent }} />
        </div>
    )
}

function DesktopEmpty({ onBack }: { onBack: () => void }) {
    return (
        <div className="text-center py-32" style={{ color: T.textDim }}>
            <BarChart3 size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm">Nenhum dado de analytics encontrado</p>
            <button onClick={onBack}
                className="mt-4 text-sm font-semibold px-4 py-2 rounded-lg" style={{ color: T.accent }}>
                Voltar
            </button>
        </div>
    )
}

// ─── Main Page Component ───────────────────────────────────────────────────────

export default function ImovelAnalyticsPage() {
    const params = useParams()
    const router = useRouter()
    const isMobile = useIsMobile()
    const [periodoFilter, setPeriodoFilter] = useState('30d')
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchAnalytics() {
            setLoading(true)
            try {
                const res = await fetch(`/api/developments/analytics?id=${params.id}&range=${periodoFilter}`)
                if (!res.ok) throw new Error('Falha ao carregar')
                const result = await res.json()
                setData(result)
            } catch (err) {
                console.error('Erro ao buscar analytics:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchAnalytics()
    }, [params.id, periodoFilter])

    if (loading) {
        return isMobile ? <MobileLoading /> : <DesktopLoading />
    }

    if (!data) {
        return isMobile
            ? <MobileEmpty onBack={() => router.back()} />
            : <DesktopEmpty onBack={() => router.back()} />
    }

    if (isMobile) {
        return (
            <MobileAnalytics
                data={data}
                periodoFilter={periodoFilter}
                setPeriodoFilter={setPeriodoFilter}
                params={params as { id: string }}
                router={router}
            />
        )
    }

    // ── Desktop tree (unchanged) ──────────────────────────────────────────────

    const { kpis, performanceTemporal, fontesTrafico, devices, topLocations, topCampaigns, development } = data
    const location = [development.neighborhood, development.city, development.state].filter(Boolean).join(', ') || '—'

    const KPI_CARDS = [
        { label: 'Total Cliques', value: kpis.totalClicks.toLocaleString('pt-BR'), icon: MousePointer, color: '#A89EC4' },
        { label: 'Links Ativos', value: kpis.trackedLinksCount, icon: Link2, color: 'var(--bo-accent)' },
        { label: 'Leads Gerados', value: kpis.totalLeads, icon: Users, color: '#E8A87C' },
        { label: 'Conversões', value: kpis.convertedLeads, icon: Target, color: 'var(--bo-success)' },
        { label: 'Taxa Conversão', value: `${kpis.taxaConversao}%`, icon: TrendingUp, color: 'var(--bo-accent)' },
        { label: 'Eventos', value: kpis.totalEvents, icon: BarChart3, color: '#A89EC4' },
    ]

    // Device totals
    const totalDeviceHits = Object.values(devices).reduce((s, v) => s + v, 0) || 1
    const deviceList = Object.entries(devices)
        .sort((a, b) => b[1] - a[1])
        .map(([device, count]) => ({
            device: device === 'mobile' ? 'Mobile' : device === 'desktop' ? 'Desktop' : device === 'tablet' ? 'Tablet' : device,
            count,
            percentage: Math.round((count / totalDeviceHits) * 100),
        }))

    const periodLabel = periodoFilter === '7d' ? '7' : periodoFilter === '90d' ? '90' : '30'

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Back nav */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push(`/backoffice/imoveis/${params.id}`)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textDim }}
                >
                    <ArrowLeft size={17} />
                </button>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: T.textMuted }}>
                    {development.name} / Analytics
                </span>
            </div>

            {/* Header */}
            <PageIntelHeader
                moduleLabel="PERFORMANCE ANALYTICS"
                title={`Analytics · ${development.name}`}
                subtitle={`${location} · Últimos ${periodLabel} dias`}
                live
                actions={
                    <select
                        value={periodoFilter}
                        onChange={e => setPeriodoFilter(e.target.value)}
                        className="h-10 px-4 rounded-[6px] text-sm outline-none"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    >
                        <option value="7d">Últimos 7 dias</option>
                        <option value="30d">Últimos 30 dias</option>
                        <option value="90d">Últimos 90 dias</option>
                    </select>
                }
            />

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {KPI_CARDS.map(k => (
                    <div
                        key={k.label}
                        className="rounded-lg p-4"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                    >
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                            style={{ background: `${k.color}18` }}
                        >
                            <k.icon size={15} style={{ color: k.color }} />
                        </div>
                        <p className="text-2xl font-bold" style={{ color: T.text }}>{k.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: T.textDim }}>
                            {k.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Performance Chart — Bloomberg bar chart style */}
            <div className="rounded-lg p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: T.textMuted }}>
                            Performance Temporal
                        </p>
                        <h2 className="text-base font-bold" style={{ color: T.text }}>
                            Cliques & Leads · Últimos {periodLabel} Dias
                        </h2>
                    </div>
                    <div className="flex items-center gap-4 text-[11px]">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: T.accent }} />
                            <span style={{ color: T.textDim }}>Cliques</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--bo-success)' }} />
                            <span style={{ color: T.textDim }}>Leads</span>
                        </div>
                    </div>
                </div>
                {performanceTemporal.length === 0 || performanceTemporal.every(d => d.clicks === 0) ? (
                    <div className="text-center py-12" style={{ color: T.textDim }}>
                        <BarChart3 size={28} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum dado de tracking nesse período</p>
                        <p className="text-xs mt-1">Crie links rastreáveis em Tracking → QR Code</p>
                    </div>
                ) : (() => {
                    const chartData = performanceTemporal.slice(-14).map(d => ({
                        label: new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                        value: d.clicks,
                        leads: d.leads,
                    }))
                    return (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--imi-gold-500)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--imi-gold-500)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6BB87B" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6BB87B" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(184,148,58,0.08)" vertical={false} />
                                <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-montserrat)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid rgba(184,148,58,0.25)', borderRadius: 6, fontSize: 12, color: 'var(--imi-cream)' }} cursor={{ stroke: 'rgba(184,148,58,0.2)' }} />
                                <Area type="monotone" dataKey="value" name="Cliques" stroke="var(--imi-gold-500)" strokeWidth={2} fill="url(#viewsGrad)" dot={false} />
                                <Area type="monotone" dataKey="leads" name="Leads" stroke="#6BB87B" strokeWidth={1.5} fill="url(#leadsGrad)" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )
                })()}
            </div>

            {/* Sources + Locations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Traffic Sources */}
                <div className="rounded-lg p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: T.textMuted }}>
                        Fontes de Tráfego
                    </p>
                    <h3 className="text-sm font-bold mb-5" style={{ color: T.text }}>Origem dos Acessos</h3>
                    {fontesTrafico.length === 0 ? (
                        <p className="text-sm py-8 text-center" style={{ color: T.textDim }}>Sem dados de fonte</p>
                    ) : (() => {
                        const sourcesData = fontesTrafico.map(f => ({ name: f.source, value: f.visits }))
                        return (
                            <div>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={sourcesData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                                            {sourcesData.map((_: { name: string; value: number }, i: number) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid rgba(184,148,58,0.25)', borderRadius: 6, fontSize: 12, color: 'var(--imi-cream)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2 mt-2">
                                    {fontesTrafico.map((f, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                                                <span className="text-sm font-medium" style={{ color: T.text }}>{f.source}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold" style={{ color: T.text }}>{f.visits}</span>
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-[6px]" style={{ background: `${T.accent}18`, color: T.accent }}>
                                                    {f.percentage}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })()}
                </div>

                {/* Locations */}
                <div className="rounded-lg p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: T.textMuted }}>
                        Localização
                    </p>
                    <h3 className="text-sm font-bold mb-5" style={{ color: T.text }}>Top Localizações</h3>
                    {topLocations.length === 0 ? (
                        <p className="text-sm py-8 text-center" style={{ color: T.textDim }}>Sem dados de localização</p>
                    ) : (
                        <div className="space-y-2">
                            {topLocations.map((loc, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-lg"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: `${T.accent}18` }}
                                        >
                                            <MapPin size={12} style={{ color: T.accent }} />
                                        </div>
                                        <span className="text-sm font-medium" style={{ color: T.text }}>{loc.city}</span>
                                    </div>
                                    <span
                                        className="text-sm font-bold px-2 py-0.5 rounded-lg"
                                        style={{ background: `${T.accent}15`, color: T.accent }}
                                    >
                                        {loc.percentage}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Devices + Campaigns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Devices */}
                <div className="rounded-lg p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: T.textMuted }}>
                        Dispositivos
                    </p>
                    <h3 className="text-sm font-bold mb-5" style={{ color: T.text }}>Breakdown por Dispositivo</h3>
                    {deviceList.length === 0 ? (
                        <p className="text-sm py-8 text-center" style={{ color: T.textDim }}>Sem dados de dispositivo</p>
                    ) : (
                        <div className="space-y-4">
                            {deviceList.map((d, idx) => (
                                <div key={idx}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-semibold" style={{ color: T.text }}>{d.device}</span>
                                        <span className="text-sm font-bold" style={{ color: T.text }}>{d.percentage}%</span>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(168,158,196,0.15)' }}>
                                        <div className="h-full rounded-full" style={{ width: `${d.percentage}%`, background: '#A89EC4' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Campaigns */}
                <div className="rounded-lg p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: T.textMuted }}>
                        Campanhas
                    </p>
                    <h3 className="text-sm font-bold mb-5" style={{ color: T.text }}>Top Campanhas</h3>
                    {topCampaigns.length === 0 ? (
                        <p className="text-sm py-8 text-center" style={{ color: T.textDim }}>Nenhuma campanha rastreada</p>
                    ) : (
                        <div className="space-y-2">
                            {topCampaigns.map((c, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3.5 rounded-lg"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                            style={{ background: `${T.accent}18`, color: T.accent }}
                                        >
                                            {idx + 1}
                                        </div>
                                        <span className="text-sm font-medium truncate" style={{ color: T.text }}>{c.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0 ml-3">
                                        <div className="text-right">
                                            <div className="text-xs font-bold" style={{ color: T.text }}>{c.clicks}</div>
                                            <div className="text-[10px]" style={{ color: T.textDim }}>cliques</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold" style={{ color: 'var(--bo-success)' }}>{c.leads}</div>
                                            <div className="text-[10px]" style={{ color: T.textDim }}>leads</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
