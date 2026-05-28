'use client';

import React, {
  useRef, useState, useCallback, useMemo, useEffect, useLayoutEffect, memo,
} from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import {
  X, ZoomIn, ZoomOut, RotateCcw, MessageCircle, ChevronLeft,
  Ruler, DollarSign, Maximize2, Minimize2, GripHorizontal,
  Share2, Calendar, Filter,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lot {
  id: string;
  quadra: string;
  lot_number: number;
  area_m2: number;
  price: number | null;
  status: string;
  special_type: string | null;
  notes: string | null;
}

/** Resolved shape for rendering a single lot — engine-agnostic */
interface LotRenderShape {
  /** SVG polygon points string (future GIS import) */
  points?: string;
  /** Grid cell bounds relative to quadra grid origin, in SVG units */
  x?: number; y?: number; w?: number; h?: number;
  /** SVG transform applied to a <g> wrapping this shape */
  groupTransform?: string;
}

/** Calibration metadata for each quadra — enables future visual tooling */
interface QuadraCalibration {
  /** Position of the quadra letter label in the original plant (SVG units) */
  plantLabel: [number, number];
  /** Street bearing this quadra faces (clockwise degrees from east) */
  roadBearing: number;
  /** Subjective alignment confidence after visual inspection */
  visualConfidence: 'high' | 'medium' | 'low';
  lastCalibrated: string;
  notes: string;
}

/** Full geometric description of one quadra */
interface QuadraGeometry {
  /** Polygon vertices in SVG coordinate space (viewBox 0 0 1000 707) */
  polygon: [number, number][];
  /** Centroid for label/badge placement */
  centroid: [number, number];
  /** Primary axis angle for the lot-grid (degrees, CW from +x) */
  primaryAxis: number;
  /** Grid layout parameters */
  grid: {
    cols: number;
    cellW: number;
    cellH: number;
    gap: number;
  };
  calibration: QuadraCalibration;
  /** GIS-imported per-lot polygon data (Mode B) — future */
  lots?: Array<{ lotNumber: number; polygon: [number, number][] }>;
}

type StatusKey = 'DISPONIVEL' | 'VENDIDO' | 'NEGOCIACAO' | 'PROPRIETARIO' | 'IGREJA';
type SheetState = 'hidden' | 'peek' | 'half' | 'full';
type FilterKey = 'ALL' | StatusKey;

// ─── Status palette ───────────────────────────────────────────────────────────

const STATUS: Record<StatusKey, {
  label: string; fill: string; stroke: string; textColor: string; badgeBg: string;
}> = {
  DISPONIVEL:   { label: 'Disponível',   fill: 'rgba(22,163,74,0.28)',  stroke: '#34D399', textColor: '#34D399', badgeBg: 'rgba(22,163,74,0.18)' },
  VENDIDO:      { label: 'Vendido',      fill: 'rgba(71,85,105,0.22)', stroke: '#94A3B8', textColor: '#94A3B8', badgeBg: 'rgba(71,85,105,0.18)' },
  NEGOCIACAO:   { label: 'Negociação',   fill: 'rgba(245,158,11,0.28)', stroke: '#FBBF24', textColor: '#FBBF24', badgeBg: 'rgba(245,158,11,0.18)' },
  PROPRIETARIO: { label: 'Proprietário', fill: 'rgba(59,130,246,0.26)', stroke: '#60A5FA', textColor: '#60A5FA', badgeBg: 'rgba(59,130,246,0.18)' },
  IGREJA:       { label: 'Igreja',       fill: 'rgba(124,58,237,0.26)', stroke: '#A78BFA', textColor: '#A78BFA', badgeBg: 'rgba(124,58,237,0.18)' },
};

const DEFAULT_STATUS = STATUS.DISPONIVEL;
const getStatus = (key: string) => STATUS[key as StatusKey] ?? DEFAULT_STATUS;

// ─── Constants ────────────────────────────────────────────────────────────────

const SVG_W = 1000;
const SVG_H = 707;   // 1000 × (2122/3000)
const IMAGE_URL = '/images/maps/alto-bellevue-plant.jpg';
const MIN_SCALE = 0.3;
const MAX_SCALE = 12;
const LOT_ZOOM_THRESHOLD = 115; // displayScale % — show individual lots above this

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const fmtM2 = (v: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v)} m²`;

// ─── Quadra Geometry Data ─────────────────────────────────────────────────────
// SVG coordinate system: viewBox 0 0 1000 707
// Source: 3000×2122px plant image mapped via scale 0.333 (x) and 0.333 (y)
// Polygon vertices traced from visual analysis of alto-bellevue-plant.jpg
// Calibration confidence: 'medium' on first pass — refine after visual comparison

const QUADRA_DATA: Record<string, QuadraGeometry> = {
  // ─── H — entrance arc, upper-center ────────────────────────────────────────
  H: {
    polygon: [
      [610,58],[650,52],[700,54],[726,66],[728,84],[724,100],
      [700,108],[650,110],[612,108],[592,96],[590,76],
    ],
    centroid: [660, 81],
    primaryAxis: -6,
    grid: { cols: 11, cellW: 11, cellH: 8, gap: 1.5 },
    calibration: {
      plantLabel: [660, 64], roadBearing: -6,
      visualConfidence: 'medium', lastCalibrated: '2026-05-28',
      notes: 'Quadra próxima à entrada principal, arco superior',
    },
  },

  // ─── A — top-right, mostly horizontal ──────────────────────────────────────
  A: {
    polygon: [
      [672,110],[732,100],[784,98],[824,108],[836,124],[836,148],
      [824,162],[784,168],[732,170],[672,162],[648,148],[648,124],
    ],
    centroid: [742, 134],
    primaryAxis: -2,
    grid: { cols: 14, cellW: 10, cellH: 8, gap: 1.5 },
    calibration: {
      plantLabel: [742, 112], roadBearing: -2,
      visualConfidence: 'medium', lastCalibrated: '2026-05-28',
      notes: 'Quadra superior direita, 28 lotes em 2 fileiras',
    },
  },

  // ─── D — upper-center, slight tilt ─────────────────────────────────────────
  D: {
    polygon: [
      [462,130],[528,120],[578,118],[610,130],[616,150],[616,176],
      [608,192],[576,200],[528,202],[466,192],[440,178],[440,150],
    ],
    centroid: [528, 160],
    primaryAxis: -5,
    grid: { cols: 13, cellW: 10, cellH: 8, gap: 1.5 },
    calibration: {
      plantLabel: [528, 132], roadBearing: -5,
      visualConfidence: 'medium', lastCalibrated: '2026-05-28',
      notes: 'Quadra centro-superior, 26 lotes',
    },
  },

  // ─── E — center, similar to D but lower ────────────────────────────────────
  E: {
    polygon: [
      [562,172],[622,162],[672,160],[704,172],[710,196],[710,222],
      [702,238],[670,246],[622,248],[564,238],[540,224],[540,196],
    ],
    centroid: [626, 205],
    primaryAxis: -2,
    grid: { cols: 13, cellW: 10, cellH: 8, gap: 1.5 },
    calibration: {
      plantLabel: [626, 174], roadBearing: -2,
      visualConfidence: 'medium', lastCalibrated: '2026-05-28',
      notes: 'Quadra centro, 25 lotes',
    },
  },

  // ─── B — right side, ~18° diagonal ─────────────────────────────────────────
  B: {
    polygon: [
      [782,166],[820,164],[852,172],[872,192],[876,220],[868,256],
      [852,274],[826,280],[796,276],[770,260],[756,232],[756,198],
    ],
    centroid: [814, 222],
    primaryAxis: 18,
    grid: { cols: 13, cellW: 10, cellH: 8, gap: 1.5 },
    calibration: {
      plantLabel: [814, 172], roadBearing: 18,
      visualConfidence: 'medium', lastCalibrated: '2026-05-28',
      notes: 'Quadra direita, 25 lotes, arco diagonal',
    },
  },

  // ─── I — center-right, ~16° ────────────────────────────────────────────────
  I: {
    polygon: [
      [690,252],[730,248],[762,256],[786,276],[792,304],[788,336],
      [774,356],[750,364],[718,360],[692,344],[670,318],[668,284],
    ],
    centroid: [730, 306],
    primaryAxis: 15,
    grid: { cols: 12, cellW: 10, cellH: 8, gap: 1.5 },
    calibration: {
      plantLabel: [730, 256], roadBearing: 15,
      visualConfidence: 'medium', lastCalibrated: '2026-05-28',
      notes: 'Quadra centro-direita superior, 24 lotes',
    },
  },

  // ─── C — far right, ~35° steep angle ───────────────────────────────────────
  C: {
    polygon: [
      [852,268],[880,276],[904,296],[918,326],[918,364],[910,400],
      [892,420],[866,428],[840,418],[820,398],[812,364],[812,326],
      [820,294],
    ],
    centroid: [866, 348],
    primaryAxis: 35,
    grid: { cols: 11, cellW: 9, cellH: 8, gap: 1.5 },
    calibration: {
      plantLabel: [866, 282], roadBearing: 35,
      visualConfidence: 'medium', lastCalibrated: '2026-05-28',
      notes: 'Quadra extrema direita, ângulo íngreme, 22 lotes',
    },
  },

  // ─── F — right-center, ~33° ────────────────────────────────────────────────
  F: {
    polygon: [
      [828,370],[858,378],[882,402],[894,436],[892,474],[882,506],
      [864,524],[840,530],[816,518],[796,496],[784,458],[784,420],
      [796,392],
    ],
    centroid: [840, 452],
    primaryAxis: 32,
    grid: { cols: 12, cellW: 9, cellH: 8, gap: 1.5 },
    calibration: {
      plantLabel: [840, 382], roadBearing: 32,
      visualConfidence: 'medium', lastCalibrated: '2026-05-28',
      notes: 'Quadra direita-centro, 24 lotes',
    },
  },

  // ─── J — center-right lower, ~10° ──────────────────────────────────────────
  J: {
    polygon: [
      [636,352],[680,346],[720,348],[752,362],[762,384],[762,418],
      [752,438],[720,448],[682,450],[638,440],[614,426],[612,394],
    ],
    centroid: [688, 398],
    primaryAxis: 8,
    grid: { cols: 9, cellW: 11, cellH: 8, gap: 1.5 },
    calibration: {
      plantLabel: [688, 356], roadBearing: 8,
      visualConfidence: 'medium', lastCalibrated: '2026-05-28',
      notes: 'Quadra centro-direita inferior, 18 lotes',
    },
  },

  // ─── L — center-left lower, ~0° ────────────────────────────────────────────
  L: {
    polygon: [
      [520,368],[584,362],[636,360],[664,374],[670,396],[670,434],
      [664,452],[636,460],[584,462],[522,452],[498,436],[496,394],
    ],
    centroid: [584, 412],
    primaryAxis: 0,
    grid: { cols: 13, cellW: 10, cellH: 8, gap: 1.5 },
    calibration: {
      plantLabel: [584, 372], roadBearing: 0,
      visualConfidence: 'medium', lastCalibrated: '2026-05-28',
      notes: 'Quadra centro-esquerda inferior, 25 lotes',
    },
  },

  // ─── O — lower-left, ~0° ──────────────────────────────────────────────────
  O: {
    polygon: [
      [292,498],[356,490],[416,490],[452,504],[462,524],[462,558],
      [456,574],[428,584],[376,586],[320,582],[288,566],[280,544],[282,518],
    ],
    centroid: [376, 540],
    primaryAxis: -3,
    grid: { cols: 12, cellW: 10, cellH: 8, gap: 1.5 },
    calibration: {
      plantLabel: [376, 504], roadBearing: -3,
      visualConfidence: 'low', lastCalibrated: '2026-05-28',
      notes: 'Quadra esquerda-inferior, ~24 lotes',
    },
  },

  // ─── P — far left, ~0° ────────────────────────────────────────────────────
  P: {
    polygon: [
      [210,506],[278,498],[296,504],[300,524],[298,552],[288,574],
      [266,586],[238,586],[216,572],[206,550],[208,524],
    ],
    centroid: [254, 545],
    primaryAxis: 0,
    grid: { cols: 8, cellW: 10, cellH: 8, gap: 1.5 },
    calibration: {
      plantLabel: [254, 508], roadBearing: 0,
      visualConfidence: 'low', lastCalibrated: '2026-05-28',
      notes: 'Quadra extrema esquerda, ~16 lotes',
    },
  },

  // ─── G — lower right, ~44° steep ───────────────────────────────────────────
  G: {
    polygon: [
      [788,516],[816,528],[840,552],[852,588],[848,628],[832,650],
      [808,660],[782,656],[758,640],[744,612],[744,572],[752,540],
    ],
    centroid: [798, 592],
    primaryAxis: 44,
    grid: { cols: 10, cellW: 9, cellH: 8, gap: 1.5 },
    calibration: {
      plantLabel: [798, 534], roadBearing: 44,
      visualConfidence: 'low', lastCalibrated: '2026-05-28',
      notes: 'Quadra inferior-direita, ângulo muito íngreme, 20 lotes',
    },
  },

  // ─── K — lower right ~40° ──────────────────────────────────────────────────
  K: {
    polygon: [
      [758,456],[788,466],[814,488],[830,520],[828,558],[816,584],
      [796,596],[770,594],[748,576],[736,548],[736,508],[746,478],
    ],
    centroid: [784, 530],
    primaryAxis: 40,
    grid: { cols: 10, cellW: 9, cellH: 8, gap: 1.5 },
    calibration: {
      plantLabel: [784, 468], roadBearing: 40,
      visualConfidence: 'low', lastCalibrated: '2026-05-28',
      notes: 'Quadra inferior-direita, 20 lotes',
    },
  },

  // ─── M — lower center, ~-5° ────────────────────────────────────────────────
  M: {
    polygon: [
      [454,456],[520,448],[586,446],[632,452],[654,468],[656,496],
      [656,524],[648,540],[616,548],[558,550],[496,548],[456,536],
      [434,520],[432,492],[436,468],
    ],
    centroid: [544, 498],
    primaryAxis: -5,
    grid: { cols: 14, cellW: 10, cellH: 8, gap: 1.5 },
    calibration: {
      plantLabel: [544, 458], roadBearing: -5,
      visualConfidence: 'medium', lastCalibrated: '2026-05-28',
      notes: 'Quadra centro-inferior larga, 28 lotes',
    },
  },

  // ─── N — lower center-right, ~5° ───────────────────────────────────────────
  N: {
    polygon: [
      [586,512],[644,506],[698,506],[736,518],[748,538],[748,572],
      [740,590],[710,598],[656,600],[596,592],[558,576],[548,556],
      [550,530],
    ],
    centroid: [650, 554],
    primaryAxis: 4,
    grid: { cols: 12, cellW: 10, cellH: 8, gap: 1.5 },
    calibration: {
      plantLabel: [650, 516], roadBearing: 4,
      visualConfidence: 'medium', lastCalibrated: '2026-05-28',
      notes: 'Quadra inferior centro-direita, 24 lotes',
    },
  },
};

// ─── Quadra bounds — used for smart initial fit ───────────────────────────────
const QUADRA_BOUNDS = (() => {
  const allPts = Object.values(QUADRA_DATA).flatMap(g => g.polygon);
  const xs = allPts.map(([x]) => x);
  const ys = allPts.map(([, y]) => y);
  return {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys),
  };
})();

// ─── Lot Shape Resolver — Mode A (Smart Grid) ─────────────────────────────────
// This function is the ONLY place that knows how to compute a lot's shape.
// Swap it with a GIS-polygon resolver (Mode B) without touching the rendering engine.

function gridLotShapeResolver(
  index: number,
  total: number,
  geom: QuadraGeometry,
): LotRenderShape {
  const { cols, cellW, cellH, gap } = geom.grid;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const totalW = cols * cellW + (cols - 1) * gap;
  const rows = Math.ceil(total / cols);
  const totalH = rows * cellH + (rows - 1) * gap;
  const x = col * (cellW + gap) - totalW / 2;
  const y = row * (cellH + gap) - totalH / 2;
  return {
    x, y, w: cellW, h: cellH,
    groupTransform: `translate(${geom.centroid[0]},${geom.centroid[1]}) rotate(${geom.primaryAxis})`,
  };
}

// Mode B resolver (future GIS import): drop-in replacement
// function gisPolygonResolver(index, total, geom): LotRenderShape {
//   const lotData = geom.lots?.[index];
//   if (!lotData) return gridLotShapeResolver(index, total, geom);
//   return { points: lotData.polygon.map(([x,y]) => `${x},${y}`).join(' ') };
// }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function polygonToString(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x},${y}`).join(' ');
}

