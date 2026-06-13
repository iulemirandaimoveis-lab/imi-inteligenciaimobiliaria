'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MessageCircle, X, MapPin, Ruler, DollarSign, Filter,
  ChevronDown, ChevronUp, BarChart2, List, Map as MapIcon,
  Scale, Trophy, Sparkles, TrendingUp, Home, Star,
  CheckCircle2, Circle, ArrowRight, Zap, Building2,
  Layers, ChevronsUpDown, Tag, LayoutGrid,
} from 'lucide-react';
import SubdivisionPlanView, { PLAN_VIEW_IDS } from './SubdivisionPlanView';
import AltoBellevuePlanView from './AltoBellevuePlanView';
import { resolveLotStatus } from '@/lib/lots/alto-bellevue-availability';
import { useAbAvailability, useAbCanonicalStatuses } from '@/hooks/use-ab-availability';

const AB_DEV_ID = 'ab7d1fc1-f069-4e3b-a515-8e1204c11247';

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

interface PaymentConditions {
  entrada: string;
  parcelas: number;
  parcelValue: string;
  method: string;
  seller: string;
}

interface SubdivisionLotMapProps {
  developmentId: string;
  developmentName: string;
  whatsappPhone?: string;
  paymentConditions?: PaymentConditions | null;
  /** Mídia das áreas comuns do mapa (developments.lot_map_amenities) — editável no backoffice. */
  mapAmenities?: Record<string, unknown>[];
  /** Tour virtual 360° do empreendimento (developments.virtual_tour_url) — editável no backoffice. */
  virtualTourUrl?: string;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  DISPONIVEL:   { label: 'Disponível',   bg: '#16A34A', text: '#fff', light: '#DCFCE7', dark: '#166534' },
  VENDIDO:      { label: 'Vendido',      bg: '#DC2626', text: '#fff', light: '#FEE2E2', dark: '#991B1B' },
  NEGOCIACAO:   { label: 'Negociação',   bg: '#D97706', text: '#fff', light: '#FEF3C7', dark: '#92400E' },
  // A planilha viva pode marcar RESERVADO; sem este config a Lista cairia no
  // fallback DISPONIVEL e pintaria o lote de verde (engano comercial). Mesma cor
  // da Planta (roxo) para paridade entre visões.
  RESERVADO:    { label: 'Reservado',    bg: '#8B5CF6', text: '#fff', light: '#EDE9FE', dark: '#5B21B6' },
  PROPRIETARIO: { label: 'Proprietário', bg: '#2563EB', text: '#fff', light: '#DBEAFE', dark: '#1E40AF' },
  IGREJA:       { label: 'Igreja',       bg: '#7C3AED', text: '#fff', light: '#EDE9FE', dark: '#5B21B6' },
} as const;

type StatusKey = keyof typeof STATUS;

// ─── IMI Score computation ────────────────────────────────────────────────────
interface LotScore {
  investment: number;
  living: number;
  costBenefit: number;
  liquidity: number;
  tags: string[];
}

function computeScore(lot: Lot, allLots: Lot[]): LotScore {
  const availLots = allLots.filter(l => l.price && l.area_m2 > 0);
  if (availLots.length === 0) return { investment: 50, living: 50, costBenefit: 50, liquidity: 50, tags: [] };

  const pricePerM2 = lot.price && lot.area_m2 > 0 ? lot.price / lot.area_m2 : null;
  const avgPricePerM2 = availLots.reduce((s, l) => s + l.price! / l.area_m2, 0) / availLots.length;
  const maxArea = Math.max(...allLots.map(l => l.area_m2));
  const minArea = Math.min(...allLots.map(l => l.area_m2));
  const isCorner = lot.special_type === 'ESQUINA' || lot.lot_number === 1 || lot.lot_number === allLots.filter(l => l.quadra === lot.quadra).length;

  // Cost-benefit: lower price/m² = better
  const cbScore = pricePerM2
    ? Math.max(10, Math.min(100, Math.round(100 - ((pricePerM2 - avgPricePerM2 * 0.8) / (avgPricePerM2 * 0.6)) * 40)))
    : 50;

  // Investment score: corner + larger area + lower price/m²
  const areaScore = maxArea > minArea ? ((lot.area_m2 - minArea) / (maxArea - minArea)) * 30 : 0;
  const cornerBonus = isCorner ? 20 : 0;
  const investScore = Math.min(100, Math.round(cbScore * 0.5 + areaScore + cornerBonus + 10));

  // Living score: larger area + mid price range
  const sizeForLiving = maxArea > minArea ? ((lot.area_m2 - minArea) / (maxArea - minArea)) * 40 : 20;
  const livingScore = Math.min(100, Math.round(sizeForLiving + cbScore * 0.4 + (isCorner ? 10 : 5) + 10));

  // Liquidity: closer to avg price + corner
  const liquidityScore = Math.min(100, Math.round(cbScore * 0.6 + (isCorner ? 15 : 0) + 25));

  const tags: string[] = [];
  if (cbScore >= 75) tags.push('Melhor custo-benefício');
  if (investScore >= 75) tags.push('Bom para investir');
  if (livingScore >= 75) tags.push('Bom para morar');
  if (isCorner) tags.push('Lote de esquina');
  if (lot.area_m2 > avgPricePerM2 * 1.2) tags.push('Lote grande');
  if (pricePerM2 && pricePerM2 < avgPricePerM2 * 0.9) tags.push('Abaixo do mercado');

  return { investment: investScore, living: livingScore, costBenefit: cbScore, liquidity: liquidityScore, tags };
}

// ─── IMI Rankings ─────────────────────────────────────────────────────────────
interface RankingItem {
  lot: Lot;
  score: LotScore;
  reason: string;
}

function computeRankings(lots: Lot[]): {
  bestValue: RankingItem[];
  bestLiving: RankingItem[];
  bestInvestment: RankingItem[];
  bestCorner: RankingItem[];
} {
  const avail = lots.filter(l => l.status === 'DISPONIVEL' && l.price && l.area_m2 > 0);
  const scored = avail.map(lot => ({ lot, score: computeScore(lot, lots) }));

  const topN = (items: typeof scored, key: keyof LotScore, n = 3) =>
    [...items].sort((a, b) => (b.score[key] as number) - (a.score[key] as number)).slice(0, n);

  return {
    bestValue: topN(scored, 'costBenefit').map(i => ({
      ...i,
      reason: `R$${Math.round(i.lot.price! / i.lot.area_m2)}/m² · ${Math.round(i.lot.area_m2)}m²`,
    })),
    bestLiving: topN(scored, 'living').map(i => ({
      ...i,
      reason: `${Math.round(i.lot.area_m2)}m² · Quadra ${i.lot.quadra}`,
    })),
    bestInvestment: topN(scored, 'investment').map(i => ({
      ...i,
      reason: `Score ${i.score.investment} · ${i.score.tags.slice(0, 1).join(', ')}`,
    })),
    bestCorner: scored.filter(i => i.lot.special_type === 'ESQUINA' || i.lot.lot_number === 1).slice(0, 3).map(i => ({
      ...i,
      reason: `Esquina · ${Math.round(i.lot.area_m2)}m²`,
    })),
  };
}

