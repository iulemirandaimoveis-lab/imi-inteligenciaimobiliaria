import type { Metadata } from 'next'
import Link from 'next/link'
import { BarChart3, TrendingUp, Map, FileText, ArrowUpRight, Brain, Database, LineChart } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Inteligência de Mercado | IMI — Iule Miranda Imóveis',
    description: 'Centro de inteligência imobiliária da IMI. Dashboards, índices de mercado, mapa de calor e relatórios técnicos para fundamentar seus investimentos.',
}

const SECTIONS = [
    {
        href: 'inteligencia/dashboard',
        icon: BarChart3,
        label: 'Dashboard',
        description: 'KPIs e indicadores de mercado atualizados — liquidez, valorização, custo médio m², tendências macro.',
        tag: 'Dados ao Vivo',
        tagColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    },
    {
        href: 'inteligencia/indices',
        icon: TrendingUp,
        label: 'Índices IMI',
        description: 'O Índice Imobiliário IMI — metodologia proprietária de precificação e tendência para João Pessoa e regiões monitoradas.',
        tag: 'Metodologia Própria',
        tagColor: 'text-[#86A8C8] bg-[#86A8C8]/10 border-[#86A8C8]/20',
    },
    {
        href: 'inteligencia/mapa',
        icon: Map,
        label: 'Mapa de Calor',
        description: 'Visualização geográfica de valorização, densidade de oferta e liquidez por bairro e região.',
        tag: 'Em Breve',
        tagColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    },
    {
        href: 'inteligencia/relatorios',
        icon: FileText,
        label: 'Relatórios',
        description: 'Estudos técnicos de mercado, dossiês de bairro e análises comparativas para download.',
        tag: 'PDF & Exclusivos',
        tagColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    },
]

const PILLARS = [
    {
        icon: Database,
        title: 'Dados Primários',
        description: 'Transações reais, visitas técnicas e coleta direta de campo — não dependemos apenas de portais.',
    },
    {
        icon: Brain,
        title: 'Metodologia NBR',
        description: 'Toda análise respeita a norma ABNT NBR 14653 para avaliação e tratamento estatístico.',
    },
    {
        icon: LineChart,
        title: 'Atualização Contínua',
        description: 'Indicadores revisados mensalmente com cruzamento de dados macro e microrregionais.',
    },
]

export default function InteligenciaPage({ params }: { params: { lang: string } }) {
    const { lang } = params

    return (
        <main className="bg-[#0D0F14] min-h-screen">
            {/* HERO */}
            <section className="relative bg-[#0D1117] text-white pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden border-b border-white/[0.05]">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #334E68 0%, transparent 60%)' }} />
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(rgba(72,101,129,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(72,101,129,0.4) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                <div className="container-custom relative z-10">
                    <div className="max-w-4xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-px bg-[#334E68]" />
                            <span className="text-[#486581] font-bold uppercase tracking-[0.25em] text-[11px]">Market Intelligence</span>
                        </div>
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold mb-8 tracking-tight leading-tight text-white">
                            Centro de <br /><span className="text-[#486581] italic">Inteligência</span> Imobiliária
                        </h1>
                        <p className="text-[#9CA3AF] text-lg sm:text-xl font-light leading-relaxed max-w-2xl">
                            Dados precisos, índices proprietários e análises técnicas para fundamentar decisões de investimento com profundidade que portais não oferecem.
                        </p>
                    </div>
                </div>
            </section>

            {/* SEÇÕES */}
            <section className="py-16 md:py-24">
                <div className="container-custom">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {SECTIONS.map((s) => (
                            <Link
                                key={s.href}
                                href={`/${lang}/${s.href}`}
                                className="group block p-8 sm:p-10 rounded-3xl bg-[#141420] border border-white/[0.05] hover:border-[#334E68]/40 hover:shadow-[0_8px_32px_rgba(26,26,46,0.15)] transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-14 h-14 bg-[#1A1E2A] text-[#486581] rounded-2xl flex items-center justify-center border border-white/[0.05] group-hover:scale-110 transition-transform">
                                        <s.icon className="w-6 h-6" strokeWidth={1.5} />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border ${s.tagColor}`}>
                                        {s.tag}
                                    </span>
                                </div>
                                <h2 className="font-display text-2xl font-bold text-white mb-3 group-hover:text-[#86A8C8] transition-colors">
                                    {s.label}
                                </h2>
                                <p className="text-[#9CA3AF] text-sm leading-relaxed mb-6 font-light">
                                    {s.description}
                                </p>
                                <span className="flex items-center gap-2 text-[#486581] text-sm font-semibold">
                                    Acessar
                                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* PILARES */}
            <section className="py-16 md:py-24 border-t border-white/[0.05]">
                <div className="container-custom">
                    <div className="text-center mb-14">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-8 h-px bg-[#334E68]" />
                            <span className="text-[#486581] font-bold uppercase tracking-[0.25em] text-[11px]">Nossa Metodologia</span>
                            <div className="w-8 h-px bg-[#334E68]" />
                        </div>
                        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
                            Inteligência com <span className="text-[#486581] italic">Rigor Técnico</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {PILLARS.map((p, i) => (
                            <div
                                key={i}
                                className="p-8 rounded-3xl bg-[#141420] border border-white/[0.05] text-center"
                            >
                                <div className="w-14 h-14 bg-[#1A1E2A] text-[#486581] rounded-2xl flex items-center justify-center mb-6 mx-auto border border-white/[0.05]">
                                    <p.icon className="w-6 h-6" strokeWidth={1.5} />
                                </div>
                                <h3 className="font-display text-lg font-bold text-white mb-3">{p.title}</h3>
                                <p className="text-[#9CA3AF] text-sm leading-relaxed font-light">{p.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-[#141420] text-white py-20 md:py-28 text-center relative overflow-hidden border-t border-white/[0.05]">
                <div className="absolute inset-0 opacity-[0.05]"
                    style={{ backgroundImage: 'radial-gradient(circle at center, #334E68 0%, transparent 60%)', filter: 'blur(80px)' }} />
                <div className="container-custom relative z-10">
                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
                        Precisa de uma <span className="text-[#486581] italic">Análise Personalizada</span>?
                    </h2>
                    <p className="text-[#9CA3AF] text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed">
                        Dossiê de bairro, estudo de viabilidade ou laudo técnico — nossa equipe entrega com metodologia ABNT e dados exclusivos.
                    </p>
                    <a
                        href="https://wa.me/5581997230455"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 h-14 px-10 rounded-xl bg-[#102A43] text-white font-bold text-sm uppercase tracking-wider hover:bg-[#1A3F5C] transition-all shadow-[0_4px_14px_rgba(16,42,67,0.4)]"
                    >
                        Solicitar Estudo de Mercado
                    </a>
                </div>
            </section>
        </main>
    )
}
