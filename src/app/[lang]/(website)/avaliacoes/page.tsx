'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Home, Landmark, Scale, Briefcase, MessageCircle, CheckCircle } from 'lucide-react'
import AppraisalForm from '@/components/forms/AppraisalForm'
import { ButtonPrimary } from '@/components/website/Buttons'

const APPRAISAL_TYPES = [
  {
    icon: Home,
    title: 'Venda e Compra',
    tag: 'Mais Solicitado',
    tagColor: 'bg-amber-50 text-amber-700',
    description: 'Avaliação técnica para precificação estratégica. Análise profunda de mercado e comparativos para determinar o valor justo do ativo.',
    points: ['Relatório comparativo de mercado', 'Análise de depreciação', 'Valor de liquidação forçada'],
  },
  {
    icon: Landmark,
    title: 'Garantia Bancária',
    tag: 'Financiamentos',
    tagColor: 'bg-[#C8A44A]/10 text-[#C8A44A]',
    description: 'Laudos técnicos aceitos por Caixa, Bradesco, Itaú e Santander. Conformidade total com as exigências bancárias.',
    points: ['Aceito por todos os grandes bancos', 'Formato PTAM', 'Prazo expresso disponível'],
  },
  {
    icon: Scale,
    title: 'Judicial / Extrajudicial',
    tag: 'Perícia Técnica',
    tagColor: 'bg-[#C8A44A]/10 text-[#C8A44A]',
    description: 'Perícia técnica para processos judiciais, inventários, partilhas e arbitragens. Fundamentação normativa para uso legal.',
    points: ['Habilitado junto ao TJPE', 'Assistência técnica judicial', 'Laudo pericial fundamentado'],
  },
  {
    icon: Briefcase,
    title: 'Patrimonial / Empresarial',
    tag: 'Corporativo',
    tagColor: 'bg-emerald-50 text-emerald-600',
    description: 'Avaliação de portfólio imobiliário para fins contábeis, IFRS, fiscais ou reestruturação estratégica.',
    points: ['Conformidade IFRS 13', 'Múltiplos ativos simultâneos', 'Relatório executivo incluso'],
  },
]

const PROCESS = [
  { n: '01', title: 'Vistoria Técnica', desc: 'Inspeção presencial com levantamento fotográfico, medições e análise das condições físicas do imóvel.' },
  { n: '02', title: 'Pesquisa de Mercado', desc: 'Coleta e tratamento estatístico de dados comparativos conforme metodologia NBR 14653.' },
  { n: '03', title: 'Laudo Técnico', desc: 'Emissão do documento final com valor conclusivo, fundamentação e ART do responsável técnico.' },
]

