'use client'

/**
 * IMI Mobile UI — Shared Primitives for Imóveis Module
 * Design System v3 (DS3) · Proptech-grade mobile components
 *
 * Components exported:
 *   MobileAppBar, MobileSearchBar, MobilePropertyCard,
 *   MobilePropertyCardSkeleton, MobileBottomSheet,
 *   MobileFilterChips, MobileEmptyState, MobileBottomNav
 */

import React, { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Building2, MapPin, Bed, Bath, Car, Ruler,
  Star, Sparkles, BarChart2, Scale, LayoutGrid, Briefcase,
  SlidersHorizontal, X, Home,
} from 'lucide-react'
import type { IMIProperty } from '@/features/properties/types'
import { getScoreColor } from '@/features/properties/services/score.service'
import { usePathname } from 'next/navigation'

// ─── Design Tokens (DS3) ─────────────────────────────────────────────────────

export const T = {
  navy:       'var(--bg-base)',
  navyMid:    'var(--bg-surface)',
  navyCard:   'var(--bg-elevated)',
  navyRaised: 'var(--bg-muted)',
  gold:       '#B8943A',
  goldBright: '#D4B86A',
  text1:      'var(--text-primary)',
  text2:      'var(--text-secondary)',
  text3:      'var(--text-tertiary)',
  textInv:    '#0B1120',
  green:      '#5DB887',
  red:        '#E06B6B',
  blue:       '#5B9BD5',
  amber:      '#D4913A',
  borderSoft: 'var(--border-subtle)',
  borderGold: 'rgba(184,148,58,0.22)',
  glassBase:  'color-mix(in srgb, var(--bg-base) 85%, transparent)',
} as const

export const STATUS_CONFIGS: Record<string, { label: string; color: string }> = {
  disponivel:    { label: 'Disponível',    color: T.green },
  lancamento:    { label: 'Lançamento',    color: T.blue },
  em_construcao: { label: 'Em Construção', color: T.amber },
  reservado:     { label: 'Reservado',     color: T.gold },
  em_negociacao: { label: 'Negociação',    color: T.text2 },
  vendido:       { label: 'Vendido',       color: T.red },
  arquivado:     { label: 'Arquivado',     color: T.text3 },
  rascunho:      { label: 'Rascunho',      color: T.text3 },
}

export function normalizeStatus(s: string): string {
  const MAP: Record<string, string> = {
    launch: 'lancamento', available: 'disponivel', under_construction: 'em_construcao',
    ready: 'disponivel', sold: 'vendido', reserved: 'reservado',
    negotiating: 'em_negociacao', published: 'disponivel', draft: 'rascunho',
    campaign: 'lancamento', private: 'arquivado',
  }
  return MAP[s?.toLowerCase()] ?? s?.toLowerCase() ?? 'disponivel'
}

export function fmtPrice(n?: number | null): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(2).replace('.', ',')}M`
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}K`
  return `R$ ${n.toLocaleString('pt-BR')}`
}

// ─── Global Animation Styles ──────────────────────────────────────────────────

export function MobileGlobalStyles() {
  return (
    <style suppressHydrationWarning>{`
      @keyframes shimmer {
        0%   { background-position: -200% center; }
        100% { background-position:  200% center; }
      }
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes sheetIn {
        from { transform: translateY(100%); }
        to   { transform: translateY(0); }
      }
      @keyframes overlayIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.95); }
        to   { opacity: 1; transform: scale(1); }
      }
      .mob-card-link { display: block; text-decoration: none; color: inherit; }
      .mob-card-link:active .mob-card-inner {
        transform: scale(0.975);
      }
      .mob-card-inner {
        transition: transform 150ms cubic-bezier(0.16,1,0.3,1);
        will-change: transform;
      }
      .mob-btn-tap { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
      .mob-btn-tap:active { opacity: 0.72; transform: scale(0.96); }
      .mob-chip-tap { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
      .mob-chip-tap:active { opacity: 0.8; }
      .mob-prop-card-anim {
        animation: fadeSlideUp 400ms cubic-bezier(0.16,1,0.3,1) both;
      }
      @media (prefers-reduced-motion: reduce) {
        .mob-card-inner, .mob-btn-tap, .mob-prop-card-anim { animation: none !important; transition: none !important; transform: none !important; }
      }
    `}</style>
  )
}

