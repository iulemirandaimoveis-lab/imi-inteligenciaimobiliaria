'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, MessageCircle, MapPin, Home } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
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

const STATUS = {
  DISPONIVEL:   { bg: '#16A34A', light: '#DCFCE7', dark: '#166534', label: 'Disponível',   ring: '#86EFAC' },
  VENDIDO:      { bg: '#DC2626', light: '#FEE2E2', dark: '#991B1B', label: 'Vendido',      ring: '#FCA5A5' },
  NEGOCIACAO:   { bg: '#D97706', light: '#FEF3C7', dark: '#92400E', label: 'Negociação',   ring: '#FCD34D' },
  PROPRIETARIO: { bg: '#2563EB', light: '#DBEAFE', dark: '#1E40AF', label: 'Proprietário', ring: '#93C5FD' },
  IGREJA:       { bg: '#7C3AED', light: '#EDE9FE', dark: '#5B21B6', label: 'Igreja',       ring: '#C4B5FD' },
} as const;
type StatusKey = keyof typeof STATUS;

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

// ─── Plan configs (SVG schematic) ─────────────────────────────────────────────
// Positions are % of a 100×90 viewBox. Background drawn as SVG, no image needed.
interface PlanConfig {
  label: string;
  quadraPositions: Record<string, { x: number; y: number }>;
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  // ── Alto Bellevue ──────────────────────────────────────────────────────────
  'ab7d1fc1-f069-4e3b-a515-8e1204c11247': {
    label: 'Condomínio Alto Bellevue',
    quadraPositions: {
      // Top arc (entry side)
      H: { x: 67, y: 11 }, A: { x: 76, y: 16 }, B: { x: 85, y: 25 },
      // Right arc
      C: { x: 91, y: 38 }, I: { x: 79, y: 38 }, F: { x: 89, y: 52 },
      // Lower right
      G: { x: 86, y: 62 }, J: { x: 75, y: 53 }, K: { x: 88, y: 72 },
      // Lower center / left
      N: { x: 70, y: 72 }, L: { x: 63, y: 58 }, M: { x: 58, y: 68 },
      // Upper left
      D: { x: 52, y: 20 }, E: { x: 61, y: 26 },
    },
  },
  // ── Loteamento Miguel Marques ──────────────────────────────────────────────
  '8b9f6835-1bd0-4850-80b0-aaef2223300d': {
    label: 'Loteamento Miguel Marques',
    quadraPositions: {
      // Upper diagonal section (A–N) — arc from lower-left → upper-right → back
      A: { x: 8,  y: 41 }, B: { x: 14, y: 35 }, C: { x: 20, y: 29 },
      D: { x: 26, y: 24 }, E: { x: 32, y: 20 }, F: { x: 38, y: 17 },
      G: { x: 44, y: 16 }, H: { x: 50, y: 17 }, I: { x: 56, y: 20 },
      J: { x: 62, y: 24 }, K: { x: 67, y: 29 }, L: { x: 70, y: 36 },
      M: { x: 67, y: 42 }, N: { x: 58, y: 37 },
      // Lower section (O–X)
      O: { x: 10, y: 62 }, P: { x: 17, y: 64 }, Q: { x: 24, y: 67 },
      R: { x: 31, y: 69 }, S: { x: 38, y: 71 }, T: { x: 45, y: 73 },
      U: { x: 52, y: 75 }, V: { x: 58, y: 76 }, W: { x: 55, y: 82 },
      X: { x: 46, y: 81 },
    },
  },
};

export const PLAN_VIEW_IDS = new Set(Object.keys(PLAN_CONFIGS));

// ─── SVG backgrounds ──────────────────────────────────────────────────────────
function AltoBelevueBg() {
  return (
    <>
      {/* Outer perimeter — horseshoe/C shape opening to lower-left */}
      <path
        d="M 45,8 C 58,5 76,5 88,10 C 96,15 100,26 100,38 C 100,52 96,65 88,74 C 80,82 66,87 52,87 C 38,87 24,82 16,72 C 9,63 8,52 12,44 C 15,38 22,35 28,39 C 33,42 34,50 38,58 C 44,68 56,73 67,72 C 78,71 87,63 90,53 C 93,44 91,33 87,25 C 83,18 75,13 66,11 C 58,9 50,11 46,16"
        fill="#E8F5E9" stroke="#A5D6A7" strokeWidth="0.6" fillRule="nonzero"
      />
      {/* Inner recreation area */}
      <ellipse cx="66" cy="46" rx="14" ry="16" fill="#C8E6C9" stroke="#81C784" strokeWidth="0.5" />
      <text x="66" y="44" textAnchor="middle" fontSize="3.2" fill="#2E7D32" fontFamily="Outfit,sans-serif" fontWeight="700">Área</text>
      <text x="66" y="49" textAnchor="middle" fontSize="3.2" fill="#2E7D32" fontFamily="Outfit,sans-serif" fontWeight="700">de Lazer</text>
      {/* Entry arrow */}
      <path d="M 94,8 L 100,12 L 94,16" stroke="#C8A44A" strokeWidth="1" fill="none" strokeLinecap="round" />
      <text x="96" y="7" fontSize="2.8" fill="#C8A44A" fontFamily="sans-serif" fontWeight="600">Entrada</text>
      {/* BR-423 hint at bottom */}
      <text x="50" y="92" textAnchor="middle" fontSize="2.5" fill="#aaa" fontFamily="sans-serif">BR-423</text>
      <line x1="20" y1="91" x2="80" y2="91" stroke="#ccc" strokeWidth="0.8" strokeDasharray="2,2" />
    </>
  );
}

