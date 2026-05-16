import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { logAudit, getRequestMeta, getUserRole } from '@/lib/governance'

// ── Schemas ──────────────────────────────────────────────────────────────────

const createSwapSchema = z.object({
  requester_schedule_id: z.string().uuid('requester_schedule_id inválido'),
  target_broker_id: z.string().uuid().optional().nullable(),
  target_schedule_id: z.string().uuid().optional().nullable(),
  reason: z.string().min(5, 'Motivo deve ter pelo menos 5 caracteres').max(500),
})

const respondSwapSchema = z.object({
  swap_id: z.string().uuid('swap_id inválido'),
  // Target broker response
  action: z.enum(['accept', 'reject', 'approve', 'reject_manager', 'cancel']),
  response_notes: z.string().max(500).optional().nullable(),
})

// ── GET /api/plantao/trocas ───────────────────────────────────────────────────
// List swap requests for the current user (as requester or target).
// Admin/manager can see all swaps.
// ?status=pending  — filter by status
// ?my_swaps=true   — show only swaps where I'm involved (default for non-admin)
export const GET = apiHandler(null, async (req: NextRequest, _body: unknown, ctx: ApiContext) => {
  const { supabase, user } = ctx
  const { searchParams } = new URL(req.url)

  const status_filter = searchParams.get('status')
  const swap_id = searchParams.get('id')

  const role = await getUserRole(user!.id)
  const isPrivileged = ['admin', 'manager'].includes(role)

  if (swap_id) {
    const { data, error } = await supabase
      .from('duty_swap_requests')
      .select(`
        *,
        requester:brokers!requester_id(id, name, email, avatar_url),
        requester_schedule:duty_schedules!requester_schedule_id(
          id, schedule_date, start_time, end_time, status,
          location:duty_locations(id, name),
          time_slot:duty_time_slots(id, label)
        ),
        target_broker:brokers!target_broker_id(id, name, email, avatar_url),
        target_schedule:duty_schedules!target_schedule_id(
          id, schedule_date, start_time, end_time, status,
          location:duty_locations(id, name),
          time_slot:duty_time_slots(id, label)
        )
      `)
      .eq('id', swap_id)
      .single()

    if (error) return NextResponse.json({ error: 'Troca não encontrada' }, { status: 404 })
    return NextResponse.json(data)
  }

  // Fetch current broker record
  const { data: selfBroker } = await supabase
    .from('brokers')
    .select('id')
    .eq('user_id', user!.id)
    .maybeSingle()

  let query = supabase
    .from('duty_swap_requests')
    .select(`
      *,
      requester:brokers!requester_id(id, name, email, avatar_url),
      requester_schedule:duty_schedules!requester_schedule_id(
        id, schedule_date, start_time, end_time, status,
        location:duty_locations(id, name),
        time_slot:duty_time_slots(id, label)
      ),
      target_broker:brokers!target_broker_id(id, name, email, avatar_url),
      target_schedule:duty_schedules!target_schedule_id(
        id, schedule_date, start_time, end_time, status,
        location:duty_locations(id, name),
        time_slot:duty_time_slots(id, label)
      )
    `)
    .order('created_at', { ascending: false })

  // Non-privileged users only see their own swaps
  if (!isPrivileged && selfBroker) {
    query = query.or(`requester_id.eq.${selfBroker.id},target_broker_id.eq.${selfBroker.id}`)
  }

  if (status_filter) {
    query = query.eq('status', status_filter)
  }

  query = query.limit(100)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message || 'Erro ao buscar trocas' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], count: (data ?? []).length })
}, { auth: true })

