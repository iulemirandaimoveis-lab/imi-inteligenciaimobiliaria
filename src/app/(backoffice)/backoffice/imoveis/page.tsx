'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Search, Grid3X3, List, Building2, MapPin, Bed, Bath, Car, Ruler, DollarSign, Star, MoreHorizontal, Eye, Edit, CheckCircle, Clock, AlertCircle, Tag, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const T = {
    bg: 'transparent', surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
    gold: '#486581',
}

const STATUS_MAP: Record<string, { label: string; text: string; bg: string; icon: any }> = {
    disponivel: { label: 'Disponível', text: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: CheckCircle },
    em_negociacao: { label: 'Negociação', text: '#486581', bg: 'rgba(26,26,46,0.12)', icon: Clock },
    reservado: { label: 'Reservado', text: '#A89EC4', bg: 'rgba(168,158,196,0.12)', icon: AlertCircle },
    vendido: { label: 'Vendido', text: '#7B9EC4', bg: 'rgba(123,158,196,0.12)', icon: CheckCircle },
    lancamento: { label: 'Lançamento', text: '#E8A87C', bg: 'rgba(232,168,124,0.12)', icon: Tag },
}

// No fallback mock — real Supabase data only

interface Imovel {
    id: any;
    codigo: string;
    status: string;
    destaque: boolean;
    tipo: string;
    titulo: string;
    bairro: string;
    area: number;
    quartos: number;
    banheiros: number;
    vagas: number;
    preco: number;
    construtora: string | null;
    visitas: number;
}

