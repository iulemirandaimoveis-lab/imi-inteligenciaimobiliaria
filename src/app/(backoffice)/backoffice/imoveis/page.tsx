'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Search, Grid3X3, List, Building2, MapPin, Bed, Bath, Ruler,
    DollarSign, Star, MoreHorizontal, Eye, Edit, CheckCircle, Clock,
    AlertCircle, Tag, Archive, Trash2, ShoppingCart,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { PageIntelHeader, KPICard } from '../../components/ui'
import { T } from '../../lib/theme'
import { calcPricePerSqm } from '@/lib/utils'

const STATUS_MAP: Record<string, { label: string; text: string; bg: string; dot: string; icon: any }> = {
    disponivel:    { label: 'Disponível',  text: '#34d399', bg: 'rgba(52,211,153,0.15)',   dot: '#34d399', icon: CheckCircle },
    em_negociacao: { label: 'Negociação',  text: '#60A5FA', bg: 'rgba(96,165,250,0.15)',   dot: '#60A5FA', icon: Clock },
    reservado:     { label: 'Reservado',   text: '#c084fc', bg: 'rgba(192,132,252,0.15)',  dot: '#c084fc', icon: AlertCircle },
    vendido:       { label: 'Vendido',     text: '#fbbf24', bg: 'rgba(251,191,36,0.15)',   dot: '#fbbf24', icon: ShoppingCart },
    lancamento:    { label: 'Lançamento',  text: '#fb923c', bg: 'rgba(251,146,60,0.15)',   dot: '#fb923c', icon: Tag },
    arquivado:     { label: 'Arquivado',   text: '#64748B', bg: 'rgba(100,116,139,0.15)', dot: '#64748B', icon: Archive },
}

interface Imovel {
    id: any
    codigo: string
    status: string
    destaque: boolean
    tipo: string
    titulo: string
    bairro: string
    area: number
    quartos: number
    banheiros: number
    vagas: number
    preco: number
    construtora: string | null
    visitas: number
    image: string | null
    liquidez: number
}

