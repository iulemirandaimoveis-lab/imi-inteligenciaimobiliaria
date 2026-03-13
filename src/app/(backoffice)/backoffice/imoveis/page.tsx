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
    AlertCircle, Tag, Archive, Trash2, ShoppingCart, X, ArrowUpDown,
    TrendingUp, Users, Flame, Zap, Award, BarChart2, Percent,
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
    hotLeads: number
    totalLeads: number
    // ── Investment intelligence ────────────────────────────
    imiScore: number      // 0–99 composite investment score
    roi: number           // estimated annual ROI %
    valorizacao: number   // estimated appreciation potential %
    pricePerSqm: number   // R$/m²
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

/* ─── IMI SCORE BAR ──────────────────────────────────────────────── */
function IMIScoreBar({ score, liquidez }: { score: number; liquidez: number }) {
    const color = score >= 80 ? '#C8A46A' : score >= 65 ? T.success : score >= 50 ? T.warning : T.error
    const label = score >= 80 ? 'Excelente' : score >= 65 ? 'Bom' : score >= 50 ? 'Regular' : 'Baixo'
    const dots = Math.min(5, Math.round(score / 20))
    const liqColor = liquidez >= 75 ? T.success : liquidez >= 55 ? '#a3e635' : liquidez >= 40 ? T.warning : T.error
    return (
        <div className="space-y-1.5">
            {/* IMI Score dots + value */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.22)' }}>IMI Score</span>
                    <div className="flex gap-[3px]">
                        {[1,2,3,4,5].map(d => (
                            <motion.span
                                key={d}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: d * 0.06 + 0.3, type: 'spring', stiffness: 300 }}
                                className="w-[6px] h-[6px] rounded-full"
                                style={{ background: d <= dots ? color : 'rgba(255,255,255,0.08)' }}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{score}</span>
                    <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>/ {label}</span>
                </div>
            </div>
            {/* Liquidity bar */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${liquidez}%` }}
                        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${liqColor}44, ${liqColor})` }}
                    />
                </div>
                <span className="text-[9px] tabular-nums flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    Liq {liquidez}%
                </span>
            </div>
        </div>
    )
}

