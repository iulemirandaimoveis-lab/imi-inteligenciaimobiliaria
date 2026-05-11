'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useParams } from 'next/navigation'

interface MethodProps {
    dict: {
        method_pre: string
        method_title: string
        method_cta: string
    }
}

const STEPS = [
    {
        num: '01',
        title: 'Avaliação Técnica',
        desc: 'Laudos NBR 14653 com precisão CRECI/CNAI. Metodologia comparativa e de renda aplicada a cada ativo.',
    },
    {
        num: '02',
        title: 'Inteligência de Mercado',
        desc: 'Análise de dados primários, absorção de mercado, yield e potencial de valorização por região.',
    },
    {
        num: '03',
        title: 'Execução Patrimonial',
        desc: 'Curadoria de oportunidades, due diligence, negociação e fechamento com suporte jurídico dedicado.',
    },
]

export default function Method({ dict }: MethodProps) {
    const params = useParams()
    const lang = (params?.lang as string) || 'pt'
    const sectionRef = useRef<HTMLElement>(null)

    // Parallax for background elements
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start end', 'end start'],
    })
    const dotGridY = useTransform(scrollYProgress, [0, 1], [20, -20])
    const glowScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.2, 0.9])

    return (
        <section ref={sectionRef} className="relative py-20 lg:py-28 overflow-hidden" style={{ background: '#0B1928' }}>
            {/* Dot grid texture with parallax */}
            <motion.div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
                    backgroundSize: '40px 40px',
                    y: dotGridY,
                }}
            />
            {/* Glow with scroll-linked scale */}
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(200,164,74,0.04) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    scale: glowScale,
                }}
            />

            <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-8">
                {/* Eyebrow with animated line reveal */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center justify-center gap-3 mb-8"
                >
                    <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: 32 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-px overflow-hidden"
                        style={{ background: '#C8A44A' }}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>{dict.method_pre}</span>
                    <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: 32 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-px overflow-hidden"
                        style={{ background: '#C8A44A' }}
                    />
                </motion.div>

                {/* Headline with character-level reveal feel */}
                <motion.h2
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center text-[28px] sm:text-[36px] lg:text-[44px] font-black text-white leading-[1.15] mb-14"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    {dict.method_title}
                </motion.h2>

                {/* 3-step grid with staggered scroll reveal */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12 mb-14">
                    {STEPS.map((step, i) => (
                        <motion.div
                            key={step.num}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.7, delay: 0.15 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                            className="relative group"
                        >
                            {/* Connector line (desktop only, between steps) */}
                            {i < 2 && (
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1, delay: 0.5 + i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                                    className="hidden sm:block absolute top-5 left-full w-full h-px bg-gradient-to-r from-[#C8A44A]/20 to-transparent z-0 -translate-x-4 origin-left"
                                />
                            )}

                            <div className="relative z-10">
                                {/* Step number — always visible in gold */}
                                <motion.div
                                    whileHover={{ scale: 1.04, opacity: 0.7 }}
                                    className="text-[52px] font-black leading-none mb-4 select-none transition-all duration-500"
                                    style={{
                                        color: 'rgba(200,164,74,0.65)',
                                        WebkitTextStroke: '1.5px rgba(200,164,74,0.85)',
                                        fontFamily: 'var(--font-mono)',
                                    }}
                                >
                                    {step.num}
                                </motion.div>

                                {/* Accent line — animated width */}
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: 32 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
                                    className="h-px mb-4"
                                    style={{ background: '#C8A44A' }}
                                />

                                <h3 className="text-[15px] font-bold mb-2 transition-colors duration-300 group-hover:text-white/70" style={{ color: '#C8A44A' }}>{step.title}</h3>
                                <p className="text-[13px] text-white/65 leading-relaxed">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                    className="text-center"
                >
                    <Link
                        href={`/${lang}/sobre`}
                        className="inline-flex items-center gap-2.5 text-white border border-white/15 font-semibold px-7 py-3.5 min-h-[48px] rounded-xl transition-all duration-300 text-[13px] hover:border-[#C8A44A]/30 hover:shadow-[0_0_30px_rgba(200,164,74,0.08)]"
                        style={{ fontFamily: 'var(--font-sans)' }}
                    >
                        {dict.method_cta}
                        <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                </motion.div>
            </div>
        </section>
    )
}
