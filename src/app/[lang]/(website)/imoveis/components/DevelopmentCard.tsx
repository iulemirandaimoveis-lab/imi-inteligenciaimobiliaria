'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, MapPin, Bed, Maximize, Car, Map } from 'lucide-react';
import { Development } from '../types/development';
import { formatBRL } from '../data/developments';
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
        ready: 'bg-[#C49D5B]/20 text-[#C49D5B] border border-[#C49D5B]/30 backdrop-blur-md',
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
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group bg-[#141420] rounded-3xl overflow-hidden border border-white/[0.05] hover:border-[#C49D5B]/40 hover:shadow-[0_8px_32px_rgba(196,157,91,0.15)] transition-all duration-500 flex flex-col h-full"
        >
            {/* Imagem */}
            <Link href={`/${lang}/imoveis/${development.slug}`} className="block aspect-[16/11] relative bg-[#0D0F14] overflow-hidden">
                {development.images.main ? (
                    <Image
                        src={development.images.main}
                        alt={development.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
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
                            <Building2 className="w-16 h-16 text-white/20 mb-3" strokeWidth={1} />
                        )}
                        <span className="text-[10px] text-[#9CA3AF] font-bold px-4 text-center uppercase tracking-[0.2em] leading-relaxed">
                            {development.name}
                        </span>
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141420] via-[#141420]/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                {/* Badges Frontais */}
                <div className="absolute top-5 left-5 flex flex-col gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-md ${statusColors[development.status]}`}>
                        {statusLabels[development.status]}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-md bg-white/10 text-white backdrop-blur-md border border-white/20 capitalize">
                        <MapPin size={10} className="mr-1" />
                        {regionLabels[development.region] || development.region || 'Internacional'}
                    </span>
                </div>
            </Link>

            {/* Conteúdo */}
            <div className="p-8 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-4">
                    <Link href={`/${lang}/imoveis/${development.slug}`}>
                        <h3 className="font-display font-bold text-xl text-white leading-tight group-hover:text-[#C49D5B] transition-colors">
                            {development.name}
                        </h3>
                    </Link>
                    {development.developerLogo && (
                        <div className="relative w-14 h-9 md:w-16 md:h-10 flex-shrink-0 bg-white rounded-lg p-1.5 border border-white/10 flex items-center justify-center">
                            <div className="relative w-full h-full">
                                <Image
                                    src={development.developerLogo}
                                    alt={development.developer}
                                    fill
                                    className="object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                                    sizes="64px"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-start gap-2 text-[#9CA3AF] text-sm mb-6 font-light">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#C49D5B]" />
                    <span>{development.location.neighborhood}, {development.location.city}/{development.location.state}</span>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-3 gap-4 py-6 border-y border-white/[0.05] mb-8">
                    {development.specs.bedroomsRange && (
                        <div className="flex flex-col gap-1">
                            <Bed className="w-4 h-4 text-[#C49D5B]/70" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{development.specs.bedroomsRange} dorms</span>
                        </div>
                    )}
                    <div className="flex flex-col gap-1">
                        <Maximize className="w-4 h-4 text-[#C49D5B]/70" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{development.specs.areaRange}</span>
                    </div>
                    {development.specs.parkingRange && (
                        <div className="flex flex-col gap-1">
                            <Car className="w-4 h-4 text-[#C49D5B]/70" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{development.specs.parkingRange} vagas</span>
                        </div>
                    )}
                </div>

                {/* Preço e CTA */}
                <div className="flex items-center justify-between mt-auto">
                    <div>
                        <p className="text-[10px] text-[#6C757D] mb-1 uppercase tracking-widest font-bold">Investimento de</p>
                        <p className="text-2xl font-bold text-white font-display">
                            <span className="text-xs mr-1 font-sans text-[#6C757D]">R$</span>
                            {development.priceRange.min.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                    </div>
                    <Link
                        href={`/${lang}/imoveis/${development.slug}`}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-[12px] font-bold uppercase tracking-widest bg-[#1A1E2A] text-white border border-[#21263A] hover:bg-[#21263A] hover:border-[#C49D5B]/50 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                    >
                        Explorar
                    </Link>
                </div>
            </div>
        </motion.article>
    );
}
