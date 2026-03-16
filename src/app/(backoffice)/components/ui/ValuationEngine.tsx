'use client'

/**
 * ValuationEngine — IMI Design System v3
 * DS3 pattern: property valuation widget with confidence meter and comparables
 */

import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, MapPin, Zap } from 'lucide-react'

export interface ValuationComparable {
  address: string
  value: number
  distance?: string
  diff: number
}

export interface ValuationEngineProps {
  estimatedValue: number
  minValue?: number
  maxValue?: number
  confidence: number
  comparables?: ValuationComparable[]
  propertyArea?: number
  lastUpdated?: string
  methodology?: string
  loading?: boolean
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function confidenceLabel(c: number): string {
  if (c >= 86) return 'Muito Alta'
  if (c >= 71) return 'Alta'
  if (c >= 51) return 'Média'
  return 'Baixa'
}

function confidenceColor(c: number): string {
  if (c >= 86) return 'var(--success)'
  if (c >= 71) return 'var(--info)'
  if (c >= 51) return 'var(--warning)'
  return 'var(--error)'
}

function confidenceBg(c: number): string {
  if (c >= 86) return 'var(--success-bg)'
  if (c >= 71) return 'var(--info-bg)'
  if (c >= 51) return 'var(--warning-bg)'
  return 'var(--error-bg)'
}

function ShimmerBlock({ w, h }: { w: string | number; h: string | number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 'var(--r-sm, 6px)',
        background: 'var(--bg-muted)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, var(--bg-elevated) 50%, transparent 100%)',
          animation: 'imi-shimmer 1.6s ease-in-out infinite',
        }}
      />
    </div>
  )
}

export function ValuationEngine({
  estimatedValue,
  minValue,
  maxValue,
  confidence,
  comparables = [],
  propertyArea,
  lastUpdated,
  methodology,
  loading = false,
}: ValuationEngineProps) {
  const clampedConfidence = Math.max(0, Math.min(100, confidence))
  const min = minValue ?? estimatedValue * 0.92
  const max = maxValue ?? estimatedValue * 1.08
  const rangeSpan = max - min
  const estimatePos = rangeSpan > 0 ? ((estimatedValue - min) / rangeSpan) * 100 : 50

  // Inject shimmer keyframe once
  React.useEffect(() => {
    const id = 'imi-shimmer-kf'
    if (document.getElementById(id)) return
    const s = document.createElement('style')
    s.id = id
    s.textContent = `@keyframes imi-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }`
    document.head.appendChild(s)
    return () => { s.remove() }
  }, [])

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-xl, 16px)',
        boxShadow: 'var(--shadow-sm)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
            }}
          >
            Motor de Avaliação
          </span>
          {lastUpdated && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--text-disabled)',
                letterSpacing: '0.04em',
              }}
            >
              · {lastUpdated}
            </span>
          )}
        </div>

        {/* Gold dot micro icon */}
        <div
          aria-hidden
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, var(--imi-gold-300), var(--imi-gold-500))',
            boxShadow: '0 0 6px rgba(184,148,58,0.4)',
            flexShrink: 0,
          }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ShimmerBlock w="60%" h={44} />
          <ShimmerBlock w="100%" h={8} />
          <ShimmerBlock w="100%" h={8} />
          <ShimmerBlock w="100%" h={60} />
        </div>
      ) : (
        <>
          {/* Primary value block */}
          <div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              R$/m²
            </span>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 36,
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1,
                letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums',
                marginTop: 2,
                marginBottom: 12,
              }}
            >
              {formatBRL(estimatedValue)}
            </motion.div>

            {/* Range bar */}
            <div style={{ position: 'relative', height: 8, marginBottom: 6 }}>
              {/* Track */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'var(--r-full, 9999px)',
                  background: 'var(--bg-muted)',
                }}
              />
              {/* Gold fill from min to estimate */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(4, estimatePos)}%` }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 'var(--r-full, 9999px)',
                  background: 'linear-gradient(to right, var(--imi-gold-400), var(--imi-gold-500))',
                }}
              />
              {/* Estimate dot */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.7 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${Math.max(2, Math.min(98, estimatePos))}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--imi-gold-500)',
                  border: '2px solid var(--bg-surface)',
                  boxShadow: 'var(--shadow-gold, 0 0 8px rgba(184,148,58,0.5))',
                  zIndex: 1,
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-disabled)', letterSpacing: '0.04em' }}>
                R$ {formatBRL(min)}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Intervalo de confiança
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-disabled)', letterSpacing: '0.04em' }}>
                R$ {formatBRL(max)}
              </span>
            </div>

            {propertyArea && (
              <div
                style={{
                  marginTop: 6,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-tertiary)',
                }}
              >
                Total estimado:{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  R$ {formatBRL(estimatedValue * propertyArea)}
                </span>
                {' '}· {propertyArea}m²
              </div>
            )}
          </div>

          {/* Confidence meter */}
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--r-md, 8px)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Confiança
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: confidenceColor(clampedConfidence),
                  }}
                >
                  {clampedConfidence}%
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: confidenceColor(clampedConfidence),
                    background: confidenceBg(clampedConfidence),
                    padding: '1px 7px',
                    borderRadius: 9999,
                  }}
                >
                  {confidenceLabel(clampedConfidence)}
                </span>
              </div>
            </div>

            <div
              style={{
                width: '100%',
                height: 6,
                borderRadius: 'var(--r-full, 9999px)',
                background: 'var(--bg-muted)',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${clampedConfidence}%` }}
                transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
                style={{
                  height: '100%',
                  background: confidenceColor(clampedConfidence),
                  borderRadius: 'var(--r-full, 9999px)',
                }}
              />
            </div>
          </div>

          {/* Comparables */}
          {comparables.length > 0 && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.10em',
                  marginBottom: 8,
                }}
              >
                Comparáveis
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {comparables.slice(0, 4).map((comp, i) => {
                  const isPos = comp.diff > 0
                  const isNeg = comp.diff < 0
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * i }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--r-sm, 6px)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <MapPin size={11} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />

                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--text-secondary)',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {comp.address}
                      </span>

                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          flexShrink: 0,
                        }}
                      >
                        R$ {formatBRL(comp.value)}/m²
                      </span>

                      {comp.distance && (
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            color: 'var(--text-tertiary)',
                            background: 'var(--bg-muted)',
                            padding: '1px 5px',
                            borderRadius: 'var(--r-xs, 3px)',
                            flexShrink: 0,
                          }}
                        >
                          {comp.distance}
                        </span>
                      )}

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: 9999,
                          background: isPos
                            ? 'rgba(0,178,127,0.12)'
                            : isNeg
                              ? 'rgba(229,62,62,0.12)'
                              : 'var(--bg-muted)',
                          color: isPos
                            ? 'var(--success)'
                            : isNeg
                              ? 'var(--error)'
                              : 'var(--text-tertiary)',
                          flexShrink: 0,
                        }}
                      >
                        {isPos && <TrendingUp size={8} />}
                        {isNeg && <TrendingDown size={8} />}
                        {isPos ? '+' : ''}
                        {comp.diff.toFixed(1)}%
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Methodology footer */}
      {methodology && !loading && (
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Zap size={9} style={{ color: 'var(--imi-gold-400)', flexShrink: 0 }} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
              letterSpacing: '0.04em',
            }}
          >
            Metodologia: {methodology}
          </span>
        </div>
      )}
    </div>
  )
}
