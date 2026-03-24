import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const BookingPostSchema = z.object({
    property_id: z.string().min(1),
    guest_name: z.string().min(2).max(200),
    guest_email: z.string().email().optional(),
    guest_phone: z.string().optional(),
    guests_count: z.number().int().positive().optional(),
    check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    source: z.string().optional(),
    status: z.string().optional(),
    total_amount: z.number().positive(),
    cleaning_fee: z.number().min(0).optional(),
    platform_fee: z.number().min(0).optional(),
    net_amount: z.number().optional(),
    payment_status: z.string().optional(),
    notes: z.string().optional(),
    external_booking_id: z.string().optional(),
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
        const parsed = BookingPostSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
        }
        const b = parsed.data

        const record = {
            property_id: b.property_id,
            guest_name: b.guest_name,
            guest_email: b.guest_email || null,
            guest_phone: b.guest_phone || null,
            guests_count: b.guests_count ?? 1,
            check_in: b.check_in,
            check_out: b.check_out,
            source: b.source || 'direct',
            status: b.status || 'confirmed',
            total_amount: b.total_amount,
            cleaning_fee: b.cleaning_fee ?? 0,
            platform_fee: b.platform_fee ?? 0,
            net_amount: b.net_amount ?? null,
            payment_status: b.payment_status || 'pending',
            notes: b.notes || null,
            external_booking_id: b.external_booking_id || null,
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
