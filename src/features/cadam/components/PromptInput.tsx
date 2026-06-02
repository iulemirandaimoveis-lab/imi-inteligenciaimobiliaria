'use client'

import { useState, useRef } from 'react'
import { T } from '@/app/(backoffice)/lib/theme'
import type { CadProjectType } from '../types'

interface PromptInputProps {
  onGenerate: (prompt: string, projectType?: CadProjectType) => void
  loading: boolean
}

const PROJECT_TYPES: { value: CadProjectType; label: string }[] = [
  { value: 'subdivision', label: 'Loteamento' },
  { value: 'building', label: 'Edifício' },
  { value: 'floorplan', label: 'Planta Baixa' },
  { value: 'unit', label: 'Unidade' },
  { value: 'amenity', label: 'Área Comum' },
]

const EXAMPLES: Record<CadProjectType, string> = {
  subdivision: 'Crie loteamento com 8 quadras, ruas de 12 metros, lotes de 250m², praça central e área institucional.',
  building: 'Crie prédio residencial com térreo comercial, 12 pavimentos, 4 unidades por andar, sacadas frontais e cobertura técnica.',
  floorplan: 'Crie planta de apartamento 3 quartos com 2 suítes, sala integrada, varanda gourmet e lavabo.',
  unit: 'Crie studio compacto de 32m² com kitchenette integrada e bancada de trabalho.',
  amenity: 'Crie área de lazer com piscina adulto e infantil, deck, churrasqueira e salão de festas.',
}

export function PromptInput({ onGenerate, loading }: PromptInputProps) {
  const [prompt, setPrompt] = useState('')
  const [projectType, setProjectType] = useState<CadProjectType>('building')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleExample() {
    setPrompt(EXAMPLES[projectType])
    textareaRef.current?.focus()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim() || loading) return
    onGenerate(prompt.trim(), projectType)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PROJECT_TYPES.map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => setProjectType(t.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: `1px solid ${projectType === t.value ? 'var(--gold, #C8A44A)' : T.borderLight}`,
              background: projectType === t.value ? 'rgba(200,164,74,.12)' : 'transparent',
              color: projectType === t.value ? 'var(--gold, #C8A44A)' : T.textMuted,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all .15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Descreva o projeto em linguagem natural..."
          rows={5}
          maxLength={2000}
          style={{
            width: '100%',
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            color: T.text,
            padding: '14px 16px',
            fontSize: 14,
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <span style={{
          position: 'absolute',
          bottom: 10,
          right: 14,
          fontSize: 11,
          color: T.textDim,
        }}>
          {prompt.length}/2000
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleExample}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: `1px solid ${T.borderLight}`,
            background: 'transparent',
            color: T.textMuted,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Usar exemplo
        </button>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: loading ? T.surfaceAlt : 'var(--gold, #C8A44A)',
            color: loading ? T.textMuted : '#050B14',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all .15s',
          }}
        >
          {loading ? 'Gerando...' : 'Gerar modelo CAD'}
        </button>
      </div>
    </form>
  )
}
