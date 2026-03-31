'use client';

import { motion } from 'framer-motion';
import { staggerContainer, slideUp } from '@/lib/animations';
import Link from 'next/link';
import { Building2, MapPin, ExternalLink, ChevronRight } from 'lucide-react';

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
        <main style={{ background: '#050B14', fontFamily: "'Outfit', system-ui, sans-serif" }} className="min-h-screen">
            {/* Hero */}
            <section className="text-white pt-24 pb-20 md:pt-32 md:pb-28 relative overflow-hidden" style={{ background: '#0A1624' }}>
                {/* Subtle radial glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-[0.06] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(200,164,74,0.5), transparent 70%)' }} />
                <div className="container-custom relative z-10">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="max-w-4xl"
                    >
                        <motion.div variants={slideUp} className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,164,74,0.5))' }} />
                            <span className="font-semibold uppercase tracking-[0.35em] text-[11px]" style={{ color: '#C8A44A', fontFamily: "'Outfit', system-ui, sans-serif" }}>Parceiros</span>
                        </motion.div>
                        <motion.h1 variants={slideUp} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium mb-6 tracking-tight leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                            Nossas <br /><span style={{ color: '#C8A44A' }} className="italic">Construtoras Parceiras</span>
                        </motion.h1>
                        <motion.p variants={slideUp} className="text-lg md:text-xl font-light leading-relaxed max-w-2xl" style={{ color: '#8E99AB' }}>
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
                        <div className="flex items-center gap-12">
                            <div className="flex items-center gap-3">
                                <span className="w-[6px] h-[6px] rounded-full" style={{ background: '#C8A44A', boxShadow: '0 0 8px rgba(200,164,74,0.4)' }} />
                                <span className="font-semibold uppercase tracking-[0.25em] text-[10px]" style={{ color: '#8E99AB' }}>
                                    {developers.length} construtoras parceiras
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
                        {developers.map((dev, index) => (
                            <motion.article
                                key={dev.id}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: index * 0.08 }}
                                className="group flex flex-col h-full relative overflow-hidden"
                                style={{
                                    background: 'rgba(14,28,48,0.52)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(200,164,74,0.12)',
                                    borderRadius: 16,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
                                    transition: 'all 0.35s cubic-bezier(.16,1,.3,1)',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = 'rgba(200,164,74,0.30)';
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25), 0 0 40px rgba(200,164,74,0.04), inset 0 1px 0 rgba(255,255,255,0.04)';
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'rgba(200,164,74,0.12)';
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {/* Top gold line */}
                                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

                                {/* Logo Area */}
                                <div className="relative aspect-[3/2] bg-white flex items-center justify-center p-8 shrink-0 overflow-hidden group-hover:opacity-100 opacity-90 transition-opacity duration-300" style={{ borderBottom: '1px solid rgba(200,164,74,0.12)' }}>
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
                                        <div
                                            className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full z-20"
                                            style={{
                                                background: 'rgba(200,164,74,0.10)',
                                                color: '#C8A44A',
                                                border: '1px solid rgba(200,164,74,0.20)',
                                            }}
                                        >
                                            {dev.development_count} {dev.development_count === 1 ? 'imóvel' : 'imóveis'}
                                        </div>
                                    )}
                                </div>

                                {/* Conteúdo */}
                                <div className="p-5 flex flex-col flex-1 relative z-10">
                                    {/* Subtle corner glow */}
                                    <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(200,164,74,0.06), transparent 70%)' }} />

                                    <h3 className="font-medium text-lg text-white mb-2 group-hover:text-[#C8A44A] transition-colors" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                                        {dev.name}
                                    </h3>

                                    {(dev.city || dev.state) && (
                                        <div className="flex items-center gap-2 text-sm mb-3" style={{ color: '#8E99AB' }}>
                                            <MapPin className="w-3.5 h-3.5" style={{ color: '#C8A44A' }} />
                                            <span>{[dev.city, dev.state].filter(Boolean).join(', ')}</span>
                                        </div>
                                    )}

                                    {dev.description && (
                                        <p className="text-sm leading-relaxed mb-5 line-clamp-2" style={{ color: '#8E99AB' }}>
                                            {dev.description}
                                        </p>
                                    )}

                                    <div className="flex gap-2.5 mt-auto pt-5" style={{ borderTop: '1px solid rgba(200,164,74,0.08)' }}>
                                        <Link
                                            href={`/${lang}/imoveis?construtora=${dev.slug}`}
                                            className="flex-1 flex justify-center items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] h-11 rounded-lg text-white no-underline relative overflow-hidden"
                                            style={{
                                                background: '#0A1624',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                transition: 'all 0.25s cubic-bezier(.16,1,.3,1)',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = '#0D1E32';
                                                e.currentTarget.style.borderColor = 'rgba(200,164,74,0.20)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = '#0A1624';
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                            }}
                                        >
                                            Ver Imóveis
                                            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                                            {/* Gold underline accent */}
                                            <span className="absolute bottom-0 left-[12%] right-[12%] h-[2px] opacity-60" style={{ background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)' }} />
                                        </Link>
                                        {dev.website && (
                                            <a
                                                href={dev.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-11 h-11 shrink-0 rounded-lg flex justify-center items-center transition-all duration-300"
                                                style={{
                                                    background: 'rgba(255,255,255,0.02)',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    color: '#8E99AB',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = '#8E99AB'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                                                title="Visitar site oficial"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.article>
                        ))}

                        {developers.length === 0 && (
                            <div className="col-span-full py-16 text-center rounded-2xl" style={{
                                background: 'rgba(14,28,48,0.52)',
                                backdropFilter: 'blur(20px)',
                                border: '1px dashed rgba(200,164,74,0.20)',
                            }}>
                                <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#8E99AB' }} />
                                <h3 className="text-lg font-medium text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Nenhuma Construtora</h3>
                                <p className="max-w-sm mx-auto mt-2" style={{ color: '#8E99AB' }}>Nossas parcerias estão sendo atualizadas. Volte em breve.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 md:py-20 relative overflow-hidden" style={{ background: '#0A1624', borderTop: '1px solid rgba(200,164,74,0.08)' }}>
                {/* Gold radial glow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] opacity-[0.04] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(200,164,74,0.8), transparent 70%)' }} />
                <div className="container-custom text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl sm:text-4xl font-medium text-white mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                            Representa uma <span style={{ color: '#C8A44A' }} className="italic">construtora?</span>
                        </h2>
                        <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: '#8E99AB' }}>
                            Estamos sempre em busca de novos parceiros para ampliar nosso portfólio.
                        </p>
                        <a
                            href="https://wa.me/5581997230455"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 h-14 px-8 w-full sm:w-auto text-[11px] font-semibold uppercase tracking-[0.15em] text-white rounded-lg relative overflow-hidden hover:-translate-y-1 transition-all duration-300"
                            style={{
                                background: '#0A1624',
                                border: '1px solid rgba(200,164,74,0.20)',
                                boxShadow: '0 0 14px rgba(200,164,74,0.08)',
                            }}
                        >
                            Ser Parceiro
                            {/* Gold glow underline */}
                            <span className="absolute bottom-0 left-0 right-0 h-[2px] opacity-70" style={{ background: 'linear-gradient(90deg, transparent, #C8A44A, #D4B86A, transparent)' }} />
                        </a>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
