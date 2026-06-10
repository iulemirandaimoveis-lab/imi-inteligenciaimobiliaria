import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Building2, MapPin, Sparkles, Car, BedDouble } from 'lucide-react'
import dynamic from 'next/dynamic'

const JazzBoulevardViewer = dynamic(
  () => import('./components/JazzBoulevardViewer'),
  { ssr: false }
)

export const metadata: Metadata = {
  title: 'Jazz Boulevard Garanhuns | Apartamentos — IMI',
  description:
    'Residencial Jazz Boulevard em Garanhuns (PE). Apartamentos de 2 e 3 dormitórios, cobertura duplex. Explore as plantas, escolha seu andar e garanta sua unidade.',
  openGraph: {
    title: 'Jazz Boulevard — Apartamentos em Garanhuns',
    description: 'Explore o mapa interativo de unidades. Selecione torre, andar e planta.',
  },
}

const WHATSAPP = '5581986141487'

const HIGHLIGHTS = [
  { icon: Building2, label: '2 Torres', sub: '12 andares cada' },
  { icon: BedDouble, label: '2 a 3 dorms', sub: 'até cobertura duplex' },
  { icon: MapPin, label: 'Garanhuns (PE)', sub: 'Centro' },
  { icon: Car, label: 'Vagas inclusas', sub: '1 a 2 por unidade' },
  { icon: Sparkles, label: 'Alto padrão', sub: 'acabamento diferenciado' },
]

export default async function JazzBoulevardPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: _lang } = await params

  return (
    <main className="bg-[#F5F0EA]">
      {/* Hero with video background */}
      <section className="relative overflow-hidden bg-[#0B1928] text-white"
        style={{ minHeight: 'min(60svh, 520px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>

        {/* Video background */}
        <video
          src="/jazz-boulevard/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.45 }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, rgba(11,25,40,0.98) 0%, rgba(11,25,40,0.80) 35%, rgba(11,25,40,0.50) 65%, rgba(11,25,40,0.20) 100%)'
        }} />

        {/* Back link */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
          <Link
            href="/imoveis/jazz-boulevard-garanhuns/lp"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
            style={{ fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
          >
            <ArrowLeft size={14} />
            Investimento
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-8 sm:pb-12 pt-16 sm:pt-20">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-px w-6" style={{ background: '#C8A44A' }} />
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.25em',
              color: '#C8A44A', textTransform: 'uppercase' as const,
              fontFamily: "var(--fu, 'Outfit', sans-serif)",
            }}>
              Lançamento · Garanhuns
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 6vw, 56px)', fontWeight: 800, color: '#fff',
            margin: '0 0 12px', fontFamily: "var(--fu, 'Outfit', sans-serif)",
            lineHeight: 1.08, letterSpacing: '-0.5px',
          }}>
            Jazz Boulevard
          </h1>

          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,0.65)', maxWidth: 480,
            lineHeight: 1.65, margin: '0 0 20px',
            fontFamily: "var(--fu, 'Outfit', sans-serif)",
          }}>
            Residencial de alto padrão com 2 torres, 12 andares, plantas de 74,5 a 148,5 m².
          </p>

          {/* Highlights — horizontal scroll on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
            {HIGHLIGHTS.map(h => (
              <div
                key={h.label}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                <h.icon size={12} style={{ color: '#C8A44A', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>{h.label}</p>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', margin: 0, whiteSpace: 'nowrap' }}>{h.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Viewer */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <JazzBoulevardViewer whatsappPhone={WHATSAPP} />
      </section>

      {/* Video section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ background: '#C8A44A' }} />
          <h2 style={{
            fontSize: 16, fontWeight: 700, color: '#0B1928', margin: 0,
            fontFamily: "var(--fu, 'Outfit', sans-serif)",
          }}>
            Conheça o empreendimento
          </h2>
        </div>
        <VideoPlayer />
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div style={{
          background: '#0B1928', borderRadius: 16,
          padding: 'clamp(20px, 4vw, 32px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap' as const,
        }}>
          <div>
            <p style={{
              fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 800, color: '#fff',
              margin: '0 0 4px', fontFamily: "var(--fu, 'Outfit', sans-serif)",
            }}>
              Pronto para reservar sua unidade?
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Fale com um especialista e garanta as melhores condições.
            </p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Tenho interesse em uma unidade do Jazz Boulevard. Gostaria de mais informações.')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#C8A44A', color: '#0B1928', borderRadius: 10,
              padding: '0 20px', height: 44, fontWeight: 700, fontSize: 11,
              letterSpacing: '0.08em', textTransform: 'uppercase' as const,
              textDecoration: 'none', whiteSpace: 'nowrap' as const,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "var(--fu, 'Outfit', sans-serif)",
            }}
          >
            Falar com Especialista
          </a>
        </div>
      </section>
    </main>
  )
}

function VideoPlayer() {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ borderRadius: 14, background: '#0B1928', border: '1px solid rgba(200,164,74,0.15)' }}
    >
      <video
        src="/jazz-boulevard/hero.mp4"
        controls
        playsInline
        poster="/jazz-boulevard/exterior-dia.jpg"
        className="w-full block"
        style={{ borderRadius: 14, display: 'block', maxHeight: 480, objectFit: 'cover' }}
      >
        <track kind="captions" />
      </video>
      {/* Gold accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)',
        pointerEvents: 'none',
      }} />
    </div>
  )
}
