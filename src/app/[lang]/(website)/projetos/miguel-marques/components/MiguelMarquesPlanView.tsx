'use client'

import React, {
  useRef, useState, useCallback, useMemo, useEffect, memo,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, ZoomIn, ZoomOut, RotateCcw, MessageCircle,
  ShoppingCart, Trash2, Maximize2, Minimize2,
} from 'lucide-react'
import { type Lot } from '../data/lotsData'

// ─── Constants ────────────────────────────────────────────────────────────────

// Geometria REAL extraída do CAD oficial (R07 PLANTA LOTEADA.dxf) + quadra/status
// do quadro de disponibilidade. Ver scripts/cad/build_miguel_marques.py.
const GEO_URL = '/maps/miguel-marques-cad-lots.json'
const DEFAULT_VB = { w: 1200, h: 1386 }
const MIN_SCALE = 0.6
const MAX_SCALE = 16
const WHATSAPP_NUMBER = '5581986141487'
const GOLD = '#C8A44A'
const NAVY = '#0B1928'

// Lote com geometria real (polígono) + dados comerciais.
type GeoLot = Lot & { points: string; labelX: number; labelY: number }

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

// ─── Geometria real (CAD) ─────────────────────────────────────────────────────

interface GeoData { w: number; h: number; lots: GeoLot[] }

