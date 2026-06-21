'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { useLotMap, type LotMapEntry, type StatusFilter } from './useLotMap';
import AmenityLayer from './AmenityLayer';
import LotDetailPanel from './LotDetailPanel';
import AmenityMediaModal, { type AmenityMediaData } from './AmenityMediaModal';

function parseVb(s: string): ViewBox {
  const [x, y, w, h] = s.split(' ').map(Number);
  return { x, y, w, h };
}

interface ViewBox { x: number; y: number; w: number; h: number }

// IMI Brand System — lot fill colors (CRM semantic palette)
const LOT_COLORS: Record<string, { fill: string; stroke: string }> = {
  disponivel:    { fill: 'rgba(74,222,128,0.72)',  stroke: '#4ADE80' },
  reservado:     { fill: 'rgba(251,146,60,0.72)',  stroke: '#FB923C' },
  vendido:       { fill: 'rgba(248,113,113,0.55)', stroke: '#F87171' },
  negociacao:    { fill: 'rgba(251,191,36,0.72)',  stroke: '#FBBF24' },
  documentacao:  { fill: 'rgba(96,165,250,0.72)',  stroke: '#60A5FA' },
  bloqueado:     { fill: 'rgba(148,163,184,0.55)', stroke: '#94A3B8' },
  _hover:        { fill: 'rgba(200,164,74,0.45)',  stroke: '#C8A44A' },
  _selected:     { fill: 'rgba(200,164,74,0.65)',  stroke: '#D4B86A' },
};

const GOLD = '#C8A44A';
const NAVY = '#0B1928';

interface InteractiveLotMapProps {
  developmentId: string;
  lotMapJsonUrl: string;
  galleryImages?: string[];
  whatsappContact?: string;
}

