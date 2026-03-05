'use client'

import React from 'react'

interface SectionHeaderProps {
  title: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  badge?: string | number   // e.g. "12" or "LIVE"
  badgeColor?: string
  className?: string
}

export function SectionHeader({ title, action, badge, badgeColor, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`} style={{ marginBottom: '12px' }}>
      <div className="flex items-center gap-2">
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--bo-text)',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </span>
        {badge !== undefined && (
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: badgeColor ?? 'var(--imi-blue-bright)',
              background: 'var(--imi-blue-dim)',
              border: '1px solid var(--imi-blue-border)',
              padding: '1px 6px',
              borderRadius: '6px',
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
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--imi-blue-bright)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {action.label} <span style={{ fontSize: '14px', lineHeight: 1 }}>›</span>
          </a>
        ) : (
          <button
            onClick={action.onClick}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--imi-blue-bright)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: '4px 0',
            }}
          >
            {action.label} <span style={{ fontSize: '14px', lineHeight: 1 }}>›</span>
          </button>
        )
      )}
    </div>
  )
}
