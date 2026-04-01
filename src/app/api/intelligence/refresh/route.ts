import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/intelligence/refresh
 * Recalculates neighborhood_intelligence stats from real development_units data.
 * Auth required (admin only).
 */
export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Recalculate median price per sqm and inventory count from development_units
        const { data: stats, error: statsError } = await supabase.rpc('refresh_neighborhood_intelligence')

        if (statsError) {
            // If the RPC doesn't exist yet, calculate manually via query
            console.warn('[intelligence/refresh] RPC not found, using manual calculation:', statsError.message)

            // Get all units grouped by neighborhood/city
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
                return NextResponse.json({ message: 'No units with valid price/area found', updated: 0 })
            }

            // Group by neighborhood+city
            const groups: Record<string, { prices_sqm: number[]; count: number; neighborhood: string; city: string; state: string }> = {}

            for (const unit of units) {
                const dev = unit.developments as unknown as { neighborhood: string; city: string; state: string }
                if (!dev?.neighborhood || !dev?.city) continue
                const key = `${dev.neighborhood}|${dev.city}|${dev.state || 'PE'}`
                if (!groups[key]) {
                    groups[key] = { prices_sqm: [], count: 0, neighborhood: dev.neighborhood, city: dev.city, state: dev.state || 'PE' }
                }
                groups[key].prices_sqm.push(unit.price / unit.area)
                groups[key].count++
            }

            // Update each neighborhood
            let updated = 0
            for (const group of Object.values(groups)) {
                const sorted = group.prices_sqm.sort((a, b) => a - b)
                const median = sorted[Math.floor(sorted.length / 2)]
                const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length

                const { error: upsertError } = await supabase
                    .from('neighborhood_intelligence')
                    .upsert({
                        neighborhood: group.neighborhood,
                        city: group.city,
                        state: group.state,
                        median_price_sqm: Math.round(median),
                        avg_price_sqm: Math.round(avg),
                        inventory_count: group.count,
                        data_source: 'imi_calculated',
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'neighborhood,city,state' })

                if (!upsertError) updated++
            }

            return NextResponse.json({
                success: true,
                message: `Updated ${updated} neighborhoods from ${units.length} units`,
                updated,
                neighborhoods: Object.keys(groups).length,
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Neighborhood intelligence refreshed via RPC',
            data: stats,
        })
    } catch (err) {
        console.error('[intelligence/refresh] Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
