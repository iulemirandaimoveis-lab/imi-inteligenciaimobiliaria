'use client'

import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/animations'
import { Target, Users, Award, TrendingUp, Linkedin, MessageCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Image from 'next/image'

export default function AboutPage() {
    const values = [
        {
            icon: Target,
            title: 'Missão',
            description: 'Fornecer inteligência imobiliária de alta qualidade, capacitando clientes a tomar decisões informadas e estratégicas no mercado imobiliário.'
        },
        {
            icon: TrendingUp,
            title: 'Visão',
            description: 'Ser referência nacional em inteligência imobiliária, reconhecidos pela excelência técnica, inovação e compromisso com resultados.'
        },
        {
            icon: Award,
            title: 'Excelência',
            description: 'Compromisso inabalável com os mais altos padrões técnicos e metodológicos em todas as nossas entregas.'
        },
        {
            icon: Users,
            title: 'Relacionamento',
            description: 'Construir parcerias duradouras baseadas em confiança, transparência e resultados consistentes para nossos clientes.'
        }
    ]

    const stats = [
        { number: '15+', label: 'Anos de Experiência' },
        { number: '500+', label: 'Projetos Realizados' },
        { number: 'R$ 200M+', label: 'em Ativos Avaliados' },
        { number: '98%', label: 'Satisfação dos Clientes' }
    ]

    return (
        <>
            {/* HERO */}
            <section className="bg-imi-900 text-white section-padding relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-accent-500/5 -skew-x-12 translate-x-1/4" />
                <div className="container-custom relative z-10">
                    <div className="max-w-4xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-px bg-accent-500" />
                            <span className="text-accent-500 font-semibold uppercase tracking-[0.2em] text-xs">Quem Somos</span>
                        </div>
                        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-8 tracking-tight">
                            Sobre
                        </h1>
                        <div className="space-y-6 text-imi-200 text-lg md:text-xl font-light leading-relaxed">
                            <p>
                                A <strong className="text-white font-semibold">Iule Miranda Imóveis (IMI)</strong> é uma empresa imobiliária de posicionamento técnico e institucional, especializada em avaliações imobiliárias, perícias judiciais e extrajudiciais, corretagem estratégica e consultoria imobiliária no Brasil e em mercados internacionais selecionados.
                            </p>
                            <p>
                                À frente da IMI está <strong className="text-white font-semibold">Iule Miranda</strong>, corretor de imóveis, perito judicial e extrajudicial, avaliador imobiliário e empresário, com atuação focada em inteligência imobiliária, estruturação patrimonial e tomada de decisão baseada em análise técnica e estratégica.
                            </p>
                            <p className="text-accent-400 font-medium">
                                A IMI atua com prioridade técnica antes do viés comercial, oferecendo segurança, clareza e consistência em decisões imobiliárias de médio e longo prazo.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* VALORES */}
            <section className="section-padding">
                <div className="container-custom">
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-imi-900 mb-4 text-center">
                        Nossos Valores
                    </h2>
                    <p className="text-imi-500 text-lg max-w-2xl mx-auto text-center mb-12">
                        Princípios que guiam cada decisão e relacionamento com nossos clientes
                    </p>

                    <motion.div
                        className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {values.map((item, index) => (
                            <motion.div
                                key={index}
                                variants={slideUp}
                                className="p-8 rounded-xl bg-white border border-imi-100 shadow-soft hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="w-12 h-12 bg-imi-900/10 text-imi-900 rounded-xl flex items-center justify-center mb-6">
                                    <item.icon className="w-5 h-5" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-bold text-imi-900 mb-3 font-display">
                                    {item.title}
                                </h3>
                                <p className="text-imi-500 leading-relaxed text-sm">
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* FUNDADOR */}
            <section className="section-padding bg-imi-50">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-elevated"
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
                        </motion.div>

                        <motion.div
                            variants={slideUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <h2 className="font-display text-3xl md:text-4xl font-bold text-imi-900 mb-6">
                                Iule Miranda
                            </h2>
                            <div className="space-y-4 text-imi-500 leading-relaxed">
                                <p>
                                    <strong className="text-imi-900">Iule Miranda</strong> é corretor de imóveis, perito judicial e extrajudicial, avaliador imobiliário e empresário, com atuação focada em inteligência imobiliária, estruturação patrimonial e tomada de decisão baseada em análise técnica e estratégica.
                                </p>
                                <p>
                                    Formação técnica sólida com mais de 15 anos de experiência no mercado imobiliário brasileiro e internacional, com foco em avaliações patrimoniais, perícias judiciais e extrajudiciais, e consultoria para investimentos de médio e alto padrão.
                                </p>
                                <p>
                                    Atuação destacada no mercado do Nordeste e assessoria especializada para investidores brasileiros em mercados internacionais selecionados, incluindo Estados Unidos e Emirados Árabes Unidos.
                                </p>
                                <p className="text-imi-900 font-medium">
                                    A IMI atua com prioridade técnica antes do viés comercial, oferecendo segurança, clareza e consistência em decisões imobiliárias de médio e longo prazo.
                                </p>
                            </div>
                            <div className="mt-8">
                                <a
                                    href="https://www.linkedin.com/in/iule-miranda"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#0077b5] text-white font-medium transition-all duration-300 border border-[#0077b5] hover:bg-white hover:text-[#0077b5] shadow-lg shadow-[#0077b5]/20 group"
                                >
                                    <Linkedin className="w-5 h-5 transition-transform group-hover:scale-110" strokeWidth={2} />
                                    <span>Conectar no LinkedIn</span>
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* NÚMEROS */}
            <section className="section-padding">
                <div className="container-custom">
                    <motion.div
                        className="grid md:grid-cols-4 gap-8 text-center"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                variants={slideUp}
                            >
                                <div className="w-12 h-12 bg-imi-900 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                                    {index + 1}
                                </div>
                                <div className="font-display text-4xl font-bold text-imi-900 mb-2">
                                    {stat.number}
                                </div>
                                <div className="text-imi-500">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="bg-imi-900 text-white section-padding text-center relative overflow-hidden">
                <div className="container-custom relative z-10">
                    <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                        Vamos Conversar?
                    </h2>
                    <p className="text-imi-300 text-lg mb-10 max-w-2xl mx-auto font-light">
                        Conte-nos sobre seu projeto e descubra como podemos ajudar você a alcançar seus objetivos.
                    </p>
                    <Button asChild size="lg" className="bg-white text-imi-900 hover:bg-imi-50">
                        <a href="/contato">
                            <MessageCircle className="w-5 h-5 mr-3" />
                            Entrar em Contato
                        </a>
                    </Button>
                </div>
            </section>
        </>
    )
}
