import type { ScanData, SpatialProviderKind } from './types'

// ─── Provider contract ────────────────────────────────────────────────────────
// Implement this interface to add a new scan provider without touching any
// consumer code. Register with registerProvider() and the rest is wired up.

export interface SpatialProvider {
  readonly kind: SpatialProviderKind
  readonly displayName: string

  importScan(externalId: string, options?: Record<string, unknown>): Promise<ScanData>
  getViewerEmbedUrl(externalId: string): string
  isScanReady(externalId: string): Promise<boolean>
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const registry = new Map<SpatialProviderKind, SpatialProvider>()

export function registerProvider(provider: SpatialProvider): void {
  registry.set(provider.kind, provider)
}

export function getProvider(kind: SpatialProviderKind): SpatialProvider | undefined {
  return registry.get(kind)
}

export function listProviders(): SpatialProvider[] {
  return Array.from(registry.values())
}

export function hasProvider(kind: SpatialProviderKind): boolean {
  return registry.has(kind)
}
