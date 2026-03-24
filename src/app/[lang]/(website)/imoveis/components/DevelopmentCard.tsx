'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, MapPin, Bed, Bath, Car, Ruler, Heart } from 'lucide-react';
import { Development } from '../types/development';

/* ── IMI Brandkit v5.0 tokens ─────────────────────────────────────── */
const T = {
    bg:       '#0B1928',
    surface:  '#0F2035',
    elevated: '#142840',
    border:   'rgba(200,164,74,0.15)',
    borderHi: 'rgba(200,164,74,0.35)',
    gold:     '#C8A44A',
    goldBg:   'rgba(200,164,74,0.10)',
    text:     '#EBE7E0',
    textSub:  '#9FAAB8',
    textDim:  '#5C6B7D',
    success:  '#6BB87B',
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
    launch:            { label: 'Lançamento',    bg: 'rgba(200,164,74,0.15)', color: '#C8A44A' },
    ready:             { label: 'Pronta Entrega', bg: 'rgba(107,184,123,0.18)', color: T.success },
    under_construction:{ label: 'Em Obra',        bg: 'rgba(245,158,11,0.18)', color: '#F59E0B' },
    reserved:          { label: 'Reservado',      bg: 'rgba(167,139,250,0.18)',color: '#A78BFA' },
    available:         { label: 'Disponível',     bg: 'rgba(200,164,74,0.15)', color: '#C8A44A' },
}

const REGION_LABELS: Record<string, string> = {
    paraiba:      'Paraíba',
    pernambuco:   'Pernambuco',
    'sao-paulo':  'São Paulo',
    internacional:'Internacional',
    dubai:        'Dubai',
    usa:          'EUA',
}

const fmtPrice = (v: number) =>
    v >= 1_000_000
        ? `R$ ${(v / 1_000_000).toFixed(1).replace('.0', '')}M`
        : `R$ ${v.toLocaleString('pt-BR')}`

interface Props {
    development: Development;
    index: number;
    lang: string;
}

export default function DevelopmentCard({ development, index, lang }: Props) {
    const status = STATUS_CFG[development.status] ?? STATUS_CFG.launch
    const hasPrice = development.priceRange.min > 0

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
            style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 20,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            whileHover={{ boxShadow: `0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px ${T.borderHi}` }}
        >
            {/* ── Image ─────────────────────────────────────────────────────── */}
            <Link href={`/${lang}/imoveis/${development.slug}`} style={{ display: 'block', position: 'relative', aspectRatio: '4/3', background: T.elevated, overflow: 'hidden', flexShrink: 0 }}>
                {development.images.main ? (
                    <Image
                        src={development.images.main}
                        alt={`${development.name} - Imóvel em ${development.location.city || development.location.state || 'destaque'}`}
                        fill
                        loading="lazy"
                        className="object-cover"
                        style={{ transition: 'transform 600ms ease' }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)' }}
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Building2 size={36} style={{ color: T.textDim, opacity: 0.4 }} strokeWidth={1} />
                        <span style={{ color: T.textDim, fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                            {development.name}
                        </span>
                    </div>
                )}

                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.1) 70%, transparent 100%)' }} />

                {/* Status badge — top left */}
                <div style={{ position: 'absolute', top: 12, left: 12 }}>
                    <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        background: status.bg,
                        color: status.color,
                        border: `1px solid ${status.color}40`,
                        backdropFilter: 'blur(8px)',
                        textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4)',
                    }}>
                        {status.label}
                    </span>
                </div>

                {/* Heart — top right */}
                <button
                    style={{
                        position: 'absolute', top: 10, right: 10,
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'rgba(11,25,40,0.6)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                    onClick={e => e.preventDefault()}
                    aria-label="Favoritar"
                >
                    <Heart size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
                </button>

                {/* Price overlay — bottom left */}
                {hasPrice && (
                    <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                        <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: 8,
                            background: 'rgba(11,25,40,0.75)',
                            backdropFilter: 'blur(8px)',
                            color: T.gold,
                            fontSize: 13,
                            fontWeight: 700,
                            fontFamily: "var(--font-mono, 'DM Mono', monospace)",
                            border: `1px solid ${T.border}`,
                            textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4)',
                        }}>
                            {fmtPrice(development.priceRange.min)}
                        </span>
                    </div>
                )}

                {/* Region chip — bottom right */}
                <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px', borderRadius: 6,
                        background: 'rgba(11,25,40,0.6)', backdropFilter: 'blur(8px)',
                        color: T.textSub, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                        border: '1px solid rgba(255,255,255,0.08)',
                        textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4)',
                    }}>
                        <MapPin size={8} style={{ opacity: 0.6 }} />
                        {REGION_LABELS[development.region] || development.region || 'BR'}
                    </span>
                </div>
            </Link>

            {/* ── Content ───────────────────────────────────────────────────── */}
            <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                {/* Title */}
                <Link href={`/${lang}/imoveis/${development.slug}`}>
                    <h3 style={{
                        color: T.text, fontFamily: "var(--font-body, 'Outfit', sans-serif)",
                        fontSize: 17, fontWeight: 700, lineHeight: 1.3,
                        marginBottom: 6, transition: 'color 0.2s',
                    }}>
                        {development.name}
                    </h3>
                </Link>

                {/* Location */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14, color: T.textSub, fontSize: 12 }}>
                    <MapPin size={11} style={{ color: T.gold, opacity: 0.7, flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {[development.location.neighborhood, development.location.city, development.location.state].filter(Boolean).join(', ')}
                    </span>
                </div>

                {/* Specs row */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 0', borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`,
                    marginBottom: 16,
                }}>
                    {development.specs.bedroomsRange && development.specs.bedroomsRange !== '—' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.textSub, fontSize: 11 }}>
                            <Bed size={12} style={{ color: T.textDim }} />
                            {development.specs.bedroomsRange}
                        </span>
                    )}
                    {development.specs.areaRange && development.specs.areaRange !== '—' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.textSub, fontSize: 11 }}>
                            <Ruler size={12} style={{ color: T.textDim }} />
                            {development.specs.areaRange}
                        </span>
                    )}
                    {development.specs.parkingRange && development.specs.parkingRange !== '—' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.textSub, fontSize: 11 }}>
                            <Car size={12} style={{ color: T.textDim }} />
                            {development.specs.parkingRange}
                        </span>
                    )}
                </div>

                {/* CTA */}
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    {!hasPrice && (
                        <div>
                            <p style={{ color: T.textDim, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>
                                Valor
                            </p>
                            <p style={{ color: T.textSub, fontSize: 13, fontWeight: 600 }}>Consultar</p>
                        </div>
                    )}
                    <Link
                        href={`/${lang}/imoveis/${development.slug}`}
                        className="ml-auto inline-flex items-center justify-center h-[38px] px-5 rounded-[6px] text-[11px] font-bold tracking-wide uppercase no-underline transition-all duration-200 relative overflow-hidden"
                        style={{ background: '#0A1624', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        Ver Imóvel
                        <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' }} />
                    </Link>
                </div>
            </div>
        </motion.article>
    );
}
