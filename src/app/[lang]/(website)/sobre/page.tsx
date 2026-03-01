'use client'

import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/animations'
import { Target, Shield, Globe, TrendingUp, Linkedin, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const values = [
    {
        icon: Target,
        title: 'Missão',
        description: 'Fornecer inteligência imobiliária de alta qualidade, capacitando clientes a tomar decisões informadas e estratégicas.',
    },
    {
        icon: TrendingUp,
        title: 'Visão',
        description: 'Ser referência nacional em inteligência imobiliária, reconhecidos pela excelência técnica, inovação e compromisso com resultados.',
    },
    {
        icon: Shield,
        title: 'Excelência',
        description: 'Compromisso inabalável com os mais altos padrões técnicos e metodológicos em todas as nossas entregas.',
    },
    {
        icon: Globe,
        title: 'Relacionamento',
        description: 'Construir parcerias duradouras baseadas em confiança, transparência e resultados consistentes.',
    },
]

const stats = [
    { number: '15+', label: 'Anos de Experiência' },
    { number: '500+', label: 'Projetos Realizados' },
    { number: 'R$ 200M+', label: 'em Ativos Avaliados' },
    { number: '98%', label: 'Satisfação dos Clientes' },
]

export default function AboutPage() {
    return (
        <main className="bg-[#0D0F14]">
            {/* HERO */}
            <section className="relative bg-[#141420] text-white pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden border-b border-white/[0.05]">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-[#102A43]/5 -skew-x-12 translate-x-1/4" />
                <div className="container-custom relative z-10">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="max-w-4xl"
                    >
                        <motion.div variants={slideUp} className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-px bg-[#102A43]" />
                            <span className="text-[#486581] font-bold uppercase tracking-[0.25em] text-[11px]">Quem Somos</span>
                        </motion.div>
                        <motion.h1
                            variants={slideUp}
                            className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-8 tracking-tight leading-tight text-white"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            IMI – Inteligência <br /><span className="text-[#486581] italic">Imobiliária</span>
                        </motion.h1>
                        <motion.div variants={slideUp} className="space-y-5 text-[#9CA3AF] text-lg sm:text-xl font-light leading-relaxed max-w-3xl">
                            <p>
                                Empresa de posicionamento técnico e institucional, especializada em <strong className="text-white font-medium">avaliações imobiliárias</strong>, perícias judiciais e extrajudiciais, corretagem estratégica e consultoria no Brasil e mercados internacionais selecionados.
                            </p>
                            <p className="text-[#627D98] font-medium text-base">
                                Prioridade técnica antes do viés comercial — segurança, clareza e consistência em decisões imobiliárias de médio e longo prazo.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* VALORES */}
            <section className="py-16 md:py-24">
                <div className="container-custom">
                    <div className="text-center mb-14">
                        <div className="flex items-center justify-center gap-3 mb-5">
                            <div className="w-8 h-px bg-[#334E68]" />
                            <span className="text-[#627D98] font-bold uppercase tracking-[0.25em] text-[11px]">Princípios</span>
                            <div className="w-8 h-px bg-[#334E68]" />
                        </div>
                        <h2
                            className="text-3xl sm:text-4xl font-bold text-white mb-4"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            Nossos Valores
                        </h2>
                        <p className="text-[#9CA3AF] text-lg font-light max-w-2xl mx-auto">
                            Princípios que guiam cada decisão e relacionamento com nossos clientes
                        </p>
                    </div>

                    <motion.div
                        className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {values.map((item, index) => (
                            <motion.div
                                key={index}
                                variants={slideUp}
                                className="p-8 rounded-2xl bg-[#141420] border border-white/[0.05] transition-all duration-300 group hover:border-[#334E68]/30 hover:shadow-[0_8px_32px_rgba(26,26,46,0.1)]"
                            >
                                <div className="w-12 h-12 bg-[#1A1E2A] text-[#627D98] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/[0.05]">
                                    <item.icon className="w-5 h-5" strokeWidth={1.5} />
                                </div>
                                <h3
                                    className="text-xl font-bold text-white mb-3"
                                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                >
                                    {item.title}
                                </h3>
                                <p className="text-[#9CA3AF] leading-relaxed text-sm">
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* FUNDADOR */}
            <section className="py-16 md:py-24 border-t border-white/[0.05]">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <motion.div
                            className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/[0.05]"
                            variants={slideUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <Image
                                src="/about-profile.jpg"
                                alt="Iule Miranda"
                                fill
                                className="object-cover object-top"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F14]/60 via-transparent to-transparent" />
                        </motion.div>

                        <motion.div
                            variants={slideUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-px bg-[#334E68]" />
                                <span className="text-[#627D98] font-bold uppercase tracking-[0.25em] text-[11px]">Fundador</span>
                            </div>
                            <h2
                                className="text-3xl sm:text-4xl font-bold text-white mb-6"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                                Iule Miranda
                            </h2>
                            <div className="space-y-4 text-[#9CA3AF] leading-relaxed text-[15px]">
                                <p>
                                    Corretor de imóveis, <strong className="text-white font-medium">perito judicial e extrajudicial</strong>, avaliador imobiliário e empresário, com atuação focada em inteligência imobiliária, estruturação patrimonial e tomada de decisão baseada em análise técnica.
                                </p>
                                <p>
                                    Formação técnica sólida com mais de 15 anos de experiência no mercado imobiliário brasileiro e internacional, com foco em avaliações patrimoniais, perícias e consultoria para investimentos de médio e alto padrão.
                                </p>
                                <p>
                                    Atuação destacada no mercado do Nordeste e assessoria especializada para investidores brasileiros em mercados internacionais selecionados, incluindo Estados Unidos e Emirados Árabes Unidos.
                                </p>
                            </div>
                            <div className="mt-8">
                                <a
                                    href="https://www.linkedin.com/in/iule-miranda"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-3 px-8 h-12 rounded-xl bg-[#0077b5] text-white font-semibold text-sm transition-all duration-300 hover:bg-[#005e8e] shadow-lg shadow-[#0077b5]/20"
                                >
                                    <Linkedin className="w-4 h-4" strokeWidth={2} />
                                    Conectar no LinkedIn
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* NÚMEROS */}
            <section className="py-16 md:py-24 border-t border-white/[0.05]">
                <div className="container-custom">
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                variants={slideUp}
                                className="text-center"
                            >
                                <div
                                    className="text-4xl md:text-5xl font-bold text-white mb-2"
                                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                >
                                    {stat.number}
                                </div>
                                <div className="text-sm text-[#627D98] font-medium">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-[#141420] text-white py-20 md:py-28 text-center relative overflow-hidden border-t border-white/[0.05]">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at center, #334E68 0%, transparent 60%)', filter: 'blur(80px)' }} />
                <div className="container-custom relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2
                            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            Vamos <span className="text-[#486581] italic">Conversar?</span>
                        </h2>
                        <p className="text-[#9CA3AF] text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed">
                            Conte-nos sobre seu projeto e descubra como podemos ajudar você a alcançar seus objetivos.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/pt/contato"
                                className="inline-flex items-center justify-center gap-3 h-14 px-10 text-sm font-bold bg-[#102A43] text-white hover:bg-[#1A2F44] rounded-xl transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-[#102A43]/30"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Entrar em Contato
                            </Link>
                            <a
                                href="https://wa.me/5581997230455"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-3 h-14 px-10 text-sm font-bold border border-white/10 text-slate-300 hover:bg-white/[0.04] hover:text-white rounded-xl transition-all duration-300"
                            >
                                WhatsApp Direto
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    )
}
