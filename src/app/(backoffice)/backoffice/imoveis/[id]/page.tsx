'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, MapPin, Building2, Bed, Bath, Car, Ruler, Edit, QrCode,
  BarChart2, Layers, Clock, TrendingUp, TrendingDown, Copy, MessageSquare,
  ChevronLeft, ChevronRight, ExternalLink, Loader2, Home, Star,
  DollarSign, Zap, Activity, CheckSquare, Users, Share2, Sparkles,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { IMIScoreDisplay } from '@/features/properties/components/IMIScoreBadge'
import {
  enrichProperty,
  calcIMIScore,
  calcYieldEst,
  calcMarketDelta,
  getScoreColor,
  calcPricePerSqm,
  calcLiquidityIndex,
} from '@/features/properties/services/score.service'
import type { IMIProperty } from '@/features/properties/types'
import { mapDevToProperty } from '@/features/properties/services/mapDevToProperty'
import { createClient } from '@/lib/supabase/client'
import { NEIGHBORHOOD_AVG_SQM } from '@/features/properties/types'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { MobileGlobalStyles } from '../mobile-ui'
import { YieldCalculator } from '@/app/(backoffice)/components/ui/YieldCalculator'
import { ValuationEngine } from '@/app/(backoffice)/components/ui/ValuationEngine'

// ─── Types ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Development = Record<string, any>

// ─── Status normalization ─────────────────────────────────────────────────────

const DB_STATUS_TO_DISPLAY: Record<string, string> = {
  launch: 'lancamento',
  available: 'disponivel',
  under_construction: 'em_construcao',
  ready: 'disponivel',
  sold: 'vendido',
  reserved: 'reservado',
  negotiating: 'em_negociacao',
  published: 'disponivel',
  draft: 'arquivado',
  campaign: 'lancamento',
  private: 'arquivado',
  disponivel: 'disponivel',
  em_negociacao: 'em_negociacao',
  reservado: 'reservado',
  vendido: 'vendido',
  lancamento: 'lancamento',
  em_construcao: 'em_construcao',
  arquivado: 'arquivado',
}

function normalizeStatus(raw?: string): string {
  if (!raw) return 'disponivel'
  return DB_STATUS_TO_DISPLAY[raw.toLowerCase()] ?? raw.toLowerCase()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(v?: number | null): string {
  if (!v) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function fmtNum(v?: number | null): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR').format(v)
}

function toIMIProperty(d: Development): IMIProperty {
  return {
    ...mapDevToProperty(d),
    created_at: d.created_at ?? undefined,
    updated_at: d.updated_at ?? undefined,
  }
}

// ─── Style constants ──────────────────────────────────────────────────────────

const EYEBROW: React.CSSProperties = {
  fontSize: '8.5px',
  letterSpacing: '3px',
  textTransform: 'uppercase',
  color: 'var(--imi-gold-500)',
  fontFamily: 'var(--font-montserrat, Figtree, sans-serif)',
  fontWeight: 700,
}

const CARD: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid rgba(184,148,58,0.18)',
  borderRadius: '4px',
}

const BTN_PRIMARY: React.CSSProperties = {
  background: 'var(--gold, var(--imi-gold-500))',
  color: 'var(--navy, #0B1120)',
  borderRadius: '4px',
  letterSpacing: '1.8px',
  textTransform: 'uppercase',
  fontWeight: 700,
  fontFamily: 'var(--font-montserrat, Figtree, sans-serif)',
  fontSize: '11px',
  padding: '10px 20px',
  border: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  whiteSpace: 'nowrap' as const,
}

const BTN_SECONDARY: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(184,148,58,0.25)',
  color: 'var(--gold, var(--imi-gold-500))',
  borderRadius: '4px',
  letterSpacing: '1.8px',
  textTransform: 'uppercase',
  fontWeight: 700,
  fontFamily: 'var(--font-montserrat, Figtree, sans-serif)',
  fontSize: '11px',
  padding: '10px 20px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  whiteSpace: 'nowrap' as const,
}

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-dm-mono, JetBrains Mono, monospace)',
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ w, h, r = '6px' }: { w: string; h: string; r?: string }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'var(--bo-surface)',
      animation: 'pulse 1.8s ease-in-out infinite',
    }} />
  )
}

// ─── Mock Comparables ─────────────────────────────────────────────────────────

function buildComparables(d: Development) {
  const neighborhood = d.neighborhood ?? 'Centro'
  const avgSqm = NEIGHBORHOOD_AVG_SQM[neighborhood] ?? 9500
  return [
    { name: `${neighborhood} Residences`, area: (d.area_min ?? 80) + 5, priceSqm: Math.round(avgSqm * 1.05), delta: 5.2 },
    { name: `Edifício ${neighborhood} Park`, area: (d.area_min ?? 80) - 8, priceSqm: Math.round(avgSqm * 0.97), delta: -3.1 },
    { name: `${neighborhood} Premier`, area: (d.area_min ?? 80) + 15, priceSqm: Math.round(avgSqm * 1.12), delta: 11.8 },
    { name: `Terraço ${neighborhood}`, area: (d.area_min ?? 80) - 3, priceSqm: Math.round(avgSqm * 0.94), delta: -6.0 },
  ]
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabKey = 'overview' | 'analysis' | 'analytics' | 'more'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Visão Geral' },
  { key: 'analysis', label: 'Análise' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'more', label: 'Mais' },
]

// ─── Props shared between layouts ─────────────────────────────────────────────

interface DetailProps {
  dev: Development | null
  property: IMIProperty | null
  loading: boolean
  router: ReturnType<typeof useRouter>
  id: string
  enriched: IMIProperty | null
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
}

// ─── Mobile component ─────────────────────────────────────────────────────────

