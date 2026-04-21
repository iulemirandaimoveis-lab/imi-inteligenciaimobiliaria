'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
    Building2, Bed, Bath, Maximize2,
    Plus, Search, BarChart2,
    Eye, ExternalLink, Tag,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { PageIntelHeader, KPICard, FilterTabs } from '@/app/(backoffice)/components/ui'
import type { FilterTab } from '@/app/(backoffice)/components/ui'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { MobileGlobalStyles, MobileAppBar } from '../mobile-ui'
import { getScoreStyle } from '@/hooks/useScore'

// Derive status config from centralized constants
const buildStatus = (key: string) => {
    const cfg = getStatusConfig(key)
    return { label: cfg.label, color: cfg.dot, bg: `${cfg.dot}1f` }
}
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    publicado:  buildStatus('publicado'),
    published:  buildStatus('publicado'),
    rascunho:   buildStatus('rascunho'),
    draft:      buildStatus('rascunho'),
    vendido:    buildStatus('vendido'),
    sold:       buildStatus('vendido'),
    campanha:   buildStatus('lancamento'),
    campaign:   buildStatus('lancamento'),
}

const VIEW_TABS = [
    { key: 'listings',     label: 'Listagem' },
    { key: 'performance',  label: 'Performance' },
]

// ─── Mobile KPI icons ─────────────────────────────────────────────────────────

function KpiIcon({ children, color }: { children: React.ReactNode; color: string }) {
    return (
        <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
            flexShrink: 0,
        }}>
            {children}
        </div>
    )
}

// ─── Mobile Inventario Component ─────────────────────────────────────────────

interface InventoryDevelopment {
    id: string
    name?: string
    slug?: string
    status?: string
    status_commercial?: string
    status_comercial?: string
    type?: string
    tipo?: string
    price_min?: number
    price_max?: number
    gallery_images?: string[]
    views?: number
    address?: string
    bedrooms_min?: number
    bedrooms_max?: number
    area_from?: number
    area_to?: number
    units_total?: number
    units_available?: number
    bedrooms?: number
    bathrooms?: number
    area?: number
    [key: string]: unknown
}

interface MobileInventarioProps {
    developments: InventoryDevelopment[]
    filtered: InventoryDevelopment[]
    loading: boolean
    busca: string
    setBusca: (v: string) => void
    activeType: string
    setActiveType: (v: string) => void
    totalPublished: number
    totalSold: number
    totalCampaign: number
    totalDraft: number
}

