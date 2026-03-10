'use client'

import { motion } from 'framer-motion'
import { ScrollReveal } from '@/components/ui/motion-primitives'

// Partner/certification logos as styled text blocks (replace with actual logos when available)
const PARTNERS = [
    { name: 'CRECI', subtitle: 'Conselho Regional' },
    { name: 'CNAI', subtitle: 'Avaliadores Imobiliários' },
    { name: 'IBAPE', subtitle: 'Engenharia de Avaliações' },
    { name: 'NBR 14653', subtitle: 'Norma Técnica ABNT' },
    { name: 'COFECI', subtitle: 'Conselho Federal' },
    { name: 'RICS', subtitle: 'Royal Institution' },
]

export default function Partners() {
    return (
        <section className="py-14 lg:py-16 bg-[#0D1117] border-y border-white/[0.04]">
            <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
                <ScrollReveal>
                    <div className="flex items-center justify-center gap-3 mb-10">
                        <div className="w-8 h-px bg-white/10" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
                            Certificações e Afiliações
                        </span>
                        <div className="w-8 h-px bg-white/10" />
                    </div>
                </ScrollReveal>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
                >
                    {PARTNERS.map((partner) => (
                        <motion.div
                            key={partner.name}
                            variants={{
                                hidden: { opacity: 0, scale: 0.9 },
                                visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
                            }}
                            className="group flex flex-col items-center justify-center py-6 px-4 rounded-xl border border-white/[0.06] hover:border-[#334E68]/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300"
                        >
                            <span className="text-lg font-black text-white/60 group-hover:text-white/90 transition-colors tracking-tight">
                                {partner.name}
                            </span>
                            <span className="text-[9px] text-white/25 uppercase tracking-wider mt-1 group-hover:text-white/40 transition-colors">
                                {partner.subtitle}
                            </span>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
