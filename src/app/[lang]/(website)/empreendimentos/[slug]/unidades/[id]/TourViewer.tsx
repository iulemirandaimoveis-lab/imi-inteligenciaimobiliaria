'use client'

import { useState } from 'react'

interface Props {
  provider: string
  externalId?: string
  panoramaUrls: string[]
  meshUrl?: string
}

export function TourViewer({ provider, externalId, panoramaUrls, meshUrl }: Props) {
  const [mode, setMode] = useState<'embed' | 'panorama'>(() =>
    provider === 'matterport' && externalId ? 'embed' : 'panorama'
  )
  const [panoramaIdx, setPanoramaIdx] = useState(0)

  const embedUrl = getEmbedUrl(provider, externalId)
  const hasPanoramas = panoramaUrls.length > 0

  if (!embedUrl && !hasPanoramas) {
    return (
      <div style={{
        background: '#0B1928', borderRadius: 16, height: 260,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 600,
        letterSpacing: '0.05em',
      }}>
        Tour indisponível para este imóvel
      </div>
    )
  }

  return (
    <div>
      {embedUrl && hasPanoramas && (
        <div className="flex gap-2 mb-3">
          {(['embed', 'panorama'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.1em', padding: '6px 14px', borderRadius: 8,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: mode === m ? '#0B1928' : 'rgba(11,25,40,0.08)',
                color: mode === m ? '#fff' : '#0B1928',
              }}
            >
              {m === 'embed' ? '3D Imersivo' : 'Panoramas'}
            </button>
          ))}
        </div>
      )}

      {mode === 'embed' && embedUrl ? (
        <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '16/9' }}>
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            allow="xr-spatial-tracking"
            allowFullScreen
            style={{ border: 'none', display: 'block' }}
          />
        </div>
      ) : hasPanoramas ? (
        <div>
          <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '16/9', background: '#0B1928', position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={panoramaUrls[panoramaIdx]}
              alt={`Panorama ${panoramaIdx + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {panoramaUrls.length > 1 && (
              <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setPanoramaIdx((i) => (i - 1 + panoramaUrls.length) % panoramaUrls.length)}
                  style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 8, color: '#fff', padding: '6px 10px', cursor: 'pointer', fontSize: 14 }}
                >
                  ‹
                </button>
                <span style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 8, color: '#fff', padding: '6px 10px', fontSize: 11, fontWeight: 700 }}>
                  {panoramaIdx + 1}/{panoramaUrls.length}
                </span>
                <button
                  onClick={() => setPanoramaIdx((i) => (i + 1) % panoramaUrls.length)}
                  style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 8, color: '#fff', padding: '6px 10px', cursor: 'pointer', fontSize: 14 }}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {meshUrl && (
        <div style={{ marginTop: 8 }}>
          <a
            href={meshUrl}
            download
            style={{
              fontSize: 11, fontWeight: 700, color: '#948F84',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            ↓ Baixar malha 3D
          </a>
        </div>
      )}
    </div>
  )
}

function getEmbedUrl(provider: string, externalId?: string): string | null {
  if (!externalId) return null
  switch (provider) {
    case 'matterport':
      return `https://my.matterport.com/show/?m=${externalId}&play=1&qs=1&brand=0`
    case 'luma':
      return `https://lumalabs.ai/capture/${externalId}?embed=1`
    default:
      return null
  }
}
