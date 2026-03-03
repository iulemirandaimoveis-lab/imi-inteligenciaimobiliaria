'use client'

import { motion } from 'framer-motion'
import { Landmark, Globe, TrendingUp, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
    }
}

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.2 }
    }
}

const CONSULTING_TYPES = [
    {
        icon: Globe,
        title: 'Offshore & Internacionalização',
        description: 'Veículos legais e fiscais otimizados para receber e gerenciar capital no exterior com eficiência.',
    },
    {
        icon: TrendingUp,
        title: 'Yield Mapping',
        description: 'Análise de métricas quantitativas e qualitativas (Cash-on-Cash) em mercados como Flórida e Dubai.',
    },
    {
        icon: Landmark,
        title: 'Crédito Internacional',
        description: 'Estruturação de funding e alavancagem com taxas de juros competitivas fora do Brasil.',
    },
    {
        icon: Shield,
        title: 'Proteção Patrimonial',
        description: 'Blindagem de ativos utilizando estruturas LLc e Trusts, focando na segurança sucessória.',
    },
]

const PROCESS = [
    { n: '01', title: 'Diagnóstico de Perfil', desc: 'Mapeamento do capital disponível, apetite a risco e objetivos sucessórios/fiscais do núcleo familiar.' },
    { n: '02', title: 'Engenharia Estratégica', desc: 'Desenho da tese de investimento, incluindo a praça, estrutura legal (LLC) e modelo tributário (IFRS).' },
    { n: '03', title: 'Alocação & Gestão', desc: 'Aquisição do ativo de alta performance, seguida de gestão profissional sem necessidade de atuação direta.' },
]

const FAQS = [
    { q: "Qual o ticket mínimo para investimento internacional?", a: "Nosso foco são alocações a partir de US$ 250.000, onde a estrutura de alavancagem (crédito internacional) apresenta a melhor eficiência." },
    { q: "Preciso ter cidadania ou visto específico?", a: "Não. A estruturação via LLC ou corporações estrangeiras não exige visto de imigração para a aquisição e exploração de renda de ativos." },
    { q: "Como declaro esses bens no Brasil?", a: "Dispomos de parceiros especializados que estruturam todas as obrigações tributárias e cruzamentos entre a jurisdição do imóvel e o BACEN/Receita Federal." }
]

export default function ConsultoriaPage() {
    return (
        <div className="bg-black text-white min-h-screen selection:bg-white selection:text-black">

            {/* 1. HERO SECTION */}
            <section className="relative h-[80svh] min-h-[600px] flex flex-col justify-center items-center text-center px-6 overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 60%)' }} />

                <motion.div
                    className="relative z-10 max-w-4xl mx-auto"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    <motion.span variants={fadeInUp} className="text-white/50 tracking-widest uppercase text-xs mb-6 block">
                        Serviços Especializados
                    </motion.span>
                    <motion.h1
                        variants={fadeInUp}
                        className="text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[1.1] mb-6"
                        style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}
                    >
                        Consultoria Estratégica
                    </motion.h1>
                    <motion.p
                        variants={fadeInUp}
                        className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-12 font-light"
                    >
                        Gere renda em dólar com ativos internacionais de alta liquidez. <br /> Estrutura jurídica, gestão e crédito inteligente.
                    </motion.p>
                    <motion.div variants={fadeInUp} className="flex justify-center">
                        <a href="#contato" className="px-8 py-4 bg-white text-black text-sm tracking-widest uppercase font-semibold hover:bg-white/90 transition-colors">
                            Iniciar Diagnóstico
                        </a>
                    </motion.div>
                </motion.div>
            </section>

            {/* 2. DIFERENCIAIS (3-4 CARDS) */}
            <section className="py-32 px-6 bg-white text-black">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="mb-20"
                    >
                        <h2 className="text-3xl md:text-5xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>
                            Nossos Diferenciais
                        </h2>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
                    >
                        {CONSULTING_TYPES.map((item, i) => (
                            <motion.div key={i} variants={fadeInUp} className="group cursor-default border-t border-black/10 pt-8">
                                <div className="mb-6 opacity-40 group-hover:opacity-100 transition-opacity duration-700">
                                    <item.icon size={32} />
                                </div>
                                <h3 className="text-xl mb-4" style={{ fontFamily: 'Georgia, serif' }}>{item.title}</h3>
                                <p className="text-black/60 font-light leading-relaxed text-sm">
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* 3. PROCESSO / MÉTODO */}
            <section className="py-32 px-6 bg-black text-white">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="mb-20 md:text-center max-w-3xl mx-auto"
                    >
                        <h2 className="text-3xl md:text-5xl mb-6" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>
                            Decisões Pautadas em Dados
                        </h2>
                        <p className="text-white/50 text-lg font-light">
                            Nossa metodologia garante a alocação correta nos melhores mercados do mundo.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-16"
                    >
                        {PROCESS.map((step, i) => (
                            <motion.div key={i} variants={fadeInUp} className="relative border-t border-white/10 pt-8">
                                <span className="absolute top-0 right-0 -translate-y-1/2 text-8xl font-bold text-white/5 font-sans">
                                    {step.n}
                                </span>
                                <h3 className="text-xl mb-4" style={{ fontFamily: 'Georgia, serif' }}>{step.title}</h3>
                                <p className="text-white/50 font-light leading-relaxed text-sm">
                                    {step.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* 4. FAQ */}
            <section className="py-32 px-6 bg-white text-black">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="mb-16"
                    >
                        <h2 className="text-3xl md:text-5xl" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>
                            FAQ
                        </h2>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="space-y-2 border-t border-black/10"
                    >
                        {FAQS.map((faq, idx) => (
                            <div key={idx} className="border-b border-black/10">
                                <details className="group">
                                    <summary className="flex cursor-pointer list-none items-center justify-between py-6 font-medium text-lg">
                                        <span className="font-light tracking-wide">{faq.q}</span>
                                        <span className="transition group-open:rotate-180">
                                            <ChevronDown size={20} className="text-black/50" />
                                        </span>
                                    </summary>
                                    <p className="pb-6 text-black/60 font-light leading-relaxed">
                                        {faq.a}
                                    </p>
                                </details>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* 5. CTA INLINE / FORMULÁRIO */}
            <section id="contato" className="py-40 px-6 bg-black text-white text-center border-t border-white/10">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeInUp}
                    className="max-w-3xl mx-auto"
                >
                    <h2 className="text-4xl md:text-6xl mb-8" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>
                        Inicie sua alocação.
                    </h2>
                    <p className="text-white/50 font-light text-lg mb-12 max-w-xl mx-auto">
                        Proteja seu patrimônio com inteligência mercadológica. Nossa equipe está pronta para um diagnóstico não vinculativo.
                    </p>

                    <form className="space-y-6 max-w-md mx-auto text-left" onSubmit={(e) => e.preventDefault()}>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Nome Completo</label>
                            <input type="text" className="w-full bg-transparent border-b border-white/20 pb-2 text-white outline-none focus:border-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Email</label>
                            <input type="email" className="w-full bg-transparent border-b border-white/20 pb-2 text-white outline-none focus:border-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Mensagem (Opcional)</label>
                            <textarea rows={3} className="w-full bg-transparent border-b border-white/20 pb-2 text-white outline-none focus:border-white transition-colors resize-none"></textarea>
                        </div>
                        <button type="button" className="w-full py-4 mt-8 bg-white text-black text-sm tracking-widest uppercase font-semibold hover:bg-white/90 transition-colors">
                            Solicitar Contato
                        </button>
                    </form>

                </motion.div>
            </section>

        </div>
    )
}
