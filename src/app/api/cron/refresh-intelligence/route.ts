import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/cron/refresh-intelligence
// Vercel cron: runs daily at 06:00 UTC (03:00 Brasília)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // Try RPC first (fast path)
    const { error: rpcError } = await supabase.rpc('refresh_neighborhood_intelligence')

    if (!rpcError) {
      return NextResponse.json({ success: true, method: 'rpc', ts: new Date().toISOString() })
    }

    // Fallback: manual recalculation from development_units
    const { data: units, error: unitsError } = await supabase
      .from('development_units')
      .select(`
        price,
        area,
        developments!inner(
          neighborhood,
          city,
          state
        )
      `)
      .gt('price', 0)
      .gt('area', 0)

    if (unitsError) {
      return NextResponse.json({ error: 'Failed to fetch units', details: unitsError.message }, { status: 500 })
    }

    if (!units || units.length === 0) {
      return NextResponse.json({ success: true, method: 'manual', updated: 0, message: 'No units found' })
    }

    type Group = { prices_sqm: number[]; neighborhood: string; city: string; state: string }
    const groups: Record<string, Group> = {}

    for (const unit of units) {
      const dev = unit.developments as unknown as { neighborhood: string; city: string; state: string }
      if (!dev?.neighborhood || !dev?.city) continue
      const key = `${dev.neighborhood}|${dev.city}|${dev.state ?? 'PE'}`
      if (!groups[key]) {
        groups[key] = { prices_sqm: [], neighborhood: dev.neighborhood, city: dev.city, state: dev.state ?? 'PE' }
      }
      groups[key].prices_sqm.push(unit.price / unit.area)
    }

    let updated = 0
    for (const group of Object.values(groups)) {
      const sorted = group.prices_sqm.sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length

      const { error } = await supabase
        .from('neighborhood_intelligence')
        .upsert({
          neighborhood: group.neighborhood,
          city: group.city,
          state: group.state,
          median_price_sqm: Math.round(median),
          avg_price_sqm: Math.round(avg),
          inventory_count: group.prices_sqm.length,
          data_source: 'imi_calculated',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'neighborhood,city,state' })

      if (!error) updated++
    }

    return NextResponse.json({
      success: true,
      method: 'manual',
      updated,
      total: Object.keys(groups).length,
      ts: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