function centroidOf(pts: [number, number][]): [number, number] {
  const x = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const y = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return [x, y];
}

function elasticClamp(val: number, min: number, max: number, friction = 0.22): number {
  if (val < min) return min + (val - min) * friction;
  if (val > max) return max + (val - max) * friction;
  return val;
}

function normalizeWheelDelta(e: WheelEvent): number {
  if (e.deltaMode === 1) return e.deltaY * 28;
  if (e.deltaMode === 2) return e.deltaY * 500;
  return e.deltaY;
}

// ─── SVG Defs ─────────────────────────────────────────────────────────────────

function SVGDefs() {
  return (
    <defs>
      {/* Glow for selected quadra */}
      <filter id="ab-quadra-glow" x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="glow" />
        <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      {/* Soft drop shadow for lot cells */}
      <filter id="ab-lot-highlight" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      {/* Vignette radial gradient for depth */}
      <radialGradient id="ab-vignette" cx="50%" cy="50%" r="70%" gradientUnits="userSpaceOnUse" fx="50%" fy="50%">
        <stop offset="40%" stopColor="transparent" stopOpacity="0" />
        <stop offset="100%" stopColor="#050D18" stopOpacity="0.55" />
      </radialGradient>
      {/* Stroke gradient for premium quadra borders */}
      <linearGradient id="ab-road-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
      </linearGradient>
    </defs>
  );
}

