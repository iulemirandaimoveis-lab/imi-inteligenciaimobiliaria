import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const PropertyPostSchema = z.object({
    name: z.string().min(1).max(300),
    address: z.string().optional(),
    property_type: z.string().optional(),
    listing_mode: z.string().optional(),
    daily_rate: z.number().positive().optional(),
    monthly_rate: z.number().positive().optional(),
    cleaning_fee: z.number().min(0).optional(),
    max_guests: z.number().int().positive().optional(),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().int().min(0).optional(),
    airbnb_listing_id: z.string().optional(),
    booking_listing_id: z.string().optional(),
    direct_booking_enabled: z.boolean().optional(),
    ical_url: z.string().url().optional(),
    status: z.string().optional(),
    owner_id: z.string().optional(),
    owner_name: z.string().optional(),
    management_fee_pct: z.number().min(0).max(100).optional(),
    photos: z.array(z.string()).optional(),
    floor_plans: z.array(z.string()).optional(),
    brochure_url: z.string().optional(),
    video_url: z.string().optional(),
    video_short_url: z.string().optional(),
    amenities: z.array(z.string()).optional(),
    rules: z.string().optional(),
    check_in_time: z.string().optional(),
    check_out_time: z.string().optional(),
    development_id: z.string().optional(),
})

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
        const parsed = PropertyPostSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
        }
        const b = parsed.data

        const record = {
            name: b.name,
            address: b.address || null,
            property_type: b.property_type || 'apartment',
            listing_mode: b.listing_mode || 'short_stay',
            daily_rate: b.daily_rate ?? null,
            monthly_rate: b.monthly_rate ?? null,
            cleaning_fee: b.cleaning_fee ?? 0,
            max_guests: b.max_guests ?? 4,
            bedrooms: b.bedrooms ?? 1,
            bathrooms: b.bathrooms ?? 1,
            airbnb_listing_id: b.airbnb_listing_id || null,
            booking_listing_id: b.booking_listing_id || null,
            direct_booking_enabled: b.direct_booking_enabled ?? true,
            ical_url: b.ical_url || null,
            status: b.status || 'active',
            owner_id: b.owner_id || null,
            owner_name: b.owner_name || null,
            management_fee_pct: b.management_fee_pct ?? 20,
            photos: b.photos || [],
            floor_plans: b.floor_plans || [],
            brochure_url: b.brochure_url || null,
            video_url: b.video_url || null,
            video_short_url: b.video_short_url || null,
            amenities: b.amenities || [],
            rules: b.rules || null,
            check_in_time: b.check_in_time || '15:00',
            check_out_time: b.check_out_time || '11:00',
            development_id: b.development_id || null,
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

export async function PUT(req: Request) {
    try {
        const { supabase, user } = await getAuthenticatedSupabase()
        if (!supabase || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await req.json()
        const { id, ...rest } = body
        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
        }

        const parsed = PropertyPostSchema.partial().safeParse(rest)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
        }

        const updates: Record<string, unknown> = {}
        const b = parsed.data
        if (b.name !== undefined) updates.name = b.name
        if (b.address !== undefined) updates.address = b.address || null
        if (b.property_type !== undefined) updates.property_type = b.property_type
        if (b.listing_mode !== undefined) updates.listing_mode = b.listing_mode
        if (b.daily_rate !== undefined) updates.daily_rate = b.daily_rate
        if (b.monthly_rate !== undefined) updates.monthly_rate = b.monthly_rate
        if (b.cleaning_fee !== undefined) updates.cleaning_fee = b.cleaning_fee
        if (b.max_guests !== undefined) updates.max_guests = b.max_guests
        if (b.bedrooms !== undefined) updates.bedrooms = b.bedrooms
        if (b.bathrooms !== undefined) updates.bathrooms = b.bathrooms
        if (b.airbnb_listing_id !== undefined) updates.airbnb_listing_id = b.airbnb_listing_id || null
        if (b.booking_listing_id !== undefined) updates.booking_listing_id = b.booking_listing_id || null
        if (b.direct_booking_enabled !== undefined) updates.direct_booking_enabled = b.direct_booking_enabled
        if (b.ical_url !== undefined) updates.ical_url = b.ical_url || null
        if (b.status !== undefined) updates.status = b.status
        if (b.owner_id !== undefined) updates.owner_id = b.owner_id || null
        if (b.owner_name !== undefined) updates.owner_name = b.owner_name || null
        if (b.management_fee_pct !== undefined) updates.management_fee_pct = b.management_fee_pct
        if (b.photos !== undefined) updates.photos = b.photos
        if (b.floor_plans !== undefined) updates.floor_plans = b.floor_plans
        if (b.brochure_url !== undefined) updates.brochure_url = b.brochure_url || null
        if (b.video_url !== undefined) updates.video_url = b.video_url || null
        if (b.video_short_url !== undefined) updates.video_short_url = b.video_short_url || null
        if (b.amenities !== undefined) updates.amenities = b.amenities
        if (b.rules !== undefined) updates.rules = b.rules || null
        if (b.check_in_time !== undefined) updates.check_in_time = b.check_in_time
        if (b.check_out_time !== undefined) updates.check_out_time = b.check_out_time
        if (b.development_id !== undefined) updates.development_id = b.development_id || null
        updates.updated_at = new Date().toISOString()

        const { data, error } = await supabase
            .from('rental_properties')
            .update(updates)
            .eq('id', id)
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

export async function DELETE(req: NextRequest) {
    try {
        const { supabase, user } = await getAuthenticatedSupabase()
        if (!supabase || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
        }

        // Soft-delete: set status to inactive
        const { error } = await supabase
            .from('rental_properties')
            .update({ status: 'inactive', updated_at: new Date().toISOString() })
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 },
        )
    }
}