// ── POST /api/plantao/trocas ──────────────────────────────────────────────────
// Create a swap request.
export const POST = apiHandler(createSwapSchema, async (req: NextRequest, body: z.infer<typeof createSwapSchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  // Resolve requester broker id
  const { data: selfBroker } = await supabase
    .from('brokers')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  if (!selfBroker) {
    return NextResponse.json({ error: 'Corretor não encontrado para este usuário' }, { status: 404 })
  }

  // Validate requester owns the schedule
  const { data: requesterSchedule } = await supabase
    .from('duty_schedules')
    .select('id, status, schedule_date, start_time, end_time, location_id, time_slot_id, week_cycle_id')
    .eq('id', body.requester_schedule_id)
    .single()

  if (!requesterSchedule) {
    return NextResponse.json({ error: 'Escala do solicitante não encontrada' }, { status: 404 })
  }

  const role = await getUserRole(user!.id)
  const isPrivileged = ['admin', 'manager'].includes(role)

  // Only the schedule's broker (or admin) can request a swap for it
  if (!isPrivileged) {
    const { data: schedBroker } = await supabase
      .from('duty_schedules')
      .select('broker_id')
      .eq('id', body.requester_schedule_id)
      .eq('broker_id', selfBroker.id)
      .maybeSingle()

    if (!schedBroker) {
      return NextResponse.json({ error: 'Você só pode solicitar troca de suas próprias escalas.' }, { status: 403 })
    }
  }

  if (requesterSchedule.status !== 'confirmed') {
    return NextResponse.json({
      error: `Escala não pode ser trocada. Status atual: ${requesterSchedule.status}`,
    }, { status: 422 })
  }

  // Validate target schedule if provided
  if (body.target_schedule_id) {
    const { data: targetSchedule } = await supabase
      .from('duty_schedules')
      .select('id, status, broker_id')
      .eq('id', body.target_schedule_id)
      .single()

    if (!targetSchedule) {
      return NextResponse.json({ error: 'Escala alvo não encontrada' }, { status: 404 })
    }
    if (targetSchedule.status !== 'confirmed') {
      return NextResponse.json({ error: 'Escala alvo não está confirmada.' }, { status: 422 })
    }
    // If target_broker_id not provided, derive it from the schedule
    if (!body.target_broker_id && targetSchedule.broker_id) {
      body = { ...body, target_broker_id: targetSchedule.broker_id }
    }
  }

  // Determine swap type
  const swapType = body.target_schedule_id
    ? 'bilateral'
    : body.target_broker_id
      ? 'offer'
      : 'emergency'

  // Set expiry: 48 hours from now
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  const { data: swap, error } = await supabase
    .from('duty_swap_requests')
    .insert({
      requester_id: selfBroker.id,
      requester_schedule_id: body.requester_schedule_id,
      target_broker_id: body.target_broker_id ?? null,
      target_schedule_id: body.target_schedule_id ?? null,
      swap_type: swapType,
      status: 'pending',
      reason: body.reason,
      expires_at: expiresAt,
    })
    .select(`
      *,
      requester:brokers!requester_id(id, name, email),
      target_broker:brokers!target_broker_id(id, name, email)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message || 'Erro ao criar solicitação de troca' }, { status: 500 })
  }

  logAudit({
    user_id: user!.id,
    action: 'create',
    entity_type: 'duty_swap_request',
    entity_id: swap.id,
    new_data: body as Record<string, unknown>,
    ...getRequestMeta(req),
  })

  return NextResponse.json(swap, { status: 201 })
}, { auth: true })

// ── PATCH /api/plantao/trocas ─────────────────────────────────────────────────
// Respond to a swap request.
// - accept/reject: target broker action
// - approve/reject_manager: manager/admin approval after target accepts
// - cancel: requester cancels their own request
export const PATCH = apiHandler(respondSwapSchema, async (req: NextRequest, body: z.infer<typeof respondSwapSchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  const role = await getUserRole(user!.id)
  const isPrivileged = ['admin', 'manager'].includes(role)

  const { data: selfBroker } = await supabase
    .from('brokers')
    .select('id')
    .eq('user_id', user!.id)
    .maybeSingle()

  // Fetch the swap request with full context
  const { data: swap } = await supabase
    .from('duty_swap_requests')
    .select(`
      *,
      requester_schedule:duty_schedules!requester_schedule_id(
        id, broker_id, schedule_date, start_time, end_time, location_id, time_slot_id, week_cycle_id
      ),
      target_schedule:duty_schedules!target_schedule_id(
        id, broker_id, schedule_date, start_time, end_time, location_id, time_slot_id, week_cycle_id
      )
    `)
    .eq('id', body.swap_id)
    .single()

  if (!swap) {
    return NextResponse.json({ error: 'Solicitação de troca não encontrada' }, { status: 404 })
  }

  // Authorization checks per action
  if (body.action === 'cancel') {
    // Only the requester or admin can cancel
    if (!isPrivileged && selfBroker?.id !== swap.requester_id) {
      return NextResponse.json({ error: 'Apenas o solicitante ou admin pode cancelar esta troca.' }, { status: 403 })
    }
    if (!['pending', 'accepted'].includes(swap.status as string)) {
      return NextResponse.json({ error: `Troca não pode ser cancelada. Status: ${swap.status}` }, { status: 422 })
    }
  } else if (body.action === 'accept' || body.action === 'reject') {
    // Only the target broker or admin can accept/reject
    if (!isPrivileged && selfBroker?.id !== swap.target_broker_id) {
      return NextResponse.json({ error: 'Apenas o corretor alvo pode responder a esta troca.' }, { status: 403 })
    }
    if (swap.status !== 'pending') {
      return NextResponse.json({ error: `Troca não está pendente. Status: ${swap.status}` }, { status: 422 })
    }
  } else if (body.action === 'approve' || body.action === 'reject_manager') {
    // Only manager/admin can approve/reject at management level
    if (!isPrivileged) {
      return NextResponse.json({ error: 'Apenas gestores podem aprovar ou rejeitar trocas.' }, { status: 403 })
    }
    if (swap.status !== 'accepted') {
      return NextResponse.json({ error: `Troca deve estar em estado "accepted" para aprovação gerencial. Status: ${swap.status}` }, { status: 422 })
    }
  }

  const statusMap: Record<string, string> = {
    accept: 'accepted',
    reject: 'rejected',
    approve: 'approved',
    reject_manager: 'rejected',
    cancel: 'cancelled',
  }
  const newStatus = statusMap[body.action] as string

  // If approving: execute the swap atomically
  if (body.action === 'approve' && swap.target_schedule_id) {
    const reqSched = swap.requester_schedule as Record<string, string>
    const tgtSched = swap.target_schedule as Record<string, string>

    if (!reqSched || !tgtSched) {
      return NextResponse.json({ error: 'Escalas envolvidas na troca não encontradas' }, { status: 422 })
    }

    // Swap broker assignments on both schedules
    const [updateReq, updateTgt] = await Promise.all([
      supabase
        .from('duty_schedules')
        .update({ broker_id: tgtSched.broker_id, status: 'swapped', updated_at: new Date().toISOString() })
        .eq('id', reqSched.id),
      supabase
        .from('duty_schedules')
        .update({ broker_id: reqSched.broker_id, status: 'swapped', updated_at: new Date().toISOString() })
        .eq('id', tgtSched.id),
    ])

    if (updateReq.error || updateTgt.error) {
      return NextResponse.json({
        error: 'Erro ao executar troca de escalas. Operação revertida.',
        details: updateReq.error?.message || updateTgt.error?.message,
      }, { status: 500 })
    }

    logAudit({
      user_id: user!.id,
      action: 'swap_executed',
      entity_type: 'duty_swap_request',
      entity_id: swap.id,
      old_data: { requester_schedule_broker: reqSched.broker_id, target_schedule_broker: tgtSched.broker_id },
      new_data: { requester_schedule_broker: tgtSched.broker_id, target_schedule_broker: reqSched.broker_id },
      ...getRequestMeta(req),
    })
  }

  // Update swap request status
  const { data: updatedSwap, error: updateError } = await supabase
    .from('duty_swap_requests')
    .update({
      status: newStatus,
      response_notes: body.response_notes ?? null,
      reviewed_by: ['approve', 'reject_manager'].includes(body.action) ? user!.id : swap.reviewed_by,
      reviewed_at: ['approve', 'reject_manager'].includes(body.action) ? new Date().toISOString() : swap.reviewed_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.swap_id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message || 'Erro ao atualizar troca' }, { status: 500 })
  }

  logAudit({
    user_id: user!.id,
    action: `swap.${body.action}`,
    entity_type: 'duty_swap_request',
    entity_id: body.swap_id,
    old_data: { status: swap.status } as Record<string, unknown>,
    new_data: { status: newStatus, response_notes: body.response_notes } as Record<string, unknown>,
    ...getRequestMeta(req),
  })

  return NextResponse.json(updatedSwap)
}, { auth: true })
