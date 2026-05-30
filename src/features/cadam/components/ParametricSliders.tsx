'use client'

import { T } from '@/app/(backoffice)/lib/theme'
import type { CadConstraintsForm, CadProjectType } from '../types'

interface SliderConfig {
  key: keyof CadConstraintsForm
  label: string
  unit: string
  min: number
  max: number
  step: number
  projectTypes: CadProjectType[]
}

const SLIDERS: SliderConfig[] = [
  { key: 'floors', label: 'Pavimentos', unit: '', min: 1, max: 50, step: 1, projectTypes: ['building'] },
  { key: 'unitsPerFloor', label: 'Unidades por andar', unit: '', min: 1, max: 20, step: 1, projectTypes: ['building'] },
  { key: 'lots', label: 'Número de lotes', unit: '', min: 4, max: 500, step: 4, projectTypes: ['subdivision'] },
  { key: 'streetWidth', label: 'Largura da rua', unit: 'm', min: 8, max: 20, step: 0.5, projectTypes: ['subdivision'] },
  { key: 'areaM2', label: 'Área', unit: 'm²', min: 20, max: 1000, step: 10, projectTypes: ['subdivision', 'building', 'floorplan', 'unit'] },
  { key: 'bedrooms', label: 'Quartos', unit: '', min: 0, max: 6, step: 1, projectTypes: ['floorplan', 'unit'] },
  { key: 'parkingSpaces', label: 'Vagas', unit: '', min: 0, max: 200, step: 1, projectTypes: ['building', 'floorplan', 'unit'] },
  { key: 'width', label: 'Largura total', unit: 'm', min: 10, max: 2000, step: 10, projectTypes: ['subdivision', 'building'] },
  { key: 'depth', label: 'Profundidade total', unit: 'm', min: 10, max: 2000, step: 10, projectTypes: ['subdivision', 'building'] },
]

interface ParametricSlidersProps {
  projectType: CadProjectType
  constraints: CadConstraintsForm
  onChange: (constraints: CadConstraintsForm) => void
}

export function ParametricSliders({ projectType, constraints, onChange }: ParametricSlidersProps) {
  const visible = SLIDERS.filter(s => s.projectTypes.includes(projectType))

  if (visible.length === 0) return null

  function handleChange(key: keyof CadConstraintsForm, value: number) {
    onChange({ ...constraints, [key]: value })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 12, color: T.textMuted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Parâmetros
      </p>
      {visible.map(slider => {
        const value = constraints[slider.key] ?? slider.min
        return (
          <div key={slider.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 13, color: T.text }}>{slider.label}</label>
              <span style={{ fontSize: 13, color: 'var(--gold, #C8A44A)', fontVariantNumeric: 'tabular-nums' }}>
                {value}{slider.unit && ` ${slider.unit}`}
              </span>
            </div>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={value}
              onChange={e => handleChange(slider.key, parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--gold, #C8A44A)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textDim }}>
              <span>{slider.min}{slider.unit && ` ${slider.unit}`}</span>
              <span>{slider.max}{slider.unit && ` ${slider.unit}`}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
