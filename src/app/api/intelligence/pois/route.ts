import { NextRequest, NextResponse } from 'next/server'
import { fetchNearbyPOIs } from '@/lib/poi-service'

export const runtime = 'nodejs'

// GET /api/intelligence/pois?lat=-8.05&lng=-34.87
// Public endpoint — returns nearby POIs (schools, hospitals, markets, etc.)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const lat = parseFloat(searchParams.get('lat') || '')
    const lng = parseFloat(searchParams.get('lng') || '')

    if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json({ error: 'Parametros lat e lng obrigatorios' }, { status: 400 })
    }

    // Reject default/zero coords
    if (lat === 0 && lng === 0) {
        return NextResponse.json({ error: 'Coordenadas invalidas' }, { status: 400 })
    }

    try {
        const result = await fetchNearbyPOIs(lat, lng, 1500)
        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
            },
        })
    } catch (err) {
        console.error('[POI] Overpass error:', err)
        return NextResponse.json({ error: 'Erro ao buscar POIs' }, { status: 502 })
    }
}
