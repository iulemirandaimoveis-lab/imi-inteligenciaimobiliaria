'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bed, Bath, Car, Ruler, MapPin, TrendingUp, TrendingDown, Eye, BarChart2, Heart, Scale, ExternalLink, QrCode, Sparkles } from 'lucide-react'
import { IMIScoreBadge } from './IMIScoreBadge'
import type { IMIProperty } from '../types'

function fmt(n?: number | null, prefix = 'R$'): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `${prefix} ${(n / 1_000_000).toFixed(2).replace('.', ',')}M`
  if (n >= 1_000) return `${prefix} ${(n / 1_000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}K`
  return `${prefix} ${n.toLocaleString('pt-BR')}`
}

function fmtSqm(n?: number | null): string {
  if (!n) return '—'
  return `R$ ${n.toLocaleString('pt-BR')}/m²`
}

interface PropertyCardProps {
  property: IMIProperty
  onCompare?: (id: string) => void
  isComparing?: boolean
  onFavorite?: (id: string) => void
  isFavorited?: boolean
  size?: 'sm' | 'md'
  viewsCount?: number
  leadsCount?: number
  bulkMode?: boolean
  isSelected?: boolean
  onSelect?: (id: string) => void
}

export function PropertyCard({
  property,
  onCompare,
  isComparing,
  onFavorite,
  isFavorited,
  size = 'md',
  viewsCount,
  leadsCount,
  bulkMode = false,
  isSelected = false,
  onSelect,
}: PropertyCardProps) {
  const [hovered, setHovered] = useState(false)
  const router = useRouter()
  const p = property
  const score = p.imi_score ?? 0
  const marketDelta = p.market_delta_pct ?? 0
  const isAboveMarket = marketDelta < 0
  const isBelowMarket = marketDelta > 0

  const imageUrl = p.cover_image_url
    ?? (Array.isArray(p.image_urls) ? p.image_urls[0] : undefined)
    ?? (Array.isArray(p.images) ? p.images[0] : undefined)

  const statusColors: Record<string, string> = {
    disponivel: '#5DB887',
    lancamento: '#fb923c',
    em_construcao: '#a78bfa',
    reservado: '#c084fc',
    em_negociacao: '#60a5fa',
    vendido: '#fbbf24',
  }
  const statusLabels: Record<string, string> = {
    disponivel: 'Disponível', lancamento: 'Lançamento',
    em_construcao: 'Construção', reservado: 'Reservado',
    em_negociacao: 'Negociação', vendido: 'Vendido',
    published: 'Disponível', draft: 'Rascunho',
  }
  const status = p.status?.toLowerCase() ?? 'disponivel'
  const statusColor = statusColors[status] ?? '#9ca3af'
  const statusLabel = statusLabels[status] ?? p.status

  const cardContent = (
      <article
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={bulkMode && onSelect ? (e) => { e.preventDefault(); onSelect(p.id) } : undefined}
        className="prop-card"
        style={{
          background: 'var(--bo-card, var(--navy-card, #142840))',
          border: `1px solid ${isSelected
            ? 'rgba(200,164,74,0.75)'
            : hovered || isComparing
              ? 'rgba(200,164,74,0.40)'
              : 'rgba(200,164,74,0.18)'}`,
          borderRadius: 12,
          overflow: 'hidden',
          transition: 'all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
          boxShadow: isSelected
            ? '0 0 0 2px rgba(200,164,74,0.30), 0 8px 32px rgba(0,0,0,0.35)'
            : hovered
              ? '0 12px 40px rgba(0,0,0,0.35), 0 0 48px rgba(200,164,74,0.07)'
              : '0 4px 16px rgba(0,0,0,0.25)',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--navy-raised, #1A3250)' }}>
          {imageUrl ? (
            <Image src={imageUrl} alt={p.name} fill style={{ objectFit: 'cover' }} sizes="(max-width:768px) 100vw, 400px" />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--navy-card, #142840), var(--navy-raised, #1A3250))',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="rgba(200,164,74,0.3)" strokeWidth="1.5" fill="none" />
                <polyline points="9 22 9 12 15 12 15 22" stroke="rgba(200,164,74,0.3)" strokeWidth="1.5" />
              </svg>
            </div>
          )}

          {/* IMI Score — top right */}
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
            <IMIScoreBadge score={score} size="sm" />
          </div>

          {/* Bulk checkbox overlay — top left (replaces status badge position when active) */}
          {bulkMode && (
            <div
              className={`imi-checkbox-overlay${isSelected ? ' selected' : ''}`}
              style={{ zIndex: 6 }}
              onClick={(e) => { e.preventDefault(); onSelect && onSelect(p.id) }}
            >
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#0B1928" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          )}

          {/* Status badge — top left */}
          <div style={{ position: 'absolute', top: bulkMode ? 40 : 10, left: 10, zIndex: 2 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 999,
              background: `${statusColor}22`,
              border: `1px solid ${statusColor}55`,
              fontSize: '8.5px', fontWeight: 600,
              letterSpacing: '1px', textTransform: 'uppercase',
              color: statusColor,
              fontFamily: 'var(--font-montserrat, sans-serif)',
            }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: statusColor }} />
              {statusLabel}
            </span>
          </div>

          {/* Action buttons — bottom right, on hover (always on mobile) */}
          <div className="prop-card-actions" style={{
            position: 'absolute', bottom: 8, right: 8, zIndex: 2,
            display: 'flex', gap: 4,
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(4px)',
            transition: 'all 200ms ease',
          }}>
            {onFavorite && (
              <button
                onClick={(e) => { e.preventDefault(); onFavorite(p.id) }}
                className="prop-action-btn"
                title="Favoritar"
                style={{
                  border: `1px solid ${isFavorited ? 'rgba(200,164,74,0.5)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <Heart size={12} style={{ color: isFavorited ? '#C8A44A' : '#9FAAB8' }} fill={isFavorited ? '#C8A44A' : 'none'} />
              </button>
            )}
            {onCompare && (
              <button
                onClick={(e) => { e.preventDefault(); onCompare(p.id) }}
                className="prop-action-btn"
                title="Comparar"
                style={{
                  border: `1px solid ${isComparing ? 'rgba(200,164,74,0.5)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <Scale size={12} style={{ color: isComparing ? '#C8A44A' : '#9FAAB8' }} />
              </button>
            )}
            {/* Quick navigation actions */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/backoffice/imoveis/${p.id}`) }}
              className="prop-action-btn"
              title="Ver detalhes"
              style={{
                border: '1px solid rgba(200,164,74,0.35)',
              }}
            >
              <ExternalLink size={11} style={{ color: '#C8A44A' }} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/backoffice/tracking/qr?property=${p.id}`) }}
              className="prop-action-btn"
              title="Gerar QR Code"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <QrCode size={11} style={{ color: '#9FAAB8' }} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/backoffice/conteudo/criador?property=${p.id}`) }}
              className="prop-action-btn"
              title="Gerar Conteúdo"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Sparkles size={11} style={{ color: '#9FAAB8' }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: size === 'sm' ? '12px' : '16px' }}>
          {/* Price row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-dm-mono, monospace)',
                fontSize: size === 'sm' ? '16px' : '19px',
                fontWeight: 400,
                color: 'var(--bo-text, #EBE7E0)',
                letterSpacing: '-0.3px',
                lineHeight: 1.1,
              }}>
                {fmt(p.price)}
              </div>
              {p.price_per_sqm && (
                <div style={{
                  fontFamily: 'var(--font-dm-mono, monospace)',
                  fontSize: '10px',
                  color: 'var(--bo-text-dim, #5C6B7D)',
                  marginTop: 2,
                }}>
                  {fmtSqm(p.price_per_sqm)}
                </div>
              )}
            </div>
            {/* Market delta */}
            {marketDelta !== 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '3px 7px', borderRadius: 6,
                background: isBelowMarket ? 'rgba(93,184,135,0.10)' : 'rgba(224,107,107,0.10)',
                border: `1px solid ${isBelowMarket ? 'rgba(93,184,135,0.25)' : 'rgba(224,107,107,0.22)'}`,
              }}>
                {isBelowMarket
                  ? <TrendingDown size={10} style={{ color: '#5DB887' }} />
                  : <TrendingUp size={10} style={{ color: '#E06B6B' }} />
                }
                <span style={{
                  fontFamily: 'var(--font-dm-mono, monospace)',
                  fontSize: '9px',
                  color: isBelowMarket ? '#5DB887' : '#E06B6B',
                  fontWeight: 400,
                }}>
                  {isBelowMarket ? '-' : '+'}{Math.abs(marketDelta).toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Name + location */}
          <div style={{ marginBottom: 10 }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--bo-text, #EBE7E0)',
              fontFamily: 'var(--font-montserrat, sans-serif)',
              lineHeight: 1.3,
              marginBottom: 3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {p.name}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: '10px',
              color: 'var(--bo-text-muted, #9FAAB8)',
              fontFamily: 'var(--font-montserrat, sans-serif)',
            }}>
              <MapPin size={9} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {[p.neighborhood, p.city].filter(Boolean).join(' · ') || '—'}
              </span>
            </div>
          </div>

          {/* Specs chips */}
          <div style={{
            display: 'flex', gap: 4, flexWrap: 'wrap',
            paddingBottom: 10,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 10,
          }}>
            {p.area && (
              <Chip icon={<Ruler size={9} />} label={`${p.area}m²`} />
            )}
            {p.bedrooms != null && p.bedrooms > 0 && (
              <Chip icon={<Bed size={9} />} label={`${p.bedrooms}`} />
            )}
            {p.bathrooms != null && p.bathrooms > 0 && (
              <Chip icon={<Bath size={9} />} label={`${p.bathrooms}`} />
            )}
            {p.parking != null && p.parking > 0 && (
              <Chip icon={<Car size={9} />} label={`${p.parking}`} />
            )}
          </div>

          {/* Intelligence row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <MetricPill label="Yield" value={p.yield_est ? `${p.yield_est}%` : '—'} color="#5DB887" />
            <MetricPill label="ROI" value={p.roi_12m ? `${p.roi_12m}%` : '—'} color="#5B9BD5" />
            <div style={{ flex: 1 }}>
              <div style={{
                height: 3,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 999,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${score}%`,
                  background: `linear-gradient(90deg, ${score >= 75 ? '#5DB887' : score >= 60 ? '#5B9BD5' : '#D4913A'}88, ${score >= 75 ? '#5DB887' : score >= 60 ? '#5B9BD5' : '#D4913A'})`,
                  borderRadius: 999,
                }} />
              </div>
            </div>
          </div>

          {/* Performance mini-strip */}
          <div style={{
            display: 'flex', gap: 10, marginTop: 8,
            paddingTop: 7,
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            <span style={{
              fontFamily: 'var(--font-dm-mono, monospace)',
              fontSize: '9px', color: '#5C6B7D',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <Eye size={8} style={{ opacity: 0.6 }} />
              {viewsCount !== undefined ? viewsCount.toLocaleString('pt-BR') : '—'}
            </span>
            <span style={{
              fontFamily: 'var(--font-dm-mono, monospace)',
              fontSize: '9px', color: '#5C6B7D',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <BarChart2 size={8} style={{ opacity: 0.6 }} />
              {leadsCount !== undefined ? leadsCount.toLocaleString('pt-BR') : '—'}
            </span>
          </div>
        </div>
      </article>
  )

  if (bulkMode) {
    return <div style={{ textDecoration: 'none', display: 'block' }}>{cardContent}</div>
  }

  return (
    <Link href={`/backoffice/imoveis/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      {cardContent}
    </Link>
  )
}

/* ─── Global Styles for PropertyCard ─────────── */
if (typeof document !== 'undefined' && !document.getElementById('prop-card-styles')) {
  const s = document.createElement('style')
  s.id = 'prop-card-styles'
  s.textContent = `
    .prop-action-btn {
      width: 32px; height: 32px; border-radius: 6px;
      background: rgba(11,25,40,0.85);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
    }
    @media (max-width: 767px) {
      .prop-card-actions {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
      .prop-action-btn {
        width: 36px; height: 36px;
      }
    }
    .imi-checkbox-overlay {
      position: absolute; top: 10px; left: 10px; z-index: 5;
      width: 22px; height: 22px; border-radius: 6px;
      border: 2px solid rgba(200,164,74,0.6);
      background: rgba(11,25,40,0.8);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.15s;
    }
    .imi-checkbox-overlay.selected {
      background: #C8A44A; border-color: #C8A44A;
    }
  `
  document.head.appendChild(s)
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '3px 7px', borderRadius: 999,
      background: 'var(--bo-surface, rgba(255,255,255,0.04))',
      border: '1px solid var(--bo-border, rgba(200,164,74,0.12))',
      fontSize: '10px',
      color: 'var(--bo-text-muted, #9FAAB8)',
      fontFamily: 'var(--font-montserrat, sans-serif)',
    }}>
      {icon}
      {label}
    </span>
  )
}

function MetricPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{
        fontSize: '7.5px',
        fontFamily: 'var(--font-montserrat, sans-serif)',
        fontWeight: 600,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--bo-text-dim, #5C6B7D)',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-dm-mono, monospace)',
        fontSize: '11px',
        color,
        fontWeight: 400,
      }}>
        {value}
      </span>
    </div>
  )
}

/** Compact horizontal list row variant */
export function PropertyListRow({
  property,
  onCompare,
  isComparing,
}: Omit<PropertyCardProps, 'size'>) {
  const p = property
  const score = p.imi_score ?? 0

  const statusColors: Record<string, string> = {
    disponivel: '#5DB887', lancamento: '#fb923c',
    em_construcao: '#a78bfa', reservado: '#c084fc',
    em_negociacao: '#60a5fa', vendido: '#fbbf24',
    published: '#5DB887', draft: '#9ca3af',
  }
  const statusLabels: Record<string, string> = {
    disponivel: 'Disponível', lancamento: 'Lançamento',
    em_construcao: 'Construção', reservado: 'Reservado',
    em_negociacao: 'Negociação', vendido: 'Vendido',
    published: 'Disponível', draft: 'Rascunho',
  }
  const status = p.status?.toLowerCase() ?? 'disponivel'
  const statusColor = statusColors[status] ?? '#9ca3af'
  const statusLabel = statusLabels[status] ?? p.status

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 100px 90px 90px 80px 80px 48px 116px',
      gap: 0,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      alignItems: 'center',
      transition: 'background 150ms ease',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,164,74,0.05)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Clickable main area */}
      <Link href={`/backoffice/imoveis/${p.id}`} style={{ textDecoration: 'none', display: 'contents' }}>
        {/* Name + location */}
        <div style={{ minWidth: 0, padding: '12px 16px', cursor: 'pointer' }}>
          <div style={{
            fontSize: '12px', fontWeight: 600,
            color: 'var(--bo-text, #EBE7E0)',
            fontFamily: 'var(--font-montserrat, sans-serif)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {p.name}
          </div>
          <div style={{
            fontSize: '10px', color: 'var(--bo-text-dim, #5C6B7D)',
            fontFamily: 'var(--font-montserrat, sans-serif)',
          }}>
            {[p.neighborhood, p.city].filter(Boolean).join(' · ') || '—'}
          </div>
        </div>

        {/* Price */}
        <div style={{
          fontFamily: 'var(--font-dm-mono, monospace)',
          fontSize: '12px',
          color: 'var(--bo-text, #EBE7E0)',
          padding: '12px 4px',
        }}>
          {fmt(p.price)}
        </div>

        {/* Price/m² */}
        <div style={{
          fontFamily: 'var(--font-dm-mono, monospace)',
          fontSize: '11px',
          color: 'var(--bo-text-muted, #9FAAB8)',
          padding: '12px 4px',
        }}>
          {p.price_per_sqm ? `R$${(p.price_per_sqm / 1000).toFixed(1)}k` : '—'}
        </div>

        {/* Yield */}
        <div style={{
          fontFamily: 'var(--font-dm-mono, monospace)',
          fontSize: '11px',
          color: '#5DB887',
          padding: '12px 4px',
        }}>
          {p.yield_est ? `${p.yield_est}%` : '—'}
        </div>

        {/* Status */}
        <div style={{ padding: '12px 4px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 6px', borderRadius: 999,
            background: `${statusColor}18`,
            border: `1px solid ${statusColor}44`,
            fontSize: '8px', fontWeight: 600,
            letterSpacing: '0.8px', textTransform: 'uppercase',
            color: statusColor,
            fontFamily: 'var(--font-montserrat, sans-serif)',
          }}>
            {statusLabel}
          </span>
        </div>

        {/* Area */}
        <div style={{
          fontFamily: 'var(--font-dm-mono, monospace)',
          fontSize: '11px',
          color: 'var(--bo-text-muted, #9FAAB8)',
          padding: '12px 4px',
        }}>
          {p.area ? `${p.area}m²` : '—'}
        </div>

        {/* IMI Score */}
        <div style={{ padding: '12px 4px' }}>
          <IMIScoreBadge score={score} size="xs" />
        </div>
      </Link>

      {/* Quick action buttons column */}
      <div style={{ display: 'flex', gap: 4, padding: '0 8px', alignItems: 'center' }}>
        <Link
          href={`/backoffice/imoveis/${p.id}`}
          title="Ver detalhes"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 6,
            background: 'rgba(200,164,74,0.08)',
            border: '1px solid rgba(200,164,74,0.3)',
            cursor: 'pointer', textDecoration: 'none',
          }}
        >
          <ExternalLink size={11} style={{ color: '#C8A44A' }} />
        </Link>
        <Link
          href={`/backoffice/tracking/qr?property=${p.id}`}
          title="Gerar QR Code"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 6,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer', textDecoration: 'none',
          }}
        >
          <QrCode size={11} style={{ color: '#9FAAB8' }} />
        </Link>
        <Link
          href={`/backoffice/conteudo/criador?property=${p.id}`}
          title="Gerar Conteúdo"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 6,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer', textDecoration: 'none',
          }}
        >
          <Sparkles size={11} style={{ color: '#9FAAB8' }} />
        </Link>
      </div>
    </div>
  )
}
