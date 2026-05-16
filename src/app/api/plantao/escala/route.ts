import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { logAudit, getRequestMeta, getUserRole } from '@/lib/governance'

// ── Schemas ──────────────────────────────────────────────────────────────────

const bookSlotSchema = z.object({
  location_id: z.string().uuid('location_id inválido'),
  time_slot_id: z.string().uuid('time_slot_id inválido'),
  schedule_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'schedule_date deve ser YYYY-MM-DD'),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'start_time deve ser HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'end_time deve ser HH:MM'),
  week_cycle_id: z.string().uuid('week_cycle_id inválido'),
  // Optional: admin/manager can book for another broker
  broker_id: z.string().uuid().optional(),
})

const cancelScheduleSchema = z.object({
  schedule_id: z.string().uuid('schedule_id inválido'),
  cancel_reason: z.string().min(3, 'Motivo é obrigatório').max(500),
})

// ── GET /api/plantao/escala ───────────────────────────────────────────────────
// Returns schedule data with optional filters.
// Query params: ?location_id= ?broker_id= ?date= ?week_cycle_id= ?week_start= ?week_end=
// Returns calendar view grouped by date.
export const GET = apiHandler(null, async (req: NextRequest, _body: unknown, ctx: ApiContext) => {
  const { supabase, user } = ctx
  const { searchParams } = new URL(req.url)

  const location_id = searchParams.get('location_id')
  const broker_id_param = searchParams.get('broker_id')
  const date = searchParams.get('date')
  const week_cycle_id = searchParams.get('week_cycle_id')
  const week_start = searchParams.get('week_start')
  const week_end = searchParams.get('week_end')
  const calendar_view = searchParams.get('calendar_view') !== 'false'

  let query = supabase
    .from('duty_schedules')
    .select(`
      *,
      location:duty_locations(id, name, location_type, address),
      time_slot:duty_time_slots(id, label, start_time, end_time),
      broker:brokers(id, name, email, avatar_url)
    `)
    .not('status', 'eq', 'cancelled')
    .order('schedule_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (location_id) query = query.eq('location_id', location_id)
  if (broker_id_param) query = query.eq('broker_id', broker_id_param)
  if (date) query = query.eq('schedule_date', date)
  if (week_cycle_id) query = query.eq('week_cycle_id', week_cycle_id)
  if (week_start) query = query.gte('schedule_date', week_start)
  if (week_end) query = query.lte('schedule_date', week_end)

  // Default to current week if no date filter is provided
  if (!date && !week_cycle_id && !week_start && !week_end) {
    const now = new Date()
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - dayOfWeek + 1)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    query = query
      .gte('schedule_date', monday.toISOString().slice(0, 10))
      .lte('schedule_date', sunday.toISOString().slice(0, 10))
  }

  const { data: schedules, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message || 'Erro ao buscar escala' }, { status: 500 })
  }

  if (!calendar_view) {
    return NextResponse.json({ data: schedules ?? [], count: (schedules ?? []).length })
  }

  // Group by date for calendar view
  const byDate: Record<string, typeof schedules> = {}
  for (const sched of schedules ?? []) {
    const d = sched.schedule_date as string
    if (!byDate[d]) byDate[d] = []
    byDate[d]!.push(sched)
  }

  const days = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, schedules]) => ({ date, schedules }))

  return NextResponse.json({ data: days, total_schedules: (schedules ?? []).length })
}, { auth: true })

