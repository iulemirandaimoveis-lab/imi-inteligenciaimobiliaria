import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, Sparkles, CreditCard } from 'lucide-react'
import dynamic from 'next/dynamic'
import { isDigitalTwinEnabled } from '@/lib/digital-twin/feature-flag'
import { loadDigitalTwinMedia } from '@/lib/digital-twin/media-adapter'
import { ALTO_BELLEVUE_DT } from '@/data/digital-twin/alto-bellevue'

// Experiência Digital Twin (namespace ISOLADO de homologação). Só renderiza quando
// a feature flag NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN === 'true'. Caso contrário,
// a rota mantém EXATAMENTE o conteúdo legado abaixo (zero efeito colateral).
const DigitalTwinExperience = dynamic(
  () => import('@/components/digital-twin/DigitalTwinExperience'),
  { ssr: false },
)

// Explorador com múltiplas vistas interativas (Plano de lotes + Satélite real).
// Exclusivo de /projetos até aprovação para migrar para /imóveis.
const AltoBellevueMapExplorer = dynamic(
  () => import('../../imoveis/components/AltoBellevueMapExplorer'),
  { ssr: false },
)

export const metadata: Metadata = {
  title: 'Alto Bellevue | IMI — Inteligência Imobiliária',
  description:
    'Loteamento residencial premium em Garanhuns, PE — BR-424, Km 86. 383 lotes de 289 a 693 m², com infraestrutura completa, portaria 24h e condições especiais de financiamento.',
  openGraph: {
    title: 'Alto Bellevue — Loteamento Premium em Garanhuns',
    description:
      'Escolha seu lote. 383 unidades disponíveis, a partir de R$ 202.231. Explore o mapa interativo.',
  },
}

const DEVELOPMENT_ID = 'ab7d1fc1-f069-4e3b-a515-8e1204c11247'
const WHATSAPP = '5581986141487'

const INFO_CARDS = [
  {
    icon: Shield,
    title: 'Segurança & Conforto',
    description:
      'Portaria 24 horas com controle de acesso e câmeras de segurança em todo o perímetro. Viva com tranquilidade e privacidade.',
  },
  {
    icon: Sparkles,
    title: 'Lazer Completo',
    description:
      'Piscina, salão de festas, espaço coworking e gerador próprio. Infraestrutura pensada para a qualidade de vida da sua família.',
  },
  {
    icon: CreditCard,
    title: 'Financiamento Facilitado',
    description:
      'Entrada de 20% e até 120 parcelas a partir de R$ 1.800. Financiamento bancário ou direto com a incorporadora.',
  },
]

export default async function AltoBellevuePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  // Sprint 0 — Isolamento: quando a flag está ativa, a homologação é servida
  // EXCLUSIVAMENTE por componentes do namespace digital-twin.
  // Sprint 1 — FASE 1: mídia carregada no servidor (somente leitura), resiliente a falhas.
  if (isDigitalTwinEnabled()) {
    const media = await loadDigitalTwinMedia(ALTO_BELLEVUE_DT.developmentId).catch(() => undefined)
    return <DigitalTwinExperience lang={lang} media={media} />
  }

  return (
    <main className="bg-[#F5F0EA]">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-[#0B1928] text-white"
        style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Radial glow — navy-gold */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #1A3A5C 0%, transparent 70%)',
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
            Empreendimento · Loteamento Residencial Premium
          </p>

          {/* Title */}
          <h1
            className="font-bold leading-[1.08] mb-3"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(3rem, 8vw, 6.5rem)' }}
          >
            Alto
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
            Bellevue
          </h1>

          {/* Subtitle */}
          <p className="text-white/50 text-lg sm:text-xl font-light max-w-xl leading-relaxed mb-4">
            Loteamento residencial premium em Garanhuns, PE.
          </p>
          <p className="text-white/35 text-base font-light max-w-md leading-relaxed mb-16">
            Lotes de 289 a 693 m² com infraestrutura completa, segurança 24h e qualidade de vida.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-0 max-w-md">
            {[
              { n: '383', label: 'Lotes' },
              { n: '289–693', label: 'm² por Lote' },
              { n: '16', label: 'Quadras' },
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
      <section className="bg-[#F5F0EA] py-10 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <p className="text-[#C8A44A] text-xs font-bold uppercase tracking-[0.3em] mb-3">
            Mapa do Loteamento
          </p>
          <h2
            className="text-2xl lg:text-3xl font-bold text-[#0B1928] leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Escolha o seu lote
          </h2>
        </div>
        {/* map flush with screen edges on mobile, max-width on desktop */}
        <div className="max-w-6xl mx-auto">
          <AltoBellevueMapExplorer
            developmentId={DEVELOPMENT_ID}
            developmentName="Alto Bellevue"
            whatsappPhone={WHATSAPP}
          />
        </div>
      </section>

      {/* ── Info cards ───────────────────────────────────── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14 max-w-lg">
            <p className="text-[#C8A44A] text-xs font-bold uppercase tracking-[0.3em] mb-3">
              O Empreendimento
            </p>
            <h2
              className="text-3xl lg:text-4xl font-bold text-[#0B1928] leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Viva com classe e segurança
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
                  <div className="w-10 h-10 rounded-xl bg-[#F0EBE3] flex items-center justify-center mb-5">
                    <Icon size={18} className="text-[#334E68]" />
                  </div>
                  <h3
                    className="font-bold text-lg text-[#0B1928] mb-2"
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
          <div className="mt-12 p-6 rounded-2xl bg-[#0B1928] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-[#C8A44A] text-xs font-bold uppercase tracking-[0.2em] mb-1">
                Preços
              </p>
              <p className="text-white text-xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                R$ 202.231 — R$ 476.570
              </p>
              <p className="text-white/40 text-xs mt-1">Lotes de 289 m² a 693 m² · BR-424, Km 86 · Garanhuns, PE</p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Tenho interesse em um lote no Alto Bellevue. Gostaria de saber mais sobre preços e condições.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm whitespace-nowrap"
              style={{ background: '#C8A44A', color: '#0B1928' }}
            >
              Consultar disponibilidade
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="bg-[#0B1928] text-white py-20 lg:py-24 relative overflow-hidden">
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
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Tenho interesse em um lote no Alto Bellevue em Garanhuns. Gostaria de mais informações.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: '#C8A44A', color: '#0B1928' }}
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
