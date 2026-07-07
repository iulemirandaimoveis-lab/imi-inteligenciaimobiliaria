/**
 * Geodesic distance helpers. Shared by every provider and the scorer.
 * Mirrors the haversine used in `src/lib/poi-service.ts` (kept in sync).
 */

import type { BoundingBox, GeoPoint } from '../types'

const EARTH_RADIUS_M = 6_371_000

const toRad = (deg: number) => (deg * Math.PI) / 180

/** Great-circle distance between two points, in meters. */
export function haversine(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/**
 * Bounding box around a center for a given radius (meters).
 * Returns [south, west, north, east] — the order Overpass expects.
 */
export function boundingBox(center: GeoPoint, radiusMeters: number): BoundingBox {
  const latDelta = (radiusMeters / EARTH_RADIUS_M) * (180 / Math.PI)
  const lngDelta =
    (radiusMeters / (EARTH_RADIUS_M * Math.cos(toRad(center.lat)))) *
    (180 / Math.PI)
  return [
    center.lat - latDelta,
    center.lng - lngDelta,
    center.lat + latDelta,
    center.lng + lngDelta,
  ]
}

/** Offset a point by (north, east) meters — used to draw radial polygons. */
export function offsetPoint(
  center: GeoPoint,
  northMeters: number,
  eastMeters: number,
): GeoPoint {
  const dLat = (northMeters / EARTH_RADIUS_M) * (180 / Math.PI)
  const dLng =
    (eastMeters / (EARTH_RADIUS_M * Math.cos(toRad(center.lat)))) *
    (180 / Math.PI)
  return { lat: center.lat + dLat, lng: center.lng + dLng }
}
