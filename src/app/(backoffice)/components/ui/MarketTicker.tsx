'use client'

/**
 * MarketTicker — IMI Design System v3
 * DS3 pattern: infinite-scroll horizontal market data strip
 * Usage: <MarketTicker items={[...]} speed={30} paused />
 */

import React, { useRef, useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, BarChart2, Percent, CircleDollarSign, Building2 } from 'lucide-react'

export interface TickerItem {
  label: string
  value: string
  change: number
  type?: 'price' | 'yield' | 'volume' | 'index'
}

export interface MarketTickerProps {
  items: TickerItem[]
  speed?: number
  paused?: boolean
}

const TYPE_ICON: Record<NonNullable<TickerItem['type']>, React.ReactNode> = {
  price:  <Building2 size={10} />,
  yield:  <Percent size={10} />,
  volume: <BarChart2 size={10} />,
  index:  <CircleDollarSign size={10} />,
}

function TickerItemChip({ item }: { item: TickerItem }) {
  const isUp = item.change > 0
  const isDown = item.change < 0
  const typeIcon = item.type ? TYPE_ICON[item.type] : null

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {typeIcon && (
        <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
          {typeIcon}
        </span>
      )}

      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}
      >
        {item.label}
      </span>

      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {item.value}
      </span>

      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          padding: '2px 8px',
          borderRadius: 9999,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 600,
          background: isUp
            ? 'rgba(0,178,127,0.12)'
            : isDown
              ? 'rgba(229,62,62,0.12)'
              : 'var(--bg-muted)',
          color: isUp
            ? 'var(--success)'
            : isDown
              ? 'var(--error)'
              : 'var(--text-tertiary)',
        }}
      >
        {isUp && <TrendingUp size={9} />}
        {isDown && <TrendingDown size={9} />}
        {isUp ? '+' : ''}
        {item.change.toFixed(1)}%
      </span>
    </div>
  )
}

const DIVIDER = (
  <span
    style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--text-tertiary)',
      opacity: 0.4,
      flexShrink: 0,
      paddingInline: 4,
      userSelect: 'none',
    }}
    aria-hidden
  >
    ·
  </span>
)

export function MarketTicker({ items, speed = 30, paused = true }: MarketTickerProps) {
  const [hovering, setHovering] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  // Build doubled list for seamless loop
  const doubled = [...items, ...items]
  const isPaused = paused && hovering

  // Inject keyframe once
  useEffect(() => {
    const id = 'imi-ticker-kf'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      @keyframes imi-ticker-scroll {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    `
    document.head.appendChild(style)
    return () => { style.remove() }
  }, [])

  return (
    <div
      role="marquee"
      aria-label="Dados de mercado imobiliário em tempo real"
      style={{
        position: 'relative',
        width: '100%',
        height: 40,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderLeft: '3px solid var(--imi-gold-500)',
        borderRadius: 'var(--r-lg, 4px)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Left fade */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 48,
          background: 'linear-gradient(to right, var(--bg-surface) 60%, transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Right fade */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 48,
          background: 'linear-gradient(to left, var(--bg-surface) 60%, transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Scrolling track */}
      <div
        ref={trackRef}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0,
          animation: `imi-ticker-scroll ${speed}s linear infinite`,
          animationPlayState: isPaused ? 'paused' : 'running',
          willChange: 'transform',
          paddingInline: 16,
        }}
      >
        {doubled.map((item, i) => (
          <React.Fragment key={`ticker-${i}`}>
            <TickerItemChip item={item} />
            {i < doubled.length - 1 && DIVIDER}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
