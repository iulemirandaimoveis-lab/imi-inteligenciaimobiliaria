'use client'

import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/motion-primitives'

const LOCATIONS = [
    {
        city: 'Recife',
        country: 'Brasil',
        flag: '🇧🇷',
        desc: 'Sede principal. Referência em avaliações NBR 14653 no Nordeste.',
        highlight: 'Boa Viagem · Pina · Caxangá',
    },
    {
        city: 'João Pessoa',
        country: 'Brasil',
        flag: '🇧🇷',
        desc: 'Mercado em franca expansão. Consultoria e curadoria de alto padrão.',
        highlight: 'Altiplano · Bessa · Cabo Branco',
    },
    {
        city: 'Dubai',
        country: 'UAE',
        flag: '🇦🇪',
        desc: 'Acesso ao mercado imobiliário de maior yield do mundo. Consultoria cross-border.',
        highlight: 'Downtown · Marina · Palm',
    },
    {
        city: 'Miami',
        country: 'EUA',
        flag: '🇺🇸',
        desc: 'Consultoria para investidores brasileiros no mercado americano.',
        highlight: 'Brickell · Sunny Isles · Bal Harbour',
    },
]

export default function GlobalPresence() {
    return (
        <section className="py-20 lg:py-28 bg-[#141420] relative overflow-hidden">
            {/* Globe ambient */}
            <div className="absolute top-1/2 right-0 w-[500px] h-[500px] -translate-y-1/2 translate-x-1/2 opacity-[0.03]">
                <div className="w-full h-full rounded-full border border-white" />
                <div className="absolute inset-[15%] rounded-full border border-white" />
                <div className="absolute inset-[30%] rounded-full border border-white" />
            </div>

            <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-8">
                <ScrollReveal>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-px bg-[#C8A65A]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A65A]">
                            Presença Global
                        </span>
                    </div>
                    <h2
                        className="text-[28px] sm:text-[36px] font-bold text-white leading-tight mb-4"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        Inteligência imobiliária{' '}
                        <span className="text-[#9FB3C8]">sem fronteiras</span>
                    </h2>
                    <p className="text-white/40 text-sm max-w-lg mb-12">
                        Conectamos mercados e oportunidades em 3 continentes. Capital alocado onde o valor é criado.
                    </p>
                </ScrollReveal>

                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {LOCATIONS.map((loc) => (
                        <StaggerItem key={loc.city}>
                            <div className="group relative rounded-2xl p-6 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#334E68]/40 transition-all duration-300 h-full">
                                {/* Flag + City */}
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-2xl">{loc.flag}</span>
                                    <div>
                                        <h3 className="text-white font-bold text-[16px]">{loc.city}</h3>
                                        <p className="text-white/30 text-[11px] font-medium uppercase tracking-wider">{loc.country}</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-white/45 text-[13px] leading-relaxed mb-4">
                                    {loc.desc}
                                </p>

                                {/* Neighborhoods */}
                                <div className="flex items-center gap-1.5 text-[11px] text-[#627D98]">
                                    <MapPin size={10} />
                                    {loc.highlight}
                                </div>

                                {/* Hover glow */}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-[#C8A65A]/0 group-hover:bg-[#C8A65A]/40 blur-sm transition-all duration-500" />
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </div>
        </section>
    )
}
