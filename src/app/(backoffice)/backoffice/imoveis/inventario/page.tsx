'use client'

import { useState, useEffect } from 'react'
import {
    Building2, Bed, Bath, Maximize2, TrendingUp,
    TrendingDown, Plus, Search, Filter, BarChart2,
    Eye, ExternalLink,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    hover: 'var(--bo-hover)',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    publicado: { label: 'Publicado', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
    published: { label: 'Publicado', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
    rascunho: { label: 'Rascunho', color: '#facc15', bg: 'rgba(250,204,21,0.12)' },
    draft: { label: 'Rascunho', color: '#facc15', bg: 'rgba(250,204,21,0.12)' },
    vendido: { label: 'Sold Out', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    sold: { label: 'Sold Out', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    campanha: { label: 'Em Campanha', color: '#818CF8', bg: 'rgba(129,140,248,0.12)' },
    campaign: { label: 'Em Campanha', color: '#818CF8', bg: 'rgba(129,140,248,0.12)' },
}

const TYPE_FILTERS = [
    { value: 'all', label: 'Todos' },
    { value: 'apartment', label: 'Residencial' },
    { value: 'commercial', label: 'Comercial' },
]

const VIEW_TABS = [
    { key: 'listings', label: 'Listagem' },
    { key: 'performance', label: 'Performance' },
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
            // Aggregate view counts by slug
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

    const getViews = (d: any) => {
        return viewCounts[d.slug] || d.views || 0
    }

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: '-0.5px' }}>Inventário</h1>
                        <p style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                            {loading ? '—' : `${developments.length} empreendimentos cadastrados`}
                        </p>
                    </div>
                    <Link
                        href="/backoffice/imoveis/novo"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            height: 44, padding: '0 20px', borderRadius: 14,
                            background: 'var(--bo-accent)',
                            color: '#fff', fontSize: 13, fontWeight: 700,
                            textDecoration: 'none', boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
                        }}
                    >
                        <Plus size={17} /> Novo Imóvel
                    </Link>
                </div>
            </motion.div>

            {/* View Tabs + Search */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
                {/* View tabs */}
                <div style={{ display: 'flex', gap: 4, background: T.elevated, borderRadius: 12, padding: 4 }}>
                    {VIEW_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveView(tab.key as any)}
                            style={{
                                padding: '8px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                                background: activeView === tab.key ? T.surface : 'transparent',
                                border: activeView === tab.key ? `1px solid ${T.border}` : '1px solid transparent',
                                color: activeView === tab.key ? T.text : T.textMuted,
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }} />
                    <input
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        placeholder="Buscar empreendimento..."
                        style={{
                            width: '100%', height: 42, paddingLeft: 36, paddingRight: 14,
                            borderRadius: 12, background: T.elevated, border: `1px solid ${T.border}`,
                            color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                        }}
                    />
                </div>
            </motion.div>

            {/* Type filter chips */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {TYPE_FILTERS.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setActiveType(f.value)}
                        style={{
                            padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                            background: activeType === f.value ? '#3B82F6' : T.elevated,
                            border: `1px solid ${activeType === f.value ? '#3B82F6' : T.border}`,
                            color: activeType === f.value ? '#fff' : T.textMuted,
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}
                    >
                        {f.label}
                    </button>
                ))}
                <div style={{ marginLeft: 'auto' }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 10, background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        <Filter size={13} /> Filtrar
                    </button>
                </div>
            </motion.div>

            {/* Loading */}
            {loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ borderRadius: 20, background: T.elevated, border: `1px solid ${T.border}`, height: 340, opacity: 0.5 }} />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
                    <Building2 size={40} style={{ color: T.textMuted, opacity: 0.4 }} />
                    <p style={{ color: T.textMuted, fontSize: 14 }}>Nenhum empreendimento encontrado</p>
                    <Link href="/backoffice/imoveis/novo" style={{ color: '#3B82F6', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                        + Cadastrar primeiro imóvel
                    </Link>
                </div>
            )}

            {/* LISTINGS VIEW */}
            {!loading && filtered.length > 0 && activeView === 'listings' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
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
                            >
                                <Link href={`/backoffice/imoveis/${d.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                                    <div style={{
                                        borderRadius: 20, overflow: 'hidden',
                                        background: T.elevated, border: `1px solid ${T.border}`,
                                        transition: 'transform 0.15s, box-shadow 0.15s',
                                        cursor: 'pointer',
                                    }}
                                        onMouseEnter={e => { (e.currentTarget as any).style.transform = 'translateY(-2px)'; (e.currentTarget as any).style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)' }}
                                        onMouseLeave={e => { (e.currentTarget as any).style.transform = 'translateY(0)'; (e.currentTarget as any).style.boxShadow = 'none' }}
                                    >
                                        {/* Image */}
                                        <div style={{ height: 180, position: 'relative', overflow: 'hidden', background: T.surface }}>
                                            {image ? (
                                                <img src={image} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Building2 size={40} style={{ color: T.textMuted, opacity: 0.3 }} />
                                                </div>
                                            )}
                                            {/* Gradient overlay */}
                                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 100%)' }} />
                                            {/* Status badge */}
                                            <div style={{ position: 'absolute', top: 12, left: 12 }}>
                                                <span style={{
                                                    fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                                                    padding: '4px 8px', borderRadius: 6,
                                                    background: status.bg, color: status.color,
                                                    backdropFilter: 'blur(8px)',
                                                    border: `1px solid ${status.color}40`,
                                                }}>
                                                    {status.label}
                                                </span>
                                            </div>
                                            {/* Price badge bottom right */}
                                            {price && (
                                                <div style={{ position: 'absolute', bottom: 10, right: 12 }}>
                                                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                                                        {price}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Sold out overlay */}
                                            {isSold && (
                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                                                    <span style={{ fontSize: 20, fontWeight: 900, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.15em', textShadow: '0 2px 8px rgba(0,0,0,0.5)', border: '2px solid #f97316', padding: '4px 12px', borderRadius: 6 }}>
                                                        Sold Out
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div style={{ padding: '14px 16px' }}>
                                            <p style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {d.name}
                                            </p>
                                            {/* Stats row */}
                                            <div style={{ display: 'flex', gap: 16 }}>
                                                {d.bedrooms && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                        <Bed size={13} style={{ color: T.textMuted }} />
                                                        <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>{d.bedrooms}</span>
                                                    </div>
                                                )}
                                                {d.bathrooms && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                        <Bath size={13} style={{ color: T.textMuted }} />
                                                        <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>{d.bathrooms}</span>
                                                    </div>
                                                )}
                                                {d.area && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                        <Maximize2 size={13} style={{ color: T.textMuted }} />
                                                        <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>{d.area}m²</span>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Header row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px', gap: 8, padding: '0 16px', marginBottom: 4 }}>
                        {['Imóvel', 'Visitas (30d)', 'Analytics'].map(h => (
                            <p key={h} style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</p>
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
                            >
                                <div style={{
                                    display: 'grid', gridTemplateColumns: '1fr 100px 120px',
                                    gap: 8, alignItems: 'center',
                                    padding: '14px 16px', borderRadius: 16,
                                    background: T.elevated, border: `1px solid ${T.border}`,
                                }}>
                                        {/* Property info */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: T.surface }}>
                                                {image ? (
                                                    <img src={image} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Building2 size={18} style={{ color: T.textMuted, opacity: 0.4 }} />
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {d.name}
                                                </p>
                                                <span style={{ fontSize: 9, fontWeight: 800, color: status.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                    {status.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Views — real from page_views */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Eye size={14} style={{ color: T.textMuted }} />
                                            <p style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
                                                {views.toLocaleString('pt-BR')}
                                            </p>
                                        </div>

                                        {/* Link to full analytics */}
                                        <div>
                                            <Link
                                                href={`/backoffice/imoveis/${d.id}/analytics`}
                                                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--bo-accent)', textDecoration: 'none' }}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <BarChart2 size={13} /> Ver analytics <ExternalLink size={10} />
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
