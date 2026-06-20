'use client'

import React, {
  useRef, useState, useCallback, useMemo, useEffect, memo,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, ZoomIn, ZoomOut, RotateCcw, MessageCircle,
  ShoppingCart, Trash2, Maximize2, Minimize2,
} from 'lucide-react'
import { ALL_LOTS, type Lot } from '../data/lotsData'
import {
  QUADRA_LAYOUTS, CANVAS_W, CANVAS_H, LAKE,
  type QuadraLayout,
} from '../data/masterplanLayout'

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_SCALE = 0.08
const MAX_SCALE = 10
const WHATSAPP_NUMBER = '5581986141487'
const GOLD = '#C8A44A'
const NAVY = '#0B1928'

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
  }).format(v)

const fmtM2 = (v: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v)} m²`

// Status colours — matching AltoBellevuePlanView STATUS_CFG visual language
const STATUS_STYLES: Record<string, { label: string; fill: string; stroke: string; dot: string; badgeBg: string; badgeText: string }> = {
  disponivel:   { label: 'Disponível',   fill: 'rgba(34,197,94,0.68)',   stroke: '#16A34A', dot: '#16A34A', badgeBg: '#DCFCE7', badgeText: '#166534' },
  vendido:      { label: 'Vendido',      fill: 'rgba(55,65,81,0.88)',    stroke: '#374151', dot: '#EF4444', badgeBg: '#FEE2E2', badgeText: '#991B1B' },
  negociacao:   { label: 'Negociação',   fill: 'rgba(245,158,11,0.72)',  stroke: '#D97706', dot: '#D97706', badgeBg: '#FEF3C7', badgeText: '#92400E' },
  proprietario: { label: 'Proprietário', fill: 'rgba(59,130,246,0.65)',  stroke: '#2563EB', dot: '#2563EB', badgeBg: '#DBEAFE', badgeText: '#1E40AF' },
  igreja:       { label: 'Igreja',       fill: 'rgba(13,148,136,0.55)',  stroke: '#0D9488', dot: '#0D9488', badgeBg: '#CCFBF1', badgeText: '#115E59' },
}
const getStyle = (s: string) => STATUS_STYLES[s] ?? STATUS_STYLES['disponivel']

const PAYMENT_CONDITIONS = [
  { label: 'À vista',   desc: '20% desconto',        calc: (p: number) => p * 0.80 },
  { label: '12 meses',  desc: '15% desc + 10% ent.', calc: (p: number) => p * 0.85 },
  { label: '36 meses',  desc: '8% desc + 10% ent.',  calc: (p: number) => p * 0.92 },
  { label: '60 meses',  desc: '5% desc + 10% ent.',  calc: (p: number) => p * 0.95 },
  { label: '150 meses', desc: 'Carnê direto',         calc: (p: number) => p },
]

const STATUS_FILTER_KEYS = ['ALL', 'disponivel', 'vendido', 'negociacao', 'proprietario'] as const

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

// ─── MapBtn — matches Alto Bellevue control style ─────────────────────────────

const MapBtn = memo(function MapBtn({ onClick, label, children, active }: {
  onClick: () => void; label: string; children: React.ReactNode; active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex items-center justify-center active:scale-95 transition-all"
      style={{
        width: 40, height: 40, borderRadius: 10,
        background: active ? NAVY : 'rgba(255,255,255,0.92)',
        color: active ? '#fff' : NAVY,
        border: active ? `1.5px solid ${GOLD}` : '1.5px solid rgba(184,179,168,0.4)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </button>
  )
})

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
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(184,179,168,0.2)' }}>
        <div className="flex items-center gap-2">
          <ShoppingCart size={15} style={{ color: GOLD }} />
          <span className="font-semibold text-sm" style={{ color: NAVY }}>
            {cart.length} {cart.length === 1 ? 'lote' : 'lotes'}
          </span>
        </div>
        {cart.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs flex items-center gap-1 transition-colors hover:opacity-70"
            style={{ color: '#EF4444' }}
          >
            <Trash2 size={11} /> Limpar
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center" style={{ color: '#948F84' }}>
          <ShoppingCart size={32} className="opacity-30" />
          <p className="text-sm">Selecione lotes no mapa para adicionar à proposta</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.map(lot => (
              <div key={lot.id} className="rounded-xl p-3 flex items-start gap-2" style={{ background: '#F8F6F2', border: '1px solid rgba(184,179,168,0.25)' }}>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: NAVY }}>
                    Quadra {lot.quadra} · Lote {lot.lote}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#948F84' }}>{fmtM2(lot.metragem)}</div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: '#16A34A' }}>{fmtBRL(lot.valor)}</div>
                </div>
                <button
                  onClick={() => onRemove(lot.id)}
                  className="flex-shrink-0 mt-0.5 hover:opacity-70"
                  style={{ color: '#948F84' }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 space-y-3" style={{ borderTop: '1px solid rgba(184,179,168,0.2)' }}>
            <div className="rounded-xl p-3 space-y-1.5" style={{ background: '#F8F6F2' }}>
              <div className="flex justify-between text-xs" style={{ color: '#948F84' }}>
                <span>Área total</span><span>{fmtM2(totalArea)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold" style={{ color: NAVY }}>
                <span>Valor total</span><span>{fmtBRL(totalPrice)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#948F84' }}>Condição</div>
              {PAYMENT_CONDITIONS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setPayIdx(i)}
                  className="w-full flex justify-between px-3 py-2 rounded-lg text-xs transition-all"
                  style={i === payIdx
                    ? { background: '#F0FDF4', border: '1.5px solid #86EFAC', color: '#15803D' }
                    : { background: '#F8F6F2', border: '1px solid rgba(184,179,168,0.25)', color: '#948F84' }
                  }
                >
                  <span className="font-semibold">{c.label}</span>
                  <span className="font-bold">{fmtBRL(c.calc(totalPrice))}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 pt-0">
            <button
              onClick={sendWhatsApp}
              className="w-full active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
              style={{ background: '#25D366', boxShadow: '0 4px 14px rgba(37,211,102,0.25)' }}
            >
              <MessageCircle size={15} />
              Enviar Proposta via WhatsApp
            </button>
          </div>
        </>
      )}
    </div>
  )
})

// ─── LotInfoPanel — light theme matching Alto Bellevue bottom sheet ───────────

interface LotInfoProps {
  lot: Lot
  inCart: boolean
  onAddToCart: () => void
  onRemoveFromCart: () => void
  onClose: () => void
  portalTarget?: HTMLElement | null
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
          border: '1px solid rgba(184,179,168,0.3)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#E5E0D8' }} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(184,179,168,0.15)' }}>
          <div>
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-2"
              style={{ background: st.badgeBg, color: st.badgeText }}
            >
              {st.label}
              {lot.isLakefront && <span className="ml-1.5" style={{ color: '#2563EB' }}>· Beira-lago</span>}
            </span>
            <div className="font-bold text-lg leading-tight" style={{ color: NAVY }}>
              Quadra {lot.quadra} · Lote {lot.lote}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center flex-shrink-0 mt-0.5 transition-all hover:opacity-70 active:scale-95"
            style={{ width: 32, height: 32, borderRadius: '50%', background: '#F8F6F2', color: '#948F84' }}
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
              <div style={{ background: '#F8F6F2', border: '1.5px solid rgba(184,179,168,0.35)', borderRadius: 14, padding: '14px 16px' }}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#948F84' }}>TABELA</div>
                <div className="font-bold text-lg leading-tight" style={{ color: NAVY }}>{fmtBRL(lot.valor)}</div>
                <div className="text-[11px] mt-1" style={{ color: '#948F84' }}>
                  {fmtBRL(lot.valor / lot.metragem)}/m²
                </div>
              </div>
            </div>

            {/* Área */}
            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(184,179,168,0.15)' }}>
              <span style={{ color: '#948F84', fontSize: 14 }}>Área do lote</span>
              <span style={{ color: NAVY, fontWeight: 700, fontSize: 14 }}>{fmtM2(lot.metragem)}</span>
            </div>

            {/* Payment conditions */}
            <div className="space-y-1.5">
              <div style={{ fontSize: 10, color: '#948F84', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: "'Outfit', sans-serif" }}>
                Condições de Pagamento
              </div>
              {PAYMENT_CONDITIONS.map((c, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center px-3 py-2.5 rounded-xl"
                  style={i === 0
                    ? { background: '#F0FDF4', border: '1.5px solid #86EFAC' }
                    : { background: '#F8F6F2', border: '1px solid rgba(184,179,168,0.25)' }
                  }
                >
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? '#15803D' : NAVY }}>{c.label}</span>
                    <span style={{ fontSize: 11, color: '#948F84', marginLeft: 6 }}>{c.desc}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? '#15803D' : NAVY }}>
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
            className="px-5 py-4 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(184,179,168,0.15)', paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}
          >
            {inCart ? (
              <button
                onClick={onRemoveFromCart}
                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{ border: '1.5px solid #FCA5A5', color: '#DC2626', background: '#FFF1F1' }}
              >
                <X size={14} /> Remover da proposta
              </button>
            ) : (
              <button
                onClick={onAddToCart}
                className="w-full active:scale-[0.98] text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{ background: '#16A34A', boxShadow: '0 4px 14px rgba(22,163,74,0.28)' }}
              >
                <ShoppingCart size={15} /> Adicionar à proposta
              </button>
            )}
          </div>
        )}

        {lot.status === 'negociacao' && (
          <div
            className="px-5 py-4 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(184,179,168,0.15)', paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}
          >
            <button
              onClick={() => {
                const msg = `Olá! Tenho interesse no Lote ${lot.lote} da Quadra ${lot.quadra} do *Miguel Marques* (${fmtM2(lot.metragem)}). Pode me informar sobre a disponibilidade?`
                window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
              }}
              className="w-full active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
              style={{ background: '#25D366', boxShadow: '0 4px 14px rgba(37,211,102,0.25)' }}
            >
              <MessageCircle size={16} /> Consultar via WhatsApp
            </button>
          </div>
        )}
      </motion.div>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface MiguelMarquesPlanViewProps {
  lots?: Lot[]
}

export default function MiguelMarquesPlanView({ lots: lotsProp }: MiguelMarquesPlanViewProps) {
  const lots = lotsProp ?? ALL_LOTS
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Pointer-based pan/zoom — uses Pointer Events only (matches Alto Bellevue)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const pointerCache = useRef<Map<number, { x: number; y: number }>>(new Map())
  const didDrag = useRef(false)
  const downPos = useRef({ x: 0, y: 0 })
  const lastPos = useRef({ x: 0, y: 0 })
  const clickTargetRef = useRef<Element | null>(null)

  // UI state
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [cart, setCart] = useState<Lot[]>([])
  const [showCart, setShowCart] = useState(false)
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [activeQuadra, setActiveQuadra] = useState('ALL')

  // Fit canvas on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const el = containerRef.current
        const scaleX = el.clientWidth / CANVAS_W
        const scaleY = el.clientHeight / CANVAS_H
        const fit = Math.min(scaleX, scaleY, 1) * 0.90
        setTransform({ x: 0, y: 0, scale: Math.max(fit, MIN_SCALE) })
      }
      setLoading(false)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  // Fullscreen API
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await wrapperRef.current?.requestFullscreen().catch(() => null)
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen().catch(() => null)
      setIsFullscreen(false)
    }
  }, [])
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Filtered lots
  const filteredIds = useMemo(() => {
    const result = lots.filter(l => {
      if (activeStatus !== 'ALL' && l.status !== activeStatus) return false
      if (activeQuadra !== 'ALL' && l.quadra !== activeQuadra) return false
      return true
    })
    return new Set(result.map(l => l.id))
  }, [lots, activeStatus, activeQuadra])

  const lotsById = useMemo(() => new Map(lots.map(l => [l.id, l])), [lots])

  // Quadras derived from data
  const quadras = useMemo(() => [...new Set(lots.map(l => l.quadra))].sort(), [lots])

  // Stats
  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {}
    for (const l of lots) byStatus[l.status] = (byStatus[l.status] ?? 0) + 1
    return { total: lots.length, byStatus }
  }, [lots])

  // Zoom
  const doZoom = useCallback((factor: number) => {
    setTransform(t => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale * factor))
      return { ...t, scale: newScale }
    })
  }, [])

  const resetView = useCallback(() => {
    if (containerRef.current) {
      const el = containerRef.current
      const scaleX = el.clientWidth / CANVAS_W
      const scaleY = el.clientHeight / CANVAS_H
      const fit = Math.min(scaleX, scaleY, 1) * 0.90
      setTransform({ x: 0, y: 0, scale: Math.max(fit, MIN_SCALE) })
    }
  }, [])

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const delta = e.deltaMode === 1 ? e.deltaY * 28 : e.deltaMode === 2 ? e.deltaY * 500 : e.deltaY
      doZoom(delta > 0 ? 0.88 : 1.14)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [doZoom])

  // Pointer events — handles both mouse and touch (matches Alto Bellevue pattern)
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    pointerCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointerCache.current.size === 1) {
      clickTargetRef.current = e.target as Element
      didDrag.current = false
      downPos.current = { x: e.clientX, y: e.clientY }
      lastPos.current = { x: e.clientX, y: e.clientY }
    }
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerCache.current.has(e.pointerId)) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    if (pointerCache.current.size === 2) {
      // Pinch-to-zoom
      const ids = [...pointerCache.current.keys()]
      const otherId = ids.find(id => id !== e.pointerId)!
      const other = pointerCache.current.get(otherId)!
      const prev = pointerCache.current.get(e.pointerId)!
      const prevDist = Math.hypot(prev.x - other.x, prev.y - other.y)
      const currDist = Math.hypot(e.clientX - other.x, e.clientY - other.y)
      pointerCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (prevDist > 1) doZoom(prevDist / currDist)
      didDrag.current = true
      return
    }

    // Single pointer drag — pan with cumulative slop
    const slop = e.pointerType === 'touch' ? 12 : 4
    const movedFromDown = Math.hypot(e.clientX - downPos.current.x, e.clientY - downPos.current.y)
    if (movedFromDown >= slop) didDrag.current = true
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    pointerCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (!didDrag.current) return
    setTransform(t => ({
      ...t,
      x: t.x + (dx / rect.width) * CANVAS_W / t.scale,
      y: t.y + (dy / rect.height) * CANVAS_H / t.scale,
    }))
  }, [doZoom])

  const handlePointerUp = useCallback((_e: React.PointerEvent<HTMLDivElement>) => {
    pointerCache.current.delete(_e.pointerId)
    if (pointerCache.current.size > 0) return
    const target = clickTargetRef.current
    clickTargetRef.current = null
    if (!didDrag.current && target) {
      let el: Element | null = target
      while (el) {
        const lotId = el.getAttribute?.('data-lot-id')
        if (lotId) {
          const lot = lotsById.get(lotId)
          if (lot && lot.status !== 'vendido') {
            setSelectedLot(prev => prev?.id === lotId ? null : lot)
          }
          break
        }
        el = el.parentElement
      }
    }
  }, [lotsById])

  // Cart helpers
  const cartIds = useMemo(() => new Set(cart.map(l => l.id)), [cart])
  const addToCart = useCallback((lot: Lot) => {
    setCart(c => cartIds.has(lot.id) ? c : [...c, lot])
    setShowCart(true)
  }, [cartIds])
  const removeFromCart = useCallback((id: string) => setCart(c => c.filter(l => l.id !== id)), [])

  const showLotNumbers = transform.scale >= 2.5

  // Quadra centroids for labels
  const quadraCentroids = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {}
    for (const layout of QUADRA_LAYOUTS) {
      map[layout.id] = {
        x: layout.x + (layout.cols * layout.lotW) / 2,
        y: layout.y + (layout.rows * layout.lotH) / 2,
      }
    }
    return map
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full flex flex-col select-none overflow-hidden"
      style={{ background: '#F7F5F2', minHeight: '100%' }}
    >
      {/* ── Filter bar — matches Alto Bellevue pill style ── */}
      <div
        className="flex-shrink-0 px-3 pt-3 pb-2 space-y-2"
        style={{ background: '#fff', borderBottom: '1px solid rgba(184,179,168,0.2)' }}
      >
        {/* Status pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {STATUS_FILTER_KEYS.map(key => {
            const isActive = activeStatus === key
            const count = key === 'ALL' ? lots.length : (stats.byStatus[key] ?? 0)
            const dot = key === 'ALL' ? GOLD : getStyle(key).dot
            const label = key === 'ALL' ? 'Todos' : getStyle(key).label
            return (
              <button
                key={key}
                onClick={() => { setActiveStatus(key); setSelectedLot(null) }}
                className="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 transition-all active:scale-95"
                style={{
                  height: 32, paddingLeft: 10, paddingRight: 10, borderRadius: 20,
                  fontSize: 11, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                  border: isActive ? `1.5px solid ${GOLD}` : '1.5px solid rgba(184,179,168,0.35)',
                  background: isActive ? NAVY : '#fff',
                  color: isActive ? '#fff' : '#636363',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? 'rgba(255,255,255,0.5)' : dot, display: 'inline-block', flexShrink: 0 }} />
                {label}
                <span style={{ fontSize: 9, fontWeight: 800, opacity: 0.65, fontFamily: "'JetBrains Mono', monospace" }}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Quadra row */}
        <div className="flex gap-1.5 overflow-x-auto items-center" style={{ scrollbarWidth: 'none' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#C8C3BB', textTransform: 'uppercase', letterSpacing: '0.15em', flexShrink: 0, marginRight: 2 }}>
            Quadra
          </span>
          {(['ALL', ...quadras] as string[]).map(q => {
            const isActive = activeQuadra === q
            const avail = q === 'ALL' ? 0 : lots.filter(l => l.quadra === q && l.status === 'disponivel').length
            return (
              <button
                key={q}
                onClick={() => { setActiveQuadra(q); setSelectedLot(null) }}
                className="transition-all active:scale-95 flex-shrink-0 relative"
                style={{
                  height: 28, paddingLeft: 10, paddingRight: 10, borderRadius: 14,
                  fontSize: 10, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                  border: isActive ? 'none' : '1.5px solid rgba(0,0,0,0.09)',
                  background: isActive ? NAVY : '#F7F8FA',
                  color: isActive ? '#fff' : '#636363',
                }}
              >
                {q === 'ALL' ? 'Todas' : q}
                {avail > 0 && !isActive && (
                  <span style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: '#32D17C', border: '1.5px solid #fff' }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Map canvas ─────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ cursor: pointerCache.current.size > 0 && didDrag.current ? 'grabbing' : 'grab', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <svg
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="w-full h-full"
            style={{ overflow: 'visible', touchAction: 'none' }}
          >
            <defs>
              {/* Warm parchment base — Google Maps inspired, matches Alto Bellevue */}
              <linearGradient id="mm-base" x1="0" y1="0" x2="0.1" y2="1">
                <stop offset="0%" stopColor="#EBE5D5" />
                <stop offset="100%" stopColor="#DDD7C6" />
              </linearGradient>
              {/* Topographic terrain */}
              <radialGradient id="mm-terrain" cx="42%" cy="52%" r="60%" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="#F2EDD8" stopOpacity="0.7" />
                <stop offset="60%" stopColor="#D5C9A8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#B8AC8C" stopOpacity="0.55" />
              </radialGradient>
              {/* Lake gradient */}
              <radialGradient id="mm-lake" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#7DD3FC" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.60" />
              </radialGradient>
              {/* Lake glow */}
              <filter id="mm-lake-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {/* Green area gradient */}
              <linearGradient id="mm-green" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4E8CC" />
                <stop offset="100%" stopColor="#C8DFC0" />
              </linearGradient>
            </defs>

            <g transform={`scale(${transform.scale}) translate(${transform.x},${transform.y})`}>
              {/* Base terrain */}
              <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="url(#mm-base)" />
              <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="url(#mm-terrain)" />

              {/* Green vegetation areas (north/south boundaries) */}
              <rect x={0} y={0} width={CANVAS_W} height={60} fill="url(#mm-green)" opacity={0.6} />
              <rect x={0} y={2040} width={CANVAS_W} height={60} fill="url(#mm-green)" opacity={0.6} />

              {/* Roads — warm light roads like Alto Bellevue */}
              {/* Horizontal streets */}
              <rect x={0}    y={0}    width={CANVAS_W} height={60}  fill="#C8C2AD" />
              <rect x={0}    y={230}  width={CANVAS_W} height={32}  fill="#D5D0C0" />
              <rect x={0}    y={510}  width={CANVAS_W} height={32}  fill="#D5D0C0" />
              <rect x={0}    y={790}  width={CANVAS_W} height={32}  fill="#D5D0C0" />
              <rect x={0}    y={1060} width={CANVAS_W} height={32}  fill="#D5D0C0" />
              <rect x={0}    y={1330} width={CANVAS_W} height={32}  fill="#D5D0C0" />
              <rect x={0}    y={1610} width={CANVAS_W} height={32}  fill="#D5D0C0" />
              <rect x={0}    y={1880} width={CANVAS_W} height={32}  fill="#D5D0C0" />
              <rect x={0}    y={2060} width={CANVAS_W} height={60}  fill="#C8C2AD" />
              {/* Vertical streets */}
              <rect x={0}    y={0} width={60}  height={CANVAS_H} fill="#C8C2AD" />
              <rect x={580}  y={0} width={32}  height={CANVAS_H} fill="#D5D0C0" />
              <rect x={1140} y={0} width={50}  height={CANVAS_H} fill="#C8C2AD" />
              <rect x={1720} y={0} width={32}  height={CANVAS_H} fill="#D5D0C0" />
              <rect x={2100} y={0} width={32}  height={CANVAS_H} fill="#D5D0C0" />
              <rect x={2360} y={0} width={40}  height={CANVAS_H} fill="#C8C2AD" />

              {/* Road center lines (subtle dashes for main roads) */}
              <line x1={0} y1={30} x2={CANVAS_W} y2={30} stroke="#B8B3A0" strokeWidth={0.5} strokeDasharray="20,12" opacity={0.5} />
              <line x1={0} y1={2080} x2={CANVAS_W} y2={2080} stroke="#B8B3A0" strokeWidth={0.5} strokeDasharray="20,12" opacity={0.5} />
              <line x1={30} y1={0} x2={30} y2={CANVAS_H} stroke="#B8B3A0" strokeWidth={0.5} strokeDasharray="20,12" opacity={0.5} />

              {/* Lake area (green buffer around lake) */}
              <ellipse
                cx={LAKE.cx} cy={LAKE.cy}
                rx={LAKE.rx + 40} ry={LAKE.ry + 40}
                fill="url(#mm-green)"
                opacity={0.5}
              />

              {/* Lake */}
              <ellipse
                cx={LAKE.cx} cy={LAKE.cy}
                rx={LAKE.rx} ry={LAKE.ry}
                fill="url(#mm-lake)"
                stroke="#38BDF8"
                strokeWidth={2}
                filter="url(#mm-lake-glow)"
              />
              <text
                x={LAKE.cx} y={LAKE.cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#0369A1"
                fontSize={24}
                fontWeight="bold"
                fontFamily="system-ui"
                style={{ pointerEvents: 'none', opacity: 0.8 }}
              >
                Lago
              </text>

              {/* Lot grid rendering */}
              {QUADRA_LAYOUTS.map(layout => {
                const positions = generateLotPositions(layout)
                return positions.map(pos => {
                  const lotId = `${layout.id}-${pos.lotIndex + 1}`
                  const lot = lotsById.get(lotId)
                  if (!lot) return null

                  const isFiltered = !filteredIds.has(lotId)
                  const isHovered = hoveredId === lotId
                  const isSelected = selectedLot?.id === lotId
                  const inCart = cartIds.has(lotId)
                  const st = getStyle(lot.status)

                  const fillColor = isFiltered
                    ? 'rgba(220,214,200,0.4)'
                    : isSelected
                      ? 'rgba(200,164,74,0.45)'
                      : inCart
                        ? 'rgba(34,197,94,0.40)'
                        : st.fill

                  const strokeColor = isFiltered
                    ? 'rgba(184,179,168,0.4)'
                    : isSelected
                      ? GOLD
                      : inCart
                        ? '#16A34A'
                        : isHovered
                          ? NAVY
                          : st.stroke

                  const strokeWidth = (isSelected || isHovered ? 1.5 : 0.7) / transform.scale

                  return (
                    <rect
                      key={lotId}
                      data-lot-id={lotId}
                      x={pos.x}
                      y={pos.y}
                      width={pos.w}
                      height={pos.h}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      rx={1}
                      style={{
                        cursor: lot.status === 'vendido' ? 'default' : 'pointer',
                        transition: 'fill 0.1s, stroke 0.1s',
                      }}
                      onMouseEnter={() => setHoveredId(lotId)}
                      onMouseLeave={() => setHoveredId(null)}
                    />
                  )
                })
              })}

              {/* Lot number labels when zoomed in */}
              {showLotNumbers && QUADRA_LAYOUTS.map(layout => {
                const positions = generateLotPositions(layout)
                return positions.map(pos => {
                  const lotId = `${layout.id}-${pos.lotIndex + 1}`
                  if (!filteredIds.has(lotId)) return null
                  const cx = pos.x + pos.w / 2
                  const cy = pos.y + pos.h / 2
                  const fontSize = Math.max(2.5, Math.min(5, 8 / transform.scale))
                  return (
                    <text
                      key={`lbl-${lotId}`}
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={fontSize}
                      fill={selectedLot?.id === lotId ? NAVY : 'rgba(11,25,40,0.75)'}
                      style={{ pointerEvents: 'none', fontFamily: 'monospace', fontWeight: 600 }}
                    >
                      {pos.lotIndex + 1}
                    </text>
                  )
                })
              })}

              {/* Quadra label badges when zoomed out */}
              {!showLotNumbers && (
                <g style={{ pointerEvents: 'none' }}>
                  {Object.entries(quadraCentroids).map(([q, { x, y }]) => {
                    const r = Math.max(8, 36 / transform.scale)
                    const fontSize = Math.max(5, 22 / transform.scale)
                    return (
                      <g key={q} transform={`translate(${x},${y})`}>
                        <circle
                          r={r}
                          fill="rgba(255,255,255,0.88)"
                          stroke="rgba(184,179,168,0.4)"
                          strokeWidth={0.5 / transform.scale}
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={fontSize}
                          fill={NAVY}
                          fontWeight="bold"
                          fontFamily="system-ui"
                        >
                          {q}
                        </text>
                      </g>
                    )
                  })}
                </g>
              )}
            </g>
          </svg>

          {/* ── Map controls — top-right (matches Alto Bellevue) ── */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            <MapBtn onClick={() => setShowCart(s => !s)} label={showCart ? 'Fechar proposta' : 'Abrir proposta'} active={showCart}>
              <div className="relative">
                <ShoppingCart size={16} />
                {cart.length > 0 && (
                  <span
                    className="absolute -top-2 -right-2 flex items-center justify-center font-bold"
                    style={{ width: 14, height: 14, borderRadius: '50%', background: GOLD, color: NAVY, fontSize: 8 }}
                  >
                    {cart.length}
                  </span>
                )}
              </div>
            </MapBtn>
            <MapBtn onClick={toggleFullscreen} label={isFullscreen ? 'Sair da tela cheia' : 'Expandir mapa'}>
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </MapBtn>
          </div>

          {/* ── Zoom controls — bottom-right ── */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-2 z-10">
            <MapBtn onClick={() => doZoom(1.3)} label="Aproximar"><ZoomIn size={16} /></MapBtn>
            <MapBtn onClick={() => doZoom(0.77)} label="Afastar"><ZoomOut size={16} /></MapBtn>
            <MapBtn onClick={resetView} label="Ver tudo"><RotateCcw size={14} /></MapBtn>
          </div>

          {/* ── Tap hint ── */}
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <span
              className="px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
              style={{
                background: 'rgba(255,255,255,0.90)',
                color: 'rgba(60,40,10,0.80)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(184,179,168,0.40)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              }}
            >
              Toque em um lote para ver detalhes
            </span>
          </div>

          {/* Loading spinner */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(247,245,242,0.85)' }}>
              <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(200,164,74,0.3)', borderTopColor: GOLD }} />
            </div>
          )}
        </div>

        {/* ── Lot info panel (bottom sheet mobile / floating desktop) ── */}
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

        {/* ── Cart desktop sidebar (md+) ── */}
        <AnimatePresence>
          {showCart && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="absolute right-0 top-0 bottom-0 overflow-hidden flex-shrink-0 z-30 hidden md:block"
              style={{ background: '#fff', borderLeft: '1px solid rgba(184,179,168,0.25)', boxShadow: '-4px 0 24px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(184,179,168,0.2)' }}>
                <span className="text-sm font-bold" style={{ color: NAVY }}>Proposta de Compra</span>
                <button onClick={() => setShowCart(false)} className="hover:opacity-70" style={{ color: '#948F84' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ height: 'calc(100% - 49px)', overflow: 'hidden' }}>
                <CartPanel cart={cart} onRemove={removeFromCart} onClear={() => setCart([])} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Stats bar — matches Alto Bellevue gamified bar ── */}
      <div
        className="flex-shrink-0"
        style={{ background: '#fff', borderTop: '1px solid rgba(184,179,168,0.2)', padding: '10px 16px 12px' }}
      >
        {(() => {
          const total = lots.length
          const avail = stats.byStatus['disponivel'] ?? 0
          const sold = stats.byStatus['vendido'] ?? 0
          const neg = stats.byStatus['negociacao'] ?? 0
          const pctAvail = total > 0 ? Math.round((avail / total) * 100) : 0
          const pctSold = total > 0 ? Math.round((sold / total) * 100) : 0
          return (
            <>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', fontFamily: "'Outfit', sans-serif" }}>
                    🟢 {avail} disponíveis
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#948F84' }}>
                    {pctAvail}% disponível · {total} lotes
                  </span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: '#F0EDE5', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${pctAvail}%`, background: 'linear-gradient(90deg, #22C55E, #16A34A)', transition: 'width 0.6s' }} />
                  <div style={{ width: `${pctSold}%`, background: '#EF4444', transition: 'width 0.6s' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[
                  { dot: '#16A34A', label: 'Disponível', count: avail },
                  { dot: '#D97706', label: 'Negociação', count: neg },
                  { dot: '#EF4444', label: 'Vendido', count: sold },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.dot, display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: '#636363', fontWeight: 600 }}>{item.count}</span>
                    <span style={{ fontSize: 10, color: '#948F84' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </>
          )
        })()}
      </div>

      {/* ── Mobile cart bottom sheet ── */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[155]"
              style={{ background: 'rgba(0,0,0,0.3)' }}
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 right-0 rounded-t-[20px] z-[160] flex flex-col md:hidden"
              style={{ bottom: 0, maxHeight: '75vh', background: '#fff', paddingBottom: 'env(safe-area-inset-bottom, 16px)', boxShadow: '0 -4px 32px rgba(0,0,0,0.12)' }}
            >
              <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
                <div className="w-8 h-1 rounded-full" style={{ background: '#E5E0D8' }} />
              </div>
              <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(184,179,168,0.2)' }}>
                <div className="flex items-center gap-2">
                  <ShoppingCart size={15} style={{ color: GOLD }} />
                  <span className="text-sm font-bold" style={{ color: NAVY }}>Proposta de Compra</span>
                  {cart.length > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: GOLD, background: 'rgba(200,164,74,0.12)' }}>
                      {cart.length} lote{cart.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <button onClick={() => setShowCart(false)} className="hover:opacity-70" style={{ color: '#948F84' }}>
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <CartPanel cart={cart} onRemove={removeFromCart} onClear={() => setCart([])} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
