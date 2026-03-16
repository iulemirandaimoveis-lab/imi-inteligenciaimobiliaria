import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import LandingPageClient from './LandingPageClient'
import type { Metadata } from 'next'

interface Props {
    params: { code: string }
}

async function getDevelopment(code: string) {
    // Try by short_code in tracked_links → development, or by slug directly
    const { data: link } = await supabaseAdmin
        .from('tracked_links')
        .select('development_id, campaign_id')
        .eq('short_code', code)
        .maybeSingle()

    let devId: string | null = link?.development_id || null

    if (!devId) {
        // Fallback: treat code as development slug
        const { data: dev } = await supabaseAdmin
            .from('developments')
            .select('id')
            .eq('slug', code)
            .maybeSingle()
        devId = dev?.id || null
    }

    if (!devId) return null

    const { data } = await supabaseAdmin
        .from('developments')
        .select(`
            id, name, slug, type, description, city, state,
            min_price, max_price, bedrooms_options, status,
            cover_image_url, gallery_images,
            developer:developers(name, logo_url),
            total_units, available_units, area_min, area_max
        `)
        .eq('id', devId)
        .single()

    return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const dev = await getDevelopment(params.code)
    if (!dev) return { title: 'Imóvel — IMI' }
    return {
        title: `${dev.name} — IMI Inteligência Imobiliária`,
        description: dev.description?.slice(0, 155) || `${dev.name} em ${dev.city}, ${dev.state}. Conheça este empreendimento.`,
        openGraph: {
            title: dev.name,
            description: dev.description?.slice(0, 155),
            images: dev.cover_image_url ? [dev.cover_image_url] : [],
        },
    }
}

export default async function LandingPage({ params }: Props) {
    const dev = await getDevelopment(params.code)
    if (!dev) notFound()
    return <LandingPageClient development={dev} code={params.code} />
}
