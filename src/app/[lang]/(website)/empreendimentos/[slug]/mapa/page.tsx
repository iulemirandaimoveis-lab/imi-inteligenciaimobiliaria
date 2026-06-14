import { createClient } from '@/lib/supabase/server'
import { getDevelopmentBySlug } from '@/lib/lotmap/engine'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import LotMapPageClient from './LotMapPageClient'

interface Props {
  params: Promise<{ lang: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const config = getDevelopmentBySlug(slug)
  const name = config?.name ?? slug
  return {
    title: `${name} — Mapa Interativo`,
    description: `Explore os lotes disponíveis do ${name}. Mapa interativo com filtros por quadra e status.`,
  }
}

export default async function EmpreendimentoMapaPage({ params }: Props) {
  const { lang, slug } = await params

  // Resolve development config + DB record
  const engineConfig = getDevelopmentBySlug(slug)

  const supabase = await createClient()

  // Get development from DB (for developments not yet in engine registry)
  const { data: dev } = await supabase
    .from('developments')
    .select('id, title, slug, virtual_tour_url')
    .eq('slug', slug)
    .single()

  // Also try by matching known slugs for Miguel Marques / Alto Bellevue
  const altSlugMap: Record<string, string> = {
    'alto-bellevue':  'alto-bellevue',
    'miguel-marques': 'miguel-marques',
  }
  const mappedSlug = altSlugMap[slug] ?? slug

  const resolvedId   = engineConfig?.id   ?? dev?.id
  const resolvedName = engineConfig?.name ?? dev?.title ?? slug
  const mapJsonUrl   = engineConfig?.mapJsonUrl ?? null
  const whatsapp     = engineConfig?.whatsappContact

  // If no engine config and no map JSON, fall back to project page
  if (!mapJsonUrl && !resolvedId) {
    redirect(`/${lang}/empreendimentos/${slug}`)
  }

  // Check if user is manager for CRM features
  const { data: { user } } = await supabase.auth.getUser()
  let isManager = false
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    isManager = ['admin', 'manager'].includes(profile?.role ?? '')
  }

  return (
    <LotMapPageClient
      lang={lang}
      slug={slug}
      developmentId={resolvedId ?? ''}
      developmentName={resolvedName}
      mapJsonUrl={mapJsonUrl ?? `/maps/${slug}-lots.json`}
      whatsappContact={whatsapp}
      isManagerSSR={isManager}
    />
  )
}
