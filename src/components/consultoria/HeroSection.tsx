'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ChevronDown, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

export function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-[#141420] text-white py-20 lg:py-32">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-1/2 h-full hidden" />

            <div className="container-custom relative z-10 w-full">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="max-w-2xl">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-3 bg-white/[0.04] border border-white/10 px-6 py-3 rounded-full text-[#C49D5B] text-sm font-semibold mb-8 backdrop-blur-sm"
                        >
                            <span className="w-2 h-2 bg-[#C49D5B] rounded-full animate-pulse" />
                            <span className="uppercase tracking-widest text-xs">Consultoria Estratégica Internacional</span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-[1.1] tracking-tight "
                        >
                            Renda em Dólar com<br />
                            <span className="text-[#C49D5B]">Imóveis Internacionais</span>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-lg md:text-xl text-[#9CA3AF] mb-12 max-w-2xl leading-relaxed font-light"
                        >
                            Estrutura jurídica sólida, gestão profissional e crédito inteligente para investidores que buscam proteção patrimonial e rentabilidade em USD.
                        </motion.p>

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex flex-wrap gap-4"
                        >
                            <a
                                href="#simulator"
                                className="inline-flex items-center justify-center gap-3 h-14 px-8 text-[14px] font-bold uppercase tracking-widest bg-[#1A1E2A] text-white rounded-xl border border-[#21263A] border-l-2 border-[#C49D5B] shadow-[0_8px_32px_rgba(196,157,91,0.15)] hover:bg-[#21263A] transition-all duration-300"
                            >
                                Simular Estratégia
                                <ArrowRight className="w-5 h-5 ml-3" />
                            </a>

                            <a
                                href="https://wa.me/5581997230455"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-3 h-14 px-8 text-[14px] font-bold uppercase tracking-widest bg-transparent text-white rounded-xl border border-white/20 hover:bg-white/5 transition-all duration-300"
                            >
                                Falar com Especialista
                            </a>
                        </motion.div>

                        {/* Trust indicators */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="mt-16 flex flex-wrap gap-8 text-[#6C757D] text-sm"
                        >
                            {[
                                '+$50M Alocados',
                                '200+ Investidores',
                                '15 Anos de Mercado'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-[#C49D5B]" strokeWidth={1.5} />
                                    <span className="font-medium text-[#9CA3AF]">{item}</span>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                    {/* Image section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative hidden lg:block"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#141420] to-transparent z-10 hidden" />
                        <div className="relative aspect-[4/5] w-full max-w-lg mx-auto rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/[0.05]">
                            <img
                                src="/images/consultoria-luxury.png"
                                alt="Consultoria High-End"
                                className="w-full h-full object-cover object-center"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#141420] via-transparent to-transparent opacity-80" />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
            >
                <ChevronDown className="w-8 h-8 text-white/20" />
            </motion.div>
        </section>
    );
}
