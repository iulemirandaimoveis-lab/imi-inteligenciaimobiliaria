'use client';

import React, {
  useRef, useState, useCallback, useMemo, useEffect, useLayoutEffect,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, ZoomIn, ZoomOut, RotateCcw, MessageCircle,
  ChevronLeft, Ruler, DollarSign, Maximize2, Minimize2,
  GripHorizontal, Share2, Calendar,
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

interface QuadraTile {
  cx: number;  // center x % of SVG_W
  cy: number;  // center y % of SVG_H
  rot: number; // clockwise rotation (degrees) for the tile long axis
}

interface PlanConfig {
  imageUrl: string;
  imageAspect: number;
  tiles: Record<string, QuadraTile>;
}

// ─── Status palette ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
  DISPONIVEL:   { bg: '#16A34A', fill: 'rgba(22,163,74,0.32)',   stroke: '#16A34A', label: 'Disponível'   },
  VENDIDO:      { bg: '#64748B', fill: 'rgba(100,116,139,0.22)', stroke: '#64748B', label: 'Vendido'      },
  NEGOCIACAO:   { bg: '#F59E0B', fill: 'rgba(245,158,11,0.32)',  stroke: '#F59E0B', label: 'Negociação'   },
  PROPRIETARIO: { bg: '#2563EB', fill: 'rgba(37,99,235,0.28)',   stroke: '#2563EB', label: 'Proprietário' },
  IGREJA:       { bg: '#7C3AED', fill: 'rgba(124,58,237,0.28)',  stroke: '#7C3AED', label: 'Igreja'       },
} as const;
type StatusKey = keyof typeof STATUS_COLORS;

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

// ─── SVG coordinate system (normalised to this width) ─────────────────────────
const SVG_W = 1000;

// ─── Tile dimensions (SVG units) ─────────────────────────────────────────────
// Upper-sector quadras are taller/narrower; lower-sector are wider/flatter.
const TILE_W_UP = 68;   // long axis length — upper sector
const TILE_H_UP = 22;   // short axis width — upper sector
const TILE_W_LO = 70;   // long axis — lower sector
const TILE_H_LO = 20;   // short axis — lower sector

// ─── Plan Configs ─────────────────────────────────────────────────────────────
// Tile positions: cx/cy as percentage (0–100) of SVG dimensions.
// rot: clockwise rotation of tile (degrees). Derived from inter-quadra direction.
// Upper sector A→N: quadras spaced at roughly -45° → tiles oriented at -45°
// as arc turns, the angle shifts; right side (I→N) rotates to +25°
// Lower sector O→Z: quadras spaced at ~+18° → tiles oriented at ~+15°
export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  '8b9f6835-1bd0-4850-80b0-aaef2223300d': {
    imageUrl: '/images/maps/miguel-marques-plant.jpg',
    imageAspect: 2800 / 1981,
    tiles: {
      // ── Upper sector: arc W→E ───────────────────────────────────────────────
      A: { cx: 8,  cy: 40, rot: -50 },
      B: { cx: 14, cy: 34, rot: -45 },
      C: { cx: 20, cy: 29, rot: -42 },
      D: { cx: 26, cy: 24, rot: -38 },
      E: { cx: 32, cy: 20, rot: -30 },
      F: { cx: 38, cy: 17, rot: -15 },
      G: { cx: 44, cy: 16, rot:   0 },
      H: { cx: 50, cy: 17, rot:  15 },
      I: { cx: 56, cy: 21, rot:  25 },
      J: { cx: 61, cy: 26, rot:  32 },
      K: { cx: 65, cy: 32, rot:  38 },
      L: { cx: 67, cy: 38, rot:  42 },
      M: { cx: 63, cy: 44, rot:  38 },
      N: { cx: 57, cy: 38, rot:  20 },
      // ── Lower sector: diagonal rows ─────────────────────────────────────────
      O: { cx: 10, cy: 60, rot: -18 },
      P: { cx: 16, cy: 62, rot: -18 },
      Q: { cx: 22, cy: 64, rot: -18 },
      R: { cx: 28, cy: 66, rot: -18 },
      S: { cx: 34, cy: 68, rot: -18 },
      T: { cx: 40, cy: 70, rot: -18 },
      U: { cx: 46, cy: 72, rot: -18 },
      V: { cx: 52, cy: 74, rot: -18 },
      W: { cx: 49, cy: 80, rot: -18 },
      X: { cx: 42, cy: 78, rot: -18 },
      Z: { cx: 57, cy: 79, rot: -18 },
    },
  },
  'ab7d1fc1-f069-4e3b-a515-8e1204c11247': {
    imageUrl: '/images/maps/alto-bellevue-plant.jpg',
    imageAspect: 3000 / 2120,
    tiles: {
      A: { cx: 72, cy: 18, rot: 0 }, B: { cx: 82, cy: 28, rot: 0 }, C: { cx: 89, cy: 42, rot: 0 },
      D: { cx: 52, cy: 22, rot: 0 }, E: { cx: 62, cy: 28, rot: 0 }, F: { cx: 86, cy: 56, rot: 0 },
      G: { cx: 83, cy: 64, rot: 0 }, H: { cx: 68, cy: 12, rot: 0 }, I: { cx: 76, cy: 42, rot: 0 },
      J: { cx: 72, cy: 55, rot: 0 }, K: { cx: 85, cy: 72, rot: 0 }, L: { cx: 62, cy: 55, rot: 0 },
      M: { cx: 57, cy: 66, rot: 0 }, N: { cx: 68, cy: 74, rot: 0 },
    },
  },
};

