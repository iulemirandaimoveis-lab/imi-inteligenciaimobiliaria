/**
 * Shared Nominatim geocoding utility.
 * Rate-limit: max 1 req/sec per Nominatim TOS.
 */

interface GeoResult {
    lat: number
    lng: number
}

export async function geocodeAddress(
    address?: string | null,
    neighborhood?: string | null,
    city?: string | null,
    state?: string | null,
    country?: string | null,
): Promise<GeoResult | null> {
    const parts = [address, neighborhood, city, state, country].filter(Boolean)
    if (parts.length === 0) return null

    const q = encodeURIComponent(parts.join(', '))

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
            { headers: { 'User-Agent': 'IMI-Inteligencia-Imobiliaria/1.0' } },
        )
        const results = await res.json()
        if (results?.[0]) {
            return {
                lat: parseFloat(results[0].lat),
                lng: parseFloat(results[0].lon),
            }
        }
    } catch {
        // Geocoding is best-effort
    }

    return null
}
