import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { logAudit, getRequestMeta, getUserRole } from '@/lib/governance'
import type { ScoreBreakdown } from '@/types/duty-roster'

// ── Score constants ───────────────────────────────────────────────────────────

const SCORE_BASE = 50
const SCORE_CHOSE_FIRST_LAST_WEEK = -20
const SCORE_FEWER_PREMIUM_SLOTS = +15
const SCORE_FEWER_TOTAL_SLOTS = +10
const SCORE_NO_SHOW_LAST_WEEK = -30
const SCORE_LATE_CANCELLATION = -20
const SCORE_COVERED_EMERGENCY = +10

// Premium shifts: Manhã and Tarde (not Noite)
const PREMIUM_LABELS = ['manhã', 'manha', 'tarde']

// ── Schemas ───────────────────────────────────────────────────────────────────

const calculatePrioritySchema = z.object({
  week_cycle_id: z.string().uuid('week_cycle_id inválido'),
  // Optional: recalculate only for specific brokers
  broker_ids: z.array(z.string().uuid()).optional(),
  // Previous cycle to compare against (defaults to the cycle immediately before)
  previous_cycle_id: z.string().uuid().optional().nullable(),
})

// ── GET /api/plantao/prioridade ───────────────────────────────────────────────
// Get broker priority scores for a given cycle.
// ?week_cycle_id=  — required
// ?broker_id=      — optional, filter to a single broker
export const GET = apiHandler(null, async (req: NextRequest, _body: unknown, ctx: ApiContext) => {
  const { supabase } = ctx
  const { searchParams } = new URL(req.url)

  const week_cycle_id = searchParams.get('week_cycle_id')
  const broker_id = searchParams.get('broker_id')

  if (!week_cycle_id) {
    return NextResponse.json({ error: 'Parâmetro week_cycle_id é obrigatório' }, { status: 400 })
  }

  let query = supabase
    .from('broker_priority_scores')
    .select(`
      *,
      broker:brokers(id, name, email, avatar_url),
      week_cycle:duty_week_cycles(id, week_start, week_end, status)
    `)
    .eq('week_cycle_id', week_cycle_id)
    .order('selection_order', { ascending: true })

  if (broker_id) {
    query = query.eq('broker_id', broker_id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message || 'Erro ao buscar scores de prioridade' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], count: (data ?? []).length })
}, { auth: true })

