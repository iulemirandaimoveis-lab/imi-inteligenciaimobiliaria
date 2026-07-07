/**
 * Mapbox provider (scaffold).
 *
 * Wired into the abstraction so the registry order and backoffice provider
 * list are complete, but intentionally a no-op until `MAPBOX_TOKEN` (server
 * env) is set AND the search integration is filled in. Reports itself
 * unavailable without a token, so it never affects results today. This keeps
 * the "swap providers without touching consumers" contract honest: the seam
 * exists and is tested, the implementation lands when the vendor is chosen.
 */

import type {
  GeoCategoryConfig,
  GeoPOI,
  GeoProvider,
  GeoQuery,
  ProviderHealth,
} from '../../types'

export class MapboxProvider implements GeoProvider {
  readonly id = 'mapbox' as const
  private token: string | undefined

  constructor(opts?: { token?: string }) {
    // Server-side token only — never the public NEXT_PUBLIC_MAPBOX_TOKEN.
    this.token = opts?.token || process.env.MAPBOX_TOKEN
  }

  isAvailable(): boolean {
    // Not available until the Search Box / Tilequery integration is implemented.
    return false
  }

  health(): ProviderHealth {
    return {
      provider: this.id,
      available: false,
      reason: this.token
        ? 'Mapbox search integration not yet implemented'
        : 'MAPBOX_TOKEN not set',
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchPOIs(
    _query: GeoQuery,
    _categories: GeoCategoryConfig[],
  ): Promise<GeoPOI[]> {
    return []
  }
}
