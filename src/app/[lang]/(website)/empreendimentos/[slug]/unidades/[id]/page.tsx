import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BedDouble, Bath, Car, Maximize2, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AVAILABILITY_COLORS } from '@/lib/imi-domain/types'

interface Props {
  params: Promise<{ lang: string; slug: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('imi_properties')
    .select('title, code')
    .eq('id', id)
    .single()
  return {
    title: data ? `${data.title ?? data.code} | ${slug} | IMI` : 'Unidade | IMI',
  }
}

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export default async function UnidadePage({ params }: Props) {
  const { lang, slug, id } = await params
  const supabase = await createClient()

  const { data: unit } = await supabase
    .from('imi_properties')
    .select('*')
    .eq('id', id)
    .single()

  if (!unit) notFound()

  const { data: dev } = await supabase
    .from('developments')
    .select('name, slug')
    .eq('id', unit.development_id)
    .single()

  const cfg = AVAILABILITY_COLORS[unit.status as keyof typeof AVAILABILITY_COLORS] ?? AVAILABILITY_COLORS.available
  const isAvailable = unit.status === 'available' || unit.status === 'launching'
  const WHATSAPP = '5581997230455'
  const waMsg = encodeURIComponent(
    `Olá! Tenho interesse na unidade ${unit.code} do ${dev?.name ?? slug}. Gostaria de mais informações.`
  )

  return (
    <main className="bg-[#F5F0EA] min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back */}
        <Link
          href={`/${lang}/empreendimentos/${slug}`}
          className="inline-flex items-center gap-2 text-sm font-medium mb-8"
          style={{ color: '#948F84', textDecoration: 'none' }}
        >
          <ArrowLeft size={14} />
          {dev?.name ?? slug}
        </Link>

        {/* Status bar */}
        <div style={{ height: 4, borderRadius: 2, background: cfg.bg, marginBottom: 24 }} />

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full inline-block mb-3"
              style={{ background: cfg.light, color: cfg.dark }}
            >
              {cfg.label}
            </span>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0B1928', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
              {unit.title ?? unit.code}
            </h1>
            {unit.tower && (
              <p style={{ fontSize: 14, color: '#948F84', margin: '4px 0 0', fontWeight: 600 }}>
                Torre {unit.tower} · {unit.floor}º andar · Unidade {unit.unit_number}
              </p>
            )}
          </div>
          {unit.price_visible && unit.price && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: '#948F84', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Valor</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: 0 }}>
                {fmtBRL(unit.price)}
              </p>
            </div>
          )}
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Maximize2, label: 'Área Privativa', value: unit.private_area_m2 ? `${unit.private_area_m2} m²` : '—' },
            { icon: BedDouble, label: 'Dormitórios', value: unit.bedrooms ? `${unit.bedrooms} (${unit.suites} suíte${unit.suites > 1 ? 's' : ''})` : '—' },
            { icon: Bath, label: 'Banheiros', value: unit.bathrooms ? String(unit.bathrooms) : '—' },
            { icon: Car, label: 'Vagas', value: unit.parking_spaces ? String(unit.parking_spaces) : '—' },
          ].map(item => (
            <div key={item.label} style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1px solid rgba(184,179,168,0.3)' }}>
              <div className="flex items-center gap-2 mb-2">
                <item.icon size={13} style={{ color: '#C8A44A' }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{item.label}</span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: 0 }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        {isAvailable && (
          <a
            href={`https://wa.me/${WHATSAPP}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl text-sm font-bold uppercase tracking-wider"
            style={{ background: '#0B1928', color: '#fff', textDecoration: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
          >
            <MessageCircle size={16} />
            Tenho Interesse nesta Unidade
          </a>
        )}
      </div>
    </main>
  )
}
