// src/app/api/financeiro/route.ts
// ── Financial Transactions CRUD (tabela: transactions) ────────

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
                .from('transactions')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .single()
            if (error) return NextResponse.json({ error: error.message }, { status: 404 })
            // Mapear `date` → `due_date` para compatibilidade com o UI
            return NextResponse.json({ ...data, due_date: data.date })
        }

        let query = supabase
            .from('transactions')
            .select('id, type, category, description, amount, date, status, notes, created_at')
            .eq('user_id', user.id)
            .order('date', { ascending: false })

        if (type)   query = query.eq('type', type)
        if (status) query = query.eq('status', status)
        if (month) {
            const [y, m] = month.split('-')
            const start = `${y}-${m}-01`
            const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate()
            const end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`
            query = query.gte('date', start).lte('date', end)
        }

        const { data, error } = await query.limit(200)
        if (error) return NextResponse.json([], { status: 200 }) // graceful
        // Mapear date → due_date para o front
        const mapped = (data || []).map((t: any) => ({ ...t, due_date: t.date, payment_method: null }))
        return NextResponse.json(mapped)

    } catch (err: any) {
        return NextResponse.json([], { status: 200 })
    }
}

// POST — criar transação
export async function POST(req: NextRequest) {
    try {
        const { supabase, user } = await getAuth()
        if (!supabase || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { type, category, description, amount, due_date, status, notes, related_entity_type, related_entity_id } = body

        if (!type || !description || amount === undefined) {
            return NextResponse.json({ error: 'type, description e amount são obrigatórios' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                type,
                category: category || 'Outros',
                description,
                amount: parseFloat(String(amount)),
                date: due_date || new Date().toISOString().split('T')[0],
                status: status || 'pendente',
                notes: notes || null,
                related_entity_type: related_entity_type || null,
                related_entity_id: related_entity_id || null,
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ ...data, due_date: data.date }, { status: 201 })

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
        const { id, due_date, paid_date, ...rest } = body

        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

        // Mapear due_date → date se enviado
        const updates: any = { ...rest, updated_at: new Date().toISOString() }
        if (due_date) updates.date = due_date

        const { data, error } = await supabase
            .from('transactions')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ ...data, due_date: data.date })

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
            .from('transactions')
            .update({ status: 'cancelado', updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
