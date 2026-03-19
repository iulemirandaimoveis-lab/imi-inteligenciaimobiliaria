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
  area_min?: number
  area_max?: number
  bedrooms_from?: number
  bathrooms_from?: number
  parking_from?: number
  neighborhood?: string
  city?: string
  state?: string
  country?: string
  address?: string
  street_number?: string
  cep?: string
  description?: string
  features?: string[] | null
  amenities?: string[] | null
  image_urls?: string[] | null
  cover_image_url?: string | null
  video_url?: string | null
  slug?: string
  created_at?: string
  updated_at?: string
  latitude?: number
  longitude?: number
  developer?: { id: string; name: string; logo_url?: string | null } | null
}

export type TabKey = 'overview' | 'analysis' | 'analytics' | 'more'

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Visão Geral' },
  { key: 'analysis', label: 'Análise' },
  { key: 'analytics', label: 'Analytics' },
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