// ─── FloatingTooltip ──────────────────────────────────────────────────────────

const FloatingTooltip = memo(function FloatingTooltip({
  lot, svgX, svgY, scale,
}: {
  lot: Lot; svgX: number; svgY: number; scale: number;
}) {
  const st = getStatus(lot.status);
  const pricePerM2 = lot.price && lot.area_m2 > 0 ? Math.round(lot.price / lot.area_m2) : null;
  // SVG foreignObject for DOM-in-SVG tooltip
  const w = 170; const h = 100;
  const x = Math.min(Math.max(svgX - w / 2, 4), SVG_W - w - 4);
  const y = svgY - h - 10;

  return (
    <foreignObject x={x} y={Math.max(y, 4)} width={w} height={h} style={{ pointerEvents: 'none', overflow: 'visible' }}>
      <div
        style={{
          background: 'rgba(7,14,24,0.94)',
          backdropFilter: 'blur(16px)',
          borderRadius: 10,
          border: '1px solid rgba(200,164,74,0.22)',
          borderLeft: '3px solid #C8A44A',
          padding: '9px 12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: 'rgba(200,164,74,0.85)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
          Quadra {lot.quadra} · Lote {lot.lot_number}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 800, color: '#F0EDE8', fontFamily: "'JetBrains Mono', monospace" }}>
          {fmtM2(lot.area_m2)}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.stroke, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: st.textColor }}>{st.label}</span>
        </div>
        {lot.price && (
          <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 700, color: '#C8A44A', fontFamily: "'JetBrains Mono', monospace" }}>
            {fmtBRL(lot.price)}{pricePerM2 ? ` · ${fmtBRL(pricePerM2)}/m²` : ''}
          </p>
        )}
        <p style={{ margin: '5px 0 0', fontSize: 9, color: 'rgba(240,237,232,0.3)', fontWeight: 600 }}>
          Toque para detalhes →
        </p>
      </div>
    </foreignObject>
  );
});

// ─── LotCell ──────────────────────────────────────────────────────────────────

interface LotCellProps {
  lot: Lot;
  index: number;
  total: number;
  geom: QuadraGeometry;
  filterKey: FilterKey;
  isSelected: boolean;
  onHover: (lot: Lot | null, x: number, y: number) => void;
  onClick: (lot: Lot) => void;
}

