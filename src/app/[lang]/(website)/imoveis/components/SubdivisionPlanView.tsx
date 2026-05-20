'use client';

import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, ZoomIn, ZoomOut, RotateCcw, MessageCircle,
  ChevronLeft, Ruler, DollarSign, Maximize2, Minimize2,
  GripHorizontal,
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

interface QuadraPos { x: number; y: number }

interface PlanConfig {
  imageUrl: string;
  imageAspect: number;
  quadraPositions: Record<string, QuadraPos>;
}

// ─── Status Colors ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  DISPONIVEL:   { bg: '#16A34A', glow: 'rgba(22,163,74,0.4)',  label: 'Disponível',   textColor: '#fff' },
  VENDIDO:      { bg: '#DC2626', glow: 'rgba(220,38,38,0.4)',  label: 'Vendido',      textColor: '#fff' },
  NEGOCIACAO:   { bg: '#D97706', glow: 'rgba(217,119,6,0.4)',  label: 'Negociação',   textColor: '#fff' },
  PROPRIETARIO: { bg: '#2563EB', glow: 'rgba(37,99,235,0.4)',  label: 'Proprietário', textColor: '#fff' },
  IGREJA:       { bg: '#7C3AED', glow: 'rgba(124,58,237,0.4)', label: 'Igreja',       textColor: '#fff' },
} as const;
type StatusKey = keyof typeof STATUS_COLORS;

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

// ─── SVG Layout Constants (normalized to viewBox width 1000) ─────────────────
const SVG_W = 1000;
const MARKER_R = 22;
const FONT_SZ = 15;
const BADGE_R = 12;
const BADGE_FONT = 9;

// ─── Plan Configs ─────────────────────────────────────────────────────────────
export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  '8b9f6835-1bd0-4850-80b0-aaef2223300d': {
    imageUrl: '/images/maps/miguel-marques-plant.jpg',
    imageAspect: 2800 / 1981,
    quadraPositions: {
      // Upper sector — arc from west to east (A–N)
      A: { x: 8,  y: 40 }, B: { x: 14, y: 34 }, C: { x: 20, y: 29 },
      D: { x: 26, y: 24 }, E: { x: 32, y: 20 }, F: { x: 38, y: 17 },
      G: { x: 44, y: 16 }, H: { x: 50, y: 17 }, I: { x: 56, y: 21 },
      J: { x: 61, y: 26 }, K: { x: 65, y: 32 }, L: { x: 67, y: 38 },
      M: { x: 63, y: 44 }, N: { x: 57, y: 38 },
      // Lower sector — parallel rows (O–Z)
      O: { x: 10, y: 60 }, P: { x: 16, y: 62 }, Q: { x: 22, y: 64 },
      R: { x: 28, y: 66 }, S: { x: 34, y: 68 }, T: { x: 40, y: 70 },
      U: { x: 46, y: 72 }, V: { x: 52, y: 74 },
      W: { x: 49, y: 80 }, X: { x: 42, y: 78 },
      Z: { x: 57, y: 79 },
    },
  },
  'ab7d1fc1-f069-4e3b-a515-8e1204c11247': {
    imageUrl: '/images/maps/alto-bellevue-plant.jpg',
    imageAspect: 3000 / 2120,
    quadraPositions: {
      A: { x: 72, y: 18 }, B: { x: 82, y: 28 }, C: { x: 89, y: 42 },
      D: { x: 52, y: 22 }, E: { x: 62, y: 28 }, F: { x: 86, y: 56 },
      G: { x: 83, y: 64 }, H: { x: 68, y: 12 }, I: { x: 76, y: 42 },
      J: { x: 72, y: 55 }, K: { x: 85, y: 72 }, L: { x: 62, y: 55 },
      M: { x: 57, y: 66 }, N: { x: 68, y: 74 },
    },
  },
};

export const PLAN_VIEW_IDS = new Set(Object.keys(PLAN_CONFIGS));

