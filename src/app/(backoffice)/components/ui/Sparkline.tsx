'use client'

/**
 * Sparkline — IMI Design System v3
 * DS3 pattern: tiny inline SVG chart for table rows and cards.
 * Pure SVG with cubic bezier path — no recharts dependency (lightweight).
 */

import React, { useId } from 'react'

export interface SparklineProps {
  /** Array of numeric values e.g. [120, 135, 128, 145, 160] */
  data: number[]
  /** SVG width in px — default 80 */
  width?: number
  /** SVG height in px — default 32 */
  height?: number
  /**
   * Stroke/fill color as a CSS variable string.
   * Default: 'var(--accent-400)'
   * Overridden by trend auto-color when `color` is not set and `trend` is provided.
   */
  color?: string
  /** Explicit trend override; if omitted, computed from first/last data values */
  trend?: 'up' | 'down' | 'flat'
  /** Fill the area below the line — default true */
  showArea?: boolean
  /** Animate the path drawing left-to-right — default true */
  animated?: boolean
}

/* ── Helpers ─────────────────────────────────────────────── */

function computeTrend(data: number[]): 'up' | 'down' | 'flat' {
  if (data.length < 2) return 'flat'
  const diff = data[data.length - 1] - data[0]
  if (diff > 0) return 'up'
  if (diff < 0) return 'down'
  return 'flat'
}

function trendColor(trend: 'up' | 'down' | 'flat'): string {
  if (trend === 'up') return 'var(--success)'
  if (trend === 'down') return 'var(--error)'
  return 'var(--accent-400)'
}

/** Map data values to SVG pixel coordinates with padding. */
function toPoints(
  data: number[],
  svgWidth: number,
  svgHeight: number,
  padding = 4,
): Array<{ x: number; y: number }> {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const usableW = svgWidth - padding * 2
  const usableH = svgHeight - padding * 2

  return data.map((v, i) => ({
    x: padding + (i / (data.length - 1)) * usableW,
    y: padding + (1 - (v - min) / range) * usableH,
  }))
}

/**
 * Build a smooth cubic-bezier SVG path string through an array of {x,y} points.
 * Uses cardinal spline tension to produce natural curves.
 */
function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  const tension = 0.35
  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]

    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }

  return d
}

/* ── Component ───────────────────────────────────────────── */

export function Sparkline({
  data,
  width = 80,
  height = 32,
  color,
  trend: trendProp,
  showArea = true,
  animated = true,
}: SparklineProps) {
  const uid = useId().replace(/:/g, '')

  if (!data || data.length < 2) {
    return <svg width={width} height={height} aria-hidden="true" />
  }

  const trend = trendProp ?? computeTrend(data)
  const strokeColor = color ?? trendColor(trend)

  const points = toPoints(data, width, height)
  const linePath = buildSmoothPath(points)
  const lastPoint = points[points.length - 1]

  // Area path: line path + vertical down to bottom-right + horizontal to bottom-left + close
  const areaPath = `${linePath} L ${lastPoint.x} ${height} L ${points[0].x} ${height} Z`

  // Approximate total path length for animation (SVG getBoundingClientRect not available SSR, use heuristic)
  const approxLength = width * 1.4

  const animId = `sk-anim-${uid}`
  const gradId = `sk-grad-${uid}`

  return (
    <>
      {animated && (
        <style>{`
          @keyframes ${animId} {
            from { stroke-dashoffset: ${approxLength}; }
            to   { stroke-dashoffset: 0; }
          }
        `}</style>
      )}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        aria-hidden="true"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          {showArea && (
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.18} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          )}
        </defs>

        {/* Area fill */}
        {showArea && (
          <path
            d={areaPath}
            fill={`url(#${gradId})`}
            stroke="none"
          />
        )}

        {/* Line */}
        <path
          d={linePath}
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={
            animated
              ? {
                  strokeDasharray: approxLength,
                  strokeDashoffset: 0,
                  animation: `${animId} 0.8s var(--ease-out, cubic-bezier(0,0,0.2,1)) forwards`,
                }
              : undefined
          }
        />

        {/* Trend dot at last point */}
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={3}
          fill={strokeColor}
        />
      </svg>
    </>
  )
}
