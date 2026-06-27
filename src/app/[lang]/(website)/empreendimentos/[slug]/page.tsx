import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import dynamic from 'next/dynamic'

const JazzBoulevardViewer = dynamic(
  () => import('../../imoveis/jazz-boulevard-garanhuns/components/JazzBoulevardViewer'),
  { ssr: false }
)
const SubdivisionLotMap = dynamic(
  () => import('../../imoveis/components/SubdivisionLotMap'),
  { ssr: false }
)
// Alto Bellevue: explorador com múltiplas vistas (Plano · Satélite+Lotes · Satélite).
const AltoBellevueMapExplorer = dynamic(
  () => import('../../imoveis/components/AltoBellevueMapExplorer'),
  { ssr: false }
)
const GenericBuildingViewer = dynamic(
  () => import('./components/GenericBuildingViewer'),
  { ssr: false }
)

interface PageProps {
  params: Promise<{ lang: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('developments')
    .select('name, description')
    .eq('slug', slug)
    .single()

  return {
    title: data ? `${data.name} | IMI` : 'Empreendimento | IMI',
    description: data?.description ?? undefined,
  }
}

export default async function EmpreendimentoPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: dev } = await supabase
    .from('developments')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!dev) notFound()

  const isSubdivision = dev.type === 'loteamento'
  const isBuilding = dev.type === 'lançamento' || dev.type === 'residencial'
  const isJazz = slug === 'jazz-boulevard'

  return (
    <main className="bg-[#F5F0EA] min-h-screen">
      {/* Hero */}
      <section
        className="relative bg-[#0B1928] text-white"
        style={{ minHeight: '45svh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '80px 24px 48px' }}
      >
        <div className="absolute top-6 left-6">
          <Link
            href="/empreendimentos"
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium"
            style={{ textDecoration: 'none' }}
          >
            <ArrowLeft size={15} />
            Empreendimentos
          </Link>
        </div>

        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: '#C8A44A', color: '#0B1928', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
            >
              {dev.type}
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
            {dev.name}
          </h1>
          <div className="flex items-center gap-1 mb-4">
            <MapPin size={13} style={{ color: '#C8A44A' }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              {dev.city}, {dev.state}
            </span>
          </div>
          {dev.description && (
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', maxWidth: 540, lineHeight: 1.6, margin: 0 }}>
              {dev.description}
            </p>
          )}
        </div>
      </section>

      {/* Interactive Viewer */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        {isJazz && (
          <JazzBoulevardViewer whatsappPhone={dev.whatsapp_phone ?? '5581986141487'} />
        )}
        {isSubdivision && (
          slug === 'alto-bellevue' ? (
            <AltoBellevueMapExplorer
              developmentId={dev.id}
              developmentName={dev.name}
              whatsappPhone={dev.whatsapp_phone ?? '5581986141487'}
            />
          ) : (
            <SubdivisionLotMap
              developmentId={dev.id}
              developmentName={dev.name}
              whatsappPhone={dev.whatsapp_phone ?? '5581986141487'}
            />
          )
        )}
        {isBuilding && !isJazz && (
          <GenericBuildingViewer
            developmentId={dev.id}
            developmentName={dev.name}
            whatsappPhone={dev.whatsapp_phone ?? '5581986141487'}
          />
        )}
      </section>
    </main>
  )
}
