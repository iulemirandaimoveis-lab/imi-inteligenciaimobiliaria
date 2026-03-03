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
    tagColor: 'bg-blue-50 text-blue-600',
    description: 'Laudos técnicos aceitos por Caixa, Bradesco, Itaú e Santander. Conformidade total com as exigências bancárias.',
    points: ['Aceito por todos os grandes bancos', 'Formato PTAM', 'Prazo expresso disponível'],
  },
  {
    icon: Scale,
    title: 'Judicial / Extrajudicial',
    tag: 'Perícia Técnica',
    tagColor: 'bg-purple-50 text-purple-600',
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

export default function AppraisalsPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative bg-[#141420] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] -translate-y-1/3 translate-x-1/3 rounded-full bg-[#102A43]/[0.07] blur-[80px]" />

        <div className="relative z-10 container-custom py-20 lg:py-28">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-px bg-[#102A43]" />
              <span className="text-[#486581] text-[11px] font-bold uppercase tracking-[0.25em]">CNAI 53290</span>
            </div>
            <h1 className="text-[40px] sm:text-[52px] lg:text-[64px] font-black leading-[1.02] tracking-tight mb-6 text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Avaliações <span className="text-[#486581]">Imobiliárias</span>
            </h1>
            <p className="text-[17px] lg:text-[19px] leading-relaxed font-light text-[#9CA3AF] max-w-2xl">
              Laudos técnicos com metodologia normativa <span className="text-white font-medium">NBR 14653</span>. Decisões seguras baseadas em análise profissional e independente.
            </p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-12 flex flex-wrap gap-x-10 gap-y-6">
              {[{ v: '+500', l: 'Laudos emitidos' }, { v: 'NBR', l: '14653 metodologia' }, { v: '72h', l: 'Prazo expresso' }].map((s, i) => (
                <div key={i}>
                  <div className="text-[30px] font-black text-[#486581] leading-none mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{s.v}</div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6C757D]">{s.l}</div>
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
                <div className="w-10 h-10 bg-[#F8F9FA] rounded-xl flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-[#486581]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#1A1A1A]">{item.t}</p>
                  <p className="text-[11px] text-[#6C757D]">{item.s}</p>
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
            <span className="text-[#486581] text-[11px] font-bold uppercase tracking-[0.25em]">Serviços</span>
            <h2 className="text-[32px] lg:text-[44px] font-black mt-4 mb-4 text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Tipos de Avaliação</h2>
            <p className="text-[#6C757D] text-lg max-w-xl mx-auto font-light">Serviços especializados para cada necessidade de mercado e conformidade legal</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {APPRAISAL_TYPES.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="group bg-white border border-[#E9ECEF] rounded-2xl p-6 hover:border-[#334E68]/40 hover:shadow-[0_8px_32px_rgba(26,26,46,0.10)] transition-all duration-300">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-11 h-11 bg-[#1A1A1A] rounded-xl flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${item.tagColor}`}>{item.tag}</span>
                </div>
                <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-2">{item.title}</h3>
                <p className="text-[13px] text-[#6C757D] leading-relaxed mb-5">{item.description}</p>
                <ul className="space-y-2">
                  {item.points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-2 text-[12px] text-[#495057]">
                      <CheckCircle className="w-3.5 h-3.5 text-[#486581] flex-shrink-0 mt-0.5" strokeWidth={2} />{pt}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* METODOLOGIA */}
      <section className="section-padding bg-[#F8F9FA]">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-[#486581] text-[11px] font-bold uppercase tracking-[0.25em]">Processo</span>
              <h2 className="text-[30px] lg:text-[40px] font-black mt-4 mb-4 text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Nossa Metodologia</h2>
              <p className="text-[#6C757D] max-w-lg mx-auto font-light">Todas as avaliações seguem rigorosamente a <strong className="text-[#1A1A1A]">NBR 14653</strong> e as diretrizes do IBAPE.</p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              {PROCESS.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="flex gap-4 lg:flex-col lg:gap-3">
                  <div className="w-11 h-11 flex-shrink-0 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center text-[12px] font-black">{step.n}</div>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A] mb-1.5">{step.title}</h3>
                    <p className="text-[13px] text-[#6C757D] leading-relaxed">{step.desc}</p>
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
              <span className="text-[#486581] text-[11px] font-bold uppercase tracking-[0.25em]">Solicitar</span>
              <h2 className="text-[30px] lg:text-[40px] font-black mt-4 mb-4 text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Solicitar Avaliação Técnica</h2>
              <p className="text-[#6C757D] max-w-md mx-auto font-light">Preencha o formulário e retornaremos em até 24 horas com um orçamento detalhado.</p>
            </div>
            <AppraisalForm />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#141420] section-padding">
        <div className="container-custom text-center">
          <h2 className="text-[28px] lg:text-[38px] font-black text-white mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Dúvidas sobre Avaliações?</h2>
          <p className="text-[#6C757D] text-lg mb-10 max-w-md mx-auto font-light">Nossa equipe técnica esclarece qualquer questão normativa ou processual.</p>
          <ButtonPrimary href="https://wa.me/5581997230455" target="_blank" rel="noopener noreferrer" size="lg" icon={<MessageCircle size={16} />}>
            Falar com Especialista
          </ButtonPrimary>
        </div>
      </section>
    </>
  )
}
