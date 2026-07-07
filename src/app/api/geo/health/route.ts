/**
 * GET /api/geo/health — provider availability + recent metrics.
 * Powers the future backoffice observability panel. Reveals only which
 * providers are configured (booleans/reasons) and aggregate timings — never
 * key values. Rate-limited like any public endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { limiters, getClientIP } from '@/lib/rate-limit'
import { buildDefaultRegistry, getProviderStats } from '@/geo'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const rl = await limiters.public(getClientIP(request))
  if (!rl.success) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  }

  const registry = buildDefaultRegistry()
  return NextResponse.json(
    {
      providers: registry.health(),
      stats: getProviderStats(),
      generatedAt: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
