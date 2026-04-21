'use client'

import React from 'react'
import { getStatusConfig, type StatusKey } from '@/app/(backoffice)/lib/constants'

type StatusType = 'hot' | 'warm' | 'cold' | 'done' | 'pend' | 'cancel' | 'active' | 'draft' | 'live' | 'ai'

interface StatusBadgeProps {
  /** Legacy status type (hot/warm/cold/done/pend/cancel/active/draft/live/ai) */
  status?: StatusType | string
  /** New: use a key from centralized STATUS_CONFIG (publicado/rascunho/vendido/etc.) */
  statusKey?: StatusKey | string
  label?: string
  size?: 'xs' | 'sm' | 'md'
  glow?: boolean
  dot?: boolean
  pulse?: boolean
  className?: string
}

const LOCAL_STATUS_CONFIG: Record<string, {
  label: string
  color: string
  bg: string
  dotColor: string
  glowClass?: string
}> = {
  hot: {
    label: 'HOT',
    color: 'var(--error)',
    bg: 'var(--error-bg)',
    dotColor: 'var(--error)',
    glowClass: 'glow-hot',
  },
  warm: {
    label: 'WARM',
    color: 'var(--warning)',
    bg: 'var(--warning-bg)',
    dotColor: 'var(--warning)',
    glowClass: 'glow-warm',
  },
  cold: {
    label: 'COLD',
    color: 'var(--info)',
    bg: 'var(--info-bg)',
    dotColor: 'var(--info)',
    glowClass: 'glow-cold',
  },
  done: {
    label: 'FECHADO',
    color: 'var(--success)',
    bg: 'var(--success-bg)',
    dotColor: 'var(--success)',
    glowClass: 'glow-ai',
  },
  active: {
    label: 'ATIVO',
    color: 'var(--success)',
    bg: 'var(--success-bg)',
    dotColor: 'var(--success)',
    glowClass: 'glow-ai',
  },
  pend: {
    label: 'PENDENTE',
    color: 'var(--warning)',
    bg: 'var(--warning-bg)',
    dotColor: 'var(--warning)',
  },
  cancel: {
    label: 'CANCELADO',
    color: 'var(--error)',
    bg: 'var(--error-bg)',
    dotColor: 'var(--error)',
  },
  draft: {
    label: 'RASCUNHO',
    color: 'var(--text-disabled)',
    bg: 'var(--bg-muted)',
    dotColor: 'var(--text-disabled)',
  },
  live: {
    label: 'AO VIVO',
    color: 'var(--success)',
    bg: 'var(--success-bg)',
    dotColor: 'var(--success)',
    glowClass: 'glow-ai',
  },
  ai: {
    label: 'IA',
    color: 'var(--accent-400)',
    bg: 'rgba(200,164,74,.10)',
    dotColor: 'var(--accent-400)',
  },
}

const SIZE_STYLES = {
  xs: { fontSize: '11px', padding: '2px 6px', gap: '4px', dotSize: '5px' },
  sm: { fontSize: '11px', padding: '4px 8px', gap: '4px', dotSize: '5px' },
  md: { fontSize: '11px', padding: '4px 10px', gap: '6px', dotSize: '6px' },
}

export function StatusBadge({
  status,
  statusKey,
  label,
  size = 'sm',
  glow = false,
  dot = false,
  pulse = false,
  className = '',
}: StatusBadgeProps) {
  // Resolve config: prefer statusKey (centralized) over status (legacy local)
  const cfg: { label: string; color: string; bg: string; dotColor: string; glowClass?: string } = (() => {
    if (statusKey) {
      const central = getStatusConfig(statusKey)
      return { label: central.label, color: central.color, bg: central.bg, dotColor: central.dot }
    }
    const key = (status || 'draft').toLowerCase()
    return LOCAL_STATUS_CONFIG[key] ?? {
      label: key.toUpperCase(),
      color: 'var(--text-disabled)',
      bg: 'var(--bg-muted)',
      dotColor: 'var(--text-disabled)',
    }
  })()

  const sz = SIZE_STYLES[size]
  const displayLabel = label ?? cfg.label

  return (
    <span
      className={`
        inline-flex items-center rounded uppercase tracking-wider
        ${glow && cfg.glowClass ? cfg.glowClass : ''}
        ${className}
      `}
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}22`,
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        fontSize: sz.fontSize,
        padding: sz.padding,
        gap: sz.gap,
        letterSpacing: '0.06em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        borderRadius: 'var(--r-chip, 6px)',
      }}
    >
      {dot && (
        <span
          style={{
            width: sz.dotSize,
            height: sz.dotSize,
            borderRadius: '50%',
            background: cfg.dotColor,
            display: 'inline-block',
            flexShrink: 0,
            animation: pulse ? 'live-dot 1.6s ease-in-out infinite' : undefined,
          }}
        />
      )}
      {displayLabel}
    </span>
  )
}