// ── POST /api/plantao/prioridade ──────────────────────────────────────────────
// Calculate/recalculate priority scores for a new week cycle.
// Admin only.
//
// Score rules:
//   Base:                   +50
//   Chose first last week:  -20
//   Fewer premium slots:    +15
//   Fewer total slots:      +10
//   No-show last week:      -30
//   Late cancellation:      -20
//   Covered emergency slot: +10
export const POST = apiHandler(calculatePrioritySchema, async (req: NextRequest, body: z.infer<typeof calculatePrioritySchema>, ctx: ApiContext) => {
  const { supabase, user } = ctx

  const role = await getUserRole(user!.id)
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado. Apenas admin pode calcular prioridades.' }, { status: 403 })
  }

  // Validate the target cycle exists
  const { data: targetCycle } = await supabase
    .from('duty_week_cycles')
    .select('id, week_start, week_end, status')
    .eq('id', body.week_cycle_id)
    .single()

  if (!targetCycle) {
    return NextResponse.json({ error: 'Ciclo semanal não encontrado' }, { status: 404 })
  }

  // Find the previous cycle (the most recent one before this week)
  let previousCycleId = body.previous_cycle_id

  if (!previousCycleId) {
    const { data: prevCycle } = await supabase
      .from('duty_week_cycles')
      .select('id, week_start')
      .lt('week_start', targetCycle.week_start)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle()

    previousCycleId = prevCycle?.id ?? null
  }

  // Fetch all active brokers (or just the specified ones)
  let brokersQuery = supabase
    .from('brokers')
    .select('id, name')
    .eq('status', 'active')

  if (body.broker_ids && body.broker_ids.length > 0) {
    brokersQuery = brokersQuery.in('id', body.broker_ids)
  }

  const { data: brokers, error: brokersError } = await brokersQuery

  if (brokersError || !brokers) {
    return NextResponse.json({ error: 'Erro ao buscar corretores' }, { status: 500 })
  }

  if (brokers.length === 0) {
    return NextResponse.json({ error: 'Nenhum corretor ativo encontrado' }, { status: 404 })
  }

  // Fetch previous cycle schedules (if there's a previous cycle)
  interface ScheduleRow {
    broker_id: string
    status: string
    cancelled_at: string | null
    schedule_date: string
    start_time: string
    end_time: string
    notes: string | null
    time_slot_id: string
    selection_order?: number | null
  }

  let prevSchedules: ScheduleRow[] = []
  let prevPriorityScores: { broker_id: string; selection_order: number | null }[] = []

  if (previousCycleId) {
    const { data: ps } = await supabase
      .from('duty_schedules')
      .select('broker_id, status, cancelled_at, schedule_date, start_time, end_time, notes, time_slot_id')
      .eq('week_cycle_id', previousCycleId)

    prevSchedules = (ps ?? []) as ScheduleRow[]

    const { data: scores } = await supabase
      .from('broker_priority_scores')
      .select('broker_id, selection_order')
      .eq('week_cycle_id', previousCycleId)

    prevPriorityScores = scores ?? []
  }

  // Fetch time slot labels to classify premium vs non-premium
  const slotIds = [...new Set(prevSchedules.map(s => s.time_slot_id).filter(Boolean))]
  let slotLabelMap: Record<string, string> = {}

  if (slotIds.length > 0) {
    const { data: timeSlots } = await supabase
      .from('duty_time_slots')
      .select('id, label')
      .in('id', slotIds)

    for (const ts of timeSlots ?? []) {
      slotLabelMap[ts.id] = ts.label?.toLowerCase() ?? ''
    }
  }

  // Compute average slots per broker from previous cycle (for "fewer" comparisons)
  const prevSchedulesByBroker: Record<string, ScheduleRow[]> = {}
  for (const sched of prevSchedules) {
    if (!prevSchedulesByBroker[sched.broker_id]) prevSchedulesByBroker[sched.broker_id] = []
    prevSchedulesByBroker[sched.broker_id]!.push(sched)
  }

  const allBrokerIds = brokers.map((b: { id: string; name: string }) => b.id)
  const totalSlotsAll = allBrokerIds.map((id: string) => (prevSchedulesByBroker[id] ?? []).filter((s: ScheduleRow) => !['cancelled', 'swapped'].includes(s.status)).length)
  const avgTotalSlots = totalSlotsAll.length > 0
    ? totalSlotsAll.reduce((a: number, b: number) => a + b, 0) / totalSlotsAll.length
    : 0

  const premiumSlotsAll = allBrokerIds.map((id: string) =>
    (prevSchedulesByBroker[id] ?? []).filter((s: ScheduleRow) =>
      !['cancelled', 'swapped'].includes(s.status) &&
      PREMIUM_LABELS.some(pl => (slotLabelMap[s.time_slot_id] ?? '').includes(pl))
    ).length
  )
  const avgPremiumSlots = premiumSlotsAll.length > 0
    ? premiumSlotsAll.reduce((a: number, b: number) => a + b, 0) / premiumSlotsAll.length
    : 0

  // Build selection order map from previous cycle (who chose first = selection_order = 1)
  const prevSelectionOrderMap: Record<string, number | null> = {}
  for (const s of prevPriorityScores) {
    prevSelectionOrderMap[s.broker_id] = s.selection_order
  }

  // Calculate scores for each broker
  const scoreRows: {
    broker_id: string
    week_cycle_id: string
    score: number
    selection_order: number | null
    score_breakdown: ScoreBreakdown
  }[] = []

  for (const broker of brokers) {
    const breakdown: ScoreBreakdown = { base: SCORE_BASE }
    let score = SCORE_BASE

    const prevScheds = prevSchedulesByBroker[broker.id] ?? []
    const confirmedPrev = prevScheds.filter(s => !['cancelled', 'swapped'].includes(s.status))

    // Chose first last week: selection_order = 1
    const prevOrder = prevSelectionOrderMap[broker.id]
    if (prevOrder === 1) {
      breakdown.chose_first_last_week = SCORE_CHOSE_FIRST_LAST_WEEK
      score += SCORE_CHOSE_FIRST_LAST_WEEK
    }

    // Fewer premium slots than average
    const brokerPremiumSlots = confirmedPrev.filter(s =>
      PREMIUM_LABELS.some(pl => (slotLabelMap[s.time_slot_id] ?? '').includes(pl))
    ).length
    if (brokerPremiumSlots < avgPremiumSlots) {
      breakdown.fewer_premium_slots = SCORE_FEWER_PREMIUM_SLOTS
      score += SCORE_FEWER_PREMIUM_SLOTS
    }

    // Fewer total slots than average
    const brokerTotalSlots = confirmedPrev.length
    if (brokerTotalSlots < avgTotalSlots) {
      breakdown.fewer_total_slots = SCORE_FEWER_TOTAL_SLOTS
      score += SCORE_FEWER_TOTAL_SLOTS
    }

    // No-show last week
    const noShows = prevScheds.filter(s => s.status === 'no_show').length
    if (noShows > 0) {
      breakdown.no_show_last_week = SCORE_NO_SHOW_LAST_WEEK * noShows
      score += SCORE_NO_SHOW_LAST_WEEK * noShows
    }

    // Late cancellations (< 24h before scheduled start)
    const lateCancels = prevScheds.filter(s => {
      if (s.status !== 'cancelled' || !s.cancelled_at) return false
      const cancelledAt = new Date(s.cancelled_at)
      const scheduledStart = new Date(`${s.schedule_date}T${s.start_time}`)
      const hoursBeforeStart = (scheduledStart.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60)
      return hoursBeforeStart < 24
    }).length

    if (lateCancels > 0) {
      breakdown.late_cancellation = SCORE_LATE_CANCELLATION * lateCancels
      score += SCORE_LATE_CANCELLATION * lateCancels
    }

    // Covered emergency slot (notes contain 'emergency' or 'emergência')
    const emergencySlots = prevScheds.filter(s =>
      s.status === 'completed' &&
      (s.notes?.toLowerCase().includes('emergência') || s.notes?.toLowerCase().includes('emergency'))
    ).length

    if (emergencySlots > 0) {
      breakdown.covered_emergency_slot = SCORE_COVERED_EMERGENCY * emergencySlots
      score += SCORE_COVERED_EMERGENCY * emergencySlots
    }

    // Floor score at 0
    score = Math.max(0, score)

    scoreRows.push({
      broker_id: broker.id,
      week_cycle_id: body.week_cycle_id,
      score,
      selection_order: null, // Will be assigned after ranking
      score_breakdown: breakdown,
    })
  }

  // Sort descending by score, assign selection_order (1 = highest priority)
  scoreRows.sort((a, b) => b.score - a.score)
  scoreRows.forEach((row, idx) => {
    row.selection_order = idx + 1
  })

  // Upsert all scores
  const { data: upserted, error: upsertError } = await supabase
    .from('broker_priority_scores')
    .upsert(scoreRows, { onConflict: 'broker_id,week_cycle_id' })
    .select(`
      *,
      broker:brokers(id, name, email)
    `)

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message || 'Erro ao salvar scores de prioridade' }, { status: 500 })
  }

  logAudit({
    user_id: user!.id,
    action: 'calculate',
    entity_type: 'broker_priority_scores',
    entity_id: body.week_cycle_id,
    new_data: {
      week_cycle_id: body.week_cycle_id,
      previous_cycle_id: previousCycleId,
      brokers_scored: scoreRows.length,
    } as Record<string, unknown>,
    ...getRequestMeta(req),
  })

  return NextResponse.json({
    data: upserted ?? scoreRows,
    count: scoreRows.length,
    week_cycle_id: body.week_cycle_id,
    previous_cycle_id: previousCycleId,
    averages: {
      avg_total_slots_last_week: Math.round(avgTotalSlots * 10) / 10,
      avg_premium_slots_last_week: Math.round(avgPremiumSlots * 10) / 10,
    },
  }, { status: 201 })
}, { auth: true })