// Robust bounding box using 2.5σ outlier exclusion — ensures selecting a quadra
// always zooms to the main cluster, even if one lot has corrupted coordinates.
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
    allLots,
    amenities,
    greenAreas,
    streets,
    perimeter,
    brLine,
    streetLabels,
    entrance,
    viewBox: initialViewBox,
    filteredStats,
    isLoading,
    fetchError,
    selectedLot,
    setSelectedLot,
    statusFilter,
    setStatusFilter,
    selectedQuadra,
    setSelectedQuadra,
    quadras,
    isManager,
    actionLoading,
    actionError,
    reserveLot,
    releaseLot,
    negotiateLot,
    changeStatus,
  } = useLotMap(developmentId, lotMapJsonUrl);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Amenity media — editorial content (photos/videos) fetched from DB
  const [amenityMedia, setAmenityMedia] = useState<Record<string, AmenityMediaData>>({});
  const [selectedAmenityId, setSelectedAmenityId] = useState<string | null>(null);

  useEffect(() => {
    if (!developmentId) return;
    fetch(`/api/developments/${developmentId}/map-amenities`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!Array.isArray(d?.amenities)) return;
        const map: Record<string, AmenityMediaData> = {};
        for (const a of d.amenities) map[a.id] = a;
        setAmenityMedia(map);
      })
      .catch(() => {});
  }, [developmentId]);

  const [vbParts, setVbParts] = useState(() => parseVb(initialViewBox));
  const [vb, setVb] = useState<ViewBox>(() => parseVb(initialViewBox));
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

  const toggleFullscreen = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!isFullscreen) {
      setIsFullscreen(true);
      wrapper?.requestFullscreen?.().catch(() => {});
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
  }, [isFullscreen]);

  // Sync state when browser exits native fullscreen (e.g. user presses Esc)
  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement) setIsFullscreen(false); };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  // Escape key exits CSS fullscreen on devices without native fullscreen (e.g. iOS)
  useEffect(() => {
    if (!isFullscreen || document.fullscreenElement) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  // Lock body scroll when in CSS fullscreen
  useEffect(() => {
    if (isFullscreen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);

  const scale = vbParts.w / vb.w;

  // ─── Animated viewBox transition ────────────────────────────────────────────
  const animRef = useRef<number | null>(null);

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
  }, []);

  // ─── Zoom ────────────────────────────────────────────────────────────────────
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
  }, [vbParts, animateTo]);

  // ─── Auto-fit when quadra selection changes ──────────────────────────────────
  // Uses allLots (unfiltered) to compute the quadra bounding box — this way the
  // viewport always fits the full physical extent of the quadra, regardless of
  // which status filter is active.
  const allLotsRef = useRef<LotMapEntry[]>(allLots);
  useEffect(() => { allLotsRef.current = allLots; }, [allLots]);
  const vbPartsRef = useRef(vbParts);
  useEffect(() => { vbPartsRef.current = vbParts; }, [vbParts]);

  useEffect(() => {
    const all = allLotsRef.current;
    const currentVbParts = vbPartsRef.current;
    if (isLoading || all.length === 0) return;

    if (selectedQuadra === null) {
      animateTo({ x: currentVbParts.x, y: currentVbParts.y, w: currentVbParts.w, h: currentVbParts.h });
      return;
    }

    // Strict: only lots belonging to this quadra, all statuses, for the viewport fit
    const quadraLots = all.filter((l: LotMapEntry) => l.quadra === selectedQuadra);
    const target = fitToLots(quadraLots);
    if (target) animateTo(target);
  }, [selectedQuadra]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Wheel zoom — attached via useEffect with passive:false so preventDefault works ──
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = vbLive.current.x + (e.clientX - rect.left) / rect.width * vbLive.current.w;
      const my = vbLive.current.y + (e.clientY - rect.top) / rect.height * vbLive.current.h;
      zoom(e.deltaY > 0 ? 1.12 : 0.89, mx, my);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [zoom]);

  // ─── Double-click to zoom in ─────────────────────────────────────────────────
  const onDblClick = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = vbLive.current.x + (e.clientX - rect.left) / rect.width * vbLive.current.w;
    const my = vbLive.current.y + (e.clientY - rect.top) / rect.height * vbLive.current.h;
    zoom(0.6, mx, my);
  }, [zoom]);

  // ─── Pan (drag) ──────────────────────────────────────────────────────────────
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

  // ─── Touch pinch-to-zoom & single-finger pan ─────────────────────────────────
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
      if (lastDist.current !== null) zoom(lastDist.current / dist);
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

  // ─── Amenity click ───────────────────────────────────────────────────────────
  const handleAmenityClick = useCallback((id: string) => {
    setSelectedAmenityId(prev => prev === id ? null : id);
    setSelectedLot(null);
  }, [setSelectedLot]);

  // ─── Lot click ───────────────────────────────────────────────────────────────
  const handleLotClick = useCallback((lot: LotMapEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAmenityId(null);
    setSelectedLot(lot.id === selectedLot?.id ? null : lot);
  }, [selectedLot, setSelectedLot]);

  const vbStr = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;
  const panelOpen = !!selectedLot;

  // Per-quadra availability counts — always from allLots so filter pills show
  // the full availability even when a status filter is active
  const quadraAvail = useMemo(() => {
    const m = new Map<string, number>();
    quadras.forEach(q => {
      m.set(q, allLots.filter((l: LotMapEntry) => l.quadra === q && l.status === 'disponivel').length);
    });
    return m;
  }, [quadras, allLots]);

  const STATUS_FILTERS: { key: StatusFilter; label: string; color: string }[] = [
    { key: 'todos',       label: 'TODOS',        color: GOLD      },
    { key: 'disponiveis', label: 'DISPONÍVEIS',  color: '#4ADE80' },
    { key: 'negociacao',  label: 'NEGOCIAÇÃO',   color: '#FBBF24' },
    { key: 'reservados',  label: 'RESERVADOS',   color: '#FB923C' },
    { key: 'vendidos',    label: 'VENDIDOS',     color: '#F87171' },
  ];

  return (
    <div
      ref={wrapperRef}
      className="w-full"
      style={isFullscreen ? {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: NAVY,
        display: 'flex',
        flexDirection: 'column',
        padding: '12px',
        gap: '8px',
      } : undefined}
    >
      {/* ─── Filter bar — two rows ─── */}
      <div className="mb-3 space-y-2">
        {/* Row 1: Status filters */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
          role="group"
          aria-label="Filtrar por status"
        >
          {STATUS_FILTERS.map(f => (
            <StatusChip
              key={f.key}
              label={f.label}
              active={statusFilter === f.key}
              activeColor={f.color}
              onClick={() => { setStatusFilter(f.key); setSelectedLot(null); }}
            />
          ))}
        </div>

        {/* Row 2: Quadra filters */}
        {quadras.length > 0 && (
          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide"
            style={{ WebkitOverflowScrolling: 'touch' }}
            role="group"
            aria-label="Filtrar por quadra"
          >
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.18em] mr-1" style={{ color: '#4F5B6B' }}>
              Quadra
            </span>
            <QuadraChip
              label="Todas"
              count={undefined}
              active={selectedQuadra === null}
              onClick={() => { setSelectedQuadra(null); setSelectedLot(null); }}
            />
            {quadras.map(q => (
              <QuadraChip
                key={q}
                label={q}
                count={quadraAvail.get(q) ?? 0}
                active={selectedQuadra === q}
                onClick={() => { setSelectedQuadra(q === selectedQuadra ? null : q); setSelectedLot(null); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Map container ─── */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl"
        style={{
          ...(isFullscreen
            ? { flex: 1, minHeight: 0 }
            : { height: isMobile ? 'max(72vw, 340px)' : 'clamp(520px, 65vh, 800px)' }
          ),
          background: NAVY,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(200,164,74,0.12)',
        }}
      >
        {/* Error overlay */}
        {fetchError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center" style={{ background: NAVY }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#8E99AB' }}>Mapa indisponível</p>
            <p className="text-xs" style={{ color: '#4F5B6B' }}>{fetchError}</p>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && !fetchError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center" style={{ background: NAVY }}>
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mb-3"
              style={{ borderColor: `${GOLD} transparent transparent transparent` }}
            />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#4F5B6B' }}>
              Carregando mapa…
            </p>
          </div>
        )}

        {/* SVG Map */}
        <svg
          ref={svgRef}
          viewBox={vbStr}
          className="w-full h-full"
          style={{ cursor: dragStart.current ? 'grabbing' : 'grab', touchAction: 'none' }}
          onMouseDown={onMouseDown}
          onDoubleClick={onDblClick}
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
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect x={vbParts.x} y={vbParts.y} width={vbParts.w} height={vbParts.h} fill="url(#imi-grid)" />

          {/* Infrastructure layer */}
          <g style={{ pointerEvents: 'none' }}>
            {perimeter.map((pts, i) => (
              <polygon
                key={`peri-${i}`}
                points={pts}
                fill="rgba(200,164,74,0.03)"
                stroke={GOLD}
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
                fill="rgba(74,222,128,0.10)"
                stroke="rgba(74,222,128,0.35)"
                strokeWidth={0.6 / scale}
              />
            ))}
            {streets.map((pts, i) => (
              <polyline
                key={`st-${i}`}
                points={pts}
                fill="none"
                stroke="rgba(255,255,255,0.14)"
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
                  opacity={lot.status === 'vendido' ? 0.6 : 1}
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

          {/* Lot number labels (zoom level ≥ 1.8) */}
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
                  fontFamily="var(--font-sans, sans-serif)"
                >
                  {lot.lote}
                </text>
              ))}
            </g>
          )}

          {/* Quadra badge labels */}
          {quadras.map(q => {
            // Compute centroid from allLots to always show label even when filtered
            const lotsInQ = allLots.filter(l => l.quadra === q);
            if (!lotsInQ.length) return null;
            const cx = lotsInQ.reduce((s, l) => s + l.labelX, 0) / lotsInQ.length;
            const cy = lotsInQ.reduce((s, l) => s + l.labelY, 0) / lotsInQ.length;
            const isActive = selectedQuadra === q;
            return (
              <g key={`qlbl-${q}`} style={{ pointerEvents: 'none' }}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={13}
                  fill={isActive ? 'rgba(200,164,74,0.18)' : 'rgba(11,25,40,0.75)'}
                  stroke={isActive ? GOLD : 'rgba(255,255,255,0.12)'}
                  strokeWidth={isActive ? 1.5 : 1}
                />
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fill={isActive ? GOLD : 'rgba(255,255,255,0.75)'}
                  fontWeight="700"
                  fontFamily="var(--font-sans, sans-serif)"
                >
                  {q}
                </text>
              </g>
            );
          })}

          {/* Street labels (zoom level ≥ 1.3) */}
          {scale > 1.3 && streetLabels.map((s, i) => (
            <text
              key={`stl-${i}`}
              x={s.x}
              y={s.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={5 / scale}
              fill="rgba(142,153,171,0.6)"
              fontWeight="600"
              fontFamily="var(--font-sans, sans-serif)"
              style={{ pointerEvents: 'none' }}
            >
              {s.name}
            </text>
          ))}

          {/* Entrance marker */}
          {entrance && (
            <g style={{ pointerEvents: 'none' }}>
              <circle cx={entrance.x} cy={entrance.y} r={9 / scale} fill={GOLD} stroke="#fff" strokeWidth={1.5 / scale} />
              <path
                d={`M ${entrance.x - 4 / scale} ${entrance.y + 1 / scale} h ${8 / scale} M ${entrance.x} ${entrance.y - 3 / scale} v ${6 / scale}`}
                stroke={NAVY}
                strokeWidth={1.4 / scale}
                strokeLinecap="round"
              />
              <text
                x={entrance.x}
                y={entrance.y - 14 / scale}
                textAnchor="middle"
                fontSize={5.5 / scale}
                fill={GOLD}
                fontWeight="800"
                fontFamily="var(--font-sans, sans-serif)"
                style={{ pointerEvents: 'none' }}
              >
                {entrance.label}
              </text>
            </g>
          )}

          <AmenityLayer amenities={amenities} scale={scale} onAmenityClick={handleAmenityClick} />
        </svg>

        {/* ─── Map controls (bottom-right) ─── */}
        <div className="absolute bottom-14 right-3 flex flex-col gap-1.5 z-10">
          <MapCtrlBtn onClick={() => zoom(0.75)} label="Aproximar">
            <ZoomIn className="w-4 h-4" />
          </MapCtrlBtn>
          <MapCtrlBtn onClick={() => zoom(1.33)} label="Afastar">
            <ZoomOut className="w-4 h-4" />
          </MapCtrlBtn>
          <MapCtrlBtn onClick={resetZoom} label="Ver tudo">
            <RotateCcw className="w-3.5 h-3.5" />
          </MapCtrlBtn>
          <MapCtrlBtn onClick={toggleFullscreen} label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </MapCtrlBtn>
        </div>

        {/* ─── Quadra indicator badge (top-center when a quadra is selected) ─── */}
        {selectedQuadra !== null && !isLoading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{
                background: 'rgba(11,25,40,0.85)',
                backdropFilter: 'blur(12px)',
                border: `1px solid rgba(200,164,74,0.35)`,
                color: GOLD,
              }}
            >
              <span>Quadra {selectedQuadra}</span>
              <span style={{ color: 'rgba(200,164,74,0.4)' }}>·</span>
              <span>{filteredStats.disponiveis} disponíveis</span>
            </div>
          </div>
        )}

        {/* ─── Stats & legend bar (bottom gradient) ─── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-2 px-3 py-2.5"
          style={{ background: 'linear-gradient(to top, rgba(11,25,40,0.98) 60%, transparent)' }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <StatChip value={filteredStats.total} label="visíveis" color={GOLD} />
            <StatChip value={filteredStats.disponiveis} label="disponíveis" color="#4ADE80" />
            {filteredStats.vendidos > 0 && <StatChip value={filteredStats.vendidos} label="vendidos" color="#F87171" />}
            {filteredStats.reservados > 0 && isManager && <StatChip value={filteredStats.reservados} label="reservados" color="#60A5FA" />}
            {filteredStats.negociacao > 0 && <StatChip value={filteredStats.negociacao} label="negociação" color="#FBBF24" />}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LegendDot color="#4ADE80" label="Disponível" />
            {isManager && <LegendDot color="#60A5FA" label="Reservado" />}
            <LegendDot color="#F87171" label="Vendido" />
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
                onNegotiate={opts => selectedLot && negotiateLot(selectedLot, opts)}
                onChangeStatus={(s, opts) => selectedLot && changeStatus(selectedLot, s, opts)}
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
          onNegotiate={opts => selectedLot && negotiateLot(selectedLot, opts)}
          onChangeStatus={(s, opts) => selectedLot && changeStatus(selectedLot, s, opts)}
        />
      )}

      {/* ─── Amenity media modal ─── */}
      {selectedAmenityId && (
        <AmenityMediaModal
          amenity={amenities.find(a => a.id === selectedAmenityId) ?? null}
          media={amenityMedia[selectedAmenityId]}
          onClose={() => setSelectedAmenityId(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusChip({
  label, active, activeColor, onClick,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 flex items-center gap-1.5 px-3.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A44A]"
      style={{
        height: 36,
        minHeight: 36,
        background: active ? 'rgba(200,164,74,0.08)' : 'transparent',
        color: active ? activeColor : '#4F5B6B',
        border: active ? `1.5px solid ${activeColor}44` : '1.5px solid rgba(255,255,255,0.08)',
      }}
    >
      {active && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: activeColor }}
        />
      )}
      {label}
    </button>
  );
}

function QuadraChip({
  label, count, active, onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 flex items-center gap-1.5 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A44A]"
      style={{
        height: 32,
        minHeight: 32,
        background: active ? 'rgba(200,164,74,0.08)' : 'transparent',
        color: active ? GOLD : '#4F5B6B',
        border: active ? `1.5px solid rgba(200,164,74,0.35)` : '1.5px solid rgba(255,255,255,0.08)',
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className="inline-flex items-center justify-center text-[9px] font-black rounded-full px-1 min-w-[18px] h-[18px]"
          style={{
            background: active ? 'rgba(200,164,74,0.18)' : 'rgba(255,255,255,0.08)',
            color: active ? GOLD : '#4F5B6B',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function MapCtrlBtn({
  onClick, label, children,
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
      className="w-10 h-10 flex items-center justify-center rounded-xl text-white transition-all active:scale-95"
      style={{
        background: 'rgba(11,25,40,0.90)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(200,164,74,0.22)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
        color: '#8E99AB',
      }}
    >
      {children}
    </button>
  );
}

function StatChip({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-black leading-none" style={{ color, fontFamily: 'var(--font-mono, monospace)' }}>
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-wider font-medium" style={{ color: '#4F5B6B' }}>
        {label}
      </span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} />
      <span className="text-[9px] hidden sm:inline" style={{ color: '#4F5B6B' }}>{label}</span>
    </div>
  );
}
