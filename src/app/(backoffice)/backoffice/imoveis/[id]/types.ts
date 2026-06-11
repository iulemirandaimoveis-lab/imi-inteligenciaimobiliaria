import type { useRouter } from 'next/navigation'

export interface Development {
  id: string
  name: string
  type: string
  status: string
  status_commercial?: string
  condition?: string
  price_from?: number
  price_to?: number
  area_from?: number
  area_to?: number
  bedrooms?: number
  bathrooms?: number
  parking_spaces?: number
  neighborhood?: string
  city?: string
  state?: string
  country?: string
  address?: string
  street_number?: string
  cep?: string
  description?: string
  features?: string[] | null
  gallery_images?: string[] | null
  image?: string | null
  /** @deprecated use gallery_images */
  image_urls?: string[] | null
  /** @deprecated use image */
  cover_image_url?: string | null
  video_url?: string | null
  slug?: string
  created_at?: string
  updated_at?: string
  lat?: number
  lng?: number
  developer?: { id: string; name: string; logo_url?: string | null } | null
  broker_id?: string | null
  images?: {
    main?: string
    gallery?: string[]
    videos?: string[]
    floorPlans?: string[]
    heroVideo?: string
    commonAreas?: string[]
    commonAreasVideos?: string[]
  } | null
  common_areas_images?: string[] | null
  common_areas_videos?: string[] | null
  common_areas_description?: string | null
  lot_map_amenities?: Record<string, unknown>[] | null
  virtual_tour_url?: string | null
  lot_map_enabled?: boolean | null
  lot_map_image_url?: string | null
}

export interface BrokerInfo {
  id: string
  name: string
  avatar_url?: string | null
  email?: string | null
  phone?: string | null
  creci?: string | null
}

export type TabKey = 'overview' | 'analysis' | 'analytics' | 'mapa' | 'more'

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Visão Geral' },
  { key: 'analysis', label: 'Análise' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'mapa', label: 'Mapa & Áreas Comuns' },
  { key: 'more', label: 'Mais' },
]

export interface DetailProps {
  dev: Development | null
  property: import('@/features/properties/types').IMIProperty | null
  loading: boolean
  router: ReturnType<typeof useRouter>
  id: string
  enriched: import('@/features/properties/types').IMIProperty | null
  notFound: boolean
  broker: BrokerInfo | null
  activeTab: TabKey
  setActiveTab: (t: TabKey) => void
  galleryIdx: number
  setGalleryIdx: React.Dispatch<React.SetStateAction<number>>
  rentInput: number
  setRentInput: (v: number) => void
  expensePct: number
  setExpensePct: (v: number) => void
  vacancyPct: number
  setVacancyPct: (v: number) => void
  copied: boolean
  handleCopyLink: () => void
  handleWhatsApp: () => void
  handleLinkedIn: () => void
  handleInstagramCopy: () => void
}
