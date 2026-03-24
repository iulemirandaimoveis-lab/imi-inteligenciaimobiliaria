import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

async function getAuthenticatedSupabase() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { supabase: null, user: null }
    return { supabase, user }
}

export async function GET(request: NextRequest) {
    try {
        const { supabase, user } = await getAuthenticatedSupabase()
        if (!supabase || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const status = searchParams.get('status')

        if (id) {
            const { data, error } = await supabase
                .from('rental_properties')
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
            return NextResponse.json(data)
        }

        let query = supabase
            .from('rental_properties')
            .select('*')
            .order('created_at', { ascending: false })

        if (status) {
            query = query.eq('status', status)
        }

        const { data, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data ?? [], {
            headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
        })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 },
        )
    }
}

export async function POST(req: Request) {
    try {
        const { supabase, user } = await getAuthenticatedSupabase()
        if (!supabase || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await req.json()

        if (!body.name) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
        }

        const record = {
            name: body.name,
            address: body.address || null,
            property_type: body.property_type || 'apartment',
            listing_mode: body.listing_mode || 'short_stay',
            daily_rate: body.daily_rate ? Number(body.daily_rate) : null,
            monthly_rate: body.monthly_rate ? Number(body.monthly_rate) : null,
            cleaning_fee: body.cleaning_fee ? Number(body.cleaning_fee) : 0,
            max_guests: body.max_guests ? Number(body.max_guests) : 4,
            bedrooms: body.bedrooms ? Number(body.bedrooms) : 1,
            bathrooms: body.bathrooms ? Number(body.bathrooms) : 1,
            airbnb_listing_id: body.airbnb_listing_id || null,
            booking_listing_id: body.booking_listing_id || null,
            direct_booking_enabled: body.direct_booking_enabled ?? true,
            ical_url: body.ical_url || null,
            status: body.status || 'active',
            owner_id: body.owner_id || null,
            owner_name: body.owner_name || null,
            management_fee_pct: body.management_fee_pct ? Number(body.management_fee_pct) : 20,
            photos: body.photos || [],
            amenities: body.amenities || [],
            rules: body.rules || null,
            check_in_time: body.check_in_time || '15:00',
            check_out_time: body.check_out_time || '11:00',
            development_id: body.development_id || null,
            created_by: user.id,
        }

        const { data, error } = await supabase
            .from('rental_properties')
            .insert(record)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 },
        )
    }
}
