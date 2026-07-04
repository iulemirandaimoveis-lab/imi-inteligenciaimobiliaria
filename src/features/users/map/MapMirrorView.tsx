'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Building2, MapPinned, RefreshCw, Satellite, LayoutGrid, Layers } from 'lucide-react'
import { tokens as T } from '../ui/tokens'
import { GlassCard, Eyebrow, Spinner } from '../ui/primitives'

const mapLoader = (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 420, gap: 10, color: T.t3 }}>
    <Spinner size={18} color={T.gold} />
    <span style={{ fontFamily: T.fSans, fontSize: 13 }}>Carregando mapa…</span>
  </div>
)

const InteractiveLotMap = dynamic(() => import('@/components/maps/InteractiveLotMap'), {
  ssr: false,
  loading: () => mapLoader,
})

const SatelliteMap = dynamic(() => import('./SatelliteMap').then((m) => m.SatelliteMap), {
  ssr: false,
  loading: () => mapLoader,
})

// Lotes GEORREFERENCIADOS clicáveis sobre satélite real (WebGL) — reusa o
// componente canônico do site público (mesma fonte de dados/status ao vivo);
// hoje só o Alto Bellevue tem georreferenciamento resolvido.
const AltoBellevueGeoMap = dynamic(
  () => import('@/app/[lang]/(website)/imoveis/components/AltoBellevueGeoMap'),
  { ssr: false, loading: () => mapLoader },
)

// Viewer de empreendimento VERTICAL (prédio) — torres/andares/unidades.
// Reusa o componente canônico do site público (mesma fonte de dados); aqui é
// apenas espelhado dentro do console, sem recriar lógica.
const JazzBoulevardViewer = dynamic(
  () =>
    import(
      '@/app/[lang]/(website)/imoveis/jazz-boulevard-garanhuns/components/JazzBoulevardViewer'
    ),
  { ssr: false, loading: () => mapLoader },
)

export interface MapProject {
  projectId: string
  slug: string
  name: string
  /** 'lots' = loteamento (polígonos); 'vertical' = prédio (torres/unidades). */
  kind: 'lots' | 'vertical'
  developmentId: string | null
  mapJsonUrl: string | null
  whatsappContact: string | null
  geoAnchor: { lng: number; lat: number; zoom?: number } | null
}

type ViewMode = 'lotes' | 'satelite' | 'satlotes'

/** Slug do único empreendimento com lotes georreferenciados sobre satélite hoje.
 *  Quando outros ganharem transform SVG↔WGS84, promover isto a config. */
const GEO_LOTS_SLUG = 'alto-bellevue'

const LEGEND: { label: string; color: string }[] = [
  { label: 'Disponível', color: '#4ADE80' },
  { label: 'Reservado', color: '#FB923C' },
  { label: 'Negociação', color: '#FBBF24' },
  { label: 'Vendido', color: '#F87171' },
  { label: 'Bloqueado', color: '#94A3B8' },
]

