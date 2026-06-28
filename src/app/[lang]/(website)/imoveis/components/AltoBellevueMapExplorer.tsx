'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { LayoutGrid, Satellite, Layers } from 'lucide-react'

// Mapa de lotes vetorial interativo (zoom/drag/seleção/comparar) — fonte canônica.
const SubdivisionLotMap = dynamic(
  () => import('./SubdivisionLotMap'),
  {
    ssr: false,
    loading: () => <MapSkeleton label="Carregando mapa de lotes…" />,
  },
)

// Vista aérea/satélite ultra realista (Esri World Imagery) centrada na âncora.
const AerialSatelliteMap = dynamic(() => import('@/components/maps/AerialSatelliteMap'), {
  ssr: false,
  loading: () => <MapSkeleton label="Carregando vista de satélite…" />,
})

// Plataforma geoespacial MapLibre GL (WebGL): lotes GEORREFERENCIADOS clicáveis
// SOBRE a imagem de satélite real — a vista "render-like" com camadas, hover,
// painel de lote e planos de pagamento.
const AltoBellevueGeoMap = dynamic(
  () => import('./AltoBellevueGeoMap'),
  {
    ssr: false,
    loading: () => <MapSkeleton label="Carregando mapa geoespacial…" />,
  },
)

// Âncora geográfica confirmada do Alto Bellevue (Plus Code 4FFQ+RJ, Garanhuns/PE).
const AB_ANCHOR = { lng: -36.510937, lat: -8.875437, zoom: 16.5 }

type ViewMode = 'plano' | 'satelite' | 'satlotes'

interface Props {
  developmentId: string
  developmentName: string
  whatsappPhone?: string
  /** Repassados ao "Plano" (SubdivisionLotMap) — sem regressão vs. uso direto. */
  mapAmenities?: Record<string, unknown>[]
  virtualTourUrl?: string
}

/**
 * Explorador do empreendimento com MÚLTIPLAS vistas interativas:
 *  • Plano            — mapa de lotes vetorial (seleção, comparação, financiamento).
 *  • Satélite + Lotes — lotes georreferenciados clicáveis sobre satélite (WebGL).
 *  • Satélite         — imagem aérea real do terreno (render-like), navegável.
 *
 * Vista padrão = Plano (nenhuma regressão). Usado tanto em /projetos quanto em
 * /imóveis e /empreendimentos para o Alto Bellevue.
 */
export default function AltoBellevueMapExplorer({
  developmentId,
  developmentName,
  whatsappPhone,
  mapAmenities,
  virtualTourUrl,
}: Props) {
  const [view, setView] = useState<ViewMode>('plano')

  return (
    <div>
      {/* View switcher — full-width segmented control on mobile, inline on desktop */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div
          className="flex sm:inline-flex w-full sm:w-auto gap-1 p-1 rounded-xl"
          style={{ background: '#ECE5DA', border: '1px solid #E0D8CC' }}
        >
          <ViewTab
            active={view === 'plano'}
            onClick={() => setView('plano')}
            icon={<LayoutGrid size={15} />}
            label="Plano de lotes"
          />
          <ViewTab
            active={view === 'satlotes'}
            onClick={() => setView('satlotes')}
            icon={<Layers size={15} />}
            label="Satélite + Lotes"
          />
          <ViewTab
            active={view === 'satelite'}
            onClick={() => setView('satelite')}
            icon={<Satellite size={15} />}
            label="Satélite"
          />
        </div>
      </div>

      {view === 'plano' && (
        <SubdivisionLotMap
          developmentId={developmentId}
          developmentName={developmentName}
          whatsappPhone={whatsappPhone}
          mapAmenities={mapAmenities}
          virtualTourUrl={virtualTourUrl}
        />
      )}

      {view === 'satlotes' && (
        <div className="max-w-6xl mx-auto px-0 sm:px-6 lg:px-8">
          <div
            className="overflow-hidden sm:rounded-2xl"
            style={{ border: '1px solid #E0D8CC' }}
          >
            <AltoBellevueGeoMap
              developmentId={developmentId}
              developmentName={developmentName}
              whatsappPhone={whatsappPhone}
              height="78vh"
              mapAmenities={mapAmenities}
            />
          </div>
          <p className="text-[11px] text-[#8A8A8A] mt-3 px-4 sm:px-0">
            Lotes georreferenciados sobre satélite real, clicáveis (WebGL). Posicionamento
            aproximado norte-acima — o ajuste fino (rotação/escala) será calibrado com os
            pontos de controle do levantamento.
          </p>
        </div>
      )}

      {view === 'satelite' && (
        <div className="max-w-6xl mx-auto px-0 sm:px-6 lg:px-8">
          <div
            className="overflow-hidden sm:rounded-2xl"
            style={{ border: '1px solid #E0D8CC', background: '#0B1928' }}
          >
            <AerialSatelliteMap
              lng={AB_ANCHOR.lng}
              lat={AB_ANCHOR.lat}
              zoom={AB_ANCHOR.zoom}
              label={developmentName}
              height="70vh"
            />
          </div>
          <p className="text-[11px] text-[#8A8A8A] mt-3 px-4 sm:px-0">
            Vista de satélite real (Esri World Imagery) centrada no terreno em Garanhuns/PE.
          </p>
        </div>
      )}
    </div>
  )
}

function ViewTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 min-h-[44px] rounded-lg text-[12px] sm:text-[13px] font-semibold transition-all active:scale-[0.97]"
      style={{
        color: active ? '#0B1928' : '#6B6B6B',
        background: active ? '#C8A44A' : 'transparent',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function MapSkeleton({ label }: { label: string }) {
  return (
    <div
      className="max-w-6xl mx-auto flex items-center justify-center"
      style={{ minHeight: 440, color: '#8A8A8A', fontSize: 13 }}
    >
      {label}
    </div>
  )
}
