'use client'

import { motion } from 'framer-motion'
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

    const services = [
        {
            icon: FileText,
            title: dict.card_appraisals_title,
            desc: dict.card_appraisals_desc,
            href: `/${lang}/avaliacoes`,
            tag: 'NBR 14653',
            glow: 'rgba(51,78,104,0.15)',
        },
        {
            icon: TrendingUp,
            title: dict.card_consulting_title,
            desc: dict.card_consulting_desc,
            href: `/${lang}/consultoria`,
            tag: 'USD yield',
            glow: 'rgba(51,78,104,0.10)',
        },
        {
            icon: Home,
            title: dict.card_brokerage_title,
            desc: dict.card_brokerage_desc,
            href: `/${lang}/imoveis`,
            tag: 'Curadoria',
            glow: 'rgba(51,78,104,0.12)',
        },
    ]

    return (
        <section className="py-16 lg:py-20 bg-[#0D1117]">
            <div className="max-w-[1280px] mx-auto px-6 lg:px-8">

                {/* Section label */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-3 mb-10"
                >
                    <div className="w-8 h-px bg-[#334E68]" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#486581]">Nossos Serviços</span>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
                    {services.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08, duration: 0.4 }}
                        >
                            <Link
                                href={item.href}
                                className="group relative block rounded-2xl p-7 border border-white/[0.06] overflow-hidden transition-all duration-300 hover:border-[#334E68]/50"
                                style={{ background: '#141420', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                            >
                                {/* Corner glow on hover */}
                                <div
                                    className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"
                                    style={{
                                        background: `radial-gradient(circle, ${item.glow} 0%, transparent 70%)`,
                                        filter: 'blur(20px)',
                                        transform: 'translate(40%, -40%)',
                                    }}
                                />

                                <div className="relative z-10">
                                    {/* Icon + tag */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/[0.05] border border-white/[0.08] group-hover:border-[#334E68]/40 group-hover:bg-[#334E68]/10 transition-all duration-300">
                                            <item.icon className="w-5 h-5 text-white/70 group-hover:text-[#9FB3C8] transition-colors duration-300" strokeWidth={1.5} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#627D98] bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
                                            {item.tag}
                                        </span>
                                    </div>

                                    <h3 className="text-[16px] font-bold text-white mb-2">{item.title}</h3>
                                    <p className="text-[13px] text-white/50 leading-relaxed mb-6">{item.desc}</p>

                                    <div className="flex items-center gap-2 text-[12px] font-semibold text-[#486581] group-hover:text-[#9FB3C8] group-hover:gap-3 transition-all duration-200">
                                        Saiba mais <ArrowRight size={12} />
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
