'use client'

import { useCallback, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence } from 'framer-motion'
import { LayoutGrid, Satellite, Layers, List } from 'lucide-react'
import { useLotCart } from '@/hooks/useLotCart'
import { cartTotals, buildCartShareUrl, type CartLot } from '@/lib/lotmap/cart'
import { CartFab, CartSheet } from './LotCartSheet'

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

const ProposalFormModal = dynamic(() => import('./ProposalFormModal'), { ssr: false })

// Âncora geográfica confirmada do Alto Bellevue (Plus Code 4FFQ+RJ, Garanhuns/PE).
const AB_ANCHOR = { lng: -36.510937, lat: -8.875437, zoom: 16.5 }

// Chave do carrinho (localStorage) — mesma instância é levantada aqui e
// repassada a todas as vistas filhas (padrão P9), então este slug só importa
// para a chave de persistência em si.
const DEV_SLUG = 'alto-bellevue'
const WA_DEFAULT = '5581986141487'

type ViewMode = 'lista' | 'mapa' | 'satelite' | 'satlotes'

interface Props {
  developmentId: string
  developmentName: string
  whatsappPhone?: string
  /** Repassados ao "Plano" (SubdivisionLotMap) — sem regressão vs. uso direto. */
  mapAmenities?: Record<string, unknown>[]
  virtualTourUrl?: string
}

/**
 * Explorador do empreendimento com um único menu de 4 vistas interativas:
 *  • Lista            — grid/lista de lotes com filtros, ranking e comparador.
 *  • Mapa de Lotes     — mapa de lotes vetorial (planta, áreas comuns/lazer).
 *  • Satélite + Lotes  — lotes georreferenciados clicáveis sobre satélite (WebGL).
 *  • Satélite          — imagem aérea real do terreno + pontos de interesse próximos.
 *
 * Vista padrão = Mapa de Lotes (nenhuma regressão). Usado tanto em /projetos
 * quanto em /imóveis e /empreendimentos para o Alto Bellevue.
 *
 * O carrinho de lotes/proposta é uma ÚNICA instância levantada aqui (padrão
 * P9 — estado compartilhado entre vistas alternáveis vive no pai do
 * alternador) e passada às vistas filhas, com um único FAB/Sheet/Modal
 * visível nas 4 opções — adicionar um lote em qualquer vista mantém o
 * carrinho ao trocar de opção, sem depender só da sincronização por
 * localStorage entre instâncias independentes.
 */
