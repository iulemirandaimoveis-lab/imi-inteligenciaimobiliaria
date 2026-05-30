'use client'

import { useState } from 'react'
import { T } from '@/app/(backoffice)/lib/theme'

interface ScadCodeViewerProps {
  scadCode: string
  generationId: string
  warnings: string[]
}

export function ScadCodeViewer({ scadCode, generationId, warnings }: ScadCodeViewerProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(scadCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([scadCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `imi-cad-${generationId}.scad`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {warnings.length > 0 && (
        <div style={{
          background: 'rgba(234,179,8,.08)',
          border: '1px solid rgba(234,179,8,.2)',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          {warnings.map((w, i) => (
            <p key={i} style={{ fontSize: 12, color: '#EAB308', margin: 0 }}>⚠ {w}</p>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: T.textMuted }}>
          OpenSCAD — ID: <code style={{ color: T.textDim }}>{generationId}</code>
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleCopy}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              border: `1px solid ${T.borderLight}`,
              background: 'transparent',
              color: T.textMuted,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          <button
            onClick={handleDownload}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              border: `1px solid ${T.borderLight}`,
              background: 'transparent',
              color: T.textMuted,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            .scad
          </button>
        </div>
      </div>

      <pre style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: '16px 18px',
        overflowX: 'auto',
        fontSize: 12,
        lineHeight: 1.7,
        color: T.text,
        maxHeight: 480,
        overflowY: 'auto',
        margin: 0,
        fontFamily: 'DM Mono, monospace',
      }}>
        <code>{scadCode}</code>
      </pre>
    </div>
  )
}