const FAQ_DATA = [
  {
    question: 'O que é uma avaliação imobiliária NBR 14653?',
    answer: 'É um laudo técnico que determina o valor de mercado de um imóvel seguindo a norma NBR 14653 da ABNT. Utiliza métodos científicos como comparativo direto de dados de mercado, método evolutivo e método da renda para determinar o valor justo do imóvel.',
  },
  {
    question: 'Quanto custa uma avaliação imobiliária em Recife?',
    answer: 'O valor varia conforme o tipo e porte do imóvel. Apartamentos residenciais partem de R$ 1.200. Imóveis comerciais e industriais possuem valores sob consulta. Solicite um orçamento detalhado pelo formulário ou WhatsApp.',
  },
  {
    question: 'Qual o prazo para emissão do laudo de avaliação?',
    answer: 'O prazo padrão é de 5 a 7 dias úteis. Oferecemos prazo expresso de 72 horas para casos urgentes, como processos judiciais e financiamentos bancários.',
  },
  {
    question: 'O laudo é aceito por bancos para financiamento?',
    answer: 'Sim. Nossos laudos são aceitos pela Caixa Econômica Federal, Bradesco, Itaú, Santander e demais instituições financeiras. Emitimos no formato PTAM exigido pelos bancos.',
  },
  {
    question: 'O avaliador é certificado pelo CNAI?',
    answer: 'Sim. O responsável técnico é avaliador certificado pelo CNAI (Cadastro Nacional de Avaliadores Imobiliários) sob o número 53290, habilitado pelo COFECI para emitir laudos em todo o território nacional.',
  },
  {
    question: 'Para que serve a avaliação judicial de imóvel?',
    answer: 'A avaliação judicial é utilizada em processos de inventário, divórcio, partilha de bens, desapropriação, execuções judiciais e arbitragens. O laudo pericial fundamentado é aceito pelo TJPE e demais tribunais.',
  },
]

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_DATA.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export default function AppraisalsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      {/* HERO */}
      <section className="relative bg-navy-950 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 right-0 w-[200px] h-[200px] sm:w-[500px] sm:h-[500px] -translate-y-1/3 translate-x-1/3 rounded-full bg-navy-800/[0.07] blur-[80px]" />

        <div className="relative z-10 container-custom py-20 lg:py-28">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-px bg-navy-800" />
              <span className="text-[#C8A44A] text-[11px] font-bold uppercase tracking-[0.25em]">CNAI 53290</span>
            </div>
            <h1 className="text-[40px] sm:text-[52px] lg:text-[64px] font-black leading-[1.02] tracking-tight mb-6 text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Avaliações <span className="text-[#C8A44A]">Imobiliárias</span>
            </h1>
            <p className="text-[17px] lg:text-[19px] leading-relaxed font-light text-white/50 max-w-2xl">
              Laudos técnicos com metodologia normativa <span className="text-white font-medium">NBR 14653</span>. Decisões seguras baseadas em análise profissional e independente.
            </p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-12 flex flex-wrap gap-x-10 gap-y-6">
              {[{ v: '+500', l: 'Laudos emitidos' }, { v: 'NBR', l: '14653 metodologia' }, { v: '72h', l: 'Prazo expresso' }].map((s, i) => (
                <div key={i}>
                  <div className="text-[30px] font-black text-[#C8A44A] leading-none mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{s.v}</div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">{s.l}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* CERTIFICAÇÃO */}
      <section className="bg-white py-8 border-b border-[#F1F3F5]">
        <div className="container-custom">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {[
              { icon: ShieldCheck, t: 'Avaliador Certificado', s: 'CNAI Nº 53290 — COFECI' },
              { icon: Scale, t: 'Habilitado TJPE', s: 'Perito judicial credenciado' },
              { icon: Landmark, t: 'Aceito em Bancos', s: 'Caixa, Bradesco, Itaú, Santander' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-[#C8A44A]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-neutral-900">{item.t}</p>
                  <p className="text-[11px] text-gray-500">{item.s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIPOS */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-14">
            <span className="text-[#C8A44A] text-[11px] font-bold uppercase tracking-[0.25em]">Serviços</span>
            <h2 className="text-[32px] lg:text-[44px] font-black mt-4 mb-4 text-neutral-900" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Tipos de Avaliação</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto font-light">Serviços especializados para cada necessidade de mercado e conformidade legal</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {APPRAISAL_TYPES.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="group bg-white border border-[#E9ECEF] rounded-2xl p-6 hover:border-navy-600/40 hover:shadow-[0_8px_32px_rgba(26,26,46,0.10)] transition-all duration-300">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-11 h-11 bg-neutral-900 rounded-xl flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${item.tagColor}`}>{item.tag}</span>
                </div>
                <h3 className="text-[15px] font-bold text-neutral-900 mb-2">{item.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-5">{item.description}</p>
                <ul className="space-y-2">
                  {item.points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-2 text-[12px] text-gray-600">
                      <CheckCircle className="w-3.5 h-3.5 text-[#C8A44A] flex-shrink-0 mt-0.5" strokeWidth={2} />{pt}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* METODOLOGIA */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-[#C8A44A] text-[11px] font-bold uppercase tracking-[0.25em]">Processo</span>
              <h2 className="text-[30px] lg:text-[40px] font-black mt-4 mb-4 text-neutral-900" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Nossa Metodologia</h2>
              <p className="text-gray-500 max-w-lg mx-auto font-light">Todas as avaliações seguem rigorosamente a <strong className="text-neutral-900">NBR 14653</strong> e as diretrizes do IBAPE.</p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              {PROCESS.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="flex gap-4 lg:flex-col lg:gap-3">
                  <div className="w-11 h-11 flex-shrink-0 bg-neutral-900 text-white rounded-full flex items-center justify-center text-[12px] font-black">{step.n}</div>
                  <div>
                    <h3 className="font-bold text-neutral-900 mb-1.5">{step.title}</h3>
                    <p className="text-[13px] text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="section-padding bg-white" id="form">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-[#C8A44A] text-[11px] font-bold uppercase tracking-[0.25em]">Solicitar</span>
              <h2 className="text-[30px] lg:text-[40px] font-black mt-4 mb-4 text-neutral-900" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Solicitar Avaliação Técnica</h2>
              <p className="text-gray-500 max-w-md mx-auto font-light">Preencha o formulário e retornaremos em até 24 horas com um orçamento detalhado.</p>
            </div>
            <AppraisalForm />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-[#C8A44A] text-[11px] font-bold uppercase tracking-[0.25em]">Dúvidas Frequentes</span>
              <h2 className="text-[30px] lg:text-[40px] font-black mt-4 mb-4 text-neutral-900" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Perguntas Frequentes</h2>
            </div>
            <div className="space-y-4">
              {FAQ_DATA.map((faq, i) => (
                <details key={i} className="group bg-white border border-[#E9ECEF] rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between cursor-pointer p-5 text-[15px] font-semibold text-neutral-900 hover:bg-gray-50 transition-colors">
                    {faq.question}
                    <span className="ml-4 text-[#C8A44A] group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                  </summary>
                  <div className="px-5 pb-5 text-[14px] text-gray-500 leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-950 section-padding">
        <div className="container-custom text-center">
          <h2 className="text-[28px] lg:text-[38px] font-black text-white mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Dúvidas sobre Avaliações?</h2>
          <p className="text-white/40 text-lg mb-10 max-w-md mx-auto font-light">Nossa equipe técnica esclarece qualquer questão normativa ou processual.</p>
          <ButtonPrimary href="https://wa.me/5581997230455" target="_blank" rel="noopener noreferrer" size="lg" icon={<MessageCircle size={16} />}>
            Falar com Especialista
          </ButtonPrimary>
        </div>
      </section>
    </>
  )
}