export default function AltoBellevueMapExplorer({
  developmentId,
  developmentName,
  whatsappPhone,
  mapAmenities,
  virtualTourUrl,
}: Props) {
  const [view, setView] = useState<ViewMode>('mapa')

  const cart = useLotCart<CartLot>(DEV_SLUG)
  const [showCart, setShowCart] = useState(false)
  const [showProposal, setShowProposal] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const cartT = useMemo(() => cartTotals(cart.items), [cart.items])

  const copyShareLink = useCallback(() => {
    try {
      const url = buildCartShareUrl(typeof window !== 'undefined' ? window.location.origin : '', {
        d: DEV_SLUG, ids: cart.items.map((l) => l.id),
      })
      navigator.clipboard?.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1800)
    } catch { /* clipboard indisponível */ }
  }, [cart.items])

  return (
    <div>
      {/* View switcher — menu único (4 opções), full-width no mobile, inline no desktop */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div
          className="grid grid-cols-4 sm:inline-flex w-full sm:w-auto gap-1 p-1 rounded-xl"
          style={{ background: '#ECE5DA', border: '1px solid #E0D8CC' }}
        >
          <ViewTab
            active={view === 'lista'}
            onClick={() => setView('lista')}
            icon={<List size={15} />}
            label="Lista"
            shortLabel="Lista"
          />
          <ViewTab
            active={view === 'mapa'}
            onClick={() => setView('mapa')}
            icon={<LayoutGrid size={15} />}
            label="Mapa de Lotes"
            shortLabel="Mapa"
          />
          <ViewTab
            active={view === 'satlotes'}
            onClick={() => setView('satlotes')}
            icon={<Layers size={15} />}
            label="Satélite + Lotes"
            shortLabel="Sat. + Lotes"
          />
          <ViewTab
            active={view === 'satelite'}
            onClick={() => setView('satelite')}
            icon={<Satellite size={15} />}
            label="Satélite"
            shortLabel="Satélite"
          />
        </div>
      </div>

      {/* "Lista" e "Mapa de Lotes" são a mesma vista (SubdivisionLotMap), só
          muda o `viewMode` controlado — evita desmontar filtros/scroll/
          comparador ao alternar entre as duas. */}
      {(view === 'lista' || view === 'mapa') && (
        <SubdivisionLotMap
          developmentId={developmentId}
          developmentName={developmentName}
          whatsappPhone={whatsappPhone}
          mapAmenities={mapAmenities}
          virtualTourUrl={virtualTourUrl}
          viewMode={view === 'lista' ? 'list' : 'plan'}
          onViewModeChange={(mode) => setView(mode === 'list' ? 'lista' : 'mapa')}
          hideViewToggle
          cart={cart}
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
              cart={cart}
            />
          </div>
          <p className="text-[11px] text-[#8A8A8A] mt-3 px-4 sm:px-0">
            Os lotes desenhados sobre a imagem real de satélite — toque em um lote para ver
            preço e disponibilidade. Posicionamento aproximado, em refinamento contínuo.
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
              developmentId={developmentId}
              showPois
            />
          </div>
          <p className="text-[11px] text-[#8A8A8A] mt-3 px-4 sm:px-0">
            Vista aérea real do terreno em Garanhuns/PE — arraste e aproxime para explorar a região,
            com os pontos de interesse (mercado, escola, posto, hospital) mais próximos.
          </p>
        </div>
      )}

      {/* ── Carrinho de lotes / proposta — único FAB/Sheet/Modal, visível nas
          4 opções do menu (padrão P9: estado compartilhado vive no pai). ── */}
      {cart.items.length > 0 && !showCart && !showProposal && (
        <CartFab count={cart.items.length} onClick={() => setShowCart(true)} fixed />
      )}
      <AnimatePresence>
        {showCart && (
          <CartSheet
            items={cart.items}
            totals={cartT}
            linkCopied={linkCopied}
            onRemove={cart.remove}
            onClear={cart.clear}
            onCopyLink={copyShareLink}
            onProposal={() => { setShowCart(false); setShowProposal(true) }}
            onClose={() => setShowCart(false)}
            fixed
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showProposal && cart.items.length > 0 && (
          <ProposalFormModal
            developmentId={developmentId}
            developmentName={developmentName}
            developmentSlug={DEV_SLUG}
            whatsappPhone={whatsappPhone ?? WA_DEFAULT}
            items={cart.items}
            onClose={() => setShowProposal(false)}
            onSubmitted={() => { cart.clear(); setShowProposal(false) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ViewTab({
  active,
  onClick,
  icon,
  label,
  shortLabel,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  /** Rótulo curto exibido no mobile (evita quebra de linha nos botões). */
  shortLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 min-h-[44px] rounded-lg text-[12px] sm:text-[13px] font-semibold leading-none whitespace-nowrap transition-all duration-200 active:scale-[0.97]"
      style={{
        color: active ? '#0B1928' : '#6B6B6B',
        background: active ? '#C8A44A' : 'transparent',
        boxShadow: active ? '0 2px 8px rgba(200,164,74,0.35)' : 'none',
      }}
    >
      <span className="flex-shrink-0">{icon}</span>
      {/* Rótulo curto no mobile, completo a partir de sm — sem quebra de linha */}
      <span className="sm:hidden">{shortLabel ?? label}</span>
      <span className="hidden sm:inline">{label}</span>
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
