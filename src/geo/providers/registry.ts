/**
 * IMI Geo Intelligence Engine — Provider Registry
 * ------------------------------------------------------------------
 * Holds providers in priority order and runs them with automatic fallback:
 * the first available provider that returns a non-empty result wins. Every
 * attempt is timed and recorded for observability. A provider that throws is
 * treated as an empty result — the registry never rejects.
 *
 * This is the seam the whole "swap vendors without touching consumers" goal
 * hangs on: change the order (or add a provider) here, nothing else moves.
 */

import type {
  GeoCategoryConfig,
  GeoProvider,
  GeoQuery,
  ProviderFetchResult,
  ProviderHealth,
} from '../types'
import { record } from '../observability'

export class ProviderRegistry {
  private providers: GeoProvider[]

  constructor(providers: GeoProvider[]) {
    this.providers = providers
  }

  /** Providers that are currently configured & usable, in priority order. */
  available(): GeoProvider[] {
    return this.providers.filter((p) => p.isAvailable())
  }

  health(): ProviderHealth[] {
    return this.providers.map((p) => p.health())
  }

  /**
   * Try providers in order until one yields POIs. Returns the winning
   * provider's result plus the list of providers actually consulted (useful
   * for provenance in the API response).
   */
  async fetchWithFallback(
    query: GeoQuery,
    categories: GeoCategoryConfig[],
  ): Promise<{ result: ProviderFetchResult | null; consulted: GeoProvider[] }> {
    const consulted: GeoProvider[] = []
    for (const provider of this.available()) {
      consulted.push(provider)
      const started = Date.now()
      let pois
      try {
        pois = await provider.fetchPOIs(query, categories)
      } catch (err) {
        record({
          provider: provider.id,
          operation: 'fetchPOIs',
          elapsedMs: Date.now() - started,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        })
        continue
      }
      const elapsedMs = Date.now() - started
      record({
        provider: provider.id,
        operation: 'fetchPOIs',
        elapsedMs,
        ok: true,
        count: pois.length,
      })
      if (pois.length > 0) {
        return { result: { provider: provider.id, pois, elapsedMs }, consulted }
      }
    }
    return { result: null, consulted }
  }
}
