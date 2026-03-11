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

// ── Accent palette — colors only, no hardcoded backgrounds ──────
const ACCENT: Record<string, {
  color: string
  borderColor: string
  iconBg: string
  deltaUp: string
  raw: string
}> = {
  blue:  { color: 'var(--imi-blue-bright)', borderColor: 'rgba(59,130,246,0.22)',  iconBg: 'rgba(59,130,246,0.12)',  deltaUp: 'var(--s-done)', raw: '59,130,246'  },
  hot:   { color: 'var(--s-hot)',           borderColor: 'rgba(248,113,113,0.20)', iconBg: 'rgba(248,113,113,0.10)', deltaUp: 'var(--s-done)', raw: '248,113,113' },
  warm:  { color: 'var(--s-warm)',          borderColor: 'rgba(251,191,36,0.20)',  iconBg: 'rgba(251,191,36,0.10)', deltaUp: 'var(--s-done)', raw: '251,191,36'  },
  cold:  { color: 'var(--s-cold)',          borderColor: 'rgba(34,211,238,0.20)',  iconBg: 'rgba(34,211,238,0.10)', deltaUp: 'var(--s-done)', raw: '34,211,238'  },
  ai:    { color: 'var(--imi-ai-gold)',     borderColor: 'rgba(234,179,8,0.20)',   iconBg: 'rgba(234,179,8,0.10)',  deltaUp: 'var(--s-done)', raw: '234,179,8'   },
  green: { color: 'var(--s-done)',          borderColor: 'rgba(74,222,128,0.22)',  iconBg: 'rgba(74,222,128,0.10)', deltaUp: 'var(--s-done)', raw: '74,222,128'  },
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
        background: 'var(--bo-elevated)',       // ← theme-aware: white in light, #111822 in dark
        border: `1px solid ${a.borderColor}`,
        boxShadow: 'var(--bo-card-shadow)',      // ← theme-aware shadow
      }}
      onClick={onClick}
    >
      {/* Very subtle accent tint — low opacity works in both themes */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(160deg, rgba(${a.raw},0.06) 0%, transparent 60%)`,
          borderRadius: 'inherit',
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(${a.raw},0.50) 50%, transparent 100%)`,
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
                border: `1px solid rgba(${a.raw},0.18)`,
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
          )}
        </div>

        {/* Value */}
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
