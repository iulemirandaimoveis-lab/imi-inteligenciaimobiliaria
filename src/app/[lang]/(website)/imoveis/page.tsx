
import { createClient } from '@/lib/supabase/server'
import ImoveisClient from './ImoveisClient'
import { mapDbPropertyToDevelopment } from '@/modules/imoveis/utils/propertyMapper'

// Forcing dynamic for real-time updates from Backoffice
export const dynamic = 'force-dynamic'

export default async function ImoveisPage({
    params,
    searchParams,
}: {
    params: { lang: string }
    searchParams: { construtora?: string }
}) {
    const supabase = await createClient()

    let query = supabase
        .from('developments')
        .select(`*, developers(id, name, slug, logo_url)`)
        .eq('status_commercial', 'published')
        .order('is_highlighted', { ascending: false })
        .order('created_at', { ascending: false })

    // Filter by construtora slug if provided
    if (searchParams.construtora) {
        const { data: dev } = await supabase
            .from('developers')
            .select('id')
            .eq('slug', searchParams.construtora)
            .single()
        if (dev?.id) {
            query = query.eq('developer_id', dev.id)
        }
    }

    const { data, error } = await query

    if (error) {
        console.error('Falha na integração com Supabase:', error.message)
    }

    const developments = (data || []).map(mapDbPropertyToDevelopment)

    return (
        <ImoveisClient
            initialDevelopments={developments}
            lang={params.lang || 'pt'}
        />
    )
}
