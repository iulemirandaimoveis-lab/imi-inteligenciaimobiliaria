'use client';

import React, {
  useRef, useState, useCallback, useMemo, useEffect, memo,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, MessageCircle, RefreshCw, AlertCircle, Layers } from 'lucide-react';
import {
  loadAltoBellevueMap, AB_VIEWBOX,
  type ABMapData,
} from '@/lib/lots/alto-bellevue';

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

// viewBox da fonte canônica (public/maps/alto-bellevue-lots.json)
const SVG_W = AB_VIEWBOX.w;
const SVG_H = AB_VIEWBOX.h;
const MIN_SCALE = 0.35;
const MAX_SCALE = 20;
const GOLD = '#C8A44A';
const NAVY = '#081524';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, {
  label: string; fill: string; stroke: string;
  dot: string; badgeBg: string; badgeText: string;
}> = {
  DISPONIVEL: {
    label: 'Disponível',
    fill: 'rgba(50,209,124,0.26)',
    stroke: '#32D17C',
    dot: '#32D17C',
    badgeBg: '#DCFCE7',
    badgeText: '#166534',
  },
  NEGOCIACAO: {
    label: 'Negociação',
    fill: 'rgba(255,181,71,0.35)',
    stroke: '#FFB547',
    dot: '#FFB547',
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
  },
  VENDIDO: {
    label: 'Vendido',
    fill: 'rgba(8,21,36,0.82)',
    stroke: '#1E3248',
    dot: '#FF5C5C',
    badgeBg: '#FEE2E2',
    badgeText: '#991B1B',
  },
  PROPRIETARIO: {
    label: 'Proprietário',
    fill: 'rgba(59,130,246,0.22)',
    stroke: '#3B82F6',
    dot: '#3B82F6',
    badgeBg: '#DBEAFE',
    badgeText: '#1E40AF',
  },
};

