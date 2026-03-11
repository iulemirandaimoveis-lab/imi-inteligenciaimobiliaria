'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
    Building2, Bed, Bath, Maximize2,
    Plus, Search, Filter, BarChart2,
    Eye, ExternalLink,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    publicado:  { label: 'Publicado',   color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
    published:  { label: 'Publicado',   color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
    rascunho:   { label: 'Rascunho',    color: '#facc15', bg: 'rgba(250,204,21,0.12)' },
    draft:      { label: 'Rascunho',    color: '#facc15', bg: 'rgba(250,204,21,0.12)' },
    vendido:    { label: 'Sold Out',    color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    sold:       { label: 'Sold Out',    color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    campanha:   { label: 'Em Campanha', color: '#818CF8', bg: 'rgba(129,140,248,0.12)' },
    campaign:   { label: 'Em Campanha', color: '#818CF8', bg: 'rgba(129,140,248,0.12)' },
}

const TYPE_FILTERS = [
    { value: 'all',        label: 'Todos' },
    { value: 'apartment',  label: 'Residencial' },
    { value: 'commercial', label: 'Comercial' },
]

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
        if (activeType === 'all') return true
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

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="REAL ESTATE INVENTORY"
                title="Inventário"
                subtitle={loading ? 'Carregando...' : `${developments.length} empreendimentos · ${totalPublished} publicados · ${totalSold} vendidos`}
                actions={
                    <Link
                        href="/backoffice/imoveis/novo"
                        className="flex items-center gap-2 h-10 px-5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.02]"
                        style={{
                            background: T.accent,
                            textDecoration: 'none',
                            boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
                        }}
                    >
                        <Plus size={15} /> Novo Imóvel
                    </Link>
                }
            />

            {/* Controls row: view tabs + search */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="flex items-center gap-3 flex-wrap"
            >
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
                        style={{
                            background: T.elevated,
                            border: `1px solid ${T.border}`,
                            color: T.text,
                        }}
                    />
                </div>
            </motion.div>

            {/* Type filter chips */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="flex items-center gap-2 flex-wrap"
            >
                {TYPE_FILTERS.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setActiveType(f.value)}
                        className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                        style={{
                            background: activeType === f.value ? T.accent : T.elevated,
                            border: `1px solid ${activeType === f.value ? T.accent : T.border}`,
                            color: activeType === f.value ? '#fff' : T.textMuted,
                        }}
                    >
                        {f.label}
                    </button>
                ))}
                <button
                    className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
                >
                    <Filter size={12} /> Filtrar
                </button>
            </motion.div>

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
