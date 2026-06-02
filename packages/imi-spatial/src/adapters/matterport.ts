import type { SpatialProvider } from '../providers'
import type { ScanData } from '../types'

// Matterport provider — uses Matterport Graph API v2
// Requires env: MATTERPORT_API_KEY (server-side only)
export class MatterportProvider implements SpatialProvider {
  readonly kind = 'matterport' as const
  readonly displayName = 'Matterport'

  private readonly apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  getViewerEmbedUrl(modelId: string): string {
    return `https://my.matterport.com/show/?m=${modelId}&play=1&qs=1&brand=0`
  }

  async isScanReady(modelId: string): Promise<boolean> {
    try {
      const res = await fetch(`https://api.matterport.com/api/models/v1/${modelId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      })
      if (!res.ok) return false
      const json = await res.json() as { status?: string }
      return json.status === 'done'
    } catch {
      return false
    }
  }

  async importScan(modelId: string): Promise<ScanData> {
    const res = await fetch(`https://api.matterport.com/api/models/v1/${modelId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    })
    if (!res.ok) {
      throw new Error(`Matterport API error: ${res.status}`)
    }

    const model = await res.json() as {
      id?: string
      name?: string
      thumbnail?: { src?: string }
      sweeps?: Array<{ id: string; pano?: { src?: string } }>
      downloadUrl?: { model?: string; pointCloud?: string }
    }

    return {
      provider: 'matterport',
      externalId: modelId,
      meshUrl: model.downloadUrl?.model,
      pointCloudUrl: model.downloadUrl?.pointCloud,
      panoramaUrls: (model.sweeps ?? [])
        .filter((s) => s.pano?.src)
        .map((s) => s.pano!.src!),
      previewImageUrl: model.thumbnail?.src,
    }
  }
}

export function createMatterportProvider(): MatterportProvider | null {
  const key = process.env.MATTERPORT_API_KEY
  if (!key) return null
  return new MatterportProvider(key)
}