// ─── MobileAppBar ─────────────────────────────────────────────────────────────

interface MobileAppBarProps {
  title: string
  subtitle?: string
  onBack?: () => void
  backHref?: string
  actions?: ReactNode
  transparent?: boolean
  style?: React.CSSProperties
}

export function MobileAppBar({ title, subtitle, onBack, backHref, actions, transparent, style }: MobileAppBarProps) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 56,
      background: transparent ? 'transparent' : 'var(--bg-surface)',
      borderBottom: transparent ? 'none' : `1px solid var(--border-subtle)`,
      display: 'flex', alignItems: 'center',
      padding: '0 4px 0 8px',
      gap: 4,
      ...style,
    }}>
      {/* Back / Logo */}
      {onBack ? (
        <button
          onClick={onBack}
          className="mob-btn-tap"
          style={{
            width: 44, height: 44, borderRadius: 'var(--r-md)',
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', flexShrink: 0,
          }}
        >
          <ArrowLeft size={20} />
        </button>
      ) : backHref ? (
        <Link href={backHref} style={{ textDecoration: 'none' }}>
          <button
            className="mob-btn-tap"
            style={{
              width: 44, height: 44, borderRadius: 'var(--r-md)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', flexShrink: 0,
            }}
          >
            <ArrowLeft size={20} />
          </button>
        </Link>
      ) : (
        /* IMI Badge */
        <div style={{
          width: 30, height: 30, borderRadius: 'var(--r-md)',
          background: T.gold,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginLeft: 8,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 8, fontWeight: 700,
            color: T.textInv, letterSpacing: '0.5px',
          }}>IMI</span>
        </div>
      )}

      {/* Title area */}
      <div style={{ flex: 1, minWidth: 0, paddingLeft: onBack || backHref ? 0 : 8 }}>
        <div style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 18, fontWeight: 600,
          color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{title}</div>
        {subtitle && (
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 10, fontWeight: 500,
            color: 'var(--text-tertiary)', letterSpacing: '0.3px',
            marginTop: -1,
          }}>{subtitle}</div>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  )
}

// ─── MobileAppBarAction ───────────────────────────────────────────────────────

interface MobileAppBarActionProps {
  icon: ReactNode
  href?: string
  onClick?: () => void
  active?: boolean
  badge?: number
  label?: string
  variant?: 'default' | 'primary'
}

export function MobileAppBarAction({ icon, href, onClick, active, badge, label, variant = 'default' }: MobileAppBarActionProps) {
  const isPrimary = variant === 'primary'
  const btn = (
    <button
      onClick={onClick}
      className="mob-btn-tap"
      style={{
        minWidth: 44, height: 44, borderRadius: 'var(--r-md)',
        background: isPrimary ? T.gold : active ? `rgba(184,148,58,0.12)` : 'transparent',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isPrimary ? T.textInv : active ? T.gold : 'var(--text-secondary)',
        position: 'relative',
        gap: 4, padding: '0 10px',
      }}
    >
      {icon}
      {label && (
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11, fontWeight: 600,
          color: isPrimary ? T.textInv : active ? T.gold : 'var(--text-secondary)',
        }}>{label}</span>
      )}
      {badge != null && badge > 0 && (
        <span style={{
          position: 'absolute', top: 6, right: 6,
          background: T.gold, color: T.textInv,
          fontSize: 8, fontWeight: 700, borderRadius: 'var(--r-full)',
          padding: '1px 4px', minWidth: 14, textAlign: 'center',
          lineHeight: '14px',
        }}>{badge}</span>
      )}
    </button>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{btn}</Link> : btn
}

