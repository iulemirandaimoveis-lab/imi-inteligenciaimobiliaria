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

        const parsed = BookingPostSchema.partial().safeParse(rest)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
        }

        const updates: Record<string, unknown> = {}
        const b = parsed.data
        if (b.property_id !== undefined) updates.property_id = b.property_id
        if (b.guest_name !== undefined) updates.guest_name = b.guest_name
        if (b.guest_email !== undefined) updates.guest_email = b.guest_email || null
        if (b.guest_phone !== undefined) updates.guest_phone = b.guest_phone || null
        if (b.guests_count !== undefined) updates.guests_count = b.guests_count
        if (b.check_in !== undefined) updates.check_in = b.check_in
        if (b.check_out !== undefined) updates.check_out = b.check_out
        if (b.source !== undefined) updates.source = b.source
        if (b.status !== undefined) updates.status = b.status
        if (b.total_amount !== undefined) updates.total_amount = b.total_amount
        if (b.cleaning_fee !== undefined) updates.cleaning_fee = b.cleaning_fee
        if (b.platform_fee !== undefined) updates.platform_fee = b.platform_fee
        if (b.net_amount !== undefined) updates.net_amount = b.net_amount
        if (b.payment_status !== undefined) updates.payment_status = b.payment_status
        if (b.notes !== undefined) updates.notes = b.notes || null
        if (b.external_booking_id !== undefined) updates.external_booking_id = b.external_booking_id || null
        updates.updated_at = new Date().toISOString()

        const { data, error } = await supabase
            .from('rental_bookings')
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

        // Cancel booking instead of hard-delete
        const { error } = await supabase
            .from('rental_bookings')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
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
