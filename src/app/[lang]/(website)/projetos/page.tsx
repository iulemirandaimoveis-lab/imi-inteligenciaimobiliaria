'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { MapPin, ArrowRight, Building2, TrendingUp, Shield, Users } from 'lucide-react'

// ── Data ──────────────────────────────────────────────────────
const PROJETOS = [
  {
    id: 'reserva-atlantis',
    nome: 'Reserva Atlantis',
    subtitulo: 'Um filme na forma de território.',
    tipo: 'Complexo Costeiro & Hoteleiro',
    status: 'pre-lancamento',
    statusLabel: 'Pré-Lançamento Exclusivo',
    localizacao: 'Ponta de Pedra, Pernambuco',
    mercado: 'Brasil',
    destaque: true,
    vgv: 'R$ 480M',
    unidades: '320 unidades',
    area: '120.000 m²',
    conceito: 'Tecnologia REGEN de saneamento costeiro integrada a resort hotel e residências de ultra-alto padrão. Primeiro complexo imobiliário certificado ambientalmente no litoral nordestino.',
    diferenciais: [
      'Tecnologia proprietária REGEN de saneamento costeiro',
      'Arquitetura Hotel-Ship — volumes sobre o mar',
      'Certificação ambiental LEED & AQUA',
      'Target: sovereign wealth funds e family offices',
    ],
    cor: 'from-[#141420] to-[#1e1e35]',
    acento: '#486581',
    contato: true,
  },
  {
    id: 'ocean-blue',
    nome: 'Ocean Blue',
    subtitulo: 'Onde o mar encontra a sofisticação.',
    tipo: 'Residencial Alto Padrão',
    status: 'lancamento',
    statusLabel: 'Em Lançamento',
    localizacao: 'Boa Viagem, Recife — PE',
    mercado: 'Brasil',
    destaque: false,
    vgv: 'R$ 96M',
    unidades: '48 unidades',
    area: '8.200 m²',
    conceito: 'Torre residencial com vista 180° para o Atlântico. Coberturas duplex e penthouses com piscina privativa. Padrão construtivo AAA.',
    diferenciais: [
      'Vista permanente para o mar garantida',
      '4 coberturas duplex exclusivas',
      'Automação residencial integrada',
      'Lazer completo com spa e academia',
    ],
    cor: 'from-[#0F2A3D] to-[#1a3a50]',
    acento: '#4A90D9',
    contato: false,
  },
  {
    id: 'villa-jardins',
    nome: 'Villa Jardins',
    subtitulo: 'Condomínio fechado com qualidade de vida real.',
    tipo: 'Condomínio Horizontal',
    status: 'obras',
    statusLabel: 'Em Obras — Q3 2026',
    localizacao: 'Piedade, Recife — PE',
    mercado: 'Brasil',
    destaque: false,
    vgv: 'R$ 22M',
    unidades: '32 casas',
    area: '14.500 m²',
    conceito: 'Casas de 180 a 250m² em condomínio fechado com segurança 24h, jardins privativos e ampla área de lazer. 75% das unidades comercializadas.',
    diferenciais: [
      '75% das unidades vendidas',
      'Casas de 180–250m² com jardim privativo',
      'Entrega Q3 2026',
      'Financiamento bancário aprovado',
    ],
    cor: 'from-[#1A2F1A] to-[#243524]',
    acento: '#5FB85F',
    contato: false,
  },
]

const STATUS_CONFIG: Record<string, { dot: string; badge: string }> = {
  'pre-lancamento': { dot: 'bg-[#102A43]', badge: 'border-[#334E68]/40 text-[#486581] bg-[#102A43]/10' },
  lancamento: { dot: 'bg-emerald-400', badge: 'border-emerald-400/40 text-emerald-400 bg-emerald-400/10' },
  obras: { dot: 'bg-blue-400', badge: 'border-blue-400/40 text-blue-400 bg-blue-400/10' },
  pronto: { dot: 'bg-gray-400', badge: 'border-gray-400/40 text-gray-400 bg-gray-400/10' },
}

