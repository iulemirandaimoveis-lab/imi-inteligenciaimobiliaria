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

const WHATSAPP = '5581997230455'

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
      {/* Hero */}
      <section
        className="relative overflow-hidden bg-[#0B1928] text-white"
        style={{ minHeight: '60svh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 0 64px' }}
      >
        {/* Back */}
        <div className="absolute top-6 left-6 z-10">
          <Link
            href="/imoveis/jazz-boulevard-garanhuns/lp"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium"
            style={{ textDecoration: 'none' }}
          >
            <ArrowLeft size={15} />
            Investimento
          </Link>
        </div>

        <div className="max-w-5xl mx-auto px-6 w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 max-w-8" style={{ background: '#C8A44A' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: '#C8A44A', textTransform: 'uppercase', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
              Lançamento · Garanhuns
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: 800, color: '#fff', margin: '0 0 16px', fontFamily: "var(--fu, 'Outfit', sans-serif)", lineHeight: 1.1 }}>
            Jazz Boulevard
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', maxWidth: 520, lineHeight: 1.6, margin: 0 }}>
            Residencial de alto padrão com 2 torres, 12 andares, plantas de 74,5 a 148,5 m². Selecione a torre, o andar e veja as unidades disponíveis em tempo real.
          </p>

          {/* Highlights */}
          <div className="flex flex-wrap gap-3 mt-8">
            {HIGHLIGHTS.map(h => (
              <div
                key={h.label}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <h.icon size={13} style={{ color: '#C8A44A' }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0 }}>{h.label}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{h.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Viewer */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <JazzBoulevardViewer whatsappPhone={WHATSAPP} />
      </section>

      {/* CTA */}
      <section
        className="max-w-5xl mx-auto px-6 pb-16"
      >
        <div style={{ background: '#0B1928', borderRadius: 20, padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 4px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
              Pronto para reservar sua unidade?
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Fale com um especialista e garanta as melhores condições de pagamento.
            </p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Tenho interesse em uma unidade do Jazz Boulevard. Gostaria de mais informações.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 h-12 px-8 rounded-xl font-bold text-sm uppercase tracking-wider"
            style={{ background: '#C8A44A', color: '#0B1928', textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
          >
            Falar com Especialista
          </a>
        </div>
      </section>
    </main>
  )
}
