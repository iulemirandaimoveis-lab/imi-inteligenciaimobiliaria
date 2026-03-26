import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ImoveisClient from './ImoveisClient'
import { mapDbPropertyToDevelopment } from '@/modules/imoveis/utils/propertyMapper'
import { PAGE_METADATA } from '@/lib/page-metadata'

// Public anon client — uses RLS policies (anon_read on developments/developers)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
    return PAGE_METADATA.imoveis(params.lang)
}

// ISR: revalidate every 60s for near-real-time updates while enabling CDN caching
export const revalidate = 60
export default async function ImoveisPage({
    params,
    searchParams,
}: {
    params: { lang: string }
    searchParams: { construtora?: string }
}) {
    let query = supabase
        .from('developments')
        .select('*')
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
        console.error('[ImoveisPage] Query error:', error.message)
    }
    const developments = (data || []).map(mapDbPropertyToDevelopment)
    return (
        <ImoveisClient
            initialDevelopments={developments}
            lang={params.lang || 'pt'}
        />
    )
}
