'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { FileText, TrendingUp, Home, ArrowRight } from 'lucide-react'
import { useParams } from 'next/navigation'

interface ServicesProps {
    dict: {
        card_appraisals_title: string
        card_appraisals_desc: string
        card_consulting_title: string
        card_consulting_desc: string
        card_brokerage_title: string
        card_brokerage_desc: string
    }
}

export default function Services({ dict }: ServicesProps) {
    const params = useParams()
    const lang = (params?.lang as string) || 'pt'
    const sectionRef = useRef<HTMLElement>(null)

    // Scroll-linked parallax for section
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start end', 'end start'],
    })
    const bgY = useTransform(scrollYProgress, [0, 1], [40, -40])

    const services = [
        {
            icon: FileText,
            title: dict.card_appraisals_title,
            desc: dict.card_appraisals_desc,
            href: `/${lang}/avaliacoes`,
            tag: 'NBR 14653',
            glow: 'rgba(200,164,74,0.12)',
        },
        {
            icon: TrendingUp,
            title: dict.card_consulting_title,
            desc: dict.card_consulting_desc,
            href: `/${lang}/consultoria`,
            tag: 'USD yield',
            glow: 'rgba(200,164,74,0.08)',
        },
        {
            icon: Home,
            title: dict.card_brokerage_title,
            desc: dict.card_brokerage_desc,
            href: `/${lang}/imoveis`,
            tag: 'Curadoria',
            glow: 'rgba(200,164,74,0.10)',
        },
    ]

    return (
        <section ref={sectionRef} className="relative py-16 lg:py-20 overflow-hidden" style={{ background: '#0B1928' }}>
            {/* Parallax gold accent line */}
            <motion.div
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{
                    background: 'linear-gradient(90deg, transparent 10%, rgba(200,164,74,0.2) 50%, transparent 90%)',
                    y: bgY,
                }}
            />

            <div className="max-w-[1280px] mx-auto px-6 lg:px-8">

                {/* Section label with reveal animation */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-3 mb-10"
                >
                    <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: 32 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-px overflow-hidden"
                        style={{ background: '#C8A44A' }}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>Nossos Serviços</span>
                </motion.div>

                <h2 className="sr-only">Nossos Serviços</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
                    {services.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40, scale: 0.97 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Link
                                href={item.href}
                                className="group relative block rounded-2xl p-7 border border-white/[0.06] overflow-hidden transition-all duration-500 hover:border-[#C8A44A]/30 hover:shadow-[0_0_40px_rgba(200,164,74,0.06)]"
                                style={{ background: 'var(--bg-base)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                            >
                                {/* Corner glow on hover — now gold */}
                                <div
                                    className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-full"
                                    style={{
                                        background: `radial-gradient(circle, ${item.glow} 0%, transparent 70%)`,
                                        filter: 'blur(20px)',
                                        transform: 'translate(40%, -40%)',
                                    }}
                                />

                                {/* Hover slide-up gold line */}
                                <div className="absolute bottom-0 left-[10%] right-[10%] h-[2px] opacity-0 group-hover:opacity-60 transition-opacity duration-500" style={{ background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)' }} />

                                <div className="relative z-10">
                                    {/* Icon + tag */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/[0.05] border border-white/[0.08] transition-all duration-500 group-hover:border-[#C8A44A]/20 group-hover:bg-[#C8A44A]/[0.06]">
                                            <item.icon className="w-5 h-5 text-white/70 transition-colors duration-500 group-hover:text-[#C8A44A]" strokeWidth={1.5} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
                                            {item.tag}
                                        </span>
                                    </div>

                                    <h3 className="text-[16px] font-bold text-white mb-2" style={{ fontFamily: 'var(--font-sans)' }}>{item.title}</h3>
                                    <p className="text-[13px] text-white/50 leading-relaxed mb-6" style={{ fontFamily: 'var(--font-sans)' }}>{item.desc}</p>

                                    <div className="flex items-center gap-2 text-[12px] font-semibold transition-all duration-300 group-hover:gap-3 group-hover:text-[#C8A44A]" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
                                        Saiba mais <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
