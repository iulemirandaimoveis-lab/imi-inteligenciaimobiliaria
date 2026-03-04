// src/app/api/financeiro/route.ts
// ── Financial Transactions CRUD (tabela: financial_transactions) ────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
            .select('id, type, category, description, amount, due_date, paid_date, status, payment_method, notes, created_at')
            .order('due_date', { ascending: false })

        if (type)   query = query.eq('type', type)
        if (status) query = query.eq('status', status)
        if (month) {
            const [y, m] = month.split('-')
            const start = `${y}-${m}-01`
            const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate()
            const end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`
            query = query.gte('due_date', start).lte('due_date', end)
        }

        const { data, error } = await query.limit(200)
        if (error) return NextResponse.json([], { status: 200 }) // graceful
        return NextResponse.json(data || [])

    } catch {
        return NextResponse.json([], { status: 200 })
    }
}

// POST — criar transação
export async function POST(req: NextRequest) {
    try {
        const { supabase, user } = await getAuth()
        if (!supabase || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { type, category, description, amount, due_date, status, notes } = body

        if (!type || !description || amount === undefined) {
            return NextResponse.json({ error: 'type, description e amount são obrigatórios' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('financial_transactions')
            .insert({
                created_by: user.id,
                type,
                category: category || 'Outros',
                description,
                amount: parseFloat(String(amount)),
                due_date: due_date || new Date().toISOString().split('T')[0],
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

        const body = await req.json()
        const { id, ...rest } = body

        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

        const updates: any = { ...rest, updated_at: new Date().toISOString() }

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
