'use client'

import React from 'react'

interface MetricBarProps {
  label: string
  value: number       // 0–100 percentage
  valueLabel?: string // e.g. "42%" or "1.2M"
  color?: string      // CSS color — defaults to imi-blue-bright
  className?: string
}

export function MetricBar({ label, value, valueLabel, color, className = '' }: MetricBarProps) {
  const barColor = color ?? 'var(--imi-blue-bright)'
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex justify-between items-center">
        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--bo-text-muted)' }}>
          {label}
        </span>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--bo-text)' }}>
          {valueLabel ?? `${clamped}%`}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '5px',
          borderRadius: '3px',
          background: 'rgba(255,255,255,0.07)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            background: barColor,
            borderRadius: '3px',
            transition: 'width 0.9s var(--ease-out)',
          }}
        />
      </div>
    </div>
  )
}
