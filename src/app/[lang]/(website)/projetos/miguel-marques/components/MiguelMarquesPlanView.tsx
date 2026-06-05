'use client'

import React, {
  useRef, useState, useCallback, useMemo, useEffect, memo,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, ZoomIn, ZoomOut, RotateCcw, MessageCircle,
  ShoppingCart, Trash2, Layers, ChevronDown, ChevronUp,
} from 'lucide-react'
import { ALL_LOTS, type Lot } from '../data/lotsData'
import {
  QUADRA_LAYOUTS, CANVAS_W, CANVAS_H, LAKE,
  type QuadraLayout,
} from '../data/masterplanLayout'

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_SCALE = 0.08
const MAX_SCALE = 10
const WHATSAPP_NUMBER = '5581997230455'

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
  }).format(v)

const fmtM2 = (v: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v)} m²`

// Status colours — dark theme matching AltoBellevue
const STATUS_STYLES: Record<string, { label: string; fill: string; stroke: string; text: string }> = {
  disponivel:   { label: 'Disponível',   fill: 'rgba(34,197,94,0.22)',  stroke: '#22C55E', text: '#16A34A' },
  vendido:      { label: 'Vendido',      fill: 'rgba(30,41,59,0.65)',   stroke: '#334155', text: '#94A3B8' },
  negociacao:   { label: 'Negociação',   fill: 'rgba(234,179,8,0.22)',  stroke: '#EAB308', text: '#CA8A04' },
  proprietario: { label: 'Proprietário', fill: 'rgba(59,130,246,0.18)', stroke: '#3B82F6', text: '#2563EB' },
  igreja:       { label: 'Igreja',       fill: 'rgba(167,139,250,0.2)', stroke: '#A78BFA', text: '#7C3AED' },
}
const getStyle = (s: string) => STATUS_STYLES[s] ?? STATUS_STYLES['disponivel']

const PAYMENT_CONDITIONS = [
  { label: 'À vista',   desc: '20% desconto',        calc: (p: number) => p * 0.80 },
  { label: '12 meses',  desc: '15% desc + 10% ent.', calc: (p: number) => p * 0.85 },
  { label: '36 meses',  desc: '8% desc + 10% ent.',  calc: (p: number) => p * 0.92 },
  { label: '60 meses',  desc: '5% desc + 10% ent.',  calc: (p: number) => p * 0.95 },
  { label: '120 meses', desc: 'INCC/IPCA+0,5%/m',    calc: (p: number) => p },
]

const FILTER_OPTIONS = [
  { key: 'ALL',          label: 'Todos os lotes' },
  { key: 'disponivel',   label: 'Disponível' },
  { key: 'vendido',      label: 'Vendido' },
  { key: 'negociacao',   label: 'Negociação' },
  { key: 'proprietario', label: 'Proprietário' },
  { key: 'igreja',       label: 'Igreja' },
  { key: 'lt160',        label: '< 160 m²' },
  { key: 'eq160',        label: '= 160 m²' },
  { key: 'gt200',        label: '> 200 m²' },
  { key: 'lt25k',        label: 'Até R$ 25k' },
  { key: 'mid',          label: 'R$ 25k–37k' },
  { key: 'gt37k',        label: 'Acima R$ 37k' },
  { key: 'lakefront',    label: '🌊 Beira-lago' },
]

// ─── Lot grid position generator ─────────────────────────────────────────────

interface LotPos {
  x: number; y: number; w: number; h: number; lotIndex: number
}

function generateLotPositions(layout: QuadraLayout): LotPos[] {
  const positions: LotPos[] = []
  for (let row = 0; row < layout.rows; row++) {
    for (let col = 0; col < layout.cols; col++) {
      positions.push({
        x: layout.x + col * layout.lotW,
        y: layout.y + row * layout.lotH,
        w: layout.lotW - 1,
        h: layout.lotH - 1,
        lotIndex: row * layout.cols + col,
      })
    }
  }
  return positions
}

// ─── CartPanel ────────────────────────────────────────────────────────────────

interface CartPanelProps {
  cart: Lot[]
  onRemove: (id: string) => void
  onClear: () => void
}

const CartPanel = memo(function CartPanel({ cart, onRemove, onClear }: CartPanelProps) {
  const [payIdx, setPayIdx] = useState(0)
  const totalArea = cart.reduce((s, l) => s + l.metragem, 0)
  const totalPrice = cart.reduce((s, l) => s + l.valor, 0)

  function sendWhatsApp() {
    const lines = cart.map(l =>
      `• Quadra ${l.quadra}, Lote ${l.lote} — ${fmtM2(l.metragem)} — ${fmtBRL(l.valor)}`
    )
    const cond = PAYMENT_CONDITIONS[payIdx]
    const finalPrice = cond.calc(totalPrice)
    const msg = [
      `Olá! Tenho interesse nos seguintes lotes do *Miguel Marques*:\n`,
      lines.join('\n'),
      `\n*Valor total: ${fmtBRL(totalPrice)}*`,
      `*Condição: ${cond.label} (${cond.desc}) → ${fmtBRL(finalPrice)}*`,
      `\nGostaria de receber uma proposta. Obrigado!`,
    ].join('\n')
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-emerald-400" />
          <span className="font-semibold text-white text-sm">
            {cart.length} {cart.length === 1 ? 'lote' : 'lotes'}
          </span>
        </div>
        {cart.length > 0 && (
          <button onClick={onClear} className="text-slate-500 hover:text-red-400 text-xs flex items-center gap-1">
            <Trash2 size={12} /> Limpar
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500 p-6 text-center">
          <ShoppingCart size={32} className="opacity-30" />
          <p className="text-sm">Selecione lotes no mapa para adicionar à proposta</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.map(lot => (
              <div key={lot.id} className="bg-white/5 rounded-lg p-3 flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm">
                    Quadra {lot.quadra} · Lote {lot.lote}
                  </div>
                  <div className="text-slate-400 text-xs">{fmtM2(lot.metragem)}</div>
                  <div className="text-emerald-400 text-xs font-medium mt-0.5">{fmtBRL(lot.valor)}</div>
                </div>
                <button
                  onClick={() => onRemove(lot.id)}
                  className="text-slate-600 hover:text-red-400 flex-shrink-0 mt-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-white/10 space-y-3">
            <div className="bg-white/5 rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Área total</span><span>{fmtM2(totalArea)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-white">
                <span>Valor total</span><span>{fmtBRL(totalPrice)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-500 mb-1">Condição de pagamento:</div>
              {PAYMENT_CONDITIONS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setPayIdx(i)}
                  className={`w-full flex justify-between px-3 py-1.5 rounded text-xs transition-colors ${
                    i === payIdx
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'hover:bg-white/5 text-slate-400'
                  }`}
                >
                  <span>{c.label}</span>
                  <span className="font-medium">{fmtBRL(c.calc(totalPrice))}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 pt-0">
            <button
              onClick={sendWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#22c55e] active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-lg shadow-green-500/20"
            >
              <MessageCircle size={16} />
              Enviar Proposta no WhatsApp
            </button>
          </div>
        </>
      )}
    </div>
  )
})

// ─── LotInfoPanel ─────────────────────────────────────────────────────────────

interface LotInfoProps {
  lot: Lot
  inCart: boolean
  onAddToCart: () => void
  onRemoveFromCart: () => void
  onClose: () => void
}

function LotInfoPanel({ lot, inCart, onAddToCart, onRemoveFromCart, onClose }: LotInfoProps) {
  const st = getStyle(lot.status)
  const priceVista = lot.valor * 0.80

  return (
    <>
      <div className="fixed inset-0 z-[149] md:hidden" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 md:w-[360px] md:rounded-2xl rounded-t-[24px] shadow-2xl z-[150]"
        style={{
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          border: '1px solid rgba(0,0,0,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Drag handle — mobile only */}
        <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <div>
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-2"
              style={{ background: `${st.stroke}18`, color: st.text }}
            >
              {st.label}
              {lot.isLakefront && <span className="ml-1.5 text-blue-500">· Beira-lago</span>}
            </span>
            <div className="font-bold text-[#0B1928] text-lg leading-tight">
              Quadra {lot.quadra} · Lote {lot.lote}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-all flex-shrink-0 mt-0.5"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 py-4 space-y-4">
            {/* Price hero */}
            <div className="grid grid-cols-2 gap-3">
              <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 14, padding: '14px 16px' }}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#16A34A' }}>À VISTA</div>
                <div className="font-bold text-lg leading-tight" style={{ color: '#15803D' }}>{fmtBRL(priceVista)}</div>
                <div className="text-[11px] mt-1 font-medium" style={{ color: '#4ADE80' }}>20% desconto</div>
              </div>
              <div style={{ background: '#F8F6F2', border: '1.5px solid #E5E0D8', borderRadius: 14, padding: '14px 16px' }}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#948F84' }}>TABELA</div>
                <div className="font-bold text-lg leading-tight" style={{ color: '#0B1928' }}>{fmtBRL(lot.valor)}</div>
                <div className="text-[11px] mt-1" style={{ color: '#948F84' }}>
                  {fmtBRL(lot.valor / lot.metragem)}/m²
                </div>
              </div>
            </div>

            {/* Área */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span style={{ color: '#948F84', fontSize: 14 }}>Área do lote</span>
              <span style={{ color: '#0B1928', fontWeight: 700, fontSize: 14 }}>{fmtM2(lot.metragem)}</span>
            </div>

            {/* Payment conditions */}
            <div className="space-y-1.5">
              <div style={{ fontSize: 10, color: '#948F84', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Condições de Pagamento
              </div>
              {PAYMENT_CONDITIONS.map((c, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center px-3 py-2.5 rounded-xl"
                  style={i === 0
                    ? { background: '#F0FDF4', border: '1.5px solid #86EFAC' }
                    : { background: '#F8F6F2', border: '1px solid #E5E0D8' }
                  }
                >
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? '#15803D' : '#0B1928' }}>{c.label}</span>
                    <span style={{ fontSize: 11, color: '#948F84', marginLeft: 6 }}>{c.desc}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? '#15803D' : '#0B1928' }}>
                    {fmtBRL(c.calc(lot.valor))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        {lot.status === 'disponivel' && (
          <div
            className="px-5 py-4 border-t border-gray-100 flex-shrink-0"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}
          >
            {inCart ? (
              <button
                onClick={onRemoveFromCart}
                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ border: '1.5px solid #FCA5A5', color: '#DC2626', background: '#FFF1F1' }}
              >
                <X size={14} /> Remover da proposta
              </button>
            ) : (
              <button
                onClick={onAddToCart}
                className="w-full active:scale-[0.98] text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{ background: '#16A34A', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}
              >
                <ShoppingCart size={15} /> Adicionar à proposta
              </button>
            )}
          </div>
        )}

        {/* WhatsApp direct CTA for non-available lots */}
        {lot.status === 'negociacao' && (
          <div
            className="px-5 py-4 border-t border-gray-100 flex-shrink-0"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}
          >
            <button
              onClick={() => {
                const msg = `Olá! Tenho interesse no Lote ${lot.lote} da Quadra ${lot.quadra} do *Miguel Marques* (${fmtM2(lot.metragem)}). Pode me informar sobre a disponibilidade?`
                window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
              }}
              className="w-full active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
              style={{ background: '#25D366', boxShadow: '0 4px 14px rgba(37,211,102,0.3)' }}
            >
              <MessageCircle size={16} /> Consultar via WhatsApp
            </button>
          </div>
        )}
      </motion.div>
    </>
  )
}

// ─── Mobile hook ─────────────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface MiguelMarquesPlanViewProps {
  lots?: Lot[]
}

export default function MiguelMarquesPlanView({ lots: lotsProp }: MiguelMarquesPlanViewProps) {
  const lots = lotsProp ?? ALL_LOTS
  const isMobile = useIsMobile()
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)

  // Pan/zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const isPanning = useRef(false)
  const lastPan = useRef({ x: 0, y: 0 })
  const pinchRef = useRef<{ dist: number } | null>(null)

  // UI state
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [cart, setCart] = useState<Lot[]>([])
  const [showCart, setShowCart] = useState(false)
  const [filterKey, setFilterKey] = useState('ALL')
  const [showFilters, setShowFilters] = useState(false)

  // Set initial scale to fit canvas into container
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const el = containerRef.current
        const scaleX = el.clientWidth / CANVAS_W
        const scaleY = el.clientHeight / CANVAS_H
        const fit = Math.min(scaleX, scaleY, 1) * 0.92
        setTransform({ x: 0, y: 0, scale: Math.max(fit, MIN_SCALE) })
      }
      setLoading(false)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  // Filtered lots
  const filteredLots = useMemo(() => {
    if (filterKey === 'ALL') return lots
    if (filterKey === 'lt160') return lots.filter(l => l.metragem < 160)
    if (filterKey === 'eq160') return lots.filter(l => l.metragem === 160)
    if (filterKey === 'gt200') return lots.filter(l => l.metragem > 200)
    if (filterKey === 'lt25k') return lots.filter(l => l.valor > 0 && l.valor < 25_000)
    if (filterKey === 'mid') return lots.filter(l => l.valor >= 25_000 && l.valor <= 37_000)
    if (filterKey === 'gt37k') return lots.filter(l => l.valor > 37_000)
    if (filterKey === 'lakefront') return lots.filter(l => l.isLakefront)
    return lots.filter(l => l.status === filterKey)
  }, [filterKey, lots])

  const filteredIds = useMemo(() => new Set(filteredLots.map(l => l.id)), [filteredLots])
  const lotsById = useMemo(() => new Map(lots.map(l => [l.id, l])), [lots])

  const disponiveisCount = useMemo(() => lots.filter(l => l.status === 'disponivel').length, [lots])

  // Zoom
  const doZoom = useCallback((factor: number, cx = CANVAS_W / 2, cy = CANVAS_H / 2) => {
    setTransform(t => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale * factor))
      const ratio = newScale / t.scale
      return { scale: newScale, x: cx - (cx - t.x) * ratio, y: cy - (cy - t.y) * ratio }
    })
  }, [])

  const resetView = useCallback(() => {
    if (containerRef.current) {
      const el = containerRef.current
      const scaleX = el.clientWidth / CANVAS_W
      const scaleY = el.clientHeight / CANVAS_H
      const fit = Math.min(scaleX, scaleY, 1) * 0.92
      setTransform({ x: 0, y: 0, scale: Math.max(fit, MIN_SCALE) })
    } else {
      setTransform({ x: 0, y: 0, scale: 0.18 })
    }
  }, [])

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const rect = el!.getBoundingClientRect()
      const cx = ((e.clientX - rect.left) / rect.width) * CANVAS_W
      const cy = ((e.clientY - rect.top) / rect.height) * CANVAS_H
      const delta = e.deltaMode === 1 ? e.deltaY * 28 : e.deltaMode === 2 ? e.deltaY * 500 : e.deltaY
      doZoom(delta > 0 ? 0.88 : 1.14, cx, cy)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [doZoom])

  // Mouse pan
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest('[data-lot]')) return
    isPanning.current = true
    lastPan.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const dx = ((e.clientX - lastPan.current.x) / rect.width) * CANVAS_W
    const dy = ((e.clientY - lastPan.current.y) / rect.height) * CANVAS_H
    lastPan.current = { x: e.clientX, y: e.clientY }
    setTransform(t => ({ ...t, x: t.x + dx / t.scale, y: t.y + dy / t.scale }))
  }, [])

  const onMouseUp = useCallback(() => { isPanning.current = false }, [])

  // Touch pan/pinch
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchRef.current = { dist: Math.sqrt(dx * dx + dy * dy) }
    } else {
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const newDist = Math.sqrt(dx * dx + dy * dy)
      doZoom(newDist / pinchRef.current.dist)
      pinchRef.current = { dist: newDist }
    } else if (e.touches.length === 1) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const ddx = ((e.touches[0].clientX - lastPan.current.x) / rect.width) * CANVAS_W
      const ddy = ((e.touches[0].clientY - lastPan.current.y) / rect.height) * CANVAS_H
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      setTransform(t => ({ ...t, x: t.x + ddx / t.scale, y: t.y + ddy / t.scale }))
    }
  }, [doZoom])

  // Cart helpers
  const cartIds = useMemo(() => new Set(cart.map(l => l.id)), [cart])

  const addToCart = useCallback((lot: Lot) => {
    setCart(c => cartIds.has(lot.id) ? c : [...c, lot])
    setShowCart(true)
  }, [cartIds])

  const removeFromCart = useCallback((id: string) => setCart(c => c.filter(l => l.id !== id)), [])

  // Lot click
  const handleLotClick = useCallback((lotId: string) => {
    const lot = lotsById.get(lotId)
    if (!lot) return
    if (lot.status === 'vendido') return
    setSelectedLot(prev => prev?.id === lotId ? null : lot)
  }, [lotsById])

  const showScale = transform.scale >= 2.5

  // Build quadra centroid map for labels
  const quadraCentroids = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {}
    for (const layout of QUADRA_LAYOUTS) {
      const cx = layout.x + (layout.cols * layout.lotW) / 2
      const cy = layout.y + (layout.rows * layout.lotH) / 2
      map[layout.id] = { x: cx, y: cy }
    }
    return map
  }, [])

  const activeFilterLabel = FILTER_OPTIONS.find(o => o.key === filterKey)?.label ?? 'Todos'

  return (
    <div
      className="relative w-full h-full flex bg-[#070E16] overflow-hidden select-none"
      style={{ minHeight: '100%' }}
    >
      {/* Map SVG */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => { pinchRef.current = null }}
      >
        <svg
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          className="w-full h-full"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <radialGradient id="mm-lake-grad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#1E4E8C" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0C2E5A" stopOpacity="0.7" />
            </radialGradient>
            <filter id="mm-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <g transform={`scale(${transform.scale}) translate(${transform.x},${transform.y})`}>
            {/* Canvas background */}
            <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="#0D1B2A" />

            {/* Roads / streets — dark fill */}
            {/* Horizontal streets */}
            <rect x={0}    y={0}    width={CANVAS_W} height={60}  fill="#111827" />
            <rect x={0}    y={230}  width={CANVAS_W} height={32}  fill="#111827" />
            <rect x={0}    y={510}  width={CANVAS_W} height={32}  fill="#111827" />
            <rect x={0}    y={790}  width={CANVAS_W} height={32}  fill="#111827" />
            <rect x={0}    y={1060} width={CANVAS_W} height={32}  fill="#111827" />
            <rect x={0}    y={1330} width={CANVAS_W} height={32}  fill="#111827" />
            <rect x={0}    y={1610} width={CANVAS_W} height={32}  fill="#111827" />
            <rect x={0}    y={1880} width={CANVAS_W} height={32}  fill="#111827" />
            <rect x={0}    y={2060} width={CANVAS_W} height={60}  fill="#111827" />
            {/* Vertical streets */}
            <rect x={0}    y={0} width={60}  height={CANVAS_H} fill="#111827" />
            <rect x={580}  y={0} width={32}  height={CANVAS_H} fill="#111827" />
            <rect x={1140} y={0} width={50}  height={CANVAS_H} fill="#111827" />
            <rect x={1720} y={0} width={32}  height={CANVAS_H} fill="#111827" />
            <rect x={2100} y={0} width={32}  height={CANVAS_H} fill="#111827" />
            <rect x={2360} y={0} width={40}  height={CANVAS_H} fill="#111827" />

            {/* Lake */}
            <ellipse
              cx={LAKE.cx} cy={LAKE.cy}
              rx={LAKE.rx} ry={LAKE.ry}
              fill="url(#mm-lake-grad)"
              stroke="#2563EB"
              strokeWidth={3}
              opacity={0.85}
            />
            <text
              x={LAKE.cx} y={LAKE.cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#60A5FA"
              fontSize={28}
              fontWeight="bold"
              fontFamily="system-ui"
              style={{ pointerEvents: 'none', opacity: 0.7 }}
            >
              Lago
            </text>

            {/* Lot grid rendering */}
            {QUADRA_LAYOUTS.map(layout => {
              const positions = generateLotPositions(layout)
              return positions.map(pos => {
                const lotIdx = pos.lotIndex
                // Build lot id matching lotsData format: quadra letter + "-" + (lotIdx+1)
                const lotId = `${layout.id}-${lotIdx + 1}`
                const lot = lotsById.get(lotId)
                if (!lot) return null

                const isFiltered = !filteredIds.has(lotId)
                const isHovered = hoveredId === lotId
                const isSelected = selectedLot?.id === lotId
                const inCart = cartIds.has(lotId)
                const st = getStyle(lot.status)

                const fillColor = isFiltered
                  ? 'rgba(15,20,30,0.4)'
                  : isSelected
                    ? 'rgba(245,210,40,0.35)'
                    : inCart
                      ? 'rgba(52,211,153,0.32)'
                      : st.fill

                const strokeColor = isFiltered
                  ? '#1E293B'
                  : isSelected
                    ? '#F5D228'
                    : inCart
                      ? '#34D399'
                      : isHovered
                        ? '#FFFFFF'
                        : st.stroke

                const strokeWidth = (isSelected || isHovered ? 1.5 : 0.8) / transform.scale

                return (
                  <rect
                    key={lotId}
                    data-lot={lotId}
                    x={pos.x}
                    y={pos.y}
                    width={pos.w}
                    height={pos.h}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    style={{
                      cursor: lot.status === 'vendido' ? 'default' : 'pointer',
                      transition: 'fill 0.1s, stroke 0.1s',
                    }}
                    onMouseEnter={() => setHoveredId(lotId)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={(e) => { e.stopPropagation(); handleLotClick(lotId) }}
                  />
                )
              })
            })}

            {/* Lot number labels — only when zoomed in */}
            {showScale && QUADRA_LAYOUTS.map(layout => {
              const positions = generateLotPositions(layout)
              return positions.map(pos => {
                const lotId = `${layout.id}-${pos.lotIndex + 1}`
                if (!filteredIds.has(lotId)) return null
                const cx = pos.x + pos.w / 2
                const cy = pos.y + pos.h / 2
                const fontSize = Math.max(2, Math.min(5, 8 / transform.scale))
                return (
                  <text
                    key={`lbl-${lotId}`}
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fontSize}
                    fill={selectedLot?.id === lotId ? '#F5D228' : '#FFFFFFCC'}
                    style={{ pointerEvents: 'none', fontFamily: 'monospace', fontWeight: 600 }}
                  >
                    {pos.lotIndex + 1}
                  </text>
                )
              })
            })}

            {/* Quadra label badges — only when zoomed out */}
            {!showScale && (
              <g style={{ pointerEvents: 'none' }}>
                {Object.entries(quadraCentroids).map(([q, { x, y }]) => (
                  <g key={q} transform={`translate(${x},${y})`}>
                    <circle
                      r={12 / transform.scale}
                      fill="#0A1828CC"
                      stroke="#FFFFFF33"
                      strokeWidth={0.5 / transform.scale}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={10 / transform.scale}
                      fill="#FFFFFF"
                      fontWeight="bold"
                      fontFamily="system-ui"
                    >
                      {q}
                    </text>
                  </g>
                ))}
              </g>
            )}
          </g>
        </svg>

        {/* Zoom controls — top-left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
          <button
            onClick={() => doZoom(1.3)}
            className="w-9 h-9 md:w-8 md:h-8 bg-[#0A1828]/90 border border-white/10 rounded-lg text-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-transform"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={() => doZoom(0.77)}
            className="w-9 h-9 md:w-8 md:h-8 bg-[#0A1828]/90 border border-white/10 rounded-lg text-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-transform"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={resetView}
            className="w-9 h-9 md:w-8 md:h-8 bg-[#0A1828]/90 border border-white/10 rounded-lg text-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-transform"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Filter bar + Cart — top-right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 md:gap-2 z-20 max-w-[calc(100%-52px)]">
          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(f => !f)}
              className="flex items-center gap-1.5 h-9 md:h-8 px-3 bg-[#0A1828]/90 border border-white/10 rounded-lg text-slate-300 text-xs hover:bg-white/10 transition-colors"
            >
              <Layers size={12} />
              <span className="hidden sm:inline">
                {filterKey === 'ALL' ? 'Todos' : activeFilterLabel}
              </span>
              <ChevronDown size={10} />
            </button>
            {showFilters && (
              <div className="absolute right-0 top-full mt-1 bg-[#0A1828] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-40 z-30">
                {FILTER_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setFilterKey(opt.key); setShowFilters(false) }}
                    className={`w-full px-4 py-2.5 text-left text-xs hover:bg-white/5 transition-colors flex items-center gap-2 ${
                      filterKey === opt.key ? 'text-emerald-400' : 'text-slate-300'
                    }`}
                  >
                    {STATUS_STYLES[opt.key] && (
                      <span
                        className="w-2 h-2 rounded-sm flex-shrink-0"
                        style={{
                          background: STATUS_STYLES[opt.key].fill,
                          border: `1px solid ${STATUS_STYLES[opt.key].stroke}`,
                        }}
                      />
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart / Proposta button */}
          <button
            onClick={() => { setShowCart(s => !s); setSelectedLot(null) }}
            className="relative flex items-center gap-1.5 h-9 md:h-8 px-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs hover:bg-emerald-500/30 transition-colors"
          >
            <ShoppingCart size={13} />
            <span className="hidden sm:inline font-medium">Proposta</span>
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold leading-none">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        {/* Stats bar — bottom-left */}
        {!(isMobile && selectedLot && !showCart) && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs text-slate-500 z-20">
            <span className="bg-[#0A1828]/80 border border-white/5 rounded-lg px-2.5 py-1">
              <span className="text-emerald-400 font-semibold">{disponiveisCount}</span> disponíveis
            </span>
            <span className="hidden sm:inline bg-[#0A1828]/80 border border-white/5 rounded-lg px-2.5 py-1">
              <span className="text-white">{lots.length}</span> total
            </span>
          </div>
        )}

        {/* Legend — bottom-right */}
        {!(isMobile && selectedLot && !showCart) && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
            {(['disponivel', 'negociacao', 'vendido'] as const).map(k => (
              <div key={k} className="flex items-center gap-1 text-xs text-slate-400">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{
                    background: STATUS_STYLES[k].fill,
                    border: `1px solid ${STATUS_STYLES[k].stroke}`,
                  }}
                />
                <span className="hidden sm:inline">{STATUS_STYLES[k].label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#070E16]/80 z-50">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Lot info panel */}
        <AnimatePresence>
          {selectedLot && !showCart && (
            <LotInfoPanel
              lot={selectedLot}
              inCart={cartIds.has(selectedLot.id)}
              onAddToCart={() => addToCart(selectedLot)}
              onRemoveFromCart={() => removeFromCart(selectedLot.id)}
              onClose={() => setSelectedLot(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Cart sidebar — desktop */}
      <AnimatePresence>
        {showCart && !isMobile && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-white/10 bg-[#0A1828] overflow-hidden flex-shrink-0"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="text-sm font-semibold text-white">Proposta de Compra</span>
              <button onClick={() => setShowCart(false)} className="text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="h-[calc(100%-49px)] overflow-hidden">
              <CartPanel
                cart={cart}
                onRemove={removeFromCart}
                onClear={() => setCart([])}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart bottom sheet — mobile */}
      <AnimatePresence>
        {showCart && isMobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[155]"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 right-0 bg-[#0A1828] border-t border-white/10 rounded-t-[20px] z-[160] flex flex-col"
              style={{ bottom: 0, maxHeight: '75vh', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
                <div className="w-8 h-1 rounded-full bg-white/25" />
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={15} className="text-emerald-400" />
                  <span className="text-sm font-semibold text-white">Proposta de Compra</span>
                  {cart.length > 0 && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                      {cart.length} lote{cart.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-white"
                >
                  <ChevronUp size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <CartPanel
                  cart={cart}
                  onRemove={removeFromCart}
                  onClear={() => setCart([])}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
