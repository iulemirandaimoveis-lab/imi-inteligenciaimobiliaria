import { NextRequest, NextResponse } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api-helpers'

export const runtime = 'nodejs'

// ─── GET /api/intelligence/neighborhood ────────────────────────────────────
// Public endpoint (no auth) for SEO benefit
// Query params: ?city=Recife  or  ?city=Recife&neighborhood=Boa Viagem
export const GET = apiHandler(null, async (request: NextRequest, _body: unknown, ctx: ApiContext) => {
    const { supabase } = ctx
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const neighborhood = searchParams.get('neighborhood')

    if ((!city || !city.trim()) && (!neighborhood || !neighborhood.trim())) {
        return NextResponse.json(
            { error: 'Parametro "city" ou "neighborhood" obrigatorio' },
            { status: 400 }
        )
    }

    // Specific neighborhood query — also return nearby neighborhoods for comparison
    if (neighborhood?.trim() && city?.trim()) {
        const { data: main, error: mainErr } = await supabase
            .from('neighborhood_intelligence')
            .select('*')
            .ilike('neighborhood', neighborhood)
            .ilike('city', city)
            .maybeSingle()

        if (mainErr) {
            return NextResponse.json({ error: mainErr.message }, { status: 500 })
        }

        if (!main) {
            return NextResponse.json(
                { error: `Dados nao encontrados para ${neighborhood}, ${city}` },
                { status: 404 }
            )
        }

        // Fetch other neighborhoods in same city for comparison
        const { data: nearby } = await supabase
            .from('neighborhood_intelligence')
            .select('*')
            .ilike('city', city)
            .neq('id', main.id)
            .order('median_price_sqm', { ascending: false })
            .limit(6)

        // Compute city averages from all neighborhoods
        const { data: allInCity } = await supabase
            .from('neighborhood_intelligence')
            .select('median_price_sqm, avg_price_sqm, price_trend_12m, walkability_score, transit_score, safety_score, avg_rental_yield, avg_days_on_market, vacancy_rate')
            .ilike('city', city)

        let cityAverage = null
        if (allInCity && allInCity.length > 0) {
            const avg = (arr: (number | null)[]): number | null => {
                const valid = arr.filter((v): v is number => v != null)
                return valid.length > 0 ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) / 100 : null
            }
            cityAverage = {
                median_price_sqm: avg(allInCity.map(r => r.median_price_sqm ? Number(r.median_price_sqm) : null)),
                avg_price_sqm: avg(allInCity.map(r => r.avg_price_sqm ? Number(r.avg_price_sqm) : null)),
                price_trend_12m: avg(allInCity.map(r => r.price_trend_12m ? Number(r.price_trend_12m) : null)),
                walkability_score: avg(allInCity.map(r => r.walkability_score)),
                transit_score: avg(allInCity.map(r => r.transit_score)),
                safety_score: avg(allInCity.map(r => r.safety_score)),
                avg_rental_yield: avg(allInCity.map(r => r.avg_rental_yield ? Number(r.avg_rental_yield) : null)),
                avg_days_on_market: avg(allInCity.map(r => r.avg_days_on_market)),
                vacancy_rate: avg(allInCity.map(r => r.vacancy_rate ? Number(r.vacancy_rate) : null)),
                neighborhood_count: allInCity.length,
            }
        }

        return NextResponse.json(
            { neighborhood: main, nearby: nearby || [], cityAverage },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
                },
            }
        )
    }

    // City-wide query — return all neighborhoods
    const { data, error } = await supabase
        .from('neighborhood_intelligence')
        .select('*')
        .ilike('city', city!)
        .order('median_price_sqm', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
        { neighborhoods: data || [], city },
        {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        }
    )
}, { auth: false, rateLimit: 'public' })