function MiguelMarquesBg() {
  return (
    <>
      {/* Upper diagonal section */}
      <path
        d="M 3,48 L 10,10 L 78,10 L 71,48 Z"
        fill="#E3F0FF" stroke="#90CAF9" strokeWidth="0.6"
      />
      {/* Streets inside upper section */}
      <line x1="7" y1="32" x2="74" y2="32" stroke="#D4C08A" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
      <line x1="5" y1="22" x2="76" y2="22" stroke="#D4C08A" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
      {/* Connecting road between sections */}
      <path
        d="M 2,52 L 72,52 L 69,57 L -1,57"
        fill="#E8D59A" stroke="#C8B97A" strokeWidth="0.5"
      />
      <text x="36" y="56" textAnchor="middle" fontSize="2.6" fill="#8B7355" fontFamily="sans-serif" fontWeight="600">Via Principal</text>
      {/* Lower section */}
      <path
        d="M 4,60 L 4,88 L 65,88 L 65,60 Z"
        fill="#E3F0FF" stroke="#90CAF9" strokeWidth="0.6"
      />
      {/* Streets inside lower section */}
      <line x1="4" y1="75" x2="65" y2="75" stroke="#D4C08A" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
      {/* Labels */}
      <text x="40" y="20" textAnchor="middle" fontSize="3" fill="#1565C0" fontFamily="Outfit,sans-serif" fontWeight="700">Seção Norte (A–N)</text>
      <text x="34" y="73" textAnchor="middle" fontSize="3" fill="#1565C0" fontFamily="Outfit,sans-serif" fontWeight="700">Seção Sul (O–X)</text>
    </>
  );
}