const fmtPreco = (v: number, tipo: string) => {
    if (tipo === 'Studio' && v < 10000) return `R$ ${v.toLocaleString('pt-BR')}/mês`
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1).replace('.', ',')}M`
    if (v >= 1000) return `R$ ${Math.floor(v / 1000)}k`
    return `R$ ${v.toLocaleString('pt-BR')}`
}

function ImovelCard({ imovel, index }: { imovel: any; index: number }) {
    const s = STATUS_MAP[imovel.status] || STATUS_MAP.disponivel
    const SIcon = s.icon
    return (
        <Link href={`/backoffice/imoveis/${imovel.id}`}>
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.35 }}
            className="hover-card rounded-2xl overflow-hidden cursor-pointer group transition-all"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
            {/* Image */}
            <div
                className="relative h-36 flex items-end p-3"
                style={{
                    background: imovel.image ? undefined : `linear-gradient(160deg, var(--bo-elevated) 0%, var(--bo-surface) 100%)`,
                    borderBottom: `1px solid ${T.border}`,
                }}
            >
                {imovel.image ? (
                    <img src={imovel.image} alt={imovel.titulo} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 overflow-hidden opacity-10">
                        <div className="absolute top-4 left-4 w-16 h-16 border border-[#334E68] rounded-lg rotate-12" />
                        <div className="absolute bottom-6 right-6 w-24 h-24 border border-[#334E68] rounded-xl -rotate-6" />
                        <div className="absolute top-8 right-12 w-8 h-8 bg-[#102A43] rounded opacity-30" />
                    </div>
                )}

                <div className="relative flex items-end justify-between w-full">
                    <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={{ color: s.text, background: s.bg, border: `1px solid ${s.text}22` }}
                    >
                        <SIcon size={9} /> {s.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                        {imovel.destaque && (
                            <Star size={14} style={{ fill: T.gold, color: T.gold }} />
                        )}
                        <span className="text-[10px] font-medium" style={{ color: T.textDim }}>
                            {imovel.visitas} views
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <p className="text-[10px] font-mono mb-1" style={{ color: T.textDim }}>{imovel.codigo}</p>
                <p className="text-sm font-semibold mb-1 line-clamp-1" style={{ color: T.text }}>
                    {imovel.titulo}
                </p>
                <p className="text-xs flex items-center gap-1 mb-3" style={{ color: T.textDim }}>
                    <MapPin size={10} /> {imovel.bairro}
                </p>

                {/* Specs */}
                {imovel.quartos > 0 && (
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-[11px] flex items-center gap-1" style={{ color: T.textSub }}>
                            <Bed size={11} /> {imovel.quartos}q
                        </span>
                        <span className="text-[11px] flex items-center gap-1" style={{ color: T.textSub }}>
                            <Bath size={11} /> {imovel.banheiros}b
                        </span>
                        <span className="text-[11px] flex items-center gap-1" style={{ color: T.textSub }}>
                            <Ruler size={11} /> {imovel.area.toLocaleString('pt-BR')}m²
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <p className="text-base font-bold" style={{ color: T.gold }}>
                        {fmtPreco(imovel.preco, imovel.tipo)}
                    </p>
                    {imovel.construtora && (
                        <p className="text-[10px] truncate max-w-[100px]" style={{ color: T.textDim }}>
                            {imovel.construtora}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
        </Link>
    )
}

export default function ImoveisPage() {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [view, setView] = useState<'grid' | 'list'>('grid')
    const [filter, setFilter] = useState('all')
    const [imoveis, setImoveis] = useState<Imovel[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await fetch('/api/developments')
                if (res.ok) {
                    const data = await res.json()
                    if (Array.isArray(data) && data.length > 0) {
                        const formatted = data
                            .filter((d: any) => d.status !== 'arquivado' && d.status_comercial !== 'archived')
                            .map((d: any) => ({
                                id: d.id,
                                codigo: d.slug ? `IMI-${d.slug.substring(0, 8).toUpperCase()}` : `IMI-${String(d.id).substring(0, 8)}`,
                                status: d.status || 'disponivel',
                                destaque: !!d.is_highlighted,
                                tipo: d.type || d.tipo || d.property_type || 'Imóvel',
                                titulo: d.name || 'Empreendimento',
                                bairro: d.neighborhood || d.region || 'Localização',
                                area: d.private_area || d.area_from || 0,
                                quartos: d.bedrooms || 0,
                                banheiros: d.bathrooms || 0,
                                vagas: d.parking_spaces || 0,
                                preco: d.price_min || d.price_from || 0,
                                construtora: d.developer || d.developers?.name || null,
                                visitas: d.views || 0,
                                image: d.image || (Array.isArray(d.gallery_images) && d.gallery_images[0]) || null,
                            }))
                        setImoveis(formatted)
                        setLoading(false)
                        return
                    }
                }
            } catch (err) {
                console.error(err)
            }
            setImoveis([])
            setLoading(false)
        }
        fetchProperties()
    }, [])

    const total = imoveis.length
    const destaquesCount = imoveis.filter(i => i.destaque).length
    const lancamentosCount = imoveis.filter(i => i.status === 'lancamento').length
    const disponiveis = imoveis.filter(i => i.status === 'disponivel').length

    const filtered = imoveis.filter(im => {
        const q = search.toLowerCase()
        const matchSearch = im.titulo.toLowerCase().includes(q) || im.bairro.toLowerCase().includes(q) || im.codigo.toLowerCase().includes(q)
        const matchFilter = filter === 'all' || im.status === filter
        return matchSearch && matchFilter
    })

    if (loading) return (
        <div className="space-y-5 max-w-7xl mx-auto">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="skeleton h-6 w-56 mb-2" />
                    <div className="skeleton h-4 w-72" />
                </div>
                <div className="skeleton h-10 w-44 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton-card p-4" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="skeleton w-9 h-9 rounded-xl mb-3" />
                        <div className="skeleton lg h-5 w-16 mb-2" />
                        <div className="skeleton h-3 w-24" />
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton-card overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                        <div className="skeleton h-36 w-full rounded-none" />
                        <div className="p-4 space-y-2">
                            <div className="skeleton h-3 w-20" />
                            <div className="skeleton h-4 w-40" />
                            <div className="skeleton h-3 w-28" />
                            <div className="skeleton lg h-5 w-24 mt-2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    const STATS = [
        { label: 'VGV Global (Est.)', value: 'R$ 1.2B', icon: DollarSign },
        { label: 'Lançamentos', value: lancamentosCount, icon: Tag },
        { label: 'Em Destaque', value: destaquesCount, icon: Star },
        { label: 'Disponíveis', value: disponiveis, icon: CheckCircle },
    ]

    return (
        <div className="space-y-5 max-w-7xl mx-auto">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between gap-4"
            >
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Portfólio / Empreendimentos</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textDim }}>Gestão Global IMI · {total} ativos comerciais listados</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => router.push('/backoffice/imoveis/novo')}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                    style={{ background: '#486581', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                >
                    <Plus size={16} /> Novo Empreendimento
                </motion.button>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {STATS.map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="stat-card rounded-2xl p-4"
                        style={{
                            background: T.elevated,
                            border: `1px solid ${T.borderGold}`,
                        }}
                    >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(26,26,46,0.10)' }}>
                            <s.icon size={16} style={{ color: T.gold }} />
                        </div>
                        <p className="text-xl font-bold" style={{ color: T.text }}>{s.value}</p>
                        <p className="text-xs mt-0.5" style={{ color: T.textDim }}>{s.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Toolbar */}
            <div
                className="rounded-2xl p-4"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textDim }} />
                        <input
                            type="text"
                            placeholder="Buscar construtora, ativo, bairro..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-10 pl-9 pr-4 rounded-xl text-sm outline-none"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text, caretColor: T.gold }}
                            onFocus={e => (e.currentTarget.style.border = `1px solid ${T.borderGold}`)}
                            onBlur={e => (e.currentTarget.style.border = `1px solid ${T.border}`)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Status filter — mobile dropdown */}
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="sm:hidden h-10 px-3 rounded-xl text-xs font-semibold outline-none"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                        >
                            <option value="all">Todos</option>
                            <option value="disponivel">Disponível</option>
                            <option value="em_negociacao">Negociação</option>
                            <option value="lancamento">Lançamento</option>
                        </select>
                        {/* Status filter — desktop buttons */}
                        {['all', 'disponivel', 'em_negociacao', 'lancamento'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className="px-3 h-10 rounded-xl text-xs font-semibold transition-all hidden sm:block"
                                style={{
                                    background: filter === s ? '#486581' : T.elevated,
                                    color: filter === s ? 'white' : T.textDim,
                                    border: `1px solid ${filter === s ? T.borderGold : T.border}`,
                                }}
                            >
                                {s === 'all' ? 'Todos' : STATUS_MAP[s]?.label || s}
                            </button>
                        ))}

                        {/* View toggle */}
                        <div className="flex items-center gap-1 ml-1">
                            {(['grid', 'list'] as const).map(v => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                                    style={{
                                        background: view === v ? '#486581' : T.elevated,
                                        border: `1px solid ${view === v ? T.borderGold : T.border}`,
                                    }}
                                >
                                    {v === 'grid'
                                        ? <Grid3X3 size={14} style={{ color: view === v ? 'white' : T.textDim }} />
                                        : <List size={14} style={{ color: view === v ? 'white' : T.textDim }} />
                                    }
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Count */}
            <p className="text-xs" style={{ color: T.textDim }}>
                {filtered.length} imóveis/empreendimentos encontrados
            </p>

            {/* Grid */}
            {view === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((im, i) => <ImovelCard key={im.id} imovel={im} index={i} />)}
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((im, i) => {
                        const s = STATUS_MAP[im.status] || STATUS_MAP.disponivel
                        return (
                            <Link key={im.id} href={`/backoffice/imoveis/${im.id}`}>
                            <motion.div
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="hover-card flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all"
                                style={{ background: T.surface, border: `1px solid ${T.border}` }}
                            >
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(26,26,46,0.08)' }}>
                                    <Building2 size={20} style={{ color: T.gold }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{im.titulo}</p>
                                        {im.destaque && <Star size={12} style={{ fill: T.gold, color: T.gold, flexShrink: 0 }} />}
                                    </div>
                                    <p className="text-xs" style={{ color: T.textDim }}>{im.codigo} · {im.bairro} · {im.area.toLocaleString('pt-BR')}m²</p>
                                </div>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ color: s.text, background: s.bg }}>
                                        {s.label}
                                    </span>
                                    <p className="text-sm font-bold hidden sm:block" style={{ color: T.gold }}>
                                        {fmtPreco(im.preco, im.tipo)}
                                    </p>
                                </div>
                            </motion.div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