export function MapMirrorView({
  projects,
  onActiveProjectChange,
}: {
  projects: MapProject[]
  /** Notifica o cabeçalho da página (fora deste componente) qual projeto está
   *  ativo, para que o nome exibido no topo NUNCA fique dessincronizado do
   *  conteúdo mostrado aqui embaixo (bug: cabeçalho dizia "Alto Bellevue"
   *  enquanto o mapa já mostrava o Jazz Boulevard). */
  onActiveProjectChange?: (name: string) => void
}) {
  const [activeId, setActiveId] = useState(projects[0]?.projectId ?? '')
  const active = projects.find((p) => p.projectId === activeId) ?? projects[0]
  const isVertical = active?.kind === 'vertical'
  const hasMap = !!(active && active.developmentId && active.mapJsonUrl)
  const anchor = active?.geoAnchor ?? null
  // Lotes georreferenciados sobre satélite (WebGL) — só onde o transform
  // SVG↔WGS84 está resolvido (hoje: Alto Bellevue).
  const hasGeoLots = active?.slug === GEO_LOTS_SLUG && !!active?.developmentId
  // Destaque: satélite+lotes quando existe; senão satélite (âncora); senão lotes.
  const [view, setView] = useState<ViewMode>(hasGeoLots ? 'satlotes' : anchor ? 'satelite' : 'lotes')
  let mode: ViewMode = view
  if (mode === 'satlotes' && !hasGeoLots) mode = anchor ? 'satelite' : 'lotes'
  if (mode === 'satelite' && !anchor) mode = 'lotes'

  useEffect(() => {
    if (active?.name) onActiveProjectChange?.(active.name)
  }, [active?.name, onActiveProjectChange])

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 16px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <Eyebrow style={{ color: T.gold }}>Disponibilidade</Eyebrow>
          <h1 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 28, color: T.t1, margin: '8px 0 4px' }}>
            {isVertical ? 'Disponibilidade' : 'Mapa de Lotes'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: T.t3 }}>
            <RefreshCw size={13} color={T.green} />
            <span style={{ fontFamily: T.fSans, fontSize: 12 }}>
              {isVertical
                ? 'Disponibilidade por torre, andar e unidade — status ao vivo.'
                : mode === 'satlotes'
                ? 'Lotes georreferenciados sobre satélite real — status ao vivo.'
                : mode === 'satelite'
                ? 'Vista de satélite real — Esri World Imagery.'
                : 'Espelho do mapa oficial — status atualizado ao vivo a cada mudança.'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* View toggle: Lotes ↔ Satélite (só para loteamentos) */}
          {!isVertical && (
            <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.glassBorder}`, flexWrap: 'wrap' }}>
              <ViewTab
                active={mode === 'satlotes'}
                disabled={!hasGeoLots}
                disabledTitle="Lotes georreferenciados ainda não disponíveis para este empreendimento"
                onClick={() => setView('satlotes')}
                icon={<Layers size={15} />}
                label="Sat. + Lotes"
              />
              <ViewTab active={mode === 'satelite'} disabled={!anchor} onClick={() => setView('satelite')} icon={<Satellite size={15} />} label="Satélite" />
              <ViewTab active={mode === 'lotes'} onClick={() => setView('lotes')} icon={<LayoutGrid size={15} />} label="Lotes" />
            </div>
          )}
        {/* Project switcher */}
        {projects.length > 1 && (
          <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: T.rSm, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.glassBorder}`, flexWrap: 'wrap' }}>
            {projects.map((p) => (
              <button
                key={p.projectId}
                type="button"
                onClick={() => setActiveId(p.projectId)}
                style={{
                  position: 'relative',
                  display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: T.fSans, fontSize: 12.5, fontWeight: 600,
                  color: activeId === p.projectId ? '#1A1206' : T.t2,
                  background: activeId === p.projectId ? T.gold : 'transparent',
                }}
              >
                <HitArea vertical={7} />
                <Building2 size={13} /> {p.name}
              </button>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Legend (só no modo Lotes de loteamento) */}
      {mode === 'lotes' && !isVertical && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
          {LEGEND.map((l) => (
            <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
              <span style={{ fontFamily: T.fSans, fontSize: 11.5, color: T.t2 }}>{l.label}</span>
            </span>
          ))}
        </div>
      )}

      {/* Map */}
      {!isVertical && mode === 'satlotes' && hasGeoLots ? (
        // Fora do GlassCard de propósito: o backdrop-filter do card vira
        // containing block e clipa o bottom-sheet/modal `position:fixed` do
        // geo map no mobile. Container simples reproduz o mesmo enquadramento.
        <div style={{ borderRadius: T.rLg, overflow: 'hidden', border: `1px solid ${T.glassBorder}`, boxShadow: T.shadowCard }}>
          <AltoBellevueGeoMap
            key={`geo-${active!.projectId}`}
            developmentId={active!.developmentId!}
            developmentName={active!.name}
            whatsappPhone={active!.whatsappContact ?? undefined}
            height="72vh"
          />
        </div>
      ) : (
      <GlassCard padding={0} style={{ overflow: 'hidden' }}>
        {isVertical ? (
          <div style={{ background: '#F7F5F0' }}>
            <JazzBoulevardViewer
              key={active!.projectId}
              whatsappPhone={active!.whatsappContact ?? undefined}
            />
          </div>
        ) : mode === 'satelite' && anchor ? (
          <SatelliteMap
            key={`sat-${active!.projectId}`}
            lng={anchor.lng}
            lat={anchor.lat}
            zoom={anchor.zoom}
            label={active!.name}
          />
        ) : hasMap ? (
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
      )}

      {mode === 'satelite' && !isVertical && (
        <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.t4, margin: '10px 2px 0' }}>
          Âncora: {anchor?.lat.toFixed(6)}, {anchor?.lng.toFixed(6)}.
          {hasGeoLots
            ? ' Para ver os lotes sobre o satélite, use a vista "Sat. + Lotes".'
            : ' O overlay georreferenciado dos lotes sobre o satélite requer pontos de controle (≥3) — em andamento.'}
        </p>
      )}
      {mode === 'satlotes' && !isVertical && (
        <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.t4, margin: '10px 2px 0' }}>
          Lotes georreferenciados clicáveis sobre satélite real (WebGL), com status ao vivo —
          mesma fonte do site público. Posicionamento aproximado norte-acima; o ajuste fino
          (rotação/escala) sairá dos pontos de controle do levantamento.
        </p>
      )}
    </div>
  )
}

/** Área de toque invisível — leva alvos visualmente compactos ao mínimo de
 *  44px (Apple HIG) sem alterar o desenho; o toque borbulha para o botão pai. */
function HitArea({ vertical }: { vertical: number }) {
  return <span aria-hidden style={{ position: 'absolute', top: -vertical, bottom: -vertical, left: 0, right: 0 }} />
}

function ViewTab({
  active,
  disabled,
  disabledTitle,
  onClick,
  icon,
  label,
}: {
  active: boolean
  disabled?: boolean
  /** Tooltip específico quando desabilitado (default: sem âncora geográfica). */
  disabledTitle?: string
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? (disabledTitle ?? 'Sem âncora geográfica para este empreendimento') : label}
      style={{
        position: 'relative',
        display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9, border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
        fontFamily: T.fSans, fontSize: 13, fontWeight: 600,
        color: active ? '#1A1206' : T.t2, background: active ? T.gold : 'transparent',
      }}
    >
      <HitArea vertical={5} />
      {icon} {label}
    </button>
  )
}
