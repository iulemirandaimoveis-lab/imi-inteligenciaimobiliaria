'use client';

import React, { useRef, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, MessageCircle, ChevronLeft, Ruler, DollarSign } from 'lucide-react';

interface Lot {
  id: string;
  quadra: string;
  lot_number: number;
  area_m2: number;
  price: number | null;
  status: string;
  special_type?: string | null;
  notes?: string | null;
}

interface QuadraPos { x: number; y: number }

interface PlanConfig {
  imageUrl: string;
  imageAspect: number;
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

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  '8b9f6835-1bd0-4850-80b0-aaef2223300d': {
    imageUrl: '/images/maps/miguel-marques-plant.jpg',
    imageAspect: 2800 / 1981,
    quadraPositions: {
      A: { x: 8,  y: 38 }, B: { x: 13, y: 33 }, C: { x: 18, y: 28 },
      D: { x: 23, y: 23 }, E: { x: 29, y: 19 }, F: { x: 35, y: 16 },
      G: { x: 41, y: 15 }, H: { x: 47, y: 16 }, I: { x: 53, y: 19 },
      J: { x: 59, y: 23 }, K: { x: 64, y: 28 }, L: { x: 67, y: 34 },
      M: { x: 64, y: 40 }, N: { x: 56, y: 35 },
      O: { x: 10, y: 61 }, P: { x: 16, y: 63 }, Q: { x: 22, y: 65 },
      R: { x: 28, y: 67 }, S: { x: 34, y: 69 }, T: { x: 40, y: 71 },
      U: { x: 46, y: 73 }, V: { x: 51, y: 75 }, W: { x: 48, y: 80 },
      X: { x: 41, y: 78 },
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

// ─── Lot Cell ────────────────────────────────────────────────────────────────
function LotCell({ lot, onClick }: { lot: Lot; onClick: (lot: Lot) => void }) {
  const cfg = STATUS_COLORS[lot.status as StatusKey] ?? STATUS_COLORS.DISPONIVEL;
  return (
    <button
      onClick={() => onClick(lot)}
      title={`Lote ${lot.lot_number} · ${Math.round(lot.area_m2)} m²${lot.price ? ' · ' + fmtBRL(lot.price) : ''}`}
      style={{
        position: 'relative',
        width: 38,
        height: 38,
        borderRadius: 8,
        background: cfg.light + '22',
        border: `1.5px solid ${cfg.bg}66`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        flexShrink: 0,
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = cfg.bg + '33';
        el.style.borderColor = cfg.bg;
        el.style.transform = 'scale(1.12)';
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = cfg.light + '22';
        el.style.borderColor = cfg.bg + '66';
        el.style.transform = 'scale(1)';
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 800, color: cfg.light, fontFamily: "var(--fm,'JetBrains Mono',monospace)", lineHeight: 1 }}>
        {lot.lot_number}
      </span>
      {lot.special_type === 'ESQUINA' && (
        <div style={{ position: 'absolute', top: 2, right: 2, width: 4, height: 4, borderRadius: 1, background: '#60A5FA' }} />
      )}
    </button>
  );
}

// ─── Lot Detail Panel ────────────────────────────────────────────────────────
function LotDetailPanel({
  lot, developmentName, whatsappPhone, onBack, onClose,
}: {
  lot: Lot; developmentName: string; whatsappPhone: string; onBack: () => void; onClose: () => void;
}) {
  const cfg = STATUS_COLORS[lot.status as StatusKey] ?? STATUS_COLORS.DISPONIVEL;
  const isAvail = lot.status === 'DISPONIVEL';
  const pricePerM2 = lot.price && lot.area_m2 > 0 ? Math.round(lot.price / lot.area_m2) : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0F2035' }}>
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <button onClick={onBack} style={{ background: 'rgba(200,164,74,0.12)', border: '1px solid rgba(200,164,74,0.2)', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#C8A44A', flexShrink: 0, marginRight: 8 }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#C8A44A', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "var(--fu,'Outfit',sans-serif)", flex: 1 }}>
            LOTE SELECIONADO
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0 }}>
            <X size={14} />
          </button>
        </div>
        <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: cfg.bg, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "var(--fu,'Outfit',sans-serif)" }}>
          {cfg.label}
        </span>
        <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '8px 0 0', fontFamily: "var(--fu,'Outfit',sans-serif)", lineHeight: 1.1 }}>
          Lote {lot.lot_number}
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>
          Quadra {lot.quadra} · {developmentName}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
              <Ruler size={10} style={{ color: '#C8A44A' }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Metragem</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0, fontFamily: "var(--fm,'JetBrains Mono',monospace)" }}>
              {Math.round(lot.area_m2)} m²
            </p>
          </div>
          <div style={{ background: isAvail ? 'rgba(22,163,74,0.12)' : 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 10px', border: isAvail ? '1px solid rgba(22,163,74,0.25)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
              <DollarSign size={10} style={{ color: '#C8A44A' }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Valor</span>
            </div>
            {lot.price ? (
              <p style={{ fontSize: 14, fontWeight: 800, color: isAvail ? '#4ADE80' : '#fff', margin: 0, fontFamily: "var(--fm,'JetBrains Mono',monospace)", wordBreak: 'break-word' }}>
                {fmtBRL(lot.price)}
              </p>
            ) : (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Consultar</p>
            )}
          </div>
        </div>

        {pricePerM2 && (
          <div style={{ background: 'rgba(200,164,74,0.07)', border: '1px solid rgba(200,164,74,0.15)', borderRadius: 10, padding: '10px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Preço por m²</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#C8A44A', fontFamily: "var(--fm,'JetBrains Mono',monospace)" }}>
              {fmtBRL(pricePerM2)}/m²
            </span>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {lot.special_type === 'ESQUINA' && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(37,99,235,0.2)', color: '#93C5FD', border: '1px solid rgba(37,99,235,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Lote de Esquina
            </span>
          )}
          {lot.notes && (
            <span style={{ fontSize: 9, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {lot.notes}
            </span>
          )}
        </div>

        {isAvail && (
          <a
            href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Tenho interesse no ${developmentName}, Quadra ${lot.quadra}, Lote ${lot.lot_number} (${Math.round(lot.area_m2)} m²). Gostaria de mais informações e reservar.`)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, background: '#C8A44A', color: '#0B1928', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none', fontFamily: "var(--fu,'Outfit',sans-serif)", marginBottom: 8 }}
          >
            <MessageCircle size={14} />
            Tenho Interesse
          </a>
        )}
        <a
          href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Gostaria de agendar uma visita ao ${developmentName} para ver o Lote ${lot.lot_number} da Quadra ${lot.quadra}.`)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none', fontFamily: "var(--fu,'Outfit',sans-serif)", border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Agendar Visita
        </a>
      </div>
    </div>
  );
}

// ─── Quadra Panel ────────────────────────────────────────────────────────────
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
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#C8A44A', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "var(--fu,'Outfit',sans-serif)" }}>
            QUADRA {quadra}
          </span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
            <X size={12} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {Object.entries(counts).map(([st, cnt]) => {
            const cfg = STATUS_COLORS[st as StatusKey];
            if (!cfg) return null;
            return (
              <span key={st} style={{ fontSize: 8, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: cfg.bg + '25', color: cfg.light, border: `1px solid ${cfg.bg}44`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {cnt} {cfg.label}
              </span>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 10px', fontFamily: "var(--fu,'Outfit',sans-serif)" }}>
          {visible.length} lotes{filterStatus !== 'ALL' ? ' · filtro ativo' : ''}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {visible.map(lot => <LotCell key={lot.id} lot={lot} onClick={onLotSelect} />)}
        </div>
        {visible.length === 0 && (
          <p style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: 0 }}>
            Nenhum lote neste filtro
          </p>
        )}
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <a
          href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Tenho interesse em lotes da Quadra ${quadra} no ${developmentName}. Quais estão disponíveis?`)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, background: 'rgba(200,164,74,0.1)', color: '#C8A44A', fontSize: 10, fontWeight: 700, textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid rgba(200,164,74,0.25)', fontFamily: "var(--fu,'Outfit',sans-serif)" }}
        >
          <MessageCircle size={12} />
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
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [selectedQuadra, setSelectedQuadra] = useState<string | null>(null);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const containerRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ x: number; y: number; dist: number } | null>(null);

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

  const handleLotSelect = useCallback((lot: Lot) => {
    setSelectedLot(lot);
    onLotClick?.(lot);
  }, [onLotClick]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.max(0.3, Math.min(6, s * (e.deltaY > 0 ? 0.88 : 1.14))));
  }, []);
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button,a')) return;
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, []);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setTranslate(t => ({ x: t.x + (e.clientX - lastMouse.x), y: t.y + (e.clientY - lastMouse.y) }));
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastMouse]);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);

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
    } else if (e.touches.length === 2 && touchRef.current.dist > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setScale(s => Math.max(0.3, Math.min(6, s * dist / touchRef.current!.dist)));
      touchRef.current = { ...touchRef.current, dist };
    }
  }, []);

  const zoomIn = useCallback(() => setScale(s => Math.min(6, s * 1.3)), []);
  const zoomOut = useCallback(() => setScale(s => Math.max(0.3, s * 0.77)), []);
  const reset = useCallback(() => { setScale(1); setTranslate({ x: 0, y: 0 }); }, []);

  if (!config) return null;

  const imgW = 520 * config.imageAspect;

  const statusRows = [
    { key: 'ALL',        label: 'Todos',       value: stats.total,      color: '#C8A44A' },
    { key: 'DISPONIVEL', label: 'Disponíveis', value: stats.available,  color: '#16A34A' },
    { key: 'VENDIDO',    label: 'Vendidos',    value: stats.sold,       color: '#DC2626' },
    { key: 'NEGOCIACAO', label: 'Negociação',  value: stats.negotiation, color: '#D97706' },
  ];

  return (
    <>
      {/* ── 3-panel immersive container ─────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          height: 600,
          background: '#0B1928',
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid rgba(200,164,74,0.15)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.35)',
        }}
      >
        {/* ── LEFT SIDEBAR ── */}
        <div
          className="hidden md:flex flex-col"
          style={{ width: 216, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Header */}
          <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 8, fontWeight: 700, color: '#C8A44A', textTransform: 'uppercase', letterSpacing: '0.25em', margin: '0 0 14px', fontFamily: "var(--fu,'Outfit',sans-serif)" }}>
              FILTROS
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {statusRows.map(row => (
                <button
                  key={row.key}
                  onClick={() => setFilterStatus(row.key)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 10,
                    border: `1px solid ${filterStatus === row.key ? row.color + '55' : 'rgba(255,255,255,0.07)'}`,
                    background: filterStatus === row.key ? row.color + '18' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: filterStatus === row.key ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: "var(--fu,'Outfit',sans-serif)" }}>
                      {row.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: filterStatus === row.key ? row.color : 'rgba(255,255,255,0.3)', fontFamily: "var(--fm,'JetBrains Mono',monospace)" }}>
                    {row.value}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          {stats.priceMin > 0 && (
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 10px', fontFamily: "var(--fu,'Outfit',sans-serif)" }}>
                FAIXA DE PREÇO
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '0 0 3px' }}>De</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#C8A44A', margin: '0 0 4px', fontFamily: "var(--fm,'JetBrains Mono',monospace)" }}>
                {fmtBRL(stats.priceMin)}
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '0 0 3px' }}>Até</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#C8A44A', margin: 0, fontFamily: "var(--fm,'JetBrains Mono',monospace)" }}>
                {fmtBRL(stats.priceMax)}
              </p>
            </div>
          )}

          {/* Legend */}
          <div style={{ padding: '14px 16px', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 10px', fontFamily: "var(--fu,'Outfit',sans-serif)" }}>
              LEGENDA
            </p>
            {Object.entries(STATUS_COLORS).slice(0, 4).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: v.bg, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: "var(--fu,'Outfit',sans-serif)" }}>
                  {v.label}
                </span>
              </div>
            ))}
            <div style={{ marginTop: 10, padding: '7px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', margin: 0, lineHeight: 1.5 }}>
                Clique numa quadra para ver os lotes disponíveis
              </p>
            </div>
          </div>
        </div>

        {/* ── CENTER: plant image ── */}
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
            <div style={{ position: 'relative', width: imgW, height: 520 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.imageUrl}
                alt="Planta do empreendimento"
                draggable={false}
                style={{ display: 'block', width: '100%', height: '100%', objectFit: 'fill', filter: 'brightness(0.92) contrast(1.05)' }}
              />

              {/* Quadra markers */}
              {Object.entries(config.quadraPositions).map(([quadra, pos]) => {
                const qStats = quadraStats.get(quadra);
                if (!qStats) return null;
                const cfg = STATUS_COLORS[qStats.dominantStatus];
                const isSelected = selectedQuadra === quadra;
                return (
                  <button
                    key={quadra}
                    onClick={e => { e.stopPropagation(); setSelectedQuadra(prev => prev === quadra ? null : quadra); setSelectedLot(null); }}
                    style={{
                      position: 'absolute',
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: `translate(-50%, -50%) scale(${isSelected ? 1.2 : 1})`,
                      zIndex: isSelected ? 15 : 5,
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    {/* Pulse ring when selected */}
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        inset: -6,
                        borderRadius: '50%',
                        border: `2px solid ${cfg.bg}`,
                        opacity: 0.6,
                        animation: 'plan-pulse 1.5s ease-out infinite',
                        pointerEvents: 'none',
                      }} />
                    )}
                    {/* Circle */}
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: isSelected ? cfg.bg : '#0B1928',
                      border: `2.5px solid ${cfg.bg}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isSelected
                        ? `0 0 0 4px ${cfg.bg}33, 0 6px 20px rgba(0,0,0,0.6)`
                        : '0 2px 10px rgba(0,0,0,0.6)',
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: isSelected ? '#fff' : cfg.bg, fontFamily: "var(--fm,'JetBrains Mono',monospace)", lineHeight: 1 }}>
                        {quadra}
                      </span>
                    </div>
                    {/* Available count badge */}
                    {qStats.available > 0 && (
                      <div style={{
                        position: 'absolute',
                        bottom: -13,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#16A34A',
                        color: '#fff',
                        fontSize: 8,
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: 99,
                        whiteSpace: 'nowrap',
                        fontFamily: "var(--fm,'JetBrains Mono',monospace)",
                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                        pointerEvents: 'none',
                      }}>
                        {qStats.available}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top hint */}
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)', background: 'rgba(11,25,40,0.85)', padding: '4px 14px', borderRadius: 99, whiteSpace: 'nowrap', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.07)' }}>
              Arraste · Scroll = zoom · Clique numa quadra
            </span>
          </div>

          {/* Zoom controls */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 10 }}>
            {[
              { onClick: zoomIn,  title: 'Zoom in',   icon: <ZoomIn size={13} /> },
              { onClick: zoomOut, title: 'Zoom out',  icon: <ZoomOut size={13} /> },
              { onClick: reset,   title: 'Resetar',   icon: <RotateCcw size={11} /> },
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick} title={btn.title} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(11,25,40,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                {btn.icon}
              </button>
            ))}
          </div>

          {/* Scale indicator */}
          <div style={{ position: 'absolute', bottom: 16, left: 60, zIndex: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(11,25,40,0.85)', padding: '4px 8px', borderRadius: 6, fontFamily: "var(--fm,'JetBrains Mono',monospace)", backdropFilter: 'blur(8px)' }}>
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Mobile filter chips overlay */}
          <div className="md:hidden" style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4, zIndex: 10, flexWrap: 'wrap' }}>
            {statusRows.slice(1).map(row => (
              <button key={row.key} onClick={() => setFilterStatus(prev => prev === row.key ? 'ALL' : row.key)} style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: filterStatus === row.key ? row.color : 'rgba(11,25,40,0.85)', color: '#fff', border: filterStatus === row.key ? 'none' : '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', backdropFilter: 'blur(6px)' }}>
                {row.value} {row.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <AnimatePresence>
          {selectedQuadra && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 276, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 32, stiffness: 360 }}
              style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', flexShrink: 0 }}
            >
              <div style={{ width: 276, height: '100%' }}>
                {selectedLot ? (
                  <LotDetailPanel
                    lot={selectedLot}
                    developmentName={developmentName}
                    whatsappPhone={whatsappPhone}
                    onBack={() => setSelectedLot(null)}
                    onClose={() => { setSelectedLot(null); setSelectedQuadra(null); }}
                  />
                ) : quadraStats.has(selectedQuadra) ? (
                  <QuadraPanel
                    quadra={selectedQuadra}
                    lots={quadraStats.get(selectedQuadra)!.lots}
                    developmentName={developmentName}
                    whatsappPhone={whatsappPhone}
                    filterStatus={filterStatus}
                    onClose={() => setSelectedQuadra(null)}
                    onLotSelect={handleLotSelect}
                  />
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CSS animation for pulse ring */}
      <style>{`
        @keyframes plan-pulse {
          0%   { transform: scale(0.85); opacity: 0.8; }
          100% { transform: scale(1.6);  opacity: 0; }
        }
      `}</style>
    </>
  );
}
