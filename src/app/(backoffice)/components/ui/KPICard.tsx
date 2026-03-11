'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  label: string
  value: string | number
  sublabel?: string
  delta?: number        // % change — positive = up, negative = down, undefined = stable
  deltaLabel?: string   // e.g. "vs mês passado"
  icon?: React.ReactNode
  accent?: 'blue' | 'hot' | 'warm' | 'cold' | 'ai' | 'green'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

// ── Accent palette ──────────────────────────────────────────────────────
const ACCENT: Record<string, {
  color: string
  border: string
  glow: string
  bg: string
  iconBg: string
  deltaUp: string
  raw: string
}> = {
  blue: {
    color:   'var(--imi-blue-bright)',
    border:  '1px solid rgba(59,130,246,0.30)',
    glow:    '0 0 24px rgba(59,130,246,0.12)',
    bg:      'linear-gradient(160deg, rgba(59,130,246,0.11) 0%, rgba(59,130,246,0.03) 50%, transparent 100%)',
    iconBg:  'rgba(59,130,246,0.15)',
    deltaUp: 'var(--s-done)',
    raw:     '59,130,246',
  },
  hot: {
    color:   'var(--s-hot)',
    border:  '1px solid rgba(248,113,113,0.28)',
    glow:    '0 0 24px rgba(248,113,113,0.10)',
    bg:      'linear-gradient(160deg, rgba(248,113,113,0.10) 0%, rgba(248,113,113,0.03) 50%, transparent 100%)',
    iconBg:  'rgba(248,113,113,0.14)',
    deltaUp: 'var(--s-done)',
    raw:     '248,113,113',
  },
  warm: {
    color:   'var(--s-warm)',
    border:  '1px solid rgba(251,191,36,0.28)',
    glow:    '0 0 24px rgba(251,191,36,0.10)',
    bg:      'linear-gradient(160deg, rgba(251,191,36,0.10) 0%, rgba(251,191,36,0.03) 50%, transparent 100%)',
    iconBg:  'rgba(251,191,36,0.14)',
    deltaUp: 'var(--s-done)',
    raw:     '251,191,36',
  },
  cold: {
    color:   'var(--s-cold)',
    border:  '1px solid rgba(34,211,238,0.28)',
    glow:    '0 0 24px rgba(34,211,238,0.10)',
    bg:      'linear-gradient(160deg, rgba(34,211,238,0.10) 0%, rgba(34,211,238,0.03) 50%, transparent 100%)',
    iconBg:  'rgba(34,211,238,0.14)',
    deltaUp: 'var(--s-done)',
    raw:     '34,211,238',
  },
  ai: {
    color:   'var(--imi-ai-gold)',
    border:  '1px solid rgba(234,179,8,0.28)',
    glow:    '0 0 24px rgba(234,179,8,0.10)',
    bg:      'linear-gradient(160deg, rgba(234,179,8,0.10) 0%, rgba(234,179,8,0.03) 50%, transparent 100%)',
    iconBg:  'rgba(234,179,8,0.14)',
    deltaUp: 'var(--s-done)',
    raw:     '234,179,8',
  },
  green: {
    color:   'var(--s-done)',
    border:  '1px solid rgba(74,222,128,0.28)',
    glow:    '0 0 24px rgba(74,222,128,0.12)',
    bg:      'linear-gradient(160deg, rgba(74,222,128,0.11) 0%, rgba(74,222,128,0.03) 50%, transparent 100%)',
    iconBg:  'rgba(74,222,128,0.14)',
    deltaUp: 'var(--s-done)',
    raw:     '74,222,128',
  },
}

const VALUE_SIZES: Record<string, string> = {
  sm: '26px',
  md: '34px',
  lg: '46px',
}

const PAD: Record<string, string> = {
  sm: '12px 14px',
  md: '16px 18px',
  lg: '20px 22px',
}

export function KPICard({
  label,
  value,
  sublabel,
  delta,
  deltaLabel,
  icon,
  accent = 'blue',
  size = 'md',
  className = '',
  onClick,
}: KPICardProps) {
  const a = ACCENT[accent] ?? ACCENT.blue

  const isPositive = delta !== undefined && delta > 0
  const isNegative = delta !== undefined && delta < 0
  const isStable   = delta !== undefined && delta === 0

  const deltaColor = isPositive
    ? 'rgba(74,222,128,1)'
    : isNegative
    ? 'rgba(248,113,113,1)'
    : 'rgba(148,163,184,1)'

  const deltaBg = isPositive
    ? 'rgba(74,222,128,0.12)'
    : isNegative
    ? 'rgba(248,113,113,0.10)'
    : 'rgba(148,163,184,0.10)'

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        padding: PAD[size],
        background: 'rgba(13,20,36,0.92)',
        border: a.border,
        boxShadow: `
          ${a.glow},
          0 1px 0 rgba(255,255,255,0.04) inset,
          0 -1px 0 rgba(0,0,0,0.20) inset,
          0 4px 24px rgba(0,0,0,0.30)
        `,
      }}
      onClick={onClick}
    >
      {/* Accent background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: a.bg, borderRadius: 'inherit' }}
      />

      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(${a.raw},0.7) 50%, transparent 100%)`,
        }}
      />

      {/* Content */}
      <div className="relative">
        {/* Label + Icon row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: 'var(--bo-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              lineHeight: 1.4,
            }}
          >
            {label}
          </span>

          {icon && (
            <span
              style={{
                color: a.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 10,
                background: a.iconBg,
                border: `1px solid rgba(${a.raw},0.20)`,
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
          )}
        </div>

        {/* Value — the hero number */}
        <div
          style={{
            fontSize: VALUE_SIZES[size],
            fontWeight: 800,
            color: 'var(--bo-text)',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            fontVariantNumeric: 'tabular-nums',
            marginBottom: (delta !== undefined || sublabel) ? '8px' : 0,
          }}
        >
          {value}
        </div>

        {/* Delta badge */}
        {delta !== undefined && (
          <div className="flex items-center gap-2">
            <span
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
              style={{
                background: deltaBg,
                fontSize: '10px',
                fontWeight: 700,
                color: deltaColor,
              }}
            >
              {isPositive && <TrendingUp size={9} />}
              {isNegative && <TrendingDown size={9} />}
              {isStable   && <Minus size={9} />}
              {isPositive ? '+' : ''}{delta}{typeof delta === 'number' ? '%' : ''}
            </span>
            {deltaLabel && (
              <span style={{ fontSize: '10px', color: 'var(--bo-text-muted)', fontWeight: 500 }}>
                {deltaLabel}
              </span>
            )}
          </div>
        )}

        {/* Sublabel */}
        {delta === undefined && sublabel && (
          <span style={{ fontSize: '10px', color: 'var(--bo-text-muted)', fontWeight: 500 }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}
