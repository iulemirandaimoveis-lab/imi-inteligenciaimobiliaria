/**
 * IMI Geo Intelligence Engine — Cache
 * ------------------------------------------------------------------
 * POI data changes slowly (a new pharmacy opens, not moves every minute), so
 * the engine caches aggressively to avoid hammering upstream APIs and to keep
 * the map instant.
 *
 * v1 ships a process-local TTL cache (`MemoryGeoCache`) — zero infra, safe on
 * serverless (each warm lambda reuses it). The `GeoCache` interface also lets
 * a `SupabaseGeoCache` be dropped in for cross-instance persistence once the
 * owner approves a `geo_cache` table (see docs/GEO_INTELLIGENCE_ENGINE.md —
 * migration is an owner action, not shipped here to respect the DB invariant).
 */

export interface GeoCache {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlMs: number): Promise<void>
}

interface Entry {
  value: unknown
  expiresAt: number
}

/** Process-local LRU + TTL cache. */
export class MemoryGeoCache implements GeoCache {
  private store = new Map<string, Entry>()
  private readonly maxEntries: number

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key)
      return null
    }
    // LRU touch: re-insert to move to the end.
    this.store.delete(key)
    this.store.set(key, entry)
    return entry.value as T
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value
      if (oldest !== undefined) this.store.delete(oldest)
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  clear(): void {
    this.store.clear()
  }
}

/** Stable cache key from a query — rounded coords so nearby lookups reuse. */
export function cacheKey(
  lat: number,
  lng: number,
  radius: number,
  profile: string,
): string {
  // ~11m precision at 4 decimals; enough to dedupe repeat lookups.
  return `pois:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}:${profile}`
}

/** Shared singleton so all routes in a warm instance share the cache. */
export const geoCache: GeoCache = new MemoryGeoCache()