// ─── MobileSearchBar ──────────────────────────────────────────────────────────

interface MobileSearchBarProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
}

export function MobileSearchBar({ value, onChange, placeholder = 'Buscar...', autoFocus }: MobileSearchBarProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      height: 44,
      background: 'var(--bg-elevated)',
      border: `1px solid ${focused ? 'rgba(184,148,58,0.5)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--r-lg)',
      padding: '0 14px',
      transition: 'border-color 150ms ease',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: focused ? T.gold : 'var(--text-tertiary)', flexShrink: 0, transition: 'color 150ms ease' }}>
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          fontFamily: 'var(--font-sans)',
          fontSize: 14, color: 'var(--text-primary)',
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="mob-btn-tap"
          style={{
            width: 20, height: 20, borderRadius: 'var(--r-full)',
            background: 'var(--text-tertiary)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
          }}
        >
          <X size={12} color={T.navy} />
        </button>
      )}
    </div>
  )
}

// ─── MobileFilterChips ────────────────────────────────────────────────────────

interface FilterChip {
  value: string
  label: string
  icon?: ReactNode
}

interface MobileFilterChipsProps {
  chips: FilterChip[]
  active: string
  onChange: (v: string) => void
}

export function MobileFilterChips({ chips, active, onChange }: MobileFilterChipsProps) {
  return (
    <div style={{
      display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px',
      scrollbarWidth: 'none',
    }}>
      <style suppressHydrationWarning>{`div::-webkit-scrollbar{display:none}`}</style>
      {chips.map(chip => {
        const isActive = active === chip.value
        return (
          <button
            key={chip.value}
            onClick={() => onChange(isActive ? '' : chip.value)}
            className="mob-chip-tap"
            style={{
              flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 5,
              height: 32, padding: '0 12px',
              borderRadius: 'var(--r-full)',
              background: isActive ? T.gold : 'rgba(184,148,58,0.08)',
              border: `1px solid ${isActive ? T.gold : 'rgba(184,148,58,0.2)'}`,
              color: isActive ? T.textInv : 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
              fontSize: 11, fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 150ms ease',
              letterSpacing: '0.2px',
            }}
          >
            {chip.icon && (
              <span style={{ display: 'flex', alignItems: 'center', color: isActive ? T.textInv : 'var(--text-gold)' }}>
                {chip.icon}
              </span>
            )}
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── MobilePropertyCard ───────────────────────────────────────────────────────

interface MobilePropertyCardProps {
  property: IMIProperty
  isFavorite?: boolean
  onFavorite?: () => void
  animationDelay?: number
}

export function MobilePropertyCard({ property, isFavorite, onFavorite, animationDelay = 0 }: MobilePropertyCardProps) {
  const status = normalizeStatus(property.status)
  const statusCfg = STATUS_CONFIGS[status] ?? { label: status, color: T.text2 }
  const score = property.imi_score ?? 0
  const scoreColor = getScoreColor(score)
  const imageUrl = property.cover_image_url ?? property.image_urls?.[0] ?? null

  return (
    <Link
      href={`/backoffice/imoveis/${property.id}`}
      className="mob-card-link"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div
        className="mob-card-inner mob-prop-card-anim"
        style={{ animationDelay: `${animationDelay}ms`, borderRadius: 'var(--r-xl)', overflow: 'hidden', marginBottom: 14 }}
      >
        {/* Image with full overlay */}
        <div style={{ position: 'relative', aspectRatio: '3/2', background: 'var(--bg-muted)' }}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={property.name}
              fill
              sizes="(max-width: 768px) 100vw"
              style={{ objectFit: 'cover' }}
              priority={animationDelay === 0}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-muted) 100%)',
            }}>
              <Building2 size={44} style={{ color: 'rgba(184,148,58,0.15)' }} />
            </div>
          )}

          {/* Gradient overlay — bottom 60% */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(11,17,32,0.97) 0%, rgba(11,17,32,0.4) 45%, transparent 70%)',
          }} />

          {/* Top badges */}
          <div style={{
            position: 'absolute', top: 10, left: 10, right: 10,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          }}>
            {/* IMI Score */}
            {score > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(11,17,32,0.72)', backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: 'var(--r-md)', padding: '5px 8px',
                border: `1px solid ${scoreColor}30`,
              }}>
                <Sparkles size={10} style={{ color: scoreColor }} />
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12, fontWeight: 500, color: scoreColor,
                }}>{score}</span>
              </div>
            )}

            {/* Status badge */}
            <div style={{
              background: T.glassBase, backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 'var(--r-md)', padding: '5px 8px',
              border: `1px solid ${statusCfg.color}30`,
            }}>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.8px',
                textTransform: 'uppercase', color: statusCfg.color,
              }}>{statusCfg.label}</span>
            </div>
          </div>

          {/* Favorite button */}
          {onFavorite && (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onFavorite() }}
              className="mob-btn-tap"
              style={{
                position: 'absolute', bottom: 56, right: 10,
                width: 36, height: 36,
                background: 'rgba(11,17,32,0.72)', backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: `1px solid rgba(184,148,58,0.22)`,
                borderRadius: 'var(--r-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Star
                size={16}
                style={{ color: isFavorite ? T.gold : T.text2, fill: isFavorite ? T.gold : 'none' }}
              />
            </button>
          )}

          {/* Bottom content overlay */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px 14px',
          }}>
            {/* Price */}
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 20, fontWeight: 400, color: '#F0F2F8',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
              marginBottom: 4,
            }}>{fmtPrice(property.price)}</div>

            {/* Name */}
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 14, fontWeight: 500, color: '#F0F2F8',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              marginBottom: 6,
            }}>{property.name}</div>

            {/* Location */}
            {(property.neighborhood || property.city) && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8,
              }}>
                <MapPin size={11} style={{ color: 'rgba(235,231,224,0.55)', flexShrink: 0 }} />
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11, color: 'rgba(235,231,224,0.55)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {[property.neighborhood, property.city].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            {/* Specs row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: 8,
            }}>
              {property.bedrooms != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Bed size={12} style={{ color: 'rgba(235,231,224,0.45)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(235,231,224,0.72)' }}>{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Bath size={12} style={{ color: 'rgba(235,231,224,0.45)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(235,231,224,0.72)' }}>{property.bathrooms}</span>
                </div>
              )}
              {property.parking != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Car size={12} style={{ color: 'rgba(235,231,224,0.45)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(235,231,224,0.72)' }}>{property.parking}</span>
                </div>
              )}
              {property.area != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Ruler size={12} style={{ color: 'rgba(235,231,224,0.45)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(235,231,224,0.72)' }}>{property.area}m²</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── MobilePropertyCardSkeleton ───────────────────────────────────────────────

export function MobilePropertyCardSkeleton() {
  return (
    <div style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', marginBottom: 14, background: 'var(--bg-elevated)' }}>
      <div style={{
        aspectRatio: '3/2',
        background: `linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-muted) 50%, var(--bg-elevated) 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }} />
    </div>
  )
}