/* ─── INVEST METRICS STRIP ───────────────────────────────────────── */
function InvestMetrics({ roi, valorizacao, pricePerSqm }: { roi: number; valorizacao: number; pricePerSqm: number }) {
    return (
        <div className="grid grid-cols-3 divide-x divide-white/5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
                { label: 'ROI a.a.', value: `${roi}%`,        color: T.success },
                { label: 'Val. Est.',value: `+${valorizacao}%`, color: '#C8A46A' },
                { label: 'R$/m²',    value: pricePerSqm > 0 ? `${(pricePerSqm/1000).toFixed(0)}k` : '—', color: 'rgba(255,255,255,0.55)' },
            ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center py-2">
                    <span className="text-[8px] font-bold uppercase tracking-[0.1em] mb-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>{label}</span>
                    <span className="text-[12px] font-bold tabular-nums" style={{ color }}>{value}</span>
                </div>
            ))}
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
        ...(imovel.status !== 'vendido'   ? [{ key: 'vendido',    label: 'Marcar Vendido', icon: ShoppingCart, color: T.warning }] : []),
        ...(imovel.status !== 'arquivado' ? [{ key: 'arquivado',  label: 'Arquivar',        icon: Archive,      color: '#f59e0b' }] : []),
        ...(imovel.status === 'arquivado' ? [{ key: 'disponivel', label: 'Restaurar',       icon: CheckCircle,  color: T.success }] : []),
        { key: 'delete',    label: 'Excluir',          icon: Trash2,       color: T.error },
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

                        {/* Bottom: status + leads/views (always visible) */}
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
                            <div className="flex items-center gap-1.5">
                                {imovel.hotLeads > 0 && (
                                    <motion.span
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', delay: index * 0.05 + 0.4, stiffness: 300 }}
                                        className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-[3px] rounded-full"
                                        style={{
                                            color: 'var(--bo-error)',
                                            background: 'rgba(0,0,0,0.58)',
                                            border: '1px solid rgba(248,113,113,0.3)',
                                            backdropFilter: 'blur(8px)',
                                        }}
                                    >
                                        <Flame size={8} fill="var(--bo-error)" /> {imovel.hotLeads}
                                    </motion.span>
                                )}
                                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.42)' }}>
                                    {imovel.visitas > 0 ? `${imovel.visitas}v` : ''}
                                </span>
                            </div>
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

                        {/* IMI Score */}
                        <div className="pt-2.5 mb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <IMIScoreBar score={imovel.imiScore} liquidez={imovel.liquidez} />
                        </div>

                        {/* Investment metrics strip */}
                        <div className="rounded-xl overflow-hidden -mx-4 mb-0" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <InvestMetrics roi={imovel.roi} valorizacao={imovel.valorizacao} pricePerSqm={imovel.pricePerSqm} />
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
    const [sort, setSort] = useState<'recentes' | 'preco_asc' | 'preco_desc' | 'liquidez' | 'visitas' | 'leads' | 'roi' | 'score'>('recentes')
    const [showSortMenu, setShowSortMenu] = useState(false)
    const [smartFilter, setSmartFilter] = useState('')
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
                            const preco    = d.price_min || d.price_from || 0
                            const area     = d.private_area || d.area_from || 0
                            const liquidez = Math.min(97, 22 + s.hot * 13 + s.warm * 8 + s.total * 3 + s.won * 16)
                            const pricePerSqm = area > 0 && preco > 0 ? preco / area : 0
                            // Investment intelligence — heuristic until market data API
                            const roi        = parseFloat((4.2 + (liquidez / 100) * 7.8).toFixed(1))
                            const valorizacao = parseFloat((5.5 + (liquidez / 100) * 6.5).toFixed(1))
                            const leadActivityScore = Math.min(100, s.total * 8 + s.hot * 20 + s.won * 25)
                            const imiScore = Math.min(99, Math.round(
                                liquidez * 0.45 +
                                leadActivityScore * 0.35 +
                                (roi / 12 * 100) * 0.20
                            ))
                            return {
                                id: d.id,
                                codigo: d.slug ? `IMI-${d.slug.substring(0, 8).toUpperCase()}` : `IMI-${String(d.id).substring(0, 8)}`,
                                status: DB_STATUS_TO_DISPLAY[d.status] || DB_STATUS_TO_DISPLAY[d.status_commercial] || 'disponivel',
                                destaque: !!d.is_highlighted,
                                tipo: d.type || d.tipo || d.property_type || 'Imóvel',
                                titulo: d.name || 'Empreendimento',
                                bairro: d.neighborhood || d.region || 'Localização',
                                area,
                                quartos: d.bedrooms || 0,
                                banheiros: d.bathrooms || 0,
                                vagas: d.parking_spaces || 0,
                                preco,
                                construtora: d.developer || d.developers?.name || null,
                                construtora_logo: d.developers?.logo_url || null,
                                visitas: d.views || 0,
                                image: d.image || (Array.isArray(d.gallery_images) && d.gallery_images[0]) || null,
                                liquidez,
                                hotLeads: s.hot,
                                totalLeads: s.total,
                                imiScore,
                                roi,
                                valorizacao,
                                pricePerSqm,
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
    const lancamentosCount = imoveis.filter(i => i.status === 'lancamento').length
    const disponiveis = imoveis.filter(i => i.status === 'disponivel').length
    const vgvEstimado = imoveis.reduce((sum, i) => sum + (i.preco || 0), 0)
    const totalLeadsAll = imoveis.reduce((sum, i) => sum + i.totalLeads, 0)
    const roiMedio = imoveis.length > 0
        ? (imoveis.reduce((sum, i) => sum + i.roi, 0) / imoveis.length).toFixed(1)
        : '—'
    const avgPricePerSqm = (() => {
        const valid = imoveis.filter(i => i.pricePerSqm > 0)
        return valid.length > 0 ? valid.reduce((s, i) => s + i.pricePerSqm, 0) / valid.length : 0
    })()

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
        const matchSmart = !smartFilter || (() => {
            switch (smartFilter) {
                case 'alta_liquidez':   return im.liquidez >= 72
                case 'melhor_roi':      return im.roi >= 9.5
                case 'abaixo_mercado':  return avgPricePerSqm > 0 && im.pricePerSqm > 0 && im.pricePerSqm < avgPricePerSqm * 0.9
                case 'top_score':       return im.imiScore >= 65
                case 'lancamentos':     return im.status === 'lancamento'
                default: return true
            }
        })()
        return matchSearch && matchFilter && matchConstrutora && matchTipo && matchSmart
    })

    // Status counts for filter chips
    const statusCounts: Record<string, number> = Object.fromEntries(
        Object.keys(STATUS_MAP).map(k => [k, imoveis.filter(i => i.status === k).length])
    )

    // Sort filtered results
    const sorted = [...filtered].sort((a, b) => {
        switch (sort) {
            case 'preco_asc':  return (a.preco || 0) - (b.preco || 0)
            case 'preco_desc': return (b.preco || 0) - (a.preco || 0)
            case 'liquidez':   return b.liquidez - a.liquidez
            case 'visitas':    return b.visitas - a.visitas
            case 'leads':      return b.totalLeads - a.totalLeads
            case 'roi':        return b.roi - a.roi
            case 'score':      return b.imiScore - a.imiScore
            default:           return 0  // recentes — preserve API order
        }
    })

    const SORT_LABELS: Record<string, string> = {
        recentes: 'Recentes', preco_desc: 'Maior preço', preco_asc: 'Menor preço',
        liquidez: 'Liquidez ↓', visitas: 'Visualizações ↓', leads: 'Mais leads',
        roi: 'Maior ROI', score: 'IMI Score ↓',
    }

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
            <div data-tour="actions">
            <PageIntelHeader
                moduleLabel="IMOVEIS"
                title="Portfólio / Empreendimentos"
                subtitle={`Gestão Global IMI · ${total} ativos comerciais`}
                actions={
                    <button
                        onClick={() => router.push('/backoffice/imoveis/novo')}
                        className="bo-btn bo-btn-primary"
                    >
                        <Plus size={14} />
                        <span className="hidden sm:inline">Novo Empreendimento</span>
                        <span className="sm:hidden">Novo</span>
                    </button>
                }
            />
            </div>

            {/* KPIs — investment intelligence */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                    { label: 'VGV Global (Est.)', display: `R$ ${fmtVGV(vgvEstimado)}`, icon: DollarSign, accent: 'blue' as const },
                    { label: 'ROI Médio Portfolio', display: `${roiMedio}%`,             icon: TrendingUp,  accent: 'green' as const },
                    { label: 'Leads Captados',      display: String(totalLeadsAll),       icon: Users,       accent: 'blue' as const },
                    { label: 'Disponíveis',          display: String(disponiveis),         icon: CheckCircle, accent: 'blue' as const },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.35, ease: 'easeOut' }}
                    >
                        <KPICard
                            label={s.label}
                            value={s.display}
                            icon={<s.icon size={16} />}
                            accent={s.accent}
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
                {/* Row 1: Search + Sort + View toggle — always fully visible */}
                <div className="flex items-center gap-2">
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

                    {/* Sort dropdown */}
                    <div className="relative flex-shrink-0">
                        <motion.button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            whileTap={{ scale: 0.92 }}
                            className="h-9 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                            style={{
                                background: sort !== 'recentes' ? T.accentBg : T.elevated,
                                border: `1px solid ${sort !== 'recentes' ? T.borderGold : T.border}`,
                                color: sort !== 'recentes' ? T.accent : T.textDim,
                            }}
                        >
                            <ArrowUpDown size={12} />
                            <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
                        </motion.button>
                        <AnimatePresence>
                            {showSortMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.88, y: -8 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.88, y: -8 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                        className="absolute right-0 top-11 z-50 w-48 rounded-xl overflow-hidden shadow-2xl"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                                    >
                                        {[
                                            { key: 'recentes',   label: 'Mais recentes' },
                                            { key: 'score',      label: 'IMI Score ↓' },
                                            { key: 'roi',        label: 'Maior ROI' },
                                            { key: 'liquidez',   label: 'Maior liquidez' },
                                            { key: 'preco_desc', label: 'Maior preço' },
                                            { key: 'preco_asc',  label: 'Menor preço' },
                                            { key: 'leads',      label: 'Mais leads' },
                                            { key: 'visitas',    label: 'Mais visualizações' },
                                        ].map((opt) => (
                                            <button
                                                key={opt.key}
                                                onClick={() => { setSort(opt.key as typeof sort); setShowSortMenu(false) }}
                                                className="flex items-center w-full px-3 py-2.5 text-xs text-left hover:bg-[var(--bo-hover)] transition-colors"
                                                style={{
                                                    color: sort === opt.key ? T.accent : T.text,
                                                    fontWeight: sort === opt.key ? 700 : 500,
                                                }}
                                            >
                                                {sort === opt.key && <CheckCircle size={10} className="mr-1.5 flex-shrink-0" />}
                                                {opt.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1px solid ${T.border}` }}>
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

                {/* Row 2: Status filter chips — horizontal scroll on all sizes */}
                <div
                    className="flex items-center gap-1.5 mt-2"
                    style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                    <LayoutGroup>
                        {['all', ...Object.keys(STATUS_MAP)].map(s => (
                            <motion.button
                                key={s}
                                layout
                                onClick={() => setFilter(s)}
                                className="relative px-2.5 h-7 rounded-xl text-[11px] font-semibold transition-colors inline-flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap"
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
                                {s === 'all'
                                    ? `Todos (${imoveis.length})`
                                    : statusCounts[s] > 0
                                        ? `${STATUS_MAP[s]?.label} (${statusCounts[s]})`
                                        : STATUS_MAP[s]?.label
                                }
                            </motion.button>
                        ))}
                    </LayoutGroup>
                </div>

                {/* Filtros Inteligentes IMI — horizontal scroll on mobile */}
                <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
                    <div
                        className="flex items-center gap-1.5"
                        style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                    >
                        <div className="flex items-center gap-1 flex-shrink-0 mr-0.5">
                            <Zap size={9} style={{ color: T.accent }} />
                            <span className="text-[9px] font-bold uppercase tracking-[0.1em] whitespace-nowrap" style={{ color: T.textDim }}>Filtros IA</span>
                        </div>
                        {[
                            { key: 'top_score',      label: 'Top IMI Score',    icon: Award },
                            { key: 'melhor_roi',     label: 'Melhor ROI',       icon: TrendingUp },
                            { key: 'alta_liquidez',  label: 'Alta Liquidez',    icon: BarChart2 },
                            { key: 'abaixo_mercado', label: 'Abaixo Mercado',   icon: Percent },
                            { key: 'lancamentos',    label: 'Lançamentos',      icon: Tag },
                        ].map(sf => {
                            const Icon = sf.icon
                            const active = smartFilter === sf.key
                            return (
                                <motion.button
                                    key={sf.key}
                                    onClick={() => setSmartFilter(active ? '' : sf.key)}
                                    whileTap={{ scale: 0.92 }}
                                    className="flex items-center gap-1 text-[10px] font-semibold px-2 h-7 rounded-lg transition-all flex-shrink-0 whitespace-nowrap"
                                    style={{
                                        background: active ? 'rgba(200,164,106,0.15)' : T.elevated,
                                        color: active ? '#C8A46A' : T.textDim,
                                        border: `1px solid ${active ? 'rgba(200,164,106,0.45)' : T.border}`,
                                    }}
                                >
                                    <Icon size={9} />
                                    {sf.label}
                                </motion.button>
                            )
                        })}
                        {smartFilter && (
                            <button
                                onClick={() => setSmartFilter('')}
                                className="text-[9px] font-semibold flex-shrink-0 ml-1"
                                style={{ color: T.error, whiteSpace: 'nowrap' }}
                            >
                                ✕ limpar
                            </button>
                        )}
                    </div>
                </div>

                {/* Third row: Construtora + Tipo chips — horizontal scroll on mobile */}
                {(construtoras.length > 0 || tiposRaw.length > 1) && (
                    <div className="mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${T.border}` }}>
                        <div
                            className="flex items-center gap-1.5"
                            style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                        >
                            {/* Construtora chips */}
                            {construtoras.length > 0 && (
                                <>
                                    <span className="text-[9px] font-bold uppercase tracking-[0.08em] flex-shrink-0 whitespace-nowrap" style={{ color: T.textDim }}>Construtora:</span>
                                    {construtoras.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setFilterConstrutora(filterConstrutora === c ? 'all' : c)}
                                            className="px-2 h-7 rounded-lg text-[10px] font-semibold transition-all flex-shrink-0 whitespace-nowrap"
                                            style={{
                                                background: filterConstrutora === c ? T.accent : T.elevated,
                                                color: filterConstrutora === c ? 'white' : T.textDim,
                                                border: `1px solid ${filterConstrutora === c ? T.borderGold : T.border}`,
                                            }}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </>
                            )}

                            {/* Tipo chips */}
                            {tiposRaw.length > 1 && (
                                <>
                                    {construtoras.length > 0 && (
                                        <span className="flex-shrink-0" style={{ width: '1px', height: '16px', background: T.border }} />
                                    )}
                                    <span className="text-[9px] font-bold uppercase tracking-[0.08em] flex-shrink-0 whitespace-nowrap" style={{ color: T.textDim }}>Tipo:</span>
                                    {tiposRaw.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setFilterTipo(filterTipo.toLowerCase() === t.toLowerCase() ? 'all' : t)}
                                            className="px-2 h-7 rounded-lg text-[10px] font-semibold transition-all flex-shrink-0 whitespace-nowrap"
                                            style={{
                                                background: filterTipo.toLowerCase() === t.toLowerCase() ? T.accent : T.elevated,
                                                color: filterTipo.toLowerCase() === t.toLowerCase() ? 'white' : T.textDim,
                                                border: `1px solid ${filterTipo.toLowerCase() === t.toLowerCase() ? T.borderGold : T.border}`,
                                            }}
                                        >
                                            {TIPO_LABEL[t.toLowerCase()] ?? t}
                                        </button>
                                    ))}
                                </>
                            )}

                            {/* Clear secondary filters */}
                            {activeFiltersCount > 0 && (
                                <button
                                    onClick={() => { setFilterConstrutora('all'); setFilterTipo('all') }}
                                    className="px-2 h-7 rounded-lg text-[10px] font-semibold flex-shrink-0 ml-1"
                                    style={{ color: T.error, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', whiteSpace: 'nowrap' }}
                                >
                                    ✕ Limpar
                                </button>
                            )}
                        </div>
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
                    {filtered.length} imóvel{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}{sort !== 'recentes' && ` · ordenado por ${SORT_LABELS[sort].toLowerCase()}`}
                </motion.p>
            </AnimatePresence>

            {/* Empty state */}
            <AnimatePresence>
                {sorted.length === 0 && (
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
                                className="bo-btn bo-btn-primary"
                                style={{ background: 'var(--bo-accent)' }}
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
                {sorted.length > 0 && view === 'grid' && (
                    <motion.div
                        data-tour="imoveis-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {sorted.map((im, i) => (
                            <ImovelCard key={im.id} imovel={im} index={i} onAction={handleAction} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List — proper data table */}
            <AnimatePresence>
                {sorted.length > 0 && view === 'list' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="rounded-2xl overflow-hidden"
                        style={{ border: `1px solid ${T.border}` }}
                    >
                        {/* Table header */}
                        <div
                            className="hidden sm:grid items-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                            style={{
                                gridTemplateColumns: '48px 1fr 90px 110px 80px 76px 64px 64px 44px',
                                gap: '10px',
                                color: T.textDim,
                                background: T.elevated,
                                borderBottom: `1px solid ${T.border}`,
                            }}
                        >
                            <span />
                            <span>Empreendimento</span>
                            <span>Status</span>
                            <span>Preço</span>
                            <span>IMI Score</span>
                            <span>Liquidez</span>
                            <span>ROI</span>
                            <span>Leads</span>
                            <span />
                        </div>
                        {sorted.map((im, i) => {
                            const s = STATUS_MAP[im.status] || STATUS_MAP.disponivel
                            return (
                                <motion.div
                                    key={im.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.02, duration: 0.25, ease: 'easeOut' }}
                                    className="group"
                                    style={{ borderBottom: i < sorted.length - 1 ? `1px solid ${T.border}` : 'none', background: T.surface }}
                                >
                                    {/* Mobile: compact row */}
                                    <Link href={`/backoffice/imoveis/${im.id}`} className="flex sm:hidden items-center gap-3 p-3 cursor-pointer">
                                        <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--bo-elevated)' }}>
                                            {im.image
                                                ? <Image src={im.image} alt={im.titulo} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="44px" />
                                                : <div className="w-full h-full flex items-center justify-center"><Building2 size={18} style={{ color: T.accent, opacity: 0.3 }} /></div>
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{im.titulo}</p>
                                            <p className="text-[11px]" style={{ color: T.textDim }}>{im.bairro}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-[3px] rounded-full" style={{ color: s.text, background: s.bg }}>
                                                <span className="w-[4px] h-[4px] rounded-full" style={{ background: s.dot }} />{s.label}
                                            </span>
                                            <p className="text-[12px] font-bold" style={{ color: T.accent }}>{fmtPreco(im.preco, im.tipo)}</p>
                                        </div>
                                    </Link>

                                    {/* Desktop: full table row */}
                                    <div
                                        className="hidden sm:grid items-center px-4 py-3 hover:bg-[var(--bo-hover)] transition-colors"
                                        style={{ gridTemplateColumns: '48px 1fr 90px 110px 80px 76px 64px 64px 44px', gap: '10px' }}
                                    >
                                        <Link href={`/backoffice/imoveis/${im.id}`} className="contents cursor-pointer">
                                            {/* Thumbnail */}
                                            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--bo-elevated)' }}>
                                                {im.image
                                                    ? <Image src={im.image} alt={im.titulo} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="48px" />
                                                    : <div className="w-full h-full flex items-center justify-center"><Building2 size={20} style={{ color: T.accent, opacity: 0.3 }} /></div>
                                                }
                                            </div>
                                            {/* Name + location */}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <p className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{im.titulo}</p>
                                                    {im.destaque && <Star size={10} fill={T.accent} style={{ color: T.accent, flexShrink: 0 }} />}
                                                </div>
                                                <p className="text-[10px] truncate" style={{ color: T.textDim }}>
                                                    {im.bairro} {im.construtora ? `· ${im.construtora}` : ''}
                                                </p>
                                            </div>
                                            {/* Status */}
                                            <div>
                                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-[3px] rounded-full" style={{ color: s.text, background: s.bg }}>
                                                    <span className="w-[4px] h-[4px] rounded-full flex-shrink-0" style={{ background: s.dot }} />
                                                    {s.label}
                                                </span>
                                            </div>
                                            {/* Price + R$/m² */}
                                            <div>
                                                <p className="text-[13px] font-bold leading-tight" style={{ color: T.accent }}>{fmtPreco(im.preco, im.tipo)}</p>
                                                {im.pricePerSqm > 0 && (
                                                    <p className="text-[9px] tabular-nums" style={{ color: T.textDim }}>
                                                        R$ {Math.round(im.pricePerSqm).toLocaleString('pt-BR')}/m²
                                                    </p>
                                                )}
                                            </div>
                                            {/* IMI Score */}
                                            <div>
                                                {(() => {
                                                    const c = im.imiScore >= 80 ? '#C8A46A' : im.imiScore >= 65 ? T.success : im.imiScore >= 50 ? T.warning : T.error
                                                    const dots = Math.min(5, Math.round(im.imiScore / 20))
                                                    return (
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="flex gap-[3px]">
                                                                {[1,2,3,4,5].map(d => (
                                                                    <span key={d} className="w-[5px] h-[5px] rounded-full" style={{ background: d <= dots ? c : 'rgba(255,255,255,0.08)' }} />
                                                                ))}
                                                            </div>
                                                            <span className="text-[10px] font-bold tabular-nums" style={{ color: c }}>{im.imiScore}</span>
                                                        </div>
                                                    )
                                                })()}
                                            </div>
                                            {/* Liquidez */}
                                            <div className="w-full">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex-1 h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                                        <div
                                                            className="h-full rounded-full transition-all duration-700"
                                                            style={{
                                                                width: `${im.liquidez}%`,
                                                                background: im.liquidez >= 75 ? T.success : im.liquidez >= 55 ? '#a3e635' : im.liquidez >= 40 ? T.warning : T.error,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold tabular-nums flex-shrink-0" style={{ color: im.liquidez >= 75 ? T.success : im.liquidez >= 40 ? T.warning : T.error }}>
                                                        {im.liquidez}%
                                                    </span>
                                                </div>
                                            </div>
                                            {/* ROI */}
                                            <div>
                                                <p className="text-[11px] font-bold tabular-nums" style={{ color: T.success }}>{im.roi}%</p>
                                                <p className="text-[9px]" style={{ color: T.textDim }}>a.a.</p>
                                            </div>
                                            {/* Leads */}
                                            <div className="flex items-center gap-1">
                                                {im.hotLeads > 0 && (
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-[2px] rounded-md" style={{ color: 'var(--bo-error)', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.2)' }}>
                                                        <Flame size={8} fill="var(--bo-error)" /> {im.hotLeads}
                                                    </span>
                                                )}
                                                {im.totalLeads > im.hotLeads && (
                                                    <span className="text-[10px]" style={{ color: T.textDim }}>+{im.totalLeads - im.hotLeads}</span>
                                                )}
                                                {im.totalLeads === 0 && <span className="text-[10px]" style={{ color: T.textDim }}>—</span>}
                                            </div>
                                        </Link>
                                        {/* Actions */}
                                        <div className="flex items-center justify-end">
                                            <CardActionsMenu imovel={im} onAction={handleAction} />
                                        </div>
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
