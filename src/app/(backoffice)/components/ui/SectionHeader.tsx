'use client'

/**
 * SectionHeader — IMI Design System v3
 * DS3 pattern: section divider with title, optional badge and action link
 */

import React from 'react'

interface SectionHeaderProps {
  title: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  badge?: string | number
  badgeColor?: string
  className?: string
}

export function SectionHeader({ title, action, badge, badgeColor, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`} style={{ marginBottom: '12px' }}>
      <div className="flex items-center gap-2">
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </span>
        {badge !== undefined && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: 700,
              color: badgeColor ?? 'var(--imi-gold-500)',
              background: 'rgba(184,148,58,0.10)',
              border: '1px solid rgba(184,148,58,0.20)',
              padding: '1px 6px',
              borderRadius: 'var(--r-sm, 6px)',
              lineHeight: '14px',
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {action && (
        action.href ? (
          <a
            href={action.href}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--imi-gold-500)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              transition: 'color var(--dur-1, 120ms) var(--ease)',
            }}
          >
            {action.label} <span style={{ fontSize: '14px', lineHeight: 1 }}>›</span>
          </a>
        ) : (
          <button
            onClick={action.onClick}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--imi-gold-500)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: '4px 0',
              transition: 'color var(--dur-1, 120ms) var(--ease)',
            }}
          >
            {action.label} <span style={{ fontSize: '14px', lineHeight: 1 }}>›</span>
          </button>
        )
      )}
    </div>
  )
}