const LotCell = memo(function LotCell({
  lot, index, total, geom, filterKey, isSelected, onHover, onClick,
}: LotCellProps) {
  const st = getStatus(lot.status);
  const shape = gridLotShapeResolver(index, total, geom);
  const isFiltered = filterKey !== 'ALL' && lot.status !== filterKey;
  const opacity = isFiltered ? 0.07 : isSelected ? 1 : 0.85;
  const pointerEvents: 'none' | 'all' = isFiltered ? 'none' : 'all';

  const cx = geom.centroid[0] + (shape.x ?? 0) + (shape.w ?? 0) / 2;
  const cy = geom.centroid[1] + (shape.y ?? 0) + (shape.h ?? 0) / 2;

  return (
    <g
      transform={shape.groupTransform}
      opacity={opacity}
      style={{ pointerEvents, cursor: 'pointer', transition: 'opacity 0.25s ease' }}
      onMouseEnter={() => !isFiltered && onHover(lot, cx, cy)}
      onMouseLeave={() => onHover(null, 0, 0)}
      onClick={e => { e.stopPropagation(); !isFiltered && onClick(lot); }}
    >
      <rect
        x={shape.x} y={shape.y}
        width={shape.w} height={shape.h}
        rx={2}
        fill={isSelected ? st.stroke : st.fill}
        stroke={st.stroke}
        strokeWidth={isSelected ? 1.5 : 0.8}
        style={{ filter: isSelected ? 'url(#ab-lot-highlight)' : undefined }}
      />
      {(shape.w ?? 0) >= 9 && (
        <text
          x={(shape.x ?? 0) + (shape.w ?? 0) / 2}
          y={(shape.y ?? 0) + (shape.h ?? 0) / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={isSelected ? '#0A1A2E' : '#fff'}
          fontSize={5.5}
          fontWeight="800"
          fontFamily="'JetBrains Mono', monospace"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {lot.lot_number}
        </text>
      )}
    </g>
  );
});

// ─── LotGrid ──────────────────────────────────────────────────────────────────

const LotGrid = memo(function LotGrid({
  quadra, lots, geom, filterKey, selectedLotId, onHoverLot, onClickLot,
}: {
  quadra: string;
  lots: Lot[];
  geom: QuadraGeometry;
  filterKey: FilterKey;
  selectedLotId: string | null;
  onHoverLot: (lot: Lot | null, x: number, y: number) => void;
  onClickLot: (lot: Lot) => void;
}) {
  const sorted = useMemo(() =>
    [...lots].sort((a, b) => a.lot_number - b.lot_number), [lots]);

  return (
    <g data-interactive="true">
      {sorted.map((lot, i) => (
        <LotCell
          key={lot.id}
          lot={lot}
          index={i}
          total={sorted.length}
          geom={geom}
          filterKey={filterKey}
          isSelected={lot.id === selectedLotId}
          onHover={onHoverLot}
          onClick={onClickLot}
        />
      ))}
    </g>
  );
});

// ─── QuadraTile ───────────────────────────────────────────────────────────────

interface QuadraTileProps {
  quadra: string;
  geom: QuadraGeometry;
  lots: Lot[];
  filterKey: FilterKey;
  isSelected: boolean;
  onClick: (q: string) => void;
}

const QuadraTile = memo(function QuadraTile({
  quadra, geom, lots, filterKey, isSelected, onClick,
}: QuadraTileProps) {
  const [hovered, setHovered] = useState(false);

  const available = useMemo(() =>
    lots.filter(l => l.status === 'DISPONIVEL').length, [lots]);

  const dominantStatus = useMemo((): StatusKey => {
    if (available > 0) return 'DISPONIVEL';
    const counts: Partial<Record<StatusKey, number>> = {};
    for (const l of lots) {
      const k = l.status as StatusKey;
      counts[k] = (counts[k] ?? 0) + 1;
    }
    if (counts.NEGOCIACAO) return 'NEGOCIACAO';
    if (counts.PROPRIETARIO) return 'PROPRIETARIO';
    return 'VENDIDO';
  }, [lots, available]);

  const displayCount = filterKey === 'ALL'
    ? available
    : lots.filter(l => l.status === filterKey).length;

  const st = STATUS[dominantStatus];
  const pts = polygonToString(geom.polygon);
  const [cx, cy] = geom.centroid;

  const fillOpacity = isSelected ? 0.52 : hovered ? 0.42 : 0.22;
  const strokeWidth = isSelected ? 2 : hovered ? 1.6 : 1.1;
  const strokeOpacity = isSelected ? 1 : hovered ? 0.92 : 0.58;

  return (
    <g
      data-interactive="true"
      style={{ cursor: 'pointer' }}
      onClick={e => { e.stopPropagation(); onClick(quadra); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Selection glow ring — behind polygon */}
      {isSelected && (
        <polygon
          points={pts}
          fill="none"
          stroke={st.stroke}
          strokeWidth={14}
          strokeOpacity={0.14}
          style={{ filter: 'url(#ab-quadra-glow)' }}
        />
      )}

      {/* Quadra polygon — base fill */}
      <polygon
        points={pts}
        fill={st.fill.replace(/[\d.]+\)$/, `${fillOpacity})`)}
        stroke="none"
      />
      {/* Quadra polygon — premium border */}
      <polygon
        points={pts}
        fill="none"
        stroke={isSelected ? st.stroke : (hovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.32)')}
        strokeWidth={strokeWidth}
        strokeOpacity={strokeOpacity}
        style={{
          transition: 'stroke-opacity 0.18s ease, stroke-width 0.18s ease',
          filter: (isSelected || hovered) ? 'url(#ab-quadra-glow)' : undefined,
        }}
      />
      {/* Inner white highlight line — cartographic depth */}
      {!isSelected && (
        <polygon
          points={pts}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={0.6}
        />
      )}

      {/* Quadra letter — always horizontal */}
      <text
        x={cx} y={cy - 5}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#F0EDE8"
        fontSize={13}
        fontWeight="800"
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none', userSelect: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
      >
        {quadra}
      </text>

      {/* Lot count badge */}
      {displayCount > 0 && (
        <g transform={`translate(${cx + 10}, ${cy - 16})`}>
          <circle r={9} fill={dominantStatus === 'DISPONIVEL' ? '#16A34A' : st.stroke} opacity={0.92}
            style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))' }} />
          <text
            textAnchor="middle" dominantBaseline="central"
            fill="#fff" fontSize={7} fontWeight="900"
            fontFamily="'JetBrains Mono', monospace"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {displayCount > 99 ? '99+' : displayCount}
          </text>
        </g>
      )}

      {/* Selection pulse ring */}
      {isSelected && (
        <circle cx={cx} cy={cy} r={20} fill="none" stroke={st.stroke} strokeWidth={1} strokeOpacity={0.5}>
          <animate attributeName="r" from="18" to="34" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
});

// ─── Lot Detail Panel content ─────────────────────────────────────────────────

function LotDetailContent({
  lot, developmentName, whatsappPhone, onBack, onClose,
}: {
  lot: Lot; developmentName: string; whatsappPhone: string;
  onBack: () => void; onClose: () => void;
}) {
  const st = getStatus(lot.status);
  const isAvail = lot.status === 'DISPONIVEL';
  const pricePerM2 = lot.price && lot.area_m2 > 0 ? Math.round(lot.price / lot.area_m2) : null;

  const waInterest = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    `Olá! Tenho interesse no ${developmentName}, Quadra ${lot.quadra}, Lote ${lot.lot_number} (${Math.round(lot.area_m2)} m²${lot.price ? ` — ${fmtBRL(lot.price)}` : ''}). Gostaria de saber mais.`
  )}`;
  const waVisit = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    `Olá! Gostaria de agendar uma visita ao ${developmentName} — Quadra ${lot.quadra}, Lote ${lot.lot_number}.`
  )}`;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <button
            onClick={onBack}
            style={{ background: 'rgba(200,164,74,0.1)', border: '1px solid rgba(200,164,74,0.18)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#C8A44A', marginRight: 10, flexShrink: 0 }}
          >
            <ChevronLeft size={15} />
          </button>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#C8A44A', letterSpacing: '0.22em', textTransform: 'uppercase', flex: 1 }}>
            LOTE SELECIONADO
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 0 }}>
            <X size={14} />
          </button>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: st.badgeBg, color: st.textColor, letterSpacing: '0.1em', textTransform: 'uppercase', border: `1px solid ${st.stroke}44` }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.stroke }} />
          {st.label}
        </span>
        <p style={{ fontSize: 26, fontWeight: 800, color: '#F0EDE8', margin: '8px 0 0', lineHeight: 1.1, fontFamily: "'JetBrains Mono', monospace" }}>
          Lote {lot.lot_number}
        </p>
        <p style={{ fontSize: 12, color: 'rgba(240,237,232,0.38)', margin: '4px 0 0' }}>
          Quadra {lot.quadra} · {developmentName}
        </p>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <Ruler size={11} style={{ color: '#C8A44A' }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(240,237,232,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Área</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#F0EDE8', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
              {fmtM2(lot.area_m2)}
            </p>
          </div>
          <div style={{ background: isAvail ? 'rgba(22,163,74,0.1)' : 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 12px', border: isAvail ? '1px solid rgba(22,163,74,0.22)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <DollarSign size={11} style={{ color: '#C8A44A' }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(240,237,232,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Valor</span>
            </div>
            {lot.price ? (
              <p style={{ fontSize: lot.price >= 100000 ? 14 : 18, fontWeight: 800, color: isAvail ? '#34D399' : '#F0EDE8', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                {fmtBRL(lot.price)}
              </p>
            ) : (
              <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.35)', margin: 0 }}>Consultar</p>
            )}
          </div>
        </div>

        {pricePerM2 && (
          <div style={{ background: 'rgba(200,164,74,0.06)', border: '1px solid rgba(200,164,74,0.14)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.38)', fontWeight: 600 }}>Preço / m²</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#C8A44A', fontFamily: "'JetBrains Mono', monospace" }}>{fmtBRL(pricePerM2)}/m²</span>
          </div>
        )}

        {lot.special_type === 'ESQUINA' && (
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: 'rgba(59,130,246,0.15)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Lote de Esquina
            </span>
          </div>
        )}

        {lot.notes && (
          <p style={{ fontSize: 11, color: 'rgba(240,237,232,0.38)', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '9px 12px', margin: '0 0 12px', lineHeight: 1.55 }}>
            {lot.notes}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isAvail && (
            <a href={waInterest} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 12, background: '#C8A44A', color: '#0A1A2E', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}
            >
              <MessageCircle size={14} />
              Tenho Interesse
            </a>
          )}
          <a href={waVisit} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'rgba(240,237,232,0.75)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <Calendar size={13} />
            Agendar Visita
          </a>
          <button
            onClick={() => {
              const url = `${window.location.origin}${window.location.pathname}?quadra=${lot.quadra}&lote=${lot.lot_number}`;
              navigator.share?.({ title: `Lote ${lot.lot_number} — Quadra ${lot.quadra}`, url }) ??
              navigator.clipboard?.writeText(url);
            }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 36, borderRadius: 10, background: 'transparent', color: 'rgba(240,237,232,0.25)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}
          >
            <Share2 size={11} />
            Compartilhar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Quadra Panel content ─────────────────────────────────────────────────────

function QuadraPanelContent({
  quadra, lots, developmentName, whatsappPhone, filterKey, onClose, onLotSelect,
}: {
  quadra: string; lots: Lot[]; developmentName: string; whatsappPhone: string;
  filterKey: FilterKey; onClose: () => void; onLotSelect: (lot: Lot) => void;
}) {
  const counts = useMemo(() => {
    const c: Partial<Record<StatusKey, number>> = {};
    for (const l of lots) { const k = l.status as StatusKey; c[k] = (c[k] ?? 0) + 1; }
    return c;
  }, [lots]);

  const visible = useMemo(() =>
    (filterKey === 'ALL' ? lots : lots.filter(l => l.status === filterKey))
      .sort((a, b) => a.lot_number - b.lot_number),
    [lots, filterKey]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 8, fontWeight: 700, color: '#C8A44A', letterSpacing: '0.25em', textTransform: 'uppercase', margin: '0 0 4px' }}>QUADRA</p>
            <p style={{ fontSize: 34, fontWeight: 800, color: '#F0EDE8', margin: 0, lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{quadra}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(240,237,232,0.35)', marginTop: 2 }}
          >
            <X size={13} />
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {(Object.entries(counts) as [StatusKey, number][]).map(([st, cnt]) => {
            const cfg = STATUS[st];
            return (
              <span key={st} style={{ fontSize: 8, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: cfg.badgeBg, color: cfg.textColor, border: `1px solid ${cfg.stroke}44`, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                {cnt} {cfg.label}
              </span>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        <p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(240,237,232,0.22)', textTransform: 'uppercase', letterSpacing: '0.18em', margin: '0 0 12px' }}>
          {visible.length} lote{visible.length !== 1 ? 's' : ''}
          {filterKey !== 'ALL' ? ' · filtro ativo' : ''}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {visible.map(lot => {
            const st = getStatus(lot.status);
            return (
              <button
                key={lot.id}
                onClick={() => onLotSelect(lot)}
                style={{ minWidth: 46, height: 46, borderRadius: 9, flexShrink: 0, background: st.badgeBg, border: `1.5px solid ${st.stroke}55`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '0 6px', position: 'relative' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = st.stroke; (e.currentTarget as HTMLElement).style.background = st.fill; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${st.stroke}55`; (e.currentTarget as HTMLElement).style.background = st.badgeBg; }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: st.textColor, fontFamily: "'JetBrains Mono', monospace" }}>
                  {lot.lot_number}
                </span>
                {lot.special_type === 'ESQUINA' && (
                  <div style={{ position: 'absolute', top: 3, right: 3, width: 5, height: 5, borderRadius: 1.5, background: '#60A5FA' }} />
                )}
              </button>
            );
          })}
          {visible.length === 0 && (
            <p style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(240,237,232,0.2)', fontSize: 12, margin: 0, width: '100%' }}>
              Nenhum lote com este filtro
            </p>
          )}
        </div>
      </div>

      <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <a
          href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Tenho interesse em lotes da Quadra ${quadra} no ${developmentName}. Quais estão disponíveis?`)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 42, borderRadius: 10, background: 'rgba(200,164,74,0.09)', color: '#C8A44A', fontSize: 10, fontWeight: 700, textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid rgba(200,164,74,0.22)' }}
        >
          <MessageCircle size={13} />
          Falar sobre a Quadra
        </a>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface AltoBellevuePlanViewProps {
  lots: Lot[];
  developmentId: string;
  developmentName: string;
  whatsappPhone?: string;
  onLotClick?: (lot: Lot) => void;
}

export default function AltoBellevuePlanView({
  lots,
  developmentName,
  whatsappPhone = '5581997230455',
  onLotClick,
}: AltoBellevuePlanViewProps) {
  // ── Transform state — mutated in RAF loop, NOT via setState ────────────────
  const transform   = useRef({ scale: 1, tx: 0, ty: 0 });
  const velocity    = useRef({ x: 0, y: 0 });
  const raf         = useRef<number | null>(null);
  const isDragging  = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0, t: 0 });
  const lastTouches = useRef<{ x: number; y: number; dist: number } | null>(null);
  const lastTapTime = useRef(0);

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef   = useRef<HTMLDivElement>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [selectedQuadra, setSelectedQuadra] = useState<string | null>(null);
  const [selectedLot,    setSelectedLot]    = useState<Lot | null>(null);
  const [filterKey,      setFilterKey]      = useState<FilterKey>('ALL');
  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [displayScale,   setDisplayScale]   = useState(100);
  const [sheetState,     setSheetState]     = useState<SheetState>('hidden');
  const [imageLoaded,    setImageLoaded]    = useState(false);
  const [imageError,     setImageError]     = useState(false);

  // Tooltip — deferred to avoid flicker during pan
  const [tooltipLot,    setTooltipLot]     = useState<Lot | null>(null);
  const [tooltipPos,    setTooltipPos]     = useState({ x: 0, y: 0 });
  const tooltipTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived data ───────────────────────────────────────────────────────────
  const quadraMap = useMemo(() => {
    const m = new Map<string, Lot[]>();
    for (const lot of lots) {
      if (!m.has(lot.quadra)) m.set(lot.quadra, []);
      m.get(lot.quadra)!.push(lot);
    }
    return m;
  }, [lots]);

  const stats = useMemo(() => {
    const available   = lots.filter(l => l.status === 'DISPONIVEL').length;
    const sold        = lots.filter(l => l.status === 'VENDIDO').length;
    const negotiation = lots.filter(l => l.status === 'NEGOCIACAO').length;
    const prices      = lots.filter(l => l.price && l.status === 'DISPONIVEL').map(l => l.price!);
    return {
      total: lots.length, available, sold, negotiation,
      priceMin: prices.length ? Math.min(...prices) : 0,
      priceMax: prices.length ? Math.max(...prices) : 0,
    };
  }, [lots]);

  // ── Transform helpers ──────────────────────────────────────────────────────
  const applyTransform = useCallback(() => {
    if (!contentRef.current) return;
    const { scale, tx, ty } = transform.current;
    contentRef.current.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
  }, []);

  const clampScale = (s: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));

  const zoomAt = useCallback((factor: number, screenX: number, screenY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx   = screenX - rect.left - rect.width  / 2;
    const cy   = screenY - rect.top  - rect.height / 2;
    const prev = transform.current.scale;
    const next = clampScale(prev * factor);
    transform.current.scale = next;
    transform.current.tx    = cx - (next / prev) * (cx - transform.current.tx);
    transform.current.ty    = cy - (next / prev) * (cy - transform.current.ty);
    applyTransform();
    setDisplayScale(Math.round(next * 100));
  }, [applyTransform]);

  const zoomIn  = useCallback(() => { const r = containerRef.current?.getBoundingClientRect(); if (r) zoomAt(1.3, r.left + r.width/2, r.top + r.height/2); }, [zoomAt]);
  const zoomOut = useCallback(() => { const r = containerRef.current?.getBoundingClientRect(); if (r) zoomAt(1/1.3, r.left + r.width/2, r.top + r.height/2); }, [zoomAt]);
  const resetView = useCallback(() => {
    const el = containerRef.current;
    velocity.current = { x: 0, y: 0 };
    if (el) {
      const cW = el.offsetWidth, cH = el.offsetHeight;
      if (cW && cH) {
        const { minX, maxX, minY, maxY } = QUADRA_BOUNDS;
        const PAD = 1.20;
        const bboxW = (maxX - minX) * PAD, bboxH = (maxY - minY) * PAD;
        const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
        const s0 = Math.min(cW / SVG_W, cH / SVG_H);
        const sc = clampScale(Math.min(cW * 0.90 / (bboxW * s0), cH * 0.90 / (bboxH * s0)));
        transform.current = { scale: sc, tx: -((cx - SVG_W/2)*s0)*sc, ty: -((cy - SVG_H/2)*s0)*sc };
        applyTransform();
        setDisplayScale(Math.round(sc * 100));
        return;
      }
    }
    transform.current = { scale: 1, tx: 0, ty: 0 };
    applyTransform();
    setDisplayScale(100);
  }, [applyTransform]);

  // ── Inertia ────────────────────────────────────────────────────────────────
  const stopInertia = useCallback(() => {
    if (raf.current !== null) { cancelAnimationFrame(raf.current); raf.current = null; }
  }, []);

  const startInertia = useCallback(() => {
    stopInertia();
    const tick = () => {
      velocity.current.x *= 0.90;
      velocity.current.y *= 0.90;
      if (Math.abs(velocity.current.x) < 0.25 && Math.abs(velocity.current.y) < 0.25) {
        raf.current = null;
        return;
      }
      // Elastic resistance at content edges
      const { scale, tx, ty } = transform.current;
      const cW = containerRef.current?.offsetWidth  ?? 800;
      const cH = containerRef.current?.offsetHeight ?? 600;
      const contentW = SVG_W * scale;
      const contentH = SVG_H * scale;
      const maxTx =  Math.max(0, (contentW - cW) / 2 + cW * 0.2);
      const maxTy =  Math.max(0, (contentH - cH) / 2 + cH * 0.2);

      transform.current.tx = elasticClamp(tx + velocity.current.x, -maxTx, maxTx);
      transform.current.ty = elasticClamp(ty + velocity.current.y, -maxTy, maxTy);
      applyTransform();
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [applyTransform, stopInertia]);

  // ── Mouse handlers ─────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    stopInertia();
    const delta = normalizeWheelDelta(e);
    zoomAt(delta > 0 ? 0.88 : 1.14, e.clientX, e.clientY);
  }, [zoomAt, stopInertia]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-interactive]')) return;
    stopInertia();
    isDragging.current  = true;
    lastPointer.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    velocity.current    = { x: 0, y: 0 };
    // Clear tooltip on drag start
    tooltipTimer.current && clearTimeout(tooltipTimer.current);
    setTooltipLot(null);
  }, [stopInertia]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const now = Date.now();
    const dt  = Math.max(1, now - lastPointer.current.t);
    const dx  = e.clientX - lastPointer.current.x;
    const dy  = e.clientY - lastPointer.current.y;
    velocity.current     = { x: dx / dt * 16, y: dy / dt * 16 };
    transform.current.tx += dx;
    transform.current.ty += dy;
    lastPointer.current  = { x: e.clientX, y: e.clientY, t: now };
    applyTransform();
  }, [applyTransform]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    startInertia();
  }, [startInertia]);

  // ── Touch handlers ─────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    stopInertia();
    if (e.touches.length === 1) {
      const t0  = e.touches[0];
      const now = Date.now();
      if (now - lastTapTime.current < 280) {
        lastTapTime.current = 0;
        zoomAt(2.2, t0.clientX, t0.clientY);
        return;
      }
      lastTapTime.current  = now;
      lastPointer.current  = { x: t0.clientX, y: t0.clientY, t: now };
      velocity.current     = { x: 0, y: 0 };
      lastTouches.current  = null;
    } else if (e.touches.length === 2) {
      const t0 = e.touches[0], t1 = e.touches[1];
      const dx = t0.clientX - t1.clientX, dy = t0.clientY - t1.clientY;
      lastTouches.current = {
        x: (t0.clientX + t1.clientX) / 2,
        y: (t0.clientY + t1.clientY) / 2,
        dist: Math.sqrt(dx*dx + dy*dy),
      };
    }
  }, [stopInertia, zoomAt]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && !lastTouches.current) {
      const t0  = e.touches[0];
      const now = Date.now();
      const dt  = Math.max(1, now - lastPointer.current.t);
      const dx  = t0.clientX - lastPointer.current.x;
      const dy  = t0.clientY - lastPointer.current.y;
      velocity.current     = { x: dx / dt * 16, y: dy / dt * 16 };
      transform.current.tx += dx;
      transform.current.ty += dy;
      lastPointer.current  = { x: t0.clientX, y: t0.clientY, t: now };
      applyTransform();
    } else if (e.touches.length === 2 && lastTouches.current) {
      const t0   = e.touches[0], t1 = e.touches[1];
      const dx   = t0.clientX - t1.clientX, dy = t0.clientY - t1.clientY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const mid  = { x: (t0.clientX + t1.clientX)/2, y: (t0.clientY + t1.clientY)/2 };
      const ratio = Math.min(Math.max(dist / lastTouches.current.dist, 0.8), 1.25);
      transform.current.tx += mid.x - lastTouches.current.x;
      transform.current.ty += mid.y - lastTouches.current.y;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const cx   = mid.x - rect.left - rect.width/2;
        const cy   = mid.y - rect.top  - rect.height/2;
        const prev = transform.current.scale;
        const next = clampScale(prev * ratio);
        transform.current.scale = next;
        transform.current.tx    = cx - (next/prev) * (cx - transform.current.tx);
        transform.current.ty    = cy - (next/prev) * (cy - transform.current.ty);
      }
      lastTouches.current = { x: mid.x, y: mid.y, dist };
      applyTransform();
    }
  }, [applyTransform]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    lastTouches.current = null;
    if (e.touches.length === 0) startInertia();
    setTimeout(() => setDisplayScale(Math.round(transform.current.scale * 100)), 60);
  }, [startInertia]);

  // ── Fullscreen ─────────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && wrapperRef.current) {
      wrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  useLayoutEffect(() => { applyTransform(); }, [applyTransform]);

  // ── Smart initial fit — zoom/pan to show only the subdivision area ─────────
  const didInitFit = useRef(false);
  useEffect(() => {
    if (didInitFit.current) return;
    const el = containerRef.current;
    if (!el) return;

    const doFit = () => {
      const cW = el.offsetWidth;
      const cH = el.offsetHeight;
      if (!cW || !cH) return false;
      didInitFit.current = true;

      const { minX, maxX, minY, maxY } = QUADRA_BOUNDS;
      const PAD = 1.20;
      const bboxW = (maxX - minX) * PAD;
      const bboxH = (maxY - minY) * PAD;
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const s0 = Math.min(cW / SVG_W, cH / SVG_H);
      const initScale = clampScale(Math.min(
        (cW * 0.90) / (bboxW * s0),
        (cH * 0.90) / (bboxH * s0),
      ));
      const tx = -((cx - SVG_W / 2) * s0) * initScale;
      const ty = -((cy - SVG_H / 2) * s0) * initScale;
      transform.current = { scale: initScale, tx, ty };
      applyTransform();
      setDisplayScale(Math.round(initScale * 100));
      return true;
    };

    if (!doFit()) {
      const id = requestAnimationFrame(() => { doFit(); });
      return () => cancelAnimationFrame(id);
    }
  }, [applyTransform]);

  // Preload image
  useEffect(() => {
    const img = new Image();
    img.onload  = () => setImageLoaded(true);
    img.onerror = () => setImageError(true);
    img.src     = IMAGE_URL;
  }, []);

  // ── Quadra / Lot interaction ───────────────────────────────────────────────
  const handleQuadraClick = useCallback((quadra: string) => {
    setSelectedQuadra(prev => {
      const next = prev === quadra ? null : quadra;
      setSelectedLot(null);
      setSheetState(next ? 'half' : 'hidden');
      return next;
    });
  }, []);

  const handleLotClick = useCallback((lot: Lot) => {
    setSelectedLot(lot);
    setSheetState('full');
    onLotClick?.(lot);
    tooltipTimer.current && clearTimeout(tooltipTimer.current);
    setTooltipLot(null);
  }, [onLotClick]);

  const handleHoverLot = useCallback((lot: Lot | null, x: number, y: number) => {
    tooltipTimer.current && clearTimeout(tooltipTimer.current);
    if (!lot) { setTooltipLot(null); return; }
    tooltipTimer.current = setTimeout(() => {
      setTooltipLot(lot);
      setTooltipPos({ x, y });
    }, 90);
  }, []);

  const closePanel = useCallback(() => {
    setSelectedQuadra(null);
    setSelectedLot(null);
    setSheetState('hidden');
  }, []);

  // ── Layout ─────────────────────────────────────────────────────────────────
  const containerH = isFullscreen ? '100svh' : 'clamp(560px, 72vw, 820px)';
  const showLots = displayScale >= LOT_ZOOM_THRESHOLD || selectedQuadra !== null;

  const filterRows: { key: FilterKey; label: string; value: number; color: string }[] = [
    { key: 'ALL',        label: 'Todos',       value: stats.total,        color: '#C8A44A' },
    { key: 'DISPONIVEL', label: 'Disponíveis', value: stats.available,    color: '#34D399' },
    { key: 'VENDIDO',    label: 'Vendidos',    value: stats.sold,         color: '#94A3B8' },
    { key: 'NEGOCIACAO', label: 'Negociação',  value: stats.negotiation,  color: '#FBBF24' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        background: '#08121D',
        borderRadius: isFullscreen ? 0 : 20,
        overflow: 'hidden',
        border: isFullscreen ? 'none' : '1px solid rgba(200,164,74,0.12)',
        boxShadow: isFullscreen ? 'none' : '0 20px 80px rgba(0,0,0,0.55)',
        height: containerH,
        display: 'flex',
      }}
    >
      {/* ── LEFT SIDEBAR (desktop) ────────────────────────────────────────── */}
      <div
        className="hidden md:flex flex-col"
        style={{ width: 224, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(7,14,24,0.97)', zIndex: 5 }}
      >
        {/* Brand */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#C8A44A', letterSpacing: '0.25em', textTransform: 'uppercase', margin: 0 }}>
            Alto Bellevue
          </p>
          <p style={{ fontSize: 11, color: 'rgba(240,237,232,0.35)', margin: '4px 0 0' }}>
            {stats.available} de {stats.total} disponíveis
          </p>
        </div>

        {/* Filters */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 8, fontWeight: 700, color: '#C8A44A', textTransform: 'uppercase', letterSpacing: '0.28em', margin: '0 0 12px' }}>
            <Filter size={9} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            FILTRAR
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filterRows.map(row => (
              <button
                key={row.key}
                data-interactive="true"
                onClick={() => setFilterKey(row.key)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                  border: `1px solid ${filterKey === row.key ? row.color + '44' : 'rgba(255,255,255,0.06)'}`,
                  background: filterKey === row.key ? `${row.color}12` : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: row.color, flexShrink: 0, boxShadow: filterKey === row.key ? `0 0 7px ${row.color}` : 'none' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: filterKey === row.key ? '#F0EDE8' : 'rgba(240,237,232,0.45)', fontFamily: "'Outfit', sans-serif" }}>{row.label}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: filterKey === row.key ? row.color : 'rgba(240,237,232,0.25)', fontFamily: "'JetBrains Mono', monospace" }}>{row.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Price range */}
        {stats.priceMin > 0 && (
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(240,237,232,0.22)', textTransform: 'uppercase', letterSpacing: '0.22em', margin: '0 0 10px' }}>FAIXA DE PREÇO</p>
            <p style={{ fontSize: 9, color: 'rgba(240,237,232,0.28)', margin: 0 }}>A partir de</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#C8A44A', margin: '2px 0 8px', fontFamily: "'JetBrains Mono', monospace" }}>{fmtBRL(stats.priceMin)}</p>
            <p style={{ fontSize: 9, color: 'rgba(240,237,232,0.28)', margin: 0 }}>Até</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#C8A44A', margin: '2px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>{fmtBRL(stats.priceMax)}</p>
          </div>
        )}

        {/* Legend */}
        <div style={{ padding: '14px 18px', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(240,237,232,0.22)', textTransform: 'uppercase', letterSpacing: '0.22em', margin: '0 0 10px' }}>LEGENDA</p>
          {(['DISPONIVEL', 'NEGOCIACAO', 'VENDIDO', 'PROPRIETARIO'] as StatusKey[]).map(k => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <div style={{ width: 14, height: 8, borderRadius: 2.5, background: STATUS[k].stroke, opacity: 0.75, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: 'rgba(240,237,232,0.4)', fontFamily: "'Outfit', sans-serif" }}>{STATUS[k].label}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: '9px 11px', background: 'rgba(200,164,74,0.05)', border: '1px solid rgba(200,164,74,0.1)', borderRadius: 8 }}>
            <p style={{ fontSize: 9, color: 'rgba(240,237,232,0.28)', margin: 0, lineHeight: 1.55 }}>
              Toque numa quadra para explorar · Pinça para zoom
            </p>
          </div>
        </div>
      </div>

      {/* ── MAP VIEWPORT ─────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          cursor: isDragging.current ? 'grabbing' : 'grab',
          background: '#0A1620', touchAction: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── TRANSFORM LAYER ───────────────────────────────────────────── */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            ref={contentRef}
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', willChange: 'transform', transformOrigin: 'center center' }}
          >
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', display: 'block', imageRendering: 'auto' }}
              preserveAspectRatio="xMidYMid meet"
            >
              <SVGDefs />

              {/* Layer 1: plant image — full resolution, no opacity reduction */}
              {!imageError ? (
                <image
                  href={IMAGE_URL}
                  x="0" y="0"
                  width={SVG_W} height={SVG_H}
                  preserveAspectRatio="xMidYMid meet"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  style={{ imageRendering: 'auto' }}
                />
              ) : (
                <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="#0D1F30" />
              )}

              {/* Layer 1b: vignette depth overlay */}
              <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#ab-vignette)" style={{ pointerEvents: 'none' }} />

              {/* Layer 2: quadra polygons */}
              {Object.entries(QUADRA_DATA).map(([quadra, geom]) => {
                const qLots = quadraMap.get(quadra);
                if (!qLots) return null;
                return (
                  <QuadraTile
                    key={quadra}
                    quadra={quadra}
                    geom={geom}
                    lots={qLots}
                    filterKey={filterKey}
                    isSelected={selectedQuadra === quadra}
                    onClick={handleQuadraClick}
                  />
                );
              })}

              {/* Layer 3: individual lot grid — conditional on zoom or selection */}
              {showLots && selectedQuadra && quadraMap.has(selectedQuadra) && QUADRA_DATA[selectedQuadra] && (
                <LotGrid
                  quadra={selectedQuadra}
                  lots={quadraMap.get(selectedQuadra)!}
                  geom={QUADRA_DATA[selectedQuadra]}
                  filterKey={filterKey}
                  selectedLotId={selectedLot?.id ?? null}
                  onHoverLot={handleHoverLot}
                  onClickLot={handleLotClick}
                />
              )}

              {/* Layer 4: tooltip */}
              {tooltipLot && (
                <FloatingTooltip
                  lot={tooltipLot}
                  svgX={tooltipPos.x}
                  svgY={tooltipPos.y}
                  scale={transform.current.scale}
                />
              )}

              {/* Layer 5: watermark */}
              <image
                href="/images/logos/mano-imoveis.png"
                x={SVG_W - 116} y={SVG_H - 34}
                width={108} height={28}
                preserveAspectRatio="xMaxYMax meet"
                opacity="0.45"
                style={{ pointerEvents: 'none' }}
              />
            </svg>
          </div>
        </div>

        {/* ── HINT ───────────────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 12, pointerEvents: 'none' }}>
          <span style={{ fontSize: 9.5, fontWeight: 600, color: 'rgba(240,237,232,0.42)', background: 'rgba(5,12,20,0.82)', padding: '4px 14px', borderRadius: 99, whiteSpace: 'nowrap', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.05)', display: 'block', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Toque numa quadra para explorar
          </span>
        </div>

        {/* ── ZOOM CONTROLS ─────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', bottom: 18, left: 16, display: 'flex', flexDirection: 'column', gap: 5, zIndex: 12 }}>
          {([
            { action: zoomIn,    icon: <ZoomIn size={14} />,    title: 'Aproximar' },
            { action: zoomOut,   icon: <ZoomOut size={14} />,   title: 'Afastar'   },
            { action: resetView, icon: <RotateCcw size={12} />, title: 'Resetar'   },
          ]).map((b, i) => (
            <button
              key={i}
              data-interactive="true"
              onClick={b.action}
              title={b.title}
              aria-label={b.title}
              style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(7,14,24,0.94)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(240,237,232,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(12px)', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(200,164,74,0.15)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,164,74,0.35)'; (e.currentTarget as HTMLElement).style.color = '#C8A44A'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(7,14,24,0.94)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)'; (e.currentTarget as HTMLElement).style.color = 'rgba(240,237,232,0.6)'; }}
            >
              {b.icon}
            </button>
          ))}
        </div>

        {/* ── SCALE BADGE ────────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', bottom: 24, left: 66, zIndex: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,237,232,0.35)', background: 'rgba(7,14,24,0.88)', padding: '4px 9px', borderRadius: 6, backdropFilter: 'blur(8px)', display: 'block', fontFamily: "'JetBrains Mono', monospace" }}>
            {displayScale}%
          </span>
        </div>

        {/* ── FULLSCREEN ─────────────────────────────────────────────────── */}
        <button
          data-interactive="true"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          style={{ position: 'absolute', bottom: 18, right: 16, zIndex: 12, width: 40, height: 40, borderRadius: 11, background: 'rgba(7,14,24,0.94)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(240,237,232,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(12px)' }}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        {/* ── MOBILE FILTER CHIPS ────────────────────────────────────────── */}
        <div
          className="md:hidden"
          style={{ position: 'absolute', top: 42, left: 8, right: 8, display: 'flex', gap: 5, zIndex: 12, flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {filterRows.slice(1).map(row => (
            <button
              key={row.key}
              data-interactive="true"
              onClick={() => setFilterKey(prev => prev === row.key ? 'ALL' : row.key)}
              style={{ fontSize: 9, fontWeight: 700, padding: '5px 11px', borderRadius: 99, background: filterKey === row.key ? row.color : 'rgba(7,14,24,0.90)', color: filterKey === row.key ? '#0A1A2E' : 'rgba(240,237,232,0.7)', border: filterKey === row.key ? 'none' : '1px solid rgba(255,255,255,0.13)', cursor: 'pointer', backdropFilter: 'blur(10px)', boxShadow: filterKey === row.key ? `0 0 12px ${row.color}55` : 'none', transition: 'all 0.15s', fontFamily: "'Outfit', sans-serif" }}
            >
              {row.value} {row.label}
            </button>
          ))}
        </div>

        {/* ── IMAGE LOAD OVERLAY ─────────────────────────────────────────── */}
        <AnimatePresence>
          {!imageLoaded && !imageError && (
            <motion.div
              initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
              style={{ position: 'absolute', inset: 0, background: '#0A1620', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20, pointerEvents: 'none' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2.5px solid rgba(200,164,74,0.2)', borderTopColor: '#C8A44A', animation: 'spin 0.9s linear infinite' }} />
              <p style={{ fontSize: 11, color: 'rgba(240,237,232,0.35)', marginTop: 14, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Carregando planta…
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── DESKTOP RIGHT PANEL ──────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedQuadra && (
          <motion.div
            className="hidden md:block"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 292, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 32, stiffness: 380 }}
            style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(180deg, #0C1B2C 0%, #07101A 100%)' }}
          >
            <div style={{ width: 292, height: '100%' }}>
              {selectedLot ? (
                <LotDetailContent
                  lot={selectedLot}
                  developmentName={developmentName}
                  whatsappPhone={whatsappPhone}
                  onBack={() => setSelectedLot(null)}
                  onClose={closePanel}
                />
              ) : quadraMap.has(selectedQuadra) ? (
                <QuadraPanelContent
                  quadra={selectedQuadra}
                  lots={quadraMap.get(selectedQuadra)!}
                  developmentName={developmentName}
                  whatsappPhone={whatsappPhone}
                  filterKey={filterKey}
                  onClose={closePanel}
                  onLotSelect={handleLotClick}
                />
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MOBILE BOTTOM SHEET (multi-state) ────────────────────────────── */}
      <AnimatePresence>
        {selectedQuadra && (
          <motion.div
            className="md:hidden"
            initial={{ y: '100%' }}
            animate={{ y: sheetState === 'full' ? '18%' : sheetState === 'half' ? '50%' : '82%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 36, stiffness: 400 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 22,
              background: 'linear-gradient(180deg, #0C1B2C 0%, #07101A 100%)',
              borderRadius: '22px 22px 0 0',
              boxShadow: '0 -16px 60px rgba(0,0,0,0.65)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderBottomWidth: 0,
              top: 0,
              pointerEvents: 'auto',
            }}
          >
            {/* Drag handle area — cycles sheet states */}
            <div
              data-interactive="true"
              style={{ padding: '12px 0 6px', display: 'flex', justifyContent: 'center', cursor: 'ns-resize', flexShrink: 0 }}
              onClick={() => {
                setSheetState(prev =>
                  prev === 'full' ? 'half' :
                  prev === 'half' ? 'peek' :
                  'hidden'
                );
                if (sheetState === 'peek') {
                  setTimeout(() => { setSelectedQuadra(null); setSelectedLot(null); setSheetState('hidden'); }, 250);
                }
              }}
            >
              <GripHorizontal size={22} style={{ color: 'rgba(240,237,232,0.15)' }} />
            </div>

            <div style={{ position: 'absolute', inset: '44px 0 0', overflow: 'hidden' }}>
              {selectedLot ? (
                <LotDetailContent
                  lot={selectedLot}
                  developmentName={developmentName}
                  whatsappPhone={whatsappPhone}
                  onBack={() => { setSelectedLot(null); setSheetState('half'); }}
                  onClose={closePanel}
                />
              ) : quadraMap.has(selectedQuadra) ? (
                <QuadraPanelContent
                  quadra={selectedQuadra}
                  lots={quadraMap.get(selectedQuadra)!}
                  developmentName={developmentName}
                  whatsappPhone={whatsappPhone}
                  filterKey={filterKey}
                  onClose={closePanel}
                  onLotSelect={lot => { handleLotClick(lot); setSheetState('full'); }}
                />
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CSS KEYFRAMES ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