// ── POST /api/plantao/escala ──────────────────────────────────────────────────
// Book a duty slot for the current broker (or another if admin/manager).
// Uses advisory lock to prevent double-booking race conditions.
export const POST = apiHandler(bookSlotSchema, async (req: NextRequest, body: z.infer<typeof bookSlotSchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  const role = await getUserRole(user!.id)
  const isPrivileged = ['admin', 'manager'].includes(role)

  // Resolve broker id
  let brokerId: string

  if (body.broker_id && isPrivileged) {
    const { data: targetBroker } = await supabase
      .from('brokers')
      .select('id')
      .eq('id', body.broker_id)
      .single()
    if (!targetBroker) return NextResponse.json({ error: 'Corretor alvo não encontrado' }, { status: 404 })
    brokerId = targetBroker.id
  } else if (body.broker_id && !isPrivileged) {
    const { data: selfBroker } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user!.id)
      .single()
    if (!selfBroker || selfBroker.id !== body.broker_id) {
      return NextResponse.json({ error: 'Você só pode reservar plantões para si mesmo.' }, { status: 403 })
    }
    brokerId = selfBroker.id
  } else {
    const { data: selfBroker } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user!.id)
      .single()
    if (!selfBroker) return NextResponse.json({ error: 'Corretor não encontrado para este usuário' }, { status: 404 })
    brokerId = selfBroker.id
  }

  // Validate cycle is open
  const { data: cycle } = await supabase
    .from('duty_week_cycles')
    .select('id, status, selection_opens, selection_closes')
    .eq('id', body.week_cycle_id)
    .single()

  if (!cycle) return NextResponse.json({ error: 'Ciclo semanal não encontrado' }, { status: 404 })

  if (!isPrivileged && cycle.status !== 'open') {
    return NextResponse.json({ error: `O ciclo não está aberto. Status: ${cycle.status}` }, { status: 422 })
  }

  // Check broker is not already booked for this date/time
  const { data: existingBooking } = await supabase
    .from('duty_schedules')
    .select('id')
    .eq('broker_id', brokerId)
    .eq('schedule_date', body.schedule_date)
    .eq('start_time', body.start_time)
    .eq('end_time', body.end_time)
    .not('status', 'in', '("cancelled","swapped")')
    .maybeSingle()

  if (existingBooking) {
    return NextResponse.json({
      error: 'Corretor já possui plantão neste horário/data.',
    }, { status: 409 })
  }

  // Capacity enforcement is handled by the DB trigger trg_check_duty_slot_capacity
  // which raises a SLOT_FULL exception if the max_brokers limit is reached.
  // An additional advisory lock at the DB level can be achieved via a Supabase
  // Edge Function or stored procedure. Here we rely on the trigger + UNIQUE
  // constraint for correctness under concurrent requests.

  const { data: schedule, error: insertError } = await supabase
    .from('duty_schedules')
    .insert({
      week_cycle_id: body.week_cycle_id,
      location_id: body.location_id,
      time_slot_id: body.time_slot_id,
      broker_id: brokerId,
      schedule_date: body.schedule_date,
      start_time: body.start_time,
      end_time: body.end_time,
      status: 'confirmed',
      booked_by: user!.id,
    })
    .select(`
      *,
      location:duty_locations(id, name, location_type),
      time_slot:duty_time_slots(id, label, start_time, end_time),
      broker:brokers(id, name, email, avatar_url)
    `)
    .single()

  if (insertError) {
    // DB trigger raises SLOT_FULL when capacity is exceeded
    if (insertError.message?.includes('SLOT_FULL') || insertError.code === 'P0001') {
      // Add to waitlist automatically
      const { data: waitlistPos } = await supabase
        .from('duty_waitlist')
        .select('position')
        .eq('location_id', body.location_id)
        .eq('time_slot_id', body.time_slot_id)
        .eq('schedule_date', body.schedule_date)
        .eq('status', 'waiting')
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextPosition = ((waitlistPos?.position ?? 0) as number) + 1

      const { data: waitlistEntry } = await supabase
        .from('duty_waitlist')
        .upsert({
          location_id: body.location_id,
          time_slot_id: body.time_slot_id,
          broker_id: brokerId,
          schedule_date: body.schedule_date,
          week_cycle_id: body.week_cycle_id,
          position: nextPosition,
          status: 'waiting',
        }, { onConflict: 'location_id,time_slot_id,schedule_date,broker_id' })
        .select()
        .single()

      return NextResponse.json({
        error: 'Slot lotado. Você foi adicionado à lista de espera.',
        waitlist: waitlistEntry,
        position: nextPosition,
      }, { status: 409 })
    }

    // Unique constraint: broker already booked
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Corretor já possui plantão neste horário/data.' }, { status: 409 })
    }

    return NextResponse.json({ error: insertError.message || 'Erro ao reservar plantão' }, { status: 500 })
  }

  logAudit({
    user_id: user!.id,
    action: 'create',
    entity_type: 'duty_schedule',
    entity_id: schedule.id,
    new_data: body as Record<string, unknown>,
    ...getRequestMeta(req),
  })

  return NextResponse.json(schedule, { status: 201 })
}, { auth: true })

