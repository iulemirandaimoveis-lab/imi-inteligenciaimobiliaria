'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, MapPin, Bed, Maximize, Car, Map } from 'lucide-react';
import { Development } from '../types/development';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface DevelopmentCardProps {
    development: Development;
    index: number;
    lang: string;
}

export default function DevelopmentCard({ development, index, lang }: DevelopmentCardProps) {
    const statusColors = {
        launch: 'bg-white/10 text-white backdrop-blur-md border border-white/20',
        ready: 'bg-[#102A43]/20 text-[#486581] border border-[#334E68]/30 backdrop-blur-md',
        under_construction: 'bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-md'
    };

    const statusLabels = {
        launch: 'Lançamento',
        ready: 'Pronta Entrega',
        under_construction: 'Em Construção'
    };

    const regionLabels: Record<string, string> = {
        paraiba: 'Paraíba',
        pernambuco: 'Pernambuco',
        'sao-paulo': 'São Paulo',
        internacional: 'Internacional',
        dubai: 'Dubai',
        usa: 'EUA'
    };

    return (
        <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            className="group bg-[#141420] rounded-2xl md:rounded-3xl overflow-hidden border border-white/[0.05] hover:border-[#334E68]/30 transition-all duration-500 flex flex-col h-full"
        >
            {/* Imagem — dominant, cinematic aspect */}
            <Link href={`/${lang}/imoveis/${development.slug}`} className="block aspect-[4/3] relative bg-[#0D0F14] overflow-hidden">
                {development.images.main ? (
                    <Image
                        src={development.images.main}
                        alt={development.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-[800ms] ease-out"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1A1E2A] via-[#141420] to-[#0D0F14] flex flex-col items-center justify-center p-8">
                        {development.developerLogo ? (
                            <div className="relative w-[120px] h-[60px] md:w-[160px] md:h-[80px] mb-4 bg-white rounded-xl p-3 flex items-center justify-center">
                                <div className="relative w-full h-full opacity-70 group-hover:opacity-100 transition-all filter grayscale group-hover:grayscale-0">
                                    <Image
                                        src={development.developerLogo}
                                        alt={development.developer}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 120px, 160px"
                                    />
                                </div>
                            </div>
                        ) : (
                            <Building2 className="w-14 h-14 text-white/15 mb-3" strokeWidth={1} />
                        )}
                        <span className="text-[10px] text-[#9CA3AF]/60 font-bold px-4 text-center uppercase tracking-[0.2em] leading-relaxed">
                            {development.name}
                        </span>
                    </div>
                )}

                {/* Overlay — subtle gradient only at bottom for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141420]/80 via-transparent to-transparent" />

                {/* Status + Location badges */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] rounded-lg ${statusColors[development.status]}`}>
                        {statusLabels[development.status]}
                    </span>
                </div>
                <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] rounded-lg bg-black/40 text-white/80 backdrop-blur-sm border border-white/10">
                        <MapPin size={9} className="mr-1 opacity-60" />
                        {regionLabels[development.region] || development.region || 'Internacional'}
                    </span>
                </div>

                {/* Bottom image overlay: price preview on hover (desktop) */}
                <div className="absolute bottom-0 inset-x-0 p-5 hidden md:flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <p className="text-white/90 text-xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        {development.name}
                    </p>
                </div>
            </Link>

            {/* Content — refined spacing */}
            <div className="p-5 md:p-6 flex flex-col flex-grow">
                {/* Title + Developer */}
                <div className="flex justify-between items-start gap-3 mb-3">
                    <Link href={`/${lang}/imoveis/${development.slug}`} className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-white leading-snug group-hover:text-[#829AB1] transition-colors duration-300" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                            {development.name}
                        </h3>
                    </Link>
                    {development.developerLogo && (
                        <div className="relative w-12 h-8 flex-shrink-0 bg-white rounded-md p-1 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                            <div className="relative w-full h-full">
                                <Image
                                    src={development.developerLogo}
                                    alt={development.developer}
                                    fill
                                    className="object-contain"
                                    sizes="48px"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-[#9CA3AF] text-[13px] mb-5 font-light">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#627D98]" />
                    <span className="truncate">{development.location.neighborhood}, {development.location.city}/{development.location.state}</span>
                </div>

                {/* Specs — horizontal chips */}
                <div className="flex items-center gap-3 py-4 border-t border-white/[0.05] mb-5">
                    {development.specs.bedroomsRange && (
                        <div className="flex items-center gap-1.5">
                            <Bed className="w-3.5 h-3.5 text-[#627D98]/60" />
                            <span className="text-[11px] font-semibold text-white/80">{development.specs.bedroomsRange}</span>
                        </div>
                    )}
                    <div className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-1.5">
                        <Maximize className="w-3.5 h-3.5 text-[#627D98]/60" />
                        <span className="text-[11px] font-semibold text-white/80">{development.specs.areaRange}</span>
                    </div>
                    {development.specs.parkingRange && (
                        <>
                            <div className="w-px h-3 bg-white/10" />
                            <div className="flex items-center gap-1.5">
                                <Car className="w-3.5 h-3.5 text-[#627D98]/60" />
                                <span className="text-[11px] font-semibold text-white/80">{development.specs.parkingRange}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Price + CTA — elegant bottom row */}
                <div className="flex items-end justify-between mt-auto pt-1">
                    <div>
                        <p className="text-[9px] text-[#627D98] mb-0.5 uppercase tracking-[0.15em] font-semibold">Investimento de</p>
                        <p className="text-[22px] font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                            <span className="text-[11px] mr-0.5 font-sans text-[#627D98] font-medium">R$</span>
                            {development.priceRange.min >= 1000000
                                ? `${(development.priceRange.min / 1000000).toFixed(1).replace('.0', '')}M`
                                : development.priceRange.min.toLocaleString('pt-BR')
                            }
                        </p>
                    </div>
                    <Link
                        href={`/${lang}/imoveis/${development.slug}`}
                        className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] bg-[#102A43] text-white/90 hover:bg-[#1A2F44] transition-all duration-300 border border-[#1A2F44] hover:border-[#334E68]/50"
                    >
                        Explorar
                    </Link>
                </div>
            </div>
        </motion.article>
    );
}
