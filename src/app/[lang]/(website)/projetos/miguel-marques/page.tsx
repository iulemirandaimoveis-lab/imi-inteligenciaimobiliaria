import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Waves, Trees, Zap } from 'lucide-react'
import dynamic from 'next/dynamic'

import { ALL_LOTS } from './data/lotsData'

const MasterplanSection = dynamic(
  () => import('./components/MasterplanSection'),
  { ssr: false },
)

const WHATSAPP = '5581997230455'

const LOTS_DISPONIVEIS = ALL_LOTS.filter(l => l.status === 'disponivel').length
const LOTS_TOTAL = ALL_LOTS.length

export const metadata: Metadata = {
  title: 'Loteamento Miguel Marques | IMI — Inteligência Imobiliária',
  description:
    `Loteamento residencial com ${LOTS_TOTAL} lotes individuais, lago natural e infraestrutura completa. Explore o mapa interativo e escolha o seu lote.`,
  openGraph: {
    title: 'Loteamento Miguel Marques — Escolha Seu Lote',
    description:
      `Mapa interativo com disponibilidade em tempo real. ${LOTS_DISPONIVEIS} de ${LOTS_TOTAL} lotes disponíveis.`,
  },
}

const INFO_CARDS = [
  {
    icon: Trees,
    title: 'Lago Natural',
    description:
      'Lotes com frente ao lago (Quadra Z) para quem busca contato direto com a natureza. Área de preservação permanente garantida.',
  },
  {
    icon: Zap,
    title: 'Infraestrutura Completa',
    description:
      'Água, esgoto, energia elétrica, iluminação pública e ruas pavimentadas. Tudo pronto para você construir.',
  },
  {
    icon: Waves,
    title: 'Condições Especiais',
    description:
      'Entrada de R$ 1.450 (5%) em 1+1. Parcele em até 150x a partir de R$ 183. Carnê direto com Mano Imóveis.',
  },
]

export default async function MiguelMarquesPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  return (
    <main className="bg-[#F5F0EA]">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-[#0D1410] text-white"
        style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #1E3A2A 0%, transparent 70%)',
          }}
        />
        {/* Gold accent line (bottom) */}
        <div
          className="absolute bottom-0 left-[10%] right-[10%] h-px opacity-30"
          style={{ background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)' }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-24 lg:py-32">
          {/* Back link */}
          <Link
            href={`/${lang}/projetos`}
            className="inline-flex items-center gap-2 text-white/40 text-xs font-medium hover:text-white/70 transition-colors mb-14 uppercase tracking-widest"
          >
            <ArrowLeft size={13} />
            Projetos
          </Link>

          {/* Overline */}
          <p className="text-[#C8A44A] text-[11px] font-bold uppercase tracking-[0.35em] mb-5">
            Empreendimento · Loteamento Residencial
          </p>

          {/* Title */}
          <h1
            className="font-bold leading-[1.08] mb-3"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(3rem, 8vw, 6.5rem)' }}
          >
            Loteamento
          </h1>
          <h1
            className="font-bold leading-[1.08] mb-8"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(3rem, 8vw, 6.5rem)',
              fontStyle: 'italic',
              color: '#D4C4A0',
            }}
          >
            Miguel Marques
          </h1>

          {/* Subtitle */}
          <p className="text-white/50 text-lg sm:text-xl font-light max-w-xl leading-relaxed mb-4">
            Escolha o seu lote. Cada metro quadrado, uma decisão de vida.
          </p>
          <p className="text-white/35 text-base font-light max-w-md leading-relaxed mb-16">
            Lotes com lago natural, infraestrutura completa e condições especiais de pagamento.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-0 max-w-md">
            {[
              { n: '800+', label: 'Lotes' },
              { n: '23', label: 'Quadras' },
              { n: 'Lago', label: 'Natural' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`py-5 ${i < 2 ? 'pr-6 border-r border-white/10' : 'pl-6'} ${i > 0 ? 'pl-6' : ''}`}
              >
                <p
                  className="text-3xl font-bold text-white mb-1"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {stat.n}
                </p>
                <p className="text-white/40 text-xs uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
            <span className="text-[10px] uppercase tracking-[0.3em]">Explorar</span>
            <div className="w-px h-10 bg-white animate-pulse" style={{ animationDuration: '2s' }} />
          </div>
        </div>
      </section>

      {/* ── Interactive Lot Map ──────────────────────────── */}
      <MasterplanSection />

      {/* ── Info cards ───────────────────────────────────── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14 max-w-lg">
            <p className="text-[#C8A44A] text-xs font-bold uppercase tracking-[0.3em] mb-3">
              O Empreendimento
            </p>
            <h2
              className="text-3xl lg:text-4xl font-bold text-[#0D1410] leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Tudo o que você precisa para começar
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {INFO_CARDS.map(card => {
              const Icon = card.icon
              return (
                <div
                  key={card.title}
                  className="p-7 rounded-2xl border border-[#F0EBE3] bg-[#FDFAF7] hover:border-[#E0D8CC] transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F5F0EA] flex items-center justify-center mb-5">
                    <Icon size={18} className="text-[#6B7C56]" />
                  </div>
                  <h3
                    className="font-bold text-lg text-[#0D1410] mb-2"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">{card.description}</p>
                </div>
              )
            })}
          </div>

          {/* Price range strip */}
          <div className="mt-12 p-6 rounded-2xl bg-[#0D1410] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-[#C8A44A] text-xs font-bold uppercase tracking-[0.2em] mb-1">
                Preços
              </p>
              <p className="text-white text-xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                A partir de R$ 18.000
              </p>
              <p className="text-white/40 text-xs mt-1">Lotes a partir de 114 m² · Garanhuns, PE</p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Tenho interesse em um lote no Loteamento Miguel Marques. Gostaria de saber mais sobre preços e condições.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm whitespace-nowrap"
              style={{ background: '#C8A44A', color: '#0D1410' }}
            >
              Consultar disponibilidade
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="bg-[#0D1410] text-white py-20 lg:py-24 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-20"
          style={{ background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)' }}
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[#C8A44A] text-xs font-bold uppercase tracking-[0.3em] mb-4">
            Próximo passo
          </p>
          <h2
            className="text-3xl lg:text-4xl font-bold mb-5 leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Pronto para escolher<br />o seu lote?
          </h2>
          <p className="text-white/50 text-base mb-10 font-light max-w-md mx-auto">
            Nossa equipe está disponível para apresentar as melhores opções de acordo com o seu perfil e orçamento.
          </p>
          <a
            href="https://wa.me/5581997230455?text=Ol%C3%A1!%20Tenho%20interesse%20no%20Loteamento%20Miguel%20Marques.%20Gostaria%20de%20mais%20informa%C3%A7%C3%B5es."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: '#C8A44A', color: '#0D1410' }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Falar com um consultor
          </a>
        </div>
      </section>

    </main>
  )
}
