'use client';

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronRight, MessageCircle } from 'lucide-react';

interface Lot {
  id: string;
  quadra: string;
  lot_number: number;
  area_m2: number;
  price: number | null;
  status: string;
}

interface QuadraPos {
  x: number; // % of image width
  y: number; // % of image height
}

interface PlanConfig {
  imageUrl: string;
  imageAspect: number; // width / height
  quadraPositions: Record<string, QuadraPos>;
}

const STATUS_COLORS = {
  DISPONIVEL:   { bg: '#16A34A', light: '#DCFCE7', dark: '#166534', label: 'Disponível' },
  VENDIDO:      { bg: '#DC2626', light: '#FEE2E2', dark: '#991B1B', label: 'Vendido' },
  NEGOCIACAO:   { bg: '#D97706', light: '#FEF3C7', dark: '#92400E', label: 'Negociação' },
  PROPRIETARIO: { bg: '#2563EB', light: '#DBEAFE', dark: '#1E40AF', label: 'Proprietário' },
  IGREJA:       { bg: '#7C3AED', light: '#EDE9FE', dark: '#5B21B6', label: 'Igreja' },
} as const;

type StatusKey = keyof typeof STATUS_COLORS;

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

// Per-development plan configs
export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  // Loteamento Miguel Marques
  // Plant: two diagonal parallelogram sections. Upper section (A-N) runs NW→SE;
  // lower section (O-X) is the smaller block below-center.
  '8b9f6835-1bd0-4850-80b0-aaef2223300d': {
    imageUrl: '/images/maps/miguel-marques-plant.jpg',
    imageAspect: 2800 / 1981,
    quadraPositions: {
      // Upper section — columns run diagonally SW (bottom-left) → NE (top-right)
      A: { x: 8,  y: 38 }, B: { x: 13, y: 33 }, C: { x: 18, y: 28 },
      D: { x: 23, y: 23 }, E: { x: 29, y: 19 }, F: { x: 35, y: 16 },
      G: { x: 41, y: 15 }, H: { x: 47, y: 16 }, I: { x: 53, y: 19 },
      J: { x: 59, y: 23 }, K: { x: 64, y: 28 }, L: { x: 67, y: 34 },
      M: { x: 64, y: 40 }, N: { x: 56, y: 35 },
      // Lower section — columns run left → right, slightly diagonal
      O: { x: 10, y: 61 }, P: { x: 16, y: 63 }, Q: { x: 22, y: 65 },
      R: { x: 28, y: 67 }, S: { x: 34, y: 69 }, T: { x: 40, y: 71 },
      U: { x: 46, y: 73 }, V: { x: 51, y: 75 }, W: { x: 48, y: 80 },
      X: { x: 41, y: 78 },
    },
  },
  // Condomínio Alto Bellevue
  // Plant: curved arc/horseshoe layout in the right 55% of the image.
  // Quadras follow concentric road arcs from top-right curving to bottom-center.
  'ab7d1fc1-f069-4e3b-a515-8e1204c11247': {
    imageUrl: '/images/maps/alto-bellevue-plant.jpg',
    imageAspect: 3000 / 2120,
    quadraPositions: {
      // Outer arc — top right, curving clockwise
      A: { x: 76, y: 11 }, B: { x: 86, y: 20 }, C: { x: 91, y: 33 },
      // Second arc layer
      D: { x: 81, y: 26 }, E: { x: 72, y: 17 }, F: { x: 88, y: 45 },
      // Mid arcs
      G: { x: 87, y: 56 }, H: { x: 74, y: 46 }, I: { x: 78, y: 60 },
      // Lower arcs
      J: { x: 70, y: 68 }, K: { x: 84, y: 67 }, L: { x: 62, y: 64 },
      // Bottom sweep
      M: { x: 59, y: 75 }, N: { x: 71, y: 79 }, O: { x: 47, y: 74 },
      P: { x: 40, y: 66 },
    },
  },
};

export const PLAN_VIEW_IDS = new Set(Object.keys(PLAN_CONFIGS));

