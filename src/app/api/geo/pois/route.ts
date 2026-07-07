/**
 * GET /api/geo/pois — IMI Geo Intelligence Engine
 * ------------------------------------------------------------------
 * Unified, provider-abstracted POI + convenience-score endpoint.
 *
 *   /api/geo/pois?lat=-8.05&lng=-34.87&profile=residencial
 *   /api/geo/pois?address=Rua+X,+Recife,+PE&profile=short_stay
 *
 * Security: all provider keys (Google/Mapbox) are read server-side inside the
 * engine — nothing sensitive is exposed. Public endpoint → IP rate-limited.
 * Response is cached at the edge and in the engine's process cache.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { limiters, getClientIP } from '@/lib/rate-limit'
import { getGeoIntelligence, geocode } from '@/geo'
import { GEO_PROFILES } from '@/geo/config/categories'

export const runtime = 'nodejs'

const QuerySchema = z
  .object({
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    address: z.string().trim().min(3).max(200).optional(),
    profile: z
      .enum(Object.keys(GEO_PROFILES) as [string, ...string[]])
      .default('residencial'),
    radius: z.coerce.number().int().min(200).max(10_000).optional(),
  })
  .refine((v) => (v.lat != null && v.lng != null) || v.address, {
    message: 'Informe lat+lng ou address',
  })

export async function GET(request: NextRequest) {
  const ip = getClientIP(request)
  const rl = await limiters.public(ip)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns segundos.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetTime - Date.now()) / 1000)),
        },
      },
    )
  }

  const parsed = QuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  )
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parâmetros inválidos', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { lat, lng, address, profile, radius } = parsed.data

  let center = lat != null && lng != null ? { lat, lng } : null
  if (!center && address) {
    center = await geocode(address)
    if (!center) {
      return NextResponse.json(
        { error: 'Endereço não localizado' },
        { status: 404 },
      )
    }
  }
  if (!center || (center.lat === 0 && center.lng === 0)) {
    return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 })
  }

  try {
    const result = await getGeoIntelligence({
      center,
      profile: profile as keyof typeof GEO_PROFILES,
      radius,
    })
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (err) {
    console.error('[geo/pois] error:', err)
    return NextResponse.json(
      { error: 'Falha ao buscar inteligência geográfica' },
      { status: 502 },
    )
  }
}
