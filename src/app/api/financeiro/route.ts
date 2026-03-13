// src/app/api/financeiro/route.ts
// ── Financial Transactions CRUD (tabela: financial_transactions) ────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseBody, transactionSchema, transactionUpdateSchema } from '@/lib/schemas'

async function getAuth() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { supabase: null, user: null }
    return { supabase, user }
}

// GET — listar transações
export async function GET(req: NextRequest) {
    try {
        const { supabase, user } = await getAuth()
        if (!supabase || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const type   = searchParams.get('type')
        const status = searchParams.get('status')
        const month  = searchParams.get('month') // YYYY-MM
        const id     = searchParams.get('id')
        const page   = parseInt(searchParams.get('page') || '1')
        const limit  = Math.min(parseInt(searchParams.get('limit') || '50'), 250)
        const offset = (page - 1) * limit

        if (id) {
            const { data, error } = await supabase
                .from('financial_transactions')
                .select('*')
                .eq('id', id)
                .single()
            if (error) return NextResponse.json({ error: error.message }, { status: 404 })
            return NextResponse.json(data)
        }

        let query = supabase
            .from('financial_transactions')
            .select('id, type, category, description, amount, due_date, paid_date, status, payment_method, notes, created_at', { count: 'exact' })
            .not('status', 'eq', 'cancelado')
            .order('due_date', { ascending: false })
            .range(offset, offset + limit - 1)

        if (type)   query = query.eq('type', type)
        if (status) query = query.eq('status', status)
        if (month) {
            const [y, m] = month.split('-')
            const start = `${y}-${m}-01`
            const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate()
            const end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`
            query = query.gte('due_date', start).lte('due_date', end)
        }

        const { data, error, count } = await query
        if (error) {
            console.error('Error fetching transactions:', error)
            return NextResponse.json({ error: error.message, data: [], pagination: { page, limit, total: 0, pages: 0 } }, { status: 500 })
        }
        return NextResponse.json({
            data: data || [],
            pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
        })

    } catch (err: any) {
        console.error('Error in GET /api/financeiro:', err)
        return NextResponse.json({ error: 'Internal Server Error', data: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } }, { status: 500 })
    }
}

// POST — criar transação
export async function POST(req: NextRequest) {
    try {
        const { supabase, user } = await getAuth()
        if (!supabase || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const parsed = await parseBody(req, transactionSchema)
        if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error }, { status: 400 })
        const { type, category, description, amount, date, status, notes } = parsed.data

        const { data, error } = await supabase
            .from('financial_transactions')
            .insert({
                created_by: user.id,
                type,
                category: category || 'Outros',
                description,
                amount,
                due_date: date || new Date().toISOString().split('T')[0],
                status: status || 'pendente',
                notes: notes || null,
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data, { status: 201 })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// PUT — atualizar (ex: marcar como pago)
export async function PUT(req: NextRequest) {
    try {
        const { supabase, user } = await getAuth()
        if (!supabase || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const parsed = await parseBody(req, transactionUpdateSchema)
        if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error }, { status: 400 })
        const { id, ...rest } = parsed.data

        const updates = { ...rest, updated_at: new Date().toISOString() }

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

// DELETE — soft delete (status = cancelado)
export async function DELETE(req: NextRequest) {
    try {
        const { supabase, user } = await getAuth()
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
