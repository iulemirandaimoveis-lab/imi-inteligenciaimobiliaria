import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { mapDbPropertyToDevelopment } from '@/modules/imoveis/utils/propertyMapper'
import MapaClient from './MapaClient'

function getPublicSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) return null

    return createClient(supabaseUrl, supabaseAnonKey)
}

export const metadata: Metadata = {
    title: 'Mapa Interativo | Inteligência IMI',
    description: 'Mapa interativo com todos os empreendimentos IMI. Visualize localização, preços e detalhes dos imóveis disponíveis.',
    openGraph: {
        title: 'Mapa Interativo | Inteligência IMI',
        description: 'Mapa interativo com todos os empreendimentos IMI.',
        type: 'website',
    },
}

export const dynamic = 'force-dynamic'

export default async function MapaPage() {
    const supabase = getPublicSupabase()
    if (!supabase) {
        console.warn('[MapaPage] Missing Supabase public envs, returning empty dataset')
        return <MapaClient developments={[]} />
    }

    const { data, error } = await supabase
        .from('developments')
        .select('*')
        .eq('status_commercial', 'published')
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .order('is_highlighted', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[MapaPage] Query error:', error.message)
    }

    const developments = (data || []).map(mapDbPropertyToDevelopment)

    return <MapaClient developments={developments} />
}
