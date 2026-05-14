import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ImoveisClient from './ImoveisClient'
import { mapDbPropertyToDevelopment, mapRentalToDevelopment } from '@/modules/imoveis/utils/propertyMapper'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { PAGE_METADATA } from '@/lib/page-metadata'

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
    return PAGE_METADATA.imoveis(params.lang)
}

// Always server-render — ensures stock is never stale-cached at build time
export const dynamic = 'force-dynamic'
export default async function ImoveisPage({
    params,
    searchParams,
}: {
    params: { lang: string }
    searchParams: { construtora?: string }
}) {
    // Instantiate inside the function so module import at build time doesn't throw
    // when NEXT_PUBLIC_SUPABASE_URL is not available in the CI build environment
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    let query = supabase
        .from('developments')
        .select('id,slug,name,developer,status,status_commercial,type,tags,description,neighborhood,city,state,country,region,address,lat,lng,price_from,price_to,price_min,price_max,area_from,area_to,bedrooms,bathrooms,parking_spaces,delivery_date,registration_number,is_highlighted,display_order,created_at,updated_at,images,gallery_images,image,videos,floor_plans,features,selling_points,video_url,video_short_url,virtual_tour_url,brochure_url,developer_logo,developers(name,logo_url)')

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
        .filter((dev) => Boolean(dev.images?.main || (dev.images?.gallery?.length ?? 0) > 0))
    console.log(`[ImoveisPage] Fetched ${saleDevelopments.length} sales + ${rentalDevelopments.length} rentals`)
    return (
        <ImoveisClient
            initialDevelopments={allDevelopments}
            lang={params.lang || 'pt'}
        />
    )
}
