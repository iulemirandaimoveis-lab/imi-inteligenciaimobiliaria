import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ImoveisClient from './ImoveisClient'
import { mapDbPropertyToDevelopment, mapRentalToDevelopment } from '@/modules/imoveis/utils/propertyMapper'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { PAGE_METADATA } from '@/lib/page-metadata'

// Public anon client — uses RLS policies (anon_read on developments/developers)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
    return PAGE_METADATA.imoveis(params.lang)
}

// Dynamic rendering — always fetch fresh data from Supabase
export const dynamic = 'force-dynamic'
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
        .in('status_commercial', ['published', 'campaign', 'available'])
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
    const [{ data, error }, { data: rentals, error: rentalError }] = await Promise.all([
        query,
        supabaseAdmin
            .from('rental_properties')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false }),
    ])
    if (error) {
        console.error('[ImoveisPage] Query error:', error.message, error.code, error.details)
    }
    if (rentalError) {
        console.error('[ImoveisPage] Rental query error:', rentalError.message)
    }
    const saleDevelopments = (data || []).map(mapDbPropertyToDevelopment)
    const rentalDevelopments = (rentals || []).map(mapRentalToDevelopment)
    const allDevelopments = [...saleDevelopments, ...rentalDevelopments]
    console.log(`[ImoveisPage] Fetched ${saleDevelopments.length} sales + ${rentalDevelopments.length} rentals`)
    return (
        <ImoveisClient
            initialDevelopments={allDevelopments}
            lang={params.lang || 'pt'}
        />
    )
}
