'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/motion-primitives'

const TESTIMONIALS = [
    {
        name: 'Ricardo Almeida',
        role: 'Investidor Imobiliário',
        city: 'Recife, PE',
        text: 'A avaliação técnica da IMI foi decisiva para negociar a compra de um prédio comercial. Precisão nos dados e profissionalismo impecável.',
        rating: 5,
    },
    {
        name: 'Camila Soares',
        role: 'Diretora de Patrimônio',
        city: 'São Paulo, SP',
        text: 'Contratamos a IMI para avaliação do portfólio inteiro da holding. Laudos NBR 14653 entregues no prazo, com qualidade acima do mercado.',
        rating: 5,
    },
    {
        name: 'Ahmed Al-Rashid',
        role: 'Real Estate Developer',
        city: 'Dubai, UAE',
        text: 'IMI bridged the gap between Brazilian and Middle Eastern real estate markets. Their cross-border expertise is truly unique.',
        rating: 5,
    },
    {
        name: 'Fernanda Lopes',
        role: 'Advogada Imobiliária',
        city: 'João Pessoa, PB',
        text: 'Indico a IMI para todos os meus clientes que precisam de laudos para processos judiciais. Nunca tive um laudo contestado.',
        rating: 5,
    },
]

export default function Testimonials() {
    const [current, setCurrent] = useState(0)
    const [direction, setDirection] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setDirection(1)
            setCurrent(prev => (prev + 1) % TESTIMONIALS.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [])

    const navigate = (dir: number) => {
        setDirection(dir)
        setCurrent(prev => {
            const next = prev + dir
            if (next < 0) return TESTIMONIALS.length - 1
            if (next >= TESTIMONIALS.length) return 0
            return next
        })
    }

    const t = TESTIMONIALS[current]

    return (
        <section className="py-20 lg:py-28 bg-[#141420] relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#102A43]/10 blur-[120px] rounded-full" />

            <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-8">
                <ScrollReveal>
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-8 h-px bg-[#C8A65A]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A65A]">
                            Depoimentos
                        </span>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-16 items-center">
                    {/* Left — Quote */}
                    <ScrollReveal variant="slideLeft">
                        <Quote size={48} className="text-[#334E68]/30 mb-6" strokeWidth={1} />
                        <h2
                            className="text-[28px] sm:text-[36px] font-bold text-white leading-tight mb-4"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            O que dizem{' '}
                            <span className="text-[#9FB3C8]">nossos clientes</span>
                        </h2>
                        <p className="text-white/40 text-sm leading-relaxed">
                            Mais de 500 laudos entregues e clientes em 3 continentes confiam na IMI para decisões patrimoniais estratégicas.
                        </p>
                    </ScrollReveal>

                    {/* Right — Carousel */}
                    <div className="relative">
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 sm:p-10 min-h-[260px] flex flex-col justify-between">
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={current}
                                    custom={direction}
                                    initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
                                    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                                >
                                    {/* Stars */}
                                    <div className="flex gap-1 mb-5">
                                        {Array.from({ length: t.rating }).map((_, i) => (
                                            <Star key={i} size={14} className="text-[#C8A65A] fill-[#C8A65A]" />
                                        ))}
                                    </div>

                                    {/* Quote text */}
                                    <p className="text-white/80 text-[15px] sm:text-[17px] leading-relaxed mb-8 font-light italic">
                                        &ldquo;{t.text}&rdquo;
                                    </p>

                                    {/* Author */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#334E68] to-[#102A43] flex items-center justify-center text-white font-bold text-sm">
                                            {t.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold text-sm">{t.name}</p>
                                            <p className="text-white/40 text-xs">{t.role} · {t.city}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-5">
                            {/* Dots */}
                            <div className="flex gap-2">
                                {TESTIMONIALS.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i) }}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-[#C8A65A]' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
                                    />
                                ))}
                            </div>

                            {/* Arrows */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => navigate(1)}
                                    className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
