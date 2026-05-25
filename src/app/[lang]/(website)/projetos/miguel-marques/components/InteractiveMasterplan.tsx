'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Minus, RotateCcw } from 'lucide-react'
import { type Lot } from '../data/lotsData'
import { QUADRA_LAYOUTS, CANVAS_W, CANVAS_H, LAKE, type QuadraLayout } from '../data/masterplanLayout'

// ── Colors ────────────────────────────────────────────────────
const LOT_FILL: Record<string, string> = {
  disponivel:   '#7EA87A',
  negociacao:   '#C8A878',
  vendido:      '#B8B4AE',
  proprietario: '#6B7C56',
  igreja:       '#8090A0',
}
const LOT_STROKE: Record<string, string> = {
  disponivel:   '#5A8056',
  negociacao:   '#A88848',
  vendido:      '#968E88',
  proprietario: '#4A5A38',
  igreja:       '#607080',
}
const LOT_FILL_DIM = '#D8D4CE'
const LOT_STROKE_DIM = '#C0BDB9'

// ── Types ─────────────────────────────────────────────────────
interface LotPos { x: number; y: number; w: number; h: number; lotIndex: number }
interface Tooltip { lot: Lot; screenX: number; screenY: number }
interface ViewBox { x: number; y: number; w: number; h: number }

// ── Helpers ───────────────────────────────────────────────────
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

// ── Props ─────────────────────────────────────────────────────
interface Props {
  lots: Lot[]
  selectedLotId: string | null
  filteredLotIds: Set<string> | null
  onLotSelect: (lot: Lot | null) => void
}

