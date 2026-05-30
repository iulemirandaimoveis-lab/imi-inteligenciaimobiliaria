'use client'

import { useState } from 'react'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { PromptInput } from '@/features/cadam/components/PromptInput'
import { ParametricSliders } from '@/features/cadam/components/ParametricSliders'
import { ScadCodeViewer } from '@/features/cadam/components/ScadCodeViewer'
import { TemplateSelector } from '@/features/cadam/components/TemplateSelector'
import { useCadGeneration } from '@/features/cadam/hooks/use-cad-generation'
import { useCadTemplates } from '@/features/cadam/hooks/use-cad-templates'
import type { CadConstraintsForm, CadProjectType, TemplateOption } from '@/features/cadam/types'

export default function CadamStudioPage() {
  const [projectType, setProjectType] = useState<CadProjectType>('building')
  const [constraints, setConstraints] = useState<CadConstraintsForm>({})
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>()

  const { state, generate, reset } = useCadGeneration()
  const { templates, loading: templatesLoading } = useCadTemplates()

  function handleSelectTemplate(template: TemplateOption) {
    setSelectedTemplateId(template.id)
    setProjectType(template.type)
    setConstraints({})
  }

  function handleGenerate(prompt: string, type?: CadProjectType) {
    const resolvedType = type ?? projectType
    setProjectType(resolvedType)
    generate({
      prompt,
      projectType: resolvedType,
      templateId: selectedTemplateId,
      constraints: Object.keys(constraints).length > 0 ? constraints : undefined,
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: T.base, padding: '0 0 60px' }}>
      <PageIntelHeader
        title="CADAM Studio"
        subtitle="Geração paramétrica de modelos CAD/3D para empreendimentos IMI"
        breadcrumbs={[
          { label: 'Backoffice', href: '/backoffice' },
          { label: 'CADAM Studio' },
        ]}
        badge={{ label: 'Interno', color: 'warning' }}
      />

      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '32px 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: 24,
        alignItems: 'start',
      }}>
        {/* Main column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Template selector */}
          <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: 24,
          }}>
            <TemplateSelector
              templates={templates}
              selectedId={selectedTemplateId}
              onSelect={handleSelectTemplate}
              loading={templatesLoading}
            />
          </div>

          {/* Prompt */}
          <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: 24,
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: '0 0 16px' }}>
              Descrição do projeto
            </h2>
            <PromptInput
              onGenerate={handleGenerate}
              loading={state.status === 'loading'}
            />
          </div>

          {/* Result */}
          {state.status === 'success' && state.scadCode && (
            <div style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: 0 }}>
                  Código OpenSCAD gerado
                </h2>
                <button
                  onClick={reset}
                  style={{
                    fontSize: 12, color: T.textMuted, background: 'none', border: 'none',
                    cursor: 'pointer', textDecoration: 'underline',
                  }}
                >
                  Nova geração
                </button>
              </div>
              <ScadCodeViewer
                scadCode={state.scadCode}
                generationId={state.generationId ?? ''}
                warnings={state.warnings}
              />
            </div>
          )}

          {state.status === 'error' && (
            <div style={{
              background: 'rgba(239,68,68,.08)',
              border: '1px solid rgba(239,68,68,.2)',
              borderRadius: 10,
              padding: '16px 20px',
            }}>
              <p style={{ color: '#EF4444', fontSize: 14, margin: 0 }}>
                {state.errorMessage}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 24 }}>
          <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: 20,
          }}>
            <ParametricSliders
              projectType={projectType}
              constraints={constraints}
              onChange={setConstraints}
            />
          </div>

          <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: 20,
          }}>
            <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Pipeline de saída
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Prompt / parâmetros', 'CADAM engine', 'OpenSCAD', 'GLTF simplificado', 'IMI Scene Adapter', 'Pascal / IMI Viewer'].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: i === 0 ? 'rgba(200,164,74,.2)' : T.surfaceAlt,
                    border: `1px solid ${i === 0 ? 'var(--gold, #C8A44A)' : T.borderLight}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: i === 0 ? 'var(--gold, #C8A44A)' : T.textDim,
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 12, color: i === 0 ? T.text : T.textMuted }}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'rgba(234,179,8,.06)',
            border: '1px solid rgba(234,179,8,.15)',
            borderRadius: 10,
            padding: '14px 16px',
          }}>
            <p style={{ fontSize: 11, color: '#EAB308', margin: '0 0 6px', fontWeight: 600 }}>
              Licença GPL-3.0
            </p>
            <p style={{ fontSize: 11, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>
              Motor interno apenas. Não expor ao cliente final sem validação jurídica. Todas as modificações devem ser documentadas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
