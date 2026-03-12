'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    motion, AnimatePresence, useMotionValue, useTransform,
    useSpring, LayoutGroup,
} from 'framer-motion'
import {
    Plus, Search, Grid3X3, List, Building2, MapPin, Bed, Bath, Ruler,
    DollarSign, Star, MoreHorizontal, Eye, Edit, CheckCircle, Clock,
    AlertCircle, Tag, Archive, Trash2, ShoppingCart, X,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { PageIntelHeader, KPICard } from '../../components/ui'
import { T } from '../../lib/theme'
import { getStatusConfig } from '../../lib/constants'
import { calcPricePerSqm } from '@/lib/utils'

/* ─── STATUS CONFIG (from centralized constants) ─────────────────── */
const STATUS_ICONS: Record<string, any> = {
    disponivel: CheckCircle, em_negociacao: Clock, reservado: AlertCircle,
    vendido: ShoppingCart, lancamento: Tag, em_construcao: Clock, arquivado: Archive,
}
const STATUS_MAP = Object.fromEntries(
    Object.entries(STATUS_ICONS).map(([key, icon]) => {
        const cfg = getStatusConfig(key)
        return [key, { label: cfg.label, text: cfg.dot, bg: `${cfg.dot}26`, dot: cfg.dot, icon }]
    })
) as Record<string, { label: string; text: string; bg: string; dot: string; icon: any }>

/**
 * Map raw DB `status` column values → STATUS_MAP display keys.
 * The DB can store English values (legacy), Portuguese values, or mixed.
 */
const DB_STATUS_TO_DISPLAY: Record<string, string> = {
    // English API values
    launch:            'lancamento',
    available:         'disponivel',
    under_construction:'em_construcao',
    ready:             'disponivel',
    sold:              'vendido',
    reserved:          'reservado',
    negotiating:       'em_negociacao',
    published:         'disponivel',
    draft:             'arquivado',
    campaign:          'lancamento',
    private:           'arquivado',
    // Portuguese values already valid — pass-through
    disponivel:        'disponivel',
    em_negociacao:     'em_negociacao',
    reservado:         'reservado',
    vendido:           'vendido',
    lancamento:        'lancamento',
    em_construcao:     'em_construcao',
    arquivado:         'arquivado',
}

/* ─── TYPES ──────────────────────────────────────────────────────── */
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
    construtora_logo: string | null
    visitas: number
    image: string | null
    liquidez: number
}

/* ─── ANIMATED COUNTER ───────────────────────────────────────────── */
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
    const [display, setDisplay] = useState(0)
    useEffect(() => {
        const start = Date.now()
        const duration = 900
        const from = 0
        let raf: number
        const tick = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)
            const ease = 1 - Math.pow(1 - progress, 3)
            setDisplay(Math.round(from + (value - from) * ease))
            if (progress < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [value])
    return <>{prefix}{display.toLocaleString('pt-BR')}{suffix}</>
}

