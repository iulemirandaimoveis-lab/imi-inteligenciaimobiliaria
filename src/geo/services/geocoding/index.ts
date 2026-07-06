/**
 * Geocoding service. Wraps the existing shared Nominatim helper
 * (`src/lib/geocode.ts`) behind the engine's `GeoPoint` shape so consumers
 * depend on the engine, not a specific geocoder. A Google/Mapbox geocoder can
 * be slotted in here later without changing callers.
 */

import type { GeoPoint } from '../../types'
import { geocodeAddress } from '@/lib/geocode'
import { timed } from '../../observability'

export async function geocode(address: string): Promise<GeoPoint | null> {
  return timed('osm', 'geocode', async () => {
    const res = await geocodeAddress(address)
    return res ? { lat: res.lat, lng: res.lng } : null
  })
}
