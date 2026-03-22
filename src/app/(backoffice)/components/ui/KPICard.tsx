'use client'

/**
 * KPICard — IMI Design System v3.2
 * Liquid glass style: frosted blur, compact proportions, subtle glow
 */

import React from 'react'

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

const ACCENT_CONFIG: Record<string, { glow: string; iconBg: string; iconColor: string; border: string }> = {
  gold:    { glow: 'rgba(196,157,91,0.08)',  iconBg: 'rgba(196,157,91,0.12)',  iconColor: 'var(--accent-400)',       border: 'rgba(196,157,91,0.25)' },
  navy:    { glow: 'rgba(37,53,101,0.08)',    iconBg: 'rgba(37,53,101,0.15)',   iconColor: 'var(--text-secondary)',   border: 'rgba(37,53,101,0.20)' },
  success: { glow: 'rgba(16,185,129,0.06)',   iconBg: 'var(--success-bg)',       iconColor: 'var(--success)',          border: 'rgba(16,185,129,0.20)' },
  warning: { glow: 'rgba(245,158,11,0.06)',   iconBg: 'var(--warning-bg)',       iconColor: 'var(--warning)',          border: 'rgba(245,158,11,0.20)' },
  error:   { glow: 'rgba(239,68,68,0.06)',    iconBg: 'var(--error-bg)',         iconColor: 'var(--error)',            border: 'rgba(239,68,68,0.20)' },
  info:    { glow: 'rgba(59,130,246,0.06)',   iconBg: 'var(--info-bg)',          iconColor: 'var(--info)',             border: 'rgba(59,130,246,0.20)' },
  blue:    { glow: 'rgba(59,130,246,0.06)',   iconBg: 'var(--info-bg)',          iconColor: 'var(--info)',             border: 'rgba(59,130,246,0.20)' },
  hot:     { glow: 'rgba(239,68,68,0.06)',    iconBg: 'var(--error-bg)',         iconColor: 'var(--error)',            border: 'rgba(239,68,68,0.20)' },
  warm:    { glow: 'rgba(245,158,11,0.06)',   iconBg: 'var(--warning-bg)',       iconColor: 'var(--warning)',          border: 'rgba(245,158,11,0.20)' },
  cold:    { glow: 'rgba(59,130,246,0.06)',   iconBg: 'var(--info-bg)',          iconColor: 'var(--info)',             border: 'rgba(59,130,246,0.20)' },
  ai:      { glow: 'rgba(196,157,91,0.08)',   iconBg: 'rgba(196,157,91,0.12)',  iconColor: 'var(--accent-400)',       border: 'rgba(196,157,91,0.25)' },
  green:   { glow: 'rgba(16,185,129,0.06)',   iconBg: 'var(--success-bg)',       iconColor: 'var(--success)',          border: 'rgba(16,185,129,0.20)' },
}

const VALUE_SIZES: Record<string, string> = { sm: '20px', md: '26px', lg: '34px' }
const ICON_SIZES: Record<string, number> = { sm: 28, md: 30, lg: 34 }
const PAD: Record<string, string> = { sm: '10px 12px', md: '12px 14px', lg: '14px 16px' }

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
  const iconSize = ICON_SIZES[size]

  const isPositive = delta !== undefined && delta > 0
  const isNegative = delta !== undefined && delta < 0

  return (
    <div
      className={`group ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        padding: PAD[size],
        // Liquid glass effect
        background: `linear-gradient(135deg, ${a.glow}, rgba(255,255,255,0.02))`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${a.border}`,
        borderRadius: '12px',
        boxShadow: `0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04)`,
        transition: 'all 200ms ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)`
        e.currentTarget.style.borderColor = a.iconColor
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = `0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04)`
        e.currentTarget.style.borderColor = a.border
      }}
    >
      {/* Label + Icon row — compact */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--color-offwhite-mute, var(--text-tertiary))',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            lineHeight: 1.3,
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
              width: iconSize,
              height: iconSize,
              borderRadius: '8px',
              background: a.iconBg,
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value — compact monumental */}
      <div
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: VALUE_SIZES[size],
          fontWeight: 600,
          color: 'var(--color-offwhite, var(--text-primary))',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>

      {/* Delta */}
      {delta !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '1px 6px',
              borderRadius: 5,
              fontFamily: 'var(--font-data)',
              fontSize: 11,
              fontWeight: 500,
              background: isPositive ? 'var(--success-bg)' : isNegative ? 'var(--error-bg)' : 'var(--bg-muted)',
              color: isPositive ? 'var(--color-success, var(--success))' : isNegative ? 'var(--color-danger, var(--error))' : 'var(--text-tertiary)',
            }}
          >
            {isPositive ? '▲+' : isNegative ? '▼' : ''}{delta}%
          </span>
          {deltaLabel && (
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 400, color: 'var(--text-disabled)' }}>
              {deltaLabel}
            </span>
          )}
        </div>
      )}

      {/* Sublabel */}
      {delta === undefined && sublabel && (
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)', marginTop: 2, display: 'block' }}>
          {sublabel}
        </span>
      )}
    </div>
  )
}
