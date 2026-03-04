// src/app/api/financeiro/route.ts
// ── Financial Transactions CRUD ─────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getAuthenticatedSupabase() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { supabase: null, user: null }
    return { supabase, user }
}

// GET — list transactions (with optional filters)
export async function GET(req: NextRequest) {
    try {
        const { supabase, user } = await getAuthenticatedSupabase()
        if (!supabase || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const type = searchParams.get('type') // 'receita' or 'despesa'
        const status = searchParams.get('status')
        const month = searchParams.get('month') // YYYY-MM format
        const id = searchParams.get('id')

        // Single transaction by ID
        if (id) {
            const { data, error } = await supabase
                .from('financial_transactions')
                .select('*')
                .eq('id', id)
                .single()
            if (error) return NextResponse.json({ error: error.message }, { status: 404 })
            return NextResponse.json(data)
        }

        // List with filters
        let query = supabase
            .from('financial_transactions')
            .select('*')
            .order('due_date', { ascending: false })

        if (type) query = query.eq('type', type)
        if (status) query = query.eq('status', status)
        if (month) {
            const start = `${month}-01`
            const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
            const end = `${month}-${String(endDate.getDate()).padStart(2, '0')}`
            query = query.gte('due_date', start).lte('due_date', end)
        }

        const { data, error } = await query.limit(200)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data || [])

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// POST — create transaction
export async function POST(req: NextRequest) {
    try {
        const { supabase, user } = await getAuthenticatedSupabase()
        if (!supabase || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { type, category, description, amount, due_date, status, payment_method, reference_type, reference_id, notes } = body

        if (!type || !description || amount === undefined) {
            return NextResponse.json({ error: 'type, description e amount são obrigatórios' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('financial_transactions')
            .insert({
                type,
                category: category || 'Outros',
                description,
                amount,
                due_date: due_date || null,
                status: status || 'pendente',
                payment_method: payment_method || null,
                reference_type: reference_type || null,
                reference_id: reference_id || null,
                notes: notes || null,
                created_by: user.id,
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data, { status: 201 })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// PUT — update transaction
export async function PUT(req: NextRequest) {
    try {
        const { supabase, user } = await getAuthenticatedSupabase()
        if (!supabase || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

        updates.updated_at = new Date().toISOString()

        const { data, error } = await supabase
            .from('financial_transactions')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// DELETE — soft delete (set status to cancelado)
export async function DELETE(req: NextRequest) {
    try {
        const { supabase, user } = await getAuthenticatedSupabase()
        if (!supabase || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

        const { error } = await supabase
            .from('financial_transactions')
            .update({ status: 'cancelado', updated_at: new Date().toISOString() })
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
