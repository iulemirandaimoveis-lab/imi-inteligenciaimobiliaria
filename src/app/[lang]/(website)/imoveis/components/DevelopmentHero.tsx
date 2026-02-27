'use client';

import Image from 'next/image';
import { Building2, MapPin, Calendar, FileText } from 'lucide-react';
import { Development } from '../types/development';
import Badge from '@/components/ui/Badge';
import { motion } from 'framer-motion';
import { slideUp, staggerContainer } from '@/lib/animations';

interface DevelopmentHeroProps {
    development: Development;
}

export default function DevelopmentHero({ development }: DevelopmentHeroProps) {
    return (
        <section className="relative min-h-[70dvh] flex items-end overflow-hidden group bg-imi-950">
            {/* Hero Image Container */}
            <div className="absolute inset-0">
                {development.images.main ? (
                    <Image
                        src={development.images.main}
                        alt={development.name}
                        fill
                        priority
                        className="object-cover opacity-60"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-imi-900 via-imi-800 to-imi-950 flex items-center justify-center">
                        <Building2 className="w-24 h-24 text-white/5" strokeWidth={1} />
                    </div>
                )}

                {/* Overlay gradient - Premium look */}
                <div className="absolute inset-0 bg-gradient-to-t from-imi-950 via-imi-950/40 to-transparent" />
            </div>

            {/* Conteúdo sobre a imagem */}
            <div className="relative w-full pb-16 md:pb-24 pt-40">
                <div className="container-custom">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="max-w-4xl"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <motion.div variants={slideUp}>
                                <Badge className={
                                    development.status === 'launch' ? 'bg-accent-500 text-white' : 'bg-white/10 text-white backdrop-blur-md border-white/20'
                                }>
                                    {development.status === 'launch' && 'Lançamento'}
                                    {development.status === 'ready' && 'Pronta Entrega'}
                                    {development.status === 'under_construction' && 'Em Construção'}
                                </Badge>
                            </motion.div>

                            {development.developerLogo && (
                                <motion.div variants={slideUp} className="relative w-32 h-12 md:w-40 md:h-16">
                                    <Image
                                        src={development.developerLogo}
                                        alt={development.developer}
                                        fill
                                        className="object-contain object-left md:object-right filter brightness-0 invert opacity-80"
                                    />
                                </motion.div>
                            )}
                        </div>

                        <motion.h1 variants={slideUp} className="font-display text-4xl md:text-6xl lg:text-7xl text-white font-bold mb-8 leading-[1.1] tracking-tight">
                            {development.name}
                        </motion.h1>

                        <motion.div variants={slideUp} className="flex flex-wrap items-center gap-y-4 gap-x-8 text-imi-300 text-sm md:text-base border-l-2 border-accent-500 pl-8">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-accent-500" />
                                <span className="font-medium">
                                    {development.location.neighborhood}, {development.location.city}/{development.location.state}
                                </span>
                            </div>

                            {development.deliveryDate && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-accent-500" />
                                    <span className="font-medium">Previsão: {development.deliveryDate}</span>
                                </div>
                            )}

                            {development.registrationNumber && (
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-accent-500" />
                                    <span className="font-medium">R.I: {development.registrationNumber}</span>
                                </div>
                            )}
                        </motion.div>

                        <motion.div variants={slideUp} className="mt-12">
                            <p className="text-[10px] text-imi-400 mb-2 uppercase tracking-[0.3em] font-bold">Investimento de</p>
                            <p className="text-4xl md:text-6xl font-bold text-white tracking-tighter font-display">
                                <span className="text-xl md:text-2xl mr-2 font-sans font-normal text-imi-500">R$</span>
                                {development.priceRange.min.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
