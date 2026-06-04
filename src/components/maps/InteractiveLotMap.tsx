'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useLotMap, type LotMapEntry } from './useLotMap';
import AmenityLayer from './AmenityLayer';
import LotDetailPanel from './LotDetailPanel';

function parseVb(s: string): ViewBox {
  const [x, y, w, h] = s.split(' ').map(Number);
  return { x, y, w, h };
}

interface ViewBox { x: number; y: number; w: number; h: number }

const LOT_COLORS: Record<string, { fill: string; stroke: string }> = {
  disponivel:  { fill: '#22c55e', stroke: '#16a34a' },
  reservado:   { fill: '#3b82f6', stroke: '#1d4ed8' },
  vendido:     { fill: '#92400e', stroke: '#78350f' },
  negociacao:  { fill: '#eab308', stroke: '#ca8a04' },
  _hover:      { fill: '#C8A44A', stroke: '#b08530' },
  _selected:   { fill: '#C8A44A', stroke: '#92660a' },
};

const GOLD = '#C8A44A';

interface InteractiveLotMapProps {
  developmentId: string;
  lotMapJsonUrl: string;
  galleryImages?: string[];
  whatsappContact?: string;
}

// Compute a robust bounding box for a set of lots.
// Uses outlier detection (2.5 std dev) to ignore misassigned lots when computing
// the zoom target, so selecting a quadra always focuses on the main cluster.
function fitToLots(lots: LotMapEntry[]): ViewBox | null {
  if (!lots.length) return null;

  const centroids = lots.map(l => {
    const pts = l.points.split(' ').map(p => {
      const [x, y] = p.split(',').map(Number);
      return { x, y };
    });
    return {
      x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
      y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
    };
  });

  const meanX = centroids.reduce((s, c) => s + c.x, 0) / centroids.length;
  const meanY = centroids.reduce((s, c) => s + c.y, 0) / centroids.length;

  let coreLots = lots;
  if (lots.length >= 5) {
    const stdX = Math.sqrt(centroids.reduce((s, c) => s + (c.x - meanX) ** 2, 0) / centroids.length);
    const stdY = Math.sqrt(centroids.reduce((s, c) => s + (c.y - meanY) ** 2, 0) / centroids.length);
    const filtered = lots.filter((_, i) =>
      Math.abs(centroids[i].x - meanX) <= 2.5 * stdX &&
      Math.abs(centroids[i].y - meanY) <= 2.5 * stdY,
    );
    if (filtered.length) coreLots = filtered;
  }

  const coords = coreLots.flatMap(l =>
    l.points.split(' ').map(p => {
      const [x, y] = p.split(',').map(Number);
      return { x, y };
    }),
  );

  const xs = coords.map(c => c.x);
  const ys = coords.map(c => c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const PAD = 0.35;
  const rawW = Math.max(maxX - minX, 80);
  const rawH = Math.max(maxY - minY, 80);
  const w = rawW * (1 + PAD * 2);
  const h = rawH * (1 + PAD * 2);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

export default function InteractiveLotMap({
  developmentId,
  lotMapJsonUrl,
  galleryImages = [],
  whatsappContact,
}: InteractiveLotMapProps) {
  const {
    lots,
    amenities,
    greenAreas,
    streets,
    perimeter,
    brLine,
    streetLabels,
    entrance,
    viewBox: initialViewBox,
    isLoading,
    fetchError,
    selectedLot,
    setSelectedLot,
    activeFilter,
    setActiveFilter,
    quadras,
    isManager,
    actionLoading,
    actionError,
    reserveLot,
    releaseLot,
  } = useLotMap(developmentId, lotMapJsonUrl);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [vbParts, setVbParts] = useState(() => parseVb(initialViewBox));
  const [vb, setVb] = useState<ViewBox>(() => parseVb(initialViewBox));
  // Keep a stable ref to current vb so animateTo doesn't need vb as a dependency
  const vbLive = useRef<ViewBox>(vb);
  vbLive.current = vb;

  useEffect(() => {
    if (initialViewBox && initialViewBox !== '0 0 1200 900') {
      const parsed = parseVb(initialViewBox);
      setVbParts(parsed);
      setVb(parsed);
    }
  }, [initialViewBox]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const scale = vbParts.w / vb.w;

  // ─── Animated viewBox transition ─────────────────────────────────────────
  const animRef = useRef<number | null>(null);

  // Stable reference — reads current vb via vbLive ref, no dependency on vb state
  const animateTo = useCallback((target: ViewBox) => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);

    const from = { ...vbLive.current };
    const duration = 380;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const next: ViewBox = {
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        w: from.w + (target.w - from.w) * e,
        h: from.h + (target.h - from.h) * e,
      };
      setVb(next);
      if (t < 1) animRef.current = requestAnimationFrame(tick);
      else animRef.current = null;
    };

    animRef.current = requestAnimationFrame(tick);
  }, []); // stable — no deps needed since we use the vbLive ref

  // ─── Zoom ─────────────────────────────────────────────────────────────────
  const zoom = useCallback((factor: number, pivotX?: number, pivotY?: number) => {
    if (animRef.current !== null) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    setVb((prev: ViewBox) => {
      const newW = Math.max(200, Math.min(vbParts.w * 1.5, prev.w * factor));
      const newH = newW * (vbParts.h / vbParts.w);
      const px = pivotX ?? prev.x + prev.w / 2;
      const py = pivotY ?? prev.y + prev.h / 2;
      const ratioX = (px - prev.x) / prev.w;
      const ratioY = (py - prev.y) / prev.h;
      return { x: px - ratioX * newW, y: py - ratioY * newH, w: newW, h: newH };
    });
  }, [vbParts]);

  const resetZoom = useCallback(() => {
    animateTo({ x: vbParts.x, y: vbParts.y, w: vbParts.w, h: vbParts.h });
  }, [vbParts, animateTo]); // animateTo is now stable

  // ─── Auto-fit when quadra filter changes ─────────────────────────────────
  const lotsRef = useRef<LotMapEntry[]>(lots);
  useEffect(() => { lotsRef.current = lots; }, [lots]);
  const vbPartsRef = useRef(vbParts);
  useEffect(() => { vbPartsRef.current = vbParts; }, [vbParts]);

  useEffect(() => {
    const currentLots = lotsRef.current;
    const currentVbParts = vbPartsRef.current;
    if (isLoading || currentLots.length === 0) return;

    if (activeFilter === 'todos' || activeFilter === 'disponiveis') {
      animateTo({ x: currentVbParts.x, y: currentVbParts.y, w: currentVbParts.w, h: currentVbParts.h });
      return;
    }

    const target = fitToLots(currentLots);
    if (target) animateTo(target);
  }, [activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Wheel zoom ──────────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = vb.x + (e.clientX - rect.left) / rect.width * vb.w;
    const my = vb.y + (e.clientY - rect.top) / rect.height * vb.h;
    zoom(e.deltaY > 0 ? 1.15 : 0.87, mx, my);
  }, [vb, zoom]);

  // ─── Pan (drag) ──────────────────────────────────────────────────────────
  const dragStart = useRef<{ mx: number; my: number; vx: number; vy: number } | null>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragStart.current = { mx: e.clientX, my: e.clientY, vx: vb.x, vy: vb.y };
  }, [vb]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStart.current) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dx = -(e.clientX - dragStart.current.mx) / rect.width * vb.w;
    const dy = -(e.clientY - dragStart.current.my) / rect.height * vb.h;
    setVb((prev: ViewBox) => ({ ...prev, x: dragStart.current!.vx + dx, y: dragStart.current!.vy + dy }));
  }, [vb]);

  const onMouseUp = useCallback(() => { dragStart.current = null; }, []);

  // ─── Touch pinch-to-zoom ─────────────────────────────────────────────────
  const lastDist = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragStart.current = { mx: e.touches[0].clientX, my: e.touches[0].clientY, vx: vb.x, vy: vb.y };
    }
  }, [vb]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastDist.current !== null) {
        zoom(lastDist.current / dist);
      }
      lastDist.current = dist;
      dragStart.current = null;
    } else if (e.touches.length === 1 && dragStart.current) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const ddx = -(e.touches[0].clientX - dragStart.current.mx) / rect.width * vb.w;
      const ddy = -(e.touches[0].clientY - dragStart.current.my) / rect.height * vb.h;
      setVb((prev: ViewBox) => ({ ...prev, x: dragStart.current!.vx + ddx, y: dragStart.current!.vy + ddy }));
    }
  }, [vb, zoom]);

  const onTouchEnd = useCallback(() => {
    lastDist.current = null;
    lastTouchCenter.current = null;
    dragStart.current = null;
  }, []);

  // ─── Lot click ───────────────────────────────────────────────────────────
  const handleLotClick = useCallback((lot: LotMapEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLot(lot.id === selectedLot?.id ? null : lot);
  }, [selectedLot, setSelectedLot]);

  const vbStr = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;
  const panelOpen = !!selectedLot;

  // Stats derived from current filtered lots
  const statsAvail = lots.filter(l => l.status === 'disponivel').length;
  const statsSold = lots.filter(l => l.status === 'vendido').length;
  const statsReserved = lots.filter(l => l.status === 'reservado').length;
  const statsNeg = lots.filter(l => l.status === 'negociacao').length;

  // Per-quadra availability counts for the filter badges
  const allLots = lotsRef.current; // may differ from filtered lots — but quadras derivation includes all
  const quadraAvail = new Map<string, number>();
  quadras.forEach(q => {
    const total = allLots.filter((l: LotMapEntry) => l.quadra === q && l.status === 'disponivel').length;
    quadraAvail.set(q, total);
  });

  return (
    <div className="w-full">
      {/* ─── Filter bar ─── */}
      <div className="mb-4">
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Global filters */}
          {(['todos', 'disponiveis'] as const).map(f => (
            <FilterPill
              key={f}
              label={f === 'todos' ? 'TODOS' : 'DISPONÍVEIS'}
              active={activeFilter === f}
              onClick={() => { setActiveFilter(f); setSelectedLot(null); }}
            />
          ))}

          {/* Divider */}
          <div className="shrink-0 w-px h-5 bg-gray-200 mx-1" />

          {/* Quadra filters */}
          {quadras.map(q => (
            <FilterPill
              key={q}
              label={q}
              sublabel={quadraAvail.get(q) ?? 0}
              active={activeFilter === q}
              onClick={() => { setActiveFilter(q); setSelectedLot(null); }}
            />
          ))}
        </div>
      </div>

      {/* ─── Map container ─── */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl bg-[#1a2332]"
        style={{
          height: isMobile ? 'max(72vw, 340px)' : 'clamp(520px, 65vh, 800px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* Error overlay */}
        {fetchError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#1a2332] px-6 text-center">
            <p className="text-gray-400 text-sm font-semibold mb-1">Mapa indisponível</p>
            <p className="text-gray-600 text-xs">{fetchError}</p>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && !fetchError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#1a2332]">
            <div className="w-8 h-8 rounded-full border-2 border-[#C8A44A] border-t-transparent animate-spin mb-3" />
            <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">Carregando mapa…</p>
          </div>
        )}

        {/* SVG Map */}
        <svg
          ref={svgRef}
          viewBox={vbStr}
          className="w-full h-full"
          style={{ cursor: dragStart.current ? 'grabbing' : 'grab', touchAction: 'none' }}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={() => setSelectedLot(null)}
          aria-label="Mapa interativo de lotes do empreendimento"
          role="application"
        >
          <defs>
            <pattern id="imi-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect x={vbParts.x} y={vbParts.y} width={vbParts.w} height={vbParts.h} fill="url(#imi-grid)" />

          {/* Infra layer */}
          <g style={{ pointerEvents: 'none' }}>
            {perimeter.map((pts, i) => (
              <polygon
                key={`peri-${i}`}
                points={pts}
                fill="rgba(200,164,74,0.04)"
                stroke="#C8A44A"
                strokeWidth={2.2 / scale}
                strokeLinejoin="round"
              />
            ))}
            {brLine.map((pts, i) => (
              <polyline
                key={`br-${i}`}
                points={pts}
                fill="none"
                stroke="#64748b"
                strokeWidth={1.4 / scale}
                strokeDasharray={`${6 / scale} ${4 / scale}`}
              />
            ))}
            {greenAreas.map((pts, i) => (
              <polygon
                key={`green-${i}`}
                points={pts}
                fill="rgba(34,197,94,0.15)"
                stroke="#16a34a"
                strokeWidth={0.6 / scale}
              />
            ))}
            {streets.map((pts, i) => (
              <polyline
                key={`st-${i}`}
                points={pts}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={0.5 / scale}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Lots */}
          <g>
            {lots.map(lot => {
              const isSelected = lot.id === selectedLot?.id;
              const isHovered = lot.id === hoveredId;
              const colors = isSelected
                ? LOT_COLORS._selected
                : isHovered
                  ? LOT_COLORS._hover
                  : LOT_COLORS[lot.status] ?? LOT_COLORS.disponivel;

              return (
                <polygon
                  key={lot.id}
                  points={lot.points}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isSelected ? 2.5 / scale : 0.8 / scale}
                  opacity={lot.status === 'vendido' ? 0.65 : 0.88}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredId(lot.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={(e: React.MouseEvent) => handleLotClick(lot, e)}
                  aria-label={`Lote ${lot.lote} Quadra ${lot.quadra} — ${lot.status}${lot.price ? ` — R$ ${lot.price.toLocaleString('pt-BR')}` : ''}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleLotClick(lot, e as unknown as React.MouseEvent)}
                />
              );
            })}
          </g>

          {/* Lot number labels (zoomed in) */}
          {scale > 1.8 && (
            <g style={{ pointerEvents: 'none' }}>
              {lots.map(lot => (
                <text
                  key={`lbl-${lot.id}`}
                  x={lot.labelX}
                  y={lot.labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={7 / scale}
                  fill="rgba(255,255,255,0.95)"
                  fontWeight="700"
                  fontFamily="var(--font-outfit, sans-serif)"
                >
                  {lot.lote}
                </text>
              ))}
            </g>
          )}

          {/* Quadra labels */}
          {quadras.map(q => {
            const lotsInQ = lots.filter(l => l.quadra === q);
            if (!lotsInQ.length) return null;
            const cx = lotsInQ.reduce((s, l) => s + l.labelX, 0) / lotsInQ.length;
            const cy = lotsInQ.reduce((s, l) => s + l.labelY, 0) / lotsInQ.length;
            const isActive = activeFilter === q;
            return (
              <g key={`qlbl-${q}`} style={{ pointerEvents: 'none' }}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={13}
                  fill={isActive ? 'rgba(200,164,74,0.9)' : 'rgba(26,35,50,0.8)'}
                  stroke={isActive ? '#C8A44A' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={1}
                />
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fill="#fff"
                  fontWeight="800"
                  fontFamily="var(--font-outfit, sans-serif)"
                >
                  {q}
                </text>
              </g>
            );
          })}

          {/* Street labels */}
          {scale > 1.3 && streetLabels.map((s, i) => (
            <text
              key={`stl-${i}`}
              x={s.x}
              y={s.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={5 / scale}
              fill="rgba(226,232,240,0.7)"
              fontWeight="600"
              fontFamily="var(--font-outfit, sans-serif)"
              style={{ pointerEvents: 'none', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              {s.name}
            </text>
          ))}

          {/* Entrance marker */}
          {entrance && (
            <g style={{ pointerEvents: 'none' }}>
              <circle cx={entrance.x} cy={entrance.y} r={9 / scale} fill="#C8A44A" stroke="#fff" strokeWidth={1.5 / scale} />
              <path
                d={`M ${entrance.x - 4 / scale} ${entrance.y + 1 / scale} h ${8 / scale} M ${entrance.x} ${entrance.y - 3 / scale} v ${6 / scale}`}
                stroke="#1a2332"
                strokeWidth={1.4 / scale}
                strokeLinecap="round"
              />
              <text
                x={entrance.x}
                y={entrance.y - 14 / scale}
                textAnchor="middle"
                fontSize={5.5 / scale}
                fill="#C8A44A"
                fontWeight="800"
                fontFamily="var(--font-outfit, sans-serif)"
                style={{ pointerEvents: 'none' }}
              >
                {entrance.label}
              </text>
            </g>
          )}

          <AmenityLayer amenities={amenities} scale={scale} />
        </svg>

        {/* ─── Map controls (bottom-right) ─── */}
        <div className="absolute bottom-14 right-3 flex flex-col gap-1 z-10">
          <MapCtrlBtn onClick={() => zoom(0.75)} label="Aproximar">
            <ZoomIn className="w-3.5 h-3.5" />
          </MapCtrlBtn>
          <MapCtrlBtn onClick={() => zoom(1.33)} label="Afastar">
            <ZoomOut className="w-3.5 h-3.5" />
          </MapCtrlBtn>
          <MapCtrlBtn onClick={resetZoom} label="Ver tudo">
            <RotateCcw className="w-3 h-3" />
          </MapCtrlBtn>
        </div>

        {/* ─── Quadra indicator badge (top-center when quadra selected) ─── */}
        {activeFilter !== 'todos' && activeFilter !== 'disponiveis' && !isLoading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white"
              style={{ background: 'rgba(200,164,74,0.92)', backdropFilter: 'blur(8px)' }}
            >
              <span>Quadra {activeFilter}</span>
              <span className="opacity-70">·</span>
              <span>{statsAvail} disponíveis</span>
            </div>
          </div>
        )}

        {/* ─── Stats & legend bar (bottom) ─── */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-2 px-3 py-2"
          style={{ background: 'linear-gradient(to top, rgba(26,35,50,0.98) 60%, rgba(26,35,50,0.0))' }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <StatChip value={lots.length} label="visíveis" color={GOLD} />
            <StatChip value={statsAvail} label="disponíveis" color="#22c55e" />
            {statsSold > 0 && <StatChip value={statsSold} label="vendidos" color="#ef4444" />}
            {statsReserved > 0 && isManager && <StatChip value={statsReserved} label="reservados" color="#3b82f6" />}
            {statsNeg > 0 && <StatChip value={statsNeg} label="negociação" color="#eab308" />}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LegendDot color="#22c55e" label="Disponível" />
            {isManager && <LegendDot color="#3b82f6" label="Reservado" />}
            <LegendDot color="#92400e" label="Vendido" />
          </div>
        </div>

        {/* ─── Desktop lot detail panel ─── */}
        {!isMobile && panelOpen && (
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="pointer-events-auto h-full">
              <LotDetailPanel
                lot={selectedLot}
                onClose={() => setSelectedLot(null)}
                isMobile={false}
                whatsappContact={whatsappContact}
                isManager={isManager}
                actionLoading={actionLoading}
                actionError={actionError}
                onReserve={opts => selectedLot && reserveLot(selectedLot, opts)}
                onRelease={() => selectedLot && releaseLot(selectedLot)}
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── Mobile bottom sheet ─── */}
      {isMobile && (
        <LotDetailPanel
          lot={selectedLot}
          onClose={() => setSelectedLot(null)}
          isMobile={true}
          whatsappContact={whatsappContact}
          isManager={isManager}
          actionLoading={actionLoading}
          actionError={actionError}
          onReserve={opts => selectedLot && reserveLot(selectedLot, opts)}
          onRelease={() => selectedLot && releaseLot(selectedLot)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FilterPill({
  label,
  sublabel,
  active,
  onClick,
}: {
  label: string;
  sublabel?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A44A]"
      style={{
        background: active ? GOLD : 'transparent',
        color: active ? '#1a2332' : '#6b7280',
        border: active ? `1.5px solid ${GOLD}` : '1.5px solid #e5e7eb',
        boxShadow: active ? '0 2px 8px rgba(200,164,74,0.3)' : 'none',
      }}
    >
      {label}
      {sublabel !== undefined && (
        <span
          className="inline-flex items-center justify-center text-[10px] font-black rounded-full px-1 min-w-[18px] h-[18px]"
          style={{
            background: active ? 'rgba(26,35,50,0.2)' : 'rgba(200,164,74,0.12)',
            color: active ? '#1a2332' : '#C8A44A',
          }}
        >
          {sublabel}
        </span>
      )}
    </button>
  );
}

function MapCtrlBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-white transition-all active:scale-95"
      style={{
        background: 'rgba(26,35,50,0.88)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {children}
    </button>
  );
}

function StatChip({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-black leading-none" style={{ color }}>{value}</span>
      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{label}</span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} />
      <span className="text-[10px] text-gray-500 hidden sm:inline">{label}</span>
    </div>
  );
}