const getCfg = (k: string) => STATUS_CFG[k] ?? STATUS_CFG.DISPONIVEL;

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const fmtM2 = (v: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v)} m²`;
const fmtM = (v: number) => `${v.toFixed(1).replace('.', ',')} m`;

// ── Geometry helpers ──────────────────────────────────────────────────────────

function polygonAreaSvg(polygon: [number, number][]): number {
  let area = 0;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

function computeDimensions(polygon: [number, number][], areaM2: number): { testada: number; profundidade: number } | null {
  if (!polygon || polygon.length < 3 || !areaM2 || areaM2 <= 0) return null;
  const svgArea = polygonAreaSvg(polygon);
  if (svgArea <= 0) return null;
  const scaleFactor = Math.sqrt(areaM2 / svgArea);
  let maxEdge = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    maxEdge = Math.max(maxEdge, Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2));
  }
  const profundidade = Math.round(maxEdge * scaleFactor * 10) / 10;
  const testada = profundidade > 0 ? Math.round((areaM2 / profundidade) * 10) / 10 : 0;
  return { testada, profundidade };
}

/**
 * Medidas aproximadas das confrontações a partir das arestas do polígono.
 * Convenção de cadastro (vértices digitados a partir da frente): frente → lateral direita
 * → fundos → lateral esquerda. Só para polígonos de 4 lados; senão `null` (pendente).
 */
function computeSides(
  polygon: [number, number][],
  areaM2: number,
): { frente: number; lateralDir: number; fundos: number; lateralEsq: number } | null {
  if (!polygon || polygon.length !== 4 || !areaM2 || areaM2 <= 0) return null;
  const svgArea = polygonAreaSvg(polygon);
  if (svgArea <= 0) return null;
  const scaleFactor = Math.sqrt(areaM2 / svgArea);
  const edge = (i: number) => {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % 4];
    return Math.round(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * scaleFactor * 10) / 10;
  };
  return { frente: edge(0), lateralDir: edge(1), fundos: edge(2), lateralEsq: edge(3) };
}

/** Rua de acesso aproximada: label de rua mais próxima do centroide do lote. */
function nearestStreet(centroid: [number, number] | undefined, labels: { x: number; y: number; name: string }[]): string | null {
  if (!centroid || !labels?.length) return null;
  let best: { name: string; d: number } | null = null;
  for (const s of labels) {
    const d = (s.x - centroid[0]) ** 2 + (s.y - centroid[1]) ** 2;
    if (!best || d < best.d) best = { name: s.name, d };
  }
  return best?.name ?? null;
}

// ── Data hooks ────────────────────────────────────────────────────────────────

function useABMap() {
  const [data, setData] = useState<ABMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const signal = { cancelled: false };
    setLoading(true);
    setError(null);

    loadAltoBellevueMap({ signal })
      .then((d) => {
        if (signal.cancelled) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        if (signal.cancelled) return;
        setError('Não foi possível carregar o mapa. Verifique sua conexão.');
        setLoading(false);
      });

    return () => { signal.cancelled = true; };
  }, [attempt]);

  return { data, loading, error, retry: () => setAttempt((a) => a + 1) };
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

// ── SVG Map ───────────────────────────────────────────────────────────────────

interface MapInnerProps {
  lots: PlanLot[];
  allLots: PlanLot[];
  context: ABMapData | null;
  showTechLayer: boolean;
  selectedId: string | null;
  scale: number;
  origin: { x: number; y: number };
  isDragging: boolean;
  activeQuadra: string;
  onLotClick: (lot: PlanLot) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onBgClick: () => void;
}

const MapInner = memo(function MapInner({
  lots, allLots, context, showTechLayer, selectedId, scale, origin, isDragging,
  activeQuadra, onLotClick, onPointerDown, onPointerMove, onPointerUp, onBgClick,
}: MapInnerProps) {
  // Quadra centroid badges — computed from all lots
  const quadraCentroids = useMemo(() => {
    const map = new Map<string, { sx: number; sy: number; n: number; avail: number }>();
    for (const lot of allLots) {
      if (!lot.centroid) continue;
      const d = map.get(lot.quadra);
      if (d) {
        d.sx += lot.centroid[0]; d.sy += lot.centroid[1]; d.n++;
        if (lot.status === 'DISPONIVEL') d.avail++;
      } else {
        map.set(lot.quadra, { sx: lot.centroid[0], sy: lot.centroid[1], n: 1, avail: lot.status === 'DISPONIVEL' ? 1 : 0 });
      }
    }
    return Array.from(map.entries()).map(([quadra, d]) => ({
      quadra, cx: d.sx / d.n, cy: d.sy / d.n, avail: d.avail,
    }));
  }, [allLots]);

  // Progressive zoom levels
  const showLotNumbers = scale >= 1.5;
  const showAreaLabels = scale >= 3.5;
  const showQuadraBadges = scale < 4;
  const showStreetLabels = scale >= 1.1;
  const streetStroke = Math.max(0.5, 1.6 / scale);

  // Inverse-scale badge sizing so badges appear constant size on screen
  const badgeR = Math.max(7, 22 / scale);
  const badgeFontSize = Math.max(4.5, 13 / scale);

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
        aria-label="Mapa interativo de lotes Alto Bellevue"
        role="application"
      >
        <defs>
          <filter id="ab-sel-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="ab-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A1A2C" />
            <stop offset="100%" stopColor="#06101D" />
          </linearGradient>
        </defs>

        {/* Technical base — fundo escuro técnico (sem foto, alinhado ao viewBox canônico) */}
        <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#ab-base)" />

        {/* ── Camada técnica: perímetro, ruas, BR, portaria ── */}
        {showTechLayer && context && (
          <g style={{ pointerEvents: 'none' }}>
            {/* Perímetro do empreendimento */}
            {context.perimeter.map((poly, i) => (
              <polygon
                key={`perim-${i}`}
                points={poly.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="rgba(200,164,74,0.05)"
                stroke="rgba(200,164,74,0.45)"
                strokeWidth={Math.max(0.7, 2 / scale)}
                strokeDasharray={`${6 / scale} ${4 / scale}`}
              />
            ))}
            {/* Linha da BR */}
            {context.brLine.map((line, i) => (
              <polyline
                key={`br-${i}`}
                points={line.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth={Math.max(0.6, 2.4 / scale)}
              />
            ))}
            {/* Eixos das ruas */}
            {context.streets.map((line, i) => (
              <polyline
                key={`st-${i}`}
                points={line.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth={streetStroke}
                strokeLinecap="round"
              />
            ))}
            {/* Amenities (portaria, lazer) */}
            {context.amenities.map((a) => (
              <g key={`am-${a.id}`}>
                <circle cx={a.x} cy={a.y} r={Math.max(3, 7 / scale)} fill={a.color} opacity={0.85} />
                {scale >= 0.9 && (
                  <text
                    x={a.x} y={a.y - Math.max(5, 11 / scale)}
                    textAnchor="middle"
                    fontSize={Math.max(5, 9 / scale)}
                    fill="rgba(255,255,255,0.7)"
                    fontWeight="600"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {a.label}
                  </text>
                )}
              </g>
            ))}
            {/* Entrada / acesso */}
            {context.entrance && (
              <text
                x={context.entrance.x} y={context.entrance.y}
                textAnchor="middle"
                fontSize={Math.max(5, 9 / scale)}
                fill="rgba(200,164,74,0.85)"
                fontWeight="700"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {context.entrance.label}
              </text>
            )}
            {/* Nomes das ruas */}
            {showStreetLabels && context.streetLabels.map((s, i) => (
              <text
                key={`sl-${i}`}
                x={s.x} y={s.y}
                textAnchor="middle"
                fontSize={Math.max(4, 7 / scale)}
                fill="rgba(255,255,255,0.34)"
                fontWeight="500"
                letterSpacing="0.04em"
                style={{ fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase' }}
              >
                {s.name}
              </text>
            ))}
          </g>
        )}

        {/* Lots */}
        {lots.map(lot => {
          const cfg = getCfg(lot.status);
          const isSelected = lot.id === selectedId;
          const pts = lot.polygon.map(([x, y]) => `${x},${y}`).join(' ');
          const cx = lot.centroid?.[0] ?? 0;
          const cy = lot.centroid?.[1] ?? 0;

          return (
            <g
              key={lot.id}
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onLotClick(lot); }}
              role="button"
              aria-label={`Lote ${lot.lot_number} Quadra ${lot.quadra} — ${cfg.label}${lot.area_m2 ? `, ${Math.round(lot.area_m2 as number)}m²` : ''}${lot.price ? `, ${fmtBRL(lot.price as number)}` : ''}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onLotClick(lot);
                }
              }}
            >
              {isSelected && (
                <polygon
                  points={pts}
                  fill="transparent"
                  stroke="#C8A35F"
                  strokeWidth="7"
                  filter="url(#ab-sel-glow)"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              <polygon
                points={pts}
                fill={isSelected ? 'rgba(200,163,95,0.55)' : cfg.fill}
                stroke={isSelected ? '#D7B97A' : cfg.stroke}
                strokeWidth={isSelected ? 1.8 : 0.7}
              />

              {/* Lot number — zoom level 2+ */}
              {showLotNumbers && cx > 0 && cy > 0 && (
                <text
                  x={cx}
                  y={showAreaLabels ? cy - 2.5 : cy + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isSelected ? '#D7B97A' : lot.status === 'VENDIDO' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.88)'}
                  fontSize={7}
                  fontWeight={isSelected ? '800' : '600'}
                  style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'monospace' }}
                >
                  {lot.lot_number}
                </text>
              )}

              {/* Area m² — zoom level 3+ */}
              {showAreaLabels && cx > 0 && cy > 0 && lot.area_m2 && (
                <text
                  x={cx}
                  y={cy + 3.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isSelected ? 'rgba(215,185,122,0.85)' : 'rgba(255,255,255,0.52)'}
                  fontSize={4.5}
                  fontWeight="500"
                  style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'monospace' }}
                >
                  {Math.round(lot.area_m2 as number)}m²
                </text>
              )}
            </g>
          );
        })}

        {/* Quadra badges — zoom level 1-2 */}
        {showQuadraBadges && quadraCentroids.map(({ quadra, cx, cy, avail }) => {
          const isActive = activeQuadra === quadra;
          return (
            <g key={`qbadge-${quadra}`} style={{ pointerEvents: 'none' }}>
              <circle
                cx={cx} cy={cy} r={badgeR}
                fill={isActive ? 'rgba(200,164,74,0.88)' : 'rgba(8,21,36,0.80)'}
                stroke={isActive ? '#D7B97A' : avail > 0 ? 'rgba(50,209,124,0.55)' : 'rgba(255,255,255,0.18)'}
                strokeWidth={Math.max(0.4, 1.2 / scale)}
              />
              <text
                x={cx} y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={badgeFontSize}
                fill={isActive ? '#0B1928' : 'rgba(255,255,255,0.92)'}
                fontWeight="800"
                style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'sans-serif' }}
              >
                {quadra}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

// ── Map control button ────────────────────────────────────────────────────────

function MapBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={label}
      title={label}
      className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90"
      style={{
        background: 'rgba(8,21,36,0.90)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(200,164,74,0.22)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        color: 'rgba(255,255,255,0.75)',
      }}
    >
      {children}
    </button>
  );
}