// ── Component ─────────────────────────────────────────────────
export default function ProjetosWebsitePage() {
  const params = useParams()
  const lang = (params?.lang as string) || 'pt'

  const destaque = PROJETOS.find(p => p.destaque)!
  const outros = PROJETOS.filter(p => !p.destaque)

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="bg-[#141420] text-white py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '48px 48px' }} />
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5"
          style={{ background: 'linear-gradient(135deg, #334E68 0%, transparent 60%)' }} />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-px bg-[#102A43]" />
              <span className="text-[#486581] text-xs font-bold uppercase tracking-[0.25em]">Portfólio</span>
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
              Projetos & Empreendimentos
            </h1>
            <p className="text-white/60 text-lg max-w-2xl font-light leading-relaxed">
              Desenvolvimentos imobiliários de alto padrão no Brasil, estruturados para investidores institucionais e famílias com visão de longo prazo.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Projeto em destaque — Reserva Atlantis */}
      <section className="py-16 lg:py-24 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${destaque.cor} text-white`}>

            {/* Background glow */}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
              style={{ background: `radial-gradient(circle, ${destaque.acento}, transparent)`, filter: 'blur(80px)' }} />

            <div className="relative z-10 grid lg:grid-cols-2 gap-0">
              {/* Left — content */}
              <div className="p-10 lg:p-14 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-6">
                  <span className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${STATUS_CONFIG[destaque.status].badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[destaque.status].dot}`} />
                    {destaque.statusLabel}
                  </span>
                  <span className="text-white/40 text-xs">{destaque.tipo}</span>
                </div>

                <h2 className="font-display font-bold text-4xl lg:text-5xl mb-3 leading-tight">
                  {destaque.nome}
                </h2>
                <p className="text-lg font-light mb-6" style={{ color: destaque.acento }}>
                  {destaque.subtitulo}
                </p>

                <p className="text-white/60 text-sm leading-relaxed mb-8">
                  {destaque.conceito}
                </p>

                {/* Diferenciais */}
                <ul className="space-y-2.5 mb-10">
                  {destaque.diferenciais.map(d => (
                    <li key={d} className="flex items-center gap-3 text-sm text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: destaque.acento }} />
                      {d}
                    </li>
                  ))}
                </ul>

                {/* Métricas */}
                <div className="grid grid-cols-3 gap-4 mb-10 py-6 border-y border-white/10">
                  {[
                    { l: 'VGV', v: destaque.vgv },
                    { l: 'Unidades', v: destaque.unidades },
                    { l: 'Área', v: destaque.area },
                  ].map(m => (
                    <div key={m.l}>
                      <p className="text-xs text-white/40 mb-1">{m.l}</p>
                      <p className="text-sm font-bold">{m.v}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <a href={`/${lang}/contato`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                    style={{ background: destaque.acento, color: '#141420' }}>
                    Solicitar Briefing Exclusivo <ArrowRight size={15} />
                  </a>
                  <a href="https://wa.me/5581997230455" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border border-white/20 hover:border-white/40 transition-all">
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Right — visual */}
              <div className="hidden lg:flex items-center justify-center p-10 lg:p-14">
                <div className="w-full max-w-sm">
                  {/* Abstrato visual - ocean waves */}
                  <div className="aspect-[4/5] rounded-2xl relative overflow-hidden border border-white/10"
                    style={{ background: 'linear-gradient(180deg, rgba(26,26,46,0.05) 0%, rgba(20,20,32,0.8) 100%)' }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Building2 size={80} className="opacity-10" />
                    </div>
                    {/* Placeholder text */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin size={13} className="opacity-60" />
                        <span className="text-xs text-white/60">{destaque.localizacao}</span>
                      </div>
                      <p className="text-xs text-white/40">Imagens do projeto disponíveis mediante NDA para investidores qualificados.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Outros projetos */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-[#141420] mb-2">Portfólio Ativo</h2>
            <p className="text-[#6C757D] text-sm">Empreendimentos em desenvolvimento e em comercialização.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {outros.map((p, i) => {
              const stt = STATUS_CONFIG[p.status]
              return (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">

                  {/* Header visual */}
                  <div className={`h-32 bg-gradient-to-br ${p.cor} relative flex items-center justify-center`}>
                    <Building2 size={40} className="text-white/10" />
                    <span className={`absolute top-4 left-4 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${stt.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${stt.dot}`} />
                      {p.statusLabel}
                    </span>
                    <span className="absolute top-4 right-4 text-xs font-bold text-white/60">{p.vgv} VGV</span>
                  </div>

                  <div className="p-6">
                    <p className="text-xs text-gray-400 mb-1">{p.tipo}</p>
                    <h3 className="font-display font-bold text-xl text-gray-900 mb-1">{p.nome}</h3>
                    <p className="text-sm italic mb-3" style={{ color: p.acento }}>{p.subtitulo}</p>

                    <div className="flex items-center gap-1.5 mb-4">
                      <MapPin size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">{p.localizacao}</span>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed mb-4">{p.conceito}</p>

                    {/* Métricas */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {[
                        { l: 'Unidades', v: p.unidades },
                        { l: 'Área', v: p.area },
                      ].map(m => (
                        <div key={m.l} className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] text-gray-400 mb-0.5">{m.l}</p>
                          <p className="text-sm font-bold text-gray-900">{m.v}</p>
                        </div>
                      ))}
                    </div>

                    <a href={`/${lang}/contato`}
                      className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-[#334E68] hover:text-[#486581] transition-all group-hover:border-gray-300">
                      Solicitar informações <ArrowRight size={13} />
                    </a>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Proposta de valor para investidores */}
      <section className="bg-[#141420] text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[#486581] text-xs font-bold uppercase tracking-[0.25em] mb-4">Para Investidores Institucionais</p>
            <h2 className="font-display font-bold text-3xl lg:text-4xl mb-4">
              Acesso Privilegiado ao Pipeline IMI
            </h2>
            <p className="text-white/50 text-base max-w-2xl mx-auto font-light">
              Sovereign wealth funds, family offices e investidores qualificados têm acesso antecipado a briefings técnicos, due diligence e estruturação de participação.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Shield, title: 'Due Diligence Técnica', desc: 'Laudos NBR 14653, estudos de viabilidade ABNT e análise jurídica completa disponíveis sob NDA.' },
              { icon: TrendingUp, title: 'Estruturação Financeira', desc: 'Modelagem de TIR, análise de risco e estruturação de veículos (FII, SPE, holding internacional).' },
              { icon: Users, title: 'Acesso Antecipado', desc: 'Investidores cadastrados recebem briefings exclusivos antes da abertura comercial pública.' },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.title} className="bg-white/5 border border-white/8 rounded-2xl p-7 hover:border-[#334E68]/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-[#102A43]/10 flex items-center justify-center mb-5">
                    <Icon size={18} className="text-[#486581]" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>

          <div className="text-center mt-10">
            <a href={`/${lang}/contato`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
              style={{ background: '#486581', color: '#141420' }}>
              Cadastrar como Investidor Qualificado <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
