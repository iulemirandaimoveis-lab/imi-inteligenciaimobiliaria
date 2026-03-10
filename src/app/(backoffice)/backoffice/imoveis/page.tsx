'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Search, Grid3X3, List, Building2, MapPin, Bed, Bath, Ruler, DollarSign, Star, MoreHorizontal, Eye, Edit, CheckCircle, Clock, AlertCircle, Tag, Archive, Trash2, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { PageIntelHeader, KPICard } from '../../components/ui'
import { T } from '../../lib/theme'
import { calcPricePerSqm } from '@/lib/utils'

const STATUS_MAP: Record<string, { label: string; text: string; bg: string; icon: any }> = {
    disponivel: { label: 'Disponível', text: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: CheckCircle },
    em_negociacao: { label: 'Negociação', text: 'var(--bo-accent)', bg: 'var(--bo-active-bg)', icon: Clock },
    reservado: { label: 'Reservado', text: '#A89EC4', bg: 'rgba(168,158,196,0.12)', icon: AlertCircle },
    vendido: { label: 'Vendido', text: '#60A5FA', bg: 'rgba(96,165,250,0.12)', icon: ShoppingCart },
    lancamento: { label: 'Lançamento', text: '#E8A87C', bg: 'rgba(232,168,124,0.12)', icon: Tag },
    arquivado: { label: 'Arquivado', text: '#64748B', bg: 'rgba(100,116,139,0.12)', icon: Archive },
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
    image: string | null;
    liquidez: number;
}

function LiquidezBadge({ score }: { score: number }) {
    const color = score >= 75 ? '#34d399' : score >= 55 ? '#a3e635' : score >= 40 ? '#fbbf24' : '#f87171'
    const label = score >= 75 ? 'Alta' : score >= 55 ? 'Média' : score >= 40 ? 'Moderada' : 'Baixa'
    return (
        <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bo-border)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
            </div>
            <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{score}%</span>
            <span className="text-[10px]" style={{ color: 'var(--bo-text-muted)' }}>{label}</span>
        </div>
    )
}