// ─── Quadra Side Panel ─────────────────────────────────────────────────────────
function QuadraPanel({
  quadra,
  lots,
  developmentName,
  whatsappPhone,
  onClose,
  onLotClick,
}: {
  quadra: string;
  lots: Lot[];
  developmentName: string;
  whatsappPhone: string;
  onClose: () => void;
  onLotClick: (lot: Lot) => void;
}) {
  const available = useMemo(
    () => lots.filter(l => l.status === 'DISPONIVEL').sort((a, b) => a.lot_number - b.lot_number),
    [lots],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of lots) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [lots]);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="absolute top-0 right-0 bottom-0 overflow-y-auto z-20"
      style={{ width: 260, background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.2)' }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-gray-100"
        style={{ background: '#fff', zIndex: 1 }}
      >
        <div>
          <p
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: '#0B1928',
              margin: 0,
              fontFamily: "var(--fu, 'Outfit', sans-serif)",
            }}
          >
            Quadra {quadra}
          </p>
          <p style={{ fontSize: 10, color: '#948F84', margin: '2px 0 0' }}>
            {lots.length} lotes · {available.length} disponíve{available.length !== 1 ? 'is' : 'l'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
        >
          <X size={13} />
        </button>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {Object.entries(counts).map(([st, cnt]) => {
          const cfg = STATUS_COLORS[st as StatusKey];
          if (!cfg) return null;
          return (
            <div key={st} style={{ background: cfg.light, borderRadius: 10, padding: '8px 10px' }}>
              <p
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: cfg.dark,
                  margin: '0 0 1px',
                  fontFamily: "var(--fm, 'JetBrains Mono', monospace)",
                }}
              >
                {cnt}
              </p>
              <p
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color: cfg.dark,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  margin: 0,
                  fontFamily: "var(--fu, 'Outfit', sans-serif)",
                }}
              >
                {cfg.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Available lots */}
      {available.length > 0 && (
        <div className="px-3 pb-3">
          <p
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#948F84',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              margin: '0 0 8px',
              fontFamily: "var(--fu, 'Outfit', sans-serif)",
            }}
          >
            Lotes disponíveis
          </p>
          <div className="space-y-1.5">
            {available.slice(0, 10).map(lot => (
              <button
                key={lot.id}
                onClick={() => {
                  onLotClick(lot);
                  onClose();
                }}
                className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#0B1928',
                      margin: '0 0 1px',
                      fontFamily: "var(--fu, 'Outfit', sans-serif)",
                    }}
                  >
                    Lote {lot.lot_number}
                  </p>
                  <p style={{ fontSize: 10, color: '#948F84', margin: 0 }}>
                    {new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(lot.area_m2)} m²
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {lot.price ? (
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#16A34A',
                        fontFamily: "var(--fm, 'JetBrains Mono', monospace)",
                        margin: 0,
                      }}
                    >
                      {fmtBRL(lot.price)}
                    </p>
                  ) : (
                    <p style={{ fontSize: 10, color: '#948F84', margin: 0 }}>Consultar</p>
                  )}
                  <ChevronRight size={11} style={{ color: '#948F84', flexShrink: 0 }} />
                </div>
              </button>
            ))}
            {available.length > 10 && (
              <p style={{ fontSize: 10, color: '#948F84', textAlign: 'center', padding: '4px 0', margin: 0 }}>
                +{available.length - 10} mais disponíveis
              </p>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp CTA */}
      <div className="px-3 pb-4">
        <a
          href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
            `Olá! Tenho interesse em um lote na Quadra ${quadra} do ${developmentName}. Quais estão disponíveis?`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            height: 40,
            borderRadius: 12,
            background: '#0B1928',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: "var(--fu, 'Outfit', sans-serif)",
            textDecoration: 'none',
          }}
        >
          <MessageCircle size={13} />
          Falar sobre esta Quadra
        </a>
      </div>
    </motion.div>
  );
}

