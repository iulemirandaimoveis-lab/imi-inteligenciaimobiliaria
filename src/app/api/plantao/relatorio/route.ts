import { NextRequest, NextResponse } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { getUserRole } from '@/lib/governance'
import type { BrokerKpiRow, LocationKpiRow, WeekSummaryRow } from '@/types/duty-roster'

// ── GET /api/plantao/relatorio ────────────────────────────────────────────────
// Management report (admin/manager only).
// ?type=broker    — broker KPIs
// ?type=location  — location occupancy
// ?type=week      — weekly summary
//
// Optional filters:
// ?week_cycle_id=, ?broker_id=, ?location_id=
// ?date_from=YYYY-MM-DD, ?date_to=YYYY-MM-DD
export const GET = apiHandler(null, async (req: NextRequest, _body: unknown, ctx: ApiContext) => {
  const { supabase, user } = ctx
  const { searchParams } = new URL(req.url)

  const role = await getUserRole(user!.id)
  const isPrivileged = ['admin', 'manager'].includes(role)

  if (!isPrivileged) {
    return NextResponse.json({ error: 'Acesso negado. Apenas admin/gestor pode acessar relatórios.' }, { status: 403 })
  }

  const reportType = searchParams.get('type') ?? 'week'
  const week_cycle_id = searchParams.get('week_cycle_id')
  const broker_id = searchParams.get('broker_id')
  const location_id = searchParams.get('location_id')
  const date_from = searchParams.get('date_from')
  const date_to = searchParams.get('date_to')

  // Build base filter for duty_schedules
  const buildBaseQuery = () => {
    let q = supabase
      .from('duty_schedules')
      .select('*')

    if (week_cycle_id) q = q.eq('week_cycle_id', week_cycle_id)
    if (broker_id) q = q.eq('broker_id', broker_id)
    if (location_id) q = q.eq('location_id', location_id)
    if (date_from) q = q.gte('schedule_date', date_from)
    if (date_to) q = q.lte('schedule_date', date_to)

    return q
  }

  // ── BROKER REPORT ────────────────────────────────────────────────────────
  if (reportType === 'broker') {
    const { data: schedules, error } = await buildBaseQuery()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Fetch broker names
    const brokerIds = [...new Set((schedules ?? []).map((s: { broker_id: string }) => s.broker_id))]
    const { data: brokers } = await supabase
      .from('brokers')
      .select('id, name')
      .in('id', brokerIds)

    const brokerMap: Record<string, string> = {}
    for (const b of brokers ?? []) {
      brokerMap[b.id] = b.name
    }

    // Fetch priority scores for the filtered cycle
    const priorityMap: Record<string, number> = {}
    if (week_cycle_id) {
      const { data: scores } = await supabase
        .from('broker_priority_scores')
        .select('broker_id, score')
        .eq('week_cycle_id', week_cycle_id)
        .in('broker_id', brokerIds)

      for (const s of scores ?? []) {
        priorityMap[s.broker_id] = s.score
      }
    }

    // Aggregate per broker
    const aggregated: Record<string, BrokerKpiRow> = {}

    for (const sched of schedules ?? []) {
      const bid = sched.broker_id as string
      if (!aggregated[bid]) {
        aggregated[bid] = {
          broker_id: bid,
          broker_name: brokerMap[bid] ?? 'Desconhecido',
          total_slots: 0,
          attended: 0,
          no_shows: 0,
          cancellations: 0,
          occupancy_rate: 0,
          leads_attended: 0,
          visits_done: 0,
          proposals_made: 0,
          sales_closed: 0,
          priority_score: priorityMap[bid] ?? null,
        }
      }

      const row = aggregated[bid]!
      row.total_slots++

      switch (sched.status) {
        case 'completed': row.attended++; break
        case 'no_show':   row.no_shows++; break
        case 'cancelled': row.cancellations++; break
      }

      row.leads_attended += sched.leads_attended ?? 0
      row.visits_done += sched.visits_done ?? 0
      row.proposals_made += sched.proposals_made ?? 0
      row.sales_closed += sched.sales_closed ?? 0
    }

    // Compute occupancy rates
    const rows = Object.values(aggregated).map(row => ({
      ...row,
      occupancy_rate: row.total_slots > 0
        ? Math.round((row.attended / row.total_slots) * 100)
        : 0,
    }))

    rows.sort((a, b) => b.total_slots - a.total_slots)

    return NextResponse.json({
      type: 'broker',
      filters: { week_cycle_id, broker_id, location_id, date_from, date_to },
      data: rows,
      count: rows.length,
    })
  }

  // ── LOCATION REPORT ───────────────────────────────────────────────────────
  if (reportType === 'location') {
    const { data: schedules, error } = await buildBaseQuery()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Fetch location names
    const locationIds = [...new Set((schedules ?? []).map((s: { location_id: string }) => s.location_id))]
    const { data: locations } = await supabase
      .from('duty_locations')
      .select('id, name, max_brokers_per_slot')
      .in('id', locationIds)

    const locationMap: Record<string, { name: string; max_brokers: number }> = {}
    for (const l of locations ?? []) {
      locationMap[l.id] = { name: l.name, max_brokers: l.max_brokers_per_slot }
    }

    // Fetch slot counts per location+date to compute total possible slots
    const { data: slots } = await supabase
      .from('duty_time_slots')
      .select('location_id, max_brokers')
      .in('location_id', locationIds)
      .eq('is_active', true)

    // Count active time slots per location
    const slotCountByLocation: Record<string, number> = {}
    for (const s of slots ?? []) {
      slotCountByLocation[s.location_id] = (slotCountByLocation[s.location_id] ?? 0) + 1
    }

    // Determine date range for occupancy
    const allDates = [...new Set((schedules ?? []).map((s: { schedule_date: string }) => s.schedule_date))]
    const dayCount = allDates.length || 1

    // Aggregate per location
    const aggregated: Record<string, LocationKpiRow> = {}

    for (const sched of schedules ?? []) {
      const lid = sched.location_id as string
      if (!aggregated[lid]) {
        const slotsPerDay = slotCountByLocation[lid] ?? 1
        const maxBrokers = locationMap[lid]?.max_brokers ?? 2
        aggregated[lid] = {
          location_id: lid,
          location_name: locationMap[lid]?.name ?? 'Desconhecido',
          total_slots: slotsPerDay * dayCount * maxBrokers,
          filled_slots: 0,
          occupancy_rate: 0,
          no_shows: 0,
          leads_total: 0,
          visits_total: 0,
          proposals_total: 0,
          sales_total: 0,
        }
      }

      const row = aggregated[lid]!

      if (!['cancelled', 'swapped'].includes(sched.status as string)) {
        row.filled_slots++
      }
      if (sched.status === 'no_show') row.no_shows++

      row.leads_total += sched.leads_attended ?? 0
      row.visits_total += sched.visits_done ?? 0
      row.proposals_total += sched.proposals_made ?? 0
      row.sales_total += sched.sales_closed ?? 0
    }

    const rows = Object.values(aggregated).map(row => ({
      ...row,
      occupancy_rate: row.total_slots > 0
        ? Math.round((row.filled_slots / row.total_slots) * 100)
        : 0,
    }))

    rows.sort((a, b) => b.occupancy_rate - a.occupancy_rate)

    return NextResponse.json({
      type: 'location',
      filters: { week_cycle_id, broker_id, location_id, date_from, date_to },
      data: rows,
      count: rows.length,
    })
  }

  // ── WEEKLY SUMMARY REPORT ─────────────────────────────────────────────────
  // Default: type=week
  let cyclesQuery = supabase
    .from('duty_week_cycles')
    .select('*')
    .order('week_start', { ascending: false })

  if (week_cycle_id) {
    cyclesQuery = cyclesQuery.eq('id', week_cycle_id)
  } else {
    // Default: last 12 weeks
    const twelveWeeksAgo = new Date()
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)
    cyclesQuery = cyclesQuery.gte('week_start', twelveWeeksAgo.toISOString().slice(0, 10))
  }

  const { data: cycles, error: cyclesError } = await cyclesQuery

  if (cyclesError) return NextResponse.json({ error: cyclesError.message }, { status: 500 })

  const cycleIds = (cycles ?? []).map((c: { id: string }) => c.id)

  // Fetch schedules for these cycles
  let schedulesQuery = supabase
    .from('duty_schedules')
    .select('week_cycle_id, status, leads_attended, visits_done, proposals_made, sales_closed')
    .in('week_cycle_id', cycleIds)

  if (location_id) schedulesQuery = schedulesQuery.eq('location_id', location_id)
  if (broker_id) schedulesQuery = schedulesQuery.eq('broker_id', broker_id)

  const { data: schedules, error: schedError } = await schedulesQuery

  if (schedError) return NextResponse.json({ error: schedError.message }, { status: 500 })

  // Aggregate per cycle
  const cycleMap: Record<string, WeekSummaryRow> = {}

  for (const cycle of cycles ?? []) {
    cycleMap[cycle.id] = {
      week_cycle_id: cycle.id,
      week_start: cycle.week_start,
      week_end: cycle.week_end,
      total_schedules: 0,
      confirmed: 0,
      cancelled: 0,
      no_shows: 0,
      completed: 0,
      overall_occupancy_rate: 0,
      total_leads: 0,
      total_sales: 0,
    }
  }

  for (const sched of schedules ?? []) {
    const cid = sched.week_cycle_id as string
    const row = cycleMap[cid]
    if (!row) continue

    row.total_schedules++

    switch (sched.status) {
      case 'confirmed':  row.confirmed++; break
      case 'cancelled':  row.cancelled++; break
      case 'no_show':    row.no_shows++; break
      case 'completed':  row.completed++; break
    }

    row.total_leads += sched.leads_attended ?? 0
    row.total_sales += sched.sales_closed ?? 0
  }

  const rows = Object.values(cycleMap).map(row => ({
    ...row,
    overall_occupancy_rate: row.total_schedules > 0
      ? Math.round(((row.confirmed + row.completed) / row.total_schedules) * 100)
      : 0,
  }))

  rows.sort((a, b) => b.week_start.localeCompare(a.week_start))

  return NextResponse.json({
    type: 'week',
    filters: { week_cycle_id, broker_id, location_id, date_from, date_to },
    data: rows,
    count: rows.length,
  })
}, { auth: true })
