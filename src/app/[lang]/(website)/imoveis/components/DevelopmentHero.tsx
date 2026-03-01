'use client';

import Image from 'next/image';
import { Building2, MapPin, Calendar, FileText } from 'lucide-react';
import { Development } from '../types/development';
import { motion } from 'framer-motion';
import { slideUp, staggerContainer } from '@/lib/animations';

interface DevelopmentHeroProps {
    development: Development;
}

const formatPrice = (price: number) => {
    if (price >= 1000000) {
        const m = price / 1000000;
        return m % 1 === 0 ? `${m}M` : `${m.toFixed(1).replace(/\.0$/, '')}M`;
    }
    return price.toLocaleString('pt-BR');
};

const STATUS_LABELS: Record<string, string> = {
    launch: 'Lançamento',
    ready: 'Pronta Entrega',
    under_construction: 'Em Construção',
};

export default function DevelopmentHero({ development }: DevelopmentHeroProps) {
    return (
        <section className="relative min-h-[65dvh] md:min-h-[70dvh] flex items-end overflow-hidden bg-[#0A1017]">
            {/* Hero Image */}
            <div className="absolute inset-0">
                {development.images.main ? (
                    <Image
                        src={development.images.main}
                        alt={development.name}
                        fill
                        priority
                        className="object-cover opacity-50"
                        sizes="100vw"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0D1117] via-[#141C26] to-[#0A1017] flex items-center justify-center">
                        <Building2 className="w-24 h-24 text-white/5" strokeWidth={1} />
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1017] via-[#0A1017]/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A1017]/30 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative w-full pb-12 md:pb-20 pt-36 md:pt-44">
                <div className="container-custom">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="max-w-4xl"
                    >
                        {/* Top row: Badge + Developer logo */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <motion.div variants={slideUp}>
                                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                    development.status === 'launch'
                                        ? 'bg-[#102A43] text-[#9FB3C8] border border-[#243B53]'
                                        : development.status === 'ready'
                                        ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/30'
                                        : 'bg-white/10 text-white/70 border border-white/10 backdrop-blur-sm'
                                }`}>
                                    {development.status === 'ready' && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    )}
                                    {STATUS_LABELS[development.status] || development.status}
                                </span>
                            </motion.div>

                            {development.developerLogo && (
                                <motion.div variants={slideUp} className="relative w-28 h-10 md:w-36 md:h-12">
                                    <Image
                                        src={development.developerLogo}
                                        alt={development.developer}
                                        fill
                                        className="object-contain object-left sm:object-right filter brightness-0 invert opacity-60"
                                    />
                                </motion.div>
                            )}
                        </div>

                        {/* Title */}
                        <motion.h1
                            variants={slideUp}
                            className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-white font-bold mb-8 leading-[1.08] tracking-tight"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            {development.name}
                        </motion.h1>

                        {/* Meta info */}
                        <motion.div
                            variants={slideUp}
                            className="flex flex-wrap items-center gap-y-3 gap-x-6 text-[#9FB3C8] text-sm border-l-2 border-[#334E68] pl-6"
                        >
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#627D98]" />
                                <span>
                                    {development.location.neighborhood}, {development.location.city}/{development.location.state}
                                </span>
                            </div>

                            {development.deliveryDate && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-[#627D98]" />
                                    <span>{development.deliveryDate}</span>
                                </div>
                            )}

                            {development.registrationNumber && (
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[#627D98]" />
                                    <span>R.I: {development.registrationNumber}</span>
                                </div>
                            )}
                        </motion.div>

                        {/* Price */}
                        <motion.div variants={slideUp} className="mt-10">
                            <p className="text-[10px] text-[#627D98] mb-1.5 uppercase tracking-[0.25em] font-bold">A partir de</p>
                            <p
                                className="text-3xl sm:text-4xl md:text-[44px] font-bold text-white tracking-tight"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                                <span className="text-base md:text-xl mr-2 font-sans font-normal text-[#627D98]">R$</span>
                                {formatPrice(development.priceRange.min)}
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