// ─── Main Plan Viewer ─────────────────────────────────────────────────────────
export default function SubdivisionPlanView({
  lots,
  developmentId,
  developmentName,
  whatsappPhone = '5581997230455',
  onLotClick,
}: {
  lots: Lot[];
  developmentId: string;
  developmentName: string;
  whatsappPhone?: string;
  onLotClick: (lot: Lot) => void;
}) {
  const config = PLAN_CONFIGS[developmentId];

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [selectedQuadra, setSelectedQuadra] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // On mount, fit the image to the container width if needed
  useEffect(() => {
    if (!containerRef.current || !config) return;
    const containerW = containerRef.current.clientWidth;
    const imgW = 520 * config.imageAspect;
    if (imgW > containerW) {
      setScale(containerW / imgW);
    }
  }, [config]);

  // Per-quadra availability stats
  const quadraStats = useMemo(() => {
    const map = new Map<string, { lots: Lot[]; available: number; dominantStatus: StatusKey }>();
    for (const lot of lots) {
      if (!map.has(lot.quadra)) {
        map.set(lot.quadra, { lots: [], available: 0, dominantStatus: 'VENDIDO' });
      }
      const entry = map.get(lot.quadra)!;
      entry.lots.push(lot);
      if (lot.status === 'DISPONIVEL') entry.available++;
    }
    for (const [, entry] of map) {
      if (entry.available > 0) {
        entry.dominantStatus = 'DISPONIVEL';
      } else {
        const cts: Partial<Record<StatusKey, number>> = {};
        for (const l of entry.lots) cts[l.status as StatusKey] = (cts[l.status as StatusKey] ?? 0) + 1;
        if ((cts.NEGOCIACAO ?? 0) > 0) entry.dominantStatus = 'NEGOCIACAO';
        else if ((cts.PROPRIETARIO ?? 0) > 0) entry.dominantStatus = 'PROPRIETARIO';
        else entry.dominantStatus = 'VENDIDO';
      }
    }
    return map;
  }, [lots]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.88 : 1.14;
    setScale(s => Math.max(0.3, Math.min(6, s * factor)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setTranslate(t => ({ x: t.x + (e.clientX - lastMouse.x), y: t.y + (e.clientY - lastMouse.y) }));
      setLastMouse({ x: e.clientX, y: e.clientY });
    },
    [isDragging, lastMouse],
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // Basic touch support
  const touchRef = useRef<{ x: number; y: number; dist: number } | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current = { x: 0, y: 0, dist: Math.sqrt(dx * dx + dy * dy) };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchRef.current) return;
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchRef.current.x;
      const dy = e.touches[0].clientY - touchRef.current.y;
      setTranslate(t => ({ x: t.x + dx, y: t.y + dy }));
      touchRef.current = { ...touchRef.current, x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = dist / touchRef.current.dist;
      setScale(s => Math.max(0.3, Math.min(6, s * factor)));
      touchRef.current = { ...touchRef.current, dist };
    }
  }, []);

  const zoomIn = useCallback(() => setScale(s => Math.min(6, s * 1.3)), []);
  const zoomOut = useCallback(() => setScale(s => Math.max(0.3, s * 0.77)), []);
  const reset = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  if (!config) return null;

  const imgW = 520 * config.imageAspect;

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl overflow-hidden select-none"
      style={{
        height: 520,
        background: '#E8E3D9',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => { touchRef.current = null; }}
    >
      {/* Transformable layer */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px)) scale(${scale})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        {/* Image wrapper — exact image aspect ratio so badge %s are accurate */}
        <div style={{ position: 'relative', width: imgW, height: 520 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.imageUrl}
            alt="Planta do empreendimento"
            draggable={false}
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'fill' }}
          />

          {/* Quadra badge overlays */}
          {Object.entries(config.quadraPositions).map(([quadra, pos]) => {
            const stats = quadraStats.get(quadra);
            if (!stats) return null;
            const cfg = STATUS_COLORS[stats.dominantStatus];
            const isSelected = selectedQuadra === quadra;
            return (
              <button
                key={quadra}
                onClick={e => {
                  e.stopPropagation();
                  setSelectedQuadra(prev => (prev === quadra ? null : quadra));
                }}
                title={`Quadra ${quadra}: ${stats.available} disponíveis de ${stats.lots.length}`}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) scale(${isSelected ? 1.3 : 1})`,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: cfg.bg,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 900,
                  border: isSelected ? '2px solid #fff' : '1.5px solid rgba(255,255,255,0.65)',
                  boxShadow: isSelected
                    ? `0 0 0 3px ${cfg.bg}88, 0 6px 20px rgba(0,0,0,0.4)`
                    : '0 2px 8px rgba(0,0,0,0.35)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  zIndex: isSelected ? 15 : 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "var(--fm, 'JetBrains Mono', monospace)",
                  lineHeight: 1,
                }}
              >
                {quadra}
              </button>
            );
          })}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 z-10">
        <button
          onClick={zoomIn}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-700 hover:bg-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          title="Zoom in"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={zoomOut}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-700 hover:bg-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          title="Zoom out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={reset}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-700 hover:bg-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          title="Resetar vista"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-3 left-14 z-10">
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#948F84',
            background: 'rgba(255,255,255,0.88)',
            padding: '4px 8px',
            borderRadius: 8,
            fontFamily: "var(--fm, 'JetBrains Mono', monospace)",
          }}
        >
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* Interaction hint */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#948F84',
            background: 'rgba(255,255,255,0.88)',
            padding: '3px 10px',
            borderRadius: 99,
            whiteSpace: 'nowrap',
          }}
        >
          Arraste para explorar · Scroll para zoom · Clique numa quadra
        </span>
      </div>

      {/* Quadra panel */}
      <AnimatePresence>
        {selectedQuadra && quadraStats.has(selectedQuadra) && (
          <QuadraPanel
            quadra={selectedQuadra}
            lots={quadraStats.get(selectedQuadra)!.lots}
            developmentName={developmentName}
            whatsappPhone={whatsappPhone}
            onClose={() => setSelectedQuadra(null)}
            onLotClick={onLotClick}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
