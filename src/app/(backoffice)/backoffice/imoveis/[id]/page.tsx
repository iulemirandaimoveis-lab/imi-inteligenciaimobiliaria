'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { enrichProperty } from '@/features/properties/services/score.service'
// Data fetched via /api/developments route (authenticated server-side)
import { useIsMobile } from '@/hooks/use-is-mobile'
import type { Development, TabKey, DetailProps } from './types'
import { toIMIProperty } from './helpers'
import { MobileImovelDetail } from './components/MobileDetail'
import { DesktopImovelDetail } from './components/DesktopDetail'

export default function ImovelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const isMobile = useIsMobile()

  const [dev, setDev] = useState<Development | null>(null)
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

  // Fetch data via API route (bypasses RLS issues with anon client)
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/developments?id=${id}`)
      if (!res.ok) {
        setNotFound(true)
        return
      }
      const json = await res.json()
      const data = json.data ?? json

      if (!data || (!data.id && !data.name)) {
        setNotFound(true)
        return
      }

      const development = data as unknown as Development
      setDev(development)

      const prop = toIMIProperty(development)
      const rich = enrichProperty(prop)
      setEnriched(rich)

      // Seed rent input from yield estimate
      if (rich.price && rich.yield_est) {
        setRentInput(Math.round((rich.price * (rich.yield_est / 100)) / 12))
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
