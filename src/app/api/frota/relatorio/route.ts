import { NextRequest, NextResponse } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api-helpers'

// ─── Helper ───────────────────────────────────────────────────────────────────

async function getProfileRole(supabase: ApiContext['supabase'], userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  return data?.role ?? 'broker'
}

// ─── GET /api/frota/relatorio ─────────────────────────────────────────────────
//
// Query params:
//   ?type=custo_km         — cost per km per vehicle
//   ?type=corretor         — usage stats by broker
//   ?type=veiculo_historico — full history for a vehicle (?vehicle_id=)
//   ?type=suspeitos        — suspicious usages
//   ?start_date=           — ISO date filter (inclusive)
//   ?end_date=             — ISO date filter (inclusive)
//   ?vehicle_id=           — required for veiculo_historico
//   ?broker_id=            — optional for corretor filter

export const GET = apiHandler(null, async (req: NextRequest, _body: unknown, ctx: ApiContext) => {
  const { supabase, user } = ctx
  const { searchParams } = new URL(req.url)

  const role = await getProfileRole(supabase, user!.id)
  const isManager = ['admin', 'owner', 'broker_manager'].includes(role)
  if (!isManager) {
    return NextResponse.json({ error: 'Acesso negado. Relatórios são exclusivos para gestores.' }, { status: 403 })
  }

  const type = searchParams.get('type')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const vehicleId = searchParams.get('vehicle_id')
  const brokerId = searchParams.get('broker_id')

  // ── custo_km — cost per km per vehicle ──────────────────────────────────
  if (type === 'custo_km') {
    // Fetch all devolvido usages in date range
    let usageQuery = supabase
      .from('fleet_usages')
      .select('id, vehicle_id, km_initial, km_final, km_driven')
      .eq('status', 'devolvido')
    if (startDate) usageQuery = usageQuery.gte('created_at', startDate)
    if (endDate) usageQuery = usageQuery.lte('created_at', endDate)

    const { data: usages, error: usageErr } = await usageQuery
    if (usageErr) {
      console.error('[frota/relatorio] custo_km usages error:', usageErr)
      return NextResponse.json({ error: 'Erro ao calcular relatório' }, { status: 500 })
    }

    // Fetch all fuelings in date range
    let fuelQuery = supabase
      .from('fleet_fuelings')
      .select('vehicle_id, total_cost')
    if (startDate) fuelQuery = fuelQuery.gte('fueled_at', startDate)
    if (endDate) fuelQuery = fuelQuery.lte('fueled_at', endDate)

    const { data: fuelings, error: fuelErr } = await fuelQuery
    if (fuelErr) {
      console.error('[frota/relatorio] custo_km fuelings error:', fuelErr)
      return NextResponse.json({ error: 'Erro ao calcular relatório' }, { status: 500 })
    }

    // Fetch all completed maintenances in date range
    let maintQuery = supabase
      .from('fleet_maintenances')
      .select('vehicle_id, cost')
      .eq('status', 'concluida')
    if (startDate) maintQuery = maintQuery.gte('created_at', startDate)
    if (endDate) maintQuery = maintQuery.lte('created_at', endDate)

    const { data: maintenances, error: maintErr } = await maintQuery
    if (maintErr) {
      console.error('[frota/relatorio] custo_km maintenances error:', maintErr)
      return NextResponse.json({ error: 'Erro ao calcular relatório' }, { status: 500 })
    }

    // Fetch vehicle metadata
    const { data: vehicles } = await supabase
      .from('fleet_vehicles')
      .select('id, plate, brand, model, year')
      .eq('is_active', true)

    // Aggregate by vehicle_id
    const stats: Record<string, {
      vehicle_id: string; plate: string; brand: string; model: string; year: number
      total_km: number; total_fueling_cost: number; total_maintenance_cost: number; usages_count: number
    }> = {}

    const vehicleMap: Record<string, { plate: string; brand: string; model: string; year: number }> = {}
    for (const v of vehicles ?? []) {
      const veh = v as Record<string, unknown>
      vehicleMap[veh.id as string] = {
        plate: veh.plate as string,
        brand: veh.brand as string,
        model: veh.model as string,
        year: veh.year as number,
      }
    }

    for (const u of usages ?? []) {
      const usage = u as Record<string, unknown>
      const vid = usage.vehicle_id as string
      const kmDriven = (usage.km_driven as number | null) ?? 0
      if (!stats[vid]) {
        const vMeta = vehicleMap[vid] ?? { plate: vid, brand: '', model: '', year: 0 }
        stats[vid] = { vehicle_id: vid, ...vMeta, total_km: 0, total_fueling_cost: 0, total_maintenance_cost: 0, usages_count: 0 }
      }
      stats[vid].total_km += kmDriven
      stats[vid].usages_count += 1
    }

    for (const f of fuelings ?? []) {
      const fuel = f as Record<string, unknown>
      const vid = fuel.vehicle_id as string
      if (!stats[vid]) {
        const vMeta = vehicleMap[vid] ?? { plate: vid, brand: '', model: '', year: 0 }
        stats[vid] = { vehicle_id: vid, ...vMeta, total_km: 0, total_fueling_cost: 0, total_maintenance_cost: 0, usages_count: 0 }
      }
      stats[vid].total_fueling_cost += (fuel.total_cost as number) ?? 0
    }

    for (const m of maintenances ?? []) {
      const maint = m as Record<string, unknown>
      const vid = maint.vehicle_id as string
      if (!stats[vid]) {
        const vMeta = vehicleMap[vid] ?? { plate: vid, brand: '', model: '', year: 0 }
        stats[vid] = { vehicle_id: vid, ...vMeta, total_km: 0, total_fueling_cost: 0, total_maintenance_cost: 0, usages_count: 0 }
      }
      stats[vid].total_maintenance_cost += (maint.cost as number) ?? 0
    }

    const result = Object.values(stats).map((s) => {
      const totalCost = s.total_fueling_cost + s.total_maintenance_cost
      return {
        ...s,
        total_cost: totalCost,
        cost_per_km: s.total_km > 0 ? parseFloat((totalCost / s.total_km).toFixed(4)) : null,
        avg_km_per_trip: s.usages_count > 0 ? parseFloat((s.total_km / s.usages_count).toFixed(1)) : null,
      }
    }).sort((a, b) => (b.total_cost ?? 0) - (a.total_cost ?? 0))

    return NextResponse.json({ type, data: result, count: result.length })
  }

  // ── corretor — usage stats by broker ─────────────────────────────────────
  if (type === 'corretor') {
    let usageQuery = supabase
      .from('fleet_usages')
      .select('id, broker_id, km_driven, brokers(id, name)')
      .eq('status', 'devolvido')

    if (brokerId) usageQuery = usageQuery.eq('broker_id', brokerId)
    if (startDate) usageQuery = usageQuery.gte('created_at', startDate)
    if (endDate) usageQuery = usageQuery.lte('created_at', endDate)

    const { data: usages, error: usageErr } = await usageQuery
    if (usageErr) {
      console.error('[frota/relatorio] corretor error:', usageErr)
      return NextResponse.json({ error: 'Erro ao calcular relatório' }, { status: 500 })
    }

    // Fetch fuelings by broker in date range
    let fuelQuery = supabase
      .from('fleet_fuelings')
      .select('broker_id, total_cost')
    if (brokerId) fuelQuery = fuelQuery.eq('broker_id', brokerId)
    if (startDate) fuelQuery = fuelQuery.gte('fueled_at', startDate)
    if (endDate) fuelQuery = fuelQuery.lte('fueled_at', endDate)

    const { data: fuelings } = await fuelQuery

    const brokerStats: Record<string, {
      broker_id: string; broker_name: string
      total_usages: number; total_km: number; total_fueling_cost: number
    }> = {}

    for (const u of usages ?? []) {
      const usage = u as Record<string, unknown>
      const bid = usage.broker_id as string
      const brokerData = usage.brokers as { id: string; name: string } | null
      const brokerName = brokerData?.name ?? bid
      if (!brokerStats[bid]) {
        brokerStats[bid] = { broker_id: bid, broker_name: brokerName, total_usages: 0, total_km: 0, total_fueling_cost: 0 }
      }
      brokerStats[bid].total_usages += 1
      brokerStats[bid].total_km += (usage.km_driven as number | null) ?? 0
    }

    for (const f of fuelings ?? []) {
      const fuel = f as Record<string, unknown>
      const bid = fuel.broker_id as string
      if (brokerStats[bid]) {
        brokerStats[bid].total_fueling_cost += (fuel.total_cost as number) ?? 0
      }
    }

    const result = Object.values(brokerStats).map((s) => ({
      ...s,
      avg_km_per_trip: s.total_usages > 0 ? parseFloat((s.total_km / s.total_usages).toFixed(1)) : null,
    })).sort((a, b) => b.total_usages - a.total_usages)

    return NextResponse.json({ type, data: result, count: result.length })
  }

  // ── veiculo_historico — full history for a vehicle ────────────────────────
  if (type === 'veiculo_historico') {
    if (!vehicleId) {
      return NextResponse.json({ error: 'vehicle_id é obrigatório para este tipo de relatório.' }, { status: 400 })
    }

    const [vehicleResult, usagesResult, fuelingsResult, maintenancesResult] = await Promise.all([
      supabase
        .from('fleet_vehicles')
        .select('*')
        .eq('id', vehicleId)
        .maybeSingle(),
      supabase
        .from('fleet_usages')
        .select('*, broker:brokers(id, name, phone, avatar_url)')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false }),
      supabase
        .from('fleet_fuelings')
        .select('*, broker:brokers(id, name)')
        .eq('vehicle_id', vehicleId)
        .order('fueled_at', { ascending: false }),
      supabase
        .from('fleet_maintenances')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false }),
    ])

    if (!vehicleResult.data) {
      return NextResponse.json({ error: 'Veículo não encontrado.' }, { status: 404 })
    }

    return NextResponse.json({
      type,
      data: {
        vehicle: vehicleResult.data,
        usages: usagesResult.data ?? [],
        fuelings: fuelingsResult.data ?? [],
        maintenances: maintenancesResult.data ?? [],
      },
    })
  }

  // ── suspeitos — suspicious usages or computed anomalies ──────────────────
  if (type === 'suspeitos') {
    // Fetch explicitly flagged usages
    let flaggedQuery = supabase
      .from('fleet_usages')
      .select('*, vehicle:fleet_vehicles(id, plate, brand, model), broker:brokers(id, name)')
      .eq('is_suspicious', true)
    if (startDate) flaggedQuery = flaggedQuery.gte('created_at', startDate)
    if (endDate) flaggedQuery = flaggedQuery.lte('created_at', endDate)

    const { data: flagged, error: flaggedErr } = await flaggedQuery
    if (flaggedErr) {
      console.error('[frota/relatorio] suspeitos error:', flaggedErr)
      return NextResponse.json({ error: 'Erro ao buscar usos suspeitos' }, { status: 500 })
    }

    // Compute anomalies from non-flagged devolvido usages
    // Anomaly criteria:
    //   1. km_driven > 300 in a single trip
    //   2. pickup_at outside working hours (before 07:00 or after 21:00)
    let anomalyQuery = supabase
      .from('fleet_usages')
      .select('*, vehicle:fleet_vehicles(id, plate, brand, model), broker:brokers(id, name)')
      .eq('status', 'devolvido')
      .eq('is_suspicious', false)
      .gt('km_driven', 300)
    if (startDate) anomalyQuery = anomalyQuery.gte('created_at', startDate)
    if (endDate) anomalyQuery = anomalyQuery.lte('created_at', endDate)

    const { data: highKm } = await anomalyQuery

    // Off-hours: we add anomaly_reason client-side as this needs JS date parsing
    const flaggedIds = new Set((flagged ?? []).map((u: Record<string, unknown>) => u.id as string))

    const anomalies = (highKm ?? [])
      .filter((u: Record<string, unknown>) => !flaggedIds.has(u.id as string))
      .map((u: Record<string, unknown>) => ({
        ...u,
        anomaly_reason: `km_driven alto: ${u.km_driven} km`,
      }))

    // Off-hours anomalies (retirado between 21:00–07:00)
    let offHoursQuery = supabase
      .from('fleet_usages')
      .select('*, vehicle:fleet_vehicles(id, plate, brand, model), broker:brokers(id, name)')
      .eq('status', 'devolvido')
      .eq('is_suspicious', false)
      .not('pickup_at', 'is', null)
    if (startDate) offHoursQuery = offHoursQuery.gte('created_at', startDate)
    if (endDate) offHoursQuery = offHoursQuery.lte('created_at', endDate)

    const { data: allUsages } = await offHoursQuery

    const offHours = (allUsages ?? [])
      .filter((u: Record<string, unknown>) => {
        if (!u.pickup_at) return false
        const pickupHour = new Date(u.pickup_at as string).getHours()
        return pickupHour < 7 || pickupHour >= 21
      })
      .filter((u: Record<string, unknown>) => !flaggedIds.has(u.id as string))
      .map((u: Record<string, unknown>) => {
        const hour = new Date(u.pickup_at as string).getHours()
        return { ...u, anomaly_reason: `Retirada fora do horário comercial (${hour}h)` }
      })

    const seen = new Set<string>()
    const allSuspicious = [...(flagged ?? []), ...anomalies, ...offHours].filter((u) => {
      const id = (u as Record<string, unknown>).id as string
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    return NextResponse.json({ type, data: allSuspicious, count: allSuspicious.length })
  }

  return NextResponse.json(
    { error: 'Tipo de relatório inválido. Use: custo_km | corretor | veiculo_historico | suspeitos' },
    { status: 400 }
  )
}, { auth: true })
