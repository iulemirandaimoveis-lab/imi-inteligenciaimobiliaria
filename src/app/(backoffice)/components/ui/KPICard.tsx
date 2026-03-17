'use client'

/**
 * KPICard — IMI Design System v3 stat-card
 * DS3 pattern: top accent border, serif value, mono label, hover lift
 */

import React from 'react'
// TrendingUp/TrendingDown removed — using unicode arrows ▲ ▼ instead

interface KPICardProps {
  label: string
  value: string | number
  sublabel?: string
  delta?: number
  deltaLabel?: string
  icon?: React.ReactNode
  accent?: 'gold' | 'navy' | 'success' | 'warning' | 'error' | 'info' | 'blue' | 'hot' | 'warm' | 'cold' | 'ai' | 'green'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

const ACCENT_CONFIG: Record<string, { border: string; iconBg: string; iconColor: string }> = {
  gold:    { border: 'var(--imi-gold-500)',  iconBg: 'rgba(184,148,58,0.10)',  iconColor: 'var(--imi-gold-500)' },
  navy:    { border: 'var(--imi-navy-700)',  iconBg: 'rgba(37,53,101,0.12)',   iconColor: 'var(--imi-navy-400)' },
  success: { border: 'var(--success)',       iconBg: 'var(--success-bg)',       iconColor: 'var(--success)' },
  warning: { border: 'var(--warning)',       iconBg: 'var(--warning-bg)',       iconColor: 'var(--warning)' },
  error:   { border: 'var(--error)',         iconBg: 'var(--error-bg)',         iconColor: 'var(--error)' },
  info:    { border: 'var(--info)',          iconBg: 'var(--info-bg)',          iconColor: 'var(--info)' },
  // Legacy aliases
  blue:    { border: 'var(--info)',          iconBg: 'var(--info-bg)',          iconColor: 'var(--info)' },
  hot:     { border: 'var(--error)',         iconBg: 'var(--error-bg)',         iconColor: 'var(--error)' },
  warm:    { border: 'var(--warning)',       iconBg: 'var(--warning-bg)',       iconColor: 'var(--warning)' },
  cold:    { border: 'var(--info)',          iconBg: 'var(--info-bg)',          iconColor: 'var(--info)' },
  ai:      { border: 'var(--imi-gold-500)',  iconBg: 'rgba(184,148,58,0.10)',  iconColor: 'var(--imi-gold-500)' },
  green:   { border: 'var(--success)',       iconBg: 'var(--success-bg)',       iconColor: 'var(--success)' },
}

const VALUE_SIZES: Record<string, string> = { sm: '24px', md: '36px', lg: '48px' }
const PAD: Record<string, string> = { sm: '14px 16px', md: 'var(--space-6, 24px)', lg: 'var(--space-6, 24px)' }

export function KPICard({
  label,
  value,
  sublabel,
  delta,
  deltaLabel,
  icon,
  accent = 'gold',
  size = 'md',
  className = '',
  onClick,
}: KPICardProps) {
  const a = ACCENT_CONFIG[accent] ?? ACCENT_CONFIG.gold

  const isPositive = delta !== undefined && delta > 0
  const isNegative = delta !== undefined && delta < 0

  return (
    <div
      className={`group ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        padding: PAD[size],
        background: 'var(--surface-raised, var(--bg-surface))',
        border: '1px solid var(--surface-border, var(--border-subtle))',
        borderTop: `3px solid ${a.border}`,
        borderRadius: '4px',
        boxShadow: 'var(--shadow-card, var(--shadow-xs))',
        transition: 'background 200ms ease, box-shadow 200ms ease, transform 200ms ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-raised, var(--shadow-md))'
        e.currentTarget.style.background = 'var(--surface-overlay, var(--bg-elevated))'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card, var(--shadow-xs))'
        e.currentTarget.style.background = 'var(--surface-raised, var(--bg-surface))'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Label + Icon */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--color-offwhite-mute, var(--text-tertiary))',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.08em',
            lineHeight: 1.4,
          }}
        >
          {label}
        </span>

        {icon && (
          <span
            style={{
              color: a.iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 'var(--r-lg, 4px)',
              background: a.iconBg,
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value — DM Mono, monumental */}
      <div
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: VALUE_SIZES[size],
          fontWeight: 500,
          color: 'var(--color-offwhite, var(--text-primary))',
          lineHeight: 1,
          letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums',
          marginBottom: (delta !== undefined || sublabel) ? 'var(--space-2, 8px)' : 0,
        }}
      >
        {value}
      </div>

      {/* Delta */}
      {delta !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'var(--space-2, 8px)' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 9999,
              fontFamily: 'var(--font-data)',
              fontSize: 13,
              fontWeight: 300,
              background: isPositive ? 'var(--success-bg)' : isNegative ? 'var(--error-bg)' : 'var(--bg-muted)',
              color: isPositive ? 'var(--color-success, var(--success))' : isNegative ? 'var(--color-danger, var(--error))' : 'var(--text-tertiary)',
            }}
          >
            {isPositive ? '▲ +' : isNegative ? '▼ ' : ''}{delta}%
          </span>
          {deltaLabel && (
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 13, fontWeight: 300, color: 'var(--text-disabled)' }}>
              {deltaLabel}
            </span>
          )}
        </div>
      )}

      {/* Sublabel */}
      {delta === undefined && sublabel && (
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 13, fontWeight: 300, color: 'var(--text-tertiary)' }}>
          {sublabel}
        </span>
      )}
    </div>
  )
}