// ─── Lot Card (inside bottom sheet) ───────────────────────────────────────────
function LotCard({
  lot, whatsappPhone, developmentName, onSelect,
}: { lot: Lot; whatsappPhone: string; developmentName: string; onSelect: (l: Lot) => void }) {
  const cfg = STATUS[lot.status as StatusKey] ?? STATUS.DISPONIVEL;
  const isAvailable = lot.status === 'DISPONIVEL';
  const waMsg = encodeURIComponent(
    `Olá! Tenho interesse no Lote ${lot.lot_number} da Quadra ${lot.quadra} no ${developmentName}. ` +
    (lot.price ? `Preço: ${fmtBRL(lot.price)}. ` : '') +
    `Área: ${Math.round(lot.area_m2)}m². Poderia me dar mais informações?`
  );

  return (
    <button
      onClick={() => onSelect(lot)}
      className="w-full text-left"
      style={{
        background: isAvailable ? '#fff' : '#FAFAFA',
        border: `1.5px solid ${isAvailable ? cfg.ring : 'rgba(184,179,168,0.3)'}`,
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Lot number badge */}
      <div style={{
        minWidth: 44, height: 44, borderRadius: 12,
        background: cfg.light, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: cfg.dark, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Lote</span>
        <span style={{ fontSize: 17, fontWeight: 900, color: cfg.dark, fontFamily: "var(--fm,'JetBrains Mono',monospace)", lineHeight: 1 }}>
          {lot.lot_number}
        </span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: cfg.dark,
            background: cfg.light, padding: '2px 7px', borderRadius: 99,
          }}>
            {cfg.label}
          </span>
          {lot.special_type === 'ESQUINA' && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#92400E', background: '#FEF3C7', padding: '2px 7px', borderRadius: 99 }}>
              Esquina
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0B1928', fontFamily: "var(--fm,'JetBrains Mono',monospace)" }}>
            {Math.round(lot.area_m2)}m²
          </span>
          {lot.price && (
            <span style={{ fontSize: 13, fontWeight: 800, color: '#16A34A', fontFamily: "var(--fm,'JetBrains Mono',monospace)" }}>
              {fmtBRL(lot.price)}
            </span>
          )}
        </div>
        {lot.notes && (
          <p style={{ fontSize: 11, color: '#948F84', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lot.notes}
          </p>
        )}
      </div>

      {/* WhatsApp CTA (only for available) */}
      {isAvailable && (
        <a
          href={`https://wa.me/${whatsappPhone}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 38, height: 38, borderRadius: 10,
            background: '#16A34A', color: '#fff', flexShrink: 0,
            textDecoration: 'none',
          }}
        >
          <MessageCircle size={16} />
        </a>
      )}
    </button>
  );
}

// ─── Bottom Sheet ──────────────────────────────────────────────────────────────
function QuadraSheet({
  quadra, lots, developmentName, whatsappPhone,
  onClose, onLotClick,
}: {
  quadra: string; lots: Lot[];
  developmentName: string; whatsappPhone: string;
  onClose: () => void; onLotClick: (l: Lot) => void;
}) {
  const [filter, setFilter] = useState<'ALL' | 'DISPONIVEL'>('DISPONIVEL');
  const available = lots.filter(l => l.status === 'DISPONIVEL');
  const displayed = filter === 'DISPONIVEL' ? available : [...lots].sort((a, b) => a.lot_number - b.lot_number);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50"
      style={{ maxHeight: '78vh', display: 'flex', flexDirection: 'column', borderRadius: '20px 20px 0 0', background: '#fff', boxShadow: '0 -8px 40px rgba(0,0,0,0.22)' }}
    >
      {/* Handle */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E0E0E0' }} />
      </div>

      {/* Header */}
      <div style={{ padding: '12px 20px 10px', borderBottom: '1px solid rgba(184,179,168,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F8F6F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#0B1928', fontFamily: "var(--fm,'JetBrains Mono',monospace)" }}>{quadra}</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0B1928', fontFamily: "var(--fu,'Outfit',sans-serif)" }}>
                Quadra {quadra}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#948F84' }}>
                {lots.length} lotes · {available.length} disponív{available.length !== 1 ? 'eis' : 'el'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ width: 32, height: 32, borderRadius: '50%', background: '#F0EDE5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: '8px 20px', display: 'flex', gap: 6, flexShrink: 0 }}>
        {([['DISPONIVEL', `✅ Disponíveis (${available.length})`], ['ALL', `🏘️ Todos (${lots.length})`]] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            style={{
              height: 32, paddingLeft: 12, paddingRight: 12, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: filter === k ? '#0B1928' : '#F0EDE5',
              color: filter === k ? '#fff' : '#948F84',
              fontSize: 12, fontWeight: 700, fontFamily: "var(--fu,'Outfit',sans-serif)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lot list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 24px', WebkitOverflowScrolling: 'touch' }}>
        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#948F84' }}>
            <Home size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
            <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>
              {filter === 'DISPONIVEL' ? 'Nenhum lote disponível nesta quadra.' : 'Nenhum lote.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayed.map(lot => (
              <LotCard
                key={lot.id}
                lot={lot}
                whatsappPhone={whatsappPhone}
                developmentName={developmentName}
                onSelect={onLotClick}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
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
  const [selectedQuadra, setSelectedQuadra] = useState<string | null>(null);

  // Per-quadra stats from lot data
  const quadraStats = useMemo(() => {
    const map = new Map<string, { lots: Lot[]; available: number; dominantStatus: StatusKey }>();
    for (const lot of lots) {
      if (!map.has(lot.quadra)) map.set(lot.quadra, { lots: [], available: 0, dominantStatus: 'VENDIDO' });
      const entry = map.get(lot.quadra)!;
      entry.lots.push(lot);
      if (lot.status === 'DISPONIVEL') entry.available++;
    }
    for (const [, e] of map) {
      if (e.available > 0) { e.dominantStatus = 'DISPONIVEL'; continue; }
      const cts: Partial<Record<StatusKey, number>> = {};
      for (const l of e.lots) cts[l.status as StatusKey] = (cts[l.status as StatusKey] ?? 0) + 1;
      if ((cts.NEGOCIACAO ?? 0) > 0) e.dominantStatus = 'NEGOCIACAO';
      else if ((cts.PROPRIETARIO ?? 0) > 0) e.dominantStatus = 'PROPRIETARIO';
      else e.dominantStatus = 'VENDIDO';
    }
    return map;
  }, [lots]);

  if (!config) return null;

  const isAltoBellevue = developmentId === 'ab7d1fc1-f069-4e3b-a515-8e1204c11247';

  return (
    <div>
      {/* ── Map header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={14} style={{ color: '#C8A44A' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1928', fontFamily: "var(--fu,'Outfit',sans-serif)" }}>
            Planta Esquemática — Toque numa quadra
          </span>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['DISPONIVEL', 'VENDIDO', 'NEGOCIACAO'] as StatusKey[]).map(k => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS[k].bg }} />
              <span style={{ fontSize: 9, color: '#948F84', fontWeight: 600 }}>{STATUS[k].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SVG Schematic ──────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#F8F6F2',
          borderRadius: 16,
          border: '1px solid rgba(184,179,168,0.3)',
          overflow: 'hidden',
          width: '100%',
          position: 'relative',
        }}
      >
        <svg
          viewBox="0 0 100 95"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block', width: '100%', maxHeight: 480 }}
        >
          {/* Background schematic */}
          {isAltoBellevue ? <AltoBelevueBg /> : <MiguelMarquesBg />}

          {/* Quadra interactive zones */}
          {Object.entries(config.quadraPositions).map(([quadra, pos]) => {
            const stats = quadraStats.get(quadra);
            const isSelected = selectedQuadra === quadra;
            const hasData = !!stats;

            // Color: use lot data if available, else neutral
            const statusKey: StatusKey = stats?.dominantStatus ?? 'DISPONIVEL';
            const cfg = STATUS[statusKey];
            const bg = hasData ? cfg.bg : '#B8B3A8';
            const ring = hasData ? cfg.ring : '#D0CCC4';

            return (
              <g
                key={quadra}
                onClick={() => setSelectedQuadra(prev => prev === quadra ? null : quadra)}
                style={{ cursor: 'pointer' }}
              >
                {/* Outer glow when selected */}
                {isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={6.5}
                    fill="none"
                    stroke={ring}
                    strokeWidth={2}
                    opacity={0.7}
                  />
                )}
                {/* Main bubble */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSelected ? 5 : 4.2}
                  fill={bg}
                  stroke="#fff"
                  strokeWidth={isSelected ? 1.2 : 0.8}
                  style={{ transition: 'r 0.15s ease' }}
                />
                {/* Label */}
                <text
                  x={pos.x}
                  y={pos.y + 0.9}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="3.2"
                  fontWeight="900"
                  fill="#fff"
                  fontFamily="'JetBrains Mono', monospace"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {quadra}
                </text>
                {/* Availability dot (small) */}
                {hasData && stats.available > 0 && (
                  <circle
                    cx={pos.x + 3.8}
                    cy={pos.y - 3.8}
                    r={1.5}
                    fill="#fff"
                    stroke={STATUS.DISPONIVEL.bg}
                    strokeWidth={0.8}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* No data notice */}
        {lots.length === 0 && (
          <div style={{
            position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.9)', borderRadius: 10, padding: '6px 14px',
            fontSize: 11, color: '#948F84', fontWeight: 600, whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            Dados de lotes em breve — planta indicativa
          </div>
        )}
      </div>

      {/* ── Quick stats strip ──────────────────────────────────────────────── */}
      {lots.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
          {[...quadraStats.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([q, s]) => (
              <button
                key={q}
                onClick={() => setSelectedQuadra(prev => prev === q ? null : q)}
                style={{
                  flexShrink: 0,
                  height: 34,
                  paddingLeft: 10,
                  paddingRight: 10,
                  borderRadius: 10,
                  border: `1.5px solid ${selectedQuadra === q ? STATUS[s.dominantStatus].bg : 'rgba(184,179,168,0.3)'}`,
                  background: selectedQuadra === q ? STATUS[s.dominantStatus].light : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{
                  fontSize: 11, fontWeight: 900, color: STATUS[s.dominantStatus].dark,
                  fontFamily: "var(--fm,'JetBrains Mono',monospace)",
                }}>
                  {q}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: s.available > 0 ? '#16A34A' : '#948F84',
                }}>
                  {s.available > 0 ? `${s.available} disp.` : 'Esgotada'}
                </span>
              </button>
            ))}
        </div>
      )}

      {/* ── Bottom sheet overlay + sheet ───────────────────────────────────── */}
      <AnimatePresence>
        {selectedQuadra && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedQuadra(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
            />
            {/* Sheet */}
            <QuadraSheet
              key="sheet"
              quadra={selectedQuadra}
              lots={quadraStats.get(selectedQuadra)?.lots ?? []}
              developmentName={developmentName}
              whatsappPhone={whatsappPhone}
              onClose={() => setSelectedQuadra(null)}
              onLotClick={(lot) => { setSelectedQuadra(null); onLotClick(lot); }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