function MobileImovelDetail({ dev, property, loading, router, id, enriched, notFound, copied, handleCopyLink, handleWhatsApp }: DetailProps) {
  const [mobileGalleryIdx, setMobileGalleryIdx] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent, imagesLen: number) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 40) {
      if (delta < 0) setMobileGalleryIdx(i => (i + 1) % imagesLen)
      else setMobileGalleryIdx(i => (i - 1 + imagesLen) % imagesLen)
    }
    touchStartX.current = null
  }, [])

  // Loading state — mobile skeleton
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: 80 }}>
        <div style={{ position: 'relative', width: '100%', height: 260, background: 'var(--bg-muted)' }} />
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Skeleton w="60%" h="26px" r="6px" />
          <Skeleton w="40%" h="14px" r="4px" />
          <Skeleton w="50%" h="32px" r="6px" />
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} w="70px" h="48px" r="8px" />)}
          </div>
          <Skeleton w="100%" h="80px" r="10px" />
          <Skeleton w="100%" h="120px" r="10px" />
        </div>
        <style suppressHydrationWarning>{`
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        `}</style>
      </div>
    )
  }

  // Not found state — mobile
  if (notFound || !dev || !enriched) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
        <Home size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 16, opacity: 0.4 }} />
        <p style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--imi-gold-500)', fontFamily: 'Figtree, sans-serif', fontWeight: 700, marginBottom: 8 }}>
          Imóvel não encontrado
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          O empreendimento solicitado não existe ou foi removido.
        </p>
        <button
          onClick={() => router.push('/backoffice/imoveis')}
          style={{ height: 52, padding: '0 24px', background: 'var(--imi-gold-500)', color: '#0B1120', border: 'none', borderRadius: 4, fontFamily: 'Figtree, sans-serif', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> Voltar à Lista
        </button>
      </div>
    )
  }

  // Derived values
  const images: string[] = (() => {
    const list: string[] = []
    if (dev.cover_image_url) list.push(dev.cover_image_url)
    if (dev.image_urls) list.push(...dev.image_urls.filter((u: string) => u !== dev.cover_image_url))
    return list
  })()

  const displayStatus = normalizeStatus(dev.status_commercial ?? dev.status)
  const statusCfg = getStatusConfig(displayStatus)

  const price = dev.price_from
  const priceSqm = enriched.price_per_sqm ?? calcPricePerSqm(price, dev.area_min) ?? null
  const score = enriched.imi_score ?? calcIMIScore(enriched)
  const scoreColor = getScoreColor(score)
  const yieldEst = enriched.yield_est ?? calcYieldEst(enriched)
  const marketDelta = enriched.market_delta_pct ?? calcMarketDelta(enriched)

  const locationStr = [dev.neighborhood, dev.city].filter(Boolean).join(' · ')
  const allFeatures = [...(dev.features ?? []), ...(dev.amenities ?? [])]

  const mobileScoreColor =
    score >= 80 ? '#5DB887' :
    score >= 60 ? 'var(--imi-gold-500)' :
    score >= 40 ? '#D4913A' :
    '#E06B6B'

  // Glassmorphism style for floating elements
  const glass: React.CSSProperties = {
    background: 'rgba(11,25,40,0.72)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(184,148,58,0.18)',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: 80 }}>
      <MobileGlobalStyles />

      {/* ── HERO IMAGE ─────────────────────────────────────────────────── */}
      <div
        style={{ position: 'relative', width: '100%', height: 'min(65vw, 320px)', background: 'var(--bg-muted)', overflow: 'hidden' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={e => handleTouchEnd(e, images.length)}
      >

        {/* Hero image or placeholder */}
        {images.length > 0 ? (
          <Image
            src={images[mobileGalleryIdx]}
            alt={dev.name}
            fill
            sizes="100vw"
            style={{ objectFit: 'cover', transition: 'opacity 200ms ease' }}
            priority
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={56} style={{ color: 'var(--text-tertiary)', opacity: 0.3 }} />
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(11,25,40,0.35) 0%, transparent 40%, rgba(11,25,40,0.85) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Floating app bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 52, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 16px',
          paddingTop: 'env(safe-area-inset-top)',
        }}>
          {/* Back button */}
          <button
            onClick={() => router.push('/backoffice/imoveis')}
            style={{
              ...glass, width: 44, height: 44, borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#EBE7E0', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} />
          </button>

          {/* Right actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: dev.name, url: `${window.location.origin}/imoveis/${dev.slug ?? id}` })
                } else {
                  handleCopyLink()
                }
              }}
              style={{
                ...glass, width: 44, height: 44, borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#EBE7E0', cursor: 'pointer',
              }}
            >
              <Share2 size={16} />
            </button>
            <Link
              href={`/backoffice/imoveis/${id}/editar`}
              style={{
                ...glass, width: 44, height: 44, borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#EBE7E0', textDecoration: 'none',
              }}
            >
              <Edit size={16} />
            </Link>
          </div>
        </div>

        {/* Gallery dots / swipe indicators */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setMobileGalleryIdx(i => (i - 1 + images.length) % images.length)}
              style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                ...glass, width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#EBE7E0', cursor: 'pointer',
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setMobileGalleryIdx(i => (i + 1) % images.length)}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                ...glass, width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#EBE7E0', cursor: 'pointer',
              }}
            >
              <ChevronRight size={18} />
            </button>
            <div style={{ position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
              {images.slice(0, 8).map((_, i) => (
                <div key={i} style={{ width: i === mobileGalleryIdx ? 16 : 5, height: 5, borderRadius: 4, background: i === mobileGalleryIdx ? 'var(--imi-gold-500)' : 'rgba(235,231,224,0.4)', transition: 'all 200ms ease' }} />
              ))}
            </div>
          </>
        )}

        {/* Score badge — bottom left */}
        <div style={{
          position: 'absolute', bottom: 12, left: 16,
          ...glass, borderRadius: 4, padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Sparkles size={13} style={{ color: mobileScoreColor }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 500, color: mobileScoreColor }}>
            IMI {score}
          </span>
        </div>

        {/* Status badge — bottom right */}
        <div style={{
          position: 'absolute', bottom: 12, right: 16,
          ...glass, borderRadius: 4, padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg.dot, flexShrink: 0 }} />
          <span style={{ fontFamily: 'Figtree, sans-serif', fontSize: 11, fontWeight: 700, color: statusCfg.color, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ─────────────────────────────────────────── */}
      <div style={{ padding: '20px 16px' }} className="detail-section">

        {/* Name + Location */}
        <h1 style={{
          fontFamily: 'Libre Baskerville, Georgia, serif',
          fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2,
          margin: '0 0 6px',
        }}>
          {dev.name}
        </h1>
        {locationStr && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 0 }}>
            <MapPin size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Figtree, sans-serif' }}>
              {locationStr}
            </span>
          </div>
        )}

        {/* Price section */}
        <div style={{ marginTop: 14 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 500,
            color: 'var(--imi-gold-500)', letterSpacing: '-0.5px', lineHeight: 1.1,
          }}>
            {fmtCurrency(price)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            {priceSqm && (
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-tertiary)' }}>
                R$ {fmtNum(priceSqm)}/m²
              </span>
            )}
            {marketDelta !== 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontFamily: 'Figtree, sans-serif', color: marketDelta > 0 ? '#E06B6B' : '#5DB887' }}>
                {marketDelta > 0
                  ? <TrendingUp size={12} />
                  : <TrendingDown size={12} />
                }
                {marketDelta > 0 ? `+${marketDelta}%` : `${marketDelta}%`} vs. mercado
              </span>
            )}
          </div>
        </div>

        {/* Spec pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            dev.bedrooms_from != null && { icon: Bed, value: `${dev.bedrooms_from}` },
            dev.bathrooms_from != null && { icon: Bath, value: `${dev.bathrooms_from}` },
            dev.parking_from != null && { icon: Car, value: `${dev.parking_from}` },
            dev.area_min != null && { icon: Ruler, value: `${dev.area_min}m²` },
          ].filter(Boolean).map((spec, i) => {
            if (!spec) return null
            const { icon: Icon, value } = spec as { icon: React.ElementType; value: string }
            return (
              <div key={i} style={{
                background: 'rgba(184,148,58,0.08)',
                border: '1px solid rgba(184,148,58,0.2)',
                borderRadius: 4, padding: '8px 12px',
                minHeight: 40, display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <Icon size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--text-primary)' }}>{value}</span>
              </div>
            )
          })}
        </div>

        {/* ── SOBRE ────────────────────────────────────────────────────── */}
        {dev.description && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--imi-gold-500)', fontFamily: 'Figtree, sans-serif', fontWeight: 700, marginBottom: 8 }}>
              Sobre
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'Figtree, sans-serif', lineHeight: 1.6, margin: 0 }}>
              {dev.description}
            </p>
          </div>
        )}

        {/* ── CARACTERÍSTICAS ──────────────────────────────────────────── */}
        {allFeatures.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--imi-gold-500)', fontFamily: 'Figtree, sans-serif', fontWeight: 700, marginBottom: 10 }}>
              Características
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {allFeatures.map((feat, i) => (
                <span key={i} style={{
                  background: 'rgba(184,148,58,0.06)',
                  border: '1px solid rgba(184,148,58,0.15)',
                  borderRadius: 4, padding: '6px 12px',
                  fontSize: 12, color: 'var(--text-secondary)',
                  fontFamily: 'Figtree, sans-serif',
                }}>
                  {feat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── ANÁLISE IMI ──────────────────────────────────────────────── */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--imi-gold-500)', fontFamily: 'Figtree, sans-serif', fontWeight: 700, marginBottom: 10 }}>
            Análise IMI
          </p>
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid rgba(184,148,58,0.15)',
            borderRadius: 4, padding: 16,
          }}>
            {/* IMI Score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 48, fontWeight: 400, color: mobileScoreColor, lineHeight: 1 }}>
                {score}
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Figtree, sans-serif', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>
                  IMI Score
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Figtree, sans-serif' }}>
                  /100 · Índice de Oportunidade
                </div>
                {/* Score bar */}
                <div style={{ height: 4, width: 120, background: 'rgba(184,148,58,0.1)', borderRadius: 4, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${score}%`, background: mobileScoreColor, borderRadius: 4 }} />
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Yield Est.', value: `${yieldEst.toFixed(1)}%`, color: '#5DB887' },
                { label: 'Delta Mkt', value: `${marketDelta > 0 ? '+' : ''}${marketDelta}%`, color: marketDelta >= 0 ? '#5DB887' : '#E06B6B' },
                { label: 'Liquidez', value: `${enriched.liquidity_index ?? calcLiquidityIndex(enriched)}`, color: '#5B9BD5' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 500, color, lineHeight: 1 }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Figtree, sans-serif', marginTop: 3 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── DETALHES TÉCNICOS ─────────────────────────────────────────── */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--imi-gold-500)', fontFamily: 'Figtree, sans-serif', fontWeight: 700, marginBottom: 10 }}>
            Detalhes Técnicos
          </p>
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid rgba(184,148,58,0.15)',
            borderRadius: 4, overflow: 'hidden',
          }}>
            {[
              { label: 'Tipo', value: dev.type ?? '—' },
              { label: 'Condição', value: dev.condition ?? '—' },
              { label: 'Incorporadora', value: dev.developer?.name ?? '—' },
              { label: 'CEP', value: dev.cep ?? '—' },
              { label: 'Estado', value: dev.state ?? '—' },
            ].map(({ label, value }, i) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px',
                borderBottom: i < 4 ? '1px solid rgba(184,148,58,0.08)' : 'none',
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Figtree, sans-serif' }}>{label}</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'Figtree, sans-serif', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── AÇÕES RÁPIDAS ─────────────────────────────────────────────── */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--imi-gold-500)', fontFamily: 'Figtree, sans-serif', fontWeight: 700, marginBottom: 10 }}>
            Ações Rápidas
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: Layers, label: 'Unidades', href: `/backoffice/imoveis/${id}/unidades` },
              { icon: BarChart2, label: 'Analytics', href: `/backoffice/imoveis/${id}/analytics` },
              { icon: QrCode, label: 'QR Code', href: `/backoffice/tracking/qr?imovel=${id}` },
              { icon: Zap, label: 'Campanha', href: `/backoffice/campanhas?imovel=${id}` },
            ].map(({ icon: Icon, label, href }) => (
              <Link key={label} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(184,148,58,0.06)',
                border: '1px solid rgba(184,148,58,0.14)',
                borderRadius: 4, padding: '14px 16px',
                textDecoration: 'none',
              }}>
                <Icon size={16} style={{ color: 'var(--imi-gold-500)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'Figtree, sans-serif', fontWeight: 500 }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── COMPARTILHAR ─────────────────────────────────────────────── */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--imi-gold-500)', fontFamily: 'Figtree, sans-serif', fontWeight: 700, marginBottom: 10 }}>
            Compartilhar
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleCopyLink}
              style={{
                flex: 1, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'transparent', border: '1px solid rgba(184,148,58,0.25)', borderRadius: 4,
                color: 'var(--imi-gold-500)', fontSize: 12, fontFamily: 'Figtree, sans-serif', fontWeight: 700,
                letterSpacing: '1.2px', textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              <Copy size={14} /> {copied ? 'Copiado!' : 'Link'}
            </button>
            <button
              onClick={handleWhatsApp}
              style={{
                flex: 1, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'transparent', border: '1px solid rgba(93,184,135,0.35)', borderRadius: 4,
                color: '#5DB887', fontSize: 12, fontFamily: 'Figtree, sans-serif', fontWeight: 700,
                letterSpacing: '1.2px', textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              <MessageSquare size={14} /> WhatsApp
            </button>
          </div>
        </div>

        {/* ── ATIVIDADE RECENTE ─────────────────────────────────────────── */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-montserrat,sans-serif)', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 12 }}>Atividade Recente</div>
          {[
            { icon: '👁', label: 'Visualizações esta semana', value: '—', color: 'var(--text-secondary)' },
            { icon: '📋', label: 'Leads este mês', value: '—', color: 'var(--text-secondary)' },
            { icon: '📅', label: 'Última atualização', value: dev?.updated_at ? new Date(dev.updated_at).toLocaleDateString('pt-BR') : '—', color: 'var(--text-secondary)' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(184,148,58,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{label}</span>
              </div>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono,monospace)', color }}>{value}</span>
            </div>
          ))}
        </div>

      </div>

      {/* ── FIXED BOTTOM ACTION BAR ─────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--nav-bg, var(--bg-surface))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(184,148,58,0.18)',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}>
        {/* Edit button */}
        <Link
          href={`/backoffice/imoveis/${id}/editar`}
          className="mob-btn-tap"
          style={{
            flex: 1, height: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'transparent', border: '1px solid rgba(184,148,58,0.35)', borderRadius: 4,
            color: 'var(--imi-gold-500)', textDecoration: 'none',
            fontSize: 12, fontFamily: 'Figtree, sans-serif', fontWeight: 700,
            letterSpacing: '1px', textTransform: 'uppercase',
            touchAction: 'manipulation',
          }}
        >
          <Edit size={15} /> Editar
        </Link>

        {/* Ver no Site button (only if slug) */}
        {dev.slug && (
          <Link
            href={`/imoveis/${dev.slug}`}
            target="_blank"
            className="mob-btn-tap"
            style={{
              flex: 1, height: 52,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'transparent', border: '1px solid rgba(91,155,213,0.4)', borderRadius: 4,
              color: '#5B9BD5', textDecoration: 'none',
              fontSize: 12, fontFamily: 'Figtree, sans-serif', fontWeight: 700,
              letterSpacing: '0.8px', textTransform: 'uppercase',
              touchAction: 'manipulation',
            }}
          >
            <ExternalLink size={14} /> Ver Site
          </Link>
        )}

        {/* Primary action — WhatsApp */}
        <button
          onClick={handleWhatsApp}
          className="mob-btn-tap"
          style={{
            flex: 2, height: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'var(--imi-gold-500)', border: 'none', borderRadius: 4,
            color: '#0B1120', fontSize: 13,
            fontFamily: 'Figtree, sans-serif', fontWeight: 700,
            letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
            touchAction: 'manipulation',
          }}
        >
          <MessageSquare size={15} /> Contato
        </button>
      </div>

      <style suppressHydrationWarning>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .detail-section { animation: fadeSlideUp 400ms cubic-bezier(0.16,1,0.3,1) both; }
        .detail-section:nth-child(1) { animation-delay: 50ms; }
        .detail-section:nth-child(2) { animation-delay: 120ms; }
        .detail-section:nth-child(3) { animation-delay: 190ms; }
        .detail-section:nth-child(4) { animation-delay: 260ms; }
        .detail-section:nth-child(5) { animation-delay: 330ms; }
        @media (prefers-reduced-motion: reduce) { .detail-section { animation: none !important; } }
      `}</style>
    </div>
  )
}

