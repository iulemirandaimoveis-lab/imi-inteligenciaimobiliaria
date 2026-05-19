'use client';

import { useState, useEffect, useMemo, useRef, useCallback, memo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  MessageCircle, X, Ruler, DollarSign, Filter, ZoomIn, ZoomOut,
  Maximize2, RotateCcw, ChevronDown, MapPin, Sun, Map as MapTabIcon, ImageIcon,
} from 'lucide-react';
import { generateMapLayout, LOT_W } from './layout';
import SubdivisionPlanView, { PLAN_VIEW_IDS } from '../SubdivisionPlanView';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lot {
  id: string;
  quadra: string;
  lot_number: number;
  area_m2: number;
  price: number | null;
  status: string;
  special_type: string | null;
}

interface Props {
  developmentId: string;
  developmentName: string;
  whatsappPhone?: string;
}

// ─── Status palette ───────────────────────────────────────────────────────────
const STATUS = {
  DISPONIVEL:   { label: 'Disponível',   fill: '#1a6b39', stroke: '#22c55e', glow: '#22c55e' },
  VENDIDO:      { label: 'Vendido',      fill: '#6b1a1a', stroke: '#ef4444', glow: '#ef4444' },
  NEGOCIACAO:   { label: 'Negociação',   fill: '#6b4a1a', stroke: '#f59e0b', glow: '#f59e0b' },
  PROPRIETARIO: { label: 'Proprietário', fill: '#1a3a6b', stroke: '#3b82f6', glow: '#3b82f6' },
  IGREJA:       { label: 'Igreja',       fill: '#3d1a6b', stroke: '#a855f7', glow: '#a855f7' },
} as const;
type StatusKey = keyof typeof STATUS;

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const fmtM2 = (v: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v)} m²`;

// ─── Pan/Zoom hook ────────────────────────────────────────────────────────────
function usePanZoom(containerRef: { current: HTMLDivElement | null }, mapSize: { w: number; h: number }) {
  const scaleRef = useRef(1);
  const txRef    = useRef(0);
  const tyRef    = useRef(0);
  const dragging = useRef(false);
  const lastPt   = useRef({ x: 0, y: 0 });
  const pinchRef = useRef<{ dist: number; mx: number; my: number } | null>(null);
  const groupRef = useRef<SVGGElement | null>(null);
  const mapSizeRef = useRef(mapSize);
  mapSizeRef.current = mapSize;

  const MIN_SCALE = 0.25;
  const MAX_SCALE = 6;

  const applyTransform = useCallback(() => {
    if (groupRef.current) {
      groupRef.current.setAttribute(
        'transform',
        `translate(${txRef.current},${tyRef.current}) scale(${scaleRef.current})`
      );
    }
  }, []);

  const clampTx = useCallback((tx: number, ty: number, s: number) => {
    const el = containerRef.current;
    if (!el) return { tx, ty };
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    const { w: mw, h: mh } = mapSizeRef.current;
    // Keep at least 20% of the map visible on each axis
    const margin = 0.2;
    const minTx = vw * margin - mw * s;
    const maxTx = vw * (1 - margin);
    const minTy = vh * margin - mh * s;
    const maxTy = vh * (1 - margin);
    return {
      tx: Math.max(minTx, Math.min(maxTx, tx)),
      ty: Math.max(minTy, Math.min(maxTy, ty)),
    };
  }, [containerRef]);

  const zoom = useCallback((deltaScale: number, originX: number, originY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ox = originX - rect.left;
    const oy = originY - rect.top;

    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleRef.current * deltaScale));
    const ratio = newScale / scaleRef.current;
    const newTx = ox - ratio * (ox - txRef.current);
    const newTy = oy - ratio * (oy - tyRef.current);

    scaleRef.current = newScale;
    const clamped = clampTx(newTx, newTy, newScale);
    txRef.current = clamped.tx;
    tyRef.current = clamped.ty;
    applyTransform();
  }, [containerRef, clampTx, applyTransform]);

  const reset = useCallback((totalW: number, totalH: number) => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const s = Math.min((w - 32) / totalW, (h - 32) / totalH, 1);
    scaleRef.current = s;
    txRef.current = (w - totalW * s) / 2;
    tyRef.current = (h - totalH * s) / 2;
    applyTransform();
  }, [containerRef, applyTransform]);

  const zoomIn  = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    zoom(1.3, el.clientWidth / 2, el.clientHeight / 2);
  }, [containerRef, zoom]);

  const zoomOut = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    zoom(1 / 1.3, el.clientWidth / 2, el.clientHeight / 2);
  }, [containerRef, zoom]);

  // Attach events
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.85 : 1 / 0.85;
      zoom(delta, e.clientX, e.clientY);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return; // handled by touch events
      if (e.button !== 0) return;
      dragging.current = true;
      lastPt.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastPt.current.x;
      const dy = e.clientY - lastPt.current.y;
      lastPt.current = { x: e.clientX, y: e.clientY };
      const clamped = clampTx(txRef.current + dx, tyRef.current + dy, scaleRef.current);
      txRef.current = clamped.tx;
      tyRef.current = clamped.ty;
      applyTransform();
    };

    const onPointerUp = () => {
      dragging.current = false;
      el.style.cursor = 'grab';
    };

    // Touch pinch
    const getTouchDist = (t: TouchList) => {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    const getTouchMid = (t: TouchList) => ({
      x: (t[0].clientX + t[1].clientX) / 2,
      y: (t[0].clientY + t[1].clientY) / 2,
    });

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchRef.current = {
          dist: getTouchDist(e.touches),
          ...getTouchMid(e.touches),
        };
      } else if (e.touches.length === 1) {
        dragging.current = true;
        lastPt.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2 && pinchRef.current) {
        const dist = getTouchDist(e.touches);
        const mid  = getTouchMid(e.touches);
        const ratio = dist / pinchRef.current.dist;
        zoom(ratio, mid.x, mid.y);
        pinchRef.current = { dist, ...mid };
      } else if (e.touches.length === 1 && dragging.current) {
        const dx = e.touches[0].clientX - lastPt.current.x;
        const dy = e.touches[0].clientY - lastPt.current.y;
        lastPt.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        const clamped = clampTx(txRef.current + dx, tyRef.current + dy, scaleRef.current);
        txRef.current = clamped.tx;
        tyRef.current = clamped.ty;
        applyTransform();
      }
    };

    const onTouchEnd = () => {
      dragging.current = false;
      pinchRef.current = null;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);

    el.style.cursor = 'grab';

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [containerRef, zoom, clampTx, applyTransform]);

  return { groupRef, reset, zoomIn, zoomOut };
}

// ─── Lot rectangle (memoized) ─────────────────────────────────────────────────
interface LotRectProps {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  lotNumber: number;
  status: string;
  isSelected: boolean;
  isFiltered: boolean;
  onClick: () => void;
}

const LotRect = memo(function LotRect({
  x, y, w, h, cx, cy, lotNumber, status, isSelected, isFiltered, onClick,
}: LotRectProps) {
  const cfg = STATUS[status as StatusKey] ?? STATUS.DISPONIVEL;
  const [hovered, setHovered] = useState(false);

  const opacity = isFiltered ? 0.15 : 1;
  const fillOpacity = hovered || isSelected ? 0.95 : 0.65;

  const fontSize = LOT_W < 50 ? 7 : 8;

  return (
    <g opacity={opacity} style={{ cursor: 'pointer' }} onClick={onClick}>
      {(hovered || isSelected) && (
        <rect
          x={x - 3} y={y - 3} width={w + 6} height={h + 6}
          rx={5} ry={5}
          fill="none"
          stroke={cfg.glow}
          strokeWidth={2.5}
          style={{ filter: `drop-shadow(0 0 6px ${cfg.glow})` }}
        />
      )}
      <rect
        x={x} y={y} width={w} height={h}
        rx={3} ry={3}
        fill={cfg.fill}
        fillOpacity={fillOpacity}
        stroke={cfg.stroke}
        strokeWidth={isSelected ? 2 : hovered ? 1.5 : 0.8}
        style={{ transition: 'fill-opacity 0.15s, stroke-width 0.15s' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <text
        x={cx} y={cy + fontSize * 0.35}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="700"
        fill={hovered || isSelected ? '#fff' : 'rgba(255,255,255,0.75)'}
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {lotNumber}
      </text>
    </g>
  );
});

// ─── Detail panel shared content ──────────────────────────────────────────────
function LotDetailContent({
  lot,
  developmentName,
  whatsappPhone,
  onClose,
}: {
  lot: Lot;
  developmentName: string;
  whatsappPhone: string;
  onClose: () => void;
}) {
  const cfg = STATUS[lot.status as StatusKey] ?? STATUS.DISPONIVEL;
  const isAvail = lot.status === 'DISPONIVEL';

  const waMsg = encodeURIComponent(
    `Olá! Tenho interesse no lote ${lot.lot_number} da Quadra ${lot.quadra} do ${developmentName}. ${fmtM2(lot.area_m2)} — ${lot.price ? fmtBRL(lot.price) : 'Consultar valor'}. Poderia me passar mais informações?`
  );

  return (
    <div style={{ background: '#0d1117', color: '#e2e8f0', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Status strip */}
      <div style={{ height: 3, background: cfg.stroke, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <span style={{
            display: 'inline-block', fontSize: 9, fontWeight: 800, letterSpacing: '0.15em',
            textTransform: 'uppercase', padding: '3px 10px', borderRadius: 99,
            background: `${cfg.stroke}25`, color: cfg.stroke, marginBottom: 8,
          }}>
            {cfg.label}
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#f1f5f9', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
            Quadra {lot.quadra} · Lote {lot.lot_number}
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Stats */}
      <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexShrink: 0 }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Ruler size={11} style={{ color: '#64748b' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Área</span>
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#f1f5f9', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
            {fmtM2(lot.area_m2)}
          </p>
        </div>
        <div style={{
          background: isAvail ? 'rgba(200,164,74,0.12)' : 'rgba(255,255,255,0.05)',
          borderRadius: 12, padding: '12px 14px',
          border: `1px solid ${isAvail ? 'rgba(200,164,74,0.3)' : 'rgba(255,255,255,0.08)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <DollarSign size={11} style={{ color: isAvail ? '#C8A44A' : '#64748b' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: isAvail ? '#C8A44A' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Valor</span>
          </div>
          <p style={{ fontSize: lot.price && lot.price >= 100000 ? 14 : 18, fontWeight: 800, margin: 0, color: isAvail ? '#C8A44A' : '#f1f5f9', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
            {lot.price ? fmtBRL(lot.price) : 'Consultar'}
          </p>
        </div>
      </div>

      {/* Price per m² */}
      {lot.price && lot.area_m2 > 0 && (
        <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>R$/m²</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
              {fmtBRL(lot.price / lot.area_m2)}/m²
            </span>
          </div>
        </div>
      )}

      {/* Solar position */}
      {lot.special_type && (
        <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Sun size={13} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{lot.special_type}</span>
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: '8px 20px 24px', marginTop: 'auto', flexShrink: 0 }}>
        {isAvail ? (
          <a
            href={`https://wa.me/${whatsappPhone}?text=${waMsg}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              height: 48, borderRadius: 12, width: '100%', textDecoration: 'none',
              background: 'linear-gradient(135deg, #C8A44A, #a8842e)',
              color: '#0d1117', fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
              fontFamily: "var(--fu, 'Outfit', sans-serif)",
            }}
          >
            <MessageCircle size={15} />
            Tenho Interesse
          </a>
        ) : (
          <a
            href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Gostaria de informações sobre lotes disponíveis no ${developmentName}.`)}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              height: 48, borderRadius: 12, width: '100%', textDecoration: 'none',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#94a3b8', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              fontFamily: "var(--fu, 'Outfit', sans-serif)",
            }}
          >
            <MessageCircle size={15} />
            Ver Outros Lotes
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Bottom sheet (mobile) ────────────────────────────────────────────────────
function BottomSheet({ lot, developmentName, whatsappPhone, onClose }: {
  lot: Lot | null;
  developmentName: string;
  whatsappPhone: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {lot && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50,
            borderRadius: '20px 20px 0 0', overflow: 'hidden',
            boxShadow: '0 -24px 80px rgba(0,0,0,0.7)',
            maxHeight: '75vh',
          }}
        >
          {/* Drag handle */}
          <div style={{ background: '#0d1117', paddingTop: 10, paddingBottom: 4, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
          </div>
          <LotDetailContent lot={lot} developmentName={developmentName} whatsappPhone={whatsappPhone} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Filter sidebar ───────────────────────────────────────────────────────────
function FilterBar({
  filterStatus, setFilterStatus, stats, isMobile,
}: {
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  stats: { available: number; sold: number; negotiation: number; owner: number; total: number };
  isMobile: boolean;
}) {
  const items = [
    { key: 'ALL',         label: 'Todos',        count: stats.total,       color: '#94a3b8' },
    { key: 'DISPONIVEL',  label: 'Disponível',   count: stats.available,   color: '#22c55e' },
    { key: 'VENDIDO',     label: 'Vendido',      count: stats.sold,        color: '#ef4444' },
    { key: 'NEGOCIACAO',  label: 'Negociação',   count: stats.negotiation, color: '#f59e0b' },
    { key: 'PROPRIETARIO',label: 'Proprietário', count: stats.owner,       color: '#3b82f6' },
  ] as const;

  if (isMobile) {
    return (
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', overflowX: 'auto', flexShrink: 0 }}>
        {items.map(item => (
          <button
            key={item.key}
            onClick={() => setFilterStatus(item.key)}
            style={{
              flexShrink: 0, height: 32, padding: '0 12px', borderRadius: 99, border: 'none', cursor: 'pointer',
              background: filterStatus === item.key ? item.color : 'rgba(255,255,255,0.08)',
              color: filterStatus === item.key ? (item.key === 'ALL' ? '#0d1117' : '#fff') : '#94a3b8',
              fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
              whiteSpace: 'nowrap',
            }}
          >
            <span>{item.label}</span>
            <span style={{ fontSize: 10, opacity: 0.8 }}>{item.count}</span>
          </button>
        ))}
      </div>
    );
  }

  // Desktop sidebar
  return (
    <div style={{ width: 220, flexShrink: 0, background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', padding: '24px 16px', gap: 6, overflowY: 'auto' }}>
      <p style={{ fontSize: 9, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 12px 4px' }}>Filtrar por status</p>
      {items.map(item => (
        <button
          key={item.key}
          onClick={() => setFilterStatus(item.key)}
          style={{
            width: '100%', height: 42, borderRadius: 10, border: `1px solid ${filterStatus === item.key ? item.color : 'rgba(255,255,255,0.06)'}`,
            background: filterStatus === item.key ? `${item.color}18` : 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            {item.key !== 'ALL' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />}
            {item.key === 'ALL' && <Filter size={10} style={{ color: '#64748b' }} />}
            <span style={{ fontSize: 12, fontWeight: 700, color: filterStatus === item.key ? item.color : '#94a3b8' }}>{item.label}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: filterStatus === item.key ? item.color : '#475569', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
            {item.count}
          </span>
        </button>
      ))}

      {/* Legend spacer */}
      <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 9, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 10 }}>Legenda</p>
        {Object.entries(STATUS).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: v.fill, border: `1.5px solid ${v.stroke}`, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Map canvas ───────────────────────────────────────────────────────────────
interface MapCanvasProps {
  lots: Lot[];
  filterStatus: string;
  selectedLot: Lot | null;
  onLotClick: (lot: Lot) => void;
  isMobile: boolean;
  onResetRef: { current: (() => void) | null };
  onZoomInRef: { current: (() => void) | null };
  onZoomOutRef: { current: (() => void) | null };
}

function MapCanvas({ lots, filterStatus, selectedLot, onLotClick, isMobile, onResetRef, onZoomInRef, onZoomOutRef }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const quadraData = useMemo(() => {
    const map = new Map<string, { id: string; lot_number: number }[]>();
    for (const lot of lots) {
      if (!map.has(lot.quadra)) map.set(lot.quadra, []);
      map.get(lot.quadra)!.push({ id: lot.id, lot_number: lot.lot_number });
    }
    return map;
  }, [lots]);

  const layout = useMemo(() => generateMapLayout(quadraData), [quadraData]);

  const { groupRef, reset, zoomIn, zoomOut } = usePanZoom(containerRef, { w: layout.totalW, h: layout.totalH });

  const lotById = useMemo(() => {
    const m = new Map<string, Lot>();
    for (const l of lots) m.set(l.id, l);
    return m;
  }, [lots]);

  // Expose controls to parent
  useEffect(() => {
    onResetRef.current  = () => reset(layout.totalW, layout.totalH);
    onZoomInRef.current  = zoomIn;
    onZoomOutRef.current = zoomOut;
  }, [reset, zoomIn, zoomOut, layout, onResetRef, onZoomInRef, onZoomOutRef]);

  // Initial fit
  useEffect(() => {
    const t = setTimeout(() => reset(layout.totalW, layout.totalH), 80);
    return () => clearTimeout(t);
  }, [layout.totalW, layout.totalH, reset]);

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#080c12' }}
    >
      <svg
        style={{ width: '100%', height: '100%', display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Grid pattern for background */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
          </pattern>
          {/* Glow filters */}
          <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Grid background (fixed) */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        <g ref={groupRef}>
          {/* Map background */}
          <rect
            x={-20} y={-20}
            width={layout.totalW + 40}
            height={layout.totalH + 40}
            rx={16} ry={16}
            fill="#0e1420"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
          />

          {/* Street network (fills between quadras) */}
          {layout.quadras.map(q => (
            <Fragment key={`street-${q.id}`}>
              {/* Horizontal street below quadra */}
              <rect
                x={q.x - 4} y={q.y + q.h}
                width={q.w + 8} height={72}
                fill="#131926"
              />
              {/* Vertical street right of quadra */}
              <rect
                x={q.x + q.w} y={q.y - 4}
                width={80} height={q.h + 8}
                fill="#131926"
              />
            </Fragment>
          ))}

          {/* Outer border road */}
          <rect
            x={60} y={60}
            width={layout.totalW - 120}
            height={layout.totalH - 120}
            rx={12} ry={12}
            fill="none"
            stroke="#131926"
            strokeWidth={60}
          />

          {/* Quadra blocks */}
          {layout.quadras.map(q => (
            <g key={q.id}>
              {/* Block background */}
              <rect
                x={q.x} y={q.y} width={q.w} height={q.h}
                rx={4} ry={4}
                fill="#12192a"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              {/* Quadra label */}
              <text
                x={q.labelX} y={q.labelY}
                textAnchor="middle"
                fontSize={11}
                fontWeight={800}
                fill="rgba(255,255,255,0.25)"
                fontFamily="'JetBrains Mono', monospace"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                Q{q.id}
              </text>

              {/* Lots */}
              {q.lots.map(lg => {
                const lot = lotById.get(lg.id);
                if (!lot) return null;
                const isFiltered = filterStatus !== 'ALL' && lot.status !== filterStatus;
                const isSelected = selectedLot?.id === lot.id;
                return (
                  <LotRect
                    key={lg.id}
                    id={lg.id}
                    x={lg.x} y={lg.y}
                    w={lg.w} h={lg.h}
                    cx={lg.cx} cy={lg.cy}
                    lotNumber={lot.lot_number}
                    status={lot.status}
                    isSelected={isSelected}
                    isFiltered={isFiltered}
                    onClick={() => onLotClick(lot)}
                  />
                );
              })}
            </g>
          ))}

          {/* Compass rose */}
          <g transform={`translate(${layout.totalW - 80}, 80)`}>
            <circle cx={0} cy={0} r={22} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
            <line x1={0} y1={-16} x2={0} y2={16} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
            <line x1={-16} y1={0} x2={16} y2={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
            <text x={0} y={-22} textAnchor="middle" fontSize={9} fontWeight={800} fill="rgba(255,255,255,0.5)" fontFamily="'JetBrains Mono', monospace">N</text>
          </g>

          {/* Entrance label */}
          <g transform={`translate(${layout.totalW / 2}, ${layout.totalH - 50})`}>
            <rect x={-60} y={-14} width={120} height={22} rx={4} fill="rgba(200,164,74,0.15)" stroke="rgba(200,164,74,0.3)" strokeWidth={1} />
            <text textAnchor="middle" y={4} fontSize={9} fontWeight={800} fill="#C8A44A" fontFamily="'JetBrains Mono', monospace" letterSpacing={2}>
              ENTRADA
            </text>
          </g>
        </g>
      </svg>

      {/* Hint overlay when empty */}
      {!isMobile && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', opacity: 0.45 }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Scroll para zoom · Arraste para mover · Clique no lote para detalhes</span>
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function InteractiveLotMap({ developmentId, developmentName, whatsappPhone = '5581997230455' }: Props) {
  const [lots, setLots]             = useState<Lot[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isMobile, setIsMobile]     = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab]   = useState<'map' | 'plan'>('map');
  const hasPlanView = PLAN_VIEW_IDS.has(developmentId);

  const onResetRef   = useRef<(() => void) | null>(null);
  const onZoomInRef  = useRef<(() => void) | null>(null);
  const onZoomOutRef = useRef<(() => void) | null>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    createClient()
      .from('subdivision_lots')
      .select('*')
      .eq('development_id', developmentId)
      .order('quadra').order('lot_number')
      .then(({ data }) => {
        if (data) setLots(data as Lot[]);
        setLoading(false);
      });
  }, [developmentId]);

  const stats = useMemo(() => ({
    total:       lots.length,
    available:   lots.filter(l => l.status === 'DISPONIVEL').length,
    sold:        lots.filter(l => l.status === 'VENDIDO').length,
    negotiation: lots.filter(l => l.status === 'NEGOCIACAO').length,
    owner:       lots.filter(l => l.status === 'PROPRIETARIO').length,
  }), [lots]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement) setIsFullscreen(false); };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(200,164,74,0.2)', borderTopColor: '#C8A44A', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 11, color: '#64748b', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>Carregando mapa…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (lots.length === 0) return null;

  const mapHeight = isMobile ? 'calc(100dvh - 56px)' : 520;

  return (
    <>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 3, height: 28, borderRadius: 2, background: '#C8A44A' }} />
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0B1928', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
              Mapa de Disponibilidade
            </h2>
            <p style={{ fontSize: 13, color: '#948F84', margin: 0 }}>
              {stats.available} de {stats.total} lotes disponíveis
            </p>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {stats.available > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#DCFCE7', borderRadius: 99, padding: '4px 12px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>{stats.available} disponíveis</span>
            </div>
          )}
          {/* Tab switcher — only shown when plan view is available */}
          {hasPlanView && (
            <div style={{ display: 'flex', gap: 2, background: '#F0EDE5', borderRadius: 10, padding: 3 }}>
              {([
                { key: 'map',  label: 'Mapa', icon: <MapTabIcon size={12} /> },
                { key: 'plan', label: 'Planta', icon: <ImageIcon size={12} /> },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 12px',
                    borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                    background: activeTab === tab.key ? '#0B1928' : 'transparent',
                    color: activeTab === tab.key ? '#fff' : '#948F84',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Plan view — rendered when plan tab is active */}
      {hasPlanView && activeTab === 'plan' && (
        <SubdivisionPlanView
          lots={lots}
          developmentId={developmentId}
          developmentName={developmentName}
          whatsappPhone={whatsappPhone}
          onLotClick={setSelectedLot}
        />
      )}

      <div
        ref={wrapperRef}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
          background: '#080c12',
          position: 'relative',
          display: activeTab === 'plan' ? 'none' : undefined,
        }}
      >
        <div style={{ display: 'flex', height: mapHeight, position: 'relative' }}>
          {/* Left sidebar — desktop only */}
          {!isMobile && (
            <FilterBar
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              stats={stats}
              isMobile={false}
            />
          )}

          {/* Center: map */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
            {/* Mobile filter bar */}
            {isMobile && (
              <FilterBar
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                stats={stats}
                isMobile={true}
              />
            )}

            <MapCanvas
              lots={lots}
              filterStatus={filterStatus}
              selectedLot={selectedLot}
              onLotClick={setSelectedLot}
              isMobile={isMobile}
              onResetRef={onResetRef}
              onZoomInRef={onZoomInRef}
              onZoomOutRef={onZoomOutRef}
            />

            {/* Mobile bottom sheet */}
            {isMobile && (
              <BottomSheet
                lot={selectedLot}
                developmentName={developmentName}
                whatsappPhone={whatsappPhone}
                onClose={() => setSelectedLot(null)}
              />
            )}
          </div>

          {/* Right panel — desktop, when lot selected */}
          {!isMobile && selectedLot && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{ width: 280, flexShrink: 0, overflow: 'hidden', borderLeft: '1px solid rgba(255,255,255,0.07)' }}
            >
              <LotDetailContent
                lot={selectedLot}
                developmentName={developmentName}
                whatsappPhone={whatsappPhone}
                onClose={() => setSelectedLot(null)}
              />
            </motion.div>
          )}
        </div>

        {/* Floating controls */}
        <div style={{ position: 'absolute', right: isMobile ? 12 : selectedLot ? 296 : 12, bottom: 52, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 20, transition: 'right 0.3s ease' }}>
          {[
            { icon: <ZoomIn size={14} />, action: () => onZoomInRef.current?.(), title: 'Zoom in' },
            { icon: <ZoomOut size={14} />, action: () => onZoomOutRef.current?.(), title: 'Zoom out' },
            { icon: <RotateCcw size={14} />, action: () => onResetRef.current?.(), title: 'Resetar' },
            { icon: isFullscreen ? <X size={14} /> : <Maximize2 size={14} />, action: toggleFullscreen, title: 'Tela cheia' },
          ].map((ctrl, i) => (
            <button
              key={i}
              onClick={ctrl.action}
              title={ctrl.title}
              style={{
                width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(13,17,23,0.88)', color: '#94a3b8', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)', transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(200,164,74,0.2)'; (e.currentTarget as HTMLButtonElement).style.color = '#C8A44A'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(13,17,23,0.88)'; (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
            >
              {ctrl.icon}
            </button>
          ))}
        </div>

        {/* Minimap indicator — shows filter status */}
        {filterStatus !== 'ALL' && (
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99,
              background: 'rgba(13,17,23,0.9)', border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
            }}>
              <Filter size={10} style={{ color: '#C8A44A' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#C8A44A' }}>
                {STATUS[filterStatus as StatusKey]?.label ?? filterStatus}
              </span>
              <button onClick={() => setFilterStatus('ALL')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <X size={10} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: lot selected hint */}
      {!isMobile && !selectedLot && lots.length > 0 && (
        <p style={{ fontSize: 12, color: '#948F84', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={12} />
          Clique em qualquer lote para ver detalhes e preço
        </p>
      )}

      {/* CTA strip */}
      <div style={{ marginTop: 20, background: '#0B1928', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 13, color: '#C8A44A', fontWeight: 700, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
            {stats.available} lote{stats.available !== 1 ? 's' : ''} disponível{stats.available !== 1 ? 'is' : ''}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Escolha o seu. Parcelas a partir do dia 05.
          </p>
        </div>
        <a
          href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Tenho interesse em um lote no ${developmentName}. Gostaria de ver as opções disponíveis.`)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 24px', borderRadius: 12, background: '#C8A44A', color: '#0B1928', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)", flexShrink: 0 }}
        >
          <MessageCircle size={14} />
          Falar com Especialista
        </a>
      </div>

      {/* Desktop detail: selected lot info below map */}
      <AnimatePresence>
        {!isMobile && selectedLot && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{ marginTop: 8 }}
          >
            <p style={{ fontSize: 12, color: '#948F84', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ChevronDown size={12} />
              Quadra {selectedLot.quadra} · Lote {selectedLot.lot_number} selecionado — veja o painel à direita do mapa
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
