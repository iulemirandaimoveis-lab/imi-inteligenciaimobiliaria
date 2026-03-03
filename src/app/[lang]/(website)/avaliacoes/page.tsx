'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ShieldCheck, Home, Landmark, Scale, Briefcase, MessageCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

// Utilities for animations from HomeClient
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

const APPRAISAL_TYPES = [
  {
    icon: Home,
    title: 'Venda e Compra',
    tag: 'Mais Solicitado',
    description: 'Avaliação técnica para precificação estratégica. Análise profunda de mercado e comparativos.',
    points: ['Relatório comparativo de mercado', 'Análise de depreciação', 'Valor de liquidação forçada'],
  },
  {
    icon: Landmark,
    title: 'Garantia Bancária',
    tag: 'Financiamentos',
    description: 'Laudos técnicos aceitos por Caixa, Bradesco, Itaú e Santander. Conformidade total.',
    points: ['Aceito por grandes bancos', 'Formato PTAM', 'Prazo expresso disponível'],
  },
  {
    icon: Scale,
    title: 'Judicial / Extrajudicial',
    tag: 'Perícia Técnica',
    description: 'Perícia técnica para processos judiciais, inventários, partilhas e arbitragens.',
    points: ['Habilitado junto ao TJPE', 'Assistência técnica', 'Laudo pericial fundamentado'],
  },
  {
    icon: Briefcase,
    title: 'Patrimonial',
    tag: 'Corporativo',
    description: 'Avaliação de portfólio imobiliário para fins contábeis, IFRS ou fiscais.',
    points: ['Conformidade IFRS 13', 'Múltiplos ativos', 'Relatório executivo incluso'],
  },
]

const PROCESS = [
  { n: '01', title: 'Vistoria Técnica', desc: 'Inspeção presencial estrutural, levantamento fotográfico e medições.' },
  { n: '02', title: 'Pesquisa NBR 14653', desc: 'Coleta de dados de mercado para tratamento estrito conforme a norma.' },
  { n: '03', title: 'Emissão de Laudo', desc: 'Parecer técnico mercadológico válido nos mais altos tribunais do Brasil.' },
]

const FAQS = [
  { q: "Qual o prazo para um laudo?", a: "O prazo médio é de 5 a 7 dias úteis após a vistoria técnica, dependendo da complexidade do ativo." },
  { q: "O laudo IMI é aceito em juízo?", a: "Sim, os laudos seguem as diretrizes do IBAPE e a NBR 14653, com o avaliador possuindo registro CNAI (53290), tornando os laudos aceitos nacionalmente." },
  { q: "Como a vistoria é feita?", a: "Realizada presencialmente, envolve medição a laser, captação fotográfica de alta resolução e análise de conservação." }
]

function FAQItem({ q, a }: { q: string, a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-6 flex justify-between items-center text-left hover:text-white/80 transition-colors"
      >
        <span className="text-lg font-light tracking-wide">{q}</span>
        {open ? <ChevronUp size={20} className="text-white/50" /> : <ChevronDown size={20} className="text-white/50" />}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="pb-6"
        >
          <p className="text-white/50 font-light leading-relaxed">{a}</p>
        </motion.div>
      )}
    </div>
  )
}

export default function AppraisalsPage() {
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
            Avaliações Técnicas
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-12 font-light"
          >
            Laudos rigorosos fundamentados na norma NBR 14653. <br /> Precisão, método e aceitação judicial.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex justify-center">
            <a href="#contato" className="px-8 py-4 bg-white text-black text-sm tracking-widest uppercase font-semibold hover:bg-white/90 transition-colors">
              Solicitar Orçamento
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
              Atuação Técnica
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
          >
            {APPRAISAL_TYPES.map((item, i) => (
              <motion.div key={i} variants={fadeInUp} className="group cursor-default border-t border-black/10 pt-8">
                <div className="mb-6 opacity-40 group-hover:opacity-100 transition-opacity duration-700">
                  <item.icon size={32} />
                </div>
                <h3 className="text-xl mb-4" style={{ fontFamily: 'Georgia, serif' }}>{item.title}</h3>
                <p className="text-black/60 font-light leading-relaxed text-sm mb-6">
                  {item.description}
                </p>
                <ul className="space-y-3">
                  {item.points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-black/50 font-light">
                      <span className="text-black/30 mt-0.5">•</span> {pt}
                    </li>
                  ))}
                </ul>
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
              Processo Rigoroso
            </h2>
            <p className="text-white/50 text-lg font-light">
              Nossa estrutura metodológica de 3 passos para laudos inquestionáveis.
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
            Inicie sua solicitação.
          </h2>
          <p className="text-white/50 font-light text-lg mb-12 max-w-xl mx-auto">
            Preencha os dados abaixo ou fale pelo WhatsApp com nossa equipe técnica para um orçamento rápido.
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
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Detalhes do Imóvel</label>
              <textarea rows={3} className="w-full bg-transparent border-b border-white/20 pb-2 text-white outline-none focus:border-white transition-colors resize-none"></textarea>
            </div>
            <button type="button" className="w-full py-4 mt-8 bg-white text-black text-sm tracking-widest uppercase font-semibold hover:bg-white/90 transition-colors">
              Enviar Solicitação
            </button>
          </form>

        </motion.div>
      </section>

    </div>
  )
}
