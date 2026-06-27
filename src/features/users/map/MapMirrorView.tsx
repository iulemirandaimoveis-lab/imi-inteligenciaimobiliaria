'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Building2, MapPinned, RefreshCw } from 'lucide-react'
import { tokens as T } from '../ui/tokens'
import { GlassCard, Eyebrow, Spinner } from '../ui/primitives'

const InteractiveLotMap = dynamic(() => import('@/components/maps/InteractiveLotMap'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 420, gap: 10, color: T.t3 }}>
      <Spinner size={18} color={T.gold} />
      <span style={{ fontFamily: T.fSans, fontSize: 13 }}>Carregando mapa…</span>
    </div>
  ),
})

export interface MapProject {
  projectId: string
  slug: string
  name: string
  developmentId: string | null
  mapJsonUrl: string | null
  whatsappContact: string | null
}

const LEGEND: { label: string; color: string }[] = [
  { label: 'Disponível', color: '#4ADE80' },
  { label: 'Reservado', color: '#FB923C' },
  { label: 'Negociação', color: '#FBBF24' },
  { label: 'Vendido', color: '#F87171' },
  { label: 'Bloqueado', color: '#94A3B8' },
]

export function MapMirrorView({ projects }: { projects: MapProject[] }) {
  const [activeId, setActiveId] = useState(projects[0]?.projectId ?? '')
  const active = projects.find((p) => p.projectId === activeId) ?? projects[0]
  const hasMap = !!(active && active.developmentId && active.mapJsonUrl)

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 16px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <Eyebrow style={{ color: T.gold }}>Disponibilidade</Eyebrow>
          <h1 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 28, color: T.t1, margin: '8px 0 4px' }}>
            Mapa de Lotes
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: T.t3 }}>
            <RefreshCw size={13} color={T.green} />
            <span style={{ fontFamily: T.fSans, fontSize: 12 }}>
              Espelho do mapa oficial — status atualizado ao vivo a cada mudança.
            </span>
          </div>
        </div>

        {/* Project switcher */}
        {projects.length > 1 && (
          <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: T.rSm, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.glassBorder}`, flexWrap: 'wrap' }}>
            {projects.map((p) => (
              <button
                key={p.projectId}
                type="button"
                onClick={() => setActiveId(p.projectId)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: T.fSans, fontSize: 12.5, fontWeight: 600,
                  color: activeId === p.projectId ? '#1A1206' : T.t2,
                  background: activeId === p.projectId ? T.gold : 'transparent',
                }}
              >
                <Building2 size={13} /> {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
        {LEGEND.map((l) => (
          <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
            <span style={{ fontFamily: T.fSans, fontSize: 11.5, color: T.t2 }}>{l.label}</span>
          </span>
        ))}
      </div>

      {/* Map (mirrored existing component) */}
      <GlassCard padding={0} style={{ overflow: 'hidden' }}>
        {hasMap ? (
          <InteractiveLotMap
            key={active!.projectId}
            developmentId={active!.developmentId!}
            lotMapJsonUrl={active!.mapJsonUrl!}
            whatsappContact={active!.whatsappContact ?? undefined}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 380, gap: 12, padding: 32, textAlign: 'center' }}>
            <MapPinned size={30} color={T.t4} />
            <p style={{ fontFamily: T.fSans, fontSize: 14, color: T.t2, margin: 0 }}>
              Mapa ainda não disponível para <strong>{active?.name ?? 'este empreendimento'}</strong>.
            </p>
            <p style={{ fontFamily: T.fSans, fontSize: 12, color: T.t4, margin: 0, maxWidth: 420 }}>
              Assim que o mapa oficial deste empreendimento for publicado, ele aparecerá aqui
              automaticamente — sem recadastro.
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