export default function InteractiveMasterplan({ lots, selectedLotId, filteredLotIds, onLotSelect }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ViewBox state for zoom/pan
  const defaultVB = useMemo<ViewBox>(() => ({ x: 0, y: 0, w: CANVAS_W, h: CANVAS_H }), [])
  const [vb, setVb] = useState<ViewBox>(defaultVB)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, vbx: 0, vby: 0 })

  // Tooltip
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  // Lot lookup map
  const lotMap = useMemo(() => {
    const m = new Map<string, Lot>()
    lots.forEach(l => m.set(l.id, l))
    return m
  }, [lots])

  // Pre-generate all quadra positions
  const quadraPositions = useMemo(
    () => QUADRA_LAYOUTS.map(layout => ({ layout, positions: generateLotPositions(layout) })),
    []
  )

  // Zoom helpers
  const zoom = useCallback((factor: number, centerX = CANVAS_W / 2, centerY = CANVAS_H / 2) => {
    setVb((prev: ViewBox) => {
      const newW = Math.min(CANVAS_W, Math.max(300, prev.w * factor))
      const newH = Math.min(CANVAS_H, Math.max(200, prev.h * factor))
      const scaleX = newW / prev.w
      const scaleY = newH / prev.h
      const newX = Math.max(0, Math.min(CANVAS_W - newW, centerX - (centerX - prev.x) * scaleX))
      const newY = Math.max(0, Math.min(CANVAS_H - newH, centerY - (centerY - prev.y) * scaleY))
      return { x: newX, y: newY, w: newW, h: newH }
    })
  }, [])

  // Mouse wheel zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      // Convert screen coords to SVG coords
      const svgX = vb.x + ((e.clientX - rect.left) / rect.width) * vb.w
      const svgY = vb.y + ((e.clientY - rect.top) / rect.height) * vb.h
      const factor = e.deltaY > 0 ? 1.12 : 0.89
      zoom(factor, svgX, svgY)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [vb, zoom])

  // Pan handlers
  function onMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    setIsDragging(true)
    setTooltip(null)
    dragStart.current = { x: e.clientX, y: e.clientY, vbx: vb.x, vby: vb.y }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging) return
    const el = containerRef.current!
    const rect = el.getBoundingClientRect()
    const dx = ((e.clientX - dragStart.current.x) / rect.width) * vb.w
    const dy = ((e.clientY - dragStart.current.y) / rect.height) * vb.h
    setVb((prev: ViewBox) => ({
      ...prev,
      x: Math.max(0, Math.min(CANVAS_W - prev.w, dragStart.current.vbx - dx)),
      y: Math.max(0, Math.min(CANVAS_H - prev.h, dragStart.current.vby - dy)),
    }))
  }

  function onMouseUp() { setIsDragging(false) }

  // Touch handlers
  const lastTouchDist = useRef<number | null>(null)
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy)
      lastTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      }
    } else if (e.touches.length === 1) {
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, vbx: vb.x, vby: vb.y }
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault()
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const factor = lastTouchDist.current / dist
      lastTouchDist.current = dist
      const el = containerRef.current!
      const rect = el.getBoundingClientRect()
      const cx = lastTouchCenter.current!
      const svgX = vb.x + ((cx.x - rect.left) / rect.width) * vb.w
      const svgY = vb.y + ((cx.y - rect.top) / rect.height) * vb.h
      zoom(factor, svgX, svgY)
    } else if (e.touches.length === 1) {
      const el = containerRef.current!
      const rect = el.getBoundingClientRect()
      const dx = ((e.touches[0].clientX - dragStart.current.x) / rect.width) * vb.w
      const dy = ((e.touches[0].clientY - dragStart.current.y) / rect.height) * vb.h
      setVb((prev: ViewBox) => ({
        ...prev,
        x: Math.max(0, Math.min(CANVAS_W - prev.w, dragStart.current.vbx - dx)),
        y: Math.max(0, Math.min(CANVAS_H - prev.h, dragStart.current.vby - dy)),
      }))
    }
  }

  function onTouchEnd() { lastTouchDist.current = null }

  function handleLotClick(e: React.MouseEvent, lot: Lot) {
    e.stopPropagation()
    if (lot.status === 'vendido') return
    onLotSelect(selectedLotId === lot.id ? null : lot)
  }

  function handleLotHover(e: React.MouseEvent, lot: Lot) {
    const el = containerRef.current!
    const rect = el.getBoundingClientRect()
    setTooltip({
      lot,
      screenX: e.clientX - rect.left,
      screenY: e.clientY - rect.top,
    })
  }

  const viewBoxStr = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`

  return (
    <div className="relative w-full h-full select-none bg-[#F5F0EA]" ref={containerRef}>
      {/* SVG Map */}
      <svg
        ref={svgRef}
        viewBox={viewBoxStr}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ display: 'block' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => { if (!isDragging) { setTooltip(null); onLotSelect(null) } }}
      >
        <defs>
          <radialGradient id="lakeGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#B8D8EE" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#7AAFC8" stopOpacity="1" />
          </radialGradient>
          <filter id="lakeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#4A8AAA" floodOpacity="0.2" />
          </filter>
          <filter id="lotGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="#F5F0EA" />

        {/* North green buffer */}
        <rect x="0" y="0" width={CANVAS_W} height="60" fill="#D4E8CC" />
        <rect x="0" y={CANVAS_H - 40} width={CANVAS_W} height="40" fill="#D4E8CC" />

        {/* West avenue */}
        <rect x="0" y="0" width="60" height={CANVAS_H} fill="#E8E2D8" />
        {/* Central avenue */}
        <rect x="1140" y="0" width="50" height={CANVAS_H} fill="#E8E2D8" />
        {/* East avenue */}
        <rect x="2360" y="0" width="40" height={CANVAS_H} fill="#E8E2D8" />

        {/* Horizontal streets */}
        {[230, 510, 790, 1060, 1330, 1610, 1880].map(y => (
          <rect key={y} x="0" y={y} width={CANVAS_W} height="32" fill="#E8E2D8" />
        ))}

        {/* Secondary vertical streets */}
        {[580, 1720, 2100].map(x => (
          <rect key={x} x={x} y="0" width="32" height={CANVAS_H} fill="#E8E2D8" />
        ))}

        {/* Lake park surroundings */}
        <rect x="1480" y="440" width="600" height="920" fill="#D4E8CC" opacity="0.7" rx="20" />

        {/* Lake */}
        <ellipse
          cx={LAKE.cx} cy={LAKE.cy}
          rx={LAKE.rx} ry={LAKE.ry}
          fill="url(#lakeGrad)"
          filter="url(#lakeShadow)"
          className="lake-shimmer"
        />
        {/* Lake shimmer lines */}
        <ellipse cx={LAKE.cx - 40} cy={LAKE.cy - 20} rx={LAKE.rx * 0.5} ry={LAKE.ry * 0.3} fill="none" stroke="#EAF4FA" strokeWidth="1.5" opacity="0.5" />
        <ellipse cx={LAKE.cx + 20} cy={LAKE.cy + 30} rx={LAKE.rx * 0.3} ry={LAKE.ry * 0.2} fill="none" stroke="#EAF4FA" strokeWidth="1" opacity="0.35" />

        {/* Lake label */}
        <text
          x={LAKE.cx} y={LAKE.cy + 6}
          textAnchor="middle"
          fontSize="18"
          fill="#4A7A98"
          fontFamily="'Playfair Display', Georgia, serif"
          fontStyle="italic"
          opacity="0.8"
        >
          Lago Natural
        </text>

        {/* ── Quadra Blocks ───────────────────────────────── */}
        {quadraPositions.map(({ layout, positions }) => {
          const quadraLots = lots.filter(l => l.quadra === layout.id)

          // Quadra background
          const bx = layout.x
          const by = layout.y
          const bw = layout.cols * layout.lotW
          const bh = layout.rows * layout.lotH

          return (
            <g key={layout.id}>
              {/* Block background */}
              <rect
                x={bx - 1} y={by - 1}
                width={bw + 2} height={bh + 2}
                fill="#EAE5DC"
                rx="1"
              />

              {/* Individual lots */}
              {positions.map((pos) => {
                const lot = quadraLots[pos.lotIndex]
                if (!lot) return null

                const isDimmed = filteredLotIds !== null && !filteredLotIds.has(lot.id)
                const isSelected = lot.id === selectedLotId

                const fill = isDimmed ? LOT_FILL_DIM : (LOT_FILL[lot.status] ?? LOT_FILL.disponivel)
                const stroke = isDimmed ? LOT_STROKE_DIM : (LOT_STROKE[lot.status] ?? LOT_STROKE.disponivel)

                return (
                  <rect
                    key={lot.id}
                    x={pos.x}
                    y={pos.y}
                    width={pos.w}
                    height={pos.h}
                    fill={fill}
                    stroke={isSelected ? '#C8A44A' : stroke}
                    strokeWidth={isSelected ? 2 : 0.5}
                    opacity={isDimmed ? 0.35 : 1}
                    filter={isSelected ? 'url(#lotGlow)' : undefined}
                    className={lot.status === 'vendido' ? 'cursor-default' : 'cursor-pointer'}
                    style={{ transition: 'opacity 0.2s, stroke 0.15s' }}
                    onMouseEnter={(e) => { e.stopPropagation(); handleLotHover(e, lot) }}
                    onMouseLeave={(e) => { e.stopPropagation(); setTooltip(null) }}
                    onClick={(e) => handleLotClick(e, lot)}
                  />
                )
              })}

              {/* Quadra label */}
              <text
                x={bx + bw / 2}
                y={by + bh + 14}
                textAnchor="middle"
                fontSize="10"
                fill="#9A9088"
                fontFamily="system-ui, sans-serif"
                fontWeight="600"
                letterSpacing="0.08em"
              >
                Q{layout.id}
              </text>
            </g>
          )
        })}

        {/* Compass rose */}
        <g transform="translate(2310, 100)">
          <circle cx="0" cy="0" r="22" fill="white" fillOpacity="0.8" stroke="#D8D2CA" strokeWidth="1" />
          <text x="0" y="-8" textAnchor="middle" fontSize="11" fill="#3A3A3A" fontWeight="700">N</text>
          <path d="M0,-4 L3,6 L0,3 L-3,6 Z" fill="#3A3A3A" />
          <path d="M0,4 L3,-6 L0,-3 L-3,-6 Z" fill="#C8C0B8" />
        </g>

        {/* Scale bar */}
        <g transform="translate(120, 2045)">
          <rect x="0" y="0" width="100" height="4" fill="#8A8278" rx="2" />
          <rect x="50" y="0" width="1" height="8" fill="#8A8278" />
          <text x="0" y="16" fontSize="9" fill="#8A8278" fontFamily="monospace">0</text>
          <text x="45" y="16" fontSize="9" fill="#8A8278" fontFamily="monospace">50m</text>
          <text x="90" y="16" fontSize="9" fill="#8A8278" fontFamily="monospace">100m</text>
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-20">
        <button
          onClick={() => zoom(0.75)}
          className="w-9 h-9 bg-white/90 backdrop-blur-sm border border-[#E0D8CC] rounded-xl flex items-center justify-center text-[#4A4A4A] hover:bg-white shadow-sm transition-colors"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => zoom(1.35)}
          className="w-9 h-9 bg-white/90 backdrop-blur-sm border border-[#E0D8CC] rounded-xl flex items-center justify-center text-[#4A4A4A] hover:bg-white shadow-sm transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => setVb(defaultVB)}
          className="w-9 h-9 bg-white/90 backdrop-blur-sm border border-[#E0D8CC] rounded-xl flex items-center justify-center text-[#4A4A4A] hover:bg-white shadow-sm transition-colors"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: Math.min(tooltip.screenX + 12, (containerRef.current?.offsetWidth ?? 800) - 220),
            top: Math.max(0, tooltip.screenY - 80),
          }}
        >
          <div className="bg-white rounded-xl shadow-xl border border-[#E8E2D8] px-3.5 py-2.5 min-w-[180px]">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-xs font-bold tracking-wide text-[#6B6B6B] uppercase"
              >
                Q{tooltip.lot.quadra} · Lote {tooltip.lot.lote}
              </span>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  background: LOT_FILL[tooltip.lot.status] + '33',
                  color: LOT_STROKE[tooltip.lot.status],
                }}
              >
                {tooltip.lot.status === 'disponivel' ? 'Disponível'
                  : tooltip.lot.status === 'vendido' ? 'Vendido'
                  : tooltip.lot.status === 'negociacao' ? 'Negociação'
                  : tooltip.lot.status === 'proprietario' ? 'Proprietário'
                  : 'Igreja'}
              </span>
            </div>
            <div className="flex items-end justify-between gap-4">
              <span className="text-sm font-bold text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {tooltip.lot.metragem.toFixed(0)} m²
              </span>
              {tooltip.lot.status !== 'vendido' && tooltip.lot.status !== 'proprietario' && (
                <span className="text-sm font-semibold text-[#3A3A3A]">
                  {tooltip.lot.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lake animation CSS */}
      <style>{`
        @keyframes lakeShimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.88; }
        }
        .lake-shimmer {
          animation: lakeShimmer 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
