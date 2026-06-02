'use client'

import { T } from '@/app/(backoffice)/lib/theme'
import type { TemplateOption } from '../types'

interface TemplateSelectorProps {
  templates: TemplateOption[]
  selectedId?: string
  onSelect: (template: TemplateOption) => void
  loading: boolean
}

export function TemplateSelector({ templates, selectedId, onSelect, loading }: TemplateSelectorProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            width: 140, height: 60, borderRadius: 8,
            background: T.surfaceAlt, opacity: 0.5,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
      </div>
    )
  }

  if (templates.length === 0) return null

  const TYPE_LABELS: Record<string, string> = {
    subdivision: 'Loteamento',
    building: 'Edifício',
    floorplan: 'Planta',
    unit: 'Unidade',
    amenity: 'Área Comum',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 12, color: T.textMuted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Templates IMI
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {templates.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t)}
            title={t.description}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: `1px solid ${selectedId === t.id ? 'var(--gold, #C8A44A)' : T.border}`,
              background: selectedId === t.id ? 'rgba(200,164,74,.1)' : T.surface,
              color: selectedId === t.id ? 'var(--gold, #C8A44A)' : T.text,
              cursor: 'pointer',
              fontSize: 13,
              textAlign: 'left',
              transition: 'all .15s',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              minWidth: 130,
            }}
          >
            <span style={{ fontWeight: 600 }}>{t.name}</span>
            <span style={{ fontSize: 11, color: T.textMuted }}>{TYPE_LABELS[t.type] ?? t.type}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
