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
    btnBg: 'var(--imi-ai-gold)',
    btnShadow: '0 2px 10px rgba(212,169,41,0.35)',
    btnColor: '#1a1200',
  },
  blue: {
    border: 'var(--imi-blue-border)',
    bg: 'var(--imi-blue-dim)',
    iconColor: 'var(--imi-blue-bright)',
    labelColor: 'var(--imi-blue-bright)',
    btnBg: 'var(--imi-blue-bright)',
    btnShadow: '0 2px 10px rgba(72,101,129,0.35)',
    btnColor: '#fff',
  },
  green: {
    border: 'rgba(74,222,128,0.25)',
    bg: 'rgba(74,222,128,0.07)',
    iconColor: 'var(--imi-ai-green)',
    labelColor: 'var(--imi-ai-green)',
    btnBg: 'var(--imi-ai-green)',
    btnShadow: '0 2px 10px rgba(74,222,128,0.30)',
    btnColor: '#001a0a',
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
        <div className="mt-3 flex justify-center">
          <button
            onClick={action.onClick}
            style={{
              padding: '7px 20px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              color: v.btnColor,
              background: v.btnBg,
              border: 'none',
              cursor: 'pointer',
              transition: 'filter 0.15s, transform 0.1s',
              boxShadow: v.btnShadow,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)' }}
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  )
}
