
import { createClient } from '@/lib/supabase/server'
import ImoveisClient from './ImoveisClient'
import { mapDbPropertyToDevelopment } from '@/components/backoffice/imoveis/utils/propertyMapper'

// Forcing dynamic for real-time updates from Backoffice
export const dynamic = 'force-dynamic'

export default async function ImoveisPage({ params }: { params: { lang: string } }) {
    const supabase = await createClient()

    // Fetch developments with developer info
    const { data, error } = await supabase
        .from('developments')
        .select(`
            *,
            developers (
                name,
                logo_url
            )
        `)
        .eq('status_commercial', 'published') // Somente os publicados
        .order('is_highlighted', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Falha na integração com Supabase:', error.message)
    }

    const developments = (data || []).map(mapDbPropertyToDevelopment) as any

    return (
        <ImoveisClient
            initialDevelopments={developments}
            lang={params.lang || 'pt'}
        />
    )
}
