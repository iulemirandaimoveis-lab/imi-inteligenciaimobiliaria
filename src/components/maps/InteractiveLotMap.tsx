'use client';

import { useRef, useState, useCallback, useEffect, WheelEvent } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, MapPin } from 'lucide-react';
import { useLotMap, type LotMapEntry } from './useLotMap';
import AmenityLayer from './AmenityLayer';
import LotDetailPanel from './LotDetailPanel';

function parseVb(s: string): { x: number; y: number; w: number; h: number } {
  const [x, y, w, h] = s.split(' ').map(Number);
  return { x, y, w, h };
}

const LOT_COLORS: Record<string, { fill: string; stroke: string }> = {
  disponivel:  { fill: '#22c55e', stroke: '#16a34a' },
  vendido:     { fill: '#92400e', stroke: '#78350f' },
  negociacao:  { fill: '#eab308', stroke: '#ca8a04' },
  _hover:      { fill: '#C8A44A', stroke: '#b08530' },
  _selected:   { fill: '#C8A44A', stroke: '#92660a' },
};

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface InteractiveLotMapProps {
  developmentId: string;
  lotMapJsonUrl: string;
  galleryImages?: string[];
  whatsappContact?: string;
}

export default function InteractiveLotMap({ developmentId, lotMapJsonUrl, galleryImages = [], whatsappContact }: InteractiveLotMapProps) {
  const {
    lots,
    amenities,
    viewBox: initialViewBox,
    stats,
    isLoading,
    fetchError,
    selectedLot,
    setSelectedLot,
    activeFilter,
    setActiveFilter,
    quadras,
  } = useLotMap(developmentId, lotMapJsonUrl);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse viewBox — updates when JSON loads (initialViewBox starts as default "0 0 1200 900")
  const [vbParts, setVbParts] = useState(() => parseVb(initialViewBox));
  const [vb, setVb] = useState<ViewBox>(() => parseVb(initialViewBox));

  // Sync viewBox when JSON data arrives
  useEffect(() => {
    if (initialViewBox && initialViewBox !== '0 0 1200 900') {
      const parsed = parseVb(initialViewBox);
      setVbParts(parsed);
      setVb(parsed);
    }
  }, [initialViewBox]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showAmenities, setShowAmenities] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Current zoom scale (ratio of original width to current viewbox width)
  const scale = vbParts.w / vb.w;


  // ─── Zoom ─────────────────────────────────────────────────────────────────
  const zoom = useCallback((factor: number, pivotX?: number, pivotY?: number) => {
    setVb(prev => {
      const newW = Math.max(200, Math.min(vbParts.w * 1.5, prev.w * factor));
      const newH = newW * (vbParts.h / vbParts.w);
      const px = pivotX ?? prev.x + prev.w / 2;
      const py = pivotY ?? prev.y + prev.h / 2;
      const ratioX = (px - prev.x) / prev.w;
      const ratioY = (py - prev.y) / prev.h;
      return {
        x: px - ratioX * newW,
        y: py - ratioY * newH,
        w: newW,
        h: newH,
      };
    });
  }, [vbParts]);

  const resetZoom = useCallback(() => {
    setVb({ x: vbParts.x, y: vbParts.y, w: vbParts.w, h: vbParts.h });
  }, [vbParts]);

  // ─── Wheel zoom ──────────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    // Mouse position in SVG coordinate space
    const mx = vb.x + (e.clientX - rect.left) / rect.width * vb.w;
    const my = vb.y + (e.clientY - rect.top) / rect.height * vb.h;
    zoom(e.deltaY > 0 ? 1.15 : 0.87, mx, my);
  }, [vb, zoom]);

  // ─── Pan (drag) ──────────────────────────────────────────────────────────
  const dragStart = useRef<{ mx: number; my: number; vx: number; vy: number } | null>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      vx: vb.x,
      vy: vb.y,
    };
  }, [vb]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStart.current) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dx = -(e.clientX - dragStart.current.mx) / rect.width * vb.w;
    const dy = -(e.clientY - dragStart.current.my) / rect.height * vb.h;
    setVb(prev => ({
      ...prev,
      x: dragStart.current!.vx + dx,
      y: dragStart.current!.vy + dy,
    }));
  }, [vb]);

  const onMouseUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  // ─── Touch pinch-to-zoom ─────────────────────────────────────────────────
  const lastDist = useRef<number | null>(null);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastDist.current !== null) {
        const factor = lastDist.current / dist;
        zoom(factor);
      }
      lastDist.current = dist;
    }
  }, [zoom]);

  const onTouchEnd = useCallback(() => {
    lastDist.current = null;
  }, []);

  // ─── Lot click ───────────────────────────────────────────────────────────
  const handleLotClick = useCallback((lot: LotMapEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLot(lot.id === selectedLot?.id ? null : lot);
  }, [selectedLot, setSelectedLot]);

  const vbStr = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;
  const panelOpen = !!selectedLot;

  return (
    <div className="w-full">
      {/* ─── Filter bar ─── */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {['todos', 'disponiveis', ...quadras].map(f => (
          <button
            key={f}
            onClick={() => { setActiveFilter(f); setSelectedLot(null); }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeFilter === f
                ? 'bg-[#1a2332] text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {f === 'todos' ? 'Todos' : f === 'disponiveis' ? 'Disponíveis' : `Quadra ${f}`}
          </button>
        ))}
      </div>

      {/* ─── Map container ─── */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-[#1a2332]"
        style={{ height: isMobile ? '90vw' : 'clamp(560px, 68vh, 820px)' }}
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
            <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">Carregando mapa...</p>
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
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={() => setSelectedLot(null)}
          aria-label="Mapa interativo de lotes do Alto Bellevue"
          role="application"
        >
          {/* Background grid (subtle) */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect x={vbParts.x} y={vbParts.y} width={vbParts.w} height={vbParts.h} fill="url(#grid)" />

          {/* Lots */}
          <g className="lots-layer">
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
                  strokeWidth={isSelected ? 2 : 0.8}
                  opacity={lot.status === 'vendido' ? 0.7 : 0.85}
                  style={{ cursor: 'pointer', transition: 'fill 0.15s, opacity 0.15s' }}
                  onMouseEnter={() => setHoveredId(lot.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={e => handleLotClick(lot, e)}
                  aria-label={`Lote ${lot.lote} Quadra ${lot.quadra} — ${lot.status}${lot.price ? ` — R$ ${lot.price.toLocaleString('pt-BR')}` : ''}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleLotClick(lot, e as unknown as React.MouseEvent)}
                />
              );
            })}
          </g>

          {/* Lot labels (only visible when zoomed in enough) */}
          {scale > 1.8 && (
            <g className="lot-labels" style={{ pointerEvents: 'none' }}>
              {lots.map(lot => (
                <text
                  key={`label-${lot.id}`}
                  x={lot.labelX}
                  y={lot.labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={8 / scale}
                  fill="rgba(255,255,255,0.9)"
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
            return (
              <g key={`quadra-label-${q}`} style={{ pointerEvents: 'none' }}>
                <circle cx={cx} cy={cy} r={12} fill="rgba(26,35,50,0.75)" />
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

          {/* Amenities layer */}
          {showAmenities && <AmenityLayer amenities={amenities} scale={scale} />}
        </svg>

        {/* ─── Controls overlay ─── */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={() => zoom(0.75)}
            className="w-8 h-8 flex items-center justify-center bg-[#1a2332]/90 backdrop-blur text-white rounded-lg hover:bg-[#1a2332] transition shadow-lg border border-white/10"
            aria-label="Aproximar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoom(1.33)}
            className="w-8 h-8 flex items-center justify-center bg-[#1a2332]/90 backdrop-blur text-white rounded-lg hover:bg-[#1a2332] transition shadow-lg border border-white/10"
            aria-label="Afastar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetZoom}
            className="w-8 h-8 flex items-center justify-center bg-[#1a2332]/90 backdrop-blur text-white rounded-lg hover:bg-[#1a2332] transition shadow-lg border border-white/10"
            aria-label="Resetar zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowAmenities(v => !v)}
            className={`w-8 h-8 flex items-center justify-center backdrop-blur rounded-lg transition shadow-lg border border-white/10 ${showAmenities ? 'bg-[#C8A44A] text-white' : 'bg-[#1a2332]/90 text-gray-400'}`}
            aria-label="Pontos de lazer"
            title="Mostrar/ocultar lazer"
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ─── Gallery thumbnails (top right, desktop) ─── */}
        {!isMobile && galleryImages.length > 0 && (
          <div className="absolute top-3 right-3 flex gap-1.5 z-10">
            {galleryImages.slice(0, 4).map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="w-14 h-14 object-cover rounded-lg shadow-lg border-2 border-white/20 hover:scale-105 transition-transform cursor-pointer"
              />
            ))}
          </div>
        )}

        {/* ─── Legend & Stats bar (bottom) ─── */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#1a2332]/90 backdrop-blur-sm flex items-center justify-between px-4 py-2 z-10">
          <div className="flex items-center gap-4">
            {/* Show live-filtered counts */}
            <StatChip label="visíveis" value={lots.length} color="#C8A44A" />
            <StatChip label="disponíveis" value={lots.filter(l => l.status === 'disponivel').length} color="#22c55e" />
            {lots.some(l => l.status === 'vendido') && (
              <StatChip label="vendidos" value={lots.filter(l => l.status === 'vendido').length} color="#ef4444" />
            )}
          </div>
          {showLegend && (
            <div className="flex items-center gap-3">
              <LegendItem color="#22c55e" label="Disponível" />
              <LegendItem color="#92400e" label="Vendido" />
              <LegendItem color="#eab308" label="Negociação" />
            </div>
          )}
        </div>

        {/* ─── Lot detail panel ─── */}
        {!isMobile && panelOpen && (
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="pointer-events-auto h-full">
              <LotDetailPanel lot={selectedLot} onClose={() => setSelectedLot(null)} isMobile={false} whatsappContact={whatsappContact} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {isMobile && (
        <LotDetailPanel lot={selectedLot} onClose={() => setSelectedLot(null)} isMobile={true} whatsappContact={whatsappContact} />
      )}

      {/* Mobile CTA */}
      {isMobile && !panelOpen && (
        <div className="mt-3 flex gap-2">
          <a
            href={`https://wa.me/${whatsappContact ?? '5581997230455'}?text=${encodeURIComponent('Olá! Tenho interesse neste empreendimento. Gostaria de falar com um especialista.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: '#C8A44A' }}
          >
            Falar com Especialista
          </a>
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-black" style={{ color }}>{value}</span>
      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{label}</span>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  );
}
