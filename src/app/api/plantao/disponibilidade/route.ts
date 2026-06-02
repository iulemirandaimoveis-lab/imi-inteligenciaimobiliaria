import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { logAudit, getRequestMeta, getUserRole } from '@/lib/governance'

// ── Schemas ──────────────────────────────────────────────────────────────────

const upsertAvailabilitySchema = z.object({
  week_cycle_id: z.string().uuid('week_cycle_id inválido'),
  available_dates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datas devem ser YYYY-MM-DD'))
    .min(0),
  preferred_shifts: z
    .array(z.enum(['manha', 'tarde', 'noite']))
    .default([]),
  preferred_locations: z
    .array(z.string().uuid('UUID de local inválido'))
    .default([]),
  notes: z.string().max(500).optional().nullable(),
  // Optional: admin can set for a specific broker
  broker_id: z.string().uuid().optional(),
})

// ── GET /api/plantao/disponibilidade ─────────────────────────────────────────
// Get broker's availability for a cycle.
// ?cycle_id=  — required
// ?broker_id= — optional (admin/manager can view others)
export const GET = apiHandler(null, async (req: NextRequest, _body: unknown, ctx: ApiContext) => {
  const { supabase, user } = ctx
  const { searchParams } = new URL(req.url)

  const cycle_id = searchParams.get('cycle_id')
  const broker_id_param = searchParams.get('broker_id')

  if (!cycle_id) {
    return NextResponse.json({ error: 'Parâmetro cycle_id é obrigatório' }, { status: 400 })
  }

  // Resolve the broker_id being queried
  // If broker_id_param is provided, only admin/manager can use it for other brokers
  let targetBrokerId: string | null = null

  if (broker_id_param) {
    const role = await getUserRole(user!.id)
    if (!['admin', 'manager'].includes(role)) {
      // Brokers can only query their own availability
      const { data: selfBroker } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user!.id)
        .single()
      if (!selfBroker || selfBroker.id !== broker_id_param) {
        return NextResponse.json({ error: 'Acesso negado. Você só pode consultar sua própria disponibilidade.' }, { status: 403 })
      }
    }
    targetBrokerId = broker_id_param
  } else {
    // Default: current user's broker record
    const { data: selfBroker } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user!.id)
      .single()
    if (!selfBroker) {
      return NextResponse.json({ error: 'Corretor não encontrado para este usuário' }, { status: 404 })
    }
    targetBrokerId = selfBroker.id
  }

  const { data, error } = await supabase
    .from('duty_availability')
    .select(`
      *,
      broker:brokers(id, name, email, avatar_url),
      week_cycle:duty_week_cycles(id, week_start, week_end, status)
    `)
    .eq('week_cycle_id', cycle_id)
    .eq('broker_id', targetBrokerId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message || 'Erro ao buscar disponibilidade' }, { status: 500 })
  }

  // Return null if no availability declared yet (not an error)
  return NextResponse.json({ data })
}, { auth: true })

// ── POST /api/plantao/disponibilidade ────────────────────────────────────────
// Declare or update broker's availability for a cycle.
// Brokers can only set their own. Admin/manager can set for any broker.
export const POST = apiHandler(upsertAvailabilitySchema, async (req: NextRequest, body: z.infer<typeof upsertAvailabilitySchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  const role = await getUserRole(user!.id)
  const isPrivileged = ['admin', 'manager'].includes(role)

  // Resolve the broker id
  let brokerId: string

  if (body.broker_id && isPrivileged) {
    // Admin/manager setting for another broker
    const { data: targetBroker } = await supabase
      .from('brokers')
      .select('id')
      .eq('id', body.broker_id)
      .single()
    if (!targetBroker) {
      return NextResponse.json({ error: 'Corretor alvo não encontrado' }, { status: 404 })
    }
    brokerId = targetBroker.id
  } else if (body.broker_id && !isPrivileged) {
    // Unprivileged user trying to set for another broker — check it's themselves
    const { data: selfBroker } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user!.id)
      .single()
    if (!selfBroker || selfBroker.id !== body.broker_id) {
      return NextResponse.json({ error: 'Você só pode declarar sua própria disponibilidade.' }, { status: 403 })
    }
    brokerId = selfBroker.id
  } else {
    // No broker_id given — use self
    const { data: selfBroker } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user!.id)
      .single()
    if (!selfBroker) {
      return NextResponse.json({ error: 'Corretor não encontrado para este usuário' }, { status: 404 })
    }
    brokerId = selfBroker.id
  }

  // Validate cycle exists and is still open for modifications
  const { data: cycle } = await supabase
    .from('duty_week_cycles')
    .select('id, status, selection_opens, selection_closes')
    .eq('id', body.week_cycle_id)
    .single()

  if (!cycle) {
    return NextResponse.json({ error: 'Ciclo semanal não encontrado' }, { status: 404 })
  }

  // Only allow declaration when cycle is open (admin/manager can bypass)
  if (!isPrivileged && cycle.status !== 'open') {
    return NextResponse.json({
      error: `Ciclo não está aberto para seleção. Status atual: ${cycle.status}`,
    }, { status: 422 })
  }

  // Check if selection window is active (admin/manager can bypass)
  if (!isPrivileged) {
    const now = new Date()
    const opensAt = new Date(cycle.selection_opens)
    const closesAt = new Date(cycle.selection_closes)
    if (now < opensAt || now > closesAt) {
      return NextResponse.json({
        error: `Janela de seleção não está ativa. Abertura: ${cycle.selection_opens} — Fechamento: ${cycle.selection_closes}`,
      }, { status: 422 })
    }
  }

  const { broker_id: _omit, ...availabilityPayload } = body

  const { data, error } = await supabase
    .from('duty_availability')
    .upsert({
      broker_id: brokerId,
      week_cycle_id: body.week_cycle_id,
      available_dates: availabilityPayload.available_dates,
      preferred_shifts: availabilityPayload.preferred_shifts,
      preferred_locations: availabilityPayload.preferred_locations,
      notes: availabilityPayload.notes ?? null,
      declared_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'broker_id,week_cycle_id',
    })
    .select(`
      *,
      broker:brokers(id, name, email),
      week_cycle:duty_week_cycles(id, week_start, week_end, status)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message || 'Erro ao salvar disponibilidade' }, { status: 500 })
  }

  logAudit({
    user_id: user!.id,
    action: 'upsert',
    entity_type: 'duty_availability',
    entity_id: data.id,
    new_data: { broker_id: brokerId, ...availabilityPayload } as Record<string, unknown>,
    ...getRequestMeta(req),
  })

  return NextResponse.json(data, { status: 201 })
}, { auth: true })
