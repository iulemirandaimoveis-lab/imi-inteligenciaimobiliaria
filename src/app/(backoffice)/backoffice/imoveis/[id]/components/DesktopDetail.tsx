'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, MapPin, Building2, Bed, Bath, Car, Ruler, Edit, QrCode,
  BarChart2, Layers, Clock, TrendingUp, TrendingDown, Copy, MessageSquare,
  ChevronLeft, ChevronRight, ExternalLink, Home, Share2, Sparkles,
  Activity, CheckSquare, Zap, Scale, Handshake, User,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { IMIScoreDisplay } from '@/features/properties/components/IMIScoreBadge'
import {
  calcIMIScore,
  calcYieldEst,
  calcMarketDelta,
  getScoreColor,
  calcPricePerSqm,
  calcLiquidityIndex,
} from '@/features/properties/services/score.service'
import { createClient } from '@/lib/supabase/client'
import { YieldCalculator } from '@/app/(backoffice)/components/ui/YieldCalculator'
import { ValuationEngine } from '@/app/(backoffice)/components/ui/ValuationEngine'
import type { DetailProps } from '../types'
import { TABS } from '../types'
import { normalizeStatus } from '@/lib/format'
import {
  fmtCurrency, fmtNum, buildComparables,
  EYEBROW, CARD, BTN_PRIMARY, BTN_SECONDARY, MONO,
  Skeleton, STATUS_OPTIONS,
} from '../helpers'
import { FloatingActions } from './FloatingActions'