// ─── Floating Quick-Action Toolbar ────────────────────────────────────────────

function FloatingActions({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      position: 'fixed', right: 24, top: '50%', transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 50,
    }}>
      {[
        { icon: Edit, label: 'Editar', href: `/backoffice/imoveis/${id}/editar` },
        { icon: BarChart2, label: 'Analytics', href: `/backoffice/imoveis/${id}/analytics` },
        { icon: Layers, label: 'Timeline', href: `/backoffice/imoveis/${id}/timeline` },
        { icon: Clock, label: 'Unidades', href: `/backoffice/imoveis/${id}/unidades` },
      ].map(({ icon: Icon, label, href }) => (
        <a key={label} href={href} title={label} style={{
          width: 40, height: 40, borderRadius: 4,
          background: 'var(--bg-elevated)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', textDecoration: 'none',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(184,148,58,0.5)'; (e.currentTarget as HTMLElement).style.color = 'var(--imi-gold-500)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(184,148,58,0.18)'; (e.currentTarget as HTMLElement).style.color = '#9FAAB8' }}
        >
          <Icon size={16} />
        </a>
      ))}
      <button onClick={handleShare} title={copied ? 'Copiado!' : 'Copiar link'} style={{
        width: 40, height: 40, borderRadius: 4,
        background: copied ? 'rgba(107,184,123,0.2)' : 'rgba(11,25,40,0.9)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${copied ? 'rgba(107,184,123,0.4)' : 'rgba(184,148,58,0.18)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: copied ? '#6BB87B' : '#9FAAB8', cursor: 'pointer',
        transition: 'all 0.2s',
      }}>
        {copied ? <CheckSquare size={16} /> : <Share2 size={16} />}
      </button>
    </div>
  )
}

