'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, MapPin, Building2, Bed, Bath, Car, Ruler, Edit, QrCode,
  BarChart2, Layers, Zap, TrendingUp, TrendingDown, Copy, MessageSquare, MapPinned,
  ChevronLeft, ChevronRight, ExternalLink, Home, Share2, Sparkles, Scale, Handshake, User,
} from 'lucide-react'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { getMainImage, getGalleryImages } from '@/utils/propertyImages'
import { translateType } from '@/utils/propertyLabels'
import {
  calcIMIScore,
  calcYieldEst,
  calcMarketDelta,
  calcPricePerSqm,
  calcLiquidityIndex,
} from '@/features/properties/services/score.service'
import { MobileGlobalStyles } from '../../mobile-ui'
import type { DetailProps } from '../types'
import { TABS } from '../types'
import { fmtCurrency, fmtNum, Skeleton, buildComparables } from '../helpers'
import { normalizeStatus } from '@/lib/format'

/* ─── Shared inline style tokens ──────────────────────────────────────────── */

const EYEBROW: React.CSSProperties = {
  fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase',
  color: 'var(--accent-400)', fontFamily: 'Figtree, sans-serif', fontWeight: 700,
}

const MONO: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
}

const CARD: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid rgba(61,111,255,0.15)',
  borderRadius: 12,
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export function MobileImovelDetail({
  dev, loading, router, id, enriched, notFound, copied, broker,
  activeTab, setActiveTab,
  handleCopyLink, handleWhatsApp, handleLinkedIn, handleInstagramCopy,
  rentInput, setRentInput, expensePct, setExpensePct, vacancyPct, setVacancyPct,
}: DetailProps) {
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

  /* ── Loading skeleton ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: 20 }}>
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

  /* ── Not found ─────────────────────────────────────────────────────────── */
  if (notFound && !dev) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
        <Home size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 16, opacity: 0.4 }} />
        <p style={{ ...EYEBROW, marginBottom: 8 }}>Imovel nao encontrado</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          O empreendimento solicitado nao existe ou foi removido.
        </p>
        <button
          onClick={() => router.push('/backoffice/imoveis')}
          style={{ height: 52, padding: '0 24px', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', border: 'none', borderRadius: 10, fontFamily: 'Figtree, sans-serif', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> Voltar a Lista
        </button>
      </div>
    )
  }

  if (!dev || !enriched) return null

  /* ── Derived values ────────────────────────────────────────────────────── */
  const images: string[] = (() => {
    const gallery = getGalleryImages(dev)
    if (gallery.length > 0) return gallery
    const main = getMainImage(dev)
    const list: string[] = []
    const cover = main ?? dev.cover_image_url
    if (cover) list.push(cover)
    if (dev.image_urls) list.push(...dev.image_urls.filter((u: string) => u !== cover))
    return list
  })()

  const displayStatus = normalizeStatus(dev.status_commercial ?? dev.status)
  const statusCfg = getStatusConfig(displayStatus)

  const price = dev.price_from
  const priceSqm = enriched.price_per_sqm ?? calcPricePerSqm(price, dev.area_from) ?? null
  const score = enriched.imi_score ?? calcIMIScore(enriched)
  const yieldEst = enriched.yield_est ?? calcYieldEst(enriched)
  const marketDelta = enriched.market_delta_pct ?? calcMarketDelta(enriched)
  const liquidityIdx = enriched.liquidity_index ?? calcLiquidityIndex(enriched)

  const locationStr = [dev.neighborhood, dev.city].filter(Boolean).join(' \u00b7 ')
  const fullAddress = [dev.address, dev.street_number, dev.neighborhood, dev.city, dev.state, dev.cep].filter(Boolean).join(', ')
  const allFeatures = [...(dev.features ?? [])]

  const scoreColor =
    score >= 80 ? '#5DB887' :
    score >= 60 ? 'var(--accent-400)' :
    score >= 40 ? '#D4913A' :
    '#E06B6B'

  const glass: React.CSSProperties = {
    background: 'rgba(11,25,40,0.72)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(61,111,255,0.18)',
  }

  // Yield calculator derived values
  const grossYield = price ? ((rentInput * 12) / price) * 100 : 0
  const netRent = rentInput * (1 - expensePct / 100) * (1 - vacancyPct / 100)
  const netYield = price ? ((netRent * 12) / price) * 100 : 0
  const monthlyCashflow = netRent

  // IMI Score breakdown (5 metrics)
  const scoreBreakdown = [
    { label: 'Yield Est.', value: Math.round((yieldEst / 12) * 25), max: 25, color: '#5DB887' },
    { label: 'Mercado', value: Math.round(Math.min(100, Math.max(0, (marketDelta + 10) / 30 * 100)) * 0.2), max: 20, color: marketDelta >= 0 ? '#5DB887' : '#E06B6B' },
    { label: 'Liquidez', value: Math.round(liquidityIdx * 0.2), max: 20, color: '#5B9BD5' },
    { label: 'Tendencia', value: 14, max: 20, color: '#D4B86A' },
    { label: 'Localizacao', value: 11, max: 15, color: '#E8A87C' },
  ]

  const comparables = buildComparables(dev)

  /* ── Google Maps URL ───────────────────────────────────────────────────── */
  const mapsUrl = dev.lat && dev.lng
    ? `https://maps.google.com/?q=${dev.lat},${dev.lng}`
    : fullAddress
      ? `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`
      : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: 20 }}>
      <MobileGlobalStyles />

      {/* ═══ HERO IMAGE ═══ */}
      <div
        style={{ position: 'relative', width: '100%', height: 'min(65vw, 320px)', background: 'var(--bg-muted)', overflow: 'hidden' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={e => handleTouchEnd(e, images.length)}
      >
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
          <button
            onClick={() => router.push('/backoffice/imoveis')}
            style={{ ...glass, width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EBE7E0', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: dev.name, url: `${window.location.origin}/imoveis/${dev.slug ?? id}` })
                } else {
                  handleCopyLink()
                }
              }}
              style={{ ...glass, width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EBE7E0', cursor: 'pointer' }}
            >
              <Share2 size={16} />
            </button>
            <Link
              href={`/backoffice/imoveis/${id}/editar`}
              style={{ ...glass, width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EBE7E0', textDecoration: 'none' }}
            >
              <Edit size={16} />
            </Link>
          </div>
        </div>

        {/* Gallery navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setMobileGalleryIdx(i => (i - 1 + images.length) % images.length)}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', ...glass, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EBE7E0', cursor: 'pointer' }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setMobileGalleryIdx(i => (i + 1) % images.length)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', ...glass, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EBE7E0', cursor: 'pointer' }}
            >
              <ChevronRight size={18} />
            </button>
            <div style={{ position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
              {images.slice(0, 8).map((_, i) => (
                <div key={i} style={{ width: i === mobileGalleryIdx ? 16 : 5, height: 5, borderRadius: 3, background: i === mobileGalleryIdx ? 'var(--accent-400)' : 'rgba(235,231,224,0.4)', transition: 'all 200ms ease' }} />
              ))}
            </div>
          </>
        )}

        {/* Score badge */}
        <div style={{ position: 'absolute', bottom: 12, left: 16, ...glass, borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={13} style={{ color: scoreColor }} />
          <span style={{ ...MONO, fontSize: 13, fontWeight: 500, color: scoreColor }}>IMI {score}</span>
        </div>

        {/* Status badge */}
        <div style={{ position: 'absolute', bottom: 12, right: 16, ...glass, borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg.dot, flexShrink: 0 }} />
          <span style={{ fontFamily: 'Figtree, sans-serif', fontSize: 11, fontWeight: 700, color: statusCfg.color, textTransform: 'uppercase', letterSpacing: '1.2px' }}>{statusCfg.label}</span>
        </div>
      </div>

      {/* ═══ HEADER: Name + Price ═══ */}
      <div style={{ padding: '20px 16px 0' }} className="detail-section">
        {/* Name + Location */}
        <h1 style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)", fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, margin: '0 0 6px' }}>{dev.name}</h1>
        {locationStr && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 0 }}>
            <MapPin size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Figtree, sans-serif' }}>{locationStr}</span>
          </div>
        )}

        {/* Price section */}
        <div style={{ marginTop: 14 }}>
          <div style={{ ...MONO, fontSize: 26, fontWeight: 500, color: 'var(--accent-400)', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
            {fmtCurrency(price)}
          </div>
          {dev.price_to && dev.price_to !== dev.price_from && (
            <div style={{ ...MONO, fontSize: 14, color: 'var(--text-tertiary)', marginTop: 2 }}>
              ate {fmtCurrency(dev.price_to)}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            {priceSqm && (
              <span style={{ ...MONO, fontSize: 12, color: 'var(--text-tertiary)' }}>R$ {fmtNum(priceSqm)}/m2</span>
            )}
            {marketDelta !== 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontFamily: 'Figtree, sans-serif', color: marketDelta > 0 ? '#E06B6B' : '#5DB887' }}>
                {marketDelta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {marketDelta > 0 ? `+${marketDelta}%` : `${marketDelta}%`} vs. mercado
              </span>
            )}
          </div>
        </div>

        {/* Spec pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            dev.bedrooms != null && { icon: Bed, value: `${dev.bedrooms}` },
            dev.bathrooms != null && { icon: Bath, value: `${dev.bathrooms}` },
            dev.parking_spaces != null && { icon: Car, value: `${dev.parking_spaces}` },
            dev.area_from != null && { icon: Ruler, value: `${dev.area_from}m2` },
          ].filter(Boolean).map((spec, i) => {
            if (!spec) return null
            const { icon: Icon, value } = spec as { icon: React.ElementType; value: string }
            return (
              <div key={i} style={{ background: 'rgba(61,111,255,0.08)', border: '1px solid rgba(61,111,255,0.2)', borderRadius: 8, padding: '8px 12px', minHeight: 40, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ ...MONO, fontSize: 13, color: 'var(--text-primary)' }}>{value}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ TAB BAR ═══ */}
      <div style={{ marginTop: 20, borderBottom: '1px solid rgba(61,111,255,0.14)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', padding: '0 16px' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 18px', background: 'transparent', border: 'none',
                borderBottom: `2px solid ${activeTab === tab.key ? 'var(--accent-400)' : 'transparent'}`,
                color: activeTab === tab.key ? 'var(--accent-400)' : 'var(--text-tertiary)',
                fontFamily: 'Figtree, sans-serif', fontWeight: 700, fontSize: 11,
                letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer',
                transition: 'all 200ms ease', marginBottom: '-1px', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div style={{ padding: '20px 16px' }} className="detail-section">

        {/* ── TAB: Visao Geral ─────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Sobre */}
            {dev.description && (
              <div>
                <p style={{ ...EYEBROW, marginBottom: 8 }}>Sobre</p>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'Figtree, sans-serif', lineHeight: 1.6, margin: 0 }}>{dev.description}</p>
              </div>
            )}

            {/* Caracteristicas */}
            {allFeatures.length > 0 && (
              <div>
                <p style={{ ...EYEBROW, marginBottom: 10 }}>Caracteristicas</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {allFeatures.map((feat, i) => (
                    <span key={i} style={{ background: 'rgba(61,111,255,0.06)', border: '1px solid rgba(61,111,255,0.15)', borderRadius: 20, padding: '6px 12px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Figtree, sans-serif' }}>{feat}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Detalhes Tecnicos */}
            <div>
              <p style={{ ...EYEBROW, marginBottom: 10 }}>Detalhes Tecnicos</p>
              <div style={{ ...CARD, overflow: 'hidden' }}>
                {[
                  { label: 'Tipo', value: dev.type ? translateType(dev.type) : null },
                  { label: 'Condicao', value: dev.condition || null },
                  { label: 'Incorporadora', value: dev.developer?.name || null },
                  { label: 'CEP', value: dev.cep || null },
                  { label: 'Estado', value: dev.state || null },
                ].map(({ label, value }, i) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < 4 ? '1px solid rgba(61,111,255,0.08)' : 'none' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Figtree, sans-serif' }}>{label}</span>
                    <span style={{ fontSize: 13, color: value ? 'var(--text-primary)' : undefined, fontFamily: 'Figtree, sans-serif', fontWeight: 500 }}>
                      {value || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: 11 }}>Nao informado</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Localizacao */}
            <div>
              <p style={{ ...EYEBROW, marginBottom: 10 }}>Localizacao</p>
              <div style={{ ...CARD, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <MapPin size={16} style={{ color: 'var(--accent-400)', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Figtree, sans-serif', lineHeight: 1.5 }}>
                    {fullAddress || 'Endereco nao informado'}
                  </span>
                </div>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      height: 44, borderRadius: 10,
                      background: 'transparent', border: '1px solid rgba(61,111,255,0.25)',
                      color: 'var(--accent-400)', textDecoration: 'none',
                      fontSize: 12, fontFamily: 'Figtree, sans-serif', fontWeight: 700,
                      letterSpacing: '1.2px', textTransform: 'uppercase',
                    }}
                  >
                    <ExternalLink size={14} /> Ver no Google Maps
                  </a>
                )}
              </div>
            </div>

            {/* Developer card */}
            {dev.developer && (
              <div>
                <p style={{ ...EYEBROW, marginBottom: 10 }}>Incorporadora</p>
                <div style={{ ...CARD, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                  {dev.developer.logo_url ? (
                    <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-muted)', position: 'relative', flexShrink: 0 }}>
                      <Image src={dev.developer.logo_url} alt={dev.developer.name} fill sizes="48px" style={{ objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(61,111,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={20} style={{ color: 'var(--accent-400)' }} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Figtree, sans-serif' }}>{dev.developer.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'Figtree, sans-serif', marginTop: 2 }}>Incorporadora</div>
                  </div>
                </div>
              </div>
            )}

            {/* Corretor Responsável */}
            {broker && (
              <div>
                <p style={{ ...EYEBROW, marginBottom: 10 }}>Corretor Responsável</p>
                <div style={{ ...CARD, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {broker.avatar_url ? (
                      <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                        <Image src={broker.avatar_url} alt={broker.name} fill sizes="48px" style={{ objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(200,164,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={20} style={{ color: 'var(--gold, #C8A44A)' }} />
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Figtree, sans-serif' }}>{broker.name}</div>
                      {broker.creci && <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Figtree, sans-serif', marginTop: 1 }}>CRECI {broker.creci}</div>}
                      {broker.phone && <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Figtree, sans-serif', marginTop: 2 }}>{broker.phone}</div>}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/backoffice/parcerias?new=1&property_id=${id}&property_name=${encodeURIComponent(dev?.name || '')}&owner_broker_id=${broker.id}`)}
                    style={{
                      width: '100%', marginTop: 14, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: 'transparent', border: '1px solid rgba(200,164,74,0.4)', borderRadius: 10,
                      color: 'var(--gold, #C8A44A)', fontSize: 12, fontFamily: 'Figtree, sans-serif', fontWeight: 700,
                      letterSpacing: '1.2px', textTransform: 'uppercase', cursor: 'pointer',
                    }}
                  >
                    <Handshake size={14} /> Propor Parceria
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Analise ─────────────────────────────────────────────── */}
        {activeTab === 'analysis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* IMI Score full breakdown */}
            <div>
              <p style={{ ...EYEBROW, marginBottom: 10 }}>IMI Score - Indice de Oportunidade</p>
              <div style={{ ...CARD, padding: 16 }}>
                {/* Big score header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <div style={{ ...MONO, fontSize: 48, fontWeight: 400, color: scoreColor, lineHeight: 1 }}>{score}</div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Figtree, sans-serif', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>IMI Score</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Figtree, sans-serif' }}>/100 - Indice de Oportunidade</div>
                    <div style={{ height: 4, width: 120, background: 'rgba(61,111,255,0.1)', borderRadius: 6, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${score}%`, background: scoreColor, borderRadius: 6, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                </div>

                {/* 5 metric bars stacked vertically */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {scoreBreakdown.map(({ label, value, max, color }) => {
                    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
                    return (
                      <div key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Figtree, sans-serif' }}>{label}</span>
                          <span style={{ ...MONO, fontSize: 12, color, fontWeight: 500 }}>{value}/{max}</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(61,111,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 6, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Yield Calculator */}
            <div>
              <p style={{ ...EYEBROW, marginBottom: 10 }}>Calculadora de Yield</p>
              <div style={{ ...CARD, padding: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Aluguel Mensal (R$)', value: rentInput, onChange: (v: number) => setRentInput(v), isPercent: false },
                    { label: 'Despesas (%)', value: expensePct, onChange: (v: number) => setExpensePct(v), isPercent: true },
                    { label: 'Vacancia (%)', value: vacancyPct, onChange: (v: number) => setVacancyPct(v), isPercent: true },
                  ].map(({ label, value, onChange, isPercent }) => (
                    <div key={label}>
                      <label style={{ ...EYEBROW, fontSize: '8px', display: 'block', marginBottom: 6 }}>{label}</label>
                      <input
                        type="number"
                        value={value}
                        onChange={e => onChange(Number(e.target.value))}
                        min={0}
                        max={isPercent ? 100 : undefined}
                        style={{
                          width: '100%', padding: '10px 12px', borderRadius: 8,
                          background: 'var(--bg-base)', border: '1px solid rgba(61,111,255,0.2)',
                          color: 'var(--text-primary)', outline: 'none', ...MONO, fontSize: 14,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Results grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Yield Bruto', value: `${grossYield.toFixed(1)}%`, color: '#5DB887' },
                    { label: 'Yield Liquido', value: `${netYield.toFixed(1)}%`, color: '#5B9BD5' },
                    { label: 'Cashflow/mes', value: fmtCurrency(monthlyCashflow), color: 'var(--accent-400)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'rgba(61,111,255,0.06)', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontFamily: 'Figtree, sans-serif', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                      <div style={{ ...MONO, fontSize: 14, color, fontWeight: 500 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Investment metrics summary */}
            <div>
              <p style={{ ...EYEBROW, marginBottom: 10 }}>Metricas de Investimento</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Yield Estimado', value: `${yieldEst.toFixed(1)}%`, unit: 'a.a.', color: '#5DB887' },
                  { label: 'Delta Mercado', value: `${marketDelta > 0 ? '+' : ''}${marketDelta}%`, unit: '', color: marketDelta >= 0 ? '#5DB887' : '#E06B6B' },
                  { label: 'Indice Liquidez', value: `${liquidityIdx}`, unit: '/100', color: '#5B9BD5' },
                  { label: 'Preco/m2', value: priceSqm ? `R$ ${fmtNum(priceSqm)}` : '\u2014', unit: '', color: 'var(--text-primary)' },
                ].map(({ label, value, unit, color }) => (
                  <div key={label} style={{ ...CARD, padding: '14px 12px' }}>
                    <div style={{ ...EYEBROW, fontSize: '8px', marginBottom: 6 }}>{label}</div>
                    <div style={{ ...MONO, fontSize: 18, fontWeight: 400, color, lineHeight: 1 }}>
                      {value}
                      {unit && <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 3 }}>{unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market comparables note */}
            <div>
              <p style={{ ...EYEBROW, marginBottom: 4 }}>Comparaveis de Mercado</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 12 }}>* Dados ilustrativos baseados em medias do bairro {dev.neighborhood ?? ''}</p>
              <div style={{ ...CARD, overflow: 'hidden' }}>
                {/* This property */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(61,111,255,0.06)', borderBottom: '1px solid rgba(61,111,255,0.1)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-400)', fontFamily: 'Figtree, sans-serif' }}>{dev.name}</div>
                    <div style={{ ...MONO, fontSize: 11, color: 'var(--text-tertiary)' }}>{dev.area_from ? `${dev.area_from} m2` : '\u2014'} | {priceSqm ? `R$ ${fmtNum(priceSqm)}/m2` : '\u2014'}</div>
                  </div>
                  <span style={{ ...MONO, fontSize: 10, color: 'var(--text-tertiary)' }}>este</span>
                </div>
                {comparables.map((comp, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: i < comparables.length - 1 ? '1px solid rgba(61,111,255,0.06)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'Figtree, sans-serif' }}>{comp.name}</div>
                      <div style={{ ...MONO, fontSize: 11, color: 'var(--text-tertiary)' }}>{comp.area} m2 | R$ {fmtNum(comp.priceSqm)}/m2</div>
                    </div>
                    <span style={{ ...MONO, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3, color: comp.delta > 0 ? '#E06B6B' : '#5DB887' }}>
                      {comp.delta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {comp.delta > 0 ? '+' : ''}{comp.delta}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Analytics ───────────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ ...CARD, padding: 24, textAlign: 'center' }}>
              <BarChart2 size={36} style={{ color: 'var(--accent-400)', margin: '0 auto 14px', display: 'block' }} />
              <p style={{ ...EYEBROW, marginBottom: 8 }}>Analytics de Performance</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
                Veja cliques, leads gerados, conversoes, fontes de trafego e muito mais na pagina de analytics dedicada.
              </p>
              <Link
                href={`/backoffice/imoveis/${id}/analytics`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  height: 48, borderRadius: 10,
                  background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)',
                  textDecoration: 'none', fontSize: 12, fontFamily: 'Figtree, sans-serif',
                  fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
                }}
              >
                <BarChart2 size={14} /> Abrir Analytics Completo
              </Link>
            </div>

            {/* Quick summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Views', value: '\u2014', icon: '\ud83d\udc41' },
                { label: 'Leads', value: '\u2014', icon: '\ud83d\udccb' },
                { label: 'Atualizado', value: dev?.updated_at ? new Date(dev.updated_at).toLocaleDateString('pt-BR') : '\u2014', icon: '\ud83d\udcc5' },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ ...CARD, padding: '12px 10px', textAlign: 'center' }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div style={{ ...MONO, fontSize: 14, color: 'var(--text-primary)', marginTop: 4 }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Figtree, sans-serif', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: Mapa & Áreas Comuns ─────────────────────────────────── */}
        {activeTab === 'mapa' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Localização no Mapa */}
            {(dev.lat && dev.lng) ? (
              <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={EYEBROW}>Localização</p>
                  <a
                    href={`https://maps.google.com/?q=${dev.lat},${dev.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 11, color: 'var(--accent-400)',
                      fontFamily: 'Figtree, sans-serif', fontWeight: 600,
                      letterSpacing: '0.5px', textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={12} /> Google Maps
                  </a>
                </div>
                <div style={{ height: 240, position: 'relative' }}>
                  <iframe
                    src={`https://maps.google.com/maps?q=${dev.lat},${dev.lng}&z=15&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0, display: 'block' }}
                    loading="lazy"
                    allowFullScreen
                    title="Mapa do imóvel"
                  />
                </div>
              </div>
            ) : (
              <div style={{ ...CARD, padding: 24, textAlign: 'center' }}>
                <MapPin size={28} style={{ color: 'var(--text-tertiary)', margin: '0 auto 10px', display: 'block' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
                  Coordenadas não cadastradas. Edite o imóvel para adicionar localização.
                </p>
                <Link
                  href={`/backoffice/imoveis/${id}/editar`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    height: 40, borderRadius: 8, padding: '0 16px',
                    background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)',
                    textDecoration: 'none', fontSize: 12, fontFamily: 'Figtree, sans-serif',
                    fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
                  }}
                >
                  <Edit size={12} /> Editar Imóvel
                </Link>
              </div>
            )}

            {/* Áreas Comuns */}
            <div style={{ ...CARD, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={EYEBROW}>Áreas Comuns</p>
                <Link
                  href={`/backoffice/imoveis/${id}/editar`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 10,
                    color: 'var(--accent-400)', fontFamily: 'Figtree, sans-serif',
                    fontWeight: 600, letterSpacing: '0.5px', textDecoration: 'none',
                  }}
                >
                  <Edit size={10} /> Gerenciar
                </Link>
              </div>

              {dev.common_areas_description && (
                <p style={{
                  fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16,
                  lineHeight: 1.6, padding: '10px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8, border: '1px solid rgba(61,111,255,0.1)',
                }}>
                  {dev.common_areas_description}
                </p>
              )}

              {(() => {
                const imgs: string[] = dev.images?.commonAreas || dev.common_areas_images || []
                return imgs.length > 0 ? (
                  <div>
                    <p style={{ ...EYEBROW, fontSize: '7px', marginBottom: 10 }}>Fotos ({imgs.length})</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {imgs.map((url: string, i: number) => (
                        <div key={i} style={{ aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(61,111,255,0.12)' }}>
                          <img src={url} alt={`Área comum ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-tertiary)', fontSize: 12 }}>
                    Nenhuma foto de áreas comuns cadastrada.{' '}
                    <Link href={`/backoffice/imoveis/${id}/editar`} style={{ color: 'var(--accent-400)', textDecoration: 'underline' }}>
                      Adicionar agora
                    </Link>
                  </div>
                )
              })()}

              {(() => {
                const vids: string[] = dev.images?.commonAreasVideos || dev.common_areas_videos || []
                return vids.length > 0 ? (
                  <div style={{ marginTop: 20 }}>
                    <p style={{ ...EYEBROW, fontSize: '7px', marginBottom: 10 }}>Vídeos ({vids.length})</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {vids.map((url: string, i: number) => (
                        <video key={i} src={url} controls style={{ width: '100%', borderRadius: 8, border: '1px solid rgba(61,111,255,0.12)' }} />
                      ))}
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          </div>
        )}

        {/* ── TAB: Mais ────────────────────────────────────────────────── */}
        {activeTab === 'more' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Quick actions 2x3 grid */}
            <div>
              <p style={{ ...EYEBROW, marginBottom: 10 }}>Acoes Rapidas</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { icon: Edit, label: 'Editar', href: `/backoffice/imoveis/${id}/editar` },
                  ...(dev.type === 'loteamento' || dev.type === 'condominio_fechado'
                    ? [
                        { icon: Layers, label: 'Lotes', href: `/backoffice/imoveis/${id}/lotes` },
                        { icon: MapPinned, label: 'Áreas do Mapa', href: `/backoffice/imoveis/${id}/mapa` },
                      ]
                    : [{ icon: Layers, label: 'Unidades', href: `/backoffice/imoveis/${id}/unidades` }]),
                  { icon: BarChart2, label: 'Analytics', href: `/backoffice/imoveis/${id}/analytics` },
                  { icon: Scale, label: 'Avaliacao', href: `/backoffice/avaliacoes/nova?imovel=${id}&nome=${encodeURIComponent(dev.name)}&bairro=${encodeURIComponent(dev.neighborhood ?? '')}&area=${dev.area_from ?? ''}` },
                  { icon: QrCode, label: 'QR Code', href: `/backoffice/tracking/qr?propertyId=${id}&propertyName=${encodeURIComponent(dev?.name || '')}` },
                  { icon: Zap, label: 'Campanha', href: `/backoffice/campanhas?imovel=${id}` },
                ].map(({ icon: Icon, label, href }) => (
                  <Link key={label} href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(61,111,255,0.06)', border: '1px solid rgba(61,111,255,0.14)', borderRadius: 10, padding: '14px 16px', textDecoration: 'none' }}>
                    <Icon size={16} style={{ color: 'var(--accent-400)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'Figtree, sans-serif', fontWeight: 500 }}>{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Share (4 options) */}
            <div>
              <p style={{ ...EYEBROW, marginBottom: 10 }}>Compartilhar</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button onClick={handleCopyLink} style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: '1px solid rgba(61,111,255,0.25)', borderRadius: 10, color: 'var(--accent-400)', fontSize: 12, fontFamily: 'Figtree, sans-serif', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', cursor: 'pointer' }}>
                  <Copy size={14} /> {copied ? 'Copiado!' : 'Link'}
                </button>
                <button onClick={handleWhatsApp} style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: '1px solid rgba(93,184,135,0.35)', borderRadius: 10, color: '#5DB887', fontSize: 12, fontFamily: 'Figtree, sans-serif', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', cursor: 'pointer' }}>
                  <MessageSquare size={14} /> WhatsApp
                </button>
                <button onClick={handleLinkedIn} style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: '1px solid rgba(10,102,194,0.4)', borderRadius: 10, color: '#0A66C2', fontSize: 12, fontFamily: 'Figtree, sans-serif', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </button>
                <button onClick={handleInstagramCopy} style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: '1px solid rgba(225,48,108,0.4)', borderRadius: 10, color: '#E1306C', fontSize: 12, fontFamily: 'Figtree, sans-serif', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  Instagram
                </button>
              </div>
            </div>

            {/* Activity */}
            <div>
              <p style={{ ...EYEBROW, marginBottom: 12 }}>Atividade Recente</p>
              {[
                { icon: '\ud83d\udc41', label: 'Visualizacoes esta semana', value: '\u2014', color: 'var(--text-secondary)' },
                { icon: '\ud83d\udccb', label: 'Leads este mes', value: '\u2014', color: 'var(--text-secondary)' },
                { icon: '\ud83d\udcc5', label: 'Ultima atualizacao', value: dev?.updated_at ? new Date(dev.updated_at).toLocaleDateString('pt-BR') : '\u2014', color: 'var(--text-secondary)' },
              ].map(({ icon, label, value, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(61,111,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Figtree, sans-serif' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 11, ...MONO, color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ CSS animations ═══ */}
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
