'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bed, Bath, Car, Building2, CheckCircle2, MessageCircle, Layers } from 'lucide-react';

/* ─── Interfaces ─────────────────────────────────────────────────── */
export interface FloorPlanType {
  id: string;
  name: string;
  tower: string;
  tower_id: string;
  category: 'residencial' | 'comercial';
  area_from: number;
  area_to: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  price_from: number | null;
  price_to: number | null;
  images: string[];
  description: string;
  installments?: number;
}

interface Tower {
  id: string;
  name: string;
  tagline: string;
  description: string;
  floor_count: number;
  image: string | null;
}

interface FloorPlanTypesSectionProps {
  floorPlanTypes: FloorPlanType[];
  towers?: Tower[];
  developmentName: string;
}

/* ─── Constants ──────────────────────────────────────────────────── */
const GOLD = '#C8A44A';
const NAVY = '#0B1928';
const NAVY2 = '#0F2235';
const TEAL = '#00B4D8';
const WARM_GOLD = '#E8B86D';
const WHATSAPP = '#25D366';

const TOWER_META: Record<string, { accent: string; category: string; tagline: string }> = {
  'fusion-center': { accent: TEAL, category: 'Multiuso', tagline: 'Escritórios & studios no coração urbano' },
  'soul-residence': { accent: WARM_GOLD, category: 'Residencial', tagline: 'Apartamentos com alma e conforto' },
};

function getInstallments(plan: FloorPlanType): number {
  if (plan.installments !== undefined) return plan.installments;
  return plan.tower_id === 'soul-residence' ? 60 : 49;
}

function fmtPriceFull(v: number | null): string {
  if (!v) return '—';
  return `R$ ${v.toLocaleString('pt-BR')}`;
}

function fmtAreaRange(from: number, to: number): string {
  if (from === to) return `${from.toFixed(0)}`;
  return `${from.toFixed(0)}–${to.toFixed(0)}`;
}

function buildWhatsAppMsg(typeName: string, towerName: string, developmentName: string): string {
  const msg = `Olá! Tenho interesse no ${typeName} do ${towerName} no ${developmentName}. Pode me enviar mais detalhes?`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

/* ─── Sub-components ─────────────────────────────────────────────── */

function CategoryBadge({ category }: { category: 'residencial' | 'comercial' }) {
  const isCom = category === 'comercial';
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{
        background: isCom ? `${TEAL}20` : `${WARM_GOLD}20`,
        color: isCom ? TEAL : WARM_GOLD,
        border: `1px solid ${isCom ? TEAL : WARM_GOLD}40`,
      }}
    >
      {isCom ? 'Comercial' : 'Residencial'}
    </span>
  );
}

