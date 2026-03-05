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
  const accentColor = ACCENT_COLORS[accent] ?? ACCENT_COLORS.blue

  const isPositive = delta !== undefined && delta > 0
  const isNegative = delta !== undefined && delta < 0
  const isStable   = delta !== undefined && delta === 0

  const deltaColor = isPositive ? 'var(--s-done)' : isNegative ? 'var(--s-hot)' : 'var(--bo-text-muted)'

  const valueSizes: Record<string, string> = {
    sm: '18px',
    md: '22px',
    lg: '28px',
  }

  return (
    <div
      className={`intel-card ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''} ${className}`}
      style={{ padding: size === 'lg' ? '16px' : size === 'sm' ? '10px 12px' : '14px' }}
      onClick={onClick}
    >
      {/* Icon + Label row */}
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <span style={{ color: accentColor, opacity: 0.85, display: 'flex', alignItems: 'center' }}>
            {icon}
          </span>
        )}
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            color: 'var(--bo-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}
        >
          {label}
        </span>
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: valueSizes[size],
          fontWeight: 700,
          color: 'var(--bo-text)',
          lineHeight: 1.1,
          marginBottom: delta !== undefined || sublabel ? '6px' : 0,
        }}
      >
        {value}
      </div>

      {/* Delta or sublabel */}
      {delta !== undefined && (
        <div className="flex items-center gap-1" style={{ fontSize: '10px', fontWeight: 500, color: deltaColor }}>
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
