'use client'

import React from 'react'

type StatusType = 'hot' | 'warm' | 'cold' | 'done' | 'pend' | 'cancel' | 'active' | 'draft' | 'live' | 'ai'

interface StatusBadgeProps {
  status: StatusType | string
  label?: string
  size?: 'xs' | 'sm' | 'md'
  glow?: boolean
  dot?: boolean
  pulse?: boolean
  className?: string
}

const STATUS_CONFIG: Record<string, {
  label: string
  color: string
  bg: string
  dotColor: string
  glowClass?: string
}> = {
  hot: {
    label: 'HOT',
    color: 'var(--s-hot)',
    bg: 'var(--s-hot-bg)',
    dotColor: 'var(--s-hot)',
    glowClass: 'glow-hot',
  },
  warm: {
    label: 'WARM',
    color: 'var(--s-warm)',
    bg: 'var(--s-warm-bg)',
    dotColor: 'var(--s-warm)',
    glowClass: 'glow-warm',
  },
  cold: {
    label: 'COLD',
    color: 'var(--s-cold)',
    bg: 'var(--s-cold-bg)',
    dotColor: 'var(--s-cold)',
    glowClass: 'glow-cold',
  },
  done: {
    label: 'FECHADO',
    color: 'var(--s-done)',
    bg: 'var(--s-done-bg)',
    dotColor: 'var(--s-done)',
    glowClass: 'glow-ai',
  },
  active: {
    label: 'ATIVO',
    color: 'var(--s-done)',
    bg: 'var(--s-done-bg)',
    dotColor: 'var(--s-done)',
    glowClass: 'glow-ai',
  },
  pend: {
    label: 'PENDENTE',
    color: 'var(--s-pend)',
    bg: 'var(--s-pend-bg)',
    dotColor: 'var(--s-pend)',
  },
  cancel: {
    label: 'CANCELADO',
    color: 'var(--s-cancel)',
    bg: 'var(--s-cancel-bg)',
    dotColor: 'var(--s-cancel)',
  },
  draft: {
    label: 'RASCUNHO',
    color: 'var(--bo-text-muted)',
    bg: 'rgba(255,255,255,0.06)',
    dotColor: 'var(--bo-text-muted)',
  },
  live: {
    label: 'AO VIVO',
    color: 'var(--imi-ai-green)',
    bg: 'var(--imi-ai-green-bg)',
    dotColor: 'var(--imi-ai-green)',
    glowClass: 'glow-ai',
  },
  ai: {
    label: 'IA',
    color: 'var(--imi-ai-gold)',
    bg: 'var(--imi-ai-bg)',
    dotColor: 'var(--imi-ai-gold)',
  },
}

const SIZE_STYLES = {
  xs: { fontSize: '9px', padding: '2px 6px', gap: '4px', dotSize: '5px' },
  sm: { fontSize: '10px', padding: '3px 8px', gap: '5px', dotSize: '5px' },
  md: { fontSize: '11px', padding: '4px 10px', gap: '6px', dotSize: '6px' },
}

export function StatusBadge({
  status,
  label,
  size = 'sm',
  glow = false,
  dot = false,
  pulse = false,
  className = '',
}: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status.toLowerCase()] ?? {
    label: status.toUpperCase(),
    color: 'var(--bo-text-muted)',
    bg: 'rgba(255,255,255,0.06)',
    dotColor: 'var(--bo-text-muted)',
  }

  const sz = SIZE_STYLES[size]
  const displayLabel = label ?? cfg.label

  return (
    <span
      className={`
        inline-flex items-center font-black rounded uppercase tracking-wider
        ${glow && cfg.glowClass ? cfg.glowClass : ''}
        ${className}
      `}
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}22`,
        fontSize: sz.fontSize,
        padding: sz.padding,
        gap: sz.gap,
        letterSpacing: '0.06em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
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
