'use client'

/**
 * MetricBar — IMI Design System v3
 * DS3 pattern: labeled progress bar with mono labels
 */

import React from 'react'

interface MetricBarProps {
  label: string
  value: number       // 0–100 percentage
  valueLabel?: string // e.g. "42%" or "1.2M"
  color?: string      // CSS color — defaults to gold
  className?: string
}

export function MetricBar({ label, value, valueLabel, color, className = '' }: MetricBarProps) {
  const barColor = color ?? 'var(--accent-400)'
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex justify-between items-center">
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 500,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}>
          {valueLabel ?? `${clamped}%`}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '5px',
          borderRadius: 'var(--r-xs, 4px)',
          background: 'var(--bg-muted)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            background: barColor,
            borderRadius: 'var(--r-xs, 4px)',
            transition: 'width 0.9s var(--ease-out)',
          }}
        />
      </div>
    </div>
  )
}
