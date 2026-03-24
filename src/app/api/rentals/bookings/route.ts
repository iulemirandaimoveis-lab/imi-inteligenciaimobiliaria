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
        const propertyId = searchParams.get('property_id')
        const status = searchParams.get('status')
        const from = searchParams.get('from') // date range start
        const to = searchParams.get('to')     // date range end

        let query = supabase
            .from('rental_bookings')
            .select('*, rental_properties(name, address)')
            .order('check_in', { ascending: false })

        if (propertyId) {
            query = query.eq('property_id', propertyId)
        }
        if (status) {
            query = query.eq('status', status)
        }
        if (from) {
            query = query.gte('check_in', from)
        }
        if (to) {
            query = query.lte('check_out', to)
        }

        const { data, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data ?? [], {
            headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
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

        if (!body.property_id || !body.guest_name || !body.check_in || !body.check_out || !body.total_amount) {
            return NextResponse.json(
                { error: 'property_id, guest_name, check_in, check_out e total_amount são obrigatórios' },
                { status: 400 },
            )
        }

        const record = {
            property_id: body.property_id,
            guest_name: body.guest_name,
            guest_email: body.guest_email || null,
            guest_phone: body.guest_phone || null,
            guests_count: body.guests_count ? Number(body.guests_count) : 1,
            check_in: body.check_in,
            check_out: body.check_out,
            source: body.source || 'direct',
            status: body.status || 'confirmed',
            total_amount: Number(body.total_amount),
            cleaning_fee: body.cleaning_fee ? Number(body.cleaning_fee) : 0,
            platform_fee: body.platform_fee ? Number(body.platform_fee) : 0,
            net_amount: body.net_amount ? Number(body.net_amount) : null,
            payment_status: body.payment_status || 'pending',
            notes: body.notes || null,
            external_booking_id: body.external_booking_id || null,
        }

        const { data, error } = await supabase
            .from('rental_bookings')
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
