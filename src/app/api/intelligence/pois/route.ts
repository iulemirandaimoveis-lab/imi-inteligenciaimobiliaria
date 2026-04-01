import { NextRequest, NextResponse } from 'next/server'
import { fetchNearbyPOIs } from '@/lib/poi-service'
import { geocodeAddress } from '@/lib/geocode'

export const runtime = 'nodejs'

// GET /api/intelligence/pois?lat=-8.05&lng=-34.87
// GET /api/intelligence/pois?address=Rua+Jarangari,53,Piedade,PE
// Public endpoint — returns nearby POIs (schools, hospitals, markets, etc.)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    let lat = parseFloat(searchParams.get('lat') || '')
    let lng = parseFloat(searchParams.get('lng') || '')
    const address = searchParams.get('address') || ''

    // If lat/lng invalid or zero, try geocoding from address
    if ((isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) && address) {
        const geo = await geocodeAddress(address)
        if (geo) {
            lat = geo.lat
            lng = geo.lng
        }
    }

    if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json({ error: 'Parametros lat/lng ou address obrigatorios' }, { status: 400 })
    }

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
