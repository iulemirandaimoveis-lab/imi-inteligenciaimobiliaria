import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import AlugueisClient from './AlugueisClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
    const lang = params.lang || 'pt'
    const titles: Record<string, string> = {
        pt: 'Aluguéis - Imóveis para Temporada e Locação | IMI',
        en: 'Rentals - Vacation & Long-term Properties | IMI',
        es: 'Alquileres - Propiedades de Temporada | IMI',
    }
    const descriptions: Record<string, string> = {
        pt: 'Encontre imóveis para alugar em Balneário Camboriú, Itapema e região. Temporada, mensal e anual.',
        en: 'Find rental properties in Balneário Camboriú, Itapema and region. Short-stay, monthly and yearly.',
        es: 'Encuentre propiedades en alquiler en Balneário Camboriú, Itapema y región.',
    }
    return {
        title: titles[lang] || titles.pt,
        description: descriptions[lang] || descriptions.pt,
        openGraph: {
            title: titles[lang] || titles.pt,
            description: descriptions[lang] || descriptions.pt,
            type: 'website',
        },
    }
}

export default async function AlugueisPage({ params }: { params: { lang: string } }) {
    const { data, error } = await supabaseAdmin
        .from('rental_properties')
        .select('id, name, address, property_type, listing_mode, daily_rate, monthly_rate, bedrooms, bathrooms, max_guests, photos, amenities, status, cleaning_fee, check_in_time, check_out_time, rules, development_id')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[AlugueisPage] Query error:', error.message)
    }

    return <AlugueisClient properties={data || []} lang={params.lang || 'pt'} />
}