/* ─── LIQUIDEZ BAR ───────────────────────────────────────────────── */
function LiquidezBar({ score }: { score: number }) {
    const color = score >= 75 ? '#34d399' : score >= 55 ? '#a3e635' : score >= 40 ? '#fbbf24' : '#f87171'
    const label = score >= 75 ? 'Alta' : score >= 55 ? 'Média' : score >= 40 ? 'Moderada' : 'Baixa'
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}55, ${color})` }}
                />
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{score}%</span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>·</span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.32)' }}>{label}</span>
            </div>
        </div>
    )
}

/* ─── FORMAT ─────────────────────────────────────────────────────── */
const fmtPreco = (v: number, tipo: string) => {
    if (!v || v === 0) return 'Consultar'
    if (tipo === 'Studio' && v < 10000) return `R$ ${v.toLocaleString('pt-BR')}/mês`
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
    if (v >= 1000) return `R$ ${Math.floor(v / 1000)}k`
    return `R$ ${v.toLocaleString('pt-BR')}`
}

/* ─── CARD ACTIONS DROPDOWN ──────────────────────────────────────── */
function CardActionsMenu({ imovel, onAction }: { imovel: Imovel; onAction: (id: string, action: string) => void }) {
    const [open, setOpen] = useState(false)
    const actions = [
        { key: 'view',      label: 'Ver Detalhes',    icon: Eye,          color: 'rgba(255,255,255,0.7)' },
        { key: 'edit',      label: 'Editar',           icon: Edit,         color: 'rgba(255,255,255,0.7)' },
        ...(imovel.status !== 'vendido'   ? [{ key: 'vendido',    label: 'Marcar Vendido', icon: ShoppingCart, color: '#fbbf24' }] : []),
        ...(imovel.status !== 'arquivado' ? [{ key: 'arquivado',  label: 'Arquivar',        icon: Archive,      color: '#f59e0b' }] : []),
        ...(imovel.status === 'arquivado' ? [{ key: 'disponivel', label: 'Restaurar',       icon: CheckCircle,  color: '#34d399' }] : []),
        { key: 'delete',    label: 'Excluir',          icon: Trash2,       color: '#f87171' },
    ]
    return (
        <div className="relative" onClick={e => e.preventDefault()}>
            <motion.button
                whileTap={{ scale: 0.82 }}
                onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                    background: open ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.52)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <MoreHorizontal size={13} color="white" />
            </motion.button>
            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.88, y: -8, transformOrigin: 'top right' }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.88, y: -8 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                            className="absolute right-0 top-9 z-50 w-44 rounded-xl overflow-hidden shadow-2xl"
                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                        >
                            {actions.map((a, idx) => {
                                const Icon = a.icon
                                return (
                                    <motion.button
                                        key={a.key}
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        onClick={(e) => { e.stopPropagation(); setOpen(false); onAction(imovel.id, a.key) }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-left hover:bg-[var(--bo-hover)] transition-colors"
                                        style={{
                                            color: a.color,
                                            borderTop: idx > 0 && a.key === 'delete' ? `1px solid ${T.border}` : undefined,
                                        }}
                                    >
                                        <Icon size={12} /> {a.label}
                                    </motion.button>
                                )
                            })}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ─── IMOVEL CARD (with 3D tilt + hover actions) ─────────────────── */
function ImovelCard({ imovel, index, onAction }: { imovel: Imovel; index: number; onAction: (id: string, action: string) => void }) {
    const s = STATUS_MAP[imovel.status] || STATUS_MAP.disponivel
    const cardRef = useRef<HTMLDivElement>(null)

    const rawX = useMotionValue(0)
    const rawY = useMotionValue(0)
    const springX = useSpring(rawX, { stiffness: 160, damping: 24 })
    const springY = useSpring(rawY, { stiffness: 160, damping: 24 })
    const rotateX = useTransform(springY, [-70, 70], [5, -5])
    const rotateY = useTransform(springX, [-70, 70], [-5, 5])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const rect = cardRef.current?.getBoundingClientRect()
        if (!rect) return
        rawX.set(e.clientX - rect.left - rect.width / 2)
        rawY.set(e.clientY - rect.top - rect.height / 2)
    }, [rawX, rawY])

    const handleMouseLeave = useCallback(() => {
        rawX.set(0)
        rawY.set(0)
    }, [rawX, rawY])

    const quickActions = [
        { key: 'view', label: 'Ver', icon: Eye },
        { key: 'edit', label: 'Editar', icon: Edit },
        ...(imovel.status !== 'vendido' ? [{ key: 'vendido', label: 'Vendido', icon: ShoppingCart }] : []),
    ]

    return (
        <Link href={`/backoffice/imoveis/${imovel.id}`} style={{ display: 'block' }}>
            <motion.div
                ref={cardRef}
                initial={{ opacity: 0, y: 22, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ rotateX, rotateY, transformPerspective: 900 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="group cursor-pointer"
            >
                <motion.div
                    whileHover={{ boxShadow: '0 16px 48px rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1)' }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                    {/* ── Image ── */}
                    <div className="relative aspect-[4/3] overflow-hidden" style={{ background: 'var(--bo-elevated)' }}>
                        {imovel.image ? (
                            <Image
                                src={imovel.image}
                                alt={imovel.titulo}
                                fill
                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                                style={{ transition: 'transform 700ms cubic-bezier(0.22,1,0.36,1)' }}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                        ) : (
                            <>
                                <div className="absolute inset-0 opacity-[0.035]" style={{
                                    backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                                    backgroundSize: '13px 13px',
                                }} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <motion.div
                                        animate={{ scale: [1, 1.06, 1], opacity: [0.12, 0.18, 0.12] }}
                                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <Building2 size={48} style={{ color: T.accent }} />
                                    </motion.div>
                                </div>
                            </>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />

                        {/* Top-left: destaque */}
                        {imovel.destaque && (
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', delay: index * 0.05 + 0.3, stiffness: 260 }}
                                className="absolute top-2.5 left-2.5 w-6 h-6 rounded-lg flex items-center justify-center z-10"
                                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                <Star size={11} fill={T.accent} style={{ color: T.accent }} />
                            </motion.div>
                        )}

                        {/* Top-right: 3-dot menu */}
                        <div className="absolute top-2.5 right-2.5 z-10" onClick={e => e.preventDefault()}>
                            <CardActionsMenu imovel={imovel} onAction={onAction} />
                        </div>

                        {/* Bottom: status + views (always visible) */}
                        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 flex items-end justify-between pointer-events-none">
                            <motion.span
                                layout
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-[3px] rounded-full"
                                style={{
                                    color: s.text,
                                    background: 'rgba(0,0,0,0.58)',
                                    border: `1px solid ${s.text}30`,
                                    backdropFilter: 'blur(8px)',
                                }}
                            >
                                <motion.span
                                    animate={{ scale: [1, 1.4, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                                    className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                                    style={{ background: s.dot }}
                                />
                                {s.label}
                            </motion.span>
                            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.42)' }}>
                                {imovel.visitas > 0 ? `${imovel.visitas} views` : ''}
                            </span>
                        </div>

                        {/* Hover quick-actions row */}
                        <AnimatePresence>
                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                whileHover={{ opacity: 1, y: 0 }}
                                className="absolute inset-0 flex items-center justify-center gap-2 z-20 pointer-events-none group-hover:pointer-events-auto"
                                style={{ background: 'transparent' }}
                            >
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                    {quickActions.map((a, i) => {
                                        const Icon = a.icon
                                        return (
                                            <motion.button
                                                key={a.key}
                                                initial={{ opacity: 0, scale: 0.7, y: 10 }}
                                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                                whileHover={{ scale: 1.08, y: -2 }}
                                                whileTap={{ scale: 0.9 }}
                                                transition={{ delay: i * 0.04 + 0.02, type: 'spring', stiffness: 300 }}
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAction(imovel.id, a.key) }}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold"
                                                style={{
                                                    background: 'rgba(0,0,0,0.68)',
                                                    backdropFilter: 'blur(12px)',
                                                    border: '1px solid rgba(255,255,255,0.18)',
                                                    color: 'rgba(255,255,255,0.88)',
                                                }}
                                            >
                                                <Icon size={11} />
                                                {a.label}
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* ── Content ── */}
                    <div className="p-4">
                        {/* Code + construtora */}
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-mono tracking-[0.12em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                {imovel.codigo}
                            </span>
                            {imovel.construtora && (
                                <span className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-md truncate max-w-[96px]" style={{
                                    color: T.textDim, background: 'var(--bo-elevated)', border: `1px solid ${T.border}`,
                                }}>
                                    {imovel.construtora_logo && (
                                        <Image
                                            src={imovel.construtora_logo}
                                            alt=""
                                            width={12}
                                            height={12}
                                            className="rounded-sm object-contain flex-shrink-0"
                                            style={{ filter: 'brightness(0) invert(1)', opacity: 0.7 }}
                                        />
                                    )}
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
                            <MapPin size={9} className="flex-shrink-0 opacity-60" />
                            {imovel.bairro}
                        </p>

                        {/* Specs pills */}
                        {imovel.quartos > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap mb-3">
                                {[
                                    { Icon: Bed,   val: `${imovel.quartos} qts` },
                                    { Icon: Bath,  val: `${imovel.banheiros} bhs` },
                                    { Icon: Ruler, val: `${imovel.area.toLocaleString('pt-BR')}m²` },
                                ].map(({ Icon, val }) => (
                                    <span key={val}
                                        className="inline-flex items-center gap-1 text-[10px] px-2 py-[3px] rounded-lg"
                                        style={{ color: T.textMuted, background: 'var(--bo-elevated)', border: `1px solid ${T.border}` }}
                                    >
                                        <Icon size={9} /> {val}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Price */}
                        <div className="flex items-end gap-3 mb-3">
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
                            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                Índice Liquidez IMI
                            </p>
                            <LiquidezBar score={imovel.liquidez} />
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </Link>
    )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
export default function ImoveisPage() {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [view, setView] = useState<'grid' | 'list'>('grid')
    const [filter, setFilter] = useState('all')
    const [filterConstrutora, setFilterConstrutora] = useState('all')
    const [filterTipo, setFilterTipo] = useState('all')
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
                        setImoveis(data.map((d: any) => {
                            const s = leadsMap[d.id] || { hot: 0, warm: 0, total: 0, won: 0 }
                            return {
                                id: d.id,
                                codigo: d.slug ? `IMI-${d.slug.substring(0, 8).toUpperCase()}` : `IMI-${String(d.id).substring(0, 8)}`,
                                status: DB_STATUS_TO_DISPLAY[d.status] || DB_STATUS_TO_DISPLAY[d.status_commercial] || 'disponivel',
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
                                construtora_logo: d.developers?.logo_url || null,
                                visitas: d.views || 0,
                                image: d.image || (Array.isArray(d.gallery_images) && d.gallery_images[0]) || null,
                                liquidez: Math.min(97, 22 + s.hot * 13 + s.warm * 8 + s.total * 3 + s.won * 16),
                            }
                        }))
                        setLoading(false)
                        return
                    }
                }
            } catch (err) { console.error(err) }
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
                if (!res.ok) { toast.error((await res.json()).error || 'Erro ao atualizar status'); return }
                setImoveis(prev => prev.map(im => im.id === id ? { ...im, status: action } : im))
                toast.success(`Imóvel marcado como ${labelMap[action]}`)
            } catch { toast.error('Erro de conexão') }
            return
        }
        if (action === 'delete') {
            if (!confirm('Tem certeza que deseja excluir este imóvel? Ele será arquivado.')) return
            try {
                const res = await fetch(`/api/developments?id=${id}`, { method: 'DELETE' })
                if (!res.ok) { toast.error((await res.json()).error || 'Erro ao excluir'); return }
                setImoveis(prev => prev.map(im => im.id === id ? { ...im, status: 'arquivado' } : im))
                toast.success('Imóvel excluído (arquivado)')
            } catch { toast.error('Erro de conexão') }
        }
    }

    const total = imoveis.length
    const destaquesCount = imoveis.filter(i => i.destaque).length
    const lancamentosCount = imoveis.filter(i => i.status === 'lancamento').length
    const disponiveis = imoveis.filter(i => i.status === 'disponivel').length
    const vgvEstimado = imoveis.reduce((sum, i) => sum + (i.preco || 0), 0)

    const fmtVGV = (v: number) => {
        if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1).replace('.', ',')}B`
        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
        if (v >= 1000) return `${Math.round(v / 1000)}k`
        return v > 0 ? v.toLocaleString('pt-BR') : '0'
    }

    const filtered = imoveis.filter(im => {
        const q = search.toLowerCase()
        const matchSearch = im.titulo.toLowerCase().includes(q) || im.bairro.toLowerCase().includes(q) || im.codigo.toLowerCase().includes(q)
        const matchFilter = filter === 'all' || im.status === filter
        const matchConstrutora = filterConstrutora === 'all' || (im.construtora ?? '') === filterConstrutora
        const matchTipo = filterTipo === 'all' || im.tipo.toLowerCase() === filterTipo.toLowerCase()
        return matchSearch && matchFilter && matchConstrutora && matchTipo
    })

    // Derived option lists (only entries that appear in current data)
    const construtoras = Array.from(new Set(imoveis.map(i => i.construtora).filter(Boolean) as string[])).sort()
    const tiposRaw     = Array.from(new Set(imoveis.map(i => i.tipo).filter(Boolean))).sort()
    const TIPO_LABEL: Record<string, string> = {
        apartamento: 'Apartamento', casa: 'Casa', flat: 'Flat', lote: 'Lote',
        comercial: 'Comercial', resort: 'Resort', studio: 'Studio',
        apartment: 'Apartamento', house: 'Casa', land: 'Lote', commercial: 'Comercial',
    }
    const activeFiltersCount = (filterConstrutora !== 'all' ? 1 : 0) + (filterTipo !== 'all' ? 1 : 0)

    /* ── Loading skeleton ── */
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
                        <div className="skeleton lg h-5 w-16 mb-2" /><div className="skeleton h-3 w-24" />
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

    /* ── Page ── */
    return (
        <div className="space-y-5">

            {/* Header */}
            <PageIntelHeader
                moduleLabel="IMOVEIS"
                title="Portfólio / Empreendimentos"
                subtitle={`Gestão Global IMI · ${total} ativos comerciais`}
                actions={
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/backoffice/imoveis/novo')}
                        className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--bo-accent) 0%, #1D4ED8 100%)', boxShadow: '0 4px 14px rgba(37,99,235,0.28)' }}
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Novo Empreendimento</span>
                    </motion.button>
                }
            />

            {/* KPIs with animated numbers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                    { label: 'VGV Global (Est.)', rawVal: vgvEstimado, display: `R$ ${fmtVGV(vgvEstimado)}`, icon: DollarSign },
                    { label: 'Lançamentos',       rawVal: lancamentosCount, display: null, icon: Tag },
                    { label: 'Em Destaque',        rawVal: destaquesCount,   display: null, icon: Star },
                    { label: 'Disponíveis',        rawVal: disponiveis,      display: null, icon: CheckCircle },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.35, ease: 'easeOut' }}
                    >
                        <KPICard
                            label={s.label}
                            value={s.display ?? String(s.rawVal)}
                            icon={<s.icon size={16} />}
                            accent="blue"
                            size="sm"
                        />
                    </motion.div>
                ))}
            </div>

            {/* Toolbar */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="rounded-2xl p-3.5"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
                <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textDim }} />
                        <input
                            type="text"
                            placeholder="Buscar construtora, ativo, bairro..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-9 pl-8 pr-8 rounded-xl text-xs outline-none transition-all"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text, caretColor: T.accent }}
                            onFocus={e => { e.currentTarget.style.border = `1px solid ${T.borderGold}` }}
                            onBlur={e => { e.currentTarget.style.border = `1px solid ${T.border}` }}
                        />
                        <AnimatePresence>
                            {search && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.7 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.7 }}
                                    onClick={() => setSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                                    style={{ color: T.textDim }}
                                >
                                    <X size={12} />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Mobile select */}
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

                        {/* Desktop filter chips with layoutId indicator */}
                        <LayoutGroup>
                            {['all', ...Object.keys(STATUS_MAP)].map(s => (
                                <motion.button
                                    key={s}
                                    layout
                                    onClick={() => setFilter(s)}
                                    className="relative px-2.5 h-9 rounded-xl text-xs font-semibold transition-colors hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap"
                                    style={{
                                        background: filter === s ? T.accent : T.elevated,
                                        color: filter === s ? 'white' : T.textDim,
                                        border: `1px solid ${filter === s ? T.borderGold : T.border}`,
                                    }}
                                    whileTap={{ scale: 0.94 }}
                                >
                                    {s !== 'all' && (
                                        <span
                                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                            style={{ background: filter === s ? 'rgba(255,255,255,0.7)' : STATUS_MAP[s]?.dot }}
                                        />
                                    )}
                                    {s === 'all' ? 'Todos' : STATUS_MAP[s]?.label}
                                </motion.button>
                            ))}
                        </LayoutGroup>

                        {/* View toggle */}
                        <div className="flex items-center rounded-xl overflow-hidden ml-0.5" style={{ border: `1px solid ${T.border}` }}>
                            {(['grid', 'list'] as const).map(v => (
                                <motion.button
                                    key={v}
                                    onClick={() => setView(v)}
                                    whileTap={{ scale: 0.88 }}
                                    className="w-9 h-9 flex items-center justify-center transition-colors"
                                    style={{ background: view === v ? T.accent : T.elevated }}
                                >
                                    {v === 'grid'
                                        ? <Grid3X3 size={13} style={{ color: view === v ? 'white' : T.textDim }} />
                                        : <List size={13} style={{ color: view === v ? 'white' : T.textDim }} />
                                    }
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Second row: Construtora + Tipo chips */}
                {(construtoras.length > 0 || tiposRaw.length > 1) && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${T.border}` }}>
                        {/* Construtora chips */}
                        {construtoras.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-bold uppercase tracking-[0.08em] mr-0.5" style={{ color: T.textDim }}>Construtora:</span>
                                {construtoras.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setFilterConstrutora(filterConstrutora === c ? 'all' : c)}
                                        className="px-2 h-6 rounded-lg text-[10px] font-semibold transition-all"
                                        style={{
                                            background: filterConstrutora === c ? T.accent : T.elevated,
                                            color: filterConstrutora === c ? 'white' : T.textDim,
                                            border: `1px solid ${filterConstrutora === c ? T.borderGold : T.border}`,
                                        }}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Tipo chips */}
                        {tiposRaw.length > 1 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-bold uppercase tracking-[0.08em] mr-0.5" style={{ color: T.textDim }}>Tipo:</span>
                                {tiposRaw.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setFilterTipo(filterTipo.toLowerCase() === t.toLowerCase() ? 'all' : t)}
                                        className="px-2 h-6 rounded-lg text-[10px] font-semibold transition-all"
                                        style={{
                                            background: filterTipo.toLowerCase() === t.toLowerCase() ? T.accent : T.elevated,
                                            color: filterTipo.toLowerCase() === t.toLowerCase() ? 'white' : T.textDim,
                                            border: `1px solid ${filterTipo.toLowerCase() === t.toLowerCase() ? T.borderGold : T.border}`,
                                        }}
                                    >
                                        {TIPO_LABEL[t.toLowerCase()] ?? t}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Clear secondary filters */}
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={() => { setFilterConstrutora('all'); setFilterTipo('all') }}
                                className="px-2 h-6 rounded-lg text-[10px] font-semibold ml-auto"
                                style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}
                            >
                                ✕ Limpar
                            </button>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Count */}
            <AnimatePresence mode="wait">
                <motion.p
                    key={filtered.length}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2 }}
                    className="text-[11px]"
                    style={{ color: T.textDim }}
                >
                    {filtered.length} imóvel{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                </motion.p>
            </AnimatePresence>

            {/* Empty state */}
            <AnimatePresence>
                {filtered.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center justify-center py-20 rounded-2xl"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }}
                    >
                        <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                            style={{ background: 'var(--bo-elevated)' }}
                        >
                            <Building2 size={28} style={{ color: T.textMuted, opacity: 0.3 }} />
                        </motion.div>
                        <p className="text-base font-bold mb-1" style={{ color: T.text }}>
                            {search ? 'Nenhum resultado' : filter !== 'all' ? `Nenhum imóvel ${STATUS_MAP[filter]?.label || filter}` : 'Portfólio vazio'}
                        </p>
                        <p className="text-sm mb-6 text-center max-w-xs" style={{ color: T.textMuted }}>
                            {search ? `Sem resultados para "${search}".` : filter !== 'all' ? 'Nenhum imóvel com este status.' : 'Cadastre o primeiro empreendimento.'}
                        </p>
                        {!search && filter === 'all' && (
                            <motion.button
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                onClick={() => router.push('/backoffice/imoveis/novo')}
                                className="flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold text-white"
                                style={{ background: 'linear-gradient(135deg, var(--bo-accent) 0%, #1D4ED8 100%)', boxShadow: '0 4px 14px rgba(37,99,235,0.28)' }}
                            >
                                <Plus size={16} /> Cadastrar Imóvel
                            </motion.button>
                        )}
                        {(search || filter !== 'all') && (
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => { setSearch(''); setFilter('all') }}
                                className="text-sm font-semibold hover:opacity-70 transition-opacity"
                                style={{ color: T.accent }}
                            >
                                Limpar filtros
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid */}
            <AnimatePresence>
                {filtered.length > 0 && view === 'grid' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {filtered.map((im, i) => (
                            <ImovelCard key={im.id} imovel={im} index={i} onAction={handleAction} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List */}
            <AnimatePresence>
                {filtered.length > 0 && view === 'list' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-1.5"
                    >
                        {filtered.map((im, i) => {
                            const s = STATUS_MAP[im.status] || STATUS_MAP.disponivel
                            return (
                                <motion.div
                                    key={im.id}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.025, duration: 0.3, ease: 'easeOut' }}
                                    whileHover={{ x: 3, borderColor: 'rgba(255,255,255,0.09)' }}
                                    className="group flex items-center gap-3 p-3 rounded-xl transition-colors"
                                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                                >
                                    <Link href={`/backoffice/imoveis/${im.id}`} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                                        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--bo-elevated)' }}>
                                            {im.image ? (
                                                <Image src={im.image} alt={im.titulo} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="48px" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Building2 size={20} style={{ color: T.accent, opacity: 0.3 }} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <p className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{im.titulo}</p>
                                                {im.destaque && <Star size={11} fill={T.accent} style={{ color: T.accent, flexShrink: 0 }} />}
                                            </div>
                                            <p className="text-[11px] truncate" style={{ color: T.textDim }}>
                                                {im.codigo} · {im.bairro}{im.area > 0 ? ` · ${im.area.toLocaleString('pt-BR')}m²` : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-[3px] rounded-full" style={{ color: s.text, background: s.bg }}>
                                                <span className="w-[5px] h-[5px] rounded-full" style={{ background: s.dot }} />
                                                {s.label}
                                            </span>
                                            <p className="text-sm font-bold hidden sm:block" style={{ color: T.accent }}>
                                                {fmtPreco(im.preco, im.tipo)}
                                            </p>
                                        </div>
                                    </Link>
                                    <div className="flex-shrink-0">
                                        <CardActionsMenu imovel={im} onAction={handleAction} />
                                    </div>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
