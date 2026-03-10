'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/motion-primitives'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const FAQS = [
    {
        q: 'O que é uma avaliação imobiliária NBR 14653?',
        a: 'É um laudo técnico de avaliação de imóveis que segue a norma brasileira ABNT NBR 14653. O documento determina o valor de mercado de um imóvel com metodologia científica, sendo aceito por bancos, tribunais, fundos de investimento e órgãos públicos.',
    },
    {
        q: 'Em quanto tempo o laudo de avaliação fica pronto?',
        a: 'O prazo padrão é de 7 a 15 dias úteis, dependendo da complexidade do imóvel e da finalidade do laudo. Avaliações judiciais e para grandes portfólios podem ter prazos diferenciados, definidos no contrato.',
    },
    {
        q: 'A IMI atua fora do Brasil?',
        a: 'Sim. Atuamos em três mercados: Brasil (Recife, João Pessoa, São Paulo), Dubai (Emirados Árabes Unidos) e mercados selecionados nos Estados Unidos. Para investidores internacionais, oferecemos consultoria patrimonial cross-border.',
    },
    {
        q: 'Qual a diferença entre avaliação e opinião de mercado?',
        a: 'A avaliação técnica (laudo) segue normas ABNT e tem validade legal e bancária. A opinião de mercado é uma estimativa informal sem respaldo normativo. Para operações financeiras, judiciais ou de compliance, sempre é necessário o laudo técnico.',
    },
    {
        q: 'Vocês trabalham com crédito e financiamento imobiliário?',
        a: 'Sim. Oferecemos consultoria completa de crédito imobiliário, incluindo análise de capacidade de pagamento, comparativo entre bancos, e assessoria na documentação. Trabalhamos com as melhores taxas do mercado.',
    },
]

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)
    const params = useParams()
    const lang = (params?.lang as string) || 'pt'

    return (
        <section className="py-20 lg:py-28" style={{ background: '#F8F9FA' }}>
            <div className="max-w-[900px] mx-auto px-6 lg:px-8">
                <ScrollReveal>
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-8 h-px bg-[#102A43]" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#486581]">
                                FAQ
                            </span>
                            <div className="w-8 h-px bg-[#102A43]" />
                        </div>
                        <h2
                            className="text-[28px] sm:text-[36px] font-bold text-[#1A1A1A] leading-tight"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            Perguntas{' '}
                            <span className="text-[#334E68]">frequentes</span>
                        </h2>
                    </div>
                </ScrollReveal>

                <div className="space-y-3">
                    {FAQS.map((faq, i) => {
                        const isOpen = openIndex === i
                        return (
                            <ScrollReveal key={i} delay={i * 0.05}>
                                <div
                                    className={`rounded-xl border transition-all duration-300 overflow-hidden ${isOpen
                                        ? 'border-[#334E68]/30 bg-white shadow-sm'
                                        : 'border-black/[0.06] bg-white hover:border-[#334E68]/20'
                                        }`}
                                >
                                    <button
                                        onClick={() => setOpenIndex(isOpen ? null : i)}
                                        className="w-full flex items-center justify-between px-6 py-5 text-left"
                                    >
                                        <span className={`text-[15px] font-semibold pr-4 transition-colors ${isOpen ? 'text-[#1A1A1A]' : 'text-[#495057]'}`}>
                                            {faq.q}
                                        </span>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isOpen ? 'bg-[#102A43] text-white rotate-0' : 'bg-[#F4F6F8] text-[#6C757D]'}`}>
                                            {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                                            >
                                                <div className="px-6 pb-5 pt-0">
                                                    <div className="w-full h-px bg-black/[0.06] mb-4" />
                                                    <p className="text-[14px] text-[#6C757D] leading-relaxed">
                                                        {faq.a}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </ScrollReveal>
                        )
                    })}
                </div>

                {/* Contact CTA */}
                <ScrollReveal delay={0.3}>
                    <div className="text-center mt-10">
                        <p className="text-sm text-[#6C757D] mb-4">Não encontrou o que procurava?</p>
                        <Link
                            href={`/${lang}/contato`}
                            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#102A43] hover:text-[#334E68] transition-colors group"
                        >
                            Fale com nossa equipe
                            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    )
}