// ─── Status options ────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'disponivel', label: 'Disponível', color: '#6BB87B' },
  { value: 'em_negociacao', label: 'Em Negociação', color: 'var(--imi-gold-500)' },
  { value: 'reservado', label: 'Reservado', color: '#A89EC4' },
  { value: 'vendido', label: 'Vendido', color: '#7B9EC4' },
  { value: 'lancamento', label: 'Lançamento', color: '#E8A87C' },
]

// ─── Desktop component ────────────────────────────────────────────────────────

function DesktopImovelDetail({
  dev, enriched, loading, notFound, router, id,
  activeTab, setActiveTab, galleryIdx, setGalleryIdx,
  rentInput, setRentInput, expensePct, setExpensePct,
  vacancyPct, setVacancyPct, copied, handleCopyLink, handleWhatsApp,
}: DetailProps) {
  const [statusOpen, setStatusOpen] = useState(false)
  const [localStatus, setLocalStatus] = useState(() => normalizeStatus(dev?.status_commercial ?? dev?.status))

  if (loading) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingTop: 8 }}>
          <Skeleton w="36px" h="36px" r="8px" />
          <Skeleton w="200px" h="14px" />
        </div>
        <Skeleton w="100%" h="420px" r="12px" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginTop: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton w="100%" h="48px" r="8px" />
            <Skeleton w="100%" h="200px" r="12px" />
            <Skeleton w="100%" h="160px" r="12px" />
          </div>
          <Skeleton w="100%" h="360px" r="12px" />
        </div>
      </div>
    )
  }

  if (notFound || !dev || !enriched) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
        <Home size={48} style={{ color: T.textDim, margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
        <p style={{ ...EYEBROW, marginBottom: 8 }}>Imóvel não encontrado</p>
        <p style={{ color: T.textMuted, fontSize: 14, marginBottom: 24 }}>
          O empreendimento solicitado não existe ou foi removido.
        </p>
        <button onClick={() => router.push('/backoffice/imoveis')} style={BTN_PRIMARY}>
          <ArrowLeft size={14} /> Voltar à Lista
        </button>
      </div>
    )
  }

  // Derived values
  const images: string[] = (() => {
    const list: string[] = []
    if (dev.cover_image_url) list.push(dev.cover_image_url)
    if (dev.image_urls) list.push(...dev.image_urls.filter((u: string) => u !== dev.cover_image_url))
    return list
  })()

  const displayStatus = normalizeStatus(dev.status_commercial ?? dev.status)
  const statusCfg = getStatusConfig(displayStatus)

  const price = dev.price_from
  const priceSqm = enriched.price_per_sqm ?? calcPricePerSqm(price, dev.area_min) ?? null
  const score = enriched.imi_score ?? calcIMIScore(enriched)
  const scoreColor = getScoreColor(score)
  const yieldEst = enriched.yield_est ?? calcYieldEst(enriched)
  const marketDelta = enriched.market_delta_pct ?? calcMarketDelta(enriched)
  const liquidityIdx = enriched.liquidity_index ?? calcLiquidityIndex(enriched)
  const comparables = buildComparables(dev)

  const fullAddress = [dev.address, dev.street_number, dev.neighborhood, dev.city, dev.state]
    .filter(Boolean).join(', ')

  const grossYield = price ? ((rentInput * 12) / price) * 100 : 0
  const netRent = rentInput * (1 - expensePct / 100) * (1 - vacancyPct / 100)
  const netYield = price ? ((netRent * 12) / price) * 100 : 0
  const monthlyCashflow = netRent

  return (
    <div className="imovel-detail-wrap" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 48px' }}>

      {/* ── Back nav ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 20px' }}>
        <button
          onClick={() => router.push('/backoffice/imoveis')}
          style={{
            width: 36, height: 36, borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: T.surface, border: `1px solid ${T.border}`,
            color: T.textDim, cursor: 'pointer', flexShrink: 0,
            transition: 'all 200ms ease', minWidth: 44, minHeight: 44,
          }}
          className="imovel-back-btn"
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ ...EYEBROW }}>Imóveis</span>
          <ChevronRight size={10} style={{ color: T.textDim }} />
          <span style={{ ...EYEBROW, color: T.textMuted }}>{dev.name}</span>
        </div>
        {/* Status pill with quick-toggle */}
        <div style={{ marginLeft: 'auto', position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 4,
            background: getStatusConfig(localStatus).bg, color: getStatusConfig(localStatus).color,
            fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-montserrat, sans-serif)',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: getStatusConfig(localStatus).dot }} />
            {getStatusConfig(localStatus).label}
          </span>
          <button
            onClick={() => setStatusOpen(o => !o)}
            title="Alterar status"
            style={{
              width: 24, height: 24, borderRadius: 4,
              background: 'rgba(184,148,58,0.08)',
              border: '1px solid rgba(184,148,58,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            <Edit size={11} />
          </button>
          {statusOpen && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, zIndex: 100,
              background: 'rgba(11,25,40,0.97)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(184,148,58,0.2)',
              borderRadius: 4, padding: '6px 0',
              minWidth: 160,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.from('developments').update({ status: opt.value }).eq('id', id)
                    setLocalStatus(opt.value)
                    setStatusOpen(false)
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                    color: localStatus === opt.value ? opt.color : '#9FAAB8',
                    fontSize: 12, fontFamily: 'var(--font-montserrat, sans-serif)',
                    fontWeight: localStatus === opt.value ? 700 : 400,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(184,148,58,0.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: opt.color, flexShrink: 0 }} />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Hero Gallery ───────────────────────────────────────────────────── */}
      <div className="imovel-hero" style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', height: 'min(65vh, 460px)', background: T.surface }}>
        {images.length > 0 ? (
          <>
            <Image
              src={images[galleryIdx]}
              alt={dev.name}
              fill
              sizes="(max-width: 768px) 100vw, 1280px"
              style={{ objectFit: 'cover' }}
              priority
            />
            {/* Dark gradient overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(11,25,40,0.85) 0%, rgba(11,25,40,0.1) 50%, transparent 100%)',
            }} />
            {/* Property name on hero */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '24px 28px',
            }}>
              <p style={{ ...EYEBROW, marginBottom: 6 }}>
                {dev.developer?.name ?? dev.type}
              </p>
              <h1 style={{
                fontFamily: 'var(--font-playfair, Libre Baskerville, Georgia, serif)',
                fontSize: 'clamp(22px, 3.5vw, 34px)',
                fontWeight: 700, color: '#EBE7E0', lineHeight: 1.15,
                margin: 0,
              }}>
                {dev.name}
              </h1>
              {fullAddress && (
                <p style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(235,231,224,0.7)', fontSize: 13, marginTop: 6 }}>
                  <MapPin size={12} />
                  {fullAddress}
                </p>
              )}
            </div>
            {/* Prev/Next arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setGalleryIdx(i => (i - 1 + images.length) % images.length)}
                  style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(11,25,40,0.75)', border: '1px solid rgba(184,148,58,0.3)',
                    color: '#EBE7E0', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setGalleryIdx(i => (i + 1) % images.length)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(11,25,40,0.75)', border: '1px solid rgba(184,148,58,0.3)',
                    color: '#EBE7E0', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <ChevronRight size={18} />
                </button>
                {/* Image counter */}
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  background: 'rgba(11,25,40,0.75)', border: '1px solid rgba(184,148,58,0.2)',
                  borderRadius: 4, padding: '4px 10px',
                  ...MONO, fontSize: 11, color: 'rgba(235,231,224,0.8)',
                }}>
                  {galleryIdx + 1} / {images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={64} style={{ color: T.textDim, opacity: 0.2 }} />
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {images.slice(0, 8).map((img, idx) => (
            <button
              key={idx}
              onClick={() => setGalleryIdx(idx)}
              style={{
                flexShrink: 0, width: 60, height: 40, borderRadius: 4, overflow: 'hidden',
                border: `2px solid ${idx === galleryIdx ? 'var(--gold, var(--imi-gold-500))' : 'transparent'}`,
                cursor: 'pointer', position: 'relative', background: T.surface,
                opacity: idx === galleryIdx ? 1 : 0.6,
                transition: 'all 150ms ease',
              }}
            >
              <Image src={img} alt="" fill sizes="60px" style={{ objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}

      {/* ── Main layout: tabs + sidebar ────────────────────────────────────── */}
      <div className="imovel-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24, marginTop: 24, alignItems: 'start' }}>

        {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
        <div>
          {/* Sticky tab bar */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'var(--bo-bg, var(--navy, #0B1120))',
            borderBottom: '1px solid rgba(184,148,58,0.14)',
            marginBottom: 20,
          }}>
            <div className="imovel-tabs" style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '12px 20px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${activeTab === tab.key ? 'var(--gold, var(--imi-gold-500))' : 'transparent'}`,
                    color: activeTab === tab.key ? 'var(--gold, var(--imi-gold-500))' : T.textMuted,
                    fontFamily: 'var(--font-montserrat, Figtree, sans-serif)',
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    marginBottom: '-1px',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── TAB: VISÃO GERAL ─────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Description */}
              {dev.description && (
                <div style={{ ...CARD, padding: 24 }}>
                  <p style={{ ...EYEBROW, marginBottom: 10 }}>Sobre o Empreendimento</p>
                  <p style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                    {dev.description}
                  </p>
                </div>
              )}

              {/* Specs grid */}
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 16 }}>Especificações</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                  {[
                    { icon: Ruler, label: 'Área', value: dev.area_min ? `${dev.area_min}${dev.area_max && dev.area_max !== dev.area_min ? `–${dev.area_max}` : ''} m²` : '—' },
                    { icon: Bed, label: 'Quartos', value: dev.bedrooms_from ? `${dev.bedrooms_from}+` : '—' },
                    { icon: Bath, label: 'Banheiros', value: dev.bathrooms_from ? `${dev.bathrooms_from}+` : '—' },
                    { icon: Car, label: 'Vagas', value: dev.parking_from ? `${dev.parking_from}+` : '—' },
                    { icon: Building2, label: 'Tipo', value: dev.type ?? '—' },
                    { icon: Activity, label: 'Condição', value: dev.condition ?? '—' },
                    { icon: CheckSquare, label: 'Status', value: statusCfg.label },
                    { icon: MapPin, label: 'Cidade', value: dev.city ?? '—' },
                    { icon: MapPin, label: 'Bairro', value: dev.neighborhood ?? '—' },
                    { icon: Home, label: 'CEP', value: dev.cep ?? '—' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} style={{
                      background: 'var(--bo-surface)',
                      border: '1px solid rgba(184,148,58,0.1)',
                      borderRadius: 4, padding: '12px 14px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                        <Icon size={12} style={{ color: 'var(--gold, var(--imi-gold-500))', flexShrink: 0 }} />
                        <span style={{ ...EYEBROW, fontSize: '8px' }}>{label}</span>
                      </div>
                      <span style={{ ...MONO, fontSize: 14, fontWeight: 500, color: T.text }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features & Amenities */}
              {((dev.features && dev.features.length > 0) || (dev.amenities && dev.amenities.length > 0)) && (
                <div style={{ ...CARD, padding: 24 }}>
                  <p style={{ ...EYEBROW, marginBottom: 16 }}>Diferenciais & Comodidades</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[...(dev.features ?? []), ...(dev.amenities ?? [])].map((item, i) => (
                      <span key={i} style={{
                        padding: '5px 12px', borderRadius: 4,
                        background: 'rgba(184,148,58,0.08)',
                        border: '1px solid rgba(184,148,58,0.18)',
                        color: T.textMuted, fontSize: 12,
                        fontFamily: 'var(--font-montserrat, sans-serif)',
                        fontWeight: 500,
                      }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 16 }}>Localização</p>
                <div style={{
                  background: 'var(--bo-surface)',
                  borderRadius: 4, overflow: 'hidden',
                  height: 180,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(184,148,58,0.1)',
                  flexDirection: 'column', gap: 8, color: T.textDim,
                }}>
                  <MapPin size={28} style={{ opacity: 0.3 }} />
                  <span style={{ fontSize: 12 }}>
                    {fullAddress || 'Endereço não informado'}
                  </span>
                  {dev.latitude && dev.longitude && (
                    <a
                      href={`https://maps.google.com/?q=${dev.latitude},${dev.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...BTN_SECONDARY, padding: '6px 14px', fontSize: 10, marginTop: 4 }}
                    >
                      <ExternalLink size={10} /> Ver no Maps
                    </a>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                  {[
                    ['Bairro', dev.neighborhood],
                    ['Cidade', dev.city],
                    ['Estado', dev.state],
                    ['País', dev.country],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label as string} style={{ fontSize: 13 }}>
                      <span style={{ color: T.textDim, fontSize: 11 }}>{label}</span>
                      <br />
                      <span style={{ color: T.text, fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Comparables */}
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 4 }}>Comparáveis de Mercado</p>
                <p style={{ fontSize: 11, color: T.textDim, marginBottom: 16 }}>
                  * Dados ilustrativos baseados em médias do bairro {dev.neighborhood ?? ''}
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(184,148,58,0.14)' }}>
                        {['Empreendimento', 'Área', 'Preço/m²', 'Δ Mercado'].map(h => (
                          <th key={h} style={{
                            ...EYEBROW, fontSize: '8px',
                            textAlign: 'left', padding: '6px 12px 8px',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Subject row */}
                      <tr style={{ background: 'rgba(184,148,58,0.06)', borderBottom: '1px solid rgba(184,148,58,0.1)' }}>
                        <td style={{ padding: '10px 12px', color: 'var(--gold, var(--imi-gold-500))', fontWeight: 600 }}>
                          {dev.name} <span style={{ fontSize: 10, opacity: 0.7 }}>(este)</span>
                        </td>
                        <td style={{ ...MONO, padding: '10px 12px', color: T.text }}>
                          {dev.area_min ? `${dev.area_min} m²` : '—'}
                        </td>
                        <td style={{ ...MONO, padding: '10px 12px', color: T.text }}>
                          {priceSqm ? `R$ ${fmtNum(priceSqm)}` : '—'}
                        </td>
                        <td style={{ ...MONO, padding: '10px 12px', color: T.textDim }}>—</td>
                      </tr>
                      {comparables.map((comp, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(184,148,58,0.06)' }}>
                          <td style={{ padding: '10px 12px', color: T.text }}>{comp.name}</td>
                          <td style={{ ...MONO, padding: '10px 12px', color: T.textMuted }}>{comp.area} m²</td>
                          <td style={{ ...MONO, padding: '10px 12px', color: T.textMuted }}>R$ {fmtNum(comp.priceSqm)}</td>
                          <td style={{ ...MONO, padding: '10px 12px' }}>
                            <span style={{
                              color: comp.delta > 0 ? '#E06B6B' : '#5DB887',
                              display: 'flex', alignItems: 'center', gap: 3,
                            }}>
                              {comp.delta > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                              {comp.delta > 0 ? '+' : ''}{comp.delta}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: ANÁLISE ─────────────────────────────────────────────── */}
          {activeTab === 'analysis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Investment Metrics */}
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 16 }}>Métricas de Investimento</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {[
                    { label: 'IMI Score', value: `${score}`, unit: '/100', color: scoreColor },
                    { label: 'Yield Estimado', value: `${yieldEst.toFixed(1)}%`, unit: 'a.a.', color: '#5DB887' },
                    { label: 'Índice Liquidez', value: `${liquidityIdx}`, unit: '/100', color: '#5B9BD5' },
                    { label: 'Delta Mercado', value: `${marketDelta > 0 ? '+' : ''}${marketDelta}%`, unit: '', color: marketDelta >= 0 ? '#5DB887' : '#E06B6B' },
                    { label: 'ROI 12m Estimado', value: `${enriched.roi_12m?.toFixed(1) ?? '—'}%`, unit: '', color: '#D4B86A' },
                    { label: 'Preço/m²', value: priceSqm ? `R$ ${fmtNum(priceSqm)}` : '—', unit: '', color: T.text as string },
                  ].map(({ label, value, unit, color }) => (
                    <div key={label} style={{
                      background: 'var(--bo-surface)',
                      border: '1px solid rgba(184,148,58,0.1)',
                      borderRadius: 4, padding: '16px 18px',
                    }}>
                      <p style={{ ...EYEBROW, fontSize: '8px', marginBottom: 8 }}>{label}</p>
                      <p style={{ ...MONO, fontSize: 24, fontWeight: 400, color, lineHeight: 1, margin: 0 }}>
                        {value}
                        {unit && <span style={{ fontSize: 12, color: T.textDim, marginLeft: 4 }}>{unit}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* IMI Score full display */}
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 16 }}>IMI Score · Índice de Oportunidade</p>
                <IMIScoreDisplay score={score} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginTop: 20 }}>
                  {[
                    { label: 'Yield', pct: 25, score: Math.round((yieldEst / 12) * 25) },
                    { label: 'Mercado', pct: 20, score: Math.round(Math.min(100, Math.max(0, (marketDelta + 10) / 30 * 100)) * 0.2) },
                    { label: 'Liquidez', pct: 20, score: Math.round(liquidityIdx * 0.2) },
                    { label: 'Tendência', pct: 20, score: 14 },
                    { label: 'Localização', pct: 15, score: 11 },
                  ].map(comp => (
                    <div key={comp.label} style={{ textAlign: 'center' }}>
                      <div style={{ ...EYEBROW, fontSize: '8px', marginBottom: 4 }}>{comp.label}</div>
                      <div style={{ ...MONO, fontSize: 13, color: scoreColor }}>{comp.score}</div>
                      <div style={{ fontSize: 10, color: T.textDim }}>/{comp.pct}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Yield Calculator */}
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 16 }}>Calculadora de Yield</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={{ ...EYEBROW, fontSize: '8px', display: 'block', marginBottom: 6 }}>
                      Aluguel Mensal (R$)
                    </label>
                    <input
                      type="number"
                      value={rentInput}
                      onChange={e => setRentInput(Number(e.target.value))}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 4,
                        background: 'var(--bo-surface)',
                        border: '1px solid rgba(184,148,58,0.2)',
                        color: T.text, outline: 'none',
                        ...MONO, fontSize: 14,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ ...EYEBROW, fontSize: '8px', display: 'block', marginBottom: 6 }}>
                      Despesas (%)
                    </label>
                    <input
                      type="number"
                      value={expensePct}
                      onChange={e => setExpensePct(Number(e.target.value))}
                      min={0} max={100}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 4,
                        background: 'var(--bo-surface)',
                        border: '1px solid rgba(184,148,58,0.2)',
                        color: T.text, outline: 'none',
                        ...MONO, fontSize: 14,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ ...EYEBROW, fontSize: '8px', display: 'block', marginBottom: 6 }}>
                      Vacância (%)
                    </label>
                    <input
                      type="number"
                      value={vacancyPct}
                      onChange={e => setVacancyPct(Number(e.target.value))}
                      min={0} max={100}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 4,
                        background: 'var(--bo-surface)',
                        border: '1px solid rgba(184,148,58,0.2)',
                        color: T.text, outline: 'none',
                        ...MONO, fontSize: 14,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Calculator results */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Yield Bruto', value: `${grossYield.toFixed(2)}%`, color: '#5DB887' },
                    { label: 'Yield Líquido', value: `${netYield.toFixed(2)}%`, color: '#5B9BD5' },
                    { label: 'Cashflow Mensal', value: fmtCurrency(monthlyCashflow), color: 'var(--gold, var(--imi-gold-500))' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      background: 'var(--bo-surface)',
                      border: '1px solid rgba(184,148,58,0.1)',
                      borderRadius: 4, padding: '14px 16px',
                      textAlign: 'center',
                    }}>
                      <div style={{ ...EYEBROW, fontSize: '8px', marginBottom: 6 }}>{label}</div>
                      <div style={{ ...MONO, fontSize: 20, color, fontWeight: 400 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ROI Projection */}
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 16 }}>Projeção de Retorno</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: '12 meses', roi: yieldEst * 1.0, color: '#5B9BD5' },
                    { label: '24 meses', roi: yieldEst * 2.1, color: '#5DB887' },
                    { label: '36 meses', roi: yieldEst * 3.4, color: 'var(--gold, var(--imi-gold-500))' },
                  ].map(({ label, roi, color }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: T.textMuted, fontFamily: 'var(--font-montserrat, sans-serif)' }}>{label}</span>
                        <span style={{ ...MONO, fontSize: 13, color, fontWeight: 500 }}>+{roi.toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(184,148,58,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, (roi / 30) * 100)}%`,
                          background: color, borderRadius: 4,
                          transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                        }} />
                      </div>
                      <div style={{ fontSize: 11, color: T.textDim, marginTop: 3 }}>
                        Estimativa acumulada com apreciação
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Análise Financeira ──────────────────────────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="max-lg:grid-cols-1">
                <YieldCalculator
                  propertyValue={dev?.price_from || 800000}
                  monthlyRent={rentInput > 0 ? rentInput : undefined}
                  annualExpenses={undefined}
                />
                <ValuationEngine
                  estimatedValue={
                    priceSqm && dev.area_min
                      ? Math.round(priceSqm)
                      : 14500
                  }
                  confidence={72}
                  methodology="Hedônico + Comparativo (NBR 14653)"
                  lastUpdated="há 3 dias"
                  comparables={[
                    { address: 'Imóvel similar próximo', value: 15200, distance: '150m', diff: 4.8 },
                    { address: 'Ref. mesmo bairro', value: 13800, distance: '300m', diff: -4.8 },
                    { address: 'Lançamento vizinho', value: 16500, distance: '500m', diff: 13.8 },
                  ]}
                />
              </div>
            </div>
          )}

          {/* ── TAB: ANALYTICS ───────────────────────────────────────────── */}
          {activeTab === 'analytics' && (
            <div style={{ ...CARD, padding: 32, textAlign: 'center' }}>
              <BarChart2 size={40} style={{ color: 'var(--gold, var(--imi-gold-500))', margin: '0 auto 16px', display: 'block' }} />
              <p style={{ ...EYEBROW, marginBottom: 8 }}>Analytics de Performance</p>
              <p style={{ color: T.textMuted, fontSize: 14, marginBottom: 24, maxWidth: 420, margin: '0 auto 24px' }}>
                Veja cliques, leads gerados, conversões, fontes de tráfego e muito mais na página de analytics dedicada.
              </p>
              <Link href={`/backoffice/imoveis/${id}/analytics`} style={BTN_PRIMARY}>
                <BarChart2 size={14} /> Abrir Analytics Completo
              </Link>
            </div>
          )}

          {/* ── TAB: MAIS ────────────────────────────────────────────────── */}
          {activeTab === 'more' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 16 }}>Ações Rápidas</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {[
                    { icon: Edit, label: 'Editar Imóvel', href: `/backoffice/imoveis/${id}/editar`, primary: true },
                    { icon: Layers, label: 'Ver Unidades', href: `/backoffice/imoveis/${id}/unidades`, primary: false },
                    { icon: BarChart2, label: 'Analytics', href: `/backoffice/imoveis/${id}/analytics`, primary: false },
                    { icon: Clock, label: 'Timeline', href: `/backoffice/imoveis/${id}/timeline`, primary: false },
                    { icon: QrCode, label: 'Gerar QR Code', href: `/backoffice/tracking/qr?imovel=${id}`, primary: false },
                    { icon: Zap, label: 'Criar Campanha', href: `/backoffice/campanhas?imovel=${id}`, primary: false },
                  ].map(({ icon: Icon, label, href, primary }) => (
                    <Link
                      key={label}
                      href={href}
                      style={primary ? BTN_PRIMARY : BTN_SECONDARY}
                    >
                      <Icon size={14} /> {label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Share section */}
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 16 }}>Compartilhar</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={handleCopyLink} style={BTN_SECONDARY}>
                    <Copy size={13} /> {copied ? 'Copiado!' : 'Copiar Link'}
                  </button>
                  <button onClick={handleWhatsApp} style={{ ...BTN_SECONDARY, borderColor: 'rgba(93,184,135,0.4)', color: '#5DB887' }}>
                    <MessageSquare size={13} /> WhatsApp
                  </button>
                </div>
              </div>

              {/* Meta info */}
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 14 }}>Informações do Registro</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    ['ID', dev.id],
                    ['Slug', dev.slug ?? '—'],
                    ['Criado em', dev.created_at ? new Date(dev.created_at).toLocaleDateString('pt-BR') : '—'],
                    ['Atualizado em', dev.updated_at ? new Date(dev.updated_at).toLocaleDateString('pt-BR') : '—'],
                    ['Desenvolvedor', dev.developer?.name ?? '—'],
                    ['Vídeo', dev.video_url ? 'Sim' : 'Não'],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <p style={{ ...EYEBROW, fontSize: '8px', marginBottom: 3 }}>{label}</p>
                      <p style={{ ...MONO, fontSize: 12, color: T.textMuted, margin: 0, wordBreak: 'break-all' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────────── */}
        <div style={{ position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Price block */}
          <div style={{ ...CARD, padding: 24 }}>
            <p style={{ ...EYEBROW, marginBottom: 8 }}>Preço</p>
            <div style={{ ...MONO, fontSize: 30, fontWeight: 400, color: 'var(--gold, var(--imi-gold-500))', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
              {fmtCurrency(price)}
            </div>
            {dev.price_to && dev.price_to !== dev.price_from && (
              <div style={{ ...MONO, fontSize: 14, color: T.textMuted, marginTop: 2 }}>
                até {fmtCurrency(dev.price_to)}
              </div>
            )}
            {priceSqm && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: T.textDim }}>Preço/m²:</span>
                <span style={{ ...MONO, fontSize: 13, color: T.textMuted }}>R$ {fmtNum(priceSqm)}</span>
              </div>
            )}

            <div style={{ height: '1px', background: 'rgba(184,148,58,0.14)', margin: '16px 0' }} />

            {/* IMI Score */}
            <IMIScoreDisplay score={score} />

            {/* Score breakdown */}
            {score > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Liquidez', value: enriched.liquidity_index ?? Math.round((score || 0) * 0.9) },
                  { label: 'Yield Est.', value: enriched.yield_est ? Math.round(enriched.yield_est * 10) : Math.round((score || 0) * 0.85) },
                  { label: 'Localização', value: Math.round((score || 0) * 1.05) },
                ].map(({ label, value }) => {
                  const pct = Math.min(100, Math.max(0, value))
                  return (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 9, fontFamily: 'var(--font-montserrat,sans-serif)', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{label}</span>
                        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono,monospace)', color: 'var(--text-secondary)' }}>{pct}</span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 70 ? 'var(--imi-gold-500)' : pct >= 50 ? '#E8A87C' : '#9FAAB8', borderRadius: 4, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ height: '1px', background: 'rgba(184,148,58,0.14)', margin: '16px 0' }} />

            {/* Yield + Market delta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.textDim, fontFamily: 'var(--font-montserrat, sans-serif)' }}>
                  Yield Estimado
                </span>
                <span style={{ ...MONO, fontSize: 14, color: '#5DB887', fontWeight: 500 }}>
                  {yieldEst.toFixed(1)}% a.a.
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.textDim, fontFamily: 'var(--font-montserrat, sans-serif)' }}>
                  vs Mercado
                </span>
                <span style={{
                  ...MONO, fontSize: 13, fontWeight: 500,
                  color: marketDelta >= 0 ? '#5DB887' : '#E06B6B',
                  display: 'flex', alignItems: 'center', gap: 3,
                }}>
                  {marketDelta >= 0
                    ? <TrendingDown size={12} />
                    : <TrendingUp size={12} />
                  }
                  {marketDelta >= 0 ? `${marketDelta}% abaixo` : `${Math.abs(marketDelta)}% acima`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.textDim, fontFamily: 'var(--font-montserrat, sans-serif)' }}>
                  Liquidez
                </span>
                <span style={{ ...MONO, fontSize: 13, color: '#5B9BD5' }}>
                  {liquidityIdx}/100
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ ...CARD, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ ...EYEBROW, marginBottom: 6 }}>Ações</p>
            <Link href={`/backoffice/imoveis/${id}/editar`} style={{ ...BTN_PRIMARY, justifyContent: 'center' }}>
              <Edit size={13} /> Editar Imóvel
            </Link>
            <Link href={`/backoffice/imoveis/${id}/unidades`} style={{ ...BTN_SECONDARY, justifyContent: 'center' }}>
              <Layers size={13} /> Ver Unidades
            </Link>
            <Link href={`/backoffice/imoveis/${id}/analytics`} style={{ ...BTN_SECONDARY, justifyContent: 'center' }}>
              <BarChart2 size={13} /> Analytics
            </Link>
            <Link href={`/backoffice/tracking/qr?imovel=${id}`} style={{ ...BTN_SECONDARY, justifyContent: 'center' }}>
              <QrCode size={13} /> Gerar QR Code
            </Link>
            <Link href={`/backoffice/campanhas?imovel=${id}`} style={{ ...BTN_SECONDARY, justifyContent: 'center' }}>
              <Zap size={13} /> Criar Campanha
            </Link>
          </div>

          {/* Share */}
          <div style={{ ...CARD, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ ...EYEBROW, marginBottom: 4 }}>Compartilhar</p>
            <button onClick={handleCopyLink} style={{ ...BTN_SECONDARY, justifyContent: 'center' }}>
              <Copy size={13} /> {copied ? 'Copiado!' : 'Copiar Link'}
            </button>
            <button onClick={handleWhatsApp} style={{
              ...BTN_SECONDARY,
              justifyContent: 'center',
              borderColor: 'rgba(93,184,135,0.35)',
              color: '#5DB887',
            }}>
              <MessageSquare size={13} /> WhatsApp
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: dev.name, url: `${window.location.origin}/imoveis/${dev.slug ?? id}` })
                }
              }}
              style={{ ...BTN_SECONDARY, justifyContent: 'center' }}
            >
              <Share2 size={13} /> Compartilhar
            </button>
          </div>

          {/* Developer card */}
          {dev.developer && (
            <div style={{ ...CARD, padding: 16 }}>
              <p style={{ ...EYEBROW, marginBottom: 10 }}>Incorporadora</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {dev.developer.logo_url ? (
                  <div style={{ width: 36, height: 36, borderRadius: 4, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    <Image src={dev.developer.logo_url} alt={dev.developer.name} fill sizes="36px" style={{ objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{
                    width: 36, height: 36, borderRadius: 4, flexShrink: 0,
                    background: 'rgba(184,148,58,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Building2 size={16} style={{ color: 'var(--gold, var(--imi-gold-500))' }} />
                  </div>
                )}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{dev.developer.name}</p>
                  <p style={{ fontSize: 11, color: T.textDim, margin: 0 }}>Incorporadora</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating quick-action toolbar — desktop only */}
      <FloatingActions id={id} />

      <style suppressHydrationWarning>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .imovel-tabs::-webkit-scrollbar { display: none; }
        .imovel-tabs button { flex-shrink: 0; }

        /* ─── Tablet ─── */
        @media (max-width: 900px) {
          .imovel-grid { grid-template-columns: 1fr !important; }
        }

        /* ─── Mobile ─── */
        @media (max-width: 767px) {
          /* Page padding */
          .imovel-detail-wrap { padding: 0 14px 80px !important; }
          .imovel-grid { padding: 0 !important; margin-top: 16px !important; }

          /* Hero gallery smaller on mobile */
          .imovel-hero { height: min(55vw, 260px) !important; }

          /* Tab bar — font smaller */
          .imovel-tabs button {
            padding: 10px 14px !important;
            font-size: 11px !important;
          }

          /* Tables overflow scroll */
          .imovel-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .imovel-table-wrap table { min-width: 480px; }

          /* Specs grid — 2 cols on mobile */
          .imovel-specs-grid { grid-template-columns: 1fr 1fr !important; }

          /* Action buttons — full width on mobile */
          .imovel-action-group { flex-direction: column !important; }
          .imovel-action-group button, .imovel-action-group a button {
            width: 100% !important; justify-content: center !important;
            min-height: 48px !important;
          }

          /* Gallery nav arrows — bigger */
          .imovel-gallery-arrow {
            width: 44px !important; height: 44px !important;
          }

          /* Back nav back button — bigger */
          .imovel-back-btn {
            width: 44px !important; height: 44px !important;
          }
        }
      `}</style>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ImovelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const isMobile = useIsMobile()

  const [dev, setDev] = useState<Development | null>(null)
  const [enriched, setEnriched] = useState<IMIProperty | null>(null)
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

  // ── Fetch data ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('developments')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        setNotFound(true)
        return
      }

      // Normalize DB row: create aliases so both old and new column names work
      const raw = data as unknown as Development
      const imagesObj = raw.images as { main?: string; gallery?: string[]; videos?: string[] } | null
      const development: Development = {
        ...raw,
        name: raw.name ?? raw.title,
        price_from: raw.price_from ?? raw.price_min,
        price_to: raw.price_to ?? raw.price_max,
        area_min: raw.area_from ?? raw.area_min,
        area_max: raw.area_to ?? raw.area_max,
        bedrooms_from: raw.bedrooms ?? raw.bedrooms_from,
        bathrooms_from: raw.bathrooms ?? raw.bathrooms_from,
        parking_from: raw.parking_spaces ?? raw.parking_from,
        image_urls: imagesObj?.gallery ?? raw.gallery_images ?? raw.image_urls ?? [],
        cover_image_url: imagesObj?.main ?? raw.image ?? raw.cover_image_url,
        video_url: imagesObj?.videos?.[0] ?? raw.video_url ?? raw.virtual_tour_url,
        features: raw.features ?? raw.selling_points ?? [],
        developer: typeof raw.developer === 'string'
          ? { id: '', name: raw.developer, logo_url: raw.developer_logo }
          : raw.developer,
      }
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

  // ── Copy link ───────────────────────────────────────────────────────────────

  function handleCopyLink() {
    const url = `${window.location.origin}/imoveis/${dev?.slug ?? id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── WhatsApp share ──────────────────────────────────────────────────────────

  function handleWhatsApp() {
    const url = `${window.location.origin}/imoveis/${dev?.slug ?? id}`
    const text = encodeURIComponent(`Confira este imóvel: ${dev?.name}\n${url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  // ── Shared props ────────────────────────────────────────────────────────────

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
  }

  if (isMobile) {
    return <MobileImovelDetail {...sharedProps} />
  }

  return <DesktopImovelDetail {...sharedProps} />
}