function SpecChip({ icon, label }: { icon: React.ReactNode; label: string | number }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
      style={{ background: 'rgba(255,255,255,0.07)', color: '#fff' }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function FloorPlanTypesSection({
  floorPlanTypes,
  towers,
  developmentName,
}: FloorPlanTypesSectionProps) {
  if (!floorPlanTypes || floorPlanTypes.length === 0) return null;

  const hasTowers = towers && towers.length > 0;
  const towerIds = hasTowers
    ? [...new Set(floorPlanTypes.map(f => f.tower_id))]
    : [];

  const [activeTower, setActiveTower] = useState<string>(towerIds[0] ?? 'all');
  const [activePlanId, setActivePlanId] = useState<string>(
    floorPlanTypes.find(p => p.tower_id === (towerIds[0] ?? 'all'))?.id ?? floorPlanTypes[0]?.id ?? ''
  );

  const visiblePlans =
    activeTower === 'all'
      ? floorPlanTypes
      : floorPlanTypes.filter(p => p.tower_id === activeTower);

  const activePlan = visiblePlans.find(p => p.id === activePlanId) ?? visiblePlans[0];

  const handleTowerChange = (tid: string) => {
    setActiveTower(tid);
    const first = floorPlanTypes.find(p => p.tower_id === tid);
    if (first) setActivePlanId(first.id);
  };

  const handleJump = (plan: FloorPlanType) => {
    setActiveTower(plan.tower_id);
    setActivePlanId(plan.id);
    // scroll to top of section smoothly
    const el = document.getElementById('floor-plan-types-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div id="floor-plan-types-section" className="space-y-8">
      {/* ── Section Header ── */}
      <div className="flex items-start gap-3">
        <div
          className="mt-1 w-1 h-8 rounded-full flex-shrink-0"
          style={{ background: `linear-gradient(180deg, ${GOLD}, transparent)` }}
        />
        <div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: NAVY, fontFamily: "var(--font-body, 'Outfit', sans-serif)" }}
          >
            Plantas &amp; Valores
          </h2>
          <p className="text-sm mt-0.5" style={{ color: '#948F84' }}>
            {floorPlanTypes.length} tipologi{floorPlanTypes.length === 1 ? 'a' : 'as'} disponíve{floorPlanTypes.length === 1 ? 'l' : 'is'}
          </p>
        </div>
      </div>

      {/* ── Tower Selector (large cards, 2-col grid) ── */}
      {hasTowers && towerIds.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {towerIds.map(tid => {
            const tower = towers!.find(t => t.id === tid);
            const isActive = activeTower === tid;
            const meta = TOWER_META[tid] ?? { accent: GOLD, category: 'Torre', tagline: '' };
            const typesInTower = floorPlanTypes.filter(p => p.tower_id === tid);
            return (
              <motion.button
                key={tid}
                onClick={() => handleTowerChange(tid)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="text-left p-5 rounded-2xl transition-all duration-200 relative overflow-hidden"
                style={{
                  background: isActive ? NAVY : '#F7F5F2',
                  border: `2px solid ${isActive ? GOLD : '#E5E2DA'}`,
                  boxShadow: isActive ? `0 4px 24px ${GOLD}30` : 'none',
                }}
              >
                {/* accent line top */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                  style={{ background: isActive ? meta.accent : 'transparent' }}
                />
                <div className="flex items-start justify-between gap-2 mt-1">
                  <div>
                    <p
                      className="text-xs font-bold uppercase tracking-widest mb-1"
                      style={{ color: isActive ? meta.accent : '#948F84' }}
                    >
                      {meta.category}
                    </p>
                    <h3
                      className="text-xl font-bold mb-1"
                      style={{
                        color: isActive ? '#fff' : NAVY,
                        fontFamily: "var(--font-body, 'Outfit', sans-serif)",
                      }}
                    >
                      {tower?.name ?? tid}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: isActive ? 'rgba(255,255,255,0.6)' : '#948F84' }}>
                      {tower?.tagline ?? meta.tagline}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {tower?.floor_count ? (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          background: isActive ? 'rgba(255,255,255,0.1)' : '#E5E2DA',
                          color: isActive ? '#fff' : NAVY,
                        }}
                      >
                        {tower.floor_count} andares
                      </span>
                    ) : null}
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        background: isActive ? `${meta.accent}20` : `${meta.accent}15`,
                        color: meta.accent,
                        border: `1px solid ${meta.accent}40`,
                      }}
                    >
                      {typesInTower.length} tipo{typesInTower.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {tower?.description && (
                  <p
                    className="text-[11px] mt-3 leading-relaxed line-clamp-2"
                    style={{ color: isActive ? 'rgba(255,255,255,0.5)' : '#B0A89A' }}
                  >
                    {tower.description}
                  </p>
                )}
                {isActive && (
                  <div className="absolute bottom-3 right-3">
                    <CheckCircle2 size={16} style={{ color: GOLD }} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* ── Type Scroll / Grid ── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#948F84' }}>
          Selecione a tipologia
        </p>
        {/* horizontal scroll on mobile, wrapping grid on desktop */}
        <div className="flex gap-3 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible">
          {visiblePlans.map(plan => {
            const isActive = activePlanId === plan.id;
            const installments = getInstallments(plan);
            return (
              <motion.button
                key={plan.id}
                onClick={() => setActivePlanId(plan.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-shrink-0 text-left p-4 rounded-2xl transition-all duration-200 relative"
                style={{
                  width: 200,
                  background: isActive ? NAVY : '#fff',
                  border: `2px solid ${isActive ? GOLD : '#E5E2DA'}`,
                  boxShadow: isActive ? `0 4px 20px ${GOLD}25` : '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                {isActive && (
                  <div className="absolute top-2.5 right-2.5">
                    <CheckCircle2 size={14} style={{ color: GOLD }} />
                  </div>
                )}
                <div className="mb-2">
                  <CategoryBadge category={plan.category} />
                </div>
                <p
                  className="text-base font-bold mb-1 leading-tight"
                  style={{ color: isActive ? '#fff' : NAVY }}
                >
                  {plan.name}
                </p>
                <p
                  className="text-lg font-bold mb-2 font-mono"
                  style={{
                    color: isActive ? GOLD : NAVY,
                    fontFamily: "var(--fm, 'JetBrains Mono', monospace)",
                  }}
                >
                  {fmtAreaRange(plan.area_from, plan.area_to)}{' '}
                  <span className="text-sm font-normal">m²</span>
                </p>
                {plan.price_from && (
                  <p className="text-[11px] mb-3" style={{ color: isActive ? 'rgba(255,255,255,0.6)' : '#948F84' }}>
                    a partir de{' '}
                    <span className="font-bold" style={{ color: isActive ? GOLD : NAVY }}>
                      {fmtPriceFull(plan.price_from)}
                    </span>
                  </p>
                )}
                {/* Spec row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {plan.bedrooms > 0 && (
                    <span
                      className="flex items-center gap-1 text-[11px] font-semibold"
                      style={{ color: isActive ? 'rgba(255,255,255,0.7)' : '#948F84' }}
                    >
                      <Bed size={11} /> {plan.bedrooms}
                    </span>
                  )}
                  {plan.bathrooms > 0 && (
                    <span
                      className="flex items-center gap-1 text-[11px] font-semibold"
                      style={{ color: isActive ? 'rgba(255,255,255,0.7)' : '#948F84' }}
                    >
                      <Bath size={11} /> {plan.bathrooms}
                    </span>
                  )}
                  {plan.parking > 0 && (
                    <span
                      className="flex items-center gap-1 text-[11px] font-semibold"
                      style={{ color: isActive ? 'rgba(255,255,255,0.7)' : '#948F84' }}
                    >
                      <Car size={11} /> {plan.parking}
                    </span>
                  )}
                  {!plan.bedrooms && !plan.bathrooms && !plan.parking && (
                    <span className="text-[11px]" style={{ color: isActive ? 'rgba(255,255,255,0.4)' : '#C0BAB2' }}>
                      {installments}x mensais
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Detail Panel ── */}
      <AnimatePresence mode="wait">
        {activePlan && (
          <motion.div
            key={activePlan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="rounded-2xl overflow-hidden"
            style={{ background: NAVY }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left column — dark, area hero */}
              <div className="p-6 md:p-8 flex flex-col justify-between" style={{ background: NAVY }}>
                <div>
                  {/* Tower label */}
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-4"
                    style={{ color: GOLD, fontVariant: 'small-caps' }}
                  >
                    {activePlan.tower}
                  </p>

                  {/* HUGE area number */}
                  <div className="flex items-end gap-2 mb-6">
                    <span
                      className="font-bold leading-none"
                      style={{
                        fontSize: 72,
                        color: '#fff',
                        fontFamily: "var(--fm, 'JetBrains Mono', monospace)",
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {fmtAreaRange(activePlan.area_from, activePlan.area_to)}
                    </span>
                    <span
                      className="font-bold mb-2"
                      style={{ fontSize: 32, color: GOLD, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}
                    >
                      m²
                    </span>
                  </div>

                  {/* Spec chips */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {activePlan.bedrooms > 0 && (
                      <SpecChip icon={<Bed size={14} style={{ color: GOLD }} />} label={`${activePlan.bedrooms} quarto${activePlan.bedrooms !== 1 ? 's' : ''}`} />
                    )}
                    {activePlan.bathrooms > 0 && (
                      <SpecChip icon={<Bath size={14} style={{ color: GOLD }} />} label={`${activePlan.bathrooms} banheiro${activePlan.bathrooms !== 1 ? 's' : ''}`} />
                    )}
                    {activePlan.parking > 0 && (
                      <SpecChip icon={<Car size={14} style={{ color: GOLD }} />} label={`${activePlan.parking} vaga${activePlan.parking !== 1 ? 's' : ''}`} />
                    )}
                    {!activePlan.bedrooms && !activePlan.bathrooms && !activePlan.parking && (
                      <SpecChip icon={<Building2 size={14} style={{ color: GOLD }} />} label="Comercial" />
                    )}
                  </div>

                  {/* Description */}
                  {activePlan.description && (
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {activePlan.description}
                    </p>
                  )}
                </div>

                {/* Category badge at bottom */}
                <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <CategoryBadge category={activePlan.category} />
                </div>
              </div>

              {/* Right column — slightly lighter, payment + CTA */}
              <div className="p-6 md:p-8 flex flex-col justify-between" style={{ background: NAVY2 }}>
                <div>
                  {/* Type name */}
                  <h3
                    className="text-2xl font-bold mb-6"
                    style={{ color: '#fff', fontFamily: "var(--font-body, 'Outfit', sans-serif)" }}
                  >
                    {activePlan.name}
                  </h3>

                  {/* Payment breakdown card */}
                  <div
                    className="rounded-xl p-5 mb-6"
                    style={{ border: `1px solid ${GOLD}30`, background: 'rgba(200,164,74,0.05)' }}
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-widest mb-4"
                      style={{ color: GOLD }}
                    >
                      Condições de pagamento
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>A partir de</span>
                        <span
                          className="text-lg font-bold font-mono"
                          style={{ color: '#fff', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}
                        >
                          {fmtPriceFull(activePlan.price_from)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Parcelas mensais</span>
                        <span
                          className="text-base font-bold font-mono"
                          style={{ color: GOLD, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}
                        >
                          {getInstallments(activePlan)}x
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>+ entrada + escritura</span>
                        <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>consultar</span>
                      </div>
                    </div>
                    <div
                      className="mt-4 pt-3 text-[10px] leading-relaxed"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}
                    >
                      Valores corrigidos pelo INCC-FGV &bull; Sujeito a disponibilidade
                    </div>
                  </div>
                </div>

                {/* WhatsApp CTA */}
                <a
                  href={buildWhatsAppMsg(activePlan.name, activePlan.tower, developmentName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200"
                  style={{
                    background: WHATSAPP,
                    color: '#fff',
                    textDecoration: 'none',
                    boxShadow: `0 4px 20px ${WHATSAPP}40`,
                  }}
                >
                  <MessageCircle size={18} />
                  Tenho interesse — falar com consultor
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── All Types Summary Grid ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Layers size={13} style={{ color: '#948F84' }} />
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#948F84' }}>
            Todas as tipologias
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {floorPlanTypes.map(plan => {
            const isActive = activePlanId === plan.id && activeTower === plan.tower_id;
            return (
              <button
                key={plan.id}
                onClick={() => handleJump(plan)}
                className="text-left p-3 rounded-xl transition-all duration-200"
                style={{
                  background: isActive ? `${GOLD}12` : '#fff',
                  border: `1.5px solid ${isActive ? GOLD : '#E5E2DA'}`,
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#948F84' }}>
                  {plan.tower}
                </p>
                <p className="text-xs font-bold mb-0.5" style={{ color: NAVY }}>
                  {plan.name}
                </p>
                <p
                  className="text-[11px] font-mono"
                  style={{
                    color: '#948F84',
                    fontFamily: "var(--fm, 'JetBrains Mono', monospace)",
                  }}
                >
                  {fmtAreaRange(plan.area_from, plan.area_to)} m²
                </p>
                {plan.price_from && (
                  <p className="text-[11px] mt-0.5 font-semibold" style={{ color: GOLD }}>
                    {fmtPriceFull(plan.price_from)}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