const fmtPreco = (v: number, tipo: string) => {
    if (tipo === 'Studio' && v < 10000) return `R$ ${v.toLocaleString('pt-BR')}/mês`
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1).replace('.', ',')}M`
    if (v >= 1000) return `R$ ${Math.floor(v / 1000)}k`
    return `R$ ${v.toLocaleString('pt-BR')}`
}

function CardActions({ imovel, onAction }: { imovel: Imovel; onAction: (id: string, action: string) => void }) {
    const [open, setOpen] = useState(false)

    const actions = [
        { key: 'view', label: 'Ver Detalhes', icon: Eye, color: T.textMuted },
        { key: 'edit', label: 'Editar', icon: Edit, color: T.textMuted },
        ...(imovel.status !== 'vendido' ? [{ key: 'vendido', label: 'Marcar Vendido', icon: ShoppingCart, color: '#60A5FA' }] : []),
        ...(imovel.status !== 'arquivado' ? [{ key: 'arquivado', label: 'Arquivar', icon: Archive, color: '#F59E0B' }] : []),
        ...(imovel.status === 'arquivado' ? [{ key: 'disponivel', label: 'Restaurar', icon: CheckCircle, color: '#6BB87B' }] : []),
        { key: 'delete', label: 'Excluir', icon: Trash2, color: '#EF4444' },
    ]

    return (
        <div className="relative" onClick={e => e.preventDefault()}>
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ background: open ? 'var(--bo-elevated)' : 'rgba(0,0,0,0.4)', border: open ? `1px solid ${T.border}` : 'none' }}
            >
                <MoreHorizontal size={14} style={{ color: 'white' }} />
            </motion.button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="absolute right-0 top-10 z-50 w-48 rounded-xl overflow-hidden shadow-xl"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                    >
                        {actions.map(a => {
                            const Icon = a.icon
                            return (
                                <button
                                    key={a.key}
                                    onClick={(e) => { e.stopPropagation(); setOpen(false); onAction(imovel.id, a.key) }}
                                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium text-left transition-all hover:bg-[var(--bo-hover)]"
                                    style={{ color: a.color }}
                                >
                                    <Icon size={13} /> {a.label}
                                </button>
                            )
                        })}
                    </motion.div>
                </>
            )}
        </div>
    )
}

function ImovelCard({ imovel, index, onAction }: { imovel: Imovel; index: number; onAction: (id: string, action: string) => void }) {
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
            {/* Image — 16:9 aspect ratio */}
            <div
                className="relative aspect-[16/9] flex items-end p-3"
                style={{
                    background: imovel.image ? undefined : 'var(--bo-elevated)',
                    borderBottom: `1px solid ${T.border}`,
                }}
            >
                {imovel.image ? (
                    <Image src={imovel.image} alt={imovel.titulo} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                ) : (
                    <div className="absolute inset-0 overflow-hidden opacity-10">
                        <div className="absolute top-4 left-4 w-16 h-16 border border-[#334E68] rounded-lg rotate-12" />
                        <div className="absolute bottom-6 right-6 w-24 h-24 border border-[#334E68] rounded-xl -rotate-6" />
                        <div className="absolute top-8 right-12 w-8 h-8 bg-[#102A43] rounded opacity-30" />
                    </div>
                )}

                {/* Actions overlay (always visible) */}
                <div className="absolute top-3 right-3 z-10">
                    <CardActions imovel={imovel} onAction={onAction} />
                </div>

                <div className="relative flex items-end justify-between w-full">
                    <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={{ color: s.text, background: s.bg, border: `1px solid ${s.text}22` }}
                    >
                        <SIcon size={9} /> {s.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                        {imovel.destaque && (
                            <Star size={14} style={{ fill: T.accent, color: T.accent }} />
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
                        <span className="text-[11px] flex items-center gap-1" style={{ color: T.textMuted }}>
                            <Bed size={11} /> {imovel.quartos}q
                        </span>
                        <span className="text-[11px] flex items-center gap-1" style={{ color: T.textMuted }}>
                            <Bath size={11} /> {imovel.banheiros}b
                        </span>
                        <span className="text-[11px] flex items-center gap-1" style={{ color: T.textMuted }}>
                            <Ruler size={11} /> {imovel.area.toLocaleString('pt-BR')}m²
                        </span>
                    </div>
                )}

                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-base font-bold leading-tight" style={{ color: T.accent }}>
                            {fmtPreco(imovel.preco, imovel.tipo)}
                        </p>
                        {imovel.area > 0 && imovel.preco > 0 && (
                            <p className="text-[10px] mt-0.5" style={{ color: T.textDim }}>
                                {calcPricePerSqm(imovel.preco, imovel.area)}
                            </p>
                        )}
                    </div>
                    {imovel.construtora && (
                        <p className="text-[10px] truncate max-w-[90px]" style={{ color: T.textDim }}>
                            {imovel.construtora}
                        </p>
                    )}
                </div>

                {/* Liquidez Score */}
                <div className="mt-3 pt-3" style={{ borderTop: `1px solid var(--bo-border)` }}>
                    <p className="text-[9px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>
                        Índice de Liquidez IMI
                    </p>
                    <LiquidezBadge score={imovel.liquidez} />
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
        const fetchData = async () => {
            try {
                const [propsRes, leadsRes] = await Promise.all([
                    fetch('/api/developments'),
                    fetch('/api/leads?limit=200'),
                ])

                // Build lead stats per development
                type LeadStats = { hot: number; warm: number; total: number; won: number }
                const leadsMap: Record<string, LeadStats> = {}
                if (leadsRes.ok) {
                    const ld = await leadsRes.json()
                    const leads: any[] = ld.data || ld || []
                    leads.forEach((l: any) => {
                        const devId = l.development_id
                        if (!devId) return
                        if (!leadsMap[devId]) leadsMap[devId] = { hot: 0, warm: 0, total: 0, won: 0 }
                        leadsMap[devId].total++
                        if (l.status === 'negotiating') leadsMap[devId].hot++
                        if (l.status === 'qualified') leadsMap[devId].warm++
                        if (l.status === 'won') leadsMap[devId].won++
                    })
                }

                if (propsRes.ok) {
                    const data = await propsRes.json()
                    if (Array.isArray(data) && data.length > 0) {
                        const formatted = data
                            .map((d: any) => {
                                const s = leadsMap[d.id] || { hot: 0, warm: 0, total: 0, won: 0 }
                                const liquidez = Math.min(97, 22 + s.hot * 13 + s.warm * 8 + s.total * 3 + s.won * 16)
                                return {
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
                                    liquidez,
                                }
                            })
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
        fetchData()
    }, [])

    const handleAction = async (id: string, action: string) => {
        if (action === 'view') { router.push(`/backoffice/imoveis/${id}`); return }
        if (action === 'edit') { router.push(`/backoffice/imoveis/${id}/editar`); return }

        // Status changes via PATCH
        if (['vendido', 'arquivado', 'disponivel'].includes(action)) {
            const labelMap: Record<string, string> = { vendido: 'Vendido', arquivado: 'Arquivado', disponivel: 'Disponível' }
            try {
                const res = await fetch('/api/developments', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, status: action }),
                })
                if (!res.ok) {
                    const err = await res.json()
                    toast.error(err.error || 'Erro ao atualizar status')
                    return
                }
                setImoveis(prev => prev.map(im => im.id === id ? { ...im, status: action } : im))
                toast.success(`Imóvel marcado como ${labelMap[action]}`)
            } catch {
                toast.error('Erro de conexão ao atualizar status')
            }
            return
        }

        // Soft delete
        if (action === 'delete') {
            if (!confirm('Tem certeza que deseja excluir este imóvel? Ele será arquivado.')) return
            try {
                const res = await fetch(`/api/developments?id=${id}`, { method: 'DELETE' })
                if (!res.ok) {
                    const err = await res.json()
                    toast.error(err.error || 'Erro ao excluir')
                    return
                }
                setImoveis(prev => prev.map(im => im.id === id ? { ...im, status: 'arquivado' } : im))
                toast.success('Imóvel excluído (arquivado)')
            } catch {
                toast.error('Erro de conexão ao excluir')
            }
        }
    }

    const total = imoveis.length
    const destaquesCount = imoveis.filter(i => i.destaque).length
    const lancamentosCount = imoveis.filter(i => i.status === 'lancamento').length
    const disponiveis = imoveis.filter(i => i.status === 'disponivel').length
    const vgvEstimado = imoveis.reduce((sum, i) => sum + (i.preco || 0), 0)

    const filtered = imoveis.filter(im => {
        const q = search.toLowerCase()
        const matchSearch = im.titulo.toLowerCase().includes(q) || im.bairro.toLowerCase().includes(q) || im.codigo.toLowerCase().includes(q)
        const matchFilter = filter === 'all' || im.status === filter
        return matchSearch && matchFilter
    })

    if (loading) return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="skeleton h-6 w-56 mb-2" />
                    <div className="skeleton h-4 w-72" />
                </div>
                <div className="skeleton h-10 w-44 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

    const fmtVGV = (v: number) => {
        if (v >= 1_000_000_000) return `R$ ${(v / 1_000_000_000).toFixed(1).replace('.', ',')}B`
        if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
        if (v >= 1000) return `R$ ${Math.round(v / 1000)}k`
        return v > 0 ? `R$ ${v.toLocaleString('pt-BR')}` : '—'
    }

    const STATS = [
        { label: 'VGV Global (Est.)', value: fmtVGV(vgvEstimado), icon: DollarSign },
        { label: 'Lançamentos', value: lancamentosCount, icon: Tag },
        { label: 'Em Destaque', value: destaquesCount, icon: Star },
        { label: 'Disponíveis', value: disponiveis, icon: CheckCircle },
    ]

    return (
        <div className="space-y-5">

            {/* Header */}
            <PageIntelHeader
                moduleLabel="IMOVEIS"
                title="Portfólio / Empreendimentos"
                subtitle={`Gestão Global IMI · ${total} ativos comerciais listados`}
                actions={
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => router.push('/backoffice/imoveis/novo')}
                        className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                        style={{ background: T.accent }}
                    >
                        <Plus size={16} /> <span className="hidden sm:inline">Novo Empreendimento</span>
                    </motion.button>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {STATS.map((s, i) => (
                    <KPICard
                        key={s.label}
                        label={s.label}
                        value={String(s.value)}
                        icon={<s.icon size={16} />}
                        accent="blue"
                        size="sm"
                    />
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
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text, caretColor: T.accent }}
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
                            <option value="vendido">Vendido</option>
                            <option value="arquivado">Arquivado</option>
                        </select>
                        {/* Status filter — desktop buttons */}
                        {['all', 'disponivel', 'em_negociacao', 'lancamento', 'vendido', 'arquivado'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className="px-3 h-10 rounded-xl text-xs font-semibold transition-all hidden sm:block"
                                style={{
                                    background: filter === s ? 'var(--bo-accent)' : T.elevated,
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
                                        background: view === v ? 'var(--bo-accent)' : T.elevated,
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

            {/* Empty state */}
            {filtered.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 rounded-3xl"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: T.elevated }}>
                        <Building2 size={28} className="opacity-30" style={{ color: T.textMuted }} />
                    </div>
                    <p className="text-base font-bold mb-1" style={{ color: T.text }}>
                        {search ? 'Nenhum imóvel encontrado' : filter !== 'all' ? `Nenhum imóvel ${STATUS_MAP[filter]?.label || filter}` : 'Portfólio vazio'}
                    </p>
                    <p className="text-sm mb-6 text-center max-w-xs" style={{ color: T.textMuted }}>
                        {search ? `Sem resultados para "${search}". Tente outros termos.` : filter !== 'all' ? 'Nenhum imóvel com este status.' : 'Cadastre o primeiro empreendimento do portfólio IMI.'}
                    </p>
                    {!search && filter === 'all' && (
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => router.push('/backoffice/imoveis/novo')}
                            className="flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold text-white"
                            style={{ background: T.accent }}
                        >
                            <Plus size={16} /> Cadastrar Imóvel
                        </motion.button>
                    )}
                    {(search || filter !== 'all') && (
                        <button
                            onClick={() => { setSearch(''); setFilter('all') }}
                            className="text-sm font-semibold transition-opacity hover:opacity-70"
                            style={{ color: T.accent }}
                        >
                            Limpar filtros
                        </button>
                    )}
                </motion.div>
            )}

            {/* Grid */}
            {filtered.length > 0 && view === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((im, i) => <ImovelCard key={im.id} imovel={im} index={i} onAction={handleAction} />)}
                </div>
            ) : filtered.length > 0 && (
                <div className="space-y-2">
                    {filtered.map((im, i) => {
                        const s = STATUS_MAP[im.status] || STATUS_MAP.disponivel
                        return (
                            <motion.div
                                key={im.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="hover-card flex items-center gap-4 p-4 rounded-2xl transition-all"
                                style={{ background: T.surface, border: `1px solid ${T.border}` }}
                            >
                                <Link href={`/backoffice/imoveis/${im.id}`} className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bo-active-bg)' }}>
                                        <Building2 size={20} style={{ color: T.accent }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{im.titulo}</p>
                                            {im.destaque && <Star size={12} style={{ fill: T.accent, color: T.accent, flexShrink: 0 }} />}
                                        </div>
                                        <p className="text-xs" style={{ color: T.textDim }}>{im.codigo} · {im.bairro} · {im.area.toLocaleString('pt-BR')}m²</p>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ color: s.text, background: s.bg }}>
                                            {s.label}
                                        </span>
                                        <p className="text-sm font-bold hidden sm:block" style={{ color: T.accent }}>
                                            {fmtPreco(im.preco, im.tipo)}
                                        </p>
                                    </div>
                                </Link>
                                <div className="flex-shrink-0">
                                    <CardActions imovel={im} onAction={handleAction} />
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
