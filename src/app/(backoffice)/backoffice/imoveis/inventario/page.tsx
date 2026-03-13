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

export default function InventarioPage() {
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
                .select('id, name, slug, price_min, price_max, tipo, type, status_commercial, status_comercial, gallery_images, bedrooms, bathrooms, area, views')
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

    const getStatus = (d: any) => {
        const s = d.status_commercial || d.status_comercial || 'draft'
        return STATUS_CONFIG[s] || { label: s, color: T.textMuted, bg: T.elevated }
    }

    const getPrice = (d: any) => {
        const v = d.price_min || d.price_max
        if (!v) return null
        return `R$ ${Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
    }

    const getImage = (d: any) => {
        const g = d.gallery_images
        if (Array.isArray(g) && g.length > 0) return g[0]
        return null
    }

    const getViews = (d: any) => viewCounts[d.slug] || d.views || 0

    // Summary counts
    const totalPublished = developments.filter(d => ['published', 'publicado'].includes(d.status_commercial || d.status_comercial || '')).length
    const totalSold = developments.filter(d => ['sold', 'vendido'].includes(d.status_commercial || d.status_comercial || '')).length

    const totalCampaign = developments.filter(d => ['campaign', 'campanha'].includes(d.status_commercial || d.status_comercial || '')).length
    const totalDraft = developments.filter(d => ['draft', 'rascunho'].includes(d.status_commercial || d.status_comercial || '')).length

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
                        className="flex items-center gap-2 h-10 px-5 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110"
                        style={{ background: T.accent, textDecoration: 'none' }}
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
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                    {VIEW_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveView(tab.key as any)}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
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
                        className="w-full h-10 pl-9 pr-4 rounded-xl text-sm focus:outline-none"
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
                        <div key={i} className="animate-pulse rounded-2xl h-80"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, opacity: 0.5 }} />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 rounded-2xl"
                    style={{ background: T.surface, border: `1px dashed ${T.border}` }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
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
                                        className="rounded-2xl overflow-hidden transition-shadow hover:shadow-xl"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                                    >
                                        {/* Image */}
                                        <div className="relative h-44 overflow-hidden" style={{ background: T.surface }}>
                                            {image ? (
                                                <Image src={image} alt={d.name} fill className="object-cover" />
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
                                                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full backdrop-blur-md"
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
                    <div className="grid grid-cols-[1fr_100px_130px] gap-3 px-4 pb-1">
                        {['Imóvel', 'Visitas (30d)', 'Analytics'].map(h => (
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

                        return (
                            <motion.div
                                key={d.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                whileHover={{ x: 2, transition: { duration: 0.12 } }}
                            >
                                <div
                                    className="grid grid-cols-[1fr_100px_130px] gap-3 items-center px-4 py-3.5 rounded-2xl"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                                >
                                    {/* Property info */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0"
                                            style={{ background: T.surface }}>
                                            {image ? (
                                                <Image src={image} alt={d.name} fill className="object-cover" />
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
