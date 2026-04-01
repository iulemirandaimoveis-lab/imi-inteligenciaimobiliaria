'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, MapPin, Bed, Bath, Car, Ruler, Heart } from 'lucide-react';
import { Development } from '../types/development';

/* ── Light-theme tokens ─────────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string }> = {
    launch:            { label: 'Lançamento' },
    ready:             { label: 'Pronta Entrega' },
    under_construction:{ label: 'Em Obra' },
    reserved:          { label: 'Reservado' },
    available:         { label: 'Disponível' },
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
            className="bg-white border border-[#E2E0DB] rounded-2xl overflow-hidden flex flex-col h-full shadow-md hover:shadow-sm hover:opacity-90 transition-all duration-200"
        >
            {/* ── Image ─────────────────────────────────────────────────────── */}
            <Link href={`/${lang}/imoveis/${development.slug}`} className="block relative aspect-[4/3] bg-[#F0EDE8] overflow-hidden flex-shrink-0">
                {development.images.main ? (
                    <Image
                        src={development.images.main}
                        alt={`${development.name} - Imóvel em ${development.location.city || development.location.state || 'destaque'}`}
                        fill
                        loading="lazy"
                        className="object-cover scale-[1.03] transition-transform duration-500 hover:scale-100"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <Building2 size={36} className="text-[#B8B3A8] opacity-40" strokeWidth={1} />
                        <span className="text-[#B8B3A8] text-[10px] font-bold tracking-[0.15em] uppercase">
                            {development.name}
                        </span>
                    </div>
                )}

                {/* Status badge — top left */}
                <div className="absolute top-3 left-3">
                    <span className="inline-block bg-[#0B1928] text-white text-[10px] font-bold tracking-widest uppercase rounded-lg px-3 py-1">
                        {status.label}
                    </span>
                </div>

                {/* Heart — top right */}
                <button
                    className="absolute top-2.5 right-2.5 w-[34px] h-[34px] rounded-full bg-white/80 border border-[#E2E0DB] flex items-center justify-center cursor-pointer hover:bg-white transition-colors"
                    onClick={e => e.preventDefault()}
                    aria-label="Favoritar"
                >
                    <Heart size={14} className="text-[#5A6577]" />
                </button>

                {/* Region chip — bottom right */}
                <div className="absolute bottom-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/80 text-[#5A6577] text-[9px] font-bold tracking-[0.1em] uppercase border border-[#E2E0DB]">
                        <MapPin size={8} className="opacity-60" />
                        {REGION_LABELS[development.region] || development.region || 'BR'}
                    </span>
                </div>
            </Link>

            {/* ── Content ───────────────────────────────────────────────────── */}
            <div className="px-5 pt-4 pb-5 flex flex-col flex-grow">
                {/* Title */}
                <Link href={`/${lang}/imoveis/${development.slug}`}>
                    <h3 className="font-playfair text-lg text-[#0B1928] font-bold leading-tight mb-1.5 hover:text-[#2D3748] transition-colors" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        {development.name}
                    </h3>
                </Link>

                {/* Location */}
                <div className="flex items-center gap-1.5 mb-3.5 text-sm text-[#5A6577]">
                    <MapPin size={12} className="text-[#948F84] flex-shrink-0" />
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {[development.location.neighborhood, development.location.city, development.location.state].filter(Boolean).join(', ')}
                    </span>
                </div>

                {/* Specs row */}
                <div className="flex items-center gap-3 py-2.5 border-t border-b border-[#E2E0DB] mb-4">
                    {development.specs.bedroomsRange && development.specs.bedroomsRange !== '—' && (
                        <span className="flex items-center gap-1 text-sm text-[#2D3748]">
                            <Bed size={13} className="text-[#948F84]" />
                            {development.specs.bedroomsRange}
                        </span>
                    )}
                    {development.specs.areaRange && development.specs.areaRange !== '—' && (
                        <span className="flex items-center gap-1 text-sm text-[#2D3748]">
                            <Ruler size={13} className="text-[#948F84]" />
                            {development.specs.areaRange}
                        </span>
                    )}
                    {development.specs.parkingRange && development.specs.parkingRange !== '—' && (
                        <span className="flex items-center gap-1 text-sm text-[#2D3748]">
                            <Car size={13} className="text-[#948F84]" />
                            {development.specs.parkingRange}
                        </span>
                    )}
                </div>

                {/* Price + CTA */}
                <div className="mt-auto flex items-center justify-between gap-3">
                    <div>
                        {hasPrice ? (
                            <p className="font-mono text-xl font-bold text-[#0B1928]" style={{ fontFamily: "'JetBrains Mono', 'DM Mono', monospace" }}>
                                {fmtPrice(development.priceRange.min)}
                            </p>
                        ) : (
                            <>
                                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#948F84] mb-0.5">Valor</p>
                                <p className="text-sm font-semibold text-[#5A6577]">Consultar</p>
                            </>
                        )}
                    </div>
                    <Link
                        href={`/${lang}/imoveis/${development.slug}`}
                        className="inline-flex items-center justify-center bg-[#0B1928] text-white h-12 px-5 rounded-xl text-xs font-bold tracking-wider uppercase no-underline hover:bg-[#1a2d42] transition-colors"
                    >
                        Ver Imóvel
                    </Link>
                </div>
            </div>
        </motion.article>
    );
}
