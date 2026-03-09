'use client'

import React from 'react'

interface AIInsightCardProps {
  title?: string
  children: React.ReactNode
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
  }
  /** Next suggested step */
  nextStep?: string
  variant?: 'gold' | 'blue' | 'green'
  className?: string
}

const VARIANT_STYLES = {
  gold: {
    border: 'rgba(234,179,8,0.30)',
    bg: 'rgba(234,179,8,0.06)',
    iconColor: 'var(--imi-ai-gold)',
    labelColor: 'var(--imi-ai-gold)',
  },
  blue: {
    border: 'var(--imi-blue-border)',
    bg: 'var(--imi-blue-dim)',
    iconColor: 'var(--imi-blue-bright)',
    labelColor: 'var(--imi-blue-bright)',
  },
  green: {
    border: 'rgba(74,222,128,0.25)',
    bg: 'rgba(74,222,128,0.07)',
    iconColor: 'var(--imi-ai-green)',
    labelColor: 'var(--imi-ai-green)',
  },
}

export function AIInsightCard({
  title = 'AI Insight Strategy',
  children,
  action,
  nextStep,
  variant = 'gold',
  className = '',
}: AIInsightCardProps) {
  const v = VARIANT_STYLES[variant]

  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: 'var(--bo-card)',
        border: `1px solid ${v.border}`,
        padding: '14px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow blob */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: v.bg,
          filter: 'blur(24px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-3" style={{ position: 'relative' }}>
        <span style={{ color: v.iconColor, fontSize: '14px' }}>✦</span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: v.labelColor,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          fontSize: '12px',
          color: 'var(--bo-text-muted)',
          lineHeight: 1.6,
          position: 'relative',
        }}
      >
        {children}
      </div>

      {/* Next step chip */}
      {nextStep && (
        <div
          className="flex items-center justify-between mt-3"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '8px 12px',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--bo-text-muted)', fontWeight: 500 }}>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: v.labelColor,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'block',
                marginBottom: '2px',
              }}
            >
              Próximo Passo
            </span>
            {nextStep}
          </span>
          <span style={{ color: 'var(--bo-text-muted)', fontSize: '16px', marginLeft: '8px' }}>›</span>
        </div>
      )}

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className="w-full mt-3"
          style={{
            padding: '9px 16px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#fff',
            background: 'var(--bo-accent)',
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
