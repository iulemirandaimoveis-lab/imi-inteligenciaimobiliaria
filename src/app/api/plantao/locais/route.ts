import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { logAudit, getRequestMeta, getUserRole } from '@/lib/governance'

// ── Schemas ──────────────────────────────────────────────────────────────────

const createLocationSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    location_type: z.enum(['imobiliaria', 'loteamento', 'condominio', 'empreendimento']),
    agency_id: z.string().uuid().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().length(2).default('PE'),
    lat: z.number().optional().nullable(),
    lng: z.number().optional().nullable(),
    max_brokers_per_slot: z.number().int().min(1).max(10).default(2),
    is_active: z.boolean().default(true),
    notes: z.string().optional().nullable(),
})

const updateLocationSchema = createLocationSchema.partial().extend({
    id: z.string().uuid('ID inválido'),
})

// ── GET /api/plantao/locais ───────────────────────────────────────────────────
// Returns duty locations with agency info, time_slots count,
// and active schedules count for current week.
export const GET = apiHandler(null, async (req: NextRequest, _body: unknown, ctx: ApiContext) => {
    const { supabase } = ctx
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const active_only = searchParams.get('active_only') !== 'false'

    if (id) {
        const { data, error } = await supabase
            .from('duty_locations')
            .select(`
                *,
                agency:partner_agencies(id, name, agency_type),
                duty_time_slots(id, label, start_time, end_time, max_brokers, is_active)
            `)
            .eq('id', id)
            .single()

        if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Local não encontrado' }, { status: 404 })
        return NextResponse.json(data)
    }

    // Determine current week range (Monday–Sunday)
    const now = new Date()
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - dayOfWeek + 1)
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    const weekStart = monday.toISOString().slice(0, 10)
    const weekEnd = sunday.toISOString().slice(0, 10)

    let query = supabase
        .from('duty_locations')
        .select(`
            *,
            agency:partner_agencies(id, name, agency_type),
            duty_time_slots(count),
            active_schedules:duty_schedules(count)
        `)
        .order('name')

    if (active_only) {
        query = query.eq('is_active', true)
    }

    // Filter active schedules to current week
    // Supabase doesn't support nested filters on aggregates in basic select;
    // fetch raw then enrich below
    const { data: locations, error } = await supabase
        .from('duty_locations')
        .select(`
            *,
            agency:partner_agencies(id, name, agency_type),
            duty_time_slots(id, label, start_time, end_time, max_brokers, is_active)
        `)
        .order('name')
        .then(r => {
            if (active_only && !r.error) {
                r.data = (r.data ?? []).filter((l: { is_active: boolean }) => l.is_active)
            }
            return r
        })

    if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao buscar locais' }, { status: 500 })

    // Fetch active schedule counts per location for current week
    const locationIds = (locations ?? []).map((l: { id: string }) => l.id)
    let scheduleCounts: Record<string, number> = {}

    if (locationIds.length > 0) {
        const { data: schedData } = await supabase
            .from('duty_schedules')
            .select('location_id')
            .in('location_id', locationIds)
            .gte('schedule_date', weekStart)
            .lte('schedule_date', weekEnd)
            .not('status', 'in', '("cancelled","swapped")')

        const counts: Record<string, number> = {}
        for (const row of schedData ?? []) {
            counts[row.location_id] = (counts[row.location_id] ?? 0) + 1
        }
        scheduleCounts = counts
    }

    const enriched = (locations ?? []).map((loc: Record<string, unknown> & { id: string; duty_time_slots?: unknown[] }) => ({
        ...loc,
        time_slots_count: Array.isArray(loc.duty_time_slots) ? loc.duty_time_slots.length : 0,
        active_schedules_count: scheduleCounts[loc.id] ?? 0,
        week_range: { week_start: weekStart, week_end: weekEnd },
    }))

    return NextResponse.json({ data: enriched, count: enriched.length })
}, { auth: true })

// ── POST /api/plantao/locais ──────────────────────────────────────────────────
// Admin/manager only — create new duty location.
export const POST = apiHandler(createLocationSchema, async (req: NextRequest, body: z.infer<typeof createLocationSchema>, ctx: ApiContext) => {
    const { supabase, user } = ctx

    const role = await getUserRole(user!.id)
    if (!['admin', 'manager'].includes(role)) {
        return NextResponse.json({ error: 'Acesso negado. Apenas admin/gestor pode criar locais.' }, { status: 403 })
    }

    const { data, error } = await supabase
        .from('duty_locations')
        .insert({ ...body, created_by: user!.id })
        .select(`*, agency:partner_agencies(id, name, agency_type)`)
        .single()

    if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao criar local' }, { status: 500 })

    logAudit({
        user_id: user!.id,
        action: 'create',
        entity_type: 'duty_location',
        entity_id: data.id,
        new_data: body as Record<string, unknown>,
        ...getRequestMeta(req),
    })

    return NextResponse.json(data, { status: 201 })
}, { auth: true })

// ── PUT /api/plantao/locais ───────────────────────────────────────────────────
// Admin/manager only — update duty location.
export const PUT = apiHandler(updateLocationSchema, async (req: NextRequest, body: z.infer<typeof updateLocationSchema>, ctx: ApiContext) => {
    const { supabase, user } = ctx

    const role = await getUserRole(user!.id)
    if (!['admin', 'manager'].includes(role)) {
        return NextResponse.json({ error: 'Acesso negado. Apenas admin/gestor pode editar locais.' }, { status: 403 })
    }

    const { id, ...updates } = body

    // Fetch old data for audit
    const { data: old } = await supabase.from('duty_locations').select('*').eq('id', id).single()

    const { data, error } = await supabase
        .from('duty_locations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`*, agency:partner_agencies(id, name, agency_type)`)
        .single()

    if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao atualizar local' }, { status: 500 })

    logAudit({
        user_id: user!.id,
        action: 'update',
        entity_type: 'duty_location',
        entity_id: id,
        old_data: old as Record<string, unknown>,
        new_data: updates as Record<string, unknown>,
        ...getRequestMeta(req),
    })

    return NextResponse.json(data)
}, { auth: true })
