/**
 * IMI Geo Intelligence Engine — Observability
 * ------------------------------------------------------------------
 * Lightweight, dependency-free instrumentation for the geo layer:
 *  - structured log lines (prefixed `[geo]`) that play well with Vercel logs
 *  - an in-memory ring buffer of recent samples the backoffice can read to
 *    show provider health, response times and failure rates.
 *
 * This is intentionally process-local (no DB writes on the hot path). For
 * durable metrics, a consumer can periodically flush `getMetrics()` to
 * Supabase — documented as a roadmap item, not required for v1.
 */

import type { GeoMetricSample, GeoProviderId } from '../types'

const RING_SIZE = 200
const ring: GeoMetricSample[] = []

function push(sample: GeoMetricSample) {
  ring.push(sample)
  if (ring.length > RING_SIZE) ring.shift()
}

export function record(sample: Omit<GeoMetricSample, 'at'>): void {
  const full: GeoMetricSample = { ...sample, at: new Date().toISOString() }
  push(full)
  if (!full.ok) {
    console.warn(
      `[geo] ${full.provider}.${full.operation} failed in ${full.elapsedMs}ms: ${full.error ?? 'unknown'}`,
    )
  }
}

/** Time an async operation and record a metric sample around it. */
export async function timed<T>(
  provider: GeoProviderId,
  operation: GeoMetricSample['operation'],
  fn: () => Promise<T>,
  countOf?: (result: T) => number,
): Promise<T> {
  const started = Date.now()
  try {
    const result = await fn()
    record({
      provider,
      operation,
      elapsedMs: Date.now() - started,
      ok: true,
      count: countOf ? countOf(result) : undefined,
    })
    return result
  } catch (err) {
    record({
      provider,
      operation,
      elapsedMs: Date.now() - started,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
    throw err
  }
}

export function getMetrics(): GeoMetricSample[] {
  return [...ring]
}

/** Aggregate the ring buffer into per-provider health summaries. */
export function getProviderStats(): Array<{
  provider: GeoProviderId
  calls: number
  failures: number
  avgMs: number
}> {
  const byProvider = new Map<GeoProviderId, GeoMetricSample[]>()
  for (const s of ring) {
    const arr = byProvider.get(s.provider) ?? []
    arr.push(s)
    byProvider.set(s.provider, arr)
  }
  return [...byProvider.entries()].map(([provider, samples]) => ({
    provider,
    calls: samples.length,
    failures: samples.filter((s) => !s.ok).length,
    avgMs: Math.round(
      samples.reduce((sum, s) => sum + s.elapsedMs, 0) / samples.length,
    ),
  }))
}
