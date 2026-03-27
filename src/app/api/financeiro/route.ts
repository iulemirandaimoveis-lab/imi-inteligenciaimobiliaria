// src/app/api/financeiro/route.ts
// ── Financial Transactions CRUD (tabela: financial_transactions) ────────
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { transactionSchema, transactionUpdateSchema } from '@/lib/schemas'

// ─── Zod schema for PUT body ────────────────────────────────────────────────
const financeiroPutSchema = z.object({
    id: z.string().uuid('ID inválido'),
}).passthrough()

// GET — listar transacoes
export const GET = apiHandler(null, async (req: NextRequest, _body: unknown, ctx: ApiContext) => {
    const { supabase } = ctx
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
        if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 404 })
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
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido', data: [], pagination: { page, limit, total: 0, pages: 0 } }, { status: 500 })
    }
    return NextResponse.json({
        data: data || [],
        pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    })
}, { auth: true })

// POST — criar transacao
export const POST = apiHandler(transactionSchema, async (_req: NextRequest, body, ctx: ApiContext) => {
    const { supabase, user } = ctx
    const { type, category, description, amount, date, status, notes } = body
    const { data, error } = await supabase
        .from('financial_transactions')
        .insert({
            created_by: user!.id,
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
    if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
}, { auth: true, auditAction: 'financeiro.create' })

// PUT — atualizar (ex: marcar como pago)
export const PUT = apiHandler(financeiroPutSchema, async (_req: NextRequest, body: z.infer<typeof financeiroPutSchema>, ctx: ApiContext) => {
    const { supabase } = ctx
    const { id, ...rest } = body

    // Re-validate with the full update schema
    const parsed = transactionUpdateSchema.safeParse({ id, ...rest })
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })

    const { id: _id, ...updates } = parsed.data
    const payload = { ...updates, updated_at: new Date().toISOString() }
    const { data, error } = await supabase
        .from('financial_transactions')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
    if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
    return NextResponse.json(data)
}, { auth: true, auditAction: 'financeiro.update' })

// DELETE — soft delete (status = cancelado)
export const DELETE = apiHandler(null, async (req: NextRequest, _body: unknown, ctx: ApiContext) => {
    const { supabase } = ctx
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    const { error } = await supabase
        .from('financial_transactions')
        .update({ status: 'cancelado', updated_at: new Date().toISOString() })
        .eq('id', id)
    if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
    return NextResponse.json({ success: true })
}, { auth: true, auditAction: 'financeiro.delete' })
