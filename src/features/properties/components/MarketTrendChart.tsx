'use client'

import { useMemo } from 'react'

interface TrendPoint {
  label: string
  value: number
}

interface MarketTrendChartProps {
  data: TrendPoint[]
  color?: string
  height?: number
  showLabels?: boolean
  showTooltip?: boolean
  className?: string
}

export function MarketTrendChart({
  data,
  color = '#C8A44A',
  height = 60,
  showLabels = false,
  className = '',
}: MarketTrendChartProps) {
  const { path, fill, min, max } = useMemo(() => {
    if (!data.length) return { path: '', fill: '', min: 0, max: 0 }
    const values = data.map(d => d.value)
    const minV = Math.min(...values)
    const maxV = Math.max(...values)
    const range = maxV - minV || 1
    const w = 100 / (data.length - 1)
    const pts = data.map((d, i) => {
      const x = i * w
      const y = ((maxV - d.value) / range) * (height - 8) + 4
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    const p = 'M ' + pts.join(' L ')
    const last = pts[pts.length - 1]
    const f = p + ` L ${last.split(',')[0]},${height} L 0,${height} Z`
    return { path: p, fill: f, min: minV, max: maxV }
  }, [data, height])

  if (!data.length) return null

  const trend = data.length > 1 ? data[data.length - 1].value - data[0].value : 0
  const trendUp = trend >= 0

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height, display: 'block' }}
      >
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* Fill area */}
        <path d={fill} fill={`url(#grad-${color.replace('#', '')})`} />
        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End dot */}
        {data.length > 0 && (() => {
          const last = data[data.length - 1]
          const values = data.map(d => d.value)
          const minV = Math.min(...values)
          const maxV = Math.max(...values)
          const range = maxV - minV || 1
          const x = 100
          const y = ((maxV - last.value) / range) * (height - 8) + 4
          return (
            <circle cx={x} cy={y} r={2.5} fill={color} />
          )
        })()}
      </svg>

      {showLabels && data.length > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 4,
        }}>
          <span style={{
            fontSize: '9px', color: 'var(--bo-text-dim, #5C6B7D)',
            fontFamily: 'var(--font-outfit, sans-serif)',
          }}>
            {data[0].label}
          </span>
          <span style={{
            fontSize: '9px', color: 'var(--bo-text-dim, #5C6B7D)',
            fontFamily: 'var(--font-outfit, sans-serif)',
          }}>
            {data[data.length - 1].label}
          </span>
        </div>
      )}
    </div>
  )
}

/** Mini sparkline — inline, no fills */
export function Sparkline({ data, color = '#C8A44A', width = 60, height = 20 }: {
  data: number[]
  color?: string
  width?: number
  height?: number
}) {
  const path = useMemo(() => {
    if (data.length < 2) return ''
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const wStep = width / (data.length - 1)
    const pts = data.map((v, i) => {
      const x = i * wStep
      const y = ((max - v) / range) * (height - 4) + 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    return 'M ' + pts.join(' L ')
  }, [data, width, height])

  if (!path) return null
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Neighborhood bar chart */
export function NeighborhoodBars({ data, metric }: {
  data: { name: string; value: number; trend?: number }[]
  metric: string
}) {
  const max = Math.max(...data.map(d => d.value))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((d, i) => (
        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 90, fontSize: '10px',
            color: 'var(--bo-text-muted, #9FAAB8)',
            fontFamily: 'var(--font-outfit, sans-serif)',
            textAlign: 'right', flexShrink: 0,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {d.name}
          </span>
          <div style={{
            flex: 1, height: 6, borderRadius: 999,
            background: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(d.value / max) * 100}%`,
              background: i === 0
                ? 'linear-gradient(90deg, #A8842A, #C8A44A)'
                : 'linear-gradient(90deg, rgba(200,164,74,0.3), rgba(200,164,74,0.6))',
              borderRadius: 999,
              transition: `width ${600 + i * 80}ms cubic-bezier(0.16, 1, 0.3, 1)`,
            }} />
          </div>
          <span style={{
            width: 68, fontSize: '10px',
            fontFamily: 'var(--font-dm-mono, monospace)',
            color: 'var(--bo-text, #EBE7E0)',
            flexShrink: 0,
          }}>
            {metric === 'price' ? `R$${(d.value / 1000).toFixed(1)}k` : `${d.value}%`}
          </span>
          {d.trend != null && (
            <span style={{
              fontSize: '9px',
              fontFamily: 'var(--font-dm-mono, monospace)',
              color: d.trend >= 0 ? '#5DB887' : '#E06B6B',
              width: 36, flexShrink: 0,
            }}>
              {d.trend >= 0 ? '+' : ''}{d.trend}%
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