// ─── MobileBottomSheet ────────────────────────────────────────────────────────

interface MobileBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
}

export function MobileBottomSheet({ isOpen, onClose, title, children, footer }: MobileBottomSheetProps) {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'overlayIn 150ms ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxHeight: '88vh',
          background: 'var(--bg-elevated)',
          borderRadius: '20px 20px 0 0',
          borderTop: `1px solid rgba(184,148,58,0.22)`,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
          animation: 'sheetIn 350ms cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.15)',
          margin: '12px auto 0',
        }} />

        {/* Header */}
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px 12px',
            borderBottom: `1px solid rgba(184,148,58,0.10)`,
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
              letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>{title}</span>
            <button
              onClick={onClose}
              className="mob-btn-tap"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--bg-hover)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            flexShrink: 0,
            borderTop: `1px solid rgba(184,148,58,0.10)`,
            padding: `14px 20px max(14px, env(safe-area-inset-bottom))`,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MobileEmptyState ─────────────────────────────────────────────────────────

interface MobileEmptyStateProps {
  title?: string
  subtitle?: string
  action?: { label: string; href: string }
}

export function MobileEmptyState({ title = 'Nenhum imóvel', subtitle = 'Tente ajustar os filtros ou adicione um novo imóvel.', action }: MobileEmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 24px', gap: 16, textAlign: 'center',
      animation: 'scaleIn 300ms cubic-bezier(0.16,1,0.3,1) both',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 'var(--r-2xl)',
        background: 'rgba(184,148,58,0.06)',
        border: '1px solid rgba(184,148,58,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Building2 size={32} style={{ color: 'rgba(184,148,58,0.4)' }} />
      </div>
      <div>
        <div style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6,
        }}>{title}</div>
        <div style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6,
        }}>{subtitle}</div>
      </div>
      {action && (
        <Link href={action.href} style={{ textDecoration: 'none' }}>
          <button
            className="mob-btn-tap"
            style={{
              height: 44, padding: '0 24px', borderRadius: 'var(--r-md)',
              background: T.gold, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 12, fontWeight: 700, letterSpacing: '1px',
              textTransform: 'uppercase', color: T.textInv,
            }}
          >
            {action.label}
          </button>
        </Link>
      )}
    </div>
  )
}

