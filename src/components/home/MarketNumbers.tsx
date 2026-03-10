'use client'

import { motion } from 'framer-motion'
import { TrendingUp, MapPin, DollarSign, BarChart3 } from 'lucide-react'
import { AnimatedCounter, ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/motion-primitives'

const NUMBERS = [
    {
        icon: TrendingUp,
        value: 500,
        suffix: '+',
        label: 'Laudos técnicos entregues',
        desc: 'Avaliações NBR 14653 para pessoas físicas, jurídicas, fundos e tribunais',
    },
    {
        icon: DollarSign,
        value: 2,
        suffix: 'B+',
        prefix: 'R$ ',
        label: 'Em ativos avaliados',
        desc: 'Volume total de patrimônio imobiliário analisado e avaliado pela equipe',
    },
    {
        icon: MapPin,
        value: 3,
        suffix: '',
        label: 'Mercados internacionais',
        desc: 'Atuação ativa em Recife, Dubai e mercados selecionados nos Estados Unidos',
    },
    {
        icon: BarChart3,
        value: 12,
        suffix: ' anos',
        label: 'De experiência no mercado',
        desc: 'Conhecimento acumulado em ciclos de alta, baixa e recuperação do setor',
    },
]

export default function MarketNumbers() {
    return (
        <section className="py-20 lg:py-28 relative overflow-hidden" style={{ background: '#F8F9FA' }}>
            {/* Subtle grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.4]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }}
            />

            <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-8">
                <ScrollReveal>
                    <div className="text-center mb-14">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-8 h-px bg-[#102A43]" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#486581]">
                                Em Números
                            </span>
                            <div className="w-8 h-px bg-[#102A43]" />
                        </div>
                        <h2
                            className="text-[28px] sm:text-[36px] font-bold text-[#1A1A1A] leading-tight"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            Resultados que{' '}
                            <span className="text-[#334E68]">falam por si</span>
                        </h2>
                    </div>
                </ScrollReveal>

                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {NUMBERS.map((item) => (
                        <StaggerItem key={item.label}>
                            <div className="group bg-white rounded-2xl p-7 border border-black/[0.06] hover:border-[#334E68]/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full">
                                {/* Icon */}
                                <div className="w-12 h-12 rounded-xl bg-[#102A43]/[0.06] flex items-center justify-center mb-5 group-hover:bg-[#102A43]/10 transition-colors">
                                    <item.icon size={22} className="text-[#334E68]" strokeWidth={1.5} />
                                </div>

                                {/* Number */}
                                <div className="text-[32px] sm:text-[36px] font-black text-[#1A1A1A] leading-none mb-2">
                                    <AnimatedCounter
                                        to={item.value}
                                        suffix={item.suffix}
                                        prefix={item.prefix || ''}
                                    />
                                </div>

                                {/* Label */}
                                <p className="text-sm font-semibold text-[#1A1A1A] mb-2">{item.label}</p>
                                <p className="text-xs text-[#6C757D] leading-relaxed">{item.desc}</p>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </div>
        </section>
    )
}
