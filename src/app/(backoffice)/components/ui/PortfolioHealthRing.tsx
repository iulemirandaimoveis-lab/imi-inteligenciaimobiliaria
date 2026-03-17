'use client'

/**
 * PortfolioHealthRing — IMI Design System v3
 * DS3 pattern: SVG donut health gauge with framer-motion entrance animation
 */

import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'

export interface HealthMetric {
  label: string
  value: number
  color?: string
  icon?: ReactNode
}

export type HealthGrade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D'

export interface PortfolioHealthRingProps {
  score: number
  metrics?: HealthMetric[]
  size?: number
  label?: string
  animated?: boolean
  grade?: HealthGrade
}

const METRIC_COLORS = [
  'var(--imi-gold-500)',
  'var(--success)',
  'var(--info)',
  'var(--warning)',
  'var(--imi-navy-300)',
  'var(--error)',
]

function scoreColor(s: number): string {
  if (s >= 86) return 'var(--success)'
  if (s >= 71) return 'var(--info)'
  if (s >= 51) return 'var(--warning)'
  return 'var(--error)'
}

function gradeColor(g: HealthGrade): string {
  if (g === 'A+' || g === 'A') return 'var(--imi-gold-500)'
  if (g === 'B+' || g === 'B') return 'var(--info)'
  if (g === 'C') return 'var(--warning)'
  return 'var(--error)'
}

function gradeBg(g: HealthGrade): string {
  if (g === 'A+' || g === 'A') return 'rgba(184,148,58,0.12)'
  if (g === 'B+' || g === 'B') return 'var(--info-bg)'
  if (g === 'C') return 'var(--warning-bg)'
  return 'var(--error-bg)'
}

interface RingArcProps {
  cx: number
  cy: number
  r: number
  strokeWidth: number
  score: number          // 0-100
  color: string
  animated: boolean
  delay?: number
}

function RingArc({ cx, cy, r, strokeWidth, score, color, animated, delay = 0 }: RingArcProps) {
  const circumference = 2 * Math.PI * r
  const fraction = Math.max(0, Math.min(100, score)) / 100
  const dashOffset = circumference * (1 - fraction)

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray={circumference}
      strokeDashoffset={animated ? circumference : dashOffset}
      transform={`rotate(-90 ${cx} ${cy})`}
      animate={animated ? { strokeDashoffset: dashOffset } : undefined}
      transition={
        animated
          ? { duration: 1.2, delay, ease: [0.25, 0.46, 0.45, 0.94] }
          : undefined
      }
    />
  )
}

interface SmallRingProps {
  value: number
  color: string
  size?: number
  animated: boolean
  delay?: number
}

function SmallRing({ value, color, size = 40, animated, delay = 0 }: SmallRingProps) {
  const strokeWidth = 4
  const r = (size - strokeWidth * 2) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const fraction = Math.max(0, Math.min(100, value)) / 100
  const dashOffset = circumference * (1 - fraction)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--bg-muted)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={animated ? circumference : dashOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
        animate={animated ? { strokeDashoffset: dashOffset } : undefined}
        transition={
          animated
            ? { duration: 0.9, delay, ease: [0.25, 0.46, 0.45, 0.94] }
            : undefined
        }
      />
    </svg>
  )
}

export function PortfolioHealthRing({
  score,
  metrics = [],
  size = 160,
  label,
  animated = true,
  grade,
}: PortfolioHealthRingProps) {
  const clampedScore = Math.max(0, Math.min(100, score))
  const strokeWidth = 10
  const r = (size - strokeWidth * 2) / 2
  const cx = size / 2
  const cy = size / 2
  const color = scoreColor(clampedScore)

  const scoreFontSize = Math.round(size * 0.2)
  const labelFontSize = 9

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {/* Main ring */}
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ display: 'block' }}
          aria-label={`Saúde do portfólio: ${clampedScore} pontos`}
          role="img"
        >
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--bg-muted)"
            strokeWidth={strokeWidth}
          />

          {/* Score arc */}
          <RingArc
            cx={cx}
            cy={cy}
            r={r}
            strokeWidth={strokeWidth}
            score={clampedScore}
            color={color}
            animated={animated}
          />
        </svg>

        {/* Center content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <motion.span
            initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: animated ? 0.5 : 0 }}
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: scoreFontSize,
              fontWeight: 700,
              color,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {clampedScore}
          </motion.span>

          {grade && (
            <motion.span
              initial={animated ? { opacity: 0 } : undefined}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: animated ? 0.7 : 0 }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                color: gradeColor(grade),
                background: gradeBg(grade),
                padding: '2px 8px',
                borderRadius: 9999,
                letterSpacing: '0.06em',
              }}
            >
              {grade}
            </motion.span>
          )}

          {label && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: labelFontSize,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textAlign: 'center',
                maxWidth: size * 0.55,
                lineHeight: 1.3,
              }}
            >
              {label}
            </span>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      {metrics.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(3, metrics.length)}, 1fr)`,
            gap: '12px 16px',
            width: '100%',
          }}
        >
          {metrics.slice(0, 6).map((metric, i) => {
            const metricColor = metric.color ?? METRIC_COLORS[i % METRIC_COLORS.length]
            return (
              <motion.div
                key={i}
                initial={animated ? { opacity: 0, y: 8 } : undefined}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: animated ? 0.15 * i + 0.6 : 0 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <div style={{ position: 'relative' }}>
                  <SmallRing
                    value={metric.value}
                    color={metricColor}
                    size={40}
                    animated={animated}
                    delay={0.15 * i + 0.5}
                  />
                  {metric.icon && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: metricColor,
                      }}
                    >
                      {metric.icon}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: metricColor,
                      lineHeight: 1,
                    }}
                  >
                    {metric.value}%
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      lineHeight: 1.3,
                      marginTop: 2,
                    }}
                  >
                    {metric.label}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