function LiquidezBar({ score }: { score: number }) {
    const color = score >= 75 ? '#34d399' : score >= 55 ? '#a3e635' : score >= 40 ? '#fbbf24' : '#f87171'
    const label = score >= 75 ? 'Alta' : score >= 55 ? 'Média' : score >= 40 ? 'Moderada' : 'Baixa'
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}66, ${color})` }}
                />
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{score}%</span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
            </div>
        </div>
    )
}

const fmtPreco = (v: number, tipo: string) => {
    if (!v || v === 0) return 'Consultar'
    if (tipo === 'Studio' && v < 10000) return `R$ ${v.toLocaleString('pt-BR')}/mês`
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
    if (v >= 1000) return `R$ ${Math.floor(v / 1000)}k`
    return `R$ ${v.toLocaleString('pt-BR')}`
}

function CardActions({ imovel, onAction }: { imovel: Imovel; onAction: (id: string, action: string) => void }) {
    const [open, setOpen] = useState(false)

    const actions = [
        { key: 'view',      label: 'Ver Detalhes',    icon: Eye,          color: 'rgba(255,255,255,0.65)' },
        { key: 'edit',      label: 'Editar',           icon: Edit,         color: 'rgba(255,255,255,0.65)' },
        ...(imovel.status !== 'vendido'   ? [{ key: 'vendido',    label: 'Marcar Vendido', icon: ShoppingCart, color: '#fbbf24' }] : []),
        ...(imovel.status !== 'arquivado' ? [{ key: 'arquivado',  label: 'Arquivar',        icon: Archive,      color: '#f59e0b' }] : []),
        ...(imovel.status === 'arquivado' ? [{ key: 'disponivel', label: 'Restaurar',       icon: CheckCircle,  color: '#34d399' }] : []),
        { key: 'delete',    label: 'Excluir',          icon: Trash2,       color: '#f87171' },
    ]

    return (
        <div className="relative" onClick={e => e.preventDefault()}>
            <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{
                    background: open ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <MoreHorizontal size={13} color="white" />
            </motion.button>
            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -6 }}
                            transition={{ duration: 0.14 }}
                            className="absolute right-0 top-9 z-50 w-44 rounded-xl overflow-hidden shadow-2xl"
                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                        >
                            {actions.map((a, idx) => {
                                const Icon = a.icon
                                return (
                                    <button
                                        key={a.key}
                                        onClick={(e) => { e.stopPropagation(); setOpen(false); onAction(imovel.id, a.key) }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-left transition-all hover:bg-[var(--bo-hover)]"
                                        style={{
                                            color: a.color,
                                            borderTop: idx > 0 && a.key === 'delete' ? `1px solid ${T.border}` : undefined,
                                        }}
                                    >
                                        <Icon size={12} /> {a.label}
                                    </button>
                                )
                            })}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

function ImovelCard({ imovel, index, onAction }: { imovel: Imovel; index: number; onAction: (id: string, action: string) => void }) {
    const s = STATUS_MAP[imovel.status] || STATUS_MAP.disponivel

    return (
        <Link href={`/backoffice/imoveis/${imovel.id}`}>
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
                whileHover={{
                    y: -2,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
                    borderColor: 'rgba(255,255,255,0.1)',
                }}
                className="group rounded-2xl overflow-hidden cursor-pointer"
                style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                }}
            >
                {/* Image — 4:3 */}
                <div className="relative aspect-[4/3] overflow-hidden" style={{ background: 'var(--bo-elevated)' }}>
                    {imovel.image ? (
                        <Image
                            src={imovel.image}
                            alt={imovel.titulo}
                            fill
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                    ) : (
                        <>
                            <div className="absolute inset-0 opacity-[0.04]" style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                                backgroundSize: '14px 14px',
                            }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Building2 size={44} style={{ color: T.accent, opacity: 0.15 }} />
                            </div>
                        </>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none" />

                    {/* Top: actions + destaque */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between z-10">
                        {imovel.destaque ? (
                            <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center"
                                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                <Star size={11} fill={T.accent} style={{ color: T.accent }} />
                            </div>
                        ) : <span />}
                        <div onClick={e => e.preventDefault()}>
                            <CardActions imovel={imovel} onAction={onAction} />
                        </div>
                    </div>

                    {/* Bottom: status + views */}
                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 flex items-end justify-between pointer-events-none">
                        <span
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-[3px] rounded-full leading-none"
                            style={{
                                color: s.text,
                                background: 'rgba(0,0,0,0.55)',
                                border: `1px solid ${s.text}35`,
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: s.dot }} />
                            {s.label}
                        </span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            {imovel.visitas > 0 ? `${imovel.visitas} views` : ''}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Code + construtora */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-mono tracking-[0.12em] uppercase" style={{ color: 'rgba(255,255,255,0.28)' }}>
                            {imovel.codigo}
                        </span>
                        {imovel.construtora && (
                            <span
                                className="text-[9px] font-medium px-1.5 py-0.5 rounded-md truncate max-w-[96px]"
                                style={{ color: T.textDim, background: 'var(--bo-elevated)', border: `1px solid ${T.border}` }}
                            >
                                {imovel.construtora}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <p className="text-[13px] font-semibold leading-snug line-clamp-2 mb-1.5" style={{ color: T.text }}>
                        {imovel.titulo}
                    </p>

                    {/* Location */}
                    <p className="text-[11px] flex items-center gap-1 mb-3" style={{ color: T.textDim }}>
                        <MapPin size={9} className="flex-shrink-0 opacity-70" />
                        {imovel.bairro}
                    </p>

                    {/* Specs as small pills */}
                    {imovel.quartos > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mb-3">
                            {[
                                { Icon: Bed,   val: `${imovel.quartos} qts` },
                                { Icon: Bath,  val: `${imovel.banheiros} bhs` },
                                { Icon: Ruler, val: `${imovel.area.toLocaleString('pt-BR')}m²` },
                            ].map(({ Icon, val }) => (
                                <span
                                    key={val}
                                    className="inline-flex items-center gap-1 text-[10px] px-2 py-[3px] rounded-lg"
                                    style={{ color: T.textMuted, background: 'var(--bo-elevated)', border: `1px solid ${T.border}` }}
                                >
                                    <Icon size={9} /> {val}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Price */}
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <p className="text-[19px] font-bold leading-none tracking-tight" style={{ color: T.accent }}>
                                {fmtPreco(imovel.preco, imovel.tipo)}
                            </p>
                            {imovel.area > 0 && imovel.preco > 0 && (
                                <p className="text-[10px] mt-1" style={{ color: T.textDim }}>
                                    {calcPricePerSqm(imovel.preco, imovel.area)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Liquidez */}
                    <div className="pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                                Índice Liquidez IMI
                            </span>
                        </div>
                        <LiquidezBar score={imovel.liquidez} />
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
                        const formatted = data.map((d: any) => {
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
                <div><div className="skeleton h-6 w-56 mb-2" /><div className="skeleton h-4 w-72" /></div>
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
                    <div key={i} className="skeleton-card overflow-hidden rounded-2xl" style={{ animationDelay: `${i * 60}ms` }}>
                        <div className="skeleton w-full rounded-none" style={{ aspectRatio: '4/3' }} />
                        <div className="p-4 space-y-2.5">
                            <div className="skeleton h-3 w-20" /><div className="skeleton h-4 w-40" />
                            <div className="skeleton h-3 w-28" /><div className="skeleton lg h-6 w-24 mt-1" />
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
        { label: 'Lançamentos',       value: lancamentosCount,     icon: Tag },
        { label: 'Em Destaque',       value: destaquesCount,        icon: Star },
        { label: 'Disponíveis',       value: disponiveis,           icon: CheckCircle },
    ]

    return (
        <div className="space-y-5">

            {/* Header */}
            <PageIntelHeader
                moduleLabel="IMOVEIS"
                title="Portfólio / Empreendimentos"
                subtitle={`Gestão Global IMI · ${total} ativos comerciais`}
                actions={
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/backoffice/imoveis/novo')}
                        className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                        style={{ background: T.accent }}
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Novo Empreendimento</span>
                    </motion.button>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {STATS.map(s => (
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
            <div className="rounded-2xl p-3.5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex flex-col sm:flex-row gap-2.5">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textDim }} />
                        <input
                            type="text"
                            placeholder="Buscar construtora, ativo, bairro..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-9 pl-8 pr-4 rounded-xl text-xs outline-none"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text, caretColor: T.accent }}
                            onFocus={e => { e.currentTarget.style.border = `1px solid ${T.borderGold}` }}
                            onBlur={e => { e.currentTarget.style.border = `1px solid ${T.border}` }}
                        />
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Mobile: select */}
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="sm:hidden h-9 px-3 rounded-xl text-xs font-semibold outline-none flex-1"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                        >
                            <option value="all">Todos</option>
                            {Object.entries(STATUS_MAP).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>

                        {/* Desktop: filter chips */}
                        {['all', ...Object.keys(STATUS_MAP)].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className="px-2.5 h-9 rounded-xl text-xs font-semibold transition-all hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap"
                                style={{
                                    background: filter === s ? T.accent : T.elevated,
                                    color: filter === s ? 'white' : T.textDim,
                                    border: `1px solid ${filter === s ? T.borderGold : T.border}`,
                                }}
                            >
                                {s !== 'all' && (
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: filter === s ? 'rgba(255,255,255,0.7)' : STATUS_MAP[s]?.dot }} />
                                )}
                                {s === 'all' ? 'Todos' : STATUS_MAP[s]?.label}
                            </button>
                        ))}

                        {/* View toggle */}
                        <div className="flex items-center rounded-xl overflow-hidden ml-0.5" style={{ border: `1px solid ${T.border}` }}>
                            {(['grid', 'list'] as const).map(v => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className="w-9 h-9 flex items-center justify-center transition-all"
                                    style={{ background: view === v ? T.accent : T.elevated }}
                                >
                                    {v === 'grid'
                                        ? <Grid3X3 size={13} style={{ color: view === v ? 'white' : T.textDim }} />
                                        : <List size={13} style={{ color: view === v ? 'white' : T.textDim }} />
                                    }
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Count */}
            <p className="text-[11px]" style={{ color: T.textDim }}>
                {filtered.length} imóvel{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </p>

            {/* Empty state */}
            {filtered.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 rounded-2xl"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--bo-elevated)' }}>
                        <Building2 size={28} style={{ color: T.textMuted, opacity: 0.3 }} />
                    </div>
                    <p className="text-base font-bold mb-1" style={{ color: T.text }}>
                        {search ? 'Nenhum resultado' : filter !== 'all' ? `Nenhum imóvel ${STATUS_MAP[filter]?.label || filter}` : 'Portfólio vazio'}
                    </p>
                    <p className="text-sm mb-6 text-center max-w-xs" style={{ color: T.textMuted }}>
                        {search
                            ? `Sem resultados para "${search}". Tente outros termos.`
                            : filter !== 'all'
                                ? 'Nenhum imóvel com este status no momento.'
                                : 'Cadastre o primeiro empreendimento do portfólio IMI.'}
                    </p>
                    {!search && filter === 'all' && (
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => router.push('/backoffice/imoveis/novo')}
                            className="flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold text-white"
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
            {filtered.length > 0 && view === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((im, i) => (
                        <ImovelCard key={im.id} imovel={im} index={i} onAction={handleAction} />
                    ))}
                </div>
            )}

            {/* List */}
            {filtered.length > 0 && view === 'list' && (
                <div className="space-y-1.5">
                    {filtered.map((im, i) => {
                        const s = STATUS_MAP[im.status] || STATUS_MAP.disponivel
                        return (
                            <motion.div
                                key={im.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.025 }}
                                className="group flex items-center gap-3 p-3 rounded-xl transition-all"
                                style={{ background: T.surface, border: `1px solid ${T.border}` }}
                            >
                                <Link href={`/backoffice/imoveis/${im.id}`} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                                    {/* Thumbnail */}
                                    <div
                                        className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                                        style={{ background: 'var(--bo-elevated)' }}
                                    >
                                        {im.image ? (
                                            <Image src={im.image} alt={im.titulo} fill className="object-cover" sizes="48px" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Building2 size={20} style={{ color: T.accent, opacity: 0.35 }} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <p className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{im.titulo}</p>
                                            {im.destaque && <Star size={11} fill={T.accent} style={{ color: T.accent, flexShrink: 0 }} />}
                                        </div>
                                        <p className="text-[11px] truncate" style={{ color: T.textDim }}>
                                            {im.codigo} · {im.bairro}{im.area > 0 ? ` · ${im.area.toLocaleString('pt-BR')}m²` : ''}
                                        </p>
                                    </div>

                                    {/* Right: status + price */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span
                                            className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-[3px] rounded-full"
                                            style={{ color: s.text, background: s.bg }}
                                        >
                                            <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: s.dot }} />
                                            {s.label}
                                        </span>
                                        <p className="text-sm font-bold hidden sm:block" style={{ color: T.accent }}>
                                            {fmtPreco(im.preco, im.tipo)}
                                        </p>
                                    </div>
                                </Link>

                                {/* Actions */}
                                <div
                                    className="flex-shrink-0"
                                    style={{ background: 'transparent' }}
                                >
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
