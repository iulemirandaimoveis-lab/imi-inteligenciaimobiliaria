'use client'

/**
 * AIInsightCard — IMI Design System v3
 * DS3 pattern: elevated insight card with variant accent, glow blob, action button
 */

import React from 'react'

interface AIInsightCardProps {
  title?: string
  children: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  nextStep?: string
  variant?: 'gold' | 'blue' | 'green'
  className?: string
}

const VARIANT_STYLES = {
  gold: {
    border: 'rgba(184,148,58,0.30)',
    bg: 'rgba(184,148,58,0.06)',
    iconColor: 'var(--imi-gold-500)',
    labelColor: 'var(--imi-gold-500)',
    btnBg: 'var(--imi-gold-500)',
    btnShadow: '0 2px 10px rgba(184,148,58,0.35)',
    btnColor: '#FFFFFF',
  },
  blue: {
    border: 'rgba(61,81,138,0.30)',
    bg: 'rgba(61,81,138,0.08)',
    iconColor: 'var(--imi-navy-300)',
    labelColor: 'var(--imi-navy-300)',
    btnBg: 'var(--imi-navy-400)',
    btnShadow: '0 2px 10px rgba(61,81,138,0.35)',
    btnColor: '#FFFFFF',
  },
  green: {
    border: 'rgba(74,222,128,0.25)',
    bg: 'rgba(74,222,128,0.07)',
    iconColor: 'var(--success)',
    labelColor: 'var(--success)',
    btnBg: 'var(--success)',
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
      className={className}
      style={{
        background: variant === 'gold'
          ? 'linear-gradient(135deg, var(--surface-raised, var(--bg-surface)) 0%, rgba(200,164,74,0.06) 100%)'
          : 'var(--bg-surface)',
        border: `1px solid ${v.border}`,
        borderLeft: variant === 'gold' ? '3px solid var(--color-gold, var(--imi-gold-500))' : undefined,
        borderRadius: 'var(--r-xl, 4px)',
        padding: 'var(--space-5, 20px)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: variant === 'gold' ? 'var(--shadow-gold-glow, var(--shadow-gold))' : undefined,
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
            fontFamily: variant === 'gold' ? 'var(--font-display)' : 'var(--font-ui)',
            fontSize: variant === 'gold' ? '18px' : '12px',
            fontWeight: variant === 'gold' ? 400 : 700,
            fontStyle: variant === 'gold' ? 'italic' : 'normal',
            color: v.labelColor,
            letterSpacing: variant === 'gold' ? '0' : '-0.01em',
          }}
        >
          {title}
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
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
            background: 'var(--bg-muted)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--r-lg, 4px)',
            padding: '8px 12px',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
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
          <span style={{ color: 'var(--text-tertiary)', fontSize: '16px', marginLeft: '8px' }}>›</span>
        </div>
      )}

      {/* Action button */}
      {action && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={action.onClick}
            style={{
              fontFamily: 'var(--font-sans)',
              padding: '7px 20px',
              borderRadius: 'var(--r-md, 4px)',
              fontSize: '11px',
              fontWeight: 700,
              color: v.btnColor,
              background: v.btnBg,
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--dur-2, 200ms) var(--ease)',
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
