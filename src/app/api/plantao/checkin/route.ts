import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { logAudit, getRequestMeta, getUserRole } from '@/lib/governance'

// ── Schemas ──────────────────────────────────────────────────────────────────

const checkinSchema = z.object({
  schedule_id: z.string().uuid('schedule_id inválido'),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  photo_url: z.string().url('URL de foto inválida').optional().nullable(),
  photo_metadata: z.record(z.unknown()).optional().nullable(),
})

const checkoutSchema = z.object({
  schedule_id: z.string().uuid('schedule_id inválido'),
  leads_attended: z.number().int().min(0).optional(),
  visits_done: z.number().int().min(0).optional(),
  proposals_made: z.number().int().min(0).optional(),
  sales_closed: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional().nullable(),
})

// Maximum minutes before or after scheduled start that check-in is allowed
const CHECKIN_WINDOW_MINUTES = 30

// ── POST /api/plantao/checkin ─────────────────────────────────────────────────
// Register check-in for a schedule.
// Validates timing (within 30 minutes of scheduled start).
export const POST = apiHandler(checkinSchema, async (req: NextRequest, body: z.infer<typeof checkinSchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  const role = await getUserRole(user!.id)
  const isPrivileged = ['admin', 'manager'].includes(role)

  // Fetch schedule
  const { data: schedule } = await supabase
    .from('duty_schedules')
    .select(`
      id, broker_id, schedule_date, start_time, end_time, status, checkin_at,
      location:duty_locations(id, name)
    `)
    .eq('id', body.schedule_id)
    .single()

  if (!schedule) {
    return NextResponse.json({ error: 'Escala não encontrada' }, { status: 404 })
  }

  // Permission: broker can only check in their own schedule
  if (!isPrivileged) {
    const { data: selfBroker } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (!selfBroker || selfBroker.id !== schedule.broker_id) {
      return NextResponse.json({ error: 'Você só pode fazer check-in em suas próprias escalas.' }, { status: 403 })
    }
  }

  if (schedule.status !== 'confirmed') {
    return NextResponse.json({
      error: `Check-in não permitido. Status da escala: ${schedule.status}`,
    }, { status: 422 })
  }

  if (schedule.checkin_at) {
    return NextResponse.json({ error: 'Check-in já realizado para esta escala.' }, { status: 409 })
  }

  // Validate timing: within ±30 minutes of scheduled start time
  const now = new Date()
  const scheduledStart = new Date(`${schedule.schedule_date}T${schedule.start_time}`)
  const minutesDiff = (now.getTime() - scheduledStart.getTime()) / (1000 * 60)

  if (!isPrivileged && (minutesDiff < -CHECKIN_WINDOW_MINUTES || minutesDiff > CHECKIN_WINDOW_MINUTES * 2)) {
    return NextResponse.json({
      error: `Check-in só é permitido entre ${CHECKIN_WINDOW_MINUTES} minutos antes e ${CHECKIN_WINDOW_MINUTES * 2} minutos após o horário de início (${schedule.start_time}).`,
      minutes_until_start: Math.round(-minutesDiff),
    }, { status: 422 })
  }

  const { data: updated, error } = await supabase
    .from('duty_schedules')
    .update({
      checkin_at: now.toISOString(),
      checkin_lat: body.lat ?? null,
      checkin_lng: body.lng ?? null,
      checkin_photo_url: body.photo_url ?? null,
      checkin_metadata: body.photo_metadata ?? {},
      updated_at: now.toISOString(),
    })
    .eq('id', body.schedule_id)
    .select(`
      *,
      location:duty_locations(id, name, location_type),
      time_slot:duty_time_slots(id, label, start_time, end_time),
      broker:brokers(id, name, email)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message || 'Erro ao registrar check-in' }, { status: 500 })
  }

  logAudit({
    user_id: user!.id,
    action: 'checkin',
    entity_type: 'duty_schedule',
    entity_id: body.schedule_id,
    new_data: {
      checkin_at: now.toISOString(),
      lat: body.lat,
      lng: body.lng,
      photo_url: body.photo_url,
    } as Record<string, unknown>,
    ...getRequestMeta(req),
  })

  return NextResponse.json(updated)
}, { auth: true })

// ── PATCH /api/plantao/checkin ────────────────────────────────────────────────
// Register checkout and record performance metrics.
export const PATCH = apiHandler(checkoutSchema, async (req: NextRequest, body: z.infer<typeof checkoutSchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  const role = await getUserRole(user!.id)
  const isPrivileged = ['admin', 'manager'].includes(role)

  // Fetch schedule
  const { data: schedule } = await supabase
    .from('duty_schedules')
    .select('id, broker_id, schedule_date, start_time, end_time, status, checkin_at, checkout_at')
    .eq('id', body.schedule_id)
    .single()

  if (!schedule) {
    return NextResponse.json({ error: 'Escala não encontrada' }, { status: 404 })
  }

  // Permission check
  if (!isPrivileged) {
    const { data: selfBroker } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (!selfBroker || selfBroker.id !== schedule.broker_id) {
      return NextResponse.json({ error: 'Você só pode fazer checkout em suas próprias escalas.' }, { status: 403 })
    }
  }

  if (!schedule.checkin_at) {
    return NextResponse.json({ error: 'Check-in ainda não foi realizado para esta escala.' }, { status: 422 })
  }

  if (schedule.checkout_at) {
    return NextResponse.json({ error: 'Checkout já realizado para esta escala.' }, { status: 409 })
  }

  if (schedule.status !== 'confirmed') {
    return NextResponse.json({
      error: `Checkout não permitido. Status da escala: ${schedule.status}`,
    }, { status: 422 })
  }

  const now = new Date()

  const { data: updated, error } = await supabase
    .from('duty_schedules')
    .update({
      checkout_at: now.toISOString(),
      status: 'completed',
      leads_attended: body.leads_attended ?? 0,
      visits_done: body.visits_done ?? 0,
      proposals_made: body.proposals_made ?? 0,
      sales_closed: body.sales_closed ?? 0,
      notes: body.notes ?? null,
      updated_at: now.toISOString(),
    })
    .eq('id', body.schedule_id)
    .select(`
      *,
      location:duty_locations(id, name, location_type),
      time_slot:duty_time_slots(id, label, start_time, end_time),
      broker:brokers(id, name, email)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message || 'Erro ao registrar checkout' }, { status: 500 })
  }

  logAudit({
    user_id: user!.id,
    action: 'checkout',
    entity_type: 'duty_schedule',
    entity_id: body.schedule_id,
    new_data: {
      checkout_at: now.toISOString(),
      leads_attended: body.leads_attended,
      visits_done: body.visits_done,
      proposals_made: body.proposals_made,
      sales_closed: body.sales_closed,
    } as Record<string, unknown>,
    ...getRequestMeta(req),
  })

  return NextResponse.json(updated)
}, { auth: true })
