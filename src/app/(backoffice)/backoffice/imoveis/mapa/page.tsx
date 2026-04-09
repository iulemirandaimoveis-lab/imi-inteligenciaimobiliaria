'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Building2, RefreshCw, AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { Development } from '@/app/[lang]/(website)/imoveis/types/development'
import Link from 'next/link'

// Lazy-load map to avoid SSR issues with maplibre-gl
const PropertyMap = dynamic(() => import('@/components/maps/PropertyMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 'clamp(400px, calc(100vh - 260px), 800px)',
      background: 'var(--bg-elevated)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, border: '1px solid var(--border-subtle)',
    }}>
      <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
        <MapPin size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
        <p style={{ fontSize: 13 }}>Carregando mapa…</p>
      </div>
    </div>
  ),
})

// ── Map raw DB row → Development type ──────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDevelopment(d: Record<string, any>): Development {
  const images = d.images as {
    main?: string; gallery?: string[]; videos?: string[]
    floorPlans?: string[]; brochure?: string
  } | null

  const statusMap: Record<string, 'launch' | 'ready' | 'under_construction'> = {
    lancamento: 'launch', launch: 'launch',
    disponivel: 'ready', available: 'ready', ready: 'ready', published: 'ready',
    em_construcao: 'under_construction', under_construction: 'under_construction',
  }
  const rawStatus = (d.status ?? 'disponivel').toLowerCase()
  const status = statusMap[rawStatus] ?? 'ready'

  return {
    id: d.id,
    slug: d.slug ?? d.id,
    name: d.name ?? d.title ?? 'Sem nome',
    developer: d.developer?.name ?? d.developer ?? '',
    developerLogo: d.developer?.logo_url ?? d.developer_logo ?? undefined,
    status,
    region: 'nordeste',
    location: {
      address: d.address ?? '',
      neighborhood: d.neighborhood ?? '',
      city: d.city ?? '',
      state: d.state ?? '',
      country: d.country ?? 'Brasil',
      coordinates: d.latitude && d.longitude
        ? { lat: parseFloat(d.latitude), lng: parseFloat(d.longitude) }
        : undefined,
    },
    deliveryDate: d.delivery_date ?? undefined,
    description: d.description ?? '',
    shortDescription: d.short_description ?? d.description?.slice(0, 120) ?? '',
    features: Array.isArray(d.features) ? d.features : [],
    specs: {
      areaRange: d.area_from ? `${d.area_from}` : undefined,
      bedroomsRange: d.bedrooms ? `${d.bedrooms}` : undefined,
      bathroomsRange: d.bathrooms ? `${d.bathrooms}` : undefined,
      floors: d.floors ?? undefined,
      units: d.total_units ?? undefined,
    },
    priceRange: {
      from: d.price_from ?? d.price_min ?? d.price ?? 0,
      to: d.price_to ?? d.price_max ?? undefined,
      currency: 'BRL',
    },
    images: {
      main: images?.main ?? d.cover_image_url ?? d.image ?? '',
      gallery: images?.gallery ?? d.image_urls ?? [],
      videos: images?.videos ?? (d.video_url ? [d.video_url] : []),
      floorPlans: images?.floorPlans ?? [],
      brochure: images?.brochure ?? d.brochure_url ?? undefined,
    },
    externalLinks: d.external_links ?? undefined,
    units: [],
    tags: Array.isArray(d.tags) ? d.tags : [],
    order: d.order ?? 0,
    isHighlighted: d.is_highlighted ?? false,
    createdAt: d.created_at ?? new Date().toISOString(),
    updatedAt: d.updated_at ?? new Date().toISOString(),
    listingCategory: d.listing_type === 'aluguel' ? 'aluguel'
      : d.listing_type === 'temporada' ? 'temporada'
      : 'comprar',
    dailyRate: d.daily_rate ?? undefined,
    monthlyRate: d.monthly_rate ?? undefined,
    rentalId: d.rental_id ?? undefined,
  }
}

export default function ImoveisMapa() {
  const [developments, setDevelopments] = useState<Development[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | undefined>()

  async function fetchDevelopments() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('developments')
        .select('id, slug, name, title, status, status_commercial, city, neighborhood, state, country, address, latitude, longitude, description, short_description, price_from, price_min, price_to, price_max, price, area_from, area, bedrooms, bathrooms, floors, total_units, images, image_urls, cover_image_url, developer, developer_logo, delivery_date, features, tags, is_highlighted, listing_type, video_url, brochure_url, created_at, updated_at, order')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('is_highlighted', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200)

      if (err) throw err
      setDevelopments((data ?? []).map(rowToDevelopment))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar imóveis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDevelopments() }, [])

  const withCoords = useMemo(() =>
    developments.filter(d => d.location.coordinates?.lat && d.location.coordinates?.lng),
    [developments]
  )

  const withoutCoords = developments.length - withCoords.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 0 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(200,164,74,0.12)',
            border: '1px solid rgba(200,164,74,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MapPin size={18} style={{ color: 'var(--gold, #C8A44A)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Mapa de Imóveis
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
              {loading ? 'Carregando…' : `${withCoords.length} imóveis no mapa`}
              {!loading && withoutCoords > 0 && (
                <span style={{ marginLeft: 6, color: 'rgba(200,164,74,0.7)' }}>
                  · {withoutCoords} sem coordenadas
                </span>
              )}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={fetchDevelopments}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              border: '1px solid var(--border-default)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Atualizar
          </button>
          <Link
            href="/backoffice/imoveis/novo"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              background: 'rgba(200,164,74,0.15)',
              border: '1px solid rgba(200,164,74,0.35)',
              color: 'var(--gold, #C8A44A)',
              fontSize: 13, fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <Building2 size={14} />
            Novo Imóvel
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(224,107,107,0.08)',
          border: '1px solid rgba(224,107,107,0.22)',
          color: '#E06B6B', fontSize: 13,
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Warning: no coords */}
      {!loading && withCoords.length === 0 && !error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(212,145,58,0.08)',
          border: '1px solid rgba(212,145,58,0.22)',
          color: '#D4913A', fontSize: 13,
        }}>
          <AlertCircle size={16} />
          Nenhum imóvel possui coordenadas geográficas. Adicione latitude e longitude ao editar um imóvel para exibi-lo no mapa.
        </div>
      )}

      {/* Map */}
      {!error && (
        <div style={{
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
        }}>
          {loading ? (
            <div style={{
              height: 'clamp(400px, calc(100vh - 260px), 800px)',
              background: 'var(--bg-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <MapPin size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                <p style={{ fontSize: 13 }}>Carregando imóveis…</p>
              </div>
            </div>
          ) : (
            <PropertyMap
              developments={withCoords.length > 0 ? withCoords : developments}
              height="clamp(400px, calc(100vh - 260px), 800px)"
              darkMode
              selectedId={selectedId}
              onMarkerClick={setSelectedId}
            />
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
