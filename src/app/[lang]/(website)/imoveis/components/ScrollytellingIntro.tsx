'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import Image from 'next/image';
import { Building2, Layers, Star } from 'lucide-react';

interface Tower {
  id: string;
  name: string;
  tagline: string;
  description: string;
  floor_count: number;
  image: string | null;
}

interface ScrollytellingIntroProps {
  developmentName: string;
  conceptDescription: string;
  towers?: Tower[];
  heroImages?: string[];
}

const GOLD = '#C8A44A';
const NAVY = '#0B1928';

/* ─── Animated stat number ─────────────────────────────────── */
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const dur = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to]);

  return (
    <span ref={ref}>
      {val.toLocaleString('pt-BR')}
      {suffix}
    </span>
  );
}

/* ─── Section that fades+slides in on scroll ──────────────── */
function RevealSection({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Tower card ───────────────────────────────────────────── */
function TowerCard({ tower, index }: { tower: Tower; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index === 0 ? -40 : 40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl overflow-hidden group"
      style={{ border: `1px solid rgba(200,164,74,0.2)` }}
    >
      {/* Background image or gradient */}
      {tower.image ? (
        <div className="relative h-56 w-full overflow-hidden">
          <Image
            src={tower.image}
            alt={tower.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(11,25,40,0.85) 0%, rgba(11,25,40,0.2) 60%)' }} />
        </div>
      ) : (
        <div
          className="h-56 flex items-end p-6"
          style={{ background: index === 0 ? 'linear-gradient(135deg, #0B1928 0%, #1a3a5c 100%)' : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
        >
          <Building2 size={40} style={{ color: GOLD, opacity: 0.3 }} />
        </div>
      )}

      {/* Content */}
      <div className="p-6" style={{ background: '#fff' }}>
        {/* Tower name */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: index === 0 ? GOLD : '#10B981' }}
          />
          <p
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: '#948F84' }}
          >
            Torre {index + 1}
          </p>
        </div>
        <h3
          className="text-2xl font-bold mb-1"
          style={{ color: NAVY, fontFamily: "var(--font-body, 'Outfit', sans-serif)" }}
        >
          {tower.name}
        </h3>
        <p className="text-sm font-medium mb-3" style={{ color: GOLD }}>
          {tower.tagline}
        </p>
        <p className="text-sm leading-relaxed mb-4" style={{ color: '#4B4740' }}>
          {tower.description}
        </p>

        {/* Floor count badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ background: '#F0EDE5', color: NAVY }}
        >
          <Layers size={11} />
          {tower.floor_count} pavimentos
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Cinematic concept section ────────────────────────────── */
function ConceptSection({
  developmentName,
  conceptDescription,
}: {
  developmentName: string;
  conceptDescription: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [30, -30]);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-3xl py-16 px-8 md:px-16 text-center"
      style={{ background: NAVY }}
    >
      {/* Animated background orb */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 pointer-events-none"
        aria-hidden
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${GOLD}18 0%, transparent 70%)`,
          }}
        />
      </motion.div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Gold star */}
        <RevealSection>
          <div className="flex items-center justify-center gap-2 mb-6">
            <Star size={12} fill={GOLD} style={{ color: GOLD }} />
            <span
              className="text-[11px] font-bold uppercase tracking-[4px]"
              style={{ color: GOLD }}
            >
              {developmentName}
            </span>
            <Star size={12} fill={GOLD} style={{ color: GOLD }} />
          </div>
        </RevealSection>

        <RevealSection delay={0.1}>
          <p
            className="text-2xl md:text-3xl font-bold leading-snug mb-8"
            style={{ color: '#fff', fontFamily: "var(--font-body, 'Outfit', sans-serif)" }}
          >
            {conceptDescription}
          </p>
        </RevealSection>

        {/* Stats */}
        <RevealSection delay={0.2}>
          <div className="grid grid-cols-3 gap-4 pt-8" style={{ borderTop: `1px solid rgba(200,164,74,0.2)` }}>
            {[
              { value: 2, suffix: ' torres', label: 'Única complexo multiuso de Garanhuns' },
              { value: 19, suffix: ' pav.', label: 'Soul Residence' },
              { value: 200, suffix: '+ un.', label: 'Unidades disponíveis' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p
                  className="text-3xl md:text-4xl font-bold tabular-nums mb-1"
                  style={{ color: GOLD, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}
                >
                  <CountUp to={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </div>
  );
}

/* ─── Horizontal scroll feature strip ─────────────────────── */
function FeatureStrip({ features }: { features: string[] }) {
  if (!features || features.length === 0) return null;
  return (
    <RevealSection>
      <div className="relative">
        {/* Fade edges */}
        <div
          className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #F7F5F2, transparent)' }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #F7F5F2, transparent)' }}
        />
        <div className="flex gap-2 overflow-x-auto pb-1 px-2" style={{ scrollbarWidth: 'none' }}>
          {features.map((feature, i) => (
            <span
              key={i}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
              style={{
                background: i % 3 === 0 ? `${GOLD}15` : i % 3 === 1 ? '#F0EDE5' : `${NAVY}08`,
                color: i % 3 === 0 ? '#7A5F1A' : NAVY,
                border: `1px solid ${i % 3 === 0 ? `${GOLD}40` : '#E5E2DA'}`,
              }}
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}

/* ─── Main export ──────────────────────────────────────────── */
export default function ScrollytellingIntro({
  developmentName,
  conceptDescription,
  towers,
  heroImages,
}: ScrollytellingIntroProps) {
  const hasTowers = towers && towers.length > 0;

  return (
    <div className="space-y-12 md:space-y-16">
      {/* Concept / brand section */}
      {conceptDescription && (
        <ConceptSection
          developmentName={developmentName}
          conceptDescription={conceptDescription}
        />
      )}

      {/* Two towers reveal */}
      {hasTowers && towers!.length >= 2 && (
        <RevealSection>
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 rounded-full" style={{ background: GOLD }} />
              <h2
                className="text-xl font-bold tracking-tight"
                style={{ color: NAVY, fontFamily: "var(--font-body, 'Outfit', sans-serif)" }}
              >
                Duas Torres, Um Destino
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {towers!.map((tower, i) => (
                <TowerCard key={tower.id} tower={tower} index={i} />
              ))}
            </div>
          </div>
        </RevealSection>
      )}

      {/* Single tower description */}
      {hasTowers && towers!.length === 1 && (
        <RevealSection>
          <TowerCard tower={towers![0]} index={0} />
        </RevealSection>
      )}

      {/* Hero image strip (if provided) */}
      {heroImages && heroImages.length > 1 && (
        <RevealSection>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {heroImages.slice(0, 5).map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative flex-shrink-0 rounded-xl overflow-hidden"
                style={{ width: i === 0 ? 280 : 180, height: 140 }}
              >
                <Image
                  src={img}
                  alt={`${developmentName} — ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="280px"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        </RevealSection>
      )}
    </div>
  );
}

export { RevealSection, ConceptSection, FeatureStrip };