// ── DELETE /api/plantao/escala ────────────────────────────────────────────────
// Cancel a schedule.
// Broker can cancel their own; manager/admin can cancel any.
// Checks waitlist and promotes next broker if applicable.
export const DELETE = apiHandler(cancelScheduleSchema, async (req: NextRequest, body: z.infer<typeof cancelScheduleSchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  const role = await getUserRole(user!.id)
  const isPrivileged = ['admin', 'manager'].includes(role)

  // Fetch the schedule
  const { data: schedule } = await supabase
    .from('duty_schedules')
    .select('*')
    .eq('id', body.schedule_id)
    .single()

  if (!schedule) {
    return NextResponse.json({ error: 'Escala não encontrada' }, { status: 404 })
  }

  if (schedule.status === 'cancelled') {
    return NextResponse.json({ error: 'Escala já está cancelada' }, { status: 409 })
  }

  // Permission check: broker can only cancel their own
  if (!isPrivileged) {
    const { data: selfBroker } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user!.id)
      .single()
    if (!selfBroker || selfBroker.id !== schedule.broker_id) {
      return NextResponse.json({ error: 'Você só pode cancelar seus próprios plantões.' }, { status: 403 })
    }
  }

  // Check late cancellation (< 24h before schedule)
  const scheduleDateTime = new Date(`${schedule.schedule_date}T${schedule.start_time}`)
  const hoursUntilSchedule = (scheduleDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  const isLateCancellation = hoursUntilSchedule < 24 && hoursUntilSchedule > 0

  // Update schedule to cancelled
  const { data: cancelledSchedule, error: cancelError } = await supabase
    .from('duty_schedules')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: user!.id,
      cancel_reason: body.cancel_reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.schedule_id)
    .select()
    .single()

  if (cancelError) {
    return NextResponse.json({ error: cancelError.message || 'Erro ao cancelar escala' }, { status: 500 })
  }

  logAudit({
    user_id: user!.id,
    action: 'cancel',
    entity_type: 'duty_schedule',
    entity_id: body.schedule_id,
    old_data: schedule as Record<string, unknown>,
    new_data: { status: 'cancelled', cancel_reason: body.cancel_reason, is_late_cancellation: isLateCancellation } as Record<string, unknown>,
    ...getRequestMeta(req),
  })

  // Waitlist promotion: find the next person in line
  const { data: nextInLine } = await supabase
    .from('duty_waitlist')
    .select('*, broker:brokers(id, name, email)')
    .eq('location_id', schedule.location_id)
    .eq('time_slot_id', schedule.time_slot_id)
    .eq('schedule_date', schedule.schedule_date)
    .eq('status', 'waiting')
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle()

  let promoted = null

  if (nextInLine) {
    // Promote them to a confirmed schedule
    const { data: promotedSchedule, error: promoteError } = await supabase
      .from('duty_schedules')
      .insert({
        week_cycle_id: schedule.week_cycle_id,
        location_id: schedule.location_id,
        time_slot_id: schedule.time_slot_id,
        broker_id: nextInLine.broker_id,
        schedule_date: schedule.schedule_date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        status: 'confirmed',
        booked_by: user!.id,
        notes: `Promovido da lista de espera (posição ${nextInLine.position})`,
      })
      .select()
      .single()

    if (!promoteError) {
      // Mark waitlist entry as promoted
      await supabase
        .from('duty_waitlist')
        .update({ status: 'promoted' })
        .eq('id', nextInLine.id)

      promoted = promotedSchedule

      logAudit({
        user_id: user!.id,
        action: 'promote_from_waitlist',
        entity_type: 'duty_schedule',
        entity_id: promotedSchedule.id,
        new_data: { waitlist_id: nextInLine.id, promoted_broker_id: nextInLine.broker_id } as Record<string, unknown>,
        ...getRequestMeta(req),
      })
    }
  }

  return NextResponse.json({
    cancelled: cancelledSchedule,
    is_late_cancellation: isLateCancellation,
    promoted_from_waitlist: promoted,
  })
}, { auth: true })
