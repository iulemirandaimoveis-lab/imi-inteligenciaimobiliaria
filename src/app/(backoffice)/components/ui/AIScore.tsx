'use client'

/**
 * AIScore — IMI Design System v3
 * DS3 pattern: pill badge with semantic color tiers, mono font, optional progress bar
 */

import React from 'react'

interface AIScoreProps {
  score: number          // 0–100
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showBar?: boolean
  className?: string
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--success)'
  if (score >= 60) return 'var(--warning)'
  if (score >= 40) return 'var(--info)'
  return 'var(--error)'
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'var(--success-bg)'
  if (score >= 60) return 'var(--warning-bg)'
  if (score >= 40) return 'var(--info-bg)'
  return 'var(--error-bg)'
}

const SIZE_CONFIG = {
  xs: { fontSize: '11px', padding: '2px 5px', iconSize: 10 },
  sm: { fontSize: '11px', padding: '3px 7px', iconSize: 11 },
  md: { fontSize: '13px', padding: '4px 9px', iconSize: 13 },
  lg: { fontSize: '16px', padding: '6px 12px', iconSize: 16 },
}

export function AIScore({
  score,
  size = 'sm',
  showLabel = false,
  showBar = false,
  className = '',
}: AIScoreProps) {
  const color  = getScoreColor(score)
  const bg     = getScoreBg(score)
  const sz     = SIZE_CONFIG[size]
  const clamped = Math.max(0, Math.min(100, score))

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          borderRadius: 'var(--r-chip, 6px)',
          color,
          background: bg,
          border: `1px solid ${color}22`,
          fontSize: sz.fontSize,
          padding: sz.padding,
          gap: '4px',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: sz.iconSize }}>⚡</span>
        <span>{clamped}</span>
        {showLabel && <span style={{ opacity: 0.7, fontSize: `calc(${sz.fontSize} - 1px)` }}> AI</span>}
      </span>

      {showBar && (
        <div
          style={{
            width: '100%',
            height: '3px',
            borderRadius: 'var(--r-xs, 4px)',
            background: 'var(--bg-muted)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${clamped}%`,
              height: '100%',
              background: color,
              borderRadius: 'var(--r-xs, 4px)',
              transition: 'width 0.8s var(--ease-out)',
            }}
          />
        </div>
      )}
    </div>
  )
}