// ─── MobileBottomNav ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/backoffice/hoje',              icon: <Home size={22} />,        label: 'Menu'      },
  { href: '/backoffice/imoveis',           icon: <Building2 size={22} />,   label: 'Imóveis'   },
  { href: '/backoffice/imoveis/explorer',  icon: <BarChart2 size={22} />,   label: 'Explorer'  },
  { href: '/backoffice/imoveis/portfolio', icon: <Briefcase size={22} />,   label: 'Portfólio' },
  { href: '/backoffice/imoveis/comparar',  icon: <Scale size={22} />,       label: 'Comparar'  },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/backoffice/hoje') {
      return pathname === '/backoffice/hoje'
    }
    if (href === '/backoffice/imoveis') {
      // Only exact or direct children (not sub-modules)
      return pathname === '/backoffice/imoveis' || /^\/backoffice\/imoveis\/[^/]+$/.test(pathname ?? '')
        && !pathname?.includes('/explorer') && !pathname?.includes('/portfolio') && !pathname?.includes('/comparar')
    }
    return pathname?.startsWith(href) ?? false
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'var(--bg-surface)',
      borderTop: `1px solid var(--border-subtle)`,
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {NAV_ITEMS.map(item => {
        const active = isActive(item.href)
        return (
          <Link key={item.href} href={item.href} style={{ flex: 1, textDecoration: 'none' }}>
            <div
              className="mob-btn-tap"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 3,
                height: 56, padding: '0 4px',
                color: active ? T.gold : 'var(--text-tertiary)',
                transition: 'color 150ms ease',
              }}
            >
              {item.icon}
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 9, fontWeight: active ? 700 : 500,
                letterSpacing: '0.3px',
                color: active ? T.gold : 'var(--text-tertiary)',
              }}>{item.label}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ─── MobileSortChips ─────────────────────────────────────────────────────────

interface SortChip {
  field: string
  dir: 'asc' | 'desc'
  label: string
}

interface MobileSortChipsProps {
  options: SortChip[]
  activeField: string
  activeDir: 'asc' | 'desc'
  onChange: (field: string, dir: 'asc' | 'desc') => void
}

