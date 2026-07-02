'use client'

import { useCallback, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutGrid, Satellite, Layers, ShoppingCart } from 'lucide-react'
import { useLotCart } from '@/hooks/useLotCart'
import { cartTotals, buildCartShareUrl, type CartLot } from '@/lib/lotmap/cart'
import LotCartSheet from './LotCartSheet'
import ProposalFormModal from './ProposalFormModal'

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

const GOLD = '#C8A44A'
const NAVY = '#0B1928'
const WA_DEFAULT = '5581986141487'
const DEV_SLUG = 'alto-bellevue'

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
 *
 * O carrinho de lotes/proposta é instanciado AQUI (não dentro de cada vista) e
 * fica sempre montado — assim, um lote adicionado na vista "Satélite + Lotes"
 * continua visível e a proposta pode ser concluída trocando para "Plano" ou
 * "Satélite", sem perder o carrinho.
 */
export default function AltoBellevueMapExplorer({
  developmentId,
  developmentName,
  whatsappPhone,
  mapAmenities,
  virtualTourUrl,
}: Props) {
  const [view, setView] = useState<ViewMode>('plano')
  const phone = whatsappPhone ?? WA_DEFAULT

  // ── Carrinho de lotes / proposta — compartilhado pelas 3 vistas ────────────
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
      {/* View switcher — full-width segmented control on mobile, inline on desktop */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div
          className="grid grid-cols-3 sm:inline-flex w-full sm:w-auto gap-1 p-1 rounded-xl"
          style={{ background: '#ECE5DA', border: '1px solid #E0D8CC' }}
        >
          <ViewTab
            active={view === 'plano'}
            onClick={() => setView('plano')}
            icon={<LayoutGrid size={15} />}
            label="Plano de lotes"
            shortLabel="Plano"
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

      {view === 'plano' && (
        <SubdivisionLotMap
          developmentId={developmentId}
          developmentName={developmentName}
          whatsappPhone={phone}
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
              whatsappPhone={phone}
              height="78vh"
              mapAmenities={mapAmenities}
              cart={cart}
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

      {/* ── Proposta — sempre montada, funciona nas 3 vistas ───────────────────
          Fica acima da MobileStickyBar (z-[140]) e de qualquer conteúdo da página. */}
      <AnimatePresence>
        {cart.items.length > 0 && !showCart && !showProposal && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setShowCart(true)}
            className="fixed z-[9990] flex items-center gap-2 right-4 bottom-[calc(84px+env(safe-area-inset-bottom,0px))] lg:bottom-6"
            style={{
              height: 48, padding: '0 16px 0 14px', borderRadius: 24, border: 'none',
              background: GOLD, color: NAVY, boxShadow: '0 8px 28px rgba(200,164,74,0.45)',
              cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 13.5,
            }}
            aria-label="Abrir proposta"
          >
            <ShoppingCart size={18} />
            <span>Proposta</span>
            <span style={{ minWidth: 22, height: 22, borderRadius: 11, background: NAVY, color: GOLD, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, padding: '0 6px' }}>
              {cart.items.length}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCart && (
          <LotCartSheet
            items={cart.items}
            totals={cartT}
            linkCopied={linkCopied}
            onRemove={cart.remove}
            onClear={cart.clear}
            onCopyLink={copyShareLink}
            onProposal={() => { setShowCart(false); setShowProposal(true) }}
            onClose={() => setShowCart(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProposal && cart.items.length > 0 && (
          <ProposalFormModal
            developmentId={developmentId}
            developmentName={developmentName}
            developmentSlug={DEV_SLUG}
            whatsappPhone={phone}
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
      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 min-h-[44px] rounded-lg text-[12px] sm:text-[13px] font-semibold leading-none whitespace-nowrap transition-all active:scale-[0.97]"
      style={{
        color: active ? '#0B1928' : '#6B6B6B',
        background: active ? '#C8A44A' : 'transparent',
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