export function DesktopImovelDetail({
  dev, enriched, loading, notFound, router, id, broker,
  activeTab, setActiveTab, galleryIdx, setGalleryIdx,
  rentInput, setRentInput, expensePct, setExpensePct,
  vacancyPct, setVacancyPct, copied, handleCopyLink, handleWhatsApp, handleLinkedIn, handleInstagramCopy,
}: DetailProps) {
  const [statusOpen, setStatusOpen] = useState(false)
  const [localStatus, setLocalStatus] = useState(() => normalizeStatus(dev?.status_commercial ?? dev?.status))

  useEffect(() => {
    if (dev) setLocalStatus(normalizeStatus(dev.status_commercial ?? dev.status))
  }, [dev])

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

  if (notFound && !dev) {
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

  // TypeScript guard — dev must exist after above checks
  if (!dev || !enriched) return null

  // Derived values
  const images: string[] = (() => {
    // Primary: gallery_images (saved by edit form)
    if (dev.gallery_images && dev.gallery_images.length > 0) return dev.gallery_images
    // Fallback: legacy cover + image_urls
    const list: string[] = []
    const cover = dev.image ?? dev.cover_image_url
    if (cover) list.push(cover)
    if (dev.image_urls) list.push(...dev.image_urls.filter(u => u !== cover))
    return list
  })()

  const displayStatus = normalizeStatus(dev.status_commercial ?? dev.status)
  const statusCfg = getStatusConfig(displayStatus)

  const price = dev.price_from
  const priceSqm = enriched.price_per_sqm ?? calcPricePerSqm(price, dev.area_from) ?? null
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

      {/* Back nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 20px' }}>
        <button
          onClick={() => router.push('/backoffice/imoveis')}
          style={{
            width: 36, height: 36, borderRadius: 8,
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
            padding: '3px 10px', borderRadius: 6,
            background: getStatusConfig(localStatus).bg, color: getStatusConfig(localStatus).color,
            fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
            textTransform: 'uppercase', fontFamily: 'var(--font-outfit, sans-serif)',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: getStatusConfig(localStatus).dot }} />
            {getStatusConfig(localStatus).label}
          </span>
          <button
            onClick={() => setStatusOpen(o => !o)}
            title="Alterar status"
            style={{
              width: 24, height: 24, borderRadius: 6,
              background: 'rgba(61,111,255,0.08)', border: '1px solid rgba(61,111,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
            }}
          >
            <Edit size={11} />
          </button>
          {statusOpen && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, zIndex: 100,
              background: 'rgba(11,25,40,0.97)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(61,111,255,0.2)', borderRadius: 10, padding: '6px 0',
              minWidth: 160, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
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
                    fontSize: 12, fontFamily: 'var(--font-outfit, sans-serif)',
                    fontWeight: localStatus === opt.value ? 700 : 400, transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(61,111,255,0.06)' }}
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

      {/* Hero Gallery */}
      <div className="imovel-hero" style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 'min(65vh, 460px)', background: T.surface }}>
        {images.length > 0 ? (
          <>
            <Image src={images[galleryIdx]} alt={dev.name} fill sizes="(max-width: 768px) 100vw, 1280px" style={{ objectFit: 'cover' }} priority />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,25,40,0.85) 0%, rgba(11,25,40,0.1) 50%, transparent 100%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 28px' }}>
              <p style={{ ...EYEBROW, marginBottom: 6 }}>{dev.developer?.name ?? dev.type}</p>
              <h1 style={{ fontFamily: 'var(--font-playfair, Libre Baskerville, Georgia, serif)', fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 700, color: '#EBE7E0', lineHeight: 1.15, margin: 0 }}>{dev.name}</h1>
              {fullAddress && (
                <p style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(235,231,224,0.7)', fontSize: 13, marginTop: 6 }}>
                  <MapPin size={12} />{fullAddress}
                </p>
              )}
            </div>
            {images.length > 1 && (
              <>
                <button onClick={() => setGalleryIdx(i => (i - 1 + images.length) % images.length)} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(11,25,40,0.75)', border: '1px solid rgba(61,111,255,0.3)', color: '#EBE7E0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={18} /></button>
                <button onClick={() => setGalleryIdx(i => (i + 1) % images.length)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(11,25,40,0.75)', border: '1px solid rgba(61,111,255,0.3)', color: '#EBE7E0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={18} /></button>
                <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(11,25,40,0.75)', border: '1px solid rgba(61,111,255,0.2)', borderRadius: 6, padding: '4px 10px', ...MONO, fontSize: 11, color: 'rgba(235,231,224,0.8)' }}>{galleryIdx + 1} / {images.length}</div>
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
            <button key={idx} onClick={() => setGalleryIdx(idx)} style={{ flexShrink: 0, width: 60, height: 40, borderRadius: 6, overflow: 'hidden', border: `2px solid ${idx === galleryIdx ? 'var(--gold, var(--accent-400))' : 'transparent'}`, cursor: 'pointer', position: 'relative', background: T.surface, opacity: idx === galleryIdx ? 1 : 0.6, transition: 'all 150ms ease' }}>
              <Image src={img} alt="" fill sizes="60px" style={{ objectFit: 'cover' }} loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Main layout: tabs + sidebar */}
      <div className="imovel-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24, marginTop: 24, alignItems: 'start' }}>
        {/* LEFT COLUMN */}
        <div>
          {/* Sticky tab bar */}
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-base, var(--navy, #0B1120))', borderBottom: '1px solid rgba(61,111,255,0.14)', marginBottom: 20 }}>
            <div className="imovel-tabs" style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === tab.key ? 'var(--gold, var(--accent-400))' : 'transparent'}`, color: activeTab === tab.key ? 'var(--gold, var(--accent-400))' : T.textMuted, fontFamily: 'var(--font-outfit, sans-serif)', fontWeight: 700, fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 200ms ease', marginBottom: '-1px' }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB: VISAO GERAL */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {dev.description && (
                <div style={{ ...CARD, padding: 24 }}>
                  <p style={{ ...EYEBROW, marginBottom: 10 }}>Sobre o Empreendimento</p>
                  <p style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{dev.description}</p>
                </div>
              )}
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 16 }}>Especificações</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                  {[
                    { icon: Ruler, label: 'Área', value: dev.area_from ? `${dev.area_from}${dev.area_to && dev.area_to !== dev.area_from ? `–${dev.area_to}` : ''} m²` : 'Não informado' },
                    { icon: Bed, label: 'Quartos', value: dev.bedrooms ? `${dev.bedrooms}+` : 'Não informado' },
                    { icon: Bath, label: 'Banheiros', value: dev.bathrooms ? `${dev.bathrooms}+` : 'Não informado' },
                    { icon: Car, label: 'Vagas', value: dev.parking_spaces ? `${dev.parking_spaces}+` : 'Não informado' },
                    { icon: Building2, label: 'Tipo', value: dev.type ?? 'Não informado' },
                    { icon: Activity, label: 'Condição', value: dev.condition ?? 'Não informado' },
                    { icon: CheckSquare, label: 'Status', value: statusCfg.label },
                    { icon: MapPin, label: 'Cidade', value: dev.city ?? '—' },
                    { icon: MapPin, label: 'Bairro', value: dev.neighborhood ?? '—' },
                    { icon: Home, label: 'CEP', value: dev.cep ?? '—' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} style={{ background: 'var(--bg-surface)', border: '1px solid rgba(61,111,255,0.1)', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                        <Icon size={12} style={{ color: 'var(--gold, var(--accent-400))', flexShrink: 0 }} />
                        <span style={{ ...EYEBROW, fontSize: '8px' }}>{label}</span>
                      </div>
                      <span style={{ ...MONO, fontSize: 14, fontWeight: 500, color: T.text }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {(dev.features && dev.features.length > 0) && (
                <div style={{ ...CARD, padding: 24 }}>
                  <p style={{ ...EYEBROW, marginBottom: 16 }}>Diferenciais & Comodidades</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(dev.features ?? []).map((item, i) => (
                      <span key={i} style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(61,111,255,0.08)', border: '1px solid rgba(61,111,255,0.18)', color: T.textMuted, fontSize: 12, fontFamily: 'var(--font-outfit, sans-serif)', fontWeight: 500 }}>{item}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 16 }}>Localização</p>
                <div style={{ background: 'var(--bg-surface)', borderRadius: 8, overflow: 'hidden', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(61,111,255,0.1)', flexDirection: 'column', gap: 8, color: T.textDim }}>
                  <MapPin size={28} style={{ opacity: 0.3 }} />
                  <span style={{ fontSize: 12 }}>{fullAddress || 'Endereço não informado'}</span>
                  {dev.lat && dev.lng && (
                    <a href={`https://maps.google.com/?q=${dev.lat},${dev.lng}`} target="_blank" rel="noopener noreferrer" style={{ ...BTN_SECONDARY, padding: '6px 14px', fontSize: 10, marginTop: 4 }}>
                      <ExternalLink size={10} /> Ver no Maps
                    </a>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                  {[['Bairro', dev.neighborhood], ['Cidade', dev.city], ['Estado', dev.state], ['País', dev.country]].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label as string} style={{ fontSize: 13 }}>
                      <span style={{ color: T.textDim, fontSize: 11 }}>{label}</span><br />
                      <span style={{ color: T.text, fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 4 }}>Comparáveis de Mercado</p>
                <p style={{ fontSize: 11, color: T.textDim, marginBottom: 16 }}>* Dados ilustrativos baseados em médias do bairro {dev.neighborhood ?? ''}</p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(61,111,255,0.14)' }}>
                        {['Empreendimento', 'Área', 'Preço/m²', 'Δ Mercado'].map(h => (
                          <th key={h} style={{ ...EYEBROW, fontSize: '8px', textAlign: 'left', padding: '6px 12px 8px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ background: 'rgba(61,111,255,0.06)', borderBottom: '1px solid rgba(61,111,255,0.1)' }}>
                        <td style={{ padding: '10px 12px', color: 'var(--gold, var(--accent-400))', fontWeight: 600 }}>{dev.name} <span style={{ fontSize: 10, opacity: 0.7 }}>(este)</span></td>
                        <td style={{ ...MONO, padding: '10px 12px', color: T.text }}>{dev.area_from ? `${dev.area_from} m²` : '—'}</td>
                        <td style={{ ...MONO, padding: '10px 12px', color: T.text }}>{priceSqm ? `R$ ${fmtNum(priceSqm)}` : '—'}</td>
                        <td style={{ ...MONO, padding: '10px 12px', color: T.textDim }}>—</td>
                      </tr>
                      {comparables.map((comp, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(61,111,255,0.06)' }}>
                          <td style={{ padding: '10px 12px', color: T.text }}>{comp.name}</td>
                          <td style={{ ...MONO, padding: '10px 12px', color: T.textMuted }}>{comp.area} m²</td>
                          <td style={{ ...MONO, padding: '10px 12px', color: T.textMuted }}>R$ {fmtNum(comp.priceSqm)}</td>
                          <td style={{ ...MONO, padding: '10px 12px' }}>
                            <span style={{ color: comp.delta > 0 ? '#E06B6B' : '#5DB887', display: 'flex', alignItems: 'center', gap: 3 }}>
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

          {/* TAB: ANALISE */}
          {activeTab === 'analysis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                    <div key={label} style={{ background: 'var(--bg-surface)', border: '1px solid rgba(61,111,255,0.1)', borderRadius: 8, padding: '16px 18px' }}>
                      <p style={{ ...EYEBROW, fontSize: '8px', marginBottom: 8 }}>{label}</p>
                      <p style={{ ...MONO, fontSize: 24, fontWeight: 400, color, lineHeight: 1, margin: 0 }}>
                        {value}
                        {unit && <span style={{ fontSize: 12, color: T.textDim, marginLeft: 4 }}>{unit}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
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
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 16 }}>Calculadora de Yield</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                  {[
                    { label: 'Aluguel Mensal (R$)', value: rentInput, onChange: (v: number) => setRentInput(v) },
                    { label: 'Despesas (%)', value: expensePct, onChange: (v: number) => setExpensePct(v) },
                    { label: 'Vacância (%)', value: vacancyPct, onChange: (v: number) => setVacancyPct(v) },
                  ].map(({ label, value, onChange }) => (
                    <div key={label}>
                      <label style={{ ...EYEBROW, fontSize: '8px', display: 'block', marginBottom: 6 }}>{label}</label>
                      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min={0} max={label.includes('%') ? 100 : undefined} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: 'var(--bg-surface)', border: '1px solid rgba(61,111,255,0.2)', color: T.text, outline: 'none', ...MONO, fontSize: 14, boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Yield Bruto', value: `${grossYield.toFixed(2)}%`, color: '#5DB887' },
                    { label: 'Yield Líquido', value: `${netYield.toFixed(2)}%`, color: '#5B9BD5' },
                    { label: 'Cashflow Mensal', value: fmtCurrency(monthlyCashflow), color: 'var(--gold, var(--accent-400))' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'var(--bg-surface)', border: '1px solid rgba(61,111,255,0.1)', borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ ...EYEBROW, fontSize: '8px', marginBottom: 6 }}>{label}</div>
                      <div style={{ ...MONO, fontSize: 20, color, fontWeight: 400 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 16 }}>Projeção de Retorno</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: '12 meses', roi: yieldEst * 1.0, color: '#5B9BD5' },
                    { label: '24 meses', roi: yieldEst * 2.1, color: '#5DB887' },
                    { label: '36 meses', roi: yieldEst * 3.4, color: 'var(--gold, var(--accent-400))' },
                  ].map(({ label, roi, color }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: T.textMuted, fontFamily: 'var(--font-outfit, sans-serif)' }}>{label}</span>
                        <span style={{ ...MONO, fontSize: 13, color, fontWeight: 500 }}>+{roi.toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(61,111,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (roi / 30) * 100)}%`, background: color, borderRadius: 6, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
                      </div>
                      <div style={{ fontSize: 11, color: T.textDim, marginTop: 3 }}>Estimativa acumulada com apreciação</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="max-lg:grid-cols-1">
                <YieldCalculator propertyValue={dev?.price_from || 800000} monthlyRent={rentInput > 0 ? rentInput : undefined} annualExpenses={undefined} />
                <ValuationEngine estimatedValue={priceSqm && dev.area_from ? Math.round(priceSqm) : 14500} confidence={72} methodology="Hedônico + Comparativo (NBR 14653)" lastUpdated="há 3 dias" comparables={[
                  { address: 'Imóvel similar próximo', value: 15200, distance: '150m', diff: 4.8 },
                  { address: 'Ref. mesmo bairro', value: 13800, distance: '300m', diff: -4.8 },
                  { address: 'Lançamento vizinho', value: 16500, distance: '500m', diff: 13.8 },
                ]} />
              </div>
            </div>
          )}

          {/* TAB: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div style={{ ...CARD, padding: 32, textAlign: 'center' }}>
              <BarChart2 size={40} style={{ color: 'var(--gold, var(--accent-400))', margin: '0 auto 16px', display: 'block' }} />
              <p style={{ ...EYEBROW, marginBottom: 8 }}>Analytics de Performance</p>
              <p style={{ color: T.textMuted, fontSize: 14, marginBottom: 24, maxWidth: 420, margin: '0 auto 24px' }}>Veja cliques, leads gerados, conversões, fontes de tráfego e muito mais na página de analytics dedicada.</p>
              <Link href={`/backoffice/imoveis/${id}/analytics`} style={BTN_PRIMARY}><BarChart2 size={14} /> Abrir Analytics Completo</Link>
            </div>
          )}

          {/* TAB: MAIS */}
          {activeTab === 'more' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 16 }}>Ações Rápidas</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {[
                    { icon: Edit, label: 'Editar Imóvel', href: `/backoffice/imoveis/${id}/editar`, primary: true },
                    { icon: Scale, label: 'Solicitar Avaliação', href: `/backoffice/avaliacoes/nova?imovel=${id}&nome=${encodeURIComponent(dev.name)}&bairro=${encodeURIComponent(dev.neighborhood ?? '')}&area=${dev.area_from ?? ''}`, primary: true },
                    ...(dev.type === 'loteamento'
                      ? [{ icon: Layers, label: 'Gerenciar Lotes', href: `/backoffice/imoveis/${id}/lotes`, primary: false }]
                      : [{ icon: Layers, label: 'Ver Unidades', href: `/backoffice/imoveis/${id}/unidades`, primary: false }]
                    ),
                    { icon: BarChart2, label: 'Analytics', href: `/backoffice/imoveis/${id}/analytics`, primary: false },
                    { icon: Clock, label: 'Timeline', href: `/backoffice/imoveis/${id}/timeline`, primary: false },
                    { icon: QrCode, label: 'Gerar QR Code', href: `/backoffice/tracking/qr?propertyId=${id}&propertyName=${encodeURIComponent(dev?.name || '')}`, primary: false },
                    { icon: Zap, label: 'Criar Campanha', href: `/backoffice/campanhas?imovel=${id}`, primary: false },
                  ].map(({ icon: Icon, label, href, primary }) => (
                    <Link key={label} href={href} style={primary ? BTN_PRIMARY : BTN_SECONDARY}><Icon size={14} /> {label}</Link>
                  ))}
                </div>
              </div>
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 16 }}>Compartilhar</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={handleCopyLink} style={BTN_SECONDARY}><Copy size={13} /> {copied ? 'Copiado!' : 'Copiar Link'}</button>
                  <button onClick={handleWhatsApp} style={{ ...BTN_SECONDARY, borderColor: 'rgba(93,184,135,0.4)', color: '#5DB887' }}><MessageSquare size={13} /> WhatsApp</button>
                  <button onClick={handleLinkedIn} style={{ ...BTN_SECONDARY, borderColor: 'rgba(10,102,194,0.4)', color: '#0A66C2' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </button>
                  <button onClick={handleInstagramCopy} style={{ ...BTN_SECONDARY, borderColor: 'rgba(225,48,108,0.4)', color: '#E1306C' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    Instagram (copiar caption)
                  </button>
                  <Link href={`/backoffice/conteudo/novo?property=${id}`} style={{ ...BTN_SECONDARY, textDecoration: 'none', borderColor: 'rgba(200,164,74,0.4)', color: 'var(--accent-400)' }}><Sparkles size={13} /> Gerar Conteúdo IA</Link>
                </div>
              </div>
              <div style={{ ...CARD, padding: 24 }}>
                <p style={{ ...EYEBROW, marginBottom: 14 }}>Informações do Registro</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    ['ID', dev.id], ['Slug', dev.slug ?? '—'],
                    ['Criado em', dev.created_at ? new Date(dev.created_at).toLocaleDateString('pt-BR') : '—'],
                    ['Atualizado em', dev.updated_at ? new Date(dev.updated_at).toLocaleDateString('pt-BR') : '—'],
                    ['Desenvolvedor', dev.developer?.name ?? '—'], ['Vídeo', dev.video_url ? 'Sim' : 'Não'],
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

        {/* RIGHT SIDEBAR */}
        <div style={{ position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ ...CARD, padding: 24 }}>
            <p style={{ ...EYEBROW, marginBottom: 8 }}>Preço</p>
            <div style={{ ...MONO, fontSize: 30, fontWeight: 400, color: 'var(--gold, var(--accent-400))', lineHeight: 1.1, letterSpacing: '-0.5px' }}>{fmtCurrency(price)}</div>
            {dev.price_to && dev.price_to !== dev.price_from && (
              <div style={{ ...MONO, fontSize: 14, color: T.textMuted, marginTop: 2 }}>até {fmtCurrency(dev.price_to)}</div>
            )}
            {priceSqm && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: T.textDim }}>Preço/m²:</span>
                <span style={{ ...MONO, fontSize: 13, color: T.textMuted }}>R$ {fmtNum(priceSqm)}</span>
              </div>
            )}
            <div style={{ height: '1px', background: 'rgba(61,111,255,0.14)', margin: '16px 0' }} />
            <IMIScoreDisplay score={score} />
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
                        <span style={{ fontSize: 9, fontFamily: 'var(--font-outfit, sans-serif)', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{label}</span>
                        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono,monospace)', color: 'var(--text-secondary)' }}>{pct}</span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 70 ? 'var(--accent-400)' : pct >= 50 ? '#E8A87C' : '#9FAAB8', borderRadius: 2, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{ height: '1px', background: 'rgba(61,111,255,0.14)', margin: '16px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.textDim, fontFamily: 'var(--font-outfit, sans-serif)' }}>Yield Estimado</span>
                <span style={{ ...MONO, fontSize: 14, color: '#5DB887', fontWeight: 500 }}>{yieldEst.toFixed(1)}% a.a.</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.textDim, fontFamily: 'var(--font-outfit, sans-serif)' }}>vs Mercado</span>
                <span style={{ ...MONO, fontSize: 13, fontWeight: 500, color: marketDelta >= 0 ? '#5DB887' : '#E06B6B', display: 'flex', alignItems: 'center', gap: 3 }}>
                  {marketDelta >= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                  {marketDelta >= 0 ? `${marketDelta}% abaixo` : `${Math.abs(marketDelta)}% acima`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.textDim, fontFamily: 'var(--font-outfit, sans-serif)' }}>Liquidez</span>
                <span style={{ ...MONO, fontSize: 13, color: '#5B9BD5' }}>{liquidityIdx}/100</span>
              </div>
            </div>
          </div>
          <div style={{ ...CARD, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ ...EYEBROW, marginBottom: 6 }}>Ações</p>
            <Link href={`/backoffice/imoveis/${id}/editar`} style={{ ...BTN_PRIMARY, justifyContent: 'center' }}><Edit size={13} /> Editar Imóvel</Link>
            {dev.type === 'loteamento'
              ? <Link href={`/backoffice/imoveis/${id}/lotes`} style={{ ...BTN_SECONDARY, justifyContent: 'center' }}><Layers size={13} /> Gerenciar Lotes</Link>
              : <Link href={`/backoffice/imoveis/${id}/unidades`} style={{ ...BTN_SECONDARY, justifyContent: 'center' }}><Layers size={13} /> Ver Unidades</Link>
            }
            <Link href={`/backoffice/imoveis/${id}/analytics`} style={{ ...BTN_SECONDARY, justifyContent: 'center' }}><BarChart2 size={13} /> Analytics</Link>
            <Link href={`/backoffice/tracking/qr?propertyId=${id}&propertyName=${encodeURIComponent(dev?.name || '')}`} style={{ ...BTN_SECONDARY, justifyContent: 'center' }}><QrCode size={13} /> Gerar QR Code</Link>
            <Link href={`/backoffice/campanhas?imovel=${id}`} style={{ ...BTN_SECONDARY, justifyContent: 'center' }}><Zap size={13} /> Criar Campanha</Link>
          </div>
          <div style={{ ...CARD, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ ...EYEBROW, marginBottom: 4 }}>Compartilhar</p>
            <button onClick={handleCopyLink} style={{ ...BTN_SECONDARY, justifyContent: 'center' }}><Copy size={13} /> {copied ? 'Copiado!' : 'Copiar Link'}</button>
            <button onClick={handleWhatsApp} style={{ ...BTN_SECONDARY, justifyContent: 'center', borderColor: 'rgba(93,184,135,0.35)', color: '#5DB887' }}><MessageSquare size={13} /> WhatsApp</button>
            <button onClick={handleLinkedIn} style={{ ...BTN_SECONDARY, justifyContent: 'center', borderColor: 'rgba(10,102,194,0.4)', color: '#0A66C2' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </button>
            <button onClick={handleInstagramCopy} style={{ ...BTN_SECONDARY, justifyContent: 'center', borderColor: 'rgba(225,48,108,0.4)', color: '#E1306C' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              Instagram
            </button>
            <button onClick={() => { if (navigator.share) navigator.share({ title: dev.name, url: `${window.location.origin}/imoveis/${dev.slug ?? id}` }) }} style={{ ...BTN_SECONDARY, justifyContent: 'center' }}><Share2 size={13} /> Compartilhar</button>
          </div>
          {dev.developer && (
            <div style={{ ...CARD, padding: 16 }}>
              <p style={{ ...EYEBROW, marginBottom: 10 }}>Incorporadora</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {dev.developer.logo_url ? (
                  <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    <Image src={dev.developer.logo_url} alt={dev.developer.name} fill sizes="36px" style={{ objectFit: 'contain' }} loading="lazy" />
                  </div>
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: 6, flexShrink: 0, background: 'rgba(61,111,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={16} style={{ color: 'var(--gold, var(--accent-400))' }} />
                  </div>
                )}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{dev.developer.name}</p>
                  <p style={{ fontSize: 11, color: T.textDim, margin: 0 }}>Incorporadora</p>
                </div>
              </div>
            </div>
          )}
          {/* Corretor Responsável */}
          {broker && (
            <div style={{ ...CARD, padding: 16 }}>
              <p style={{ ...EYEBROW, marginBottom: 10 }}>Corretor Responsável</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {broker.avatar_url ? (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    <Image src={broker.avatar_url} alt={broker.name} fill sizes="36px" style={{ objectFit: 'cover' }} loading="lazy" />
                  </div>
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'rgba(200,164,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} style={{ color: 'var(--gold, #C8A44A)' }} />
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{broker.name}</p>
                  {broker.creci && <p style={{ fontSize: 10, color: T.textDim, margin: 0 }}>CRECI {broker.creci}</p>}
                  {broker.phone && <p style={{ fontSize: 11, color: T.textMuted, margin: '2px 0 0' }}>{broker.phone}</p>}
                </div>
              </div>
              <button
                onClick={() => router.push(`/backoffice/parcerias?new=1&property_id=${id}&property_name=${encodeURIComponent(dev?.name || '')}&owner_broker_id=${broker.id}`)}
                style={{
                  ...BTN_SECONDARY,
                  justifyContent: 'center',
                  width: '100%',
                  marginTop: 12,
                  borderColor: 'rgba(200,164,74,0.4)',
                  color: 'var(--gold, #C8A44A)',
                }}
              >
                <Handshake size={13} /> Propor Parceria
              </button>
            </div>
          )}
        </div>
      </div>

      <FloatingActions id={id} />

      <style suppressHydrationWarning>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .imovel-tabs::-webkit-scrollbar { display: none; }
        .imovel-tabs button { flex-shrink: 0; }
        @media (max-width: 900px) { .imovel-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 767px) {
          .imovel-detail-wrap { padding: 0 14px 80px !important; }
          .imovel-grid { padding: 0 !important; margin-top: 16px !important; }
          .imovel-hero { height: min(55vw, 260px) !important; }
          .imovel-tabs button { padding: 10px 14px !important; font-size: 11px !important; }
          .imovel-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .imovel-table-wrap table { min-width: 480px; }
          .imovel-specs-grid { grid-template-columns: 1fr 1fr !important; }
          .imovel-action-group { flex-direction: column !important; }
          .imovel-action-group button, .imovel-action-group a button { width: 100% !important; justify-content: center !important; min-height: 48px !important; }
          .imovel-gallery-arrow { width: 44px !important; height: 44px !important; }
          .imovel-back-btn { width: 44px !important; height: 44px !important; }
        }
      `}</style>
    </div>
  )
}
