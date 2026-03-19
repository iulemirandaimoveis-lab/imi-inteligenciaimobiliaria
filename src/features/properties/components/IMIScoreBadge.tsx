'use client'

import { getScoreColor, getScoreLabel } from '../services/score.service'

interface IMIScoreBadgeProps {
  score: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function IMIScoreBadge({ score, size = 'sm', showLabel = false, className = '' }: IMIScoreBadgeProps) {
  const color = getScoreColor(score)
  const label = getScoreLabel(score)

  const dims = {
    xs: { w: 28, h: 20, font: '9px', lFont: '7px' },
    sm: { w: 36, h: 24, font: '10px', lFont: '7.5px' },
    md: { w: 48, h: 32, font: '13px', lFont: '8px' },
    lg: { w: 64, h: 42, font: '18px', lFont: '9px' },
  }[size]

  return (
    <div className={`inline-flex flex-col items-center gap-[2px] ${className}`}>
      <div
        style={{
          width: dims.w,
          height: dims.h,
          background: `${color}18`,
          border: `1px solid ${color}55`,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-dm-mono, monospace)',
          fontSize: dims.font,
          fontWeight: 500,
          color,
          letterSpacing: '0',
          lineHeight: 1,
        }}
      >
        {score}
      </div>
      {showLabel && (
        <span style={{
          fontSize: dims.lFont,
          fontFamily: 'var(--font-outfit, sans-serif)',
          fontWeight: 600,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color,
          opacity: 0.85,
        }}>
          {label}
        </span>
      )}
    </div>
  )
}

/** Compact inline version — just a colored dot + number */
export function IMIScoreInline({ score }: { score: number }) {
  const color = getScoreColor(score)
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontFamily: 'var(--font-dm-mono, monospace)',
      fontSize: '11px',
      fontWeight: 500,
      color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {score}
    </span>
  )
}

/** Large score display with animated fill bar */
export function IMIScoreDisplay({ score }: { score: number }) {
  const color = getScoreColor(score)
  const label = getScoreLabel(score)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--font-dm-mono, monospace)',
          fontSize: 42,
          fontWeight: 400,
          color,
          lineHeight: 1,
          letterSpacing: '-1px',
        }}>
          {score}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{
            fontSize: '8px',
            fontFamily: 'var(--font-outfit, sans-serif)',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color,
          }}>
            IMI Score
          </span>
          <span style={{
            fontSize: '8px',
            fontFamily: 'var(--font-outfit, sans-serif)',
            fontWeight: 600,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color,
            opacity: 0.7,
          }}>
            {label}
          </span>
        </div>
      </div>
      <div style={{
        height: 3,
        background: 'var(--bo-border, rgba(255,255,255,0.08))',
        borderRadius: 999,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${score}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: 999,
          transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }} />
      </div>
      <span style={{
        fontSize: '9px',
        fontFamily: 'var(--font-outfit, sans-serif)',
        color: 'var(--bo-text-dim, #5C6B7D)',
        letterSpacing: '0.3px',
      }}>
        /100 · Índice de Oportunidade
      </span>
    </div>
  )
}