// ─── Lot Cell ─────────────────────────────────────────────────────────────────
function LotCell({ lot, onClick }: { lot: Lot; onClick: (lot: Lot) => void }) {
  const cfg = STATUS_COLORS[lot.status as StatusKey] ?? STATUS_COLORS.DISPONIVEL;
  return (
    <button
      onClick={() => onClick(lot)}
      style={{
        width: 44, height: 44, borderRadius: 10,
        background: `${cfg.bg}1A`,
        border: `1.5px solid ${cfg.bg}66`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.12s',
        flexShrink: 0, position: 'relative',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = `${cfg.bg}33`;
        el.style.borderColor = cfg.bg;
        el.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = `${cfg.bg}1A`;
        el.style.borderColor = `${cfg.bg}66`;
        el.style.transform = 'scale(1)';
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
        {lot.lot_number}
      </span>
      {lot.special_type === 'ESQUINA' && (
        <div style={{
          position: 'absolute', top: 3, right: 3,
          width: 5, height: 5, borderRadius: 1.5, background: '#60A5FA',
        }} />
      )}
    </button>
  );
}

// ─── Lot Detail Panel ─────────────────────────────────────────────────────────
function LotDetailPanel({
  lot, developmentName, whatsappPhone, onBack, onClose,
}: {
  lot: Lot; developmentName: string; whatsappPhone: string;
  onBack: () => void; onClose: () => void;
}) {
  const cfg = STATUS_COLORS[lot.status as StatusKey] ?? STATUS_COLORS.DISPONIVEL;
  const isAvail = lot.status === 'DISPONIVEL';
  const pricePerM2 = lot.price && lot.area_m2 > 0 ? Math.round(lot.price / lot.area_m2) : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0F2035' }}>
      {/* Header */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <button
            onClick={onBack}
            style={{ background: 'rgba(200,164,74,0.12)', border: '1px solid rgba(200,164,74,0.2)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#C8A44A', marginRight: 10 }}
          >
            <ChevronLeft size={15} />
          </button>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#C8A44A', letterSpacing: '0.2em', textTransform: 'uppercase', flex: 1 }}>
            LOTE SELECIONADO
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2 }}>
            <X size={14} />
          </button>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: cfg.bg, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }} />
          {cfg.label}
        </span>
        <p style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '10px 0 0', lineHeight: 1.1 }}>
          Lote {lot.lot_number}
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
          Quadra {lot.quadra} · {developmentName}
        </p>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <Ruler size={11} style={{ color: '#C8A44A' }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Metragem</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
              {Math.round(lot.area_m2)} m²
            </p>
          </div>
          <div style={{ background: isAvail ? 'rgba(22,163,74,0.1)' : 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px 12px', border: isAvail ? '1px solid rgba(22,163,74,0.25)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <DollarSign size={11} style={{ color: '#C8A44A' }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Valor</span>
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
          <div style={{ background: 'rgba(200,164,74,0.07)', border: '1px solid rgba(200,164,74,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Preço por m²</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#C8A44A' }}>
              {fmtBRL(pricePerM2)}/m²
            </span>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
          {lot.special_type === 'ESQUINA' && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: 'rgba(37,99,235,0.2)', color: '#93C5FD', border: '1px solid rgba(37,99,235,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Lote de Esquina
            </span>
          )}
          {lot.notes && (
            <span style={{ fontSize: 9, fontWeight: 600, padding: '4px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {lot.notes}
            </span>
          )}
        </div>

        {isAvail && (
          <a
            href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Tenho interesse no ${developmentName}, Quadra ${lot.quadra}, Lote ${lot.lot_number} (${Math.round(lot.area_m2)} m²). Gostaria de mais informações e reservar.`)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 12, background: '#C8A44A', color: '#0B1928', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none', marginBottom: 8 }}
          >
            <MessageCircle size={14} />
            Tenho Interesse
          </a>
        )}
        <a
          href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Gostaria de agendar uma visita ao ${developmentName} para ver o Lote ${lot.lot_number} da Quadra ${lot.quadra}.`)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Agendar Visita
        </a>
      </div>
    </div>
  );
}

// ─── Quadra Panel ─────────────────────────────────────────────────────────────
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
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 8, fontWeight: 700, color: '#C8A44A', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 4px' }}>
              QUADRA
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1 }}>
              {quadra}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
          >
            <X size={13} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {Object.entries(counts).map(([st, cnt]) => {
            const cfg = STATUS_COLORS[st as StatusKey];
            if (!cfg) return null;
            return (
              <span key={st} style={{ fontSize: 8, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: `${cfg.bg}22`, color: '#fff', border: `1px solid ${cfg.bg}55`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {cnt} {cfg.label}
              </span>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        <p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 12px' }}>
          {visible.length} lote{visible.length !== 1 ? 's' : ''}{filterStatus !== 'ALL' ? ' · filtro ativo' : ''}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(visible as Lot[]).map((lot: Lot) => <LotCell key={lot.id} lot={lot} onClick={onLotSelect} />)}
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

// ─── Main Component ───────────────────────────────────────────────────────────
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

  // ─── Zoom/pan state ─────────────────────────────────────────────────────────
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastDragPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch pinch state
  const lastTouchRef = useRef<{ x: number; y: number; dist: number } | null>(null);

  // ─── UI state ───────────────────────────────────────────────────────────────
  const [selectedQuadra, setSelectedQuadra] = useState<string | null>(null);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ─── SVG dimensions ─────────────────────────────────────────────────────────
  const SVG_H = config ? Math.round(SVG_W / config.imageAspect) : 700;

  // ─── Derived data ───────────────────────────────────────────────────────────
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
        const cts: Partial<Record<StatusKey, number>> = {};
        for (const l of entry.lots) cts[l.status as StatusKey] = (cts[l.status as StatusKey] ?? 0) + 1;
        if (cts.NEGOCIACAO) entry.dominantStatus = 'NEGOCIACAO';
        else if (cts.PROPRIETARIO) entry.dominantStatus = 'PROPRIETARIO';
        else entry.dominantStatus = 'VENDIDO';
      }
    }
    return map;
  }, [lots]);

  const stats = useMemo(() => {
    const total = lots.length;
    const available = lots.filter(l => l.status === 'DISPONIVEL').length;
    const sold = lots.filter(l => l.status === 'VENDIDO').length;
    const negotiation = lots.filter(l => l.status === 'NEGOCIACAO').length;
    const prices = lots.filter(l => l.price && l.status === 'DISPONIVEL').map(l => l.price!);
    return {
      total, available, sold, negotiation,
      priceMin: prices.length > 0 ? Math.min(...prices) : 0,
      priceMax: prices.length > 0 ? Math.max(...prices) : 0,
    };
  }, [lots]);

  // ─── Zoom helpers ──────────────────────────────────────────────────────────
  const clampScale = useCallback((s: number) => Math.max(0.4, Math.min(8, s)), []);

  const zoomIn = useCallback(() => setScale(s => clampScale(s * 1.3)), [clampScale]);
  const zoomOut = useCallback(() => setScale(s => clampScale(s / 1.3)), [clampScale]);
  const resetView = useCallback(() => { setScale(1); setOffset({ x: 0, y: 0 }); }, []);

  // ─── Mouse events ──────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.87 : 1.15;
    const clientX = e.clientX;
    const clientY = e.clientY;
    setScale(prev => {
      const next = clampScale(prev * factor);
      if (!containerRef.current) return next;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = clientX - rect.left - rect.width / 2;
      const cy = clientY - rect.top - rect.height / 2;
      setOffset(o => ({
        x: cx - (next / prev) * (cx - o.x),
        y: cy - (next / prev) * (cy - o.y),
      }));
      return next;
    });
  }, [clampScale]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-interactive]')) return;
    setIsDragging(true);
    lastDragPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastDragPos.current.x;
    const dy = e.clientY - lastDragPos.current.y;
    setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
    lastDragPos.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // ─── Touch events ──────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist: Math.sqrt(dx * dx + dy * dy),
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!lastTouchRef.current) return;

    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
      lastTouchRef.current = { ...lastTouchRef.current, x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastTouchRef.current.dist > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / lastTouchRef.current.dist;
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      setScale(prev => {
        const next = clampScale(prev * ratio);
        if (!containerRef.current) return next;
        const rect = containerRef.current.getBoundingClientRect();
        const cx = midX - rect.left - rect.width / 2;
        const cy = midY - rect.top - rect.height / 2;
        setOffset(o => ({
          x: cx - (next / prev) * (cx - o.x),
          y: cy - (next / prev) * (cy - o.y),
        }));
        return next;
      });
      lastTouchRef.current = { ...lastTouchRef.current, dist };
    }
  }, []);

  // ─── Fullscreen ─────────────────────────────────────────────────────────────
  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && wrapperRef.current) {
      wrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ─── Actions ────────────────────────────────────────────────────────────────
  const handleLotSelect = useCallback((lot: Lot) => {
    setSelectedLot(lot);
    onLotClick?.(lot);
  }, [onLotClick]);

  const closePanel = useCallback(() => {
    setSelectedQuadra(null);
    setSelectedLot(null);
  }, []);

  if (!config) return null;

  const statusRows = [
    { key: 'ALL',        label: 'Todos',        value: stats.total,       color: '#C8A44A' },
    { key: 'DISPONIVEL', label: 'Disponíveis',  value: stats.available,   color: '#16A34A' },
    { key: 'VENDIDO',    label: 'Vendidos',     value: stats.sold,        color: '#DC2626' },
    { key: 'NEGOCIACAO', label: 'Negociação',   value: stats.negotiation, color: '#D97706' },
  ];

  const containerHeight = isFullscreen ? '100vh' : 'clamp(380px, 58vw, 680px)';

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        background: '#0B1928',
        borderRadius: isFullscreen ? 0 : 20,
        overflow: 'hidden',
        border: isFullscreen ? 'none' : '1px solid rgba(200,164,74,0.15)',
        boxShadow: isFullscreen ? 'none' : '0 12px 56px rgba(0,0,0,0.4)',
        height: containerHeight,
        display: 'flex',
      }}
    >
      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────────── */}
      <div
        className="hidden md:flex flex-col"
        style={{
          width: 220, flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(10,20,34,0.95)',
          zIndex: 5,
        }}
      >
        {/* Filters */}
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 8, fontWeight: 700, color: '#C8A44A', textTransform: 'uppercase', letterSpacing: '0.25em', margin: '0 0 14px' }}>
            FILTROS
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {statusRows.map(row => (
              <button
                key={row.key}
                onClick={() => setFilterStatus(row.key)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', borderRadius: 10,
                  border: `1px solid ${filterStatus === row.key ? row.color + '55' : 'rgba(255,255,255,0.07)'}`,
                  background: filterStatus === row.key ? row.color + '18' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, flexShrink: 0, boxShadow: filterStatus === row.key ? `0 0 6px ${row.color}` : 'none' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: filterStatus === row.key ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    {row.label}
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: filterStatus === row.key ? row.color : 'rgba(255,255,255,0.3)' }}>
                  {row.value}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Price range */}
        {stats.priceMin > 0 && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 10px' }}>
              FAIXA DE PREÇO
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: 0 }}>A partir de</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#C8A44A', margin: '2px 0 8px' }}>{fmtBRL(stats.priceMin)}</p>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Até</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#C8A44A', margin: '2px 0 0' }}>{fmtBRL(stats.priceMax)}</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{ padding: '14px 16px', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 10px' }}>
            LEGENDA
          </p>
          {Object.entries(STATUS_COLORS).slice(0, 4).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: v.bg, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{v.label}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(200,164,74,0.06)', border: '1px solid rgba(200,164,74,0.12)', borderRadius: 8 }}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.5 }}>
              Clique em uma quadra para explorar os lotes
            </p>
          </div>
        </div>
      </div>

      {/* ── CENTER MAP ────────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          background: '#0D1F30',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => { lastTouchRef.current = null; }}
      >
        {/* Transformable layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              willChange: 'transform',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* ── SVG MAP: image + markers in the same coordinate space ── */}
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              style={{
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'block',
              }}
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Layer 1: Base map image */}
              <image
                href={config.imageUrl}
                x="0" y="0"
                width={SVG_W}
                height={SVG_H}
                preserveAspectRatio="xMidYMid meet"
                style={{ filter: 'brightness(0.92) contrast(1.06)' }}
              />

              {/* Layer 2: Quadra markers — in perfect SVG coordinate space */}
              {Object.entries(config.quadraPositions).map(([quadra, pos]) => {
                const qStats = quadraStats.get(quadra);
                if (!qStats) return null;

                const cfg = STATUS_COLORS[qStats.dominantStatus as StatusKey];
                const isSelected = selectedQuadra === quadra;

                // Convert percentage positions to SVG coordinates
                const cx = (pos.x / 100) * SVG_W;
                const cy = (pos.y / 100) * SVG_H;

                // Show only matching lots if filter active
                const displayAvail = filterStatus === 'ALL'
                  ? qStats.available
                  : qStats.lots.filter(l => l.status === filterStatus).length;

                if (filterStatus !== 'ALL' && displayAvail === 0 && filterStatus !== 'VENDIDO') return null;

                return (
                  <g
                    key={quadra}
                    data-interactive="true"
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedQuadra(prev => prev === quadra ? null : quadra);
                      setSelectedLot(null);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Outer glow ring */}
                    <circle
                      cx={cx} cy={cy}
                      r={MARKER_R + 8}
                      fill={isSelected ? cfg.bg : 'transparent'}
                      opacity={isSelected ? 0.15 : 0}
                    />

                    {/* Pulse animation ring (only when selected) */}
                    {isSelected && (
                      <circle
                        cx={cx} cy={cy}
                        r={MARKER_R + 4}
                        fill="none"
                        stroke={cfg.bg}
                        strokeWidth="1.5"
                        opacity="0.5"
                      >
                        <animate
                          attributeName="r"
                          from={MARKER_R + 2}
                          to={MARKER_R + 16}
                          dur="1.8s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          from="0.6"
                          to="0"
                          dur="1.8s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Main circle */}
                    <circle
                      cx={cx} cy={cy}
                      r={MARKER_R}
                      fill={isSelected ? cfg.bg : '#0B1928'}
                      stroke={cfg.bg}
                      strokeWidth={isSelected ? 0 : 2.5}
                      style={{ filter: isSelected ? `drop-shadow(0 0 8px ${cfg.bg}80)` : 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
                    />

                    {/* Quadra letter */}
                    <text
                      x={cx} y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={isSelected ? '#fff' : cfg.bg}
                      fontSize={FONT_SZ}
                      fontWeight="900"
                      fontFamily="'JetBrains Mono', monospace"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {quadra}
                    </text>

                    {/* Available count badge */}
                    {displayAvail > 0 && (
                      <g transform={`translate(${cx + MARKER_R - 3}, ${cy - MARKER_R + 3})`}>
                        <circle
                          r={BADGE_R}
                          fill="#16A34A"
                          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="white"
                          fontSize={BADGE_FONT}
                          fontWeight="800"
                          fontFamily="'JetBrains Mono', monospace"
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
                          {displayAvail > 99 ? '99+' : displayAvail}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* ── HINT TOOLTIP ── */}
        <div
          style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }}
        >
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', background: 'rgba(11,25,40,0.85)', padding: '5px 14px', borderRadius: 99, whiteSpace: 'nowrap', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.07)', display: 'block' }}>
            Arraste · Scroll zoom · Toque numa quadra
          </span>
        </div>

        {/* ── ZOOM CONTROLS ── */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 10 }}>
          {[
            { onClick: zoomIn,    title: 'Aproximar',  icon: <ZoomIn size={14} /> },
            { onClick: zoomOut,   title: 'Afastar',    icon: <ZoomOut size={14} /> },
            { onClick: resetView, title: 'Resetar',    icon: <RotateCcw size={12} /> },
          ].map((btn, i) => (
            <button
              key={i}
              data-interactive="true"
              onClick={btn.onClick}
              title={btn.title}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(11,25,40,0.92)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(200,164,74,0.15)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,164,74,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(11,25,40,0.92)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              {btn.icon}
            </button>
          ))}
        </div>

        {/* ── SCALE INDICATOR ── */}
        <div style={{ position: 'absolute', bottom: 16, left: 64, zIndex: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(11,25,40,0.85)', padding: '5px 9px', borderRadius: 7, backdropFilter: 'blur(8px)', display: 'block' }}>
            {Math.round(scale * 100)}%
          </span>
        </div>

        {/* ── FULLSCREEN BUTTON ── */}
        <button
          data-interactive="true"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10, width: 36, height: 36, borderRadius: 10, background: 'rgba(11,25,40,0.92)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        {/* ── MOBILE FILTER CHIPS ── */}
        <div className="md:hidden" style={{ position: 'absolute', top: 44, left: 8, right: 8, display: 'flex', gap: 5, zIndex: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {statusRows.slice(1).map(row => (
            <button
              key={row.key}
              data-interactive="true"
              onClick={() => setFilterStatus(prev => prev === row.key ? 'ALL' : row.key)}
              style={{ fontSize: 9, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: filterStatus === row.key ? row.color : 'rgba(11,25,40,0.88)', color: '#fff', border: filterStatus === row.key ? 'none' : '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', backdropFilter: 'blur(8px)', boxShadow: filterStatus === row.key ? `0 0 10px ${row.color}66` : 'none' }}
            >
              {row.value} {row.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL (desktop) ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedQuadra && (
          <motion.div
            className="hidden md:block"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 284, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', flexShrink: 0 }}
          >
            <div style={{ width: 284, height: '100%' }}>
              {selectedLot ? (
                <LotDetailPanel
                  lot={selectedLot}
                  developmentName={developmentName}
                  whatsappPhone={whatsappPhone}
                  onBack={() => setSelectedLot(null)}
                  onClose={closePanel}
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

      {/* ── BOTTOM SHEET (mobile) ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedQuadra && (
          <motion.div
            className="md:hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 380 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 20,
              background: '#0F2035',
              borderRadius: '20px 20px 0 0',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
              maxHeight: '70%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Drag handle */}
            <div
              data-interactive="true"
              style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center', flexShrink: 0, cursor: 'grab' }}
            >
              <GripHorizontal size={18} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>

            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
              {selectedLot ? (
                <LotDetailPanel
                  lot={selectedLot}
                  developmentName={developmentName}
                  whatsappPhone={whatsappPhone}
                  onBack={() => setSelectedLot(null)}
                  onClose={closePanel}
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