// ─── Smart Filters ────────────────────────────────────────────────────────────
type SmartFilter =
  | 'ALL'
  | 'DISPONIVEL'
  | 'menor_preco'
  | 'maior_area'
  | 'melhor_custo'
  | 'entrada_baixa'
  | 'lote_esquina'
  | 'investimento'
  | 'morar';

const SMART_FILTERS: { key: SmartFilter; label: string; icon: React.ReactNode }[] = [
  { key: 'ALL',         label: 'Todos',                  icon: <LayoutGrid size={11} /> },
  { key: 'DISPONIVEL',  label: 'Disponíveis',             icon: <CheckCircle2 size={11} /> },
  { key: 'menor_preco', label: 'Menor preço',             icon: <Tag size={11} /> },
  { key: 'maior_area',  label: 'Maior área',              icon: <ChevronsUpDown size={11} /> },
  { key: 'melhor_custo',label: 'Melhor custo-benefício',  icon: <Star size={11} /> },
  { key: 'lote_esquina',label: 'Lote de esquina',         icon: <Layers size={11} /> },
  { key: 'investimento',label: 'Melhor para investir',    icon: <TrendingUp size={11} /> },
  { key: 'morar',       label: 'Melhor para morar',       icon: <Home size={11} /> },
];

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const fmtM2 = (v: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v)} m²`;

// ─── IA recommendation type ───────────────────────────────────────────────────
interface RecommendedLot {
  id: string;
  quadra: string;
  lot_number: number;
  area_m2: number;
  price: number;
  rankScore: number;
  reasons: string[];
  scores: { imiScore: number; rentabilidade: number; location: number; liquidity: number; construtora: number };
}

// ─── AB price entry type ──────────────────────────────────────────────────────
interface ABPriceEntry {
  quadra: string;
  lote: string;
  area_m2: number;
  preco_lote: number;
  preco_vista: number;
  entrada: number;
  p12_total: number; p12_parcela: number;
  p36_total: number; p36_parcela: number;
  p60_total: number; p60_parcela: number;
  p120_total: number; p120_parcela: number;
}

// ─── Lot Detail Modal ─────────────────────────────────────────────────────────
function LotModal({
  lot,
  developmentName,
  whatsappPhone,
  onClose,
  onAddToCompare,
  isInCompare,
  allLots,
  abPrice,
}: {
  lot: Lot;
  developmentName: string;
  whatsappPhone: string;
  onClose: () => void;
  onAddToCompare: (lot: Lot) => void;
  isInCompare: boolean;
  allLots: Lot[];
  abPrice?: ABPriceEntry;
}) {
  const cfg = STATUS[lot.status as StatusKey] ?? STATUS.DISPONIVEL;
  const isAvailable = lot.status === 'DISPONIVEL';
  const score = useMemo(() => computeScore(lot, allLots), [lot, allLots]) as LotScore;
  const pricePerM2 = lot.price && lot.area_m2 > 0 ? lot.price / lot.area_m2 : null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleBackdrop = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const waMsg = encodeURIComponent(
    `Olá! Tenho interesse no ${developmentName}, Quadra ${lot.quadra}, Lote ${lot.lot_number}, com área de ${Math.round(lot.area_m2)} m². Gostaria de reservar ou receber mais informações.`
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
        onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}
      >
        {/* Status bar */}
        <div style={{ height: 4, background: cfg.bg }} />

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: cfg.light, color: cfg.dark }}
              >
                {cfg.label}
              </span>
              {lot.special_type === 'ESQUINA' && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  Esquina
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

        {/* IMI Tags */}
        {score.tags.length > 0 && (
          <div className="px-5 pb-3 flex flex-wrap gap-1.5">
            {score.tags.map(tag => (
              <span key={tag} style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: '#F0EDE5', color: '#948F84' }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 px-5 pb-4">
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

        {/* Price per m² + scores */}
        {pricePerM2 && (
          <div className="px-5 pb-3">
            <div style={{ background: '#F0EDE5', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#948F84', fontWeight: 600 }}>Preço por m²</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                {fmtBRL(pricePerM2)}/m²
              </span>
            </div>
            {/* IMI Score mini bars */}
            {isAvailable && (
              <div className="grid grid-cols-2 gap-2">
                {([
                  { label: 'Investimento', value: score.investment, color: '#2563EB' },
                  { label: 'Morar', value: score.living, color: '#14B8A6' },
                ] as const).map(item => (
                  <div key={item.label} style={{ background: '#F8F6F2', borderRadius: 10, padding: '8px 10px' }}>
                    <div className="flex justify-between items-center mb-1">
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: item.color, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>{item.value}</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: '#E5E0D8', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${item.value}%`, background: item.color, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment plan breakdown — Alto Bellevue */}
        {abPrice && isAvailable && (
          <div className="px-5 pb-3">
            <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 8px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
              Formas de Pagamento
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { label: 'À Vista', desc: '20% desconto', total: abPrice.preco_vista, parcela: null, highlight: true },
                { label: '12×', desc: `Entrada ${fmtBRL(abPrice.entrada)}`, total: abPrice.p12_total, parcela: abPrice.p12_parcela, highlight: false },
                { label: '36×', desc: `Entrada ${fmtBRL(abPrice.entrada)}`, total: abPrice.p36_total, parcela: abPrice.p36_parcela, highlight: false },
                { label: '60×', desc: `Entrada ${fmtBRL(abPrice.entrada)}`, total: abPrice.p60_total, parcela: abPrice.p60_parcela, highlight: false },
                { label: '120×', desc: `Entrada ${fmtBRL(abPrice.entrada)}`, total: abPrice.p120_total, parcela: abPrice.p120_parcela, highlight: false },
              ].map(plan => (
                <div key={plan.label} style={{ background: plan.highlight ? '#0B1928' : '#F8F6F2', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: plan.highlight ? '#C8A44A' : '#948F84', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                    {plan.label}
                  </p>
                  {plan.parcela ? (
                    <>
                      <p style={{ fontSize: 13, fontWeight: 800, color: plan.highlight ? '#fff' : '#0B1928', margin: 0, fontFamily: "var(--fm, 'JetBrains Mono', monospace)", lineHeight: 1.2 }}>
                        {fmtBRL(plan.parcela)}/mês
                      </p>
                      <p style={{ fontSize: 9, color: plan.highlight ? 'rgba(255,255,255,0.4)' : '#948F84', margin: '2px 0 0', fontWeight: 500 }}>
                        Total {fmtBRL(plan.total)}
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: 13, fontWeight: 800, color: plan.highlight ? '#C8A44A' : '#0B1928', margin: 0, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                      {fmtBRL(plan.total)}
                    </p>
                  )}
                  <p style={{ fontSize: 8, color: plan.highlight ? 'rgba(255,255,255,0.35)' : '#B8B3A8', margin: '1px 0 0', fontWeight: 500 }}>
                    {plan.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {lot.notes && (
          <div className="px-5 pb-3">
            <p style={{ fontSize: 11, color: '#948F84', background: '#F8F6F2', borderRadius: 10, padding: '8px 12px', margin: 0, lineHeight: 1.5 }}>
              {lot.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-6 pt-1 flex flex-col gap-2">
          {isAvailable ? (
            <>
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
              <button
                onClick={() => { onAddToCompare(lot); onClose(); }}
                className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-[12px] font-bold border border-gray-200 transition-colors"
                style={{
                  color: isInCompare ? '#2563EB' : '#0B1928',
                  background: isInCompare ? '#DBEAFE' : '#F8F6F2',
                  borderColor: isInCompare ? '#2563EB' : '#E5E0D8',
                  fontFamily: "var(--fu, 'Outfit', sans-serif)",
                }}
              >
                <Scale size={13} />
                {isInCompare ? 'Remover comparação' : 'Comparar este lote'}
              </button>
            </>
          ) : (
            <a
              href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Tenho interesse no ${developmentName}, Quadra ${lot.quadra}, Lote ${lot.lot_number} (${cfg.label}). Pode me avisar se houver disponibilidade ou indicar um lote semelhante?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex items-center justify-center gap-2 w-full h-12 rounded-xl text-[13px] font-bold uppercase tracking-wider border border-gray-200 overflow-hidden"
              style={{ color: '#0B1928', fontFamily: "var(--fu, 'Outfit', sans-serif)", textDecoration: 'none', background: '#fff' }}
            >
              <MessageCircle size={15} />
              Falar sobre este lote
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Lot Comparator ───────────────────────────────────────────────────────────
function LotComparator({
  lots,
  compareLots,
  developmentName,
  whatsappPhone,
  allLots,
  onRemove,
  onClose,
}: {
  lots: Lot[];
  compareLots: Lot[];
  developmentName: string;
  whatsappPhone: string;
  allLots: Lot[];
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const scores = useMemo(() => compareLots.map((l: Lot) => computeScore(l, allLots)), [compareLots, allLots]) as LotScore[];

  const rows = [
    { label: 'Quadra / Lote', render: (l: Lot) => `Q${l.quadra} — L${l.lot_number}` },
    { label: 'Área', render: (l: Lot) => fmtM2(l.area_m2) },
    { label: 'Valor', render: (l: Lot) => l.price ? fmtBRL(l.price) : 'Consultar' },
    { label: 'R$/m²', render: (l: Lot) => l.price ? fmtBRL(l.price / l.area_m2) + '/m²' : '—' },
    { label: 'Status', render: (l: Lot) => STATUS[l.status as StatusKey]?.label ?? l.status },
    { label: 'Tipo', render: (l: Lot) => l.special_type === 'ESQUINA' ? 'Esquina' : 'Padrão' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}
      onClick={(e: { target: unknown; currentTarget: unknown }) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="w-full sm:max-w-2xl rounded-t-[24px] sm:rounded-[20px] overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 32px 80px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Scale size={16} style={{ color: '#C8A44A' }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0B1928', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
              Comparar Lotes
            </h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Comparison grid */}
        <div className="p-5">
          {/* Lot headers */}
          <div style={{ display: 'grid', gridTemplateColumns: `140px repeat(${compareLots.length}, 1fr)`, gap: 8, marginBottom: 8 }}>
            <div />
            {compareLots.map((lot, i) => {
              const cfg = STATUS[lot.status as StatusKey] ?? STATUS.DISPONIVEL;
              return (
                <div key={lot.id} style={{ textAlign: 'center', padding: '12px 8px', background: '#F8F6F2', borderRadius: 12, position: 'relative' }}>
                  <button
                    onClick={() => onRemove(lot.id)}
                    style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: '#E5E0D8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={9} style={{ color: '#948F84' }} />
                  </button>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.bg, margin: '0 auto 4px' }} />
                  <p style={{ fontSize: 12, fontWeight: 800, color: '#0B1928', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                    Q{lot.quadra}–L{lot.lot_number}
                  </p>
                  <p style={{ fontSize: 10, color: '#948F84', margin: '2px 0 0' }}>{cfg.label}</p>
                  {i === 0 && scores[0].costBenefit >= 70 && (
                    <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: '#FEF3C7', color: '#92400E', display: 'block', marginTop: 3 }}>
                      RECOMENDADO
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Data rows */}
          {rows.map((row, ri) => (
            <div
              key={row.label}
              style={{
                display: 'grid',
                gridTemplateColumns: `140px repeat(${compareLots.length}, 1fr)`,
                gap: 8,
                marginBottom: 4,
                background: ri % 2 === 0 ? '#FAFAF8' : '#fff',
                borderRadius: 8,
                padding: '8px 4px',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
                {row.label}
              </span>
              {compareLots.map(lot => (
                <span key={lot.id} style={{ fontSize: 12, fontWeight: 700, color: '#0B1928', textAlign: 'center', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                  {row.render(lot)}
                </span>
              ))}
            </div>
          ))}

          {/* IMI Scores */}
          <div style={{ marginTop: 12, padding: '12px', background: '#0B1928', borderRadius: 12 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#C8A44A', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 10px' }}>Score IMI</p>
            {(['investment', 'living', 'costBenefit', 'liquidity'] as const).map(key => {
              const labels: Record<string, string> = { investment: 'Investimento', living: 'Morar', costBenefit: 'Custo-Benef.', liquidity: 'Liquidez' };
              const colors: Record<string, string> = { investment: '#2563EB', living: '#14B8A6', costBenefit: '#C8A44A', liquidity: '#8B5CF6' };
              return (
                <div key={key} style={{ marginBottom: 8 }}>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{labels[key]}</span>
                    <div className="flex gap-3">
                      {scores.map((s, i) => (
                        <span key={i} style={{ fontSize: 10, fontWeight: 800, color: colors[key], fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                          {s[key]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compareLots.length}, 1fr)`, gap: 4 }}>
                    {scores.map((s, i) => (
                      <div key={i} style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${s[key]}%`, background: colors[key], borderRadius: 2 }} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* WhatsApp CTA for best lot */}
          {compareLots.length > 0 && compareLots[0].status === 'DISPONIVEL' && (
            <a
              href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                `Olá! Após comparar os lotes no ${developmentName}, tenho interesse no Lote ${compareLots[0].lot_number} da Quadra ${compareLots[0].quadra}. Gostaria de saber mais.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, background: '#C8A44A', color: '#0B1928', fontSize: 13, fontWeight: 800, textDecoration: 'none', marginTop: 12, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
            >
              <MessageCircle size={15} />
              Tenho Interesse no Lote 1
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── IMI Rankings Section ─────────────────────────────────────────────────────
function RankingSection({
  lots,
  onLotClick,
  whatsappPhone,
  developmentName,
}: {
  lots: Lot[];
  onLotClick: (lot: Lot) => void;
  whatsappPhone: string;
  developmentName: string;
}) {
  const rankings = useMemo(() => computeRankings(lots), [lots]) as ReturnType<typeof computeRankings>;
  const [activeRanking, setActiveRanking] = useState<'bestValue' | 'bestLiving' | 'bestInvestment'>('bestValue');

  const tabs = [
    { key: 'bestValue' as const, label: 'Custo-Benefício', icon: <Star size={12} />, color: '#C8A44A' },
    { key: 'bestLiving' as const, label: 'Para Morar', icon: <Home size={12} />, color: '#14B8A6' },
    { key: 'bestInvestment' as const, label: 'Para Investir', icon: <TrendingUp size={12} />, color: '#2563EB' },
  ];

  const items = rankings[activeRanking] as RankingItem[];
  if (items.length === 0) return null;

  const medalColors = ['#C8A44A', '#8E9BAB', '#B07340'];
  const medalLabels = ['1', '2', '3'];
  const activeTab = tabs.find(t => t.key === activeRanking)!;

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(184,179,168,0.3)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 0' }}>
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={15} style={{ color: '#C8A44A' }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0B1928', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
            Ranking IMI de Lotes
          </span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveRanking(tab.key)}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: activeRanking === tab.key ? tab.color : '#F8F6F2',
                color: activeRanking === tab.key ? '#fff' : '#948F84',
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "var(--fu, 'Outfit', sans-serif)",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ranking items */}
      <div className="px-4 pb-4">
        {items.map((item, i) => (
          <button
            key={item.lot.id}
            onClick={() => onLotClick(item.lot)}
            className="w-full flex items-center justify-between py-3 border-b last:border-0 border-gray-100 text-left hover:bg-gray-50 rounded-lg px-2 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span style={{ width: 22, height: 22, borderRadius: 7, background: `${medalColors[i]}18`, border: `1.5px solid ${medalColors[i]}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: medalColors[i], fontFamily: "var(--fm,'JetBrains Mono',monospace)", flexShrink: 0 }}>{medalLabels[i]}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#0B1928', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                  Q{item.lot.quadra} — Lote {item.lot.lot_number}
                </p>
                <p style={{ fontSize: 10, color: '#948F84', margin: '1px 0 0' }}>{item.reason}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: activeTab.color, margin: 0, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                  {item.score[activeRanking === 'bestValue' ? 'costBenefit' : activeRanking === 'bestLiving' ? 'living' : 'investment']}
                </p>
                <p style={{ fontSize: 9, color: '#948F84', margin: 0, fontWeight: 600 }}>score</p>
              </div>
              <ArrowRight size={13} style={{ color: '#948F84' }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Individual Lot Cell ───────────────────────────────────────────────────────
function LotCell({ lot, onClick, isInCompare, isRecommended }: { lot: Lot; onClick: (lot: Lot) => void; isInCompare: boolean; isRecommended?: boolean }) {
  const cfg = STATUS[lot.status as StatusKey] ?? STATUS.DISPONIVEL;
  const isChurch = lot.special_type === 'IGREJA';
  const isCorner = lot.special_type === 'ESQUINA';

  return (
    <button
      onClick={() => onClick(lot)}
      title={`Q${lot.quadra} Lote ${lot.lot_number} — ${fmtM2(lot.area_m2)} — ${cfg.label}`}
      style={{
        width: '100%',
        aspectRatio: '1',
        borderRadius: 6,
        border: isInCompare ? `2px solid #2563EB` : `1.5px solid ${cfg.bg}22`,
        background: isInCompare ? '#DBEAFE' : cfg.light,
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
      onMouseEnter={(e: { currentTarget: HTMLButtonElement }) => {
        e.currentTarget.style.transform = 'scale(1.12)';
        e.currentTarget.style.boxShadow = `0 4px 12px ${cfg.bg}44`;
        e.currentTarget.style.zIndex = '10';
      }}
      onMouseLeave={(e: { currentTarget: HTMLButtonElement }) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.zIndex = '1';
      }}
    >
      {lot.status === 'DISPONIVEL' && !isInCompare && (
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${cfg.bg}18, ${cfg.bg}30)` }} />
      )}
      {isCorner && (
        <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 6px 6px 0', borderColor: `transparent #2563EB transparent transparent` }} />
      )}
      {isRecommended && !isInCompare && (
        <div style={{ position: 'absolute', top: 2, left: 2 }}>
          <Star size={5} style={{ color: '#C8A44A', fill: '#C8A44A' }} />
        </div>
      )}
      {isChurch
        ? <Building2 size={12} style={{ color: isInCompare ? '#1E40AF' : cfg.dark, position: 'relative', zIndex: 1 }} />
        : <span style={{ fontSize: 9, fontWeight: 800, color: isInCompare ? '#1E40AF' : cfg.dark, fontFamily: "var(--fm, 'JetBrains Mono', monospace)", lineHeight: 1, position: 'relative', zIndex: 1 }}>{lot.lot_number}</span>
      }
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
  compareIds,
  recommendedIds,
}: {
  quadra: string;
  lots: Lot[];
  onLotClick: (lot: Lot) => void;
  isActive: boolean;
  onToggle: () => void;
  compareIds: Set<string>;
  recommendedIds?: Set<string>;
}) {
  const available = lots.filter(l => l.status === 'DISPONIVEL').length;
  const total = lots.length;
  const pct = total > 0 ? Math.round((available / total) * 100) : 0;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of lots) counts[l.status] = (counts[l.status] ?? 0) + 1;
    return counts;
  }, [lots]);

  const cols = Math.ceil(Math.sqrt(total));

  return (
    <div style={{ border: '1px solid rgba(184,179,168,0.3)', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
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
          <div style={{ width: 48, textAlign: 'right' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: available > 0 ? '#16A34A' : '#948F84', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
              {pct}%
            </span>
          </div>
          {isActive ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
        </div>
      </button>

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
              <div style={{ height: 4, borderRadius: 2, background: '#F0EDE5', marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #16A34A, #22C55E)', borderRadius: 2, transition: 'width 0.4s ease' }} />
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(cols, 12)}, minmax(0, 1fr))`,
                gap: 4,
              }}>
                {lots.sort((a, b) => a.lot_number - b.lot_number).map(lot => (
                  <LotCell key={lot.id} lot={lot} onClick={onLotClick} isInCompare={compareIds.has(lot.id)} isRecommended={recommendedIds?.has(`${lot.quadra}-${lot.lot_number}`)} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Compare Bar ──────────────────────────────────────────────────────────────
function CompareBar({
  compareLots,
  onRemove,
  onOpen,
  onClear,
}: {
  compareLots: Lot[];
  onRemove: (id: string) => void;
  onOpen: () => void;
  onClear: () => void;
}) {
  if (compareLots.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
    >
      <div style={{ background: '#0B1928', borderRadius: 16, padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Scale size={15} style={{ color: '#C8A44A', flexShrink: 0 }} />
        <div className="flex items-center gap-2 flex-1 overflow-hidden">
          {compareLots.map(lot => (
            <div key={lot.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '4px 8px', flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                Q{lot.quadra}-L{lot.lot_number}
              </span>
              <button onClick={() => onRemove(lot.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#948F84', padding: 0, display: 'flex' }}>
                <X size={10} />
              </button>
            </div>
          ))}
          {compareLots.length < 3 && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
              +{3 - compareLots.length} lote{3 - compareLots.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {compareLots.length >= 2 && (
            <button
              onClick={onOpen}
              style={{ height: 36, paddingLeft: 14, paddingRight: 14, borderRadius: 10, background: '#C8A44A', color: '#0B1928', fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: "var(--fu, 'Outfit', sans-serif)", whiteSpace: 'nowrap' }}
            >
              Comparar
            </button>
          )}
          <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
            <X size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SubdivisionLotMap({ developmentId, developmentName, whatsappPhone = '5581986141487', paymentConditions, mapAmenities, virtualTourUrl }: SubdivisionLotMapProps) {
  const [rawLots, setRawLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);

  // C1/C2 — paridade de disponibilidade com a Planta: a Lista resolve o status
  // pela MESMA cadeia (planilha viva > JSON canônico > banco). Sem isto, a Lista
  // mostrava só o status do Supabase e divergia da Planta. Só busca p/ o AB.
  const isAB = developmentId === AB_DEV_ID;
  const liveAvail = useAbAvailability(isAB);
  const canonicalStatus = useAbCanonicalStatuses(isAB);
  const lots = useMemo<Lot[]>(() => {
    if (!isAB) return rawLots;
    return rawLots.map((l) => {
      const id = `${l.quadra}-${String(l.lot_number).padStart(2, '0')}`;
      const status = resolveLotStatus(id, l.status, canonicalStatus, liveAvail);
      return status === l.status ? l : { ...l, status };
    });
  }, [rawLots, isAB, canonicalStatus, liveAvail]);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [activeQuadras, setActiveQuadras] = useState<Set<string>>(new Set(['A', 'B']));
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [smartFilter, setSmartFilter] = useState<SmartFilter>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minArea, setMinArea] = useState<number | null>(null);
  const [compareLots, setCompareLots] = useState<Lot[]>([]);
  const [showComparator, setShowComparator] = useState(false);
  const [showRankings, setShowRankings] = useState(false);

  // IA recommendations
  const [recommendations, setRecommendations] = useState<RecommendedLot[]>([]);
  const [recProfile, setRecProfile] = useState<'all' | 'investor' | 'resident'>('all');
  const [recLoading, setRecLoading] = useState(false);

  const hasPlanView = PLAN_VIEW_IDS.has(developmentId);
  const [viewMode, setViewMode] = useState<'list' | 'plan'>(() => hasPlanView ? 'plan' : 'list');
  const [abPricesMap, setAbPricesMap] = useState<Map<string, ABPriceEntry>>(new Map());
  const pricesFetched = useRef(false);

  // Lazy-load: defer 163 KB prices JSON until user first opens a lot drawer
  useEffect(() => {
    if (developmentId !== AB_DEV_ID) return;
    if (!selectedLot) return;
    if (pricesFetched.current) return;
    pricesFetched.current = true;
    fetch('/data/alto-bellevue-prices.json')
      .then(r => r.json())
      .then((data: ABPriceEntry[]) => {
        const map = new Map<string, ABPriceEntry>();
        for (const entry of data) {
          map.set(`${entry.quadra}-${String(parseInt(entry.lote, 10))}`, entry);
        }
        setAbPricesMap(map);
      })
      .catch(() => {/* prices unavailable */});
  }, [developmentId, selectedLot]);

  useEffect(() => {
    const supabase = createClient();
    const fetchLots = async () => {
      try {
        const { data, error } = await supabase
          .from('subdivision_lots')
          .select('*')
          .eq('development_id', developmentId)
          .order('quadra')
          .order('lot_number');
        if (error) console.error('[SubdivisionLotMap] fetch error:', error.message);
        if (data) setRawLots(data.map((l: Record<string, unknown>) => ({ ...l, area_m2: Number(l.area_m2) || 0 })) as Lot[]);
      } catch (err) {
        console.error('[SubdivisionLotMap] unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLots();
  }, [developmentId]);

  // IA recommendations — fetch when lots load or profile changes
  useEffect(() => {
    if (loading || lots.length === 0) return;
    setRecLoading(true);
    fetch(`/api/intelligence/lots/recommend?development_id=${developmentId}&profile=${recProfile}&limit=3`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.recommendations) setRecommendations(data.recommendations); })
      .catch(() => {/* silent — recommendations are optional */})
      .finally(() => setRecLoading(false));
  }, [developmentId, recProfile, loading, lots.length]);

  const quadras = useMemo(() => {
    const map = new Map<string, Lot[]>();
    for (const lot of (lots as Lot[])) {
      if (!map.has(lot.quadra)) map.set(lot.quadra, []);
      map.get(lot.quadra)!.push(lot);
    }
    return map;
  }, [lots]) as Map<string, Lot[]>;

  const filteredQuadras = useMemo(() => {
    const result = new Map<string, Lot[]>();
    const availLots = (lots as Lot[]).filter((l: Lot) => l.price && l.area_m2 > 0);
    const avgPricePerM2 = availLots.length > 0
      ? availLots.reduce((s: number, l: Lot) => s + l.price! / l.area_m2, 0) / availLots.length
      : 0;

    for (const [q, qLots] of quadras) {
      const filtered = qLots.filter((l: Lot) => {
        // Status filter
        if (filterStatus !== 'ALL' && l.status !== filterStatus) return false;
        // Price filter
        if (maxPrice !== null && l.price !== null && l.price > maxPrice) return false;
        // Area filter
        if (minArea !== null && l.area_m2 < minArea) return false;
        // Smart filters
        if (smartFilter === 'DISPONIVEL' && l.status !== 'DISPONIVEL') return false;
        if (smartFilter === 'menor_preco' && (l.status !== 'DISPONIVEL' || !l.price)) return false;
        if (smartFilter === 'maior_area' && l.status !== 'DISPONIVEL') return false;
        if (smartFilter === 'melhor_custo' && (l.status !== 'DISPONIVEL' || !l.price || !l.area_m2)) return false;
        if (smartFilter === 'lote_esquina' && l.special_type !== 'ESQUINA') return false;
        if (smartFilter === 'investimento' && l.status !== 'DISPONIVEL') return false;
        if (smartFilter === 'morar' && l.status !== 'DISPONIVEL') return false;
        return true;
      });

      // Smart filter: sort by best match
      let sorted = filtered;
      if (smartFilter === 'menor_preco') {
        sorted = [...filtered].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      } else if (smartFilter === 'maior_area') {
        sorted = [...filtered].sort((a, b) => b.area_m2 - a.area_m2);
      } else if (smartFilter === 'melhor_custo') {
        sorted = [...filtered].sort((a, b) =>
          (a.price! / a.area_m2) - (b.price! / b.area_m2)
        );
      } else if (smartFilter === 'investimento') {
        sorted = [...filtered].sort((a, b) => {
          const isCornerA = a.special_type === 'ESQUINA' ? 1 : 0;
          const isCornerB = b.special_type === 'ESQUINA' ? 1 : 0;
          const priceA = a.price ? a.price / a.area_m2 : avgPricePerM2 * 1.5;
          const priceB = b.price ? b.price / b.area_m2 : avgPricePerM2 * 1.5;
          return (isCornerB + b.area_m2 / 10 - priceB / avgPricePerM2 * 10) -
                 (isCornerA + a.area_m2 / 10 - priceA / avgPricePerM2 * 10);
        });
      } else if (smartFilter === 'morar') {
        sorted = [...filtered].sort((a, b) => b.area_m2 - a.area_m2);
      }

      if (sorted.length > 0) result.set(q, sorted);
    }
    return result;
  }, [quadras, filterStatus, maxPrice, minArea, smartFilter, lots]);

  const stats = useMemo(() => {
    const ls = lots as Lot[];
    const total = ls.length;
    const available = ls.filter((l: Lot) => l.status === 'DISPONIVEL').length;
    const sold = ls.filter((l: Lot) => l.status === 'VENDIDO').length;
    const negotiation = ls.filter((l: Lot) => l.status === 'NEGOCIACAO').length;
    const owner = ls.filter((l: Lot) => l.status === 'PROPRIETARIO').length;
    const availLots = ls.filter((l: Lot) => l.price && l.status === 'DISPONIVEL');
    const priceMin = Math.min(...availLots.map((l: Lot) => l.price!));
    const priceMax = Math.max(...ls.filter((l: Lot) => l.price).map((l: Lot) => l.price!));
    const areaMin = Math.min(...availLots.map((l: Lot) => l.area_m2));
    const areaMax = Math.max(...ls.map((l: Lot) => l.area_m2));
    return {
      total, available, sold, negotiation, owner,
      priceMin: isFinite(priceMin) ? priceMin : 0,
      priceMax: isFinite(priceMax) ? priceMax : 0,
      areaMin: isFinite(areaMin) ? areaMin : 0,
      areaMax: isFinite(areaMax) ? areaMax : 0,
    };
  }, [lots]);

  const priceBreakpoints = useMemo(() => {
    if (stats.priceMax <= 0) return [];
    const range = stats.priceMax - stats.priceMin;
    const step = Math.ceil(range / 4 / 5000) * 5000;
    return [1, 2, 3, 4].map((i: number) => Math.round((stats.priceMin + step * i) / 1000) * 1000);
  }, [stats.priceMin, stats.priceMax]) as number[];

  const areaBreakpoints = useMemo(() => {
    if (stats.areaMax <= 0) return [];
    const min = Math.floor(stats.areaMin / 50) * 50;
    const max = Math.ceil(stats.areaMax / 50) * 50;
    const step = Math.ceil((max - min) / 3 / 50) * 50;
    return [1, 2, 3].map((i: number) => min + step * i).filter((v: number) => v < max);
  }, [stats.areaMin, stats.areaMax]) as number[];

  const toggleQuadra = (q: string) => {
    setActiveQuadras((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(q)) next.delete(q);
      else next.add(q);
      return next;
    });
  };

  const addToCompare = useCallback((lot: Lot) => {
    setCompareLots((prev: Lot[]) => {
      if (prev.some((l: Lot) => l.id === lot.id)) return prev.filter((l: Lot) => l.id !== lot.id);
      if (prev.length >= 3) return prev;
      return [...prev, lot];
    });
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setCompareLots((prev: Lot[]) => prev.filter((l: Lot) => l.id !== id));
  }, []);

  const compareIds = useMemo(() => new Set((compareLots as Lot[]).map((l: Lot) => l.id)), [compareLots]) as Set<string>;

  const expandAll = () => setActiveQuadras(new Set(quadras.keys()));
  const collapseAll = () => setActiveQuadras(new Set());

  const hasRankings = useMemo(() => (lots as Lot[]).filter((l: Lot) => l.status === 'DISPONIVEL' && l.price).length >= 3, [lots]) as boolean;

  // M1 — legenda data-driven: só status presentes, com contagem; mesma taxonomia
  // e fonte da Planta (status já resolvido pela cadeia única).
  const presentStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of lots as Lot[]) counts[l.status] = (counts[l.status] ?? 0) + 1;
    return (Object.entries(STATUS) as [StatusKey, typeof STATUS[StatusKey]][])
      .filter(([k]) => (counts[k] ?? 0) > 0)
      .map(([k, v]) => ({ key: k, cfg: v, count: counts[k] }));
  }, [lots]);

  const recommendedIds = useMemo(
    () => new Set(recommendations.map(r => `${r.quadra}-${r.lot_number}`)),
    [recommendations]
  );

  // M5 — recomendações respeitam os filtros ativos: só mostra recomendações que
  // pertencem ao conjunto já filtrado (reusa exatamente a lógica de filteredQuadras,
  // fonte única). Com filtro incompatível (ex.: "Vendidos"), a seção some.
  const filteredLotKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const [, qLots] of filteredQuadras) {
      for (const l of qLots) keys.add(`${l.quadra}-${l.lot_number}`);
    }
    return keys;
  }, [filteredQuadras]);
  const hasActiveFilter = filterStatus !== 'ALL' || smartFilter !== 'ALL' || maxPrice !== null || minArea !== null;
  const visibleRecommendations = useMemo(
    () => hasActiveFilter
      ? recommendations.filter(r => filteredLotKeys.has(`${r.quadra}-${r.lot_number}`))
      : recommendations,
    [recommendations, hasActiveFilter, filteredLotKeys]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-green-600 animate-spin mb-3" />
        <p style={{ fontSize: 12, color: '#948F84', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Carregando mapa de lotes...</p>
      </div>
    );
  }

  if (lots.length === 0 && !hasPlanView) return null;

  // Alto Bellevue sources polygon data from JSON (not Supabase), so always render its plan view
  if (lots.length === 0 && hasPlanView && developmentId !== AB_DEV_ID) {
    return (
      <SubdivisionPlanView
        lots={[]}
        developmentId={developmentId}
        developmentName={developmentName}
        whatsappPhone={whatsappPhone}
        onLotClick={(lot) => setSelectedLot(lot)}
      />
    );
  }

  // Premium Alto Bellevue experience — self-contained with its own filters and bottom sheet
  if (developmentId === AB_DEV_ID && viewMode === 'plan') {
    return (
      <div className="scroll-mt-32">
        {/* Cabeçalho semântico (B1) — heading real + alternância de visão alinhada */}
        <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-1 h-6 rounded-full" style={{ background: '#C8A44A' }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B1928', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                Mapa de Disponibilidade
              </h2>
            </div>
            <p style={{ fontSize: 13, color: '#948F84', margin: 0, lineHeight: 1.5 }}>
              {stats.available} de {stats.total} lotes disponíveis em {quadras.size} quadras
            </p>
          </div>
          {hasPlanView && (
            <div
              className="flex items-center rounded-lg p-0.5 flex-shrink-0"
              style={{ background: '#F0EDE5', border: '1.5px solid rgba(200,164,74,0.35)' }}
              role="tablist"
              aria-label="Alternar entre planta e lista"
            >
              <button
                onClick={() => { setViewMode('list'); setSelectedLot(null); }}
                role="tab"
                aria-selected={false}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-md transition-all"
                style={{
                  background: 'transparent',
                  color: '#948F84',
                  fontSize: 11, fontWeight: 700,
                  boxShadow: 'none',
                  fontFamily: "var(--fu, 'Outfit', sans-serif)",
                  whiteSpace: 'nowrap',
                }}
              >
                <List size={11} />
                Lista
              </button>
              <button
                onClick={() => setViewMode('plan')}
                role="tab"
                aria-selected={true}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-md transition-all"
                style={{
                  background: '#fff',
                  color: '#0B1928',
                  fontSize: 11, fontWeight: 700,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  fontFamily: "var(--fu, 'Outfit', sans-serif)",
                  whiteSpace: 'nowrap',
                }}
              >
                <MapIcon size={11} />
                Planta
              </button>
            </div>
          )}
        </div>
        <AltoBellevuePlanView
          lots={lots}
          developmentId={developmentId}
          developmentName={developmentName}
          whatsappPhone={whatsappPhone}
          amenityOverrides={mapAmenities}
          virtualTourUrl={virtualTourUrl}
        />
      </div>
    );
  }

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col mb-6 gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-1 h-6 rounded-full" style={{ background: '#C8A44A' }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B1928', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                Mapa de Disponibilidade
              </h2>
            </div>
            <p style={{ fontSize: 13, color: '#948F84', margin: 0, lineHeight: 1.5 }}>
              {stats.available} de {stats.total} lotes disponíveis em {quadras.size} quadras
            </p>
          </div>
        </div>
        {/* Action buttons — wrap on mobile */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Rankings button — list mode only */}
          {hasRankings && viewMode === 'list' && (
            <button
              onClick={() => setShowRankings((r: boolean) => !r)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border transition-colors flex-shrink-0"
              style={{
                borderColor: showRankings ? '#C8A44A' : 'rgba(200,164,74,0.4)',
                background: showRankings ? '#FEF3C7' : '#fff',
                color: showRankings ? '#92400E' : '#0B1928',
                fontSize: 11, fontWeight: 700, fontFamily: "var(--fu, 'Outfit', sans-serif)",
                whiteSpace: 'nowrap',
              }}
            >
              <Trophy size={12} />
              Rankings
            </button>
          )}
          {/* View toggle */}
          {hasPlanView && (
            <div
              className="flex items-center rounded-lg p-0.5 flex-shrink-0"
              style={{ background: '#F0EDE5', border: '1.5px solid rgba(200,164,74,0.35)' }}
            >
              <button
                onClick={() => { setViewMode('list'); setSelectedLot(null); }}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-md transition-all"
                style={{
                  background: viewMode === 'list' ? '#fff' : 'transparent',
                  color: viewMode === 'list' ? '#0B1928' : '#948F84',
                  fontSize: 11, fontWeight: 700,
                  boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  fontFamily: "var(--fu, 'Outfit', sans-serif)",
                  whiteSpace: 'nowrap',
                }}
              >
                <List size={11} />
                Lista
              </button>
              <button
                onClick={() => { setViewMode('plan'); setSelectedLot(null); }}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-md transition-all"
                style={{
                  background: viewMode === 'plan' ? '#fff' : 'transparent',
                  color: viewMode === 'plan' ? '#0B1928' : '#948F84',
                  fontSize: 11, fontWeight: 700,
                  boxShadow: viewMode === 'plan' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  fontFamily: "var(--fu, 'Outfit', sans-serif)",
                  whiteSpace: 'nowrap',
                }}
              >
                <MapIcon size={11} />
                Planta
              </button>
            </div>
          )}
          {/* Filtros button — list mode only */}
          {viewMode === 'list' && (
            <button
              onClick={() => setShowFilters((f: boolean) => !f)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border transition-colors flex-shrink-0"
              style={{
                borderColor: showFilters ? '#C8A44A' : 'rgba(200,164,74,0.4)',
                background: showFilters ? '#0B1928' : '#fff',
                color: showFilters ? '#fff' : '#0B1928',
                fontSize: 11, fontWeight: 700, fontFamily: "var(--fu, 'Outfit', sans-serif)", letterSpacing: '0.06em', textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              <Filter size={12} />
              Filtros
              {(filterStatus !== 'ALL' || maxPrice !== null || minArea !== null || smartFilter !== 'ALL') && (
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C8A44A', display: 'inline-block' }} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Smart Filter Pills — list mode only ─────────────────────────────── */}
      {viewMode === 'list' && <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
        {SMART_FILTERS.map(sf => (
          <button
            key={sf.key}
            onClick={() => setSmartFilter(sf.key)}
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: smartFilter === sf.key ? '#0B1928' : '#F8F6F2',
              color: smartFilter === sf.key ? '#fff' : '#948F84',
              fontSize: 11,
              fontWeight: 700,
              border: smartFilter === sf.key ? 'none' : '1px solid rgba(184,179,168,0.3)',
              fontFamily: "var(--fu, 'Outfit', sans-serif)",
            }}
          >
            <span>{sf.icon}</span>
            {sf.label}
          </button>
        ))}
      </div>}

      {/* ── Stats Bar — list mode only ─────────────────────────────────────── */}
      {viewMode === 'list' && <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {([
          { label: 'Disponíveis', value: stats.available, color: '#16A34A', bg: '#DCFCE7', key: 'DISPONIVEL' },
          { label: 'Vendidos',    value: stats.sold,      color: '#DC2626', bg: '#FEE2E2', key: 'VENDIDO' },
          { label: 'Negociação',  value: stats.negotiation, color: '#D97706', bg: '#FEF3C7', key: 'NEGOCIACAO' },
          { label: 'Proprietários', value: stats.owner,   color: '#2563EB', bg: '#DBEAFE', key: 'PROPRIETARIO' },
        ] as const).map(item => (
          <button
            key={item.key}
            onClick={() => setFilterStatus((prev: string) => prev === item.key ? 'ALL' : item.key)}
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
      </div>}

      {/* ── Price range info — list mode only ──────────────────────────────── */}
      {viewMode === 'list' && stats.priceMin > 0 && (
        <div style={{ background: '#F8F6F2', border: '1px solid rgba(184,179,168,0.3)', borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <BarChart2 size={14} style={{ color: '#C8A44A', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#948F84', fontWeight: 600 }}>Lotes disponíveis:</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
            {fmtBRL(stats.priceMin)} — {fmtBRL(stats.priceMax)}
          </span>
          {stats.areaMin > 0 && <span style={{ fontSize: 11, color: '#948F84' }}>· a partir de {Math.round(stats.areaMin)}m²</span>}
        </div>
      )}

      {/* ── Payment Conditions — list mode only ────────────────────────────── */}
      {viewMode === 'list' && paymentConditions && (() => {
        const pc = paymentConditions;
        return (
          <div style={{ background: '#0B1928', borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
            <div className="flex items-center gap-2 mb-3">
              <div style={{ width: 20, height: 2, borderRadius: 1, background: '#C8A44A' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#C8A44A', textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                Condições de Pagamento
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Entrada', value: pc.entrada },
                { label: 'Parcelas', value: `${pc.parcelas}× ${pc.parcelValue}`, gold: true },
                { label: 'Forma', value: pc.method },
                { label: 'Direto com', value: pc.seller },
              ].map(item => (
                <div key={item.label}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 4px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>{item.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: item.gold ? '#C8A44A' : '#fff', margin: 0, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Filter Panel — list mode only ───────────────────────────────────── */}
      <AnimatePresence>
        {viewMode === 'list' && showFilters && (
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
                    onChange={(e: { target: { value: string } }) => setFilterStatus(e.target.value)}
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
                    onChange={(e: { target: { value: string } }) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
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
                    onChange={(e: { target: { value: string } }) => setMinArea(e.target.value ? Number(e.target.value) : null)}
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
                  onClick={() => { setFilterStatus('ALL'); setMaxPrice(null); setMinArea(null); setSmartFilter('ALL'); }}
                  style={{ fontSize: 11, color: '#948F84', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Rankings Section — list mode only ────────────────────────────────── */}
      <AnimatePresence>
        {viewMode === 'list' && showRankings && hasRankings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <RankingSection
              lots={lots}
              onLotClick={(lot) => setSelectedLot(lot)}
              whatsappPhone={whatsappPhone}
              developmentName={developmentName}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Legend — list mode only · data-driven, com contagem (M1) ─────────── */}
      {viewMode === 'list' && <div className="flex flex-wrap items-center gap-3 mb-5">
        {presentStatusCounts.map(({ key, cfg, count }) => (
          <div key={key} className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: 3, background: cfg.bg }} />
            <span style={{ fontSize: 11, color: '#948F84', fontWeight: 600 }}>{cfg.label}</span>
            <span style={{ fontSize: 11, color: '#B8B3A8', fontWeight: 700, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>{count}</span>
          </div>
        ))}
        {compareLots.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: 3, background: '#DBEAFE', border: '1.5px solid #2563EB' }} />
            <span style={{ fontSize: 11, color: '#948F84', fontWeight: 600 }}>Em comparação</span>
          </div>
        )}
      </div>}

      {/* ── Plan View ────────────────────────────────────────────────────────── */}
      {viewMode === 'plan' && (
        <div className="rounded-2xl overflow-hidden w-full" style={{ height: 'clamp(500px, 72vh, 780px)' }}>
          {developmentId === AB_DEV_ID
            ? <AltoBellevuePlanView
                lots={lots}
                developmentId={developmentId}
                developmentName={developmentName}
                whatsappPhone={whatsappPhone}
                amenityOverrides={mapAmenities}
              />
            : <SubdivisionPlanView
                lots={lots}
                developmentId={developmentId}
                developmentName={developmentName}
                whatsappPhone={whatsappPhone}
              />}
        </div>
      )}

      {/* ── IA Recommendations — respeitam os filtros ativos (M5) ────────────── */}
      {viewMode === 'list' && visibleRecommendations.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #0B1928 0%, #1a2e42 100%)', border: '1px solid rgba(200,164,74,0.2)' }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: '#C8A44A', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#C8A44A', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                Recomendações IA
              </span>
              {recLoading && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>atualizando...</span>}
            </div>
            <div className="flex gap-1">
              {(['all', 'investor', 'resident'] as const).map(p => (
                <button key={p} onClick={() => setRecProfile(p)}
                  style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                    background: recProfile === p ? '#C8A44A' : 'rgba(255,255,255,0.07)',
                    color: recProfile === p ? '#0B1928' : 'rgba(255,255,255,0.5)',
                    border: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)", textTransform: 'uppercase', letterSpacing: '0.1em',
                  }}>
                  {p === 'all' ? 'Geral' : p === 'investor' ? 'Investidor' : 'Morador'}
                </button>
              ))}
            </div>
          </div>
          {hasActiveFilter && (
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '0 0 10px', fontWeight: 500 }}>
              Mostrando recomendações dentro do filtro ativo.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {visibleRecommendations.map((rec, i) => {
              const lot = (lots as Lot[]).find(l => l.quadra === rec.quadra && l.lot_number === rec.lot_number);
              return (
                <button key={rec.id} onClick={() => lot && setSelectedLot(lot)}
                  className="text-left rounded-xl p-3 transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: lot ? 'pointer' : 'default' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#C8A44A', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                      #{i + 1} Q{rec.quadra} · L{rec.lot_number}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(200,164,74,0.2)', padding: '2px 7px', borderRadius: 20 }}>
                      {rec.scores.imiScore} pts
                    </span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: '0 0 4px', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(rec.price)}
                  </p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                    {Math.round(rec.area_m2)} m² · {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Math.round(rec.price / rec.area_m2))}/m²
                  </p>
                  {rec.reasons[0] && (
                    <p style={{ fontSize: 9, color: 'rgba(200,164,74,0.7)', margin: '6px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {rec.reasons[0]}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quadra List Controls ─────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p style={{ fontSize: 12, color: '#948F84', fontWeight: 600 }}>
              {filteredQuadras.size} quadra{filteredQuadras.size !== 1 ? 's' : ''} {smartFilter !== 'ALL' || filterStatus !== 'ALL' ? '· filtro ativo' : ''}
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

          <div className="space-y-3">
            {[...filteredQuadras.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([quadra, qLots]) => (
              <QuadraBlock
                key={quadra}
                quadra={quadra}
                lots={qLots}
                onLotClick={(lot) => setSelectedLot(lot)}
                isActive={activeQuadras.has(quadra)}
                onToggle={() => toggleQuadra(quadra)}
                compareIds={compareIds}
                recommendedIds={recommendedIds}
              />
            ))}

            {filteredQuadras.size === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#948F84' }}>
                <MapPin size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontWeight: 600, margin: 0 }}>Nenhum lote encontrado com os filtros aplicados.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Tip: how to compare ─────────────────────────────────────────────── */}
      {compareLots.length === 0 && viewMode === 'list' && stats.available > 1 && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#F8F6F2', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={13} style={{ color: '#C8A44A', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#948F84', fontWeight: 600 }}>
            Clique num lote para ver detalhes e adicionar à comparação (até 3 lotes)
          </span>
        </div>
      )}

      {/* ── CTA Strip ───────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 24, background: '#0B1928', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 13, color: '#C8A44A', fontWeight: 700, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
            {stats.available} lote{stats.available !== 1 ? 's' : ''} disponível{stats.available !== 1 ? 'is' : ''}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Escolha o seu. Fale com um especialista agora.
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
            onAddToCompare={addToCompare}
            isInCompare={compareIds.has(selectedLot.id)}
            allLots={lots}
            abPrice={abPricesMap.get(`${selectedLot.quadra}-${selectedLot.lot_number}`) ?? undefined}
          />
        )}
      </AnimatePresence>

      {/* ── Comparator Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showComparator && compareLots.length >= 2 && (
          <LotComparator
            lots={lots}
            compareLots={compareLots}
            developmentName={developmentName}
            whatsappPhone={whatsappPhone}
            allLots={lots}
            onRemove={removeFromCompare}
            onClose={() => setShowComparator(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Compare Bar ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {compareLots.length > 0 && (
          <CompareBar
            compareLots={compareLots}
            onRemove={removeFromCompare}
            onOpen={() => setShowComparator(true)}
            onClear={() => setCompareLots([])}
          />
        )}
      </AnimatePresence>
    </>
  );
}
