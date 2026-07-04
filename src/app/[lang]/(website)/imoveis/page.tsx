import type { Metadata } from 'next'
import ImoveisClient from './ImoveisClient'
import { mapDbPropertyToDevelopment, mapRentalToDevelopment } from '@/modules/imoveis/utils/propertyMapper'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { PAGE_METADATA } from '@/lib/page-metadata'

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
    return PAGE_METADATA.imoveis(params.lang)
}

// Always server-render — ensures stock is never stale-cached at build time
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const FULL_SELECT = 'id,slug,name,developer,status,status_commercial,type,tags,description,neighborhood,city,state,country,region,address,lat,lng,price_from,price_to,price_min,price_max,area_from,area_to,bedrooms,bathrooms,parking_spaces,delivery_date,registration_number,is_highlighted,display_order,created_at,updated_at,images,gallery_images,image,videos,floor_plans,features,selling_points,video_url,video_short_url,virtual_tour_url,cover_video_url,brochure_url,developer_logo,scrollytelling_enabled,concept_description,towers,floor_plan_types,developers(name,logo_url)'
// Fallback: só colunas históricas da tabela — se o FULL_SELECT falhar (ex.: coluna nova
// ainda não migrada em produção, como cover_video_url em 2026-07-04), o catálogo público
// não pode cair no estado vazio "Portfólio em Curadoria".
const CORE_SELECT = 'id,slug,name,developer,status,status_commercial,type,tags,description,neighborhood,city,state,country,region,address,lat,lng,price_from,price_to,price_min,price_max,area_from,area_to,bedrooms,bathrooms,parking_spaces,delivery_date,is_highlighted,display_order,created_at,updated_at,images,gallery_images,image,features,video_url,virtual_tour_url,developer_logo'

function buildDevelopmentsQuery(select: string, developerId?: string) {
    let query = supabaseAdmin
        .from('developments')
        .select(select)
        .in('status_commercial', ['published', 'campaign', 'available'])
        .order('is_highlighted', { ascending: false })
        .order('created_at', { ascending: false })
    if (developerId) {
        query = query.eq('developer_id', developerId)
    }
    return query
}

export default async function ImoveisPage({
    params,
    searchParams,
}: {
    params: { lang: string }
    searchParams: { construtora?: string }
}) {
    let developerId: string | undefined
    if (searchParams.construtora) {
        const { data: dev } = await supabaseAdmin
            .from('developers')
            .select('id')
            .eq('slug', searchParams.construtora)
            .single()
        developerId = dev?.id
    }
    const [saleResult, { data: rentals, error: rentalError }] = await Promise.all([
        buildDevelopmentsQuery(FULL_SELECT, developerId),
        supabaseAdmin
            .from('rental_properties')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false }),
    ])
    let { data, error } = saleResult as { data: Record<string, any>[] | null; error: any }
    if (error) {
        console.error('[ImoveisPage] Query error:', error.message, error.code, error.details)
        const retry = await buildDevelopmentsQuery(CORE_SELECT, developerId)
        data = retry.data as Record<string, any>[] | null
        if (retry.error) {
            console.error('[ImoveisPage] Fallback query error:', retry.error.message, retry.error.code)
        }
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