export function MobileSortChips({ options, activeField, activeDir, onChange }: MobileSortChipsProps) {
  return (
    <div style={{
      display: 'flex', gap: 6, overflowX: 'auto', padding: '0 16px',
      scrollbarWidth: 'none',
    }}>
      {options.map(opt => {
        const isActive = activeField === opt.field && activeDir === opt.dir
        return (
          <button
            key={`${opt.field}-${opt.dir}`}
            onClick={() => onChange(opt.field, opt.dir)}
            className="mob-chip-tap"
            style={{
              flexShrink: 0, height: 28, padding: '0 10px',
              borderRadius: 'var(--r-full)',
              background: isActive ? 'rgba(184,148,58,0.15)' : 'transparent',
              border: `1px solid ${isActive ? T.gold : 'rgba(184,148,58,0.15)'}`,
              color: isActive ? T.gold : 'var(--text-tertiary)',
              fontFamily: 'var(--font-sans)',
              fontSize: 10, fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── MobileSection ───────────────────────────────────────────────────────────

interface MobileSectionProps {
  title: string
  subtitle?: string
  children: ReactNode
  action?: ReactNode
  style?: React.CSSProperties
}

export function MobileSection({ title, subtitle, children, action, style }: MobileSectionProps) {
  return (
    <div style={{ marginBottom: 24, ...style }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        padding: '0 16px', marginBottom: 12,
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 16, fontWeight: 500, color: 'var(--text-primary)',
          }}>{title}</div>
          {subtitle && (
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2,
            }}>{subtitle}</div>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ─── MobileKPICard ────────────────────────────────────────────────────────────

interface MobileKPICardProps {
  label: string
  value: string | number
  unit?: string
  delta?: number
  icon?: ReactNode
  color?: string
}

export function MobileKPICard({ label, value, unit, delta, icon, color = T.gold }: MobileKPICardProps) {
  const isPositive = delta != null && delta > 0
  const isNegative = delta != null && delta < 0

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: `1px solid var(--border-subtle)`,
      borderRadius: 'var(--r-lg)', padding: '16px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 9, fontWeight: 600, letterSpacing: '1.5px',
          textTransform: 'uppercase', color: 'var(--text-tertiary)',
        }}>{label}</span>
        {icon && (
          <div style={{
            width: 28, height: 28, borderRadius: 'var(--r-md)',
            background: `${color}14`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>{icon}</div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 22, fontWeight: 400, color: 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}>{value}</span>
        {unit && (
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11, color: 'var(--text-tertiary)',
          }}>{unit}</span>
        )}
      </div>
      {delta != null && (
        <div style={{
          marginTop: 6, display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: 'var(--font-sans)', fontSize: 10,
          color: isPositive ? T.green : isNegative ? T.red : 'var(--text-tertiary)',
        }}>
          {isPositive ? '↑' : isNegative ? '↓' : '—'}
          {Math.abs(delta).toFixed(1)}%
        </div>
      )}
    </div>
  )
}

// ─── MobileFiltersButton ──────────────────────────────────────────────────────

interface MobileFiltersButtonProps {
  count: number
  onClick: () => void
}

export function MobileFiltersButton({ count, onClick }: MobileFiltersButtonProps) {
  return (
    <button
      onClick={onClick}
      className="mob-btn-tap"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 14px', height: 36, borderRadius: 'var(--r-full)',
        background: 'transparent',
        border: `1px solid ${count > 0 ? T.gold : 'rgba(184,148,58,0.25)'}`,
        color: T.gold,
        fontFamily: 'var(--font-sans)',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <SlidersHorizontal size={13} />
      Filtros
      {count > 0 && (
        <span style={{
          background: T.gold, color: T.textInv,
          fontSize: 9, fontWeight: 700, borderRadius: 'var(--r-full)',
          padding: '1px 5px', minWidth: 16, textAlign: 'center',
        }}>{count}</span>
      )}
    </button>
  )
}
