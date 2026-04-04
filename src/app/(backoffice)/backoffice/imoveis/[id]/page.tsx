'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { enrichProperty } from '@/features/properties/services/score.service'
import { createClient } from '@/lib/supabase/client'
import { useIsMobile } from '@/hooks/use-is-mobile'
import type { Development, TabKey, DetailProps, BrokerInfo } from './types'
import { toIMIProperty } from './helpers'
import { MobileImovelDetail } from './components/MobileDetail'
import { DesktopImovelDetail } from './components/DesktopDetail'

export default function ImovelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const isMobile = useIsMobile()

  const [dev, setDev] = useState<Development | null>(null)
  const [broker, setBroker] = useState<BrokerInfo | null>(null)
  const [enriched, setEnriched] = useState<import('@/features/properties/types').IMIProperty | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [galleryIdx, setGalleryIdx] = useState(0)

  // Yield calculator state
  const [rentInput, setRentInput] = useState<number>(0)
  const [expensePct, setExpensePct] = useState<number>(20)
  const [vacancyPct, setVacancyPct] = useState<number>(8)

  // Copy state
  const [copied, setCopied] = useState(false)

  // Fetch data — primary: Supabase client-side (same as list page), fallback: API route
  const fetchData = useCallback(async () => {
    setLoading(true)
    setNotFound(false)
    try {
      // Primary: fetch directly from Supabase (client-side, uses active session)
      const supabase = createClient()
      const { data: directData, error: directError } = await supabase
        .from('developments')
        .select('*')
        .eq('id', id)
        .single()

      let rawData: Development | null = null

      if (!directError && directData) {
        rawData = directData as unknown as Development
      } else {
        // Fallback: try the API route (handles cases where RLS requires server-side admin)
        try {
          const res = await fetch(`/api/developments?id=${id}`)
          if (res.ok) {
            const text = await res.text()
            try {
              const json = JSON.parse(text)
              const apiData = json.data ?? json
              if (apiData && (apiData.id || apiData.name)) {
                rawData = apiData as unknown as Development
              }
            } catch {
              console.error('API returned non-JSON response for development', id)
            }
          }
        } catch {
          // Network error on fallback — continue with notFound
        }
      }

      if (!rawData) {
        setNotFound(true)
        return
      }

      setDev(rawData)

      // Fetch broker info if broker_id exists
      const brokerId = (rawData as unknown as Record<string, unknown>).broker_id as string | null
      if (brokerId) {
        const { data: brokerData } = await supabase
          .from('brokers')
          .select('id, name, avatar_url, email, phone, creci')
          .eq('id', brokerId)
          .single()
        if (brokerData) setBroker(brokerData as BrokerInfo)
      }

      try {
        const prop = toIMIProperty(rawData)
        const rich = enrichProperty(prop)
        setEnriched(rich)

        // Seed rent input from yield estimate
        if (rich.price && rich.yield_est) {
          setRentInput(Math.round((rich.price * (rich.yield_est / 100)) / 12))
        }
      } catch {
        // Enrichment failed — still show the property with basic data
        // Create a minimal enriched object so the detail page renders
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = rawData as Record<string, any>
        const fallbackEnriched = {
          id: raw.id || id,
          name: raw.name || raw.title || 'Imóvel',
          slug: raw.slug || '',
          type: raw.type || 'apartment',
          price: Number(raw.price_from || raw.price_min) || 0,
          area: Number(raw.area_from) || 0,
          bedrooms: Number(raw.bedrooms) || 0,
          bathrooms: Number(raw.bathrooms) || 0,
          parking: Number(raw.parking_spaces) || 0,
          neighborhood: raw.neighborhood || '',
          city: raw.city || '',
          state: raw.state || '',
          status: raw.status || 'launch',
          score: 50,
          yield_est: 0,
          market_delta: 0,
          price_per_sqm: 0,
          liquidity: 0,
        } as unknown as import('@/features/properties/types').IMIProperty
        setEnriched(fallbackEnriched)
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  // Copy link
  function handleCopyLink() {
    const url = `${window.location.origin}/imoveis/${dev?.slug ?? id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // WhatsApp share
  function handleWhatsApp() {
    const url = `${window.location.origin}/imoveis/${dev?.slug ?? id}`
    const text = encodeURIComponent(`Confira este imóvel: ${dev?.name}\n${url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  function handleLinkedIn() {
    const url = encodeURIComponent(`${window.location.origin}/imoveis/${dev?.slug ?? id}`)
    const title = encodeURIComponent(dev?.name ?? 'Imóvel')
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank', 'width=600,height=500')
  }

  function handleInstagramCopy() {
    const url = `${window.location.origin}/imoveis/${dev?.slug ?? id}`
    const caption = `✨ ${dev?.name ?? 'Imóvel'}${dev?.city ? ` — ${dev.city}` : ''}\n\n📍 Localização privilegiada\n💎 Oportunidade exclusiva\n\n🔗 ${url}\n\n#imoveis #imobiliaria #investimento`
    navigator.clipboard.writeText(caption).then(() => {
      alert('Caption copiada! Cole no Instagram.')
    })
  }

  // Shared props
  const sharedProps: DetailProps = {
    dev,
    property: enriched,
    loading,
    router,
    id,
    enriched,
    notFound,
    broker,
    activeTab,
    setActiveTab,
    galleryIdx,
    setGalleryIdx,
    rentInput,
    setRentInput,
    expensePct,
    setExpensePct,
    vacancyPct,
    setVacancyPct,
    copied,
    handleCopyLink,
    handleWhatsApp,
    handleLinkedIn,
    handleInstagramCopy,
  }

  if (isMobile) {
    return <MobileImovelDetail {...sharedProps} />
  }

  return <DesktopImovelDetail {...sharedProps} />
}
