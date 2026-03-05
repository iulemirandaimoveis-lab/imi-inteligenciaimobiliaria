'use client'

import React from 'react'

interface PageIntelHeaderProps {
  /** Small uppercase label above the title — e.g. "INTELLIGENCE OS" */
  moduleLabel?: string
  /** Main page title */
  title: string
  /** Optional subtitle */
  subtitle?: string
  /** Show live pulsing dot + "IA EM TEMPO REAL" */
  live?: boolean
  /** Slot for right-side actions (buttons, filters, etc.) */
  actions?: React.ReactNode
  className?: string
}

export function PageIntelHeader({
  moduleLabel = 'INTELLIGENCE OS',
  title,
  subtitle,
  live = false,
  actions,
  className = '',
}: PageIntelHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between ${className}`}
      style={{ marginBottom: '20px' }}
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        {/* Module micro-label */}
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: 'var(--imi-blue-bright)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {moduleLabel}
          </span>

          {live && (
            <span className="flex items-center gap-1">
              <span className="live-dot" />
              <span
                style={{
                  fontSize: '8px',
                  fontWeight: 700,
                  color: 'var(--imi-ai-green)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                IA EM TEMPO REAL
              </span>
            </span>
          )}
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--bo-text)',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--bo-text-muted)',
              lineHeight: 1.4,
              marginTop: '2px',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Right actions */}
      {actions && (
        <div className="flex-shrink-0 ml-3">
          {actions}
        </div>
      )}
    </div>
  )
}
