'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
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

    return (
        <section className="relative bg-[#141420] py-20 lg:py-28 overflow-hidden">
            {/* Dot grid texture */}
            <div
                className="absolute inset-0 opacity-[0.025]"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }}
            />
            {/* Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#102A43]/[0.05] blur-[80px] rounded-full" />

            <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-8">
                {/* Eyebrow */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center justify-center gap-3 mb-8"
                >
                    <div className="w-8 h-px bg-[#102A43]" />
                    <span className="text-[#486581] text-[11px] font-bold uppercase tracking-[0.25em]">{dict.method_pre}</span>
                    <div className="w-8 h-px bg-[#102A43]" />
                </motion.div>

                {/* Headline */}
                <motion.h2
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-center text-[28px] sm:text-[36px] lg:text-[44px] font-black text-white leading-[1.15] mb-14"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                    {dict.method_title}
                </motion.h2>

                {/* 3-step grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12 mb-14">
                    {STEPS.map((step, i) => (
                        <motion.div
                            key={step.num}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                            className="relative"
                        >
                            {/* Connector line (desktop only, between steps) */}
                            {i < 2 && (
                                <div className="hidden sm:block absolute top-5 left-full w-full h-px bg-white/[0.05] z-0 -translate-x-4" />
                            )}

                            <div className="relative z-10">
                                {/* Step number */}
                                <div
                                    className="text-[52px] font-black leading-none mb-4 select-none"
                                    style={{
                                        color: 'transparent',
                                        WebkitTextStroke: '1px rgba(72,101,129,0.35)',
                                        fontFamily: "'Playfair Display', Georgia, serif",
                                    }}
                                >
                                    {step.num}
                                </div>

                                {/* Accent line */}
                                <div className="w-8 h-px bg-[#334E68] mb-4" />

                                <h3 className="text-[15px] font-bold text-white mb-2">{step.title}</h3>
                                <p className="text-[13px] text-white/45 leading-relaxed">{step.desc}</p>
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
                        className="inline-flex items-center gap-2.5 text-white border border-white/15 hover:border-[#334E68] hover:text-[#9FB3C8] font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 text-[13px]"
                    >
                        {dict.method_cta}
                        <ArrowRight size={14} />
                    </Link>
                </motion.div>
            </div>
        </section>
    )
}
