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

const ACCENT_COLORS: Record<string, string> = {
  blue:  'var(--imi-blue-bright)',
  hot:   'var(--s-hot)',
  warm:  'var(--s-warm)',
  cold:  'var(--s-cold)',
  ai:    'var(--imi-ai-gold)',
  green: 'var(--s-done)',
}

const ACCENT_TOP_BORDER: Record<string, string> = {
  blue:  'rgba(59,130,246,0.45)',
  hot:   'rgba(248,113,113,0.45)',
  warm:  'rgba(251,191,36,0.45)',
  cold:  'rgba(34,211,238,0.45)',
  ai:    'rgba(234,179,8,0.45)',
  green: 'rgba(74,222,128,0.45)',
}

const ACCENT_BG_RAW: Record<string, string> = {
  blue:  '59,130,246',
  hot:   '248,113,113',
  warm:  '251,191,36',
  cold:  '34,211,238',
  ai:    '234,179,8',
  green: '74,222,128',
}

const ACCENT_ICON_BG: Record<string, string> = {
  blue:  'rgba(59,130,246,0.14)',
  hot:   'rgba(248,113,113,0.12)',
  warm:  'rgba(251,191,36,0.12)',
  cold:  'rgba(34,211,238,0.12)',
  ai:    'rgba(234,179,8,0.12)',
  green: 'rgba(74,222,128,0.12)',
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
  const accentColor  = ACCENT_COLORS[accent]     ?? ACCENT_COLORS.blue
  const topBorder    = ACCENT_TOP_BORDER[accent]  ?? ACCENT_TOP_BORDER.blue
  const iconBg       = ACCENT_ICON_BG[accent]     ?? ACCENT_ICON_BG.blue
  const rawRgb       = ACCENT_BG_RAW[accent]      ?? ACCENT_BG_RAW.blue

  const isPositive = delta !== undefined && delta > 0
  const isNegative = delta !== undefined && delta < 0
  const isStable   = delta !== undefined && delta === 0

  const deltaColor = isPositive ? 'var(--s-done)' : isNegative ? 'var(--s-hot)' : 'var(--bo-text-muted)'

  const valueSizes: Record<string, string> = {
    sm: '18px',
    md: '22px',
    lg: '28px',
  }

  const pad = size === 'lg' ? '16px' : size === 'sm' ? '10px 12px' : '14px'

  return (
    <div
      className={`intel-card ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''} ${className}`}
      style={{
        padding: pad,
        background: `linear-gradient(180deg, rgba(${rawRgb},0.08) 0%, transparent 55%), rgba(20,28,43,0.88)`,
        borderTop: `1.5px solid ${topBorder}`,
      }}
      onClick={onClick}
    >
      {/* Icon + Label row */}
      <div className="flex items-center gap-2 mb-2.5">
        {icon && (
          <span style={{
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: 8,
            background: iconBg,
            flexShrink: 0,
          }}>
            {icon}
          </span>
        )}
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            color: 'var(--bo-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {label}
        </span>
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: valueSizes[size],
          fontWeight: 800,
          color: 'var(--bo-text)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          marginBottom: delta !== undefined || sublabel ? '6px' : 0,
        }}
      >
        {value}
      </div>

      {/* Delta or sublabel */}
      {delta !== undefined && (
        <div className="flex items-center gap-1" style={{ fontSize: '10px', fontWeight: 600, color: deltaColor }}>
          {isPositive && <TrendingUp size={11} />}
          {isNegative && <TrendingDown size={11} />}
          {isStable   && <Minus size={11} />}
          <span>
            {isPositive ? '+' : ''}{delta}{typeof delta === 'number' ? '%' : ''}
            {deltaLabel && ` ${deltaLabel}`}
          </span>
        </div>
      )}

      {!delta && sublabel && (
        <span style={{ fontSize: '10px', color: 'var(--bo-text-muted)', fontWeight: 500 }}>
          {sublabel}
        </span>
      )}
    </div>
  )
}
