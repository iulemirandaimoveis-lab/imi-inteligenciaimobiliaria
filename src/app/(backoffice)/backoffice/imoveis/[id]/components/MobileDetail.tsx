'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, MapPin, Building2, Bed, Bath, Car, Ruler, Edit, QrCode,
  BarChart2, Layers, Zap, TrendingUp, TrendingDown, Copy, MessageSquare,
  ChevronLeft, ChevronRight, ExternalLink, Home, Share2, Sparkles, Scale,
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
import { normalizeStatus, fmtCurrency, fmtNum, Skeleton } from '../helpers'

export function MobileImovelDetail({ dev, loading, router, id, enriched, notFound, copied, handleCopyLink, handleWhatsApp }: DetailProps) {
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

  // Loading state
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

  // Not found state — only show if explicitly notFound AND no data at all
  if (notFound && !dev) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
        <Home size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 16, opacity: 0.4 }} />
        <p style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--accent-400)', fontFamily: 'Figtree, sans-serif', fontWeight: 700, marginBottom: 8 }}>
          Imóvel não encontrado
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          O empreendimento solicitado não existe ou foi removido.
        </p>
        <button
          onClick={() => router.push('/backoffice/imoveis')}
          style={{ height: 52, padding: '0 24px', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', border: 'none', borderRadius: 10, fontFamily: 'Figtree, sans-serif', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> Voltar à Lista
        </button>
      </div>
    )
  }

  // TypeScript guard — dev must exist after above checks
  if (!dev || !enriched) return null

  // Derived values
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

  const locationStr = [dev.neighborhood, dev.city].filter(Boolean).join(' · ')
  const allFeatures = [...(dev.features ?? [])]

  const mobileScoreColor =
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: 80 }}>
      <MobileGlobalStyles />

      {/* HERO IMAGE */}
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
            style={{
              ...glass, width: 44, height: 44, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#EBE7E0', cursor: 'pointer', flexShrink: 0,
            }}
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
              style={{
                ...glass, width: 44, height: 44, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#EBE7E0', cursor: 'pointer',
              }}
            >
              <Share2 size={16} />
            </button>
            <Link
              href={`/backoffice/imoveis/${id}/editar`}
              style={{
                ...glass, width: 44, height: 44, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#EBE7E0', textDecoration: 'none',
              }}
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
          <Sparkles size={13} style={{ color: mobileScoreColor }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 500, color: mobileScoreColor }}>IMI {score}</span>
        </div>

        {/* Status badge */}
        <div style={{ position: 'absolute', bottom: 12, right: 16, ...glass, borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg.dot, flexShrink: 0 }} />
          <span style={{ fontFamily: 'Figtree, sans-serif', fontSize: 11, fontWeight: 700, color: statusCfg.color, textTransform: 'uppercase', letterSpacing: '1.2px' }}>{statusCfg.label}</span>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div style={{ padding: '20px 16px' }} className="detail-section">

        {/* Name + Location */}
        <h1 style={{ fontFamily: 'Libre Baskerville, Georgia, serif', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, margin: '0 0 6px' }}>{dev.name}</h1>
        {locationStr && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 0 }}>
            <MapPin size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Figtree, sans-serif' }}>{locationStr}</span>
          </div>
        )}

        {/* Price section */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 500, color: 'var(--accent-400)', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
            {fmtCurrency(price)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            {priceSqm && (
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-tertiary)' }}>R$ {fmtNum(priceSqm)}/m²</span>
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
            dev.area_from != null && { icon: Ruler, value: `${dev.area_from}m²` },
          ].filter(Boolean).map((spec, i) => {
            if (!spec) return null
            const { icon: Icon, value } = spec as { icon: React.ElementType; value: string }
            return (
              <div key={i} style={{ background: 'rgba(61,111,255,0.08)', border: '1px solid rgba(61,111,255,0.2)', borderRadius: 8, padding: '8px 12px', minHeight: 40, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--text-primary)' }}>{value}</span>
              </div>
            )
          })}
        </div>

        {/* Sobre */}
        {dev.description && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--accent-400)', fontFamily: 'Figtree, sans-serif', fontWeight: 700, marginBottom: 8 }}>Sobre</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'Figtree, sans-serif', lineHeight: 1.6, margin: 0 }}>{dev.description}</p>
          </div>
        )}

        {/* Características */}
        {allFeatures.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--accent-400)', fontFamily: 'Figtree, sans-serif', fontWeight: 700, marginBottom: 10 }}>Características</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {allFeatures.map((feat, i) => (
                <span key={i} style={{ background: 'rgba(61,111,255,0.06)', border: '1px solid rgba(61,111,255,0.15)', borderRadius: 20, padding: '6px 12px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Figtree, sans-serif' }}>{feat}</span>
              ))}
            </div>
          </div>
        )}

        {/* Análise IMI */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--accent-400)', fontFamily: 'Figtree, sans-serif', fontWeight: 700, marginBottom: 10 }}>Análise IMI</p>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(61,111,255,0.15)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 48, fontWeight: 400, color: mobileScoreColor, lineHeight: 1 }}>{score}</div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Figtree, sans-serif', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>IMI Score</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Figtree, sans-serif' }}>/100 · Índice de Oportunidade</div>
                <div style={{ height: 4, width: 120, background: 'rgba(61,111,255,0.1)', borderRadius: 6, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${score}%`, background: mobileScoreColor, borderRadius: 6 }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Yield Est.', value: `${yieldEst.toFixed(1)}%`, color: '#5DB887' },
                { label: 'Delta Mkt', value: `${marketDelta > 0 ? '+' : ''}${marketDelta}%`, color: marketDelta >= 0 ? '#5DB887' : '#E06B6B' },
                { label: 'Liquidez', value: `${enriched.liquidity_index ?? calcLiquidityIndex(enriched)}`, color: '#5B9BD5' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 500, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Figtree, sans-serif', marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detalhes Técnicos */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--accent-400)', fontFamily: 'Figtree, sans-serif', fontWeight: 700, marginBottom: 10 }}>Detalhes Técnicos</p>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(61,111,255,0.15)', borderRadius: 12, overflow: 'hidden' }}>
            {[
              { label: 'Tipo', value: dev.type ? translateType(dev.type) : null },
              { label: 'Condição', value: dev.condition || null },
              { label: 'Incorporadora', value: dev.developer?.name || null },
              { label: 'CEP', value: dev.cep || null },
              { label: 'Estado', value: dev.state || null },
            ].map(({ label, value }, i) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < 4 ? '1px solid rgba(61,111,255,0.08)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Figtree, sans-serif' }}>{label}</span>
                <span style={{ fontSize: 13, color: value ? 'var(--text-primary)' : undefined, fontFamily: 'Figtree, sans-serif', fontWeight: 500 }}>
                  {value || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: 11 }}>Não informado</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--accent-400)', fontFamily: 'Figtree, sans-serif', fontWeight: 700, marginBottom: 10 }}>Ações Rápidas</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: Layers, label: 'Unidades', href: `/backoffice/imoveis/${id}/unidades` },
              { icon: BarChart2, label: 'Analytics', href: `/backoffice/imoveis/${id}/analytics` },
              { icon: Scale, label: 'Avaliação', href: `/backoffice/avaliacoes/nova?imovel=${id}&nome=${encodeURIComponent(dev.name)}&bairro=${encodeURIComponent(dev.neighborhood ?? '')}&area=${dev.area_from ?? ''}` },
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

        {/* Compartilhar */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--accent-400)', fontFamily: 'Figtree, sans-serif', fontWeight: 700, marginBottom: 10 }}>Compartilhar</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleCopyLink} style={{ flex: 1, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: '1px solid rgba(61,111,255,0.25)', borderRadius: 10, color: 'var(--accent-400)', fontSize: 12, fontFamily: 'Figtree, sans-serif', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', cursor: 'pointer' }}>
              <Copy size={14} /> {copied ? 'Copiado!' : 'Link'}
            </button>
            <button onClick={handleWhatsApp} style={{ flex: 1, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: '1px solid rgba(93,184,135,0.35)', borderRadius: 10, color: '#5DB887', fontSize: 12, fontFamily: 'Figtree, sans-serif', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', cursor: 'pointer' }}>
              <MessageSquare size={14} /> WhatsApp
            </button>
          </div>
        </div>

        {/* Atividade Recente */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-outfit, sans-serif)', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 12 }}>Atividade Recente</div>
          {[
            { icon: '👁', label: 'Visualizações esta semana', value: '—', color: 'var(--text-secondary)' },
            { icon: '📋', label: 'Leads este mês', value: '—', color: 'var(--text-secondary)' },
            { icon: '📅', label: 'Última atualização', value: dev?.updated_at ? new Date(dev.updated_at).toLocaleDateString('pt-BR') : '—', color: 'var(--text-secondary)' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(61,111,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>{label}</span>
              </div>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono,monospace)', color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FIXED BOTTOM ACTION BAR */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--nav-bg, var(--bg-surface))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(61,111,255,0.18)',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}>
        <Link
          href={`/backoffice/imoveis/${id}/editar`}
          className="mob-btn-tap"
          style={{ flex: 1, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: '1px solid rgba(61,111,255,0.35)', borderRadius: 10, color: 'var(--accent-400)', textDecoration: 'none', fontSize: 12, fontFamily: 'Figtree, sans-serif', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', touchAction: 'manipulation' }}
        >
          <Edit size={15} /> Editar
        </Link>
        {dev.slug && (
          <Link
            href={`/imoveis/${dev.slug}`}
            target="_blank"
            className="mob-btn-tap"
            style={{ flex: 1, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: '1px solid rgba(91,155,213,0.4)', borderRadius: 10, color: '#5B9BD5', textDecoration: 'none', fontSize: 12, fontFamily: 'Figtree, sans-serif', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', touchAction: 'manipulation' }}
          >
            <ExternalLink size={14} /> Ver Site
          </Link>
        )}
        <button
          onClick={handleWhatsApp}
          className="mob-btn-tap"
          style={{ flex: 2, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--btn-primary-bg)', border: 'none', borderRadius: 10, color: 'var(--btn-primary-text)', fontSize: 13, fontFamily: 'Figtree, sans-serif', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', touchAction: 'manipulation' }}
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
