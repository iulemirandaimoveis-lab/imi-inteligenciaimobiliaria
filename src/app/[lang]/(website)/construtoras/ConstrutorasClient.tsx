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
        <main className="bg-[#0D0F14] min-h-screen">
            {/* Hero */}
            <section className="bg-[#141420] text-white pt-24 pb-20 md:pt-32 md:pb-28 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[#102A43]/5 -skew-x-12 translate-x-1/2" />
                <div className="container-custom relative z-10">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="max-w-4xl"
                    >
                        <motion.div variants={slideUp} className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-px bg-[#102A43]" />
                            <span className="text-[#486581] font-bold uppercase tracking-[0.3em] text-xs">Parceiros</span>
                        </motion.div>
                        <motion.h1 variants={slideUp} className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight">
                            Nossas <br /><span className="text-[#486581] italic">Construtoras Parceiras</span>
                        </motion.h1>
                        <motion.p variants={slideUp} className="text-[#9CA3AF] text-lg md:text-xl font-light leading-relaxed max-w-2xl">
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
                            <div className="w-2 h-2 rounded-full bg-[#102A43]" />
                            <span className="text-[#9CA3AF] font-bold uppercase tracking-widest text-xs">
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
                                className="group bg-[#141420] rounded-3xl overflow-hidden border border-white/[0.05] hover:border-[#334E68]/40 hover:shadow-[0_8px_32px_rgba(26,26,46,0.15)] transition-all duration-500 flex flex-col h-full"
                            >
                                {/* Logo Area - Fundo claro para preservar as cores originais das marcas parceiras */}
                                <div className="relative aspect-[3/2] bg-white flex items-center justify-center p-8 border-b border-white/[0.05] shrink-0 overflow-hidden group-hover:opacity-100 opacity-90 transition-opacity duration-300">
                                    {dev.logo_url ? (
                                        <div className="relative w-full h-full max-w-[80%] max-h-[70%] z-10 flex items-center justify-center">
                                            <img
                                                src={dev.logo_url}
                                                alt={dev.name}
                                                className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 z-10 w-full">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                                                <Building2 className="w-7 h-7 text-slate-400" strokeWidth={1.5} />
                                            </div>
                                            <span className="text-slate-700 font-bold text-[10px] text-center uppercase tracking-[0.2em] leading-tight px-4">{dev.name}</span>
                                        </div>
                                    )}

                                    {/* Badge de quantidade */}
                                    {dev.development_count && dev.development_count > 0 && (
                                        <div className="absolute top-4 right-4 bg-white/10 text-white border border-white/20 backdrop-blur-md text-xs font-bold px-3 py-1.5 rounded-full shadow-sm z-20">
                                            {dev.development_count} {dev.development_count === 1 ? 'imóvel' : 'imóveis'}
                                        </div>
                                    )}
                                </div>

                                {/* Conteúdo */}
                                <div className="p-6 flex flex-col flex-1 relative z-10">
                                    <h3 className="font-display font-bold text-xl text-white mb-2 group-hover:text-[#486581] transition-colors">
                                        {dev.name}
                                    </h3>

                                    {(dev.city || dev.state) && (
                                        <div className="flex items-center gap-2 text-[#9CA3AF] text-sm mb-4">
                                            <MapPin className="w-4 h-4 text-[#486581]" />
                                            <span>{[dev.city, dev.state].filter(Boolean).join(', ')}</span>
                                        </div>
                                    )}

                                    {dev.description && (
                                        <p className="text-[#9CA3AF] text-sm leading-relaxed mb-6 line-clamp-2">
                                            {dev.description}
                                        </p>
                                    )}

                                    <div className="flex gap-2.5 mt-auto pt-6">
                                        <Link href={`/${lang}/imoveis?construtora=${dev.slug}`} className="flex-1 flex justify-center items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] h-12 rounded-lg bg-[#1A1E2A] text-white border border-[#21263A] hover:bg-[#21263A] transition-all duration-300">
                                            Ver Imóveis
                                            <ChevronRight className="w-4 h-4 shrink-0" />
                                        </Link>
                                        {dev.website && (
                                            <a href={dev.website} target="_blank" rel="noopener noreferrer" className="w-12 h-12 shrink-0 rounded-lg bg-white/5 border border-white/10 flex justify-center items-center text-[#9CA3AF] hover:text-white hover:bg-white/10 transition-all duration-300" title="Visitar site oficial">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.article>
                        ))}

                        {developers.length === 0 && (
                            <div className="col-span-full py-16 text-center border border-dashed border-white/20 rounded-3xl bg-white/5 backdrop-blur-sm">
                                <Building2 className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-white">Nenhuma Construtora</h3>
                                <p className="text-[#9CA3AF] max-w-sm mx-auto mt-2">Nossas parcerias estão sendo atualizadas. Volte em breve.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-[#141420] py-16 md:py-20 border-t border-white/[0.05]">
                <div className="container-custom text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                            Representa uma <span className="text-[#486581] italic">construtora?</span>
                        </h2>
                        <p className="text-[#9CA3AF] text-lg mb-8 max-w-xl mx-auto">
                            Estamos sempre em busca de novos parceiros para ampliar nosso portfólio.
                        </p>
                        <a href="https://wa.me/5581997230455" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 h-14 px-8 w-full sm:w-auto text-[13px] font-bold uppercase tracking-[0.15em] bg-[#1A1E2A] text-white rounded-xl border border-[#21263A] shadow-lg hover:-translate-y-1 transition-transform duration-300">
                            Ser Parceiro
                        </a>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