// ── Skeleton loading ──────────────────────────────────────────────────────────

function MapSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4" style={{ background: NAVY }}>
      <div
        className="w-9 h-9 rounded-full border-2 animate-spin"
        style={{ borderColor: `${GOLD} ${GOLD} ${GOLD} transparent` }}
      />
      <p
        className="text-xs font-bold uppercase tracking-[0.22em]"
        style={{ color: 'rgba(200,164,74,0.65)', fontFamily: "'Outfit', sans-serif" }}
      >
        Carregando mapa de lotes…
      </p>
    </div>
  );
}

// ── Lot Detail Bottom Sheet ───────────────────────────────────────────────────

function LotBottomSheet({
  lot, priceEntry, onClose, whatsappPhone, developmentName, dbLot, streetLabels,
}: {
  lot: PlanLot;
  priceEntry?: PriceEntry;
  onClose: () => void;
  whatsappPhone: string;
  developmentName: string;
  dbLot?: Lot;
  streetLabels?: { x: number; y: number; name: string }[];
}) {
  const isAvailable = lot.status === 'DISPONIVEL';
  const isNegotiating = lot.status === 'NEGOCIACAO';
  const cfg = getCfg(lot.status);

  const dims = useMemo(() =>
    lot.polygon && lot.area_m2
      ? computeDimensions(lot.polygon, lot.area_m2 as number)
      : null,
    [lot]
  );

  const sides = useMemo(() =>
    lot.polygon && lot.area_m2
      ? computeSides(lot.polygon, lot.area_m2 as number)
      : null,
    [lot]
  );

  const acessoRua = useMemo(() => nearestStreet(lot.centroid, streetLabels ?? []), [lot.centroid, streetLabels]);

  const isCorner = dbLot?.special_type === 'ESQUINA';
  const pricePerM2 = lot.price && lot.area_m2 ? (lot.price as number) / (lot.area_m2 as number) : null;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const waInterest = encodeURIComponent(
    `Olá! Tenho interesse no ${developmentName} — Quadra ${lot.quadra}, Lote ${lot.lot_number}${lot.area_m2 ? `, área ${Math.round(lot.area_m2 as number)} m²` : ''}${lot.price ? `, valor ${fmtBRL(lot.price as number)}` : ''}. Gostaria de mais informações e condições de pagamento.`
  );
  const waVisit = encodeURIComponent(
    `Olá! Gostaria de agendar uma visita ao ${developmentName} — Quadra ${lot.quadra}, Lote ${lot.lot_number}.`
  );
  const waGeneral = encodeURIComponent(
    `Olá! Gostaria de informações sobre lotes disponíveis no ${developmentName}.`
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[9998]"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 z-[9999] overflow-y-auto"
        style={{
          maxHeight: '92vh',
          borderRadius: '24px 24px 0 0',
          background: '#fff',
          boxShadow: '0 -24px 80px rgba(0,0,0,0.35)',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull handle */}
        <div className="flex justify-center pt-3 pb-1.5">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5DDD0' }} />
        </div>

        {/* Status accent */}
        <div style={{ height: 3, background: cfg.dot }} />

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ background: cfg.badgeBg, color: cfg.badgeText }}
              >
                {cfg.label}
              </span>
              {isAvailable && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: '#F0EDE5', color: GOLD }}>
                  Premium
                </span>
              )}
              {isCorner && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                  Esquina
                </span>
              )}
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#081524', fontFamily: "'Outfit', sans-serif", margin: 0, lineHeight: 1.2 }}>
              Quadra {lot.quadra} · Lote {lot.lot_number}
            </h3>
            <p style={{ fontSize: 11, color: '#948F84', margin: '3px 0 0', fontWeight: 500 }}>
              {developmentName} · Garanhuns, PE
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 mt-1"
            style={{ background: '#F7F8FA' }}
            aria-label="Fechar"
          >
            <X size={15} color="#948F84" />
          </button>
        </div>

        {/* Area + Price */}
        <div className="grid grid-cols-2 gap-2.5 px-5 pb-3">
          <div style={{ background: '#F8F6F2', borderRadius: 14, padding: '13px 14px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 4px', fontFamily: "'Outfit', sans-serif" }}>Área Total</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
              {lot.area_m2 ? fmtM2(lot.area_m2 as number) : '—'}
            </p>
          </div>
          <div style={{ background: isAvailable ? '#081524' : '#F8F6F2', borderRadius: 14, padding: '13px 14px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: isAvailable ? GOLD : '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 4px', fontFamily: "'Outfit', sans-serif" }}>Valor</p>
            <p style={{ fontSize: lot.price && (lot.price as number) >= 100000 ? 15 : 18, fontWeight: 800, color: isAvailable ? '#fff' : '#081524', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
              {lot.price ? fmtBRL(lot.price as number) : 'Consultar'}
            </p>
          </div>
        </div>

        {/* Dimensions (computed) */}
        {dims && (
          <div className="grid grid-cols-2 gap-2.5 px-5 pb-3">
            <div style={{ background: '#F8F6F2', borderRadius: 14, padding: '11px 14px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 3px', fontFamily: "'Outfit', sans-serif" }}>Testada aprox.</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                {fmtM(dims.testada)}
              </p>
            </div>
            <div style={{ background: '#F8F6F2', borderRadius: 14, padding: '11px 14px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 3px', fontFamily: "'Outfit', sans-serif" }}>Profundidade aprox.</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                {fmtM(dims.profundidade)}
              </p>
            </div>
          </div>
        )}

        {/* Confrontações (aprox. — derivadas das arestas) */}
        {sides && (
          <div className="px-5 pb-3">
            <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 8px', fontFamily: "'Outfit', sans-serif" }}>
              Confrontações <span style={{ color: '#C0BAB2', fontWeight: 500 }}>(aprox.)</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {([
                { label: 'Frente', v: sides.frente },
                { label: 'Fundos', v: sides.fundos },
                { label: 'Lateral esq.', v: sides.lateralEsq },
                { label: 'Lateral dir.', v: sides.lateralDir },
              ] as const).map((s) => (
                <div key={s.label} style={{ background: '#F8F6F2', borderRadius: 10, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#948F84', fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace" }}>{fmtM(s.v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rua de acesso */}
        {acessoRua && (
          <div className="px-5 pb-3">
            <div style={{ background: '#F0EDE5', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: '#948F84', fontWeight: 600, flexShrink: 0 }}>Rua de acesso</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#081524', textAlign: 'right', fontFamily: "'Outfit', sans-serif" }}>{acessoRua}</span>
            </div>
          </div>
        )}

        {/* Price per m² */}
        {pricePerM2 && (
          <div className="px-5 pb-3">
            <div style={{ background: '#F0EDE5', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#948F84', fontWeight: 600 }}>Preço por m²</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace" }}>
                {fmtBRL(pricePerM2)}/m²
              </span>
            </div>
          </div>
        )}

        {/* Payment plans */}
        {priceEntry && (isAvailable || isNegotiating) && (
          <div className="px-5 pb-3">
            <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 10px', fontFamily: "'Outfit', sans-serif" }}>
              Formas de Pagamento
            </p>
            {/* Cash */}
            <div style={{ background: '#081524', borderRadius: 12, padding: '11px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 3px', fontFamily: "'Outfit', sans-serif" }}>À Vista</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: GOLD, fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                  {fmtBRL(priceEntry.preco_vista)}
                </p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(200,164,74,0.75)', background: 'rgba(200,164,74,0.12)', padding: '3px 8px', borderRadius: 8 }}>
                20% desc.
              </span>
            </div>
            {/* Installments */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {([
                { label: '12×', parcela: priceEntry.p12_parcela, total: priceEntry.p12_total },
                { label: '36×', parcela: priceEntry.p36_parcela, total: priceEntry.p36_total },
                { label: '60×', parcela: priceEntry.p60_parcela, total: priceEntry.p60_total },
                { label: '120×', parcela: priceEntry.p120_parcela, total: priceEntry.p120_total },
              ] as const).map(plan => (
                <div key={plan.label} style={{ background: '#F8F6F2', borderRadius: 12, padding: '10px 12px' }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px', fontFamily: "'Outfit', sans-serif" }}>{plan.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                    {fmtBRL(plan.parcela)}/mês
                  </p>
                  <p style={{ fontSize: 8, color: '#B8B3A8', margin: '2px 0 0', fontWeight: 500 }}>
                    Entrada {fmtBRL(priceEntry.entrada)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isNegotiating && (
          <div className="px-5 pb-3">
            <p style={{ fontSize: 11, color: '#92400E', background: '#FEF3C7', borderRadius: 10, padding: '9px 13px', margin: 0, lineHeight: 1.5 }}>
              Este lote está em processo de negociação. Entre em contato para verificar disponibilidade.
            </p>
          </div>
        )}

        {dbLot?.notes && (
          <div className="px-5 pb-3">
            <p style={{ fontSize: 11, color: '#636363', background: '#F8F6F2', borderRadius: 10, padding: '9px 13px', margin: 0, lineHeight: 1.5 }}>
              {dbLot.notes}
            </p>
          </div>
        )}

        {/* CTAs */}
        <div className="px-5 pt-1 pb-2 flex flex-col gap-2">
          {isAvailable || isNegotiating ? (
            <>
              <a
                href={`https://wa.me/${whatsappPhone}?text=${waInterest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center justify-center gap-2 w-full h-12 rounded-2xl text-[13px] font-bold uppercase tracking-wider overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0B1B2D, #10233B)', color: '#fff', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}
              >
                <MessageCircle size={15} />
                Tenho Interesse
                <span style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, opacity: 0.8 }} />
              </a>
              <a
                href={`https://wa.me/${whatsappPhone}?text=${waVisit}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl text-[12px] font-semibold"
                style={{ color: '#0B1B2D', border: '1.5px solid rgba(11,27,45,0.14)', background: '#F8F6F2', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}
              >
                Agendar Visita
              </a>
            </>
          ) : (
            <a
              href={`https://wa.me/${whatsappPhone}?text=${waGeneral}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl text-[13px] font-bold"
              style={{ color: '#0B1B2D', border: '1.5px solid rgba(11,27,45,0.12)', background: '#fff', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}
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
  const { data: mapData, loading, error, retry } = useABMap();
  const priceMap = usePrices();
  const planLots = mapData?.lots ?? [];

  const [selectedLot, setSelectedLot] = useState<PlanLot | null>(null);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [activeQuadra, setActiveQuadra] = useState('ALL');
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showTechLayer, setShowTechLayer] = useState(true);

  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const allLots = useMemo(() => mergeLots(dbLots, planLots), [dbLots, planLots]);

  const stats = useMemo(() => ({
    available: allLots.filter(l => l.status === 'DISPONIVEL').length,
    negotiating: allLots.filter(l => l.status === 'NEGOCIACAO').length,
    sold: allLots.filter(l => l.status === 'VENDIDO').length,
    total: allLots.length,
  }), [allLots]);

  const filteredLots = useMemo(() =>
    allLots.filter(lot => {
      if (activeStatus !== 'ALL' && lot.status !== activeStatus) return false;
      if (activeQuadra !== 'ALL' && lot.quadra !== activeQuadra) return false;
      return true;
    }),
    [allLots, activeStatus, activeQuadra]
  );

  const quadras = useMemo(() =>
    [...new Set(allLots.map(l => l.quadra))].sort(),
    [allLots]
  );

  // Pointer handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    didDrag.current = false;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOrigin(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel zoom centered on cursor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.88 : 1.14;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left - rect.width / 2;
      const my = e.clientY - rect.top - rect.height / 2;
      setScale(s => {
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s * factor));
        const scaleChange = next / s;
        setOrigin(o => ({ x: o.x + mx * (1 - scaleChange), y: o.y + my * (1 - scaleChange) }));
        return next;
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomIn = useCallback(() => setScale(s => Math.min(MAX_SCALE, s * 1.35)), []);
  const zoomOut = useCallback(() => setScale(s => Math.max(MIN_SCALE, s / 1.35)), []);
  const resetView = useCallback(() => { setScale(1); setOrigin({ x: 0, y: 0 }); }, []);

  const handleBgClick = useCallback(() => {
    if (!didDrag.current) setSelectedLot(null);
  }, []);

  const selectedPrice = selectedLot
    ? priceMap.get(`${selectedLot.quadra}-${selectedLot.lot_number}`)
    : undefined;

  const selectedDbLot = selectedLot
    ? dbLots.find(l => `${l.quadra}-${String(l.lot_number).padStart(2, '0')}` === selectedLot.id)
    : undefined;

  const zoomLabel = scale < 1.5 ? 'Visão geral — toque num lote'
    : scale < 3.5 ? 'Nomes dos lotes visíveis'
    : scale < 7 ? 'Lote + área m²'
    : 'Detalhamento completo';

  const mapHeight = isMobile ? 'max(72vw, 440px)' : 'clamp(520px, 68vh, 820px)';

  return (
    <div className="w-full" style={{ background: '#F7F8FA' }}>

      {/* ── FILTER PILLS ────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '12px 14px 10px' }}>
        {/* Status */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2" style={{ scrollbarWidth: 'none' }}>
          {([
            { key: 'ALL',       label: 'Todos',       count: stats.total,       dot: GOLD },
            { key: 'DISPONIVEL',label: 'Disponíveis', count: stats.available,   dot: '#32D17C' },
            { key: 'NEGOCIACAO',label: 'Negociação',  count: stats.negotiating, dot: '#FFB547' },
            { key: 'VENDIDO',   label: 'Vendidos',    count: stats.sold,        dot: '#FF5C5C' },
          ] as const).map(({ key, label, count, dot }) => {
            const isActive = activeStatus === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveStatus(key); setSelectedLot(null); }}
                className="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 transition-all"
                style={{
                  height: 38, paddingLeft: 14, paddingRight: 14, borderRadius: 20,
                  fontSize: 11, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                  border: isActive ? 'none' : '1.5px solid rgba(0,0,0,0.09)',
                  background: isActive ? '#0B1B2D' : '#fff',
                  color: isActive ? '#fff' : '#636363',
                  boxShadow: isActive ? '0 2px 10px rgba(0,0,0,0.15)' : 'none',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? 'rgba(255,255,255,0.5)' : dot, display: 'inline-block', flexShrink: 0 }} />
                {label}
                <span style={{ fontSize: 9, fontWeight: 800, opacity: 0.65, fontFamily: "'JetBrains Mono', monospace" }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Quadras */}
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#C8C3BB', textTransform: 'uppercase', letterSpacing: '0.15em', alignSelf: 'center', flexShrink: 0, marginRight: 2 }}>
            Quadra
          </span>
          {(['ALL', ...quadras] as string[]).map(q => {
            const isActive = activeQuadra === q;
            const avail = q === 'ALL' ? 0 : allLots.filter(l => l.quadra === q && l.status === 'DISPONIVEL').length;
            return (
              <button
                key={q}
                onClick={() => { setActiveQuadra(q === activeQuadra && q !== 'ALL' ? 'ALL' : q); setSelectedLot(null); }}
                style={{
                  height: 32, paddingLeft: 12, paddingRight: 12, borderRadius: 16,
                  fontSize: 10, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                  border: isActive ? 'none' : '1.5px solid rgba(0,0,0,0.09)',
                  background: isActive ? '#0B1B2D' : '#F7F8FA',
                  color: isActive ? '#fff' : '#636363',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {q === 'ALL' ? 'Todas' : q}
                {avail > 0 && !isActive && (
                  <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: '#32D17C', border: '1.5px solid #fff' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAP ─────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden"
        style={{ height: mapHeight, background: NAVY }}
      >
        {/* Fallback estático clicável — camada 3: nunca deixa o mapa em branco */}
        {error && (
          <div className="absolute inset-0 z-30" style={{ background: NAVY }}>
            {/* Planta estática (offline-first) */}
            <img
              src="/images/maps/alto-bellevue-plant.jpg"
              alt="Planta do loteamento Alto Bellevue"
              className="w-full h-full"
              style={{ objectFit: 'cover', opacity: 0.55 }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 px-8 text-center"
              style={{ background: 'linear-gradient(rgba(8,21,36,0.45), rgba(8,21,36,0.78))' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={22} style={{ color: 'rgba(200,164,74,0.75)' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.88)', margin: '0 0 4px', fontFamily: "'Outfit', sans-serif" }}>
                  Modo planta estática
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0, maxWidth: 280 }}>
                  Não foi possível carregar o mapa interativo. Veja a planta acima ou fale com um
                  especialista para condições atualizadas.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  onClick={retry}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-opacity hover:opacity-80 active:scale-95"
                  style={{ background: GOLD, color: '#0B1B2D', fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}
                >
                  <RefreshCw size={13} />
                  Tentar novamente
                </button>
                <a
                  href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Gostaria de informações sobre lotes disponíveis no ${developmentName}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.10)', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif", textDecoration: 'none', border: '1px solid rgba(255,255,255,0.18)' }}
                >
                  <MessageCircle size={13} />
                  Falar com especialista
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !error && <MapSkeleton />}

        {/* Map */}
        {!loading && !error && (
          <MapInner
            lots={filteredLots}
            allLots={allLots}
            context={mapData}
            showTechLayer={showTechLayer}
            selectedId={selectedLot?.id ?? null}
            scale={scale}
            origin={origin}
            isDragging={isDragging}
            activeQuadra={activeQuadra}
            onLotClick={setSelectedLot}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onBgClick={handleBgClick}
          />
        )}

        {/* Controls */}
        {!error && !loading && (
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
            <MapBtn onClick={zoomIn} label="Aproximar"><ZoomIn size={15} /></MapBtn>
            <MapBtn onClick={zoomOut} label="Afastar"><ZoomOut size={15} /></MapBtn>
            <MapBtn onClick={resetView} label="Ver tudo"><RotateCcw size={13} /></MapBtn>
            <MapBtn
              onClick={() => setShowTechLayer((v) => !v)}
              label={showTechLayer ? 'Ocultar camada técnica' : 'Mostrar camada técnica'}
            >
              <Layers size={14} style={{ opacity: showTechLayer ? 1 : 0.4 }} />
            </MapBtn>
          </div>
        )}

        {/* Active quadra badge */}
        <AnimatePresence>
          {activeQuadra !== 'ALL' && !loading && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ duration: 0.18 }}
              className="absolute top-3 left-3 z-10 pointer-events-none"
            >
              <div
                className="px-3.5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest"
                style={{
                  background: 'rgba(200,163,95,0.90)',
                  color: '#fff',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
                }}
              >
                Quadra {activeQuadra}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zoom level text indicator */}
        {!loading && !error && (
          <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
            <span
              className="px-2.5 py-1 rounded-lg text-[9px] font-semibold"
              style={{
                background: 'rgba(8,21,36,0.72)',
                color: 'rgba(200,164,74,0.80)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '0.06em',
              }}
            >
              {zoomLabel}
            </span>
          </div>
        )}

        {/* Tap hint */}
        <AnimatePresence>
          {!selectedLot && !loading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="absolute bottom-3 left-3 z-10 pointer-events-none"
            >
              <span
                className="px-3 py-1.5 rounded-full text-[10px] font-semibold"
                style={{
                  background: 'rgba(0,0,0,0.50)',
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

      {/* ── STATS BAR ─────────────────────────────────── */}
      <div
        style={{
          background: '#fff',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          padding: '11px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          {([
            { label: 'Disponíveis', value: stats.available, color: '#32D17C' },
            ...(stats.negotiating > 0 ? [{ label: 'Negociação', value: stats.negotiating, color: '#FFB547' }] : []),
            { label: 'Vendidos', value: stats.sold, color: '#FF5C5C' },
          ] as const).map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</span>
              <span style={{ fontSize: 10, color: '#948F84', fontWeight: 500 }}>{item.label}</span>
            </div>
          ))}
        </div>
        <span style={{ fontSize: 10, color: '#C0BAB2', fontWeight: 500, flexShrink: 0 }}>
          {stats.total} lotes · {quadras.length} quadras
        </span>
      </div>

      {/* ── LEGEND ─────────────────────────────────────── */}
      <div style={{ background: '#F8F6F2', borderTop: '1px solid rgba(0,0,0,0.04)', padding: '8px 16px', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#C8C3BB', textTransform: 'uppercase', letterSpacing: '0.15em', flexShrink: 0 }}>Legenda</span>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div style={{ width: 11, height: 11, borderRadius: 3, background: cfg.dot, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#636363', fontWeight: 600 }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* ── CTA STRIP — hidden while detail sheet is open ── */}
      <AnimatePresence>
        {!selectedLot && (
          <motion.div
            initial={false}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              background: '#0B1B2D',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap',
              overflow: 'hidden',
            }}
          >
            <div>
              <p style={{ fontSize: 12, color: GOLD, fontWeight: 700, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Outfit', sans-serif" }}>
                {stats.available} lote{stats.available !== 1 ? 's' : ''} disponíve{stats.available !== 1 ? 'is' : 'l'}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
                Fale com um especialista e escolha o seu.
              </p>
            </div>
            <a
              href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Tenho interesse em um lote no ${developmentName}. Gostaria de ver as opções disponíveis.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 h-11 px-5 rounded-xl text-[11px] font-bold uppercase tracking-wider flex-shrink-0 transition-opacity hover:opacity-90"
              style={{ background: GOLD, color: '#0B1B2D', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}
            >
              <MessageCircle size={13} />
              Falar com Especialista
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DETAIL BOTTOM SHEET ─────────────────────────── */}
      <AnimatePresence>
        {selectedLot && (
          <LotBottomSheet
            lot={selectedLot}
            priceEntry={selectedPrice}
            onClose={() => setSelectedLot(null)}
            whatsappPhone={whatsappPhone}
            developmentName={developmentName}
            dbLot={selectedDbLot}
            streetLabels={mapData?.streetLabels}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