export const PLAN_VIEW_IDS = new Set(Object.keys(PLAN_CONFIGS));

// ─── Lot cell for the quadra detail panel ────────────────────────────────────
function LotCell({ lot, onClick }: { lot: Lot; onClick: (lot: Lot) => void }) {
  const cfg = STATUS_COLORS[lot.status as StatusKey] ?? STATUS_COLORS.DISPONIVEL;
  return (
    <button
      onClick={() => onClick(lot)}
      style={{
        minWidth: 44, height: 44, borderRadius: 8, flexShrink: 0,
        background: `${cfg.bg}20`, border: `1.5px solid ${cfg.bg}55`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.12s',
        position: 'relative', padding: '0 6px',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = `${cfg.bg}38`;
        (e.currentTarget as HTMLElement).style.borderColor = cfg.bg;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = `${cfg.bg}20`;
        (e.currentTarget as HTMLElement).style.borderColor = `${cfg.bg}55`;
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
        {lot.lot_number}
      </span>
      {lot.special_type === 'ESQUINA' && (
        <div style={{ position: 'absolute', top: 3, right: 3, width: 5, height: 5, borderRadius: 1.5, background: '#60A5FA' }} />
      )}
    </button>
  );
}

// ─── Premium lot detail bottom panel ─────────────────────────────────────────
function LotDetailPanel({
  lot, developmentName, whatsappPhone, onBack, onClose,
}: {
  lot: Lot; developmentName: string; whatsappPhone: string;
  onBack: () => void; onClose: () => void;
}) {
  const cfg = STATUS_COLORS[lot.status as StatusKey] ?? STATUS_COLORS.DISPONIVEL;
  const isAvail = lot.status === 'DISPONIVEL';
  const pricePerM2 = lot.price && lot.area_m2 > 0 ? Math.round(lot.price / lot.area_m2) : null;

  const waInterest = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    `Olá! Tenho interesse no ${developmentName}, Quadra ${lot.quadra}, Lote ${lot.lot_number} (${Math.round(lot.area_m2)} m²${lot.price ? ` — ${fmtBRL(lot.price)}` : ''}). Gostaria de reservar ou receber mais informações.`
  )}`;
  const waVisit = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    `Olá! Gostaria de agendar uma visita ao ${developmentName} para ver o Lote ${lot.lot_number} da Quadra ${lot.quadra}.`
  )}`;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0F2035' }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <button
            onClick={onBack}
            style={{ background: 'rgba(200,164,74,0.12)', border: '1px solid rgba(200,164,74,0.2)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#C8A44A', marginRight: 10, flexShrink: 0 }}
          >
            <ChevronLeft size={15} />
          </button>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#C8A44A', letterSpacing: '0.2em', textTransform: 'uppercase', flex: 1 }}>LOTE SELECIONADO</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2 }}>
            <X size={14} />
          </button>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: cfg.bg, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }} />
          {cfg.label}
        </span>
        <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '8px 0 0', lineHeight: 1.1 }}>Lote {lot.lot_number}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>Quadra {lot.quadra} · {developmentName}</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
              <Ruler size={11} style={{ color: '#C8A44A' }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Metragem</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>{Math.round(lot.area_m2)} m²</p>
          </div>
          <div style={{ background: isAvail ? 'rgba(22,163,74,0.12)' : 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 10px', border: isAvail ? '1px solid rgba(22,163,74,0.25)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
              <DollarSign size={11} style={{ color: '#C8A44A' }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Valor</span>
            </div>
            {lot.price ? (
              <p style={{ fontSize: 14, fontWeight: 800, color: isAvail ? '#4ADE80' : '#fff', margin: 0, wordBreak: 'break-word' }}>
                {fmtBRL(lot.price)}
              </p>
            ) : (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Consultar</p>
            )}
          </div>
        </div>

        {pricePerM2 && (
          <div style={{ background: 'rgba(200,164,74,0.07)', border: '1px solid rgba(200,164,74,0.15)', borderRadius: 10, padding: '9px 12px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Preço / m²</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#C8A44A' }}>{fmtBRL(pricePerM2)}/m²</span>
          </div>
        )}

        {lot.special_type === 'ESQUINA' && (
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: 'rgba(37,99,235,0.2)', color: '#93C5FD', border: '1px solid rgba(37,99,235,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Lote de Esquina
            </span>
          </div>
        )}

        {lot.notes && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px', margin: '0 0 10px', lineHeight: 1.5 }}>
            {lot.notes}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {isAvail && (
            <a href={waInterest} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 12, background: '#C8A44A', color: '#0B1928', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}
            >
              <MessageCircle size={14} />
              Tenho Interesse
            </a>
          )}
          <a href={waVisit} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Calendar size={13} />
            Agendar Visita
          </a>
          <button
            onClick={() => {
              const u = new URL(window.location.href);
              u.searchParams.set('quadra', lot.quadra);
              u.searchParams.set('lote', String(lot.lot_number));
              const url = u.toString();
              navigator.share?.({ title: `Lote ${lot.lot_number} — Quadra ${lot.quadra}`, url }) ??
              navigator.clipboard?.writeText(url);
            }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 38, borderRadius: 10, background: 'transparent', color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', border: 'none', cursor: 'pointer' }}
          >
            <Share2 size={11} />
            Compartilhar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Quadra lot-grid panel ────────────────────────────────────────────────────
function QuadraPanel({
  quadra, lots, developmentName, whatsappPhone, filterStatus, onClose, onLotSelect,
}: {
  quadra: string; lots: Lot[]; developmentName: string; whatsappPhone: string;
  filterStatus: string; onClose: () => void; onLotSelect: (lot: Lot) => void;
}) {
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of lots) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [lots]);

  const visible = useMemo(
    () => (filterStatus === 'ALL' ? lots : lots.filter(l => l.status === filterStatus))
           .sort((a, b) => a.lot_number - b.lot_number),
    [lots, filterStatus],
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0F2035' }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 8, fontWeight: 700, color: '#C8A44A', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 3px' }}>QUADRA</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1 }}>{quadra}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
          >
            <X size={13} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {Object.entries(counts).map(([st, cnt]) => {
            const cfg = STATUS_COLORS[st as StatusKey];
            if (!cfg) return null;
            return (
              <span key={st} style={{ fontSize: 8, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: `${cfg.bg}20`, color: '#fff', border: `1px solid ${cfg.bg}50`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {cnt} {cfg.label}
              </span>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 10px' }}>
          {visible.length} lote{visible.length !== 1 ? 's' : ''}
          {filterStatus !== 'ALL' ? ' · filtro ativo' : ''}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {visible.map((lot: Lot) => <LotCell key={lot.id} lot={lot} onClick={onLotSelect} />)}
        </div>
        {visible.length === 0 && (
          <p style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.2)', fontSize: 12, margin: 0 }}>
            Nenhum lote neste filtro
          </p>
        )}
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <a
          href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Tenho interesse em lotes da Quadra ${quadra} no ${developmentName}. Quais estão disponíveis?`)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, borderRadius: 10, background: 'rgba(200,164,74,0.1)', color: '#C8A44A', fontSize: 10, fontWeight: 700, textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid rgba(200,164,74,0.25)' }}
        >
          <MessageCircle size={13} />
          Falar sobre a Quadra
        </a>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
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
  onLotClick?: (lot: Lot) => void;
}) {
  const config = PLAN_CONFIGS[developmentId];

  // ─── Transform state — mutated directly for 60fps, not via setState ──────────
  const transform = useRef({ scale: 1, tx: 0, ty: 0 });
  const velocity  = useRef({ x: 0, y: 0 });
  const raf       = useRef<number | null>(null);

  // ─── DOM refs ────────────────────────────────────────────────────────────────
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef   = useRef<HTMLDivElement>(null);

  // ─── Gesture refs ─────────────────────────────────────────────────────────
  const isDragging    = useRef(false);
  const lastPointer   = useRef({ x: 0, y: 0, t: 0 });
  const lastTouches   = useRef<{ x: number; y: number; dist: number } | null>(null);
  const tapTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTime   = useRef(0);

  // ─── UI state ────────────────────────────────────────────────────────────────
  const [selectedQuadra, setSelectedQuadra] = useState<string | null>(null);
  const [selectedLot,    setSelectedLot]    = useState<Lot | null>(null);
  const [filterStatus,   setFilterStatus]   = useState('ALL');
  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [displayScale,   setDisplayScale]   = useState(100); // throttled UI display

  // ─── SVG dimensions ──────────────────────────────────────────────────────────
  const SVG_H = config ? Math.round(SVG_W / config.imageAspect) : 700;

  // ─── Derived data ─────────────────────────────────────────────────────────────
  const quadraStats = useMemo(() => {
    const map = new Map<string, { lots: Lot[]; available: number; dominantStatus: StatusKey }>();
    for (const lot of lots) {
      if (!map.has(lot.quadra)) map.set(lot.quadra, { lots: [], available: 0, dominantStatus: 'VENDIDO' });
      const entry = map.get(lot.quadra)!;
      entry.lots.push(lot);
      if (lot.status === 'DISPONIVEL') entry.available++;
    }
    for (const [, entry] of map) {
      if (entry.available > 0) entry.dominantStatus = 'DISPONIVEL';
      else {
        const ct: Partial<Record<StatusKey, number>> = {};
        for (const l of entry.lots) ct[l.status as StatusKey] = (ct[l.status as StatusKey] ?? 0) + 1;
        if (ct.NEGOCIACAO) entry.dominantStatus = 'NEGOCIACAO';
        else if (ct.PROPRIETARIO) entry.dominantStatus = 'PROPRIETARIO';
        else entry.dominantStatus = 'VENDIDO';
      }
    }
    return map;
  }, [lots]);

  const stats = useMemo(() => {
    const total      = lots.length;
    const available  = lots.filter(l => l.status === 'DISPONIVEL').length;
    const sold       = lots.filter(l => l.status === 'VENDIDO').length;
    const negotiation = lots.filter(l => l.status === 'NEGOCIACAO').length;
    const prices     = lots.filter(l => l.price && l.status === 'DISPONIVEL').map(l => l.price!);
    return {
      total, available, sold, negotiation,
      priceMin: prices.length > 0 ? Math.min(...prices) : 0,
      priceMax: prices.length > 0 ? Math.max(...prices) : 0,
    };
  }, [lots]);

  // ─── Core transform helpers ──────────────────────────────────────────────────
  const applyTransform = useCallback(() => {
    if (!contentRef.current) return;
    const { scale, tx, ty } = transform.current;
    contentRef.current.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
  }, []);

  const clampScale = (s: number) => Math.max(0.35, Math.min(10, s));

  // ─── Zoom centered on a screen point ─────────────────────────────────────────
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

  const zoomIn    = useCallback(() => { if (!containerRef.current) return; const r = containerRef.current.getBoundingClientRect(); zoomAt(1.3, r.left + r.width/2, r.top + r.height/2); }, [zoomAt]);
  const zoomOut   = useCallback(() => { if (!containerRef.current) return; const r = containerRef.current.getBoundingClientRect(); zoomAt(1/1.3, r.left + r.width/2, r.top + r.height/2); }, [zoomAt]);
  const resetView = useCallback(() => {
    transform.current = { scale: 1, tx: 0, ty: 0 };
    velocity.current  = { x: 0, y: 0 };
    applyTransform();
    setDisplayScale(100);
  }, [applyTransform]);

  // ─── Inertia loop ─────────────────────────────────────────────────────────────
  const stopInertia = useCallback(() => {
    if (raf.current !== null) { cancelAnimationFrame(raf.current); raf.current = null; }
  }, []);

  const startInertia = useCallback(() => {
    stopInertia();
    const tick = () => {
      velocity.current.x *= 0.92;
      velocity.current.y *= 0.92;
      if (Math.abs(velocity.current.x) < 0.3 && Math.abs(velocity.current.y) < 0.3) { raf.current = null; return; }
      transform.current.tx += velocity.current.x;
      transform.current.ty += velocity.current.y;
      applyTransform();
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [applyTransform, stopInertia]);

  // ─── Mouse handlers ──────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    stopInertia();
    zoomAt(e.deltaY > 0 ? 0.87 : 1.15, e.clientX, e.clientY);
  }, [zoomAt, stopInertia]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-interactive]')) return;
    stopInertia();
    isDragging.current  = true;
    lastPointer.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    velocity.current    = { x: 0, y: 0 };
  }, [stopInertia]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const now = Date.now();
    const dt  = Math.max(1, now - lastPointer.current.t);
    const dx  = e.clientX - lastPointer.current.x;
    const dy  = e.clientY - lastPointer.current.y;
    velocity.current = { x: dx / dt * 16, y: dy / dt * 16 };
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

  // ─── Touch handlers ──────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    stopInertia();
    if (e.touches.length === 1) {
      const t0 = e.touches[0];
      const now = Date.now();
      // double-tap detection
      if (now - lastTapTime.current < 300) {
        lastTapTime.current = 0;
        zoomAt(2, t0.clientX, t0.clientY);
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
    e.preventDefault();
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
      const ratio = dist / lastTouches.current.dist;
      // pan from mid movement
      const panX = mid.x - lastTouches.current.x;
      const panY = mid.y - lastTouches.current.y;
      transform.current.tx += panX;
      transform.current.ty += panY;
      // zoom at midpoint
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
    if (e.touches.length === 0) {
      startInertia();
    }
    setTimeout(() => setDisplayScale(Math.round(transform.current.scale * 100)), 50);
  }, [startInertia]);

  // ─── Fullscreen ──────────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && wrapperRef.current) {
      wrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // ─── Prevent passive wheel listener warning ───────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);

  // ─── Set initial transform after layout ──────────────────────────────────────
  useLayoutEffect(() => {
    applyTransform();
  }, [applyTransform]);

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const handleLotSelect = useCallback((lot: Lot) => {
    setSelectedLot(lot);
    onLotClick?.(lot);
  }, [onLotClick]);

  const closePanel = useCallback(() => {
    setSelectedQuadra(null);
    setSelectedLot(null);
  }, []);

  if (!config) return null;

  // ─── Layout helpers ──────────────────────────────────────────────────────────
  const containerH = isFullscreen ? '100vh' : 'clamp(400px, 58vw, 700px)';

  const statusRows = [
    { key: 'ALL',        label: 'Todos',       value: stats.total,        color: '#C8A44A' },
    { key: 'DISPONIVEL', label: 'Disponíveis', value: stats.available,    color: '#16A34A' },
    { key: 'VENDIDO',    label: 'Vendidos',    value: stats.sold,         color: '#64748B' },
    { key: 'NEGOCIACAO', label: 'Negociação',  value: stats.negotiation,  color: '#F59E0B' },
  ];

  // ─── Tile size (upper vs lower sector) ────────────────────────────────────────
  const UPPER = new Set(['A','B','C','D','E','F','G','H','I','J','K','L','M','N']);
  const tileW = (q: string) => UPPER.has(q) ? TILE_W_UP : TILE_W_LO;
  const tileH = (q: string) => UPPER.has(q) ? TILE_H_UP : TILE_H_LO;

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative', background: '#0B1928',
        borderRadius: isFullscreen ? 0 : 20,
        overflow: 'hidden',
        border: isFullscreen ? 'none' : '1px solid rgba(200,164,74,0.15)',
        boxShadow: isFullscreen ? 'none' : '0 12px 56px rgba(0,0,0,0.4)',
        height: containerH, display: 'flex',
      }}
    >
      {/* ── LEFT SIDEBAR (desktop) ───────────────────────────────────────────── */}
      <div
        className="hidden md:flex flex-col"
        style={{ width: 220, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,20,34,0.97)', zIndex: 5 }}
      >
        {/* Mano Imóveis logo */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logos/mano-imoveis.png" alt="Mano Imóveis" style={{ height: 28, objectFit: 'contain', filter: 'none' }} />
        </div>

        {/* Filters */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 8, fontWeight: 700, color: '#C8A44A', textTransform: 'uppercase', letterSpacing: '0.25em', margin: '0 0 12px' }}>FILTROS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {statusRows.map(row => (
              <button
                key={row.key}
                onClick={() => setFilterStatus(row.key)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 10,
                  border: `1px solid ${filterStatus === row.key ? row.color+'55' : 'rgba(255,255,255,0.07)'}`,
                  background: filterStatus === row.key ? row.color+'18' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, flexShrink: 0, boxShadow: filterStatus === row.key ? `0 0 6px ${row.color}` : 'none' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: filterStatus === row.key ? '#fff' : 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: filterStatus === row.key ? row.color : 'rgba(255,255,255,0.3)' }}>{row.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Price range */}
        {stats.priceMin > 0 && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 8px' }}>FAIXA DE PREÇO</p>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: 0 }}>A partir de</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#C8A44A', margin: '2px 0 6px' }}>{fmtBRL(stats.priceMin)}</p>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Até</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#C8A44A', margin: '2px 0 0' }}>{fmtBRL(stats.priceMax)}</p>
          </div>
        )}

        {/* Legend */}
        <div style={{ padding: '12px 16px', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 8px' }}>LEGENDA</p>
          {Object.entries(STATUS_COLORS).slice(0, 4).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 12, height: 8, borderRadius: 2, background: v.bg, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{v.label}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(200,164,74,0.06)', border: '1px solid rgba(200,164,74,0.12)', borderRadius: 8 }}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.5 }}>
              Toque numa quadra para explorar os lotes · Pinça para zoom
            </p>
          </div>
        </div>
      </div>

      {/* ── MAP VIEWPORT ─────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          cursor: isDragging.current ? 'grabbing' : 'grab',
          background: '#0D1F30', touchAction: 'none',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── TRANSFORM LAYER ─────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            ref={contentRef}
            style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              willChange: 'transform',
              transformOrigin: 'center center',
            }}
          >
            {/* ── SVG: image + quadra tile overlay ── */}
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', display: 'block' }}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="tile-blur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1" />
                </filter>
              </defs>

              {/* Layer 1: plant image — full-res, zoom into it to read lot detail */}
              <image
                href={config.imageUrl}
                x="0" y="0"
                width={SVG_W} height={SVG_H}
                preserveAspectRatio="xMidYMid meet"
                style={{ imageRendering: 'auto' }}
              />

              {/* Layer 2: quadra tiles — rotated semi-transparent rectangles */}
              {Object.entries(config.tiles).map(([quadra, tile]) => {
                const qStats = quadraStats.get(quadra);
                if (!qStats) return null;
                const cfg     = STATUS_COLORS[qStats.dominantStatus];
                const isSelected = selectedQuadra === quadra;
                const cx = (tile.cx / 100) * SVG_W;
                const cy = (tile.cy / 100) * SVG_H;
                const tw = tileW(quadra);
                const th = tileH(quadra);

                const displayAvail = filterStatus === 'ALL'
                  ? qStats.available
                  : qStats.lots.filter(l => l.status === filterStatus).length;

                if (filterStatus !== 'ALL' && displayAvail === 0 && filterStatus !== 'VENDIDO') return null;

                return (
                  <g
                    key={quadra}
                    data-interactive="true"
                    style={{ cursor: 'pointer' }}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedQuadra(prev => prev === quadra ? null : quadra);
                      setSelectedLot(null);
                    }}
                  >
                    {/* Outer glow (selected) */}
                    {isSelected && (
                      <rect
                        x={-tw/2 - 5} y={-th/2 - 5}
                        width={tw + 10} height={th + 10}
                        rx={5}
                        fill={cfg.bg}
                        opacity="0.15"
                        transform={`translate(${cx},${cy}) rotate(${tile.rot})`}
                      >
                        <animate attributeName="opacity" values="0.1;0.25;0.1" dur="2s" repeatCount="indefinite" />
                      </rect>
                    )}

                    {/* Tile body */}
                    <rect
                      x={-tw/2} y={-th/2}
                      width={tw} height={th}
                      rx={4}
                      fill={isSelected ? cfg.bg : cfg.fill}
                      stroke={cfg.stroke}
                      strokeWidth={isSelected ? 1.5 : 1}
                      opacity={isSelected ? 0.85 : 0.8}
                      transform={`translate(${cx},${cy}) rotate(${tile.rot})`}
                    />

                    {/* Quadra letter — always horizontal */}
                    <text
                      x={cx} y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={isSelected ? '#fff' : '#fff'}
                      fontSize={14}
                      fontWeight="900"
                      fontFamily="'JetBrains Mono', monospace"
                      style={{ pointerEvents: 'none', userSelect: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                    >
                      {quadra}
                    </text>

                    {/* Available count badge */}
                    {displayAvail > 0 && (
                      <g transform={`translate(${cx + 10}, ${cy - 11})`}>
                        <circle r={10} fill="#16A34A" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))' }} />
                        <text
                          textAnchor="middle" dominantBaseline="central"
                          fill="white" fontSize={8} fontWeight="800"
                          fontFamily="'JetBrains Mono', monospace"
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
                          {displayAvail > 99 ? '99+' : displayAvail}
                        </text>
                      </g>
                    )}

                    {/* Selection ring pulse */}
                    {isSelected && (
                      <circle cx={cx} cy={cy} r={25} fill="none" stroke={cfg.stroke} strokeWidth="1" opacity="0.4">
                        <animate attributeName="r" from="20" to="40" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* Layer 3: Mano Imóveis watermark */}
              <image
                href="/images/logos/mano-imoveis.png"
                x={SVG_W - 120} y={SVG_H - 36}
                width={110} height={30}
                preserveAspectRatio="xMaxYMax meet"
                opacity="0.55"
                style={{ pointerEvents: 'none' }}
              />
            </svg>
          </div>
        </div>

        {/* ── HINT ─────────────────────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)', background: 'rgba(11,25,40,0.85)', padding: '5px 14px', borderRadius: 99, whiteSpace: 'nowrap', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.07)', display: 'block' }}>
            Arraste · Pinça · Toque numa quadra
          </span>
        </div>

        {/* ── ZOOM CONTROLS ────────────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 5, zIndex: 10 }}>
          {[
            { onClick: zoomIn,    icon: <ZoomIn size={14} />,    title: 'Aproximar' },
            { onClick: zoomOut,   icon: <ZoomOut size={14} />,   title: 'Afastar'   },
            { onClick: resetView, icon: <RotateCcw size={12} />, title: 'Resetar'   },
          ].map((b, i) => (
            <button
              key={i}
              data-interactive="true"
              onClick={b.onClick}
              title={b.title}
              style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(11,25,40,0.92)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(200,164,74,0.18)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,164,74,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(11,25,40,0.92)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              {b.icon}
            </button>
          ))}
        </div>

        {/* ── SCALE BADGE ──────────────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', bottom: 22, left: 64, zIndex: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(11,25,40,0.85)', padding: '4px 8px', borderRadius: 6, backdropFilter: 'blur(8px)', display: 'block' }}>
            {displayScale}%
          </span>
        </div>

        {/* ── FULLSCREEN ───────────────────────────────────────────────────────── */}
        <button
          data-interactive="true"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10, width: 38, height: 38, borderRadius: 10, background: 'rgba(11,25,40,0.92)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        {/* ── MOBILE FILTER CHIPS ──────────────────────────────────────────────── */}
        <div className="md:hidden" style={{ position: 'absolute', top: 40, left: 8, right: 8, display: 'flex', gap: 5, zIndex: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {statusRows.slice(1).map(row => (
            <button
              key={row.key}
              data-interactive="true"
              onClick={() => setFilterStatus(prev => prev === row.key ? 'ALL' : row.key)}
              style={{ fontSize: 9, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: filterStatus === row.key ? row.color : 'rgba(11,25,40,0.88)', color: '#fff', border: filterStatus === row.key ? 'none' : '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', backdropFilter: 'blur(8px)', boxShadow: filterStatus === row.key ? `0 0 10px ${row.color}66` : 'none', transition: 'all 0.15s' }}
            >
              {row.value} {row.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── DESKTOP SIDE PANEL ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedQuadra && (
          <motion.div
            className="hidden md:block"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 360 }}
            style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', flexShrink: 0 }}
          >
            <div style={{ width: 288, height: '100%' }}>
              {selectedLot ? (
                <LotDetailPanel
                  lot={selectedLot} developmentName={developmentName}
                  whatsappPhone={whatsappPhone}
                  onBack={() => setSelectedLot(null)} onClose={closePanel}
                />
              ) : quadraStats.has(selectedQuadra) ? (
                <QuadraPanel
                  quadra={selectedQuadra}
                  lots={quadraStats.get(selectedQuadra)!.lots}
                  developmentName={developmentName}
                  whatsappPhone={whatsappPhone}
                  filterStatus={filterStatus}
                  onClose={closePanel}
                  onLotSelect={handleLotSelect}
                />
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MOBILE BOTTOM SHEET ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedQuadra && (
          <motion.div
            className="md:hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 390 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
              background: '#0F2035',
              borderRadius: '22px 22px 0 0',
              boxShadow: '0 -10px 48px rgba(0,0,0,0.55)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottomWidth: 0,
              maxHeight: '72%',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            <div
              data-interactive="true"
              style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}
            >
              <GripHorizontal size={20} style={{ color: 'rgba(255,255,255,0.18)' }} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
              {selectedLot ? (
                <LotDetailPanel
                  lot={selectedLot} developmentName={developmentName}
                  whatsappPhone={whatsappPhone}
                  onBack={() => setSelectedLot(null)} onClose={closePanel}
                />
              ) : quadraStats.has(selectedQuadra) ? (
                <QuadraPanel
                  quadra={selectedQuadra}
                  lots={quadraStats.get(selectedQuadra)!.lots}
                  developmentName={developmentName}
                  whatsappPhone={whatsappPhone}
                  filterStatus={filterStatus}
                  onClose={closePanel}
                  onLotSelect={handleLotSelect}
                />
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
