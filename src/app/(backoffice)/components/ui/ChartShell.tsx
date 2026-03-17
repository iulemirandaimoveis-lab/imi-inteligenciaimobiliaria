'use client'

/**
 * ChartShell — IMI Design System v3
 * DS3 pattern: reusable chart container wrapping recharts with consistent styling.
 * Provides header (label / title / value / delta), chart area, legend, and loading shimmer.
 */

import React, { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface ChartLegendItem {
  label: string
  color: string // CSS variable e.g. 'var(--imi-gold-500)'
  value?: string | number
}

export interface ChartShellProps {
  title?: string
  subtitle?: string
  /** Mono uppercase label rendered above title */
  label?: string
  /** Primary metric value displayed in large serif */
  value?: string | number
  delta?: { value: string; up: boolean }
  legend?: ChartLegendItem[]
  /** Chart area height in px — default 200 */
  height?: number
  /** Optional node rendered in the header right slot */
  action?: ReactNode
  loading?: boolean
  /** The recharts component goes here */
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

/* ── Shimmer keyframes injected once ──────────────────────── */
const SHIMMER_STYLE = `
@keyframes cs-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`

function ShimmerBlock({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      style={{
        background: 'linear-gradient(90deg, var(--bg-muted) 25%, var(--bg-hover) 50%, var(--bg-muted) 75%)',
        backgroundSize: '200% 100%',
        animation: 'cs-shimmer 1.6s ease-in-out infinite',
        borderRadius: 'var(--r-md, 4px)',
        ...style,
      }}
    />
  )
}

function LoadingContent({ height }: { height: number }) {
  return (
    <div style={{ padding: '20px 20px 20px' }} aria-hidden="true">
      {/* Label placeholder */}
      <ShimmerBlock style={{ height: 10, width: 80, marginBottom: 10, borderRadius: 'var(--r-xs, 4px)' }} />
      {/* Title placeholder */}
      <ShimmerBlock style={{ height: 18, width: 160, marginBottom: 8, borderRadius: 'var(--r-sm, 4px)' }} />
      {/* Value placeholder */}
      <ShimmerBlock style={{ height: 32, width: 110, marginBottom: 20, borderRadius: 'var(--r-sm, 4px)' }} />
      {/* Chart area placeholder */}
      <ShimmerBlock style={{ height, borderRadius: 'var(--r-lg, 4px)' }} />
    </div>
  )
}

/* ── Exported tooltip style constant ─────────────────────── */
/** Pass into recharts <Tooltip contentStyle={chartTooltipStyle}> */
export const chartTooltipStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--r-lg, 4px)',
  boxShadow: 'var(--shadow-md)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--text-primary)',
  padding: '8px 12px',
}

/** Cursor line style for recharts <Tooltip cursor={...}> */
export const chartCursorStyle = { stroke: 'var(--border-subtle)', strokeWidth: 1 }

/** Common axis tick style — spread into <XAxis tick={...}> / <YAxis tick={...}> */
export const chartAxisTickStyle: React.SVGProps<SVGTextElement> = {
  fill: 'var(--text-tertiary)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
}

/* ── Main component ───────────────────────────────────────── */
export function ChartShell({
  title,
  subtitle,
  label,
  value,
  delta,
  legend,
  height = 200,
  action,
  loading = false,
  children,
  className = '',
  style,
}: ChartShellProps) {
  return (
    <>
      <style>{SHIMMER_STYLE}</style>
      <div
        className={className}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--r-xl, 4px)',
          boxShadow: 'var(--shadow-xs)',
          overflow: 'hidden',
          ...style,
        }}
      >
        {loading ? (
          <LoadingContent height={height} />
        ) : (
          <>
            {/* ── Header ─────────────────────────────── */}
            {(label || title || subtitle || value !== undefined || delta || action) && (
              <div
                style={{
                  padding: '20px 20px 0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Mono label */}
                  {label && (
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        fontWeight: 500,
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        lineHeight: 1.4,
                        marginBottom: title ? 6 : 0,
                      }}
                    >
                      {label}
                    </div>
                  )}

                  {/* Title */}
                  {title && (
                    <div
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        lineHeight: 1.2,
                        letterSpacing: '-0.01em',
                        marginBottom: subtitle ? 4 : 0,
                      }}
                    >
                      {title}
                    </div>
                  )}

                  {/* Subtitle */}
                  {subtitle && (
                    <div
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 12,
                        color: 'var(--text-tertiary)',
                        lineHeight: 1.4,
                        marginBottom: value !== undefined ? 10 : 0,
                      }}
                    >
                      {subtitle}
                    </div>
                  )}

                  {/* Primary metric value */}
                  {value !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: 28,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          lineHeight: 1,
                          letterSpacing: '-0.03em',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {value}
                      </span>

                      {/* Delta indicator */}
                      {delta && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '2px 8px',
                            borderRadius: 'var(--r-full, 9999px)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: 500,
                            background: delta.up ? 'var(--success-bg)' : 'var(--error-bg)',
                            color: delta.up ? 'var(--success)' : 'var(--error)',
                          }}
                        >
                          {delta.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {delta.value}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action slot */}
                {action && (
                  <div style={{ flexShrink: 0 }}>{action}</div>
                )}
              </div>
            )}

            {/* ── Chart area ─────────────────────────── */}
            <div
              style={{
                paddingInline: 4,
                height,
              }}
            >
              {children}
            </div>

            {/* ── Legend ─────────────────────────────── */}
            {legend && legend.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px 16px',
                  padding: '12px 20px 16px',
                  borderTop: '1px solid var(--border-subtle)',
                  marginTop: 12,
                }}
              >
                {legend.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {/* Color dot */}
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {item.label}
                    </span>
                    {item.value !== undefined && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {item.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
