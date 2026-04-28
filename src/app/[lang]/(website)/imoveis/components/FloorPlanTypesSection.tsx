'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Bed, Bath, Car, Building2, Briefcase } from 'lucide-react';
import Image from 'next/image';

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

const GOLD = '#C8A44A';
const NAVY = '#0B1928';

function fmtPrice(v: number | null): string {
  if (!v) return '—';
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (v >= 1_000) return `R$ ${Math.floor(v / 1_000)}k`;
  return `R$ ${v.toLocaleString('pt-BR')}`;
}

function fmtArea(from: number, to: number): string {
  if (from === to) return `${from.toFixed(0)} m²`;
  return `${from.toFixed(0)} – ${to.toFixed(0)} m²`;
}

export default function FloorPlanTypesSection({
  floorPlanTypes,
  towers,
  developmentName,
}: FloorPlanTypesSectionProps) {
  const hasTowers = towers && towers.length > 0;
  const towerIds = hasTowers
    ? [...new Set(floorPlanTypes.map(f => f.tower_id))]
    : [];

  const [activeTower, setActiveTower] = useState<string>(towerIds[0] ?? 'all');
  const [activePlanId, setActivePlanId] = useState<string>(floorPlanTypes[0]?.id ?? '');

  const visiblePlans =
    activeTower === 'all'
      ? floorPlanTypes
      : floorPlanTypes.filter(p => p.tower_id === activeTower);

  const activePlan = floorPlanTypes.find(p => p.id === activePlanId) ?? visiblePlans[0];

  const handleTowerChange = (tid: string) => {
    setActiveTower(tid);
    const first = floorPlanTypes.find(p => p.tower_id === tid);
    if (first) setActivePlanId(first.id);
  };

  if (!floorPlanTypes || floorPlanTypes.length === 0) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 rounded-full" style={{ background: GOLD }} />
        <h2
          className="text-xl font-bold tracking-tight"
          style={{ color: NAVY, fontFamily: "var(--font-body, 'Outfit', sans-serif)" }}
        >
          Tipologias de Plantas
        </h2>
      </div>

      {/* Tower selector */}
      {hasTowers && towerIds.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {towerIds.map(tid => {
            const tower = towers!.find(t => t.id === tid);
            const isActive = activeTower === tid;
            return (
              <button
                key={tid}
                onClick={() => handleTowerChange(tid)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                style={{
                  background: isActive ? NAVY : '#F0EDE5',
                  color: isActive ? '#fff' : NAVY,
                  border: `1.5px solid ${isActive ? NAVY : 'transparent'}`,
                }}
              >
                <Building2 size={13} />
                {tower?.name ?? tid}
              </button>
            );
          })}
        </div>
      )}

      {/* Plan type tabs */}
      <div className="flex gap-2 flex-wrap">
        {visiblePlans.map(plan => {
          const isActive = activePlanId === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => setActivePlanId(plan.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all duration-200"
              style={{
                background: isActive ? GOLD : '#fff',
                color: isActive ? NAVY : '#666',
                border: `1.5px solid ${isActive ? GOLD : '#E5E2DA'}`,
                fontWeight: isActive ? 700 : 500,
                boxShadow: isActive ? `0 2px 12px ${GOLD}40` : 'none',
              }}
            >
              {plan.category === 'comercial' ? (
                <Briefcase size={12} />
              ) : (
                <Building2 size={12} />
              )}
              {plan.name}
            </button>
          );
        })}
      </div>

      {/* Active plan detail */}
      <AnimatePresence mode="wait">
        {activePlan && (
          <motion.div
            key={activePlan.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid #E5E2DA', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Image or placeholder */}
                <div
                  className="relative min-h-[220px] md:min-h-[320px] flex items-center justify-center"
                  style={{ background: '#F7F5F2' }}
                >
                  {activePlan.images && activePlan.images.length > 0 ? (
                    <Image
                      src={activePlan.images[0]}
                      alt={`Planta ${activePlan.name} — ${developmentName}`}
                      fill
                      className="object-contain p-6"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <Ruler size={48} className="mx-auto mb-4" style={{ color: GOLD, opacity: 0.4 }} />
                      <p className="text-sm font-medium" style={{ color: '#948F84' }}>
                        Planta ilustrativa em breve
                      </p>
                    </div>
                  )}
                  {/* Tower badge */}
                  <div
                    className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                    style={{ background: NAVY, color: '#fff' }}
                  >
                    {activePlan.tower}
                  </div>
                  {/* Category badge */}
                  <div
                    className="absolute top-3 right-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                    style={{
                      background: activePlan.category === 'comercial' ? '#10B981' : GOLD,
                      color: activePlan.category === 'comercial' ? '#fff' : NAVY,
                    }}
                  >
                    {activePlan.category}
                  </div>
                </div>

                {/* Info */}
                <div className="p-6 md:p-8 flex flex-col justify-between">
                  <div>
                    <h3
                      className="text-2xl font-bold mb-1"
                      style={{ color: NAVY, fontFamily: "var(--font-body, 'Outfit', sans-serif)" }}
                    >
                      {activePlan.name}
                    </h3>
                    <p className="text-sm mb-6" style={{ color: '#948F84' }}>
                      {activePlan.tower}
                    </p>

                    {/* Specs grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <SpecChip
                        icon={<Ruler size={14} style={{ color: GOLD }} />}
                        label="Área"
                        value={fmtArea(activePlan.area_from, activePlan.area_to)}
                      />
                      {activePlan.bedrooms > 0 && (
                        <SpecChip
                          icon={<Bed size={14} style={{ color: GOLD }} />}
                          label="Quartos"
                          value={String(activePlan.bedrooms)}
                        />
                      )}
                      {activePlan.bathrooms > 0 && (
                        <SpecChip
                          icon={<Bath size={14} style={{ color: GOLD }} />}
                          label="Banheiros"
                          value={String(activePlan.bathrooms)}
                        />
                      )}
                      {activePlan.parking > 0 && (
                        <SpecChip
                          icon={<Car size={14} style={{ color: GOLD }} />}
                          label="Vagas"
                          value={String(activePlan.parking)}
                        />
                      )}
                    </div>

                    <p className="text-sm leading-relaxed mb-6" style={{ color: '#4B4740' }}>
                      {activePlan.description}
                    </p>
                  </div>

                  {/* Price */}
                  {(activePlan.price_from || activePlan.price_to) && (
                    <div
                      className="rounded-xl p-4"
                      style={{ background: '#F7F5F2', border: `1px solid ${GOLD}30` }}
                    >
                      <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#948F84' }}>
                        Faixa de Valores
                      </p>
                      <p className="text-xl font-bold tabular-nums" style={{ color: NAVY, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                        {fmtPrice(activePlan.price_from)}
                        {activePlan.price_to && activePlan.price_to !== activePlan.price_from && (
                          <span className="text-base font-medium mx-2" style={{ color: '#948F84' }}>até</span>
                        )}
                        {activePlan.price_to && activePlan.price_to !== activePlan.price_from && (
                          fmtPrice(activePlan.price_to)
                        )}
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: '#948F84' }}>
                        * Valores sujeitos à disponibilidade. Corrigidos mensalmente pelo INCC-FGV.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional floor plan images strip */}
              {activePlan.images && activePlan.images.length > 1 && (
                <div
                  className="flex gap-2 p-4 overflow-x-auto"
                  style={{ borderTop: '1px solid #E5E2DA', background: '#FAFAF9' }}
                >
                  {activePlan.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative flex-shrink-0 rounded-lg overflow-hidden"
                      style={{ width: 80, height: 60 }}
                    >
                      <Image
                        src={img}
                        alt={`${activePlan.name} — imagem ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary grid — all types at a glance */}
      <div>
        <p
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: '#948F84' }}
        >
          Todas as tipologias
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {visiblePlans.map(plan => (
            <button
              key={plan.id}
              onClick={() => setActivePlanId(plan.id)}
              className="text-left p-3 rounded-xl transition-all duration-200"
              style={{
                background: activePlanId === plan.id ? `${GOLD}12` : '#fff',
                border: `1.5px solid ${activePlanId === plan.id ? GOLD : '#E5E2DA'}`,
              }}
            >
              <p className="text-xs font-bold mb-0.5" style={{ color: NAVY }}>
                {plan.name}
              </p>
              <p className="text-[11px] font-mono" style={{ color: '#948F84' }}>
                {fmtArea(plan.area_from, plan.area_to)}
              </p>
              {plan.price_from && (
                <p className="text-[11px] mt-0.5" style={{ color: GOLD, fontWeight: 600 }}>
                  a partir de {fmtPrice(plan.price_from)}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpecChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg p-3"
      style={{ background: '#F7F5F2' }}
    >
      {icon}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#948F84' }}>
          {label}
        </p>
        <p className="text-sm font-bold" style={{ color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}
