import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Building2, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Empreendimentos | IMI — Inteligência Imobiliária',
  description: 'Explore loteamentos e lançamentos imobiliários com mapa interativo de disponibilidade em tempo real.',
}

const TYPE_LABELS: Record<string, string> = {
  loteamento: 'Loteamento',
  lançamento: 'Lançamento',
  residencial: 'Residencial',
  comercial: 'Comercial',
}

export default async function EmpreendimentosPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: _lang } = await params
  const supabase = await createClient()

  const { data: developments } = await supabase
    .from('developments')
    .select('id, name, slug, type, city, state, description, images, price_min, price_max, area_from, status_commercial')
    .eq('status_commercial', 'published')
    .order('created_at', { ascending: false })

  const devs = developments ?? []

  return (
    <main className="bg-[#F5F0EA] min-h-screen">
      {/* Hero */}
      <section className="bg-[#0B1928] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8" style={{ background: '#C8A44A' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: '#C8A44A', textTransform: 'uppercase', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
              Portfólio
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: '#fff', margin: '0 0 16px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
            Empreendimentos
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', maxWidth: 480, lineHeight: 1.6, margin: 0 }}>
            Loteamentos e lançamentos com mapa interativo de disponibilidade em tempo real.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        {devs.length === 0 ? (
          <div className="text-center py-20">
            <Building2 size={48} className="mx-auto mb-4 opacity-20" />
            <p style={{ fontSize: 14, color: '#948F84', fontWeight: 600 }}>
              Nenhum empreendimento publicado no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {devs.map(dev => (
              <DevelopmentCard key={dev.id} dev={dev} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

type Dev = {
  id: string
  name: string
  slug: string
  type: string
  city: string
  state: string
  description: string | null
  images: string[] | null
  price_min: number | null
  price_max: number | null
  area_from: number | null
  status_commercial: string
}

function DevelopmentCard({ dev }: { dev: Dev }) {
  const typeLabel = TYPE_LABELS[dev.type] ?? dev.type
  const cover = dev.images?.[0] ?? null

  const href = dev.type === 'loteamento'
    ? `/projetos/${dev.slug}`
    : `/empreendimentos/${dev.slug}`

  return (
    <Link
      href={href}
      style={{ textDecoration: 'none' }}
      className="group block bg-white rounded-2xl overflow-hidden border border-[rgba(184,179,168,0.3)] hover:border-[#C8A44A] transition-all hover:shadow-lg"
    >
      {/* Cover */}
      <div
        className="relative"
        style={{ height: 180, background: cover ? '#E5E0D8' : '#0B1928', overflow: 'hidden' }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={dev.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Building2 size={48} style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ background: '#C8A44A', color: '#0B1928', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
          >
            {typeLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0B1928', margin: '0 0 4px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
          {dev.name}
        </h3>
        <div className="flex items-center gap-1 mb-3">
          <MapPin size={11} style={{ color: '#948F84' }} />
          <span style={{ fontSize: 12, color: '#948F84', fontWeight: 600 }}>
            {dev.city}, {dev.state}
          </span>
        </div>
        {dev.description && (
          <p style={{ fontSize: 12, color: '#948F84', lineHeight: 1.5, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
            {dev.description}
          </p>
        )}
        {dev.price_min && (
          <p style={{ fontSize: 13, fontWeight: 700, color: '#0B1928', margin: '0 0 12px', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
            A partir de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(dev.price_min)}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 11, fontWeight: 700, color: '#C8A44A', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
            Ver empreendimento
          </span>
          <ArrowRight size={14} style={{ color: '#C8A44A' }} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  )
}
