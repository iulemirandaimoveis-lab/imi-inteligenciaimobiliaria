'use client';

import { motion } from 'framer-motion';
import { staggerContainer, slideUp } from '@/lib/animations';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, MapPin, ExternalLink, ChevronRight, Share } from 'lucide-react';
import Button from '@/components/ui/Button';

export interface Developer {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    website?: string | null;
    city?: string | null;
    state?: string | null;
    description?: string | null;
    development_count?: number;
}

interface ConstrutorasClientProps {
    developers: Developer[];
    lang: string;
}

export default function ConstrutorasClient({ developers, lang }: ConstrutorasClientProps) {
    return (
        <main className="bg-white min-h-screen">
            {/* Hero */}
            <section className="bg-imi-900 text-white pt-24 pb-20 md:pt-32 md:pb-28 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-accent-500/5 -skew-x-12 translate-x-1/2" />
                <div className="container-custom relative z-10">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="max-w-4xl"
                    >
                        <motion.div variants={slideUp} className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-px bg-accent-500" />
                            <span className="text-accent-500 font-bold uppercase tracking-[0.3em] text-xs">Parceiros</span>
                        </motion.div>
                        <motion.h1 variants={slideUp} className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight">
                            Nossas <br /><span className="text-accent-500 italic">Construtoras Parceiras</span>
                        </motion.h1>
                        <motion.p variants={slideUp} className="text-imi-300 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
                            Trabalhamos com as incorporadoras mais renomadas do mercado, garantindo qualidade construtiva e solidez nos investimentos.
                        </motion.p>
                    </motion.div>
                </div>
            </section>

            {/* Grid de Construtoras */}
            <section className="py-16 md:py-24">
                <div className="container-custom">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-10 flex flex-col md:flex-row md:items-center gap-3 md:justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-imi-900" />
                            <span className="text-imi-400 font-bold uppercase tracking-widest text-xs">
                                {developers.length} construtoras parceiras em nosso portfólio
                            </span>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {developers.map((dev, index) => (
                            <motion.article
                                key={dev.id}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="group bg-white rounded-3xl overflow-hidden border border-imi-100 hover:border-accent-500/30 hover:shadow-card-hover transition-all duration-500 flex flex-col h-full"
                            >
                                {/* Logo Area - Fundo claro para logos em cores originais */}
                                <div className="relative aspect-[3/2] bg-gradient-to-br from-imi-50 via-white to-imi-50 flex items-center justify-center p-6 border-b border-imi-100 shrink-0">
                                    {dev.logo_url ? (
                                        <div className="relative w-full h-full max-w-[70%] max-h-[60%]">
                                            <img
                                                src={dev.logo_url}
                                                alt={dev.name}
                                                className="w-full h-full object-contain grayscale brightness-0 opacity-80 group-hover:opacity-100 transition-all"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <Building2 className="w-16 h-16 text-imi-400" strokeWidth={1} />
                                            <span className="text-imi-600 font-bold text-sm uppercase tracking-wider">{dev.name}</span>
                                        </div>
                                    )}

                                    {/* Badge de quantidade */}
                                    {dev.development_count && dev.development_count >= 0 && (
                                        <div className="absolute top-4 right-4 bg-imi-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                            {dev.development_count} {dev.development_count === 1 ? 'imóvel' : 'imóveis'}
                                        </div>
                                    )}
                                </div>

                                {/* Conteúdo */}
                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="font-display font-bold text-xl text-imi-900 mb-2 group-hover:text-accent-600 transition-colors">
                                        {dev.name}
                                    </h3>

                                    {(dev.city || dev.state) && (
                                        <div className="flex items-center gap-2 text-imi-500 text-sm mb-4">
                                            <MapPin className="w-4 h-4 text-accent-500" />
                                            <span>{[dev.city, dev.state].filter(Boolean).join(', ')}</span>
                                        </div>
                                    )}

                                    {dev.description && (
                                        <p className="text-imi-500 text-sm leading-relaxed mb-6 line-clamp-2">
                                            {dev.description}
                                        </p>
                                    )}

                                    <div className="flex gap-3 mt-auto pt-4">
                                        <Link href={`/${lang}/imoveis?construtora=${dev.slug}`} className="btn btn-primary flex-1">
                                            Ver Imóveis
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Link>
                                        {dev.website && (
                                            <a href={dev.website} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-12 px-0 border border-imi-200 shadow-xs" title="Visitar site oficial">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.article>
                        ))}

                        {developers.length === 0 && (
                            <div className="col-span-full py-16 text-center border-2 border-dashed border-imi-200 rounded-3xl">
                                <Building2 className="w-12 h-12 text-imi-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-imi-900">Nenhuma Construtora</h3>
                                <p className="text-imi-500 max-w-sm mx-auto mt-2">Nossas parcerias estão sendo atualizadas. Volte em breve.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-imi-50 py-16 md:py-20 border-t border-imi-100">
                <div className="container-custom text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-imi-900 mb-4">
                            Representa uma <span className="text-accent-500 italic">construtora?</span>
                        </h2>
                        <p className="text-imi-500 text-lg mb-8 max-w-xl mx-auto">
                            Estamos sempre em busca de novos parceiros para ampliar nosso portfólio.
                        </p>
                        <a href="https://wa.me/5581997230455" target="_blank" rel="noopener noreferrer" className="btn btn-primary h-14 px-10 text-base shadow-md hover:shadow-lg transition-all">
                            Ser um parceiro IMI
                        </a>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
