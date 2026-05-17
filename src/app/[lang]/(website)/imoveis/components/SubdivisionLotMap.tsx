'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, MapPin, Ruler, DollarSign, Filter, ChevronDown, ChevronUp, BarChart2, List, Map } from 'lucide-react';
import SubdivisionPlanView, { PLAN_VIEW_IDS } from './SubdivisionPlanView';

interface Lot {
  id: string;
  quadra: string;
  lot_number: number;
  area_m2: number;
  price: number | null;
  status: string;
  special_type: string | null;
}

interface SubdivisionLotMapProps {
  developmentId: string;
  developmentName: string;
  whatsappPhone?: string;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  DISPONIVEL:   { label: 'Disponível',  bg: '#16A34A', text: '#fff', light: '#DCFCE7', dark: '#166534' },
  VENDIDO:      { label: 'Vendido',     bg: '#DC2626', text: '#fff', light: '#FEE2E2', dark: '#991B1B' },
  NEGOCIACAO:   { label: 'Negociação',  bg: '#D97706', text: '#fff', light: '#FEF3C7', dark: '#92400E' },
  PROPRIETARIO: { label: 'Proprietário',bg: '#2563EB', text: '#fff', light: '#DBEAFE', dark: '#1E40AF' },
  IGREJA:       { label: 'Igreja',      bg: '#7C3AED', text: '#fff', light: '#EDE9FE', dark: '#5B21B6' },
} as const;

type StatusKey = keyof typeof STATUS;

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const fmtM2 = (v: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v)} m²`;

// ─── Lot Detail Modal ─────────────────────────────────────────────────────────
function LotModal({
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
  const isAvailable = lot.status === 'DISPONIVEL';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBackdrop = useCallback((e: any) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const waMsg = encodeURIComponent(
    `Olá! Tenho interesse no lote ${lot.lot_number} da Quadra ${lot.quadra} do ${developmentName}. ${lot.area_m2}m² — ${lot.price ? fmtBRL(lot.price) : 'Consultar valor'}. Poderia me passar mais informações?`
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}
      onClick={handleBackdrop}
    >
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="w-full sm:max-w-sm rounded-t-[24px] sm:rounded-[20px] overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Status bar */}
        <div style={{ height: 4, background: cfg.bg }} />

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: cfg.light, color: cfg.dark }}
              >
                {cfg.label}
              </span>
              {lot.special_type === 'IGREJA' && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                  Igreja
                </span>
              )}
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0B1928', fontFamily: "var(--fu, 'Outfit', sans-serif)", margin: '4px 0 0' }}>
              Quadra {lot.quadra} — Lote {lot.lot_number}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 px-5 pb-5">
          <div style={{ background: '#F8F6F2', borderRadius: 14, padding: '14px 16px' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Ruler size={13} style={{ color: '#948F84' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Área</span>
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: 0 }}>
              {fmtM2(lot.area_m2)}
            </p>
          </div>
          <div style={{ background: isAvailable ? '#0B1928' : '#F8F6F2', borderRadius: 14, padding: '14px 16px' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <DollarSign size={13} style={{ color: isAvailable ? '#C8A44A' : '#948F84' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: isAvailable ? '#C8A44A' : '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Valor</span>
            </div>
            <p style={{ fontSize: lot.price && lot.price >= 100000 ? 16 : 20, fontWeight: 800, color: isAvailable ? '#fff' : '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: 0 }}>
              {lot.price ? fmtBRL(lot.price) : 'Consultar'}
            </p>
          </div>
        </div>

        {/* Price per m² */}
        {lot.price && lot.area_m2 > 0 && (
          <div className="px-5 pb-4">
            <div style={{ background: '#F0EDE5', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#948F84', fontWeight: 600 }}>Preço por m²</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                {fmtBRL(lot.price / lot.area_m2)}/m²
              </span>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="px-5 pb-6 pt-1">
          {isAvailable ? (
            <a
              href={`https://wa.me/${whatsappPhone}?text=${waMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex items-center justify-center gap-2 w-full h-12 rounded-xl text-[13px] font-bold uppercase tracking-wider overflow-hidden"
              style={{ background: '#0B1928', color: '#fff', fontFamily: "var(--fu, 'Outfit', sans-serif)", textDecoration: 'none' }}
            >
              <MessageCircle size={15} />
              Tenho Interesse
              <span style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6 }} />
            </a>
          ) : (
            <a
              href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Gostaria de informações sobre lotes disponíveis no ${developmentName}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex items-center justify-center gap-2 w-full h-12 rounded-xl text-[13px] font-bold uppercase tracking-wider border border-gray-200 overflow-hidden"
              style={{ color: '#0B1928', fontFamily: "var(--fu, 'Outfit', sans-serif)", textDecoration: 'none', background: '#fff' }}
            >
              <MessageCircle size={15} />
              Ver Outros Lotes
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Individual Lot Cell ───────────────────────────────────────────────────────
function LotCell({ lot, onClick }: { lot: Lot; onClick: (lot: Lot) => void }) {
  const cfg = STATUS[lot.status as StatusKey] ?? STATUS.DISPONIVEL;
  const isAvail = lot.status === 'DISPONIVEL';
  const isChurch = lot.special_type === 'IGREJA';

  return (
    <button
      onClick={() => onClick(lot)}
      title={`Q${lot.quadra} Lote ${lot.lot_number} — ${fmtM2(lot.area_m2)} — ${cfg.label}`}
      style={{
        width: '100%',
        aspectRatio: '1',
        borderRadius: 6,
        border: `1.5px solid ${cfg.bg}22`,
        background: cfg.light,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
        position: 'relative',
        overflow: 'hidden',
        padding: 2,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.12)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 12px ${cfg.bg}44`;
        (e.currentTarget as HTMLButtonElement).style.zIndex = '10';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLButtonElement).style.zIndex = '1';
      }}
    >
      {isAvail && (
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${cfg.bg}18, ${cfg.bg}30)` }} />
      )}
      <span style={{ fontSize: 9, fontWeight: 800, color: cfg.dark, fontFamily: "var(--fm, 'JetBrains Mono', monospace)", lineHeight: 1, position: 'relative', zIndex: 1 }}>
        {isChurch ? '⛪' : lot.lot_number}
      </span>
    </button>
  );
}

