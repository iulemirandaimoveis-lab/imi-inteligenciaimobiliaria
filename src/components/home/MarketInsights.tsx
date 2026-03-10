'use client'

import Link from 'next/link'
import { ArrowRight, BarChart2, Globe, TrendingUp } from 'lucide-react'
import { useParams } from 'next/navigation'
import { ScrollReveal, StaggerContainer, StaggerItem, TiltCard } from '@/components/ui/motion-primitives'

const INSIGHTS = [
    {
        icon: BarChart2,
        tag: 'Análise',
        title: 'Índices de Valorização por Bairro',
        desc: 'Acompanhe a valorização imobiliária em tempo real dos principais bairros de Recife e João Pessoa.',
        href: '/inteligencia/indices',
        color: '#334E68',
    },
    {
        icon: Globe,
        tag: 'Internacional',
        title: 'Mercado Dubai: Oportunidades 2025',
        desc: 'Yield médio de 7-9% ao ano em Dubai. Análise comparativa com mercados brasileiros.',
        href: '/inteligencia/relatorios',
        color: '#C8A65A',
    },
    {
        icon: TrendingUp,
        tag: 'Dashboard',
        title: 'Dashboard de Inteligência Imobiliária',
        desc: 'Dados de mercado, tendências e insights para tomar decisões patrimoniais informadas.',
        href: '/inteligencia/dashboard',
        color: '#486581',
    },
]

export default function MarketInsights() {
    const params = useParams()
    const lang = (params?.lang as string) || 'pt'

    return (
        <section className="py-20 lg:py-28 bg-[#0D1117]">
            <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
                <ScrollReveal>
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-px bg-[#334E68]" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#486581]">
                                    Inteligência de Mercado
                                </span>
                            </div>
                            <h2
                                className="text-[28px] sm:text-[36px] font-bold text-white leading-tight"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                                Dados que movem{' '}
                                <span className="text-[#9FB3C8]">decisões</span>
                            </h2>
                        </div>
                        <Link
                            href={`/${lang}/inteligencia`}
                            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#486581] hover:text-[#9FB3C8] transition-colors group"
                        >
                            Explorar inteligência
                            <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </ScrollReveal>

                <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
                    {INSIGHTS.map((item) => (
                        <StaggerItem key={item.title}>
                            <TiltCard tiltDegree={5}>
                                <Link
                                    href={`/${lang}${item.href}`}
                                    className="group relative block rounded-2xl p-7 border border-white/[0.06] overflow-hidden transition-all duration-300 hover:border-[#334E68]/50 h-full"
                                    style={{ background: '#141420' }}
                                >
                                    {/* Glow */}
                                    <div
                                        className="absolute top-0 right-0 w-40 h-40 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                                        style={{
                                            background: `radial-gradient(circle, ${item.color}20 0%, transparent 70%)`,
                                            filter: 'blur(30px)',
                                            transform: 'translate(30%, -30%)',
                                        }}
                                    />

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-6">
                                            <div
                                                className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/[0.08] group-hover:border-white/[0.15] transition-colors"
                                                style={{ background: `${item.color}15` }}
                                            >
                                                <item.icon size={20} style={{ color: item.color }} strokeWidth={1.5} />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#627D98] bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
                                                {item.tag}
                                            </span>
                                        </div>

                                        <h3 className="text-[16px] font-bold text-white mb-2 group-hover:text-[#E2E8F0] transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-[13px] text-white/45 leading-relaxed mb-6">
                                            {item.desc}
                                        </p>

                                        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#486581] group-hover:text-[#9FB3C8] group-hover:gap-3 transition-all duration-200">
                                            Explorar <ArrowRight size={12} />
                                        </div>
                                    </div>
                                </Link>
                            </TiltCard>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </div>
        </section>
    )
}