/** Carrega os polígonos reais dos lotes (CAD oficial) do JSON estático. */
function useGeometry(): { geo: GeoData | null; error: boolean } {
  const [geo, setGeo] = useState<GeoData | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let alive = true
    fetch(GEO_URL)
      .then(r => r.json())
      .then((d: { viewBox?: string; lots?: Record<string, unknown>[] }) => {
        if (!alive) return
        const vb = String(d.viewBox ?? `0 0 ${DEFAULT_VB.w} ${DEFAULT_VB.h}`).split(/\s+/).map(Number)
        const w = vb[2] || DEFAULT_VB.w
        const h = vb[3] || DEFAULT_VB.h
        const lots: GeoLot[] = (d.lots ?? []).map((l) => ({
          id: String(l.id),
          quadra: String(l.quadra),
          lote: Number(l.lote),
          metragem: Number(l.area) || 0,
          valor: Number(l.price) || 0,
          status: String(l.status ?? 'disponivel') as Lot['status'],
          isLakefront: String(l.quadra) === 'Z',
          points: String(l.points ?? ''),
          labelX: Number(l.labelX) || 0,
          labelY: Number(l.labelY) || 0,
        })).filter(l => l.points)
        setGeo({ w, h, lots })
      })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [])
  return { geo, error }
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
  const { geo, error: geoError } = useGeometry()
  const CW = geo?.w ?? DEFAULT_VB.w
  const CH = geo?.h ?? DEFAULT_VB.h

  // Status ao vivo (Supabase, via prop) sobrepõe o status do quadro por id de lote.
  const propStatusById = useMemo(
    () => new Map((lotsProp ?? []).map(l => [l.id, l.status])),
    [lotsProp],
  )
  const lots = useMemo<GeoLot[]>(() => {
    if (!geo) return []
    return geo.lots.map(g => {
      const ov = propStatusById.get(g.id)
      return ov && ov !== g.status ? { ...g, status: ov } : g
    })
  }, [geo, propStatusById])

  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  useEffect(() => { if (geo || geoError) setLoading(false) }, [geo, geoError])

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
  const [showTapHint, setShowTapHint] = useState(true)

  // Tap hint dismisses itself so it never permanently covers the map.
  useEffect(() => {
    const t = setTimeout(() => setShowTapHint(false), 6000)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => { if (selectedLot) setShowTapHint(false) }, [selectedLot])

  // viewBox já normaliza o conteúdo para a viewport (scale=1 mostra a planta toda),
  // então o "fit" é apenas scale=1 — sem recalcular por clientWidth.

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

  // Keep the content centre inside the viewport so the map can never fully drift
  // off-screen ("saindo do ar"). Bounds depend on scale, so re-clamp after every
  // pan and zoom. Viewport in viewBox units is the full canvas (preserveAspectRatio).
  const clampTransform = useCallback((t: { x: number; y: number; scale: number }) => {
    // Conteúdo transformado em coords do viewBox: x ∈ [s·tx, s·(CW+tx)]. A viewport
    // visível é [0, CW]. Mantemos o conteúdo cobrindo (zoom in) ou contido (zoom out),
    // o que impede o mapa de "sair do ar" em qualquer nível de zoom.
    const bx = CW * (1 / t.scale - 1)
    const by = CH * (1 / t.scale - 1)
    const clamp = (v: number, a: number, b: number) => Math.min(Math.max(a, b), Math.max(Math.min(a, b), v))
    return {
      scale: t.scale,
      x: clamp(t.x, Math.min(0, bx), Math.max(0, bx)),
      y: clamp(t.y, Math.min(0, by), Math.max(0, by)),
    }
  }, [CW, CH])

  // Zoom
  const doZoom = useCallback((factor: number) => {
    setTransform(t => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale * factor))
      return clampTransform({ ...t, scale: newScale })
    })
  }, [clampTransform])

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 })
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
      // Capture mouse/pen only — they lack implicit capture, so a drag that leaves the
      // div would stop panning. Touch already has implicit capture; forcing it breaks
      // taps on iOS Safari (pointercancel instead of pointerup).
      if (e.pointerType !== 'touch') {
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* no-op */ }
      }
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
    setTransform(t => clampTransform({
      ...t,
      x: t.x + (dx / rect.width) * CW / t.scale,
      y: t.y + (dy / rect.height) * CH / t.scale,
    }))
  }, [doZoom, clampTransform, CW, CH])

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

  const showLotNumbers = transform.scale >= 3

  // Quadra centroids (median of real lot label positions — robust to outliers).
  const quadraCentroids = useMemo(() => {
    const acc = new Map<string, { xs: number[]; ys: number[] }>()
    for (const l of lots) {
      const d = acc.get(l.quadra) ?? { xs: [], ys: [] }
      d.xs.push(l.labelX); d.ys.push(l.labelY); acc.set(l.quadra, d)
    }
    const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0 }
    const map: Record<string, { x: number; y: number }> = {}
    for (const [q, d] of acc) map[q] = { x: median(d.xs), y: median(d.ys) }
    return map
  }, [lots])

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
            viewBox={`0 0 ${CW} ${CH}`}
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
            </defs>

            <g transform={`scale(${transform.scale}) translate(${transform.x},${transform.y})`}>
              {/* Terreno (base) — sem ruas/lago sintéticos: a geometria é a planta real */}
              <rect x={0} y={0} width={CW} height={CH} fill="url(#mm-base)" />
              <rect x={0} y={0} width={CW} height={CH} fill="url(#mm-terrain)" style={{ pointerEvents: 'none' }} />

              {/* Lotes — polígonos REAIS extraídos do CAD oficial */}
              {lots.map(lot => {
                const isFiltered = !filteredIds.has(lot.id)
                const isHovered = hoveredId === lot.id
                const isSelected = selectedLot?.id === lot.id
                const inCart = cartIds.has(lot.id)
                const st = getStyle(lot.status)
                const fillColor = isFiltered
                  ? 'rgba(220,214,200,0.45)'
                  : isSelected
                    ? 'rgba(200,164,74,0.5)'
                    : inCart
                      ? 'rgba(34,197,94,0.42)'
                      : st.fill
                const strokeColor = isFiltered
                  ? 'rgba(184,179,168,0.45)'
                  : isSelected
                    ? GOLD
                    : inCart
                      ? '#16A34A'
                      : isHovered
                        ? NAVY
                        : st.stroke
                const strokeWidth = (isSelected || isHovered ? 1.6 : 0.5) / transform.scale
                return (
                  <polygon
                    key={lot.id}
                    data-lot-id={lot.id}
                    points={lot.points}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                    style={{
                      cursor: lot.status === 'vendido' ? 'default' : 'pointer',
                      transition: 'fill 0.1s, stroke 0.1s',
                    }}
                    onMouseEnter={() => setHoveredId(lot.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                )
              })}

              {/* Números dos lotes ao aproximar */}
              {showLotNumbers && lots.map(lot => {
                if (!filteredIds.has(lot.id)) return null
                const fontSize = Math.max(2, Math.min(6, 9 / transform.scale))
                return (
                  <text
                    key={`lbl-${lot.id}`}
                    x={lot.labelX}
                    y={lot.labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fontSize}
                    fill={selectedLot?.id === lot.id ? NAVY : 'rgba(11,25,40,0.8)'}
                    style={{ pointerEvents: 'none', fontFamily: 'monospace', fontWeight: 600 }}
                  >
                    {lot.lote}
                  </text>
                )
              })}

              {/* Selos de quadra ao afastar */}
              {!showLotNumbers && (
                <g style={{ pointerEvents: 'none' }}>
                  {Object.entries(quadraCentroids).map(([q, { x, y }]) => {
                    const r = Math.max(6, 26 / transform.scale)
                    const fontSize = Math.max(5, 18 / transform.scale)
                    return (
                      <g key={q} transform={`translate(${x},${y})`}>
                        <circle
                          r={r}
                          fill="rgba(255,255,255,0.9)"
                          stroke="rgba(184,179,168,0.5)"
                          strokeWidth={0.6 / transform.scale}
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

          {/* ── Tap hint — auto-dismisses (6s) and on first selection ── */}
          <AnimatePresence>
            {showTapHint && !selectedLot && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
              >
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
              </motion.div>
            )}
          </AnimatePresence>

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