// ─── Quadra Block ─────────────────────────────────────────────────────────────
function QuadraBlock({
  quadra,
  lots,
  onLotClick,
  isActive,
  onToggle,
}: {
  quadra: string;
  lots: Lot[];
  onLotClick: (lot: Lot) => void;
  isActive: boolean;
  onToggle: () => void;
}) {
  const available = lots.filter(l => l.status === 'DISPONIVEL').length;
  const total = lots.length;
  const pct = total > 0 ? Math.round((available / total) * 100) : 0;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of lots) counts[l.status] = (counts[l.status] ?? 0) + 1;
    return counts;
  }, [lots]);

  // Grid columns: adaptive based on lot count
  const cols = Math.ceil(Math.sqrt(total));

  return (
    <div style={{ border: '1px solid rgba(184,179,168,0.3)', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        style={{ cursor: 'pointer' }}
      >
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: available > 0 ? '#DCFCE7' : '#F8F6F2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: available > 0 ? '#166534' : '#948F84', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
              {quadra}
            </span>
          </div>
          <div className="text-left">
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0B1928', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
              Quadra {quadra}
            </p>
            <p style={{ fontSize: 11, color: '#948F84', margin: 0 }}>
              {total} lotes · {available} disponível{available !== 1 ? 'is' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mini status pills */}
          <div className="hidden sm:flex items-center gap-1.5 flex-wrap justify-end">
            {Object.entries(statusCounts).slice(0, 3).map(([st, cnt]) => {
              const c = STATUS[st as StatusKey];
              if (!c) return null;
              return (
                <span key={st} style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: c.light, color: c.dark }}>
                  {cnt}
                </span>
              );
            })}
          </div>
          {/* Progress */}
          <div style={{ width: 48, textAlign: 'right' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: available > 0 ? '#16A34A' : '#948F84', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
              {pct}%
            </span>
          </div>
          {isActive ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
        </div>
      </button>

      {/* Lot grid */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 pt-1">
              {/* Availability bar */}
              <div style={{ height: 4, borderRadius: 2, background: '#F0EDE5', marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #16A34A, #22C55E)', borderRadius: 2, transition: 'width 0.4s ease' }} />
              </div>

              {/* Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(cols, 12)}, minmax(0, 1fr))`,
                gap: 4,
              }}>
                {lots.sort((a, b) => a.lot_number - b.lot_number).map(lot => (
                  <LotCell key={lot.id} lot={lot} onClick={onLotClick} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SubdivisionLotMap({ developmentId, developmentName, whatsappPhone = '5581997230455' }: SubdivisionLotMapProps) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [activeQuadras, setActiveQuadras] = useState<Set<string>>(new Set(['A', 'B']));
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minArea, setMinArea] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'plan'>('list');

  const hasPlanView = PLAN_VIEW_IDS.has(developmentId);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('subdivision_lots')
      .select('*')
      .eq('development_id', developmentId)
      .order('quadra')
      .order('lot_number')
      .then(({ data }) => {
        if (data) setLots(data as Lot[]);
        setLoading(false);
      });
  }, [developmentId]);

  const quadras = useMemo(() => {
    const map = new Map<string, Lot[]>();
    for (const lot of lots) {
      if (!map.has(lot.quadra)) map.set(lot.quadra, []);
      map.get(lot.quadra)!.push(lot);
    }
    return map;
  }, [lots]);

  const filteredQuadras = useMemo(() => {
    const result = new Map<string, Lot[]>();
    for (const [q, qLots] of quadras) {
      const filtered = qLots.filter(l => {
        if (filterStatus !== 'ALL' && l.status !== filterStatus) return false;
        if (maxPrice !== null && l.price !== null && l.price > maxPrice) return false;
        if (minArea !== null && l.area_m2 < minArea) return false;
        return true;
      });
      if (filtered.length > 0) result.set(q, filtered);
    }
    return result;
  }, [quadras, filterStatus, maxPrice, minArea]);

  const stats = useMemo(() => {
    const total = lots.length;
    const available = lots.filter(l => l.status === 'DISPONIVEL').length;
    const sold = lots.filter(l => l.status === 'VENDIDO').length;
    const negotiation = lots.filter(l => l.status === 'NEGOCIACAO').length;
    const owner = lots.filter(l => l.status === 'PROPRIETARIO').length;
    const availLots = lots.filter(l => l.price && l.status === 'DISPONIVEL');
    const priceMin = Math.min(...availLots.map(l => l.price!));
    const priceMax = Math.max(...lots.filter(l => l.price).map(l => l.price!));
    const areaMin = Math.min(...availLots.map(l => l.area_m2));
    const areaMax = Math.max(...lots.map(l => l.area_m2));
    return {
      total, available, sold, negotiation, owner,
      priceMin: isFinite(priceMin) ? priceMin : 0,
      priceMax: isFinite(priceMax) ? priceMax : 0,
      areaMin: isFinite(areaMin) ? areaMin : 0,
      areaMax: isFinite(areaMax) ? areaMax : 0,
    };
  }, [lots]);

  // Dynamic filter breakpoints
  const priceBreakpoints = useMemo(() => {
    if (stats.priceMax <= 0) return [];
    const range = stats.priceMax - stats.priceMin;
    const step = Math.ceil(range / 4 / 5000) * 5000;
    return [1, 2, 3, 4].map(i => Math.round((stats.priceMin + step * i) / 1000) * 1000);
  }, [stats.priceMin, stats.priceMax]);

  const areaBreakpoints = useMemo(() => {
    if (stats.areaMax <= 0) return [];
    const min = Math.floor(stats.areaMin / 50) * 50;
    const max = Math.ceil(stats.areaMax / 50) * 50;
    const step = Math.ceil((max - min) / 3 / 50) * 50;
    return [1, 2, 3].map(i => min + step * i).filter(v => v < max);
  }, [stats.areaMin, stats.areaMax]);

  const toggleQuadra = (q: string) => {
    setActiveQuadras(prev => {
      const next = new Set(prev);
      if (next.has(q)) next.delete(q);
      else next.add(q);
      return next;
    });
  };

  const expandAll = () => setActiveQuadras(new Set(quadras.keys()));
  const collapseAll = () => setActiveQuadras(new Set());

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-green-600 animate-spin mb-3" />
        <p style={{ fontSize: 12, color: '#948F84', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Carregando mapa de lotes...</p>
      </div>
    );
  }

  if (lots.length === 0) return null;

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-6 rounded-full" style={{ background: '#C8A44A' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B1928', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
              Mapa de Disponibilidade
            </h2>
          </div>
          <p style={{ fontSize: 14, color: '#948F84', margin: 0, lineHeight: 1.6 }}>
            {stats.available} de {stats.total} lotes disponíveis em {quadras.size} quadras
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle — only when a plant image is available */}
          {hasPlanView && (
            <div
              className="flex items-center rounded-xl p-1"
              style={{ background: '#F0EDE5', border: '1px solid rgba(184,179,168,0.3)' }}
            >
              <button
                onClick={() => setViewMode('list')}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg transition-all"
                style={{
                  background: viewMode === 'list' ? '#fff' : 'transparent',
                  color: viewMode === 'list' ? '#0B1928' : '#948F84',
                  fontSize: 11,
                  fontWeight: 700,
                  boxShadow: viewMode === 'list' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  fontFamily: "var(--fu, 'Outfit', sans-serif)",
                }}
              >
                <List size={12} />
                Lista
              </button>
              <button
                onClick={() => setViewMode('plan')}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg transition-all"
                style={{
                  background: viewMode === 'plan' ? '#fff' : 'transparent',
                  color: viewMode === 'plan' ? '#0B1928' : '#948F84',
                  fontSize: 11,
                  fontWeight: 700,
                  boxShadow: viewMode === 'plan' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  fontFamily: "var(--fu, 'Outfit', sans-serif)",
                }}
              >
                <Map size={12} />
                Planta
              </button>
            </div>
          )}
          <button
            onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl border transition-colors"
            style={{
              borderColor: showFilters ? '#0B1928' : 'rgba(184,179,168,0.4)',
              background: showFilters ? '#0B1928' : '#fff',
              color: showFilters ? '#fff' : '#0B1928',
              fontSize: 12, fontWeight: 700, fontFamily: "var(--fu, 'Outfit', sans-serif)", letterSpacing: '0.08em', textTransform: 'uppercase',
            }}
          >
            <Filter size={13} />
            Filtros
            {(filterStatus !== 'ALL' || maxPrice !== null || minArea !== null) && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C8A44A', display: 'inline-block' }} />
            )}
          </button>
        </div>
      </div>

      {/* ── Stats Bar ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {([
          { label: 'Disponíveis', value: stats.available, color: '#16A34A', bg: '#DCFCE7', key: 'DISPONIVEL' },
          { label: 'Vendidos',    value: stats.sold,      color: '#DC2626', bg: '#FEE2E2', key: 'VENDIDO' },
          { label: 'Negociação',  value: stats.negotiation, color: '#D97706', bg: '#FEF3C7', key: 'NEGOCIACAO' },
          { label: 'Proprietários', value: stats.owner,   color: '#2563EB', bg: '#DBEAFE', key: 'PROPRIETARIO' },
        ] as const).map(item => (
          <button
            key={item.key}
            onClick={() => setFilterStatus(prev => prev === item.key ? 'ALL' : item.key)}
            style={{
              background: filterStatus === item.key ? item.color : item.bg,
              borderRadius: 14, padding: '14px 16px', textAlign: 'left',
              border: `1.5px solid ${filterStatus === item.key ? item.color : 'transparent'}`,
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
          >
            <p style={{ fontSize: 22, fontWeight: 800, color: filterStatus === item.key ? '#fff' : item.color, fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: '0 0 2px' }}>{item.value}</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: filterStatus === item.key ? '#ffffffaa' : item.color, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>{item.label}</p>
          </button>
        ))}
      </div>

      {/* ── Price range info ────────────────────────────────────────────────── */}
      {stats.priceMin > 0 && (
        <div style={{ background: '#F8F6F2', border: '1px solid rgba(184,179,168,0.3)', borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <BarChart2 size={14} style={{ color: '#C8A44A', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#948F84', fontWeight: 600 }}>Lotes disponíveis:</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
            {fmtBRL(stats.priceMin)} — {fmtBRL(stats.priceMax)}
          </span>
          {stats.areaMin > 0 && <span style={{ fontSize: 11, color: '#948F84' }}>· a partir de {Math.round(stats.areaMin)}m²</span>}
        </div>
      )}

      {/* ── Filter Panel ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', marginBottom: 16 }}
          >
            <div style={{ background: '#fff', border: '1px solid rgba(184,179,168,0.3)', borderRadius: 14, padding: '16px' }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: 6, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Status</label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(184,179,168,0.4)', padding: '0 12px', fontSize: 13, color: '#0B1928', background: '#F8F6F2' }}
                  >
                    <option value="ALL">Todos</option>
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: 6, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Preço máx.</label>
                  <select
                    value={maxPrice ?? ''}
                    onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(184,179,168,0.4)', padding: '0 12px', fontSize: 13, color: '#0B1928', background: '#F8F6F2' }}
                  >
                    <option value="">Sem limite</option>
                    {priceBreakpoints.map(p => (
                      <option key={p} value={p}>Até {fmtBRL(p)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: 6, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Área mínima</label>
                  <select
                    value={minArea ?? ''}
                    onChange={e => setMinArea(e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(184,179,168,0.4)', padding: '0 12px', fontSize: 13, color: '#0B1928', background: '#F8F6F2' }}
                  >
                    <option value="">Qualquer tamanho</option>
                    {areaBreakpoints.map(a => (
                      <option key={a} value={a}>{a}m² ou mais</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => { setFilterStatus('ALL'); setMaxPrice(null); setMinArea(null); }}
                  style={{ fontSize: 11, color: '#948F84', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {Object.entries(STATUS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: 3, background: v.bg }} />
            <span style={{ fontSize: 11, color: '#948F84', fontWeight: 600 }}>{v.label}</span>
          </div>
        ))}
      </div>

      {/* ── Plan View ────────────────────────────────────────────────────────── */}
      {viewMode === 'plan' && (
        <SubdivisionPlanView
          lots={lots}
          developmentId={developmentId}
          developmentName={developmentName}
          whatsappPhone={whatsappPhone}
          onLotClick={setSelectedLot}
        />
      )}

      {/* ── Quadra List Controls ─────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p style={{ fontSize: 12, color: '#948F84', fontWeight: 600 }}>
              {filteredQuadras.size} quadra{filteredQuadras.size !== 1 ? 's' : ''} {filterStatus !== 'ALL' ? 'com filtro aplicado' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={expandAll} style={{ fontSize: 11, color: '#C8A44A', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                Expandir todas
              </button>
              <span style={{ color: '#948F84' }}>·</span>
              <button onClick={collapseAll} style={{ fontSize: 11, color: '#948F84', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                Recolher
              </button>
            </div>
          </div>

          {/* ── Quadra Grid ─────────────────────────────────────────────────────── */}
          <div className="space-y-3">
            {[...filteredQuadras.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([quadra, qLots]) => (
              <QuadraBlock
                key={quadra}
                quadra={quadra}
                lots={qLots}
                onLotClick={setSelectedLot}
                isActive={activeQuadras.has(quadra)}
                onToggle={() => toggleQuadra(quadra)}
              />
            ))}
          </div>

          {filteredQuadras.size === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#948F84' }}>
              <MapPin size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontWeight: 600, margin: 0 }}>Nenhum lote encontrado com os filtros aplicados.</p>
            </div>
          )}
        </>
      )}

      {/* ── CTA Strip ───────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 24, background: '#0B1928', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 13, color: '#C8A44A', fontWeight: 700, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
            {stats.available} lote{stats.available !== 1 ? 's' : ''} disponível{stats.available !== 1 ? 'is' : ''}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Escolha o seu. Parcelas a partir do dia 05.
          </p>
        </div>
        <a
          href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Tenho interesse em um lote no ${developmentName}. Gostaria de ver as opções disponíveis.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center gap-2 h-11 px-6 rounded-xl text-[12px] font-bold uppercase tracking-wider overflow-hidden flex-shrink-0"
          style={{ background: '#C8A44A', color: '#0B1928', fontFamily: "var(--fu, 'Outfit', sans-serif)", textDecoration: 'none' }}
        >
          <MessageCircle size={14} />
          Falar com Especialista
        </a>
      </div>

      {/* ── Lot Modal ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedLot && (
          <LotModal
            lot={selectedLot}
            developmentName={developmentName}
            whatsappPhone={whatsappPhone}
            onClose={() => setSelectedLot(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
