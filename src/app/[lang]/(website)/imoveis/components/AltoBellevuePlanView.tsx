'use client';

import React, {
  useRef, useState, useCallback, useMemo, useEffect, memo,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, MessageCircle } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lot {
  id: string; quadra: string; lot_number: number;
  area_m2: number; price: number | null;
  status: string; special_type: string | null; notes: string | null;
}

interface PlanLot {
  id: string; quadra: string; lot_number: string;
  polygon: [number, number][]; centroid: [number, number];
  area_m2: number | null; price: number | null;
  status: string; has_polygon: boolean;
}

interface PriceEntry {
  quadra: string; lote: string;
  preco_lote: number; preco_vista: number; entrada: number;
  p12_total: number; p12_parcela: number;
  p36_total: number; p36_parcela: number;
  p60_total: number; p60_parcela: number;
  p120_total: number; p120_parcela: number;
}

interface Props {
  lots: Lot[];
  developmentId: string;
  developmentName: string;
  whatsappPhone?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SVG_W = 1000;
const SVG_H = 707;
const MIN_SCALE = 0.25;
const MAX_SCALE = 20;

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const fmtM2 = (v: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v)} m²`;

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, {
  label: string; fill: string; stroke: string;
  pillActiveBg: string; dot: string;
  badgeBg: string; badgeText: string;
}> = {
  DISPONIVEL: {
    label: 'Disponível',
    fill: 'rgba(50,209,124,0.22)',
    stroke: '#32D17C',
    pillActiveBg: '#32D17C',
    dot: '#32D17C',
    badgeBg: '#DCFCE7',
    badgeText: '#166534',
  },
  NEGOCIACAO: {
    label: 'Negociação',
    fill: 'rgba(255,181,71,0.28)',
    stroke: '#FFB547',
    pillActiveBg: '#FFB547',
    dot: '#FFB547',
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
  },
  VENDIDO: {
    label: 'Vendido',
    fill: 'rgba(8,21,36,0.78)',
    stroke: '#243042',
    pillActiveBg: '#FF5C5C',
    dot: '#FF5C5C',
    badgeBg: '#FEE2E2',
    badgeText: '#991B1B',
  },
  PROPRIETARIO: {
    label: 'Proprietário',
    fill: 'rgba(59,130,246,0.18)',
    stroke: '#3B82F6',
    pillActiveBg: '#3B82F6',
    dot: '#3B82F6',
    badgeBg: '#DBEAFE',
    badgeText: '#1E40AF',
  },
};

const getCfg = (k: string) => STATUS_CFG[k] ?? STATUS_CFG.DISPONIVEL;

// ── Data hooks ────────────────────────────────────────────────────────────────

function usePlanLots() {
  const [planLots, setPlanLots] = useState<PlanLot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/alto-bellevue-lots.json')
      .then(r => r.json())
      .then((d: PlanLot[]) => { setPlanLots(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { planLots, loading };
}

function usePrices() {
  const [priceMap, setPriceMap] = useState<Map<string, PriceEntry>>(new Map());

  useEffect(() => {
    fetch('/data/alto-bellevue-prices.json')
      .then(r => r.json())
      .then((data: PriceEntry[]) => {
        const m = new Map<string, PriceEntry>();
        for (const e of data) {
          m.set(`${e.quadra}-${String(parseInt(e.lote, 10)).padStart(2, '0')}`, e);
        }
        setPriceMap(m);
      })
      .catch(() => {});
  }, []);

  return priceMap;
}

// JSON status has priority (updated from Excel); DB price has priority
function mergeLots(dbLots: Lot[], planLots: PlanLot[]): PlanLot[] {
  const dbMap = new Map(
    dbLots.map(l => [`${l.quadra}-${String(l.lot_number).padStart(2, '0')}`, l])
  );
  return planLots.map(pl => {
    const db = dbMap.get(pl.id);
    return {
      ...pl,
      price: db?.price ?? pl.price,
      area_m2: (db?.area_m2 ?? pl.area_m2) || 0,
      status: pl.status || db?.status || 'DISPONIVEL',
    };
  });
}

// ── SVG Map (memoized) ────────────────────────────────────────────────────────

interface MapInnerProps {
  lots: PlanLot[];
  selectedId: string | null;
  scale: number;
  origin: { x: number; y: number };
  isDragging: boolean;
  onLotClick: (lot: PlanLot) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onBgClick: () => void;
}

const MapInner = memo(function MapInner({
  lots, selectedId, scale, origin, isDragging,
  onLotClick, onPointerDown, onPointerMove, onPointerUp, onBgClick,
}: MapInnerProps) {
  return (
    <div
      className="w-full h-full"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full h-full select-none"
        style={{
          transform: `translate(${origin.x}px, ${origin.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          willChange: 'transform',
          transition: isDragging ? 'none' : 'transform 0.18s ease',
        }}
        onClick={onBgClick}
      >
        <defs>
          <filter id="ab-glow-gold" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Satellite background */}
        <image
          href="/images/maps/alto-bellevue-bg.jpg"
          x="0" y="0"
          width={SVG_W} height={SVG_H}
          preserveAspectRatio="xMidYMid slice"
        />

        {/* Luxury dark overlay */}
        <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="rgba(8,21,36,0.50)" />

        {/* Lots */}
        {lots.map(lot => {
          const cfg = getCfg(lot.status);
          const sel = lot.id === selectedId;
          const pts = lot.polygon.map(([x, y]) => `${x},${y}`).join(' ');

          return (
            <g
              key={lot.id}
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onLotClick(lot); }}
            >
              {/* Gold glow ring for selected */}
              {sel && (
                <polygon
                  points={pts}
                  fill="transparent"
                  stroke="#C8A35F"
                  strokeWidth="6"
                  filter="url(#ab-glow-gold)"
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Lot fill */}
              <polygon
                points={pts}
                fill={sel ? 'rgba(200,163,95,0.52)' : cfg.fill}
                stroke={sel ? '#D7B97A' : cfg.stroke}
                strokeWidth={sel ? 1.5 : 0.65}
              />

              {/* Lot number label */}
              {lot.centroid && (
                <text
                  x={lot.centroid[0]}
                  y={lot.centroid[1] + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={sel
                    ? '#D7B97A'
                    : lot.status === 'VENDIDO'
                      ? 'rgba(255,255,255,0.18)'
                      : 'rgba(255,255,255,0.62)'}
                  fontSize="6"
                  fontWeight={sel ? '700' : '400'}
                  style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'monospace' }}
                >
                  {lot.lot_number}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

// ── Lot Bottom Sheet ──────────────────────────────────────────────────────────

function LotBottomSheet({
  lot, priceEntry, onClose, whatsappPhone, developmentName,
}: {
  lot: PlanLot;
  priceEntry?: PriceEntry;
  onClose: () => void;
  whatsappPhone: string;
  developmentName: string;
}) {
  const isAvailable = lot.status === 'DISPONIVEL';
  const cfg = getCfg(lot.status);

  // Block body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const waInterest = encodeURIComponent(
    `Olá! Tenho interesse no ${developmentName} — Quadra ${lot.quadra}, Lote ${lot.lot_number}${lot.area_m2 ? `, área de ${Math.round(lot.area_m2 as number)} m²` : ''}. Gostaria de mais informações.`
  );
  const waVisit = encodeURIComponent(
    `Olá! Gostaria de agendar uma visita ao ${developmentName}.`
  );

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 overflow-y-auto"
        style={{
          maxHeight: '82vh',
          borderRadius: '36px 36px 0 0',
          background: '#fff',
          boxShadow: '0 -32px 80px rgba(0,0,0,0.28)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E5E0D8' }} />
        </div>

        {/* Status accent bar */}
        <div style={{ height: 3, background: cfg.dot }} />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ background: cfg.badgeBg, color: cfg.badgeText }}
              >
                {cfg.label}
              </span>
              {isAvailable && (
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                  style={{ background: '#F0EDE5', color: '#C8A35F' }}
                >
                  Premium
                </span>
              )}
            </div>
            <h3
              className="leading-tight"
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#081524',
                fontFamily: "'Outfit', sans-serif",
                margin: 0,
              }}
            >
              Quadra {lot.quadra} &middot; Lote {lot.lot_number}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 mt-1"
            style={{ background: '#F7F8FA' }}
          >
            <X size={16} color="#948F84" />
          </button>
        </div>

        {/* Area + Price cards */}
        <div className="grid grid-cols-2 gap-3 px-6 pb-4">
          <div style={{ background: '#F7F8FA', borderRadius: 16, padding: '14px 16px' }}>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: '#948F84', fontFamily: "'Outfit', sans-serif" }}
            >
              Área
            </p>
            <p
              style={{
                fontSize: 20, fontWeight: 800, color: '#081524',
                fontFamily: "'JetBrains Mono', monospace", margin: 0,
              }}
            >
              {lot.area_m2 ? fmtM2(lot.area_m2 as number) : '—'}
            </p>
          </div>
          <div style={{ background: isAvailable ? '#081524' : '#F7F8FA', borderRadius: 16, padding: '14px 16px' }}>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: isAvailable ? '#C8A35F' : '#948F84', fontFamily: "'Outfit', sans-serif" }}
            >
              Valor
            </p>
            <p
              style={{
                fontSize: lot.price && lot.price >= 100000 ? 16 : 20,
                fontWeight: 800,
                color: isAvailable ? '#fff' : '#081524',
                fontFamily: "'JetBrains Mono', monospace",
                margin: 0,
              }}
            >
              {lot.price ? fmtBRL(lot.price) : 'Consultar'}
            </p>
          </div>
        </div>

        {/* Price/m² */}
        {lot.price && lot.area_m2 ? (
          <div className="px-6 pb-3">
            <div
              style={{
                background: '#F0EDE5', borderRadius: 12, padding: '10px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 11, color: '#948F84', fontWeight: 600 }}>
                Preço por m²
              </span>
              <span
                style={{
                  fontSize: 15, fontWeight: 800, color: '#081524',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {fmtBRL((lot.price as number) / (lot.area_m2 as number))}/m²
              </span>
            </div>
          </div>
        ) : null}

        {/* Payment plans */}
        {priceEntry && isAvailable && (
          <div className="px-6 pb-4">
            <p
              className="text-[9px] font-bold uppercase tracking-widest mb-2.5"
              style={{ color: '#948F84', fontFamily: "'Outfit', sans-serif" }}
            >
              Formas de Pagamento
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {([
                { label: 'À Vista', note: '20% desconto', value: priceEntry.preco_vista, mono: false, highlight: true },
                { label: '12×', note: `Ent. ${fmtBRL(priceEntry.entrada)}`, value: priceEntry.p12_parcela, mono: true, highlight: false },
                { label: '36×', note: `Ent. ${fmtBRL(priceEntry.entrada)}`, value: priceEntry.p36_parcela, mono: true, highlight: false },
                { label: '60×', note: `Ent. ${fmtBRL(priceEntry.entrada)}`, value: priceEntry.p60_parcela, mono: true, highlight: false },
                { label: '120×', note: 'INCC/IPCA+0,5%/m', value: priceEntry.p120_parcela, mono: true, highlight: false },
              ] as const).map(plan => (
                <div
                  key={plan.label}
                  style={{
                    background: plan.highlight ? '#081524' : '#F7F8FA',
                    borderRadius: 12,
                    padding: '10px 12px',
                  }}
                >
                  <p
                    className="text-[9px] font-bold uppercase tracking-wider mb-1"
                    style={{
                      color: plan.highlight ? '#C8A35F' : '#948F84',
                      fontFamily: "'Outfit', sans-serif",
                      margin: '0 0 4px',
                    }}
                  >
                    {plan.label}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: plan.highlight ? '#C8A35F' : '#081524',
                      fontFamily: "'JetBrains Mono', monospace",
                      margin: 0,
                    }}
                  >
                    {fmtBRL(plan.value)}{plan.mono ? '/mês' : ''}
                  </p>
                  <p style={{ fontSize: 8, color: plan.highlight ? 'rgba(255,255,255,0.35)' : '#B8B3A8', margin: '2px 0 0', fontWeight: 500 }}>
                    {plan.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {lot.status === 'NEGOCIACAO' && (
          <div className="px-6 pb-3">
            <p
              style={{
                fontSize: 11, color: '#92400E', background: '#FEF3C7',
                borderRadius: 10, padding: '8px 12px', margin: 0, lineHeight: 1.5,
              }}
            >
              Este lote está em processo de negociação. Entre em contato para verificar disponibilidade.
            </p>
          </div>
        )}

        {/* CTAs */}
        <div className="px-6 pb-8 pt-1 flex flex-col gap-2">
          {isAvailable || lot.status === 'NEGOCIACAO' ? (
            <>
              <a
                href={`https://wa.me/${whatsappPhone}?text=${waInterest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center justify-center gap-2 w-full h-12 rounded-2xl text-[13px] font-bold uppercase tracking-wider overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0B1B2D, #10233B)',
                  color: '#fff',
                  textDecoration: 'none',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                <MessageCircle size={15} />
                Tenho Interesse
                <span
                  style={{
                    position: 'absolute', bottom: 0, left: '20%', right: '20%',
                    height: 2, background: 'linear-gradient(90deg, transparent, #C8A35F, transparent)',
                    opacity: 0.8,
                  }}
                />
              </a>
              <a
                href={`https://wa.me/${whatsappPhone}?text=${waVisit}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl text-[12px] font-semibold"
                style={{
                  color: '#0B1B2D',
                  border: '1.5px solid rgba(11,27,45,0.12)',
                  background: '#F7F8FA',
                  textDecoration: 'none',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Agendar Visita
              </a>
            </>
          ) : (
            <a
              href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Gostaria de informações sobre lotes disponíveis no ${developmentName}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl text-[13px] font-bold"
              style={{
                color: '#0B1B2D',
                border: '1.5px solid rgba(11,27,45,0.12)',
                background: '#fff',
                textDecoration: 'none',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              <MessageCircle size={15} />
              Ver Lotes Disponíveis
            </a>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AltoBellevuePlanView({
  lots: dbLots,
  developmentName,
  whatsappPhone = '5581997230455',
}: Props) {
  const { planLots, loading } = usePlanLots();
  const priceMap = usePrices();

  const [selectedLot, setSelectedLot] = useState<PlanLot | null>(null);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [activeQuadra, setActiveQuadra] = useState('ALL');

  // Zoom/pan
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Merge DB lots with plan lots (JSON status takes priority — sourced from Excel)
  const allLots = useMemo(() => mergeLots(dbLots, planLots), [dbLots, planLots]);

  // DATA INTEGRITY CHECK: validate counters match rendered data
  const stats = useMemo(() => {
    const available = allLots.filter(l => l.status === 'DISPONIVEL').length;
    const reserved = allLots.filter(l => l.status === 'NEGOCIACAO').length;
    const sold = allLots.filter(l => l.status === 'VENDIDO').length;
    const other = allLots.filter(l => !['DISPONIVEL', 'NEGOCIACAO', 'VENDIDO', 'PROPRIETARIO'].includes(l.status)).length;
    const total = allLots.length;
    // Integrity: total must equal available + reserved + sold + other
    const valid = (available + reserved + sold + other) === total;
    return { available, reserved, sold, other, total, valid };
  }, [allLots]);

  // Filtered lots
  const filteredLots = useMemo(() => {
    return allLots.filter(lot => {
      if (activeStatus !== 'ALL' && lot.status !== activeStatus) return false;
      if (activeQuadra !== 'ALL' && lot.quadra !== activeQuadra) return false;
      return true;
    });
  }, [allLots, activeStatus, activeQuadra]);

  // Quadras sorted
  const quadras = useMemo(() =>
    [...new Set(allLots.map(l => l.quadra))].sort(),
    [allLots]
  );

  // Pan handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOrigin(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale(s => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s * (e.deltaY > 0 ? 0.9 : 1.1))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomIn = useCallback(() => setScale(s => Math.min(MAX_SCALE, s * 1.3)), []);
  const zoomOut = useCallback(() => setScale(s => Math.max(MIN_SCALE, s / 1.3)), []);
  const resetView = useCallback(() => { setScale(1); setOrigin({ x: 0, y: 0 }); }, []);

  const handleBgClick = useCallback(() => {
    if (!dragging.current) setSelectedLot(null);
  }, []);

  const selectedPrice = selectedLot
    ? priceMap.get(`${selectedLot.quadra}-${selectedLot.lot_number}`)
    : undefined;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
        <p
          style={{
            fontSize: 11, color: '#948F84', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Carregando mapa de lotes…
        </p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ background: '#F7F8FA' }}>

      {/* ── FILTER PILLS ─────────────────────────────────────────── */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          padding: '14px 16px 12px',
        }}
      >
        {/* Status filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2" style={{ scrollbarWidth: 'none' }}>
          {([
            { key: 'ALL', label: 'Todos', count: stats.total },
            { key: 'DISPONIVEL', label: 'Disponível', count: stats.available },
            { key: 'NEGOCIACAO', label: 'Negociação', count: stats.reserved },
            { key: 'VENDIDO', label: 'Vendido', count: stats.sold },
          ] as const).map(({ key, label, count }) => {
            const isActive = activeStatus === key;
            const dotColor = key === 'ALL' ? '#0B1B2D'
              : key === 'DISPONIVEL' ? '#32D17C'
              : key === 'NEGOCIACAO' ? '#FFB547'
              : '#FF5C5C';
            const activeBg = key === 'ALL' ? '#0B1B2D'
              : STATUS_CFG[key]?.pillActiveBg ?? '#0B1B2D';

            return (
              <button
                key={key}
                onClick={() => setActiveStatus(key)}
                className="flex items-center gap-2 whitespace-nowrap flex-shrink-0 transition-all"
                style={{
                  height: 40,
                  paddingLeft: 16,
                  paddingRight: 16,
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "'Outfit', sans-serif",
                  border: isActive ? 'none' : '1.5px solid rgba(0,0,0,0.09)',
                  background: isActive ? activeBg : '#fff',
                  color: isActive ? '#fff' : '#636363',
                  boxShadow: isActive ? '0 2px 12px rgba(0,0,0,0.14)' : 'none',
                }}
              >
                <span
                  style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: isActive ? 'rgba(255,255,255,0.55)' : dotColor,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                {label}
                <span
                  style={{
                    fontSize: 10, fontWeight: 800,
                    opacity: isActive ? 0.85 : 0.55,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quadra filters */}
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {(['ALL', ...quadras] as string[]).map(q => {
            const isActive = activeQuadra === q;
            return (
              <button
                key={q}
                onClick={() => setActiveQuadra(q)}
                className="whitespace-nowrap flex-shrink-0 transition-all"
                style={{
                  height: 36,
                  paddingLeft: 14,
                  paddingRight: 14,
                  borderRadius: 18,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "'Outfit', sans-serif",
                  border: isActive ? 'none' : '1.5px solid rgba(0,0,0,0.09)',
                  background: isActive ? '#0B1B2D' : '#F7F8FA',
                  color: isActive ? '#fff' : '#636363',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
                }}
              >
                {q === 'ALL' ? 'Todas as Quadras' : `Q ${q}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAP ──────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden"
        style={{
          height: 'clamp(280px, 40vh, 440px)',
          background: '#081524',
        }}
      >
        <MapInner
          lots={filteredLots}
          selectedId={selectedLot?.id ?? null}
          scale={scale}
          origin={origin}
          isDragging={dragging.current}
          onLotClick={setSelectedLot}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onBgClick={handleBgClick}
        />

        {/* Floating map controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          {([
            { icon: ZoomIn, onClick: zoomIn, label: 'Zoom in' },
            { icon: ZoomOut, onClick: zoomOut, label: 'Zoom out' },
            { icon: RotateCcw, onClick: resetView, label: 'Reset' },
          ] as const).map(({ icon: Icon, onClick, label }) => (
            <button
              key={label}
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              aria-label={label}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-opacity hover:opacity-80"
              style={{
                background: 'rgba(255,255,255,0.11)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.14)',
                color: '#fff',
              }}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>

        {/* Active quadra badge */}
        <AnimatePresence>
          {activeQuadra !== 'ALL' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ duration: 0.18 }}
              className="absolute top-3 left-3 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest"
              style={{
                background: 'rgba(200,163,95,0.88)',
                color: '#fff',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Quadra {activeQuadra}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap hint when nothing selected */}
        <AnimatePresence>
          {!selectedLot && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none"
            >
              <span
                className="px-3 py-1.5 rounded-full text-[10px] font-semibold"
                style={{
                  background: 'rgba(0,0,0,0.48)',
                  color: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                Toque em um lote para ver detalhes
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── STATS BAR ────────────────────────────────────────────── */}
      <div
        style={{
          background: '#fff',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        {([
          { label: 'Disponíveis', value: stats.available, dot: '#32D17C' },
          { label: 'Negociação', value: stats.reserved, dot: '#FFB547' },
          { label: 'Vendidos', value: stats.sold, dot: '#FF5C5C' },
        ] as const).map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: item.dot, display: 'inline-block', flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 14, fontWeight: 800, color: '#081524',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {item.value}
            </span>
            <span style={{ fontSize: 11, color: '#948F84', fontWeight: 500 }}>
              {item.label}
            </span>
          </div>
        ))}
        <div
          style={{
            marginLeft: 'auto',
            fontSize: 11, color: '#B8B3A8', fontWeight: 500,
          }}
        >
          {stats.total} lotes · {quadras.length} quadras
        </div>
      </div>

      {/* ── CTA STRIP ────────────────────────────────────────────── */}
      <div
        style={{
          background: '#0B1B2D',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              fontSize: 13, color: '#C8A35F', fontWeight: 700,
              margin: '0 0 2px',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {stats.available} lote{stats.available !== 1 ? 's' : ''} disponíve{stats.available !== 1 ? 'is' : 'l'}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Fale com um especialista e escolha o seu.
          </p>
        </div>
        <a
          href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Tenho interesse em um lote no ${developmentName}. Gostaria de ver as opções disponíveis.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center gap-2 h-11 px-6 rounded-xl text-[12px] font-bold uppercase tracking-wider overflow-hidden flex-shrink-0"
          style={{
            background: '#C8A35F',
            color: '#0B1B2D',
            textDecoration: 'none',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          <MessageCircle size={14} />
          Falar com Especialista
        </a>
      </div>

      {/* ── LOT DETAIL BOTTOM SHEET ───────────────────────────────── */}
      <AnimatePresence>
        {selectedLot && (
          <LotBottomSheet
            lot={selectedLot}
            priceEntry={selectedPrice}
            onClose={() => setSelectedLot(null)}
            whatsappPhone={whatsappPhone}
            developmentName={developmentName}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
