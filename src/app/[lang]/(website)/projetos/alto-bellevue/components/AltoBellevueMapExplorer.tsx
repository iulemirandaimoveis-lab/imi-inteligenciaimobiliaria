'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { LayoutGrid, Satellite } from 'lucide-react'

// Mapa de lotes vetorial interativo (zoom/drag/seleção/comparar) — fonte canônica.
const SubdivisionLotMap = dynamic(
  () => import('../../../imoveis/components/SubdivisionLotMap'),
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

// Âncora geográfica confirmada do Alto Bellevue (Plus Code 4FFQ+RJ, Garanhuns/PE).
const AB_ANCHOR = { lng: -36.510937, lat: -8.875437, zoom: 16.5 }

type ViewMode = 'plano' | 'satelite'

interface Props {
  developmentId: string
  developmentName: string
  whatsappPhone?: string
}

/**
 * Explorador do empreendimento com MÚLTIPLAS vistas interativas:
 *  • Plano    — mapa de lotes vetorial (seleção, comparação, financiamento).
 *  • Satélite — imagem aérea real do terreno (render-like), navegável.
 *
 * Mantém o mapa de lotes como vista padrão (nenhuma regressão) e adiciona a
 * vista aérea realista como opção. Exclusivo de /projetos até aprovação para
 * migrar para /imóveis.
 */
export default function AltoBellevueMapExplorer({
  developmentId,
  developmentName,
  whatsappPhone,
}: Props) {
  const [view, setView] = useState<ViewMode>('plano')

  return (
    <div>
      {/* View switcher */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div
          className="inline-flex gap-1 p-1 rounded-xl"
          style={{ background: '#ECE5DA', border: '1px solid #E0D8CC' }}
        >
          <ViewTab
            active={view === 'plano'}
            onClick={() => setView('plano')}
            icon={<LayoutGrid size={15} />}
            label="Plano de lotes"
          />
          <ViewTab
            active={view === 'satelite'}
            onClick={() => setView('satelite')}
            icon={<Satellite size={15} />}
            label="Satélite"
          />
        </div>
      </div>

      {view === 'plano' ? (
        <SubdivisionLotMap
          developmentId={developmentId}
          developmentName={developmentName}
          whatsappPhone={whatsappPhone}
        />
      ) : (
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
            O overlay georreferenciado dos lotes sobre o satélite está em preparação.
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
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
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
