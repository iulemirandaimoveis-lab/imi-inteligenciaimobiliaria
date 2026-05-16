import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { logAudit, getRequestMeta, getUserRole } from '@/lib/governance'

// ── Schemas ──────────────────────────────────────────────────────────────────

const createCycleSchema = z.object({
    week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'week_start deve ser YYYY-MM-DD'),
    week_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'week_end deve ser YYYY-MM-DD'),
    selection_opens: z.string().datetime({ message: 'selection_opens deve ser ISO timestamp' }),
    selection_closes: z.string().datetime({ message: 'selection_closes deve ser ISO timestamp' }),
    status: z.enum(['draft', 'open', 'closed', 'published']).default('draft'),
    notes: z.string().optional().nullable(),
})

const patchCycleSchema = z.object({
    id: z.string().uuid('ID inválido'),
    status: z.enum(['draft', 'open', 'closed', 'published']).optional(),
    selection_opens: z.string().datetime().optional(),
    selection_closes: z.string().datetime().optional(),
    notes: z.string().optional().nullable(),
})

// ── GET /api/plantao/ciclos ───────────────────────────────────────────────────
// Returns current + future week cycles.
// ?status=open  → filter by status
// ?include_past=true → include past cycles
export const GET = apiHandler(null, async (req: NextRequest, _body: unknown, ctx: ApiContext) => {
    const { supabase } = ctx
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const include_past = searchParams.get('include_past') === 'true'
    const id = searchParams.get('id')

    if (id) {
        const { data, error } = await supabase
            .from('duty_week_cycles')
            .select('*')
            .eq('id', id)
            .single()

        if (error) return NextResponse.json({ error: 'Ciclo não encontrado' }, { status: 404 })
        return NextResponse.json(data)
    }

    const today = new Date().toISOString().slice(0, 10)

    let query = supabase
        .from('duty_week_cycles')
        .select('*')
        .order('week_start', { ascending: false })

    if (!include_past) {
        // Current week onwards: week_end >= today
        query = query.gte('week_end', today)
    }

    if (status) {
        query = query.eq('status', status)
    }

    query = query.limit(52) // Up to 1 year ahead

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao buscar ciclos' }, { status: 500 })

    return NextResponse.json({ data: data ?? [], count: (data ?? []).length })
}, { auth: true })

// ── POST /api/plantao/ciclos ──────────────────────────────────────────────────
// Admin only — create a new week cycle.
export const POST = apiHandler(createCycleSchema, async (req: NextRequest, body: z.infer<typeof createCycleSchema>, ctx: ApiContext) => {
    const { supabase, user } = ctx

    const role = await getUserRole(user!.id)
    if (role !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado. Apenas admin pode criar ciclos.' }, { status: 403 })
    }

    // Validate date ordering
    if (body.week_end <= body.week_start) {
        return NextResponse.json({ error: 'week_end deve ser posterior a week_start' }, { status: 400 })
    }
    if (body.selection_closes <= body.selection_opens) {
        return NextResponse.json({ error: 'selection_closes deve ser posterior a selection_opens' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('duty_week_cycles')
        .insert({ ...body, created_by: user!.id })
        .select()
        .single()

    if (error) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Já existe um ciclo para esta semana.' }, { status: 409 })
        }
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao criar ciclo' }, { status: 500 })
    }

    logAudit({
        user_id: user!.id,
        action: 'create',
        entity_type: 'duty_week_cycle',
        entity_id: data.id,
        new_data: body as Record<string, unknown>,
        ...getRequestMeta(req),
    })

    return NextResponse.json(data, { status: 201 })
}, { auth: true })

// ── PATCH /api/plantao/ciclos ─────────────────────────────────────────────────
// Admin only — update cycle status and/or dates.
export const PATCH = apiHandler(patchCycleSchema, async (req: NextRequest, body: z.infer<typeof patchCycleSchema>, ctx: ApiContext) => {
    const { supabase, user } = ctx

    const role = await getUserRole(user!.id)
    if (role !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado. Apenas admin pode alterar ciclos.' }, { status: 403 })
    }

    const { id, ...updates } = body

    // Fetch old for audit
    const { data: old } = await supabase.from('duty_week_cycles').select('*').eq('id', id).single()
    if (!old) return NextResponse.json({ error: 'Ciclo não encontrado' }, { status: 404 })

    // Validate allowed status transitions
    if (updates.status) {
        const transitions: Record<string, string[]> = {
            draft: ['open', 'closed'],
            open: ['closed'],
            closed: ['published', 'open'],
            published: [],
        }
        const allowed = transitions[old.status as string] ?? []
        if (!allowed.includes(updates.status)) {
            return NextResponse.json(
                { error: `Transição inválida: ${old.status} → ${updates.status}. Permitidas: ${allowed.join(', ') || 'nenhuma'}` },
                { status: 422 }
            )
        }
    }

    const { data, error } = await supabase
        .from('duty_week_cycles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao atualizar ciclo' }, { status: 500 })

    logAudit({
        user_id: user!.id,
        action: 'update',
        entity_type: 'duty_week_cycle',
        entity_id: id,
        old_data: old as Record<string, unknown>,
        new_data: updates as Record<string, unknown>,
        ...getRequestMeta(req),
    })

    return NextResponse.json(data)
}, { auth: true })
