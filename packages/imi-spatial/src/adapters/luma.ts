import type { SpatialProvider } from '../providers'
import type { ScanData } from '../types'

// Luma AI provider — uses Luma Dream Machine / Captures API
// Requires env: LUMA_API_KEY (server-side only)
export class LumaProvider implements SpatialProvider {
  readonly kind = 'luma' as const
  readonly displayName = 'Luma AI'

  private readonly apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  getViewerEmbedUrl(captureId: string): string {
    return `https://lumalabs.ai/capture/${captureId}?embed=1`
  }

  async isScanReady(captureId: string): Promise<boolean> {
    try {
      const res = await fetch(`https://webapp.engineeringlumalabs.com/api/v2/capture/${captureId}`, {
        headers: { Authorization: `luma-api-key=${this.apiKey}` },
      })
      if (!res.ok) return false
      const json = await res.json() as { currentStage?: string }
      return json.currentStage === 'done'
    } catch {
      return false
    }
  }

  async importScan(captureId: string): Promise<ScanData> {
    const res = await fetch(`https://webapp.engineeringlumalabs.com/api/v2/capture/${captureId}`, {
      headers: { Authorization: `luma-api-key=${this.apiKey}` },
    })
    if (!res.ok) {
      throw new Error(`Luma API error: ${res.status}`)
    }

    const capture = await res.json() as {
      slug?: string
      thumbnail?: string
      artifacts?: Array<{ type: string; url: string }>
    }

    const artifacts = capture.artifacts ?? []
    const mesh = artifacts.find((a) => a.type === 'ply' || a.type === 'glb')
    const pointCloud = artifacts.find((a) => a.type === 'ply')

    return {
      provider: 'luma',
      externalId: captureId,
      meshUrl: mesh?.url,
      pointCloudUrl: pointCloud?.url,
      panoramaUrls: [],
      previewImageUrl: capture.thumbnail,
    }
  }
}

export function createLumaProvider(): LumaProvider | null {
  const key = process.env.LUMA_API_KEY
  if (!key) return null
  return new LumaProvider(key)
}