function MobileInventario({
    developments,
    filtered,
    loading,
    busca,
    setBusca,
    activeType,
    setActiveType,
    totalPublished,
    totalSold,
    totalCampaign,
}: MobileInventarioProps) {
    const getStatus = (d: InventoryDevelopment) => {
        const s = d.status_commercial || d.status_comercial || 'draft'
        return STATUS_CONFIG[s] || { label: s, color: '#5C6B7D', bg: 'var(--bg-elevated)' }
    }

    const getPrice = (d: InventoryDevelopment) => {
        const v = d.price_min || d.price_max
        if (!v) return null
        return `R$ ${Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
    }

    const getImage = (d: InventoryDevelopment) => {
        const g = d.gallery_images
        if (Array.isArray(g) && g.length > 0) return g[0]
        return null
    }

    const FILTER_CHIPS = [
        { value: 'all',        label: 'Todos',       count: developments.length },
        { value: 'apartment',  label: 'Residencial', count: developments.filter(d => d.type !== 'commercial' && d.tipo !== 'comercial').length },
        { value: 'commercial', label: 'Comercial',   count: developments.filter(d => d.type === 'commercial' || d.tipo === 'comercial').length },
        { value: 'draft',      label: 'Rascunhos',   count: developments.filter(d => ['draft', 'rascunho'].includes(d.status_commercial || d.status_comercial || '')).length },
    ]

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-base)',
            paddingTop: 72,
            paddingBottom: 80,
        }}>
            <MobileGlobalStyles />

            {/* AppBar */}
            <MobileAppBar
                title="Inventário"
                subtitle="Portfolio de empreendimentos"
                actions={
                    <Link href="/backoffice/imoveis/novo" style={{ textDecoration: 'none' }}>
                        <button
                            className="mob-btn-tap"
                            style={{
                                width: 44, height: 44, borderRadius: 10,
                                background: 'rgba(200,164,74,.15)',
                                border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--accent-400)',
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent',
                            } as React.CSSProperties}
                        >
                            <Plus size={22} />
                        </button>
                    </Link>
                }
            />

            {/* KPI Strip — 2×2 grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 10, padding: '0 16px 16px',
            }}>
                {/* Total */}
                <div style={{
                    background: 'var(--bg-elevated)', borderRadius: 12, padding: 14,
                    display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                            fontFamily: 'var(--font-outfit, sans-serif)',
                            fontSize: 9, fontWeight: 600, letterSpacing: '1.5px',
                            textTransform: 'uppercase' as const, color: '#5C6B7D',
                        }}>Total</span>
                        <KpiIcon color="#5B9BD5"><Building2 size={14} /></KpiIcon>
                    </div>
                    <span style={{
                        fontFamily: 'var(--font-dm-mono, monospace)',
                        fontSize: 22, fontWeight: 700, color: '#EBE7E0',
                        lineHeight: 1,
                    }}>{loading ? '—' : developments.length}</span>
                </div>

                {/* Publicados */}
                <div style={{
                    background: 'var(--bg-elevated)', borderRadius: 12, padding: 14,
                    display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                            fontFamily: 'var(--font-outfit, sans-serif)',
                            fontSize: 9, fontWeight: 600, letterSpacing: '1.5px',
                            textTransform: 'uppercase' as const, color: '#5C6B7D',
                        }}>Publicados</span>
                        <KpiIcon color="#5DB887"><Eye size={14} /></KpiIcon>
                    </div>
                    <span style={{
                        fontFamily: 'var(--font-dm-mono, monospace)',
                        fontSize: 22, fontWeight: 700, color: '#EBE7E0',
                        lineHeight: 1,
                    }}>{loading ? '—' : totalPublished}</span>
                </div>

                {/* Vendidos */}
                <div style={{
                    background: 'var(--bg-elevated)', borderRadius: 12, padding: 14,
                    display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                            fontFamily: 'var(--font-outfit, sans-serif)',
                            fontSize: 9, fontWeight: 600, letterSpacing: '1.5px',
                            textTransform: 'uppercase' as const, color: '#5C6B7D',
                        }}>Vendidos</span>
                        <KpiIcon color="#D4913A"><Building2 size={14} /></KpiIcon>
                    </div>
                    <span style={{
                        fontFamily: 'var(--font-dm-mono, monospace)',
                        fontSize: 22, fontWeight: 700, color: '#EBE7E0',
                        lineHeight: 1,
                    }}>{loading ? '—' : totalSold}</span>
                </div>

                {/* Em Campanha */}
                <div style={{
                    background: 'var(--bg-elevated)', borderRadius: 12, padding: 14,
                    display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                            fontFamily: 'var(--font-outfit, sans-serif)',
                            fontSize: 9, fontWeight: 600, letterSpacing: '1.5px',
                            textTransform: 'uppercase' as const, color: '#5C6B7D',
                        }}>Em Campanha</span>
                        <KpiIcon color="var(--accent-400)"><Tag size={14} /></KpiIcon>
                    </div>
                    <span style={{
                        fontFamily: 'var(--font-dm-mono, monospace)',
                        fontSize: 22, fontWeight: 700, color: '#EBE7E0',
                        lineHeight: 1,
                    }}>{loading ? '—' : totalCampaign}</span>
                </div>
            </div>

            {/* Search bar */}
            <div style={{ padding: '0 16px 12px', position: 'relative' }}>
                <svg
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{
                        position: 'absolute', left: 30, top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#5C6B7D', pointerEvents: 'none',
                    }}
                >
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    placeholder="Buscar empreendimento..."
                    style={{
                        width: '100%', height: 44, boxSizing: 'border-box',
                        background: 'var(--bg-elevated)',
                        border: '1px solid rgba(200,164,74,.15)',
                        borderRadius: 10,
                        padding: '0 14px 0 40px',
                        fontFamily: 'var(--font-outfit, sans-serif)',
                        fontSize: 14, color: '#EBE7E0',
                        outline: 'none',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                    } as React.CSSProperties}
                />
            </div>

            {/* Filter chips */}
            <div style={{
                display: 'flex', gap: 8, overflowX: 'auto',
                padding: '0 16px 16px',
                scrollbarWidth: 'none' as const,
            }}>
                <style suppressHydrationWarning>{`.inv-chips::-webkit-scrollbar{display:none}`}</style>
                {FILTER_CHIPS.map(chip => {
                    const isActive = activeType === chip.value
                    return (
                        <button
                            key={chip.value}
                            onClick={() => setActiveType(chip.value)}
                            className="mob-chip-tap"
                            style={{
                                flexShrink: 0,
                                display: 'flex', alignItems: 'center', gap: 5,
                                height: 32, padding: '0 12px',
                                borderRadius: 6,
                                background: isActive ? 'var(--accent-400)' : 'transparent',
                                border: `1px solid ${isActive ? 'var(--accent-400)' : 'rgba(200,164,74,.30)'}`,
                                color: isActive ? '#0B1120' : '#9FAAB8',
                                fontFamily: 'var(--font-outfit, sans-serif)',
                                fontSize: 11, fontWeight: isActive ? 700 : 500,
                                cursor: 'pointer',
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent',
                                whiteSpace: 'nowrap',
                            } as React.CSSProperties}
                        >
                            {chip.label}
                            <span style={{
                                fontFamily: 'var(--font-dm-mono, monospace)',
                                fontSize: 10, fontWeight: 700,
                                color: isActive ? '#0B1120' : '#5C6B7D',
                                marginLeft: 2,
                            }}>{chip.count}</span>
                        </button>
                    )
                })}
            </div>

            {/* Content area */}
            <div style={{ padding: '0 16px' }}>
                {/* Loading skeletons */}
                {loading && (
                    <>
                        <style suppressHydrationWarning>{`
                            @keyframes inv-shimmer {
                                0%   { background-position: -200% center; }
                                100% { background-position:  200% center; }
                            }
                        `}</style>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{
                                borderRadius: 12, overflow: 'hidden',
                                marginBottom: 12,
                                background: 'var(--bg-elevated)',
                                border: '1px solid rgba(200,164,74,.12)',
                            }}>
                                {/* Image skeleton */}
                                <div style={{
                                    aspectRatio: '3/2',
                                    background: `linear-gradient(90deg, #162040 25%, #1A3250 50%, #162040 75%)`,
                                    backgroundSize: '200% 100%',
                                    animation: 'inv-shimmer 1.5s ease-in-out infinite',
                                }} />
                                {/* Body skeleton */}
                                <div style={{ padding: '12px 14px' }}>
                                    <div style={{
                                        height: 14, borderRadius: 6, marginBottom: 8,
                                        background: `linear-gradient(90deg, #1A3250 25%, #101830 50%, #1A3250 75%)`,
                                        backgroundSize: '200% 100%',
                                        animation: 'inv-shimmer 1.5s ease-in-out infinite',
                                        width: '70%',
                                    }} />
                                    <div style={{
                                        height: 10, borderRadius: 6,
                                        background: `linear-gradient(90deg, #1A3250 25%, #101830 50%, #1A3250 75%)`,
                                        backgroundSize: '200% 100%',
                                        animation: 'inv-shimmer 1.5s ease-in-out infinite',
                                        width: '40%',
                                    }} />
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', padding: '60px 24px', gap: 16, textAlign: 'center',
                    }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: 20,
                            background: 'rgba(200,164,74,.06)',
                            border: '1px solid rgba(200,164,74,.18)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Building2 size={32} style={{ color: 'rgba(200,164,74,.35)' }} />
                        </div>
                        <div>
                            <div style={{
                                fontFamily: 'var(--font-playfair, serif)',
                                fontSize: 18, fontWeight: 600, color: '#EBE7E0', marginBottom: 6,
                            }}>Nenhum empreendimento</div>
                            <div style={{
                                fontFamily: 'var(--font-outfit, sans-serif)',
                                fontSize: 13, color: '#5C6B7D', lineHeight: 1.6,
                            }}>
                                {busca ? 'Nenhum resultado para sua busca.' : 'Adicione seu primeiro imóvel.'}
                            </div>
                        </div>
                        <Link href="/backoffice/imoveis/novo" style={{ textDecoration: 'none' }}>
                            <button
                                className="mob-btn-tap"
                                style={{
                                    height: 44, padding: '0 24px', borderRadius: 10,
                                    background: 'var(--btn-primary-bg)', border: 'none', cursor: 'pointer',
                                    fontFamily: 'var(--font-outfit, sans-serif)',
                                    fontSize: 12, fontWeight: 700, letterSpacing: '1px',
                                    textTransform: 'uppercase' as const, color: '#0B1120',
                                    touchAction: 'manipulation',
                                    WebkitTapHighlightColor: 'transparent',
                                } as React.CSSProperties}
                            >
                                + Cadastrar imóvel
                            </button>
                        </Link>
                    </div>
                )}

                {/* Property cards */}
                {!loading && filtered.map((d) => {
                    const status = getStatus(d)
                    const price = getPrice(d)
                    const image = getImage(d)

                    return (
                        <Link
                            key={d.id}
                            href={`/backoffice/imoveis/${d.id}`}
                            style={{
                                display: 'block', textDecoration: 'none', color: 'inherit',
                                marginBottom: 12,
                            }}
                        >
                            <div
                                className="mob-card-inner"
                                style={{
                                    background: 'var(--bg-elevated)',
                                    borderRadius: 12,
                                    border: '1px solid rgba(200,164,74,.12)',
                                    overflow: 'hidden',
                                    touchAction: 'manipulation',
                                    WebkitTapHighlightColor: 'transparent',
                                } as React.CSSProperties}
                            >
                                {/* Image container — 3:2 ratio, gradient overlay */}
                                <div style={{ position: 'relative', aspectRatio: '3/2', background: 'var(--bg-muted)' }}>
                                    {image ? (
                                        <Image
                                            src={image}
                                            alt={d.name || 'Imóvel'}
                                            fill
                                            sizes="(max-width: 768px) 100vw"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '100%', height: '100%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: 'linear-gradient(135deg, #162040 0%, #1A3250 100%)',
                                        }}>
                                            <Building2 size={44} style={{ color: 'rgba(200,164,74,.15)' }} />
                                        </div>
                                    )}

                                    {/* Gradient overlay */}
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: 'linear-gradient(to top, rgba(11,25,40,0.97) 0%, transparent 60%)',
                                        borderRadius: '12px 12px 0 0',
                                    }} />

                                    {/* Status badge — top-left */}
                                    <div style={{ position: 'absolute', top: 10, left: 10 }}>
                                        <span style={{
                                            fontFamily: 'var(--font-outfit, sans-serif)',
                                            fontSize: 9, fontWeight: 700, letterSpacing: '0.8px',
                                            textTransform: 'uppercase' as const,
                                            color: status.color,
                                            background: status.bg,
                                            border: `1px solid ${status.color}40`,
                                            padding: '4px 8px', borderRadius: 6,
                                        }}>
                                            {status.label}
                                        </span>
                                    </div>

                                    {/* Property name + status at image bottom */}
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        padding: '12px 14px',
                                    }}>
                                        <div style={{
                                            fontFamily: 'var(--font-playfair, serif)',
                                            fontSize: 15, fontWeight: 700, color: '#EBE7E0',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>{d.name}</div>
                                    </div>
                                </div>

                                {/* Card body — price + specs */}
                                <div style={{ padding: '12px 14px' }}>
                                    {/* Price */}
                                    {price && (
                                        <div style={{
                                            fontFamily: 'var(--font-dm-mono, monospace)',
                                            fontSize: 16, fontWeight: 400, color: 'var(--accent-400)',
                                            fontVariantNumeric: 'tabular-nums',
                                            marginBottom: 8,
                                        }}>{price}</div>
                                    )}

                                    {/* Specs row */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {d.bedrooms && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Bed size={12} style={{ color: '#5C6B7D' }} />
                                                <span style={{
                                                    fontFamily: 'var(--font-dm-mono, monospace)',
                                                    fontSize: 12, color: '#9FAAB8',
                                                }}>{d.bedrooms}</span>
                                            </div>
                                        )}
                                        {d.bathrooms && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Bath size={12} style={{ color: '#5C6B7D' }} />
                                                <span style={{
                                                    fontFamily: 'var(--font-dm-mono, monospace)',
                                                    fontSize: 12, color: '#9FAAB8',
                                                }}>{d.bathrooms}</span>
                                            </div>
                                        )}
                                        {d.area && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Maximize2 size={12} style={{ color: '#5C6B7D' }} />
                                                <span style={{
                                                    fontFamily: 'var(--font-dm-mono, monospace)',
                                                    fontSize: 12, color: '#9FAAB8',
                                                }}>{d.area}m²</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

        </div>
    )
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function InventarioPage() {
    const isMobile = useIsMobile()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [developments, setDevelopments] = useState<any[]>([])
    const [viewCounts, setViewCounts] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [activeType, setActiveType] = useState('all')
    const [activeView, setActiveView] = useState<'listings' | 'performance'>('listings')
    const [busca, setBusca] = useState('')

    useEffect(() => {
        const supabase = createClient()
        Promise.all([
            supabase
                .from('developments')
                .select('id, name, slug, price_min, price_max, tipo, type, status_commercial, status_comercial, gallery_images, bedrooms, bathrooms, area, views, imi_score')
                .order('created_at', { ascending: false }),
            supabase
                .from('page_views')
                .select('development_slug')
                .not('development_slug', 'is', null),
        ]).then(([{ data: devs }, { data: pv }]) => {
            setDevelopments(devs || [])
            const counts: Record<string, number> = {}
            for (const row of pv || []) {
                if (row.development_slug) counts[row.development_slug] = (counts[row.development_slug] || 0) + 1
            }
            setViewCounts(counts)
            setLoading(false)
        })
    }, [])

    const filtered = developments.filter(d => {
        if (busca && !d.name?.toLowerCase().includes(busca.toLowerCase())) return false
        const s = d.status_commercial || d.status_comercial || ''
        if (activeType === 'all') return true
        if (activeType === 'draft') return ['draft', 'rascunho'].includes(s)
        if (activeType === 'commercial') return d.type === 'commercial' || d.tipo === 'comercial'
        return d.type !== 'commercial' && d.tipo !== 'comercial'
    })

    const getStatus = (d: InventoryDevelopment) => {
        const s = d.status_commercial || d.status_comercial || 'draft'
        return STATUS_CONFIG[s] || { label: s, color: T.textMuted, bg: T.elevated }
    }

    const getPrice = (d: InventoryDevelopment) => {
        const v = d.price_min || d.price_max
        if (!v) return null
        return `R$ ${Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
    }

    const getImage = (d: InventoryDevelopment) => {
        const g = d.gallery_images
        if (Array.isArray(g) && g.length > 0) return g[0]
        return null
    }

    const getViews = (d: InventoryDevelopment) => viewCounts[d.slug || ''] || d.views || 0

    // Summary counts
    const totalPublished = developments.filter(d => ['published', 'publicado'].includes(d.status_commercial || d.status_comercial || '')).length
    const totalSold = developments.filter(d => ['sold', 'vendido'].includes(d.status_commercial || d.status_comercial || '')).length
    const totalCampaign = developments.filter(d => ['campaign', 'campanha'].includes(d.status_commercial || d.status_comercial || '')).length
    const totalDraft = developments.filter(d => ['draft', 'rascunho'].includes(d.status_commercial || d.status_comercial || '')).length

    // ── Mobile branch ──────────────────────────────────────────────────────────
    if (isMobile) {
        return (
            <MobileInventario
                developments={developments}
                filtered={filtered}
                loading={loading}
                busca={busca}
                setBusca={setBusca}
                activeType={activeType}
                setActiveType={setActiveType}
                totalPublished={totalPublished}
                totalSold={totalSold}
                totalCampaign={totalCampaign}
                totalDraft={totalDraft}
            />
        )
    }

    // ── Desktop branch ─────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="REAL ESTATE INVENTORY"
                title="Inventário"
                subtitle="Portfólio completo de empreendimentos"
                actions={
                    <Link
                        href="/backoffice/imoveis/novo"
                        className="flex items-center gap-2 h-10 px-5 rounded-[6px] font-semibold text-sm transition-all hover:brightness-110"
                        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', textDecoration: 'none' }}
                    >
                        <Plus size={15} /> Novo Imóvel
                    </Link>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                <KPICard
                    label="Total"
                    value={loading ? '—' : String(developments.length)}
                    icon={<Building2 size={14} />}
                    accent="blue"
                    size="sm"
                />
                <KPICard
                    label="Publicados"
                    value={loading ? '—' : String(totalPublished)}
                    icon={<Eye size={14} />}
                    accent="green"
                    size="sm"
                    delta={developments.length > 0 ? Math.round((totalPublished / developments.length) * 100) : 0}
                    deltaLabel="do portfólio"
                />
                <KPICard
                    label="Vendidos"
                    value={loading ? '—' : String(totalSold)}
                    icon={<Building2 size={14} />}
                    accent="warm"
                    size="sm"
                />
                <KPICard
                    label="Em Campanha"
                    value={loading ? '—' : String(totalCampaign)}
                    icon={<Tag size={14} />}
                    accent="ai"
                    size="sm"
                />
            </div>

            {/* Controls row: view tabs + search + type filter */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* View tabs */}
                <div className="flex gap-1 p-1 rounded-lg" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                    {VIEW_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveView(tab.key as 'listings' | 'performance')}
                            className="px-4 min-h-[44px] py-2.5 rounded-lg text-xs font-bold transition-all"
                            style={{
                                background: activeView === tab.key ? T.surface : 'transparent',
                                border: activeView === tab.key ? `1px solid ${T.border}` : '1px solid transparent',
                                color: activeView === tab.key ? T.text : T.textMuted,
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="flex-1 min-w-[180px] relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                    <input
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        placeholder="Buscar empreendimento..."
                        className="w-full h-10 pl-9 pr-4 rounded-[6px] text-sm focus:outline-none"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    />
                </div>
            </div>

            {/* Type FilterTabs */}
            <FilterTabs
                tabs={[
                    { id: 'all',        label: 'Todos',       count: developments.length },
                    { id: 'apartment',  label: 'Residencial', count: developments.filter(d => d.type !== 'commercial' && d.tipo !== 'comercial').length },
                    { id: 'commercial', label: 'Comercial',   count: developments.filter(d => d.type === 'commercial' || d.tipo === 'comercial').length },
                    { id: 'draft',      label: 'Rascunhos',   count: totalDraft, dotColor: getStatusConfig('rascunho').dot },
                ] as FilterTab[]}
                active={activeType}
                onChange={setActiveType}
            />

            {/* Loading skeleton */}
            {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse rounded-lg h-80"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, opacity: 0.5 }} />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 rounded-lg"
                    style={{ background: T.surface, border: `1px dashed ${T.border}` }}>
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-4"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <Building2 size={28} style={{ color: T.textMuted, opacity: 0.4 }} />
                    </div>
                    <p className="font-semibold mb-1" style={{ color: T.text }}>Nenhum empreendimento encontrado</p>
                    <Link
                        href="/backoffice/imoveis/novo"
                        className="mt-3 text-sm font-bold"
                        style={{ color: T.accent, textDecoration: 'none' }}
                    >
                        + Cadastrar primeiro imóvel
                    </Link>
                </div>
            )}

            {/* LISTINGS VIEW */}
            {!loading && filtered.length > 0 && activeView === 'listings' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((d, i) => {
                        const status = getStatus(d)
                        const price = getPrice(d)
                        const image = getImage(d)
                        const isSold = ['sold', 'vendido'].includes(d.status_commercial || d.status_comercial)

                        return (
                            <motion.div
                                key={d.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                            >
                                <Link href={`/backoffice/imoveis/${d.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                                    <div
                                        className="rounded-lg overflow-hidden transition-shadow hover:shadow-xl"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                                    >
                                        {/* Image */}
                                        <div className="relative h-44 overflow-hidden" style={{ background: T.surface }}>
                                            {image ? (
                                                <Image src={image} alt={d.name} fill className="object-cover" loading="lazy" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Building2 size={36} style={{ color: T.textMuted, opacity: 0.25 }} />
                                                </div>
                                            )}
                                            {/* Gradient overlay */}
                                            <div className="absolute inset-0"
                                                style={{ background: 'linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.55) 100%)' }} />
                                            {/* Status badge */}
                                            <div className="absolute top-3 left-3">
                                                <span
                                                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-[6px] backdrop-blur-md"
                                                    style={{
                                                        background: status.bg,
                                                        color: status.color,
                                                        border: `1px solid ${status.color}40`,
                                                    }}
                                                >
                                                    {status.label}
                                                </span>
                                            </div>
                                            {/* Price */}
                                            {price && (
                                                <div className="absolute bottom-3 right-3">
                                                    <span className="text-sm font-bold text-white"
                                                        style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
                                                        {price}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Sold out overlay */}
                                            {isSold && (
                                                <div className="absolute inset-0 flex items-center justify-center"
                                                    style={{ background: 'rgba(0,0,0,0.45)' }}>
                                                    <span className="text-xl font-black text-orange-400 uppercase tracking-[0.15em]"
                                                        style={{ border: '2px solid #f97316', padding: '4px 14px', borderRadius: 6 }}>
                                                        Sold Out
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-4">
                                            <p className="font-bold text-sm mb-2 truncate" style={{ color: T.text }}>
                                                {d.name}
                                            </p>
                                            <div className="flex items-center gap-4">
                                                {d.bedrooms && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Bed size={12} style={{ color: T.textMuted }} />
                                                        <span className="text-xs font-medium" style={{ color: T.textMuted }}>{d.bedrooms}</span>
                                                    </div>
                                                )}
                                                {d.bathrooms && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Bath size={12} style={{ color: T.textMuted }} />
                                                        <span className="text-xs font-medium" style={{ color: T.textMuted }}>{d.bathrooms}</span>
                                                    </div>
                                                )}
                                                {d.area && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Maximize2 size={12} style={{ color: T.textMuted }} />
                                                        <span className="text-xs font-medium" style={{ color: T.textMuted }}>{d.area}m²</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* PERFORMANCE VIEW */}
            {!loading && filtered.length > 0 && activeView === 'performance' && (
                <div className="space-y-2">
                    {/* Header row */}
                    <div className="grid grid-cols-[1fr_80px_100px_130px] gap-3 px-4 pb-1">
                        {['Imóvel', 'Score', 'Visitas (30d)', 'Analytics'].map(h => (
                            <p key={h} className="text-[9px] font-bold uppercase tracking-[0.12em]"
                                style={{ color: T.textMuted }}>
                                {h}
                            </p>
                        ))}
                    </div>

                    {filtered.map((d, i) => {
                        const status = getStatus(d)
                        const views = getViews(d)
                        const image = getImage(d)
                        const score = d.imi_score ?? 0
                        const scoreStyle = getScoreStyle(score)

                        return (
                            <motion.div
                                key={d.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                whileHover={{ x: 2, transition: { duration: 0.12 } }}
                            >
                                <div
                                    className="grid grid-cols-[1fr_80px_100px_130px] gap-3 items-center px-4 py-3.5 rounded-lg"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                                >
                                    {/* Property info */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0"
                                            style={{ background: T.surface }}>
                                            {image ? (
                                                <Image src={image} alt={d.name} fill className="object-cover" loading="lazy" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Building2 size={16} style={{ color: T.textMuted, opacity: 0.4 }} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold truncate" style={{ color: T.text }}>
                                                {d.name}
                                            </p>
                                            <span
                                                className="text-[9px] font-bold uppercase tracking-wider"
                                                style={{ color: status.color }}
                                            >
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* IMI Score */}
                                    <div>
                                        {score > 0 ? (
                                            <span
                                                className="text-xs font-bold px-2 py-1 rounded-[6px]"
                                                style={{
                                                    color: scoreStyle.color,
                                                    background: scoreStyle.bg,
                                                    border: `1px solid ${scoreStyle.color}30`,
                                                }}
                                            >
                                                {score}
                                            </span>
                                        ) : (
                                            <span className="text-xs" style={{ color: T.textMuted }}>—</span>
                                        )}
                                    </div>

                                    {/* Views */}
                                    <div className="flex items-center gap-2">
                                        <Eye size={13} style={{ color: T.textMuted }} />
                                        <span className="text-sm font-bold" style={{ color: T.text }}>
                                            {views.toLocaleString('pt-BR')}
                                        </span>
                                    </div>

                                    {/* Analytics link */}
                                    <div>
                                        <Link
                                            href={`/backoffice/imoveis/${d.id}/analytics`}
                                            className="flex items-center gap-1.5 text-xs font-bold"
                                            style={{ color: T.accent, textDecoration: 'none' }}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <BarChart2 size={12} /> Ver analytics <ExternalLink size={10} />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
