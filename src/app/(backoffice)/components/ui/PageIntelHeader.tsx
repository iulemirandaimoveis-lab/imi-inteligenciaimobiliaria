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
          {/* Accent dot */}
          <span style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'var(--imi-blue-bright)',
            flexShrink: 0,
            boxShadow: '0 0 6px var(--imi-blue-bright)',
            display: 'inline-block',
          }} />

          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: 'var(--imi-blue-bright)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
            }}
          >
            {moduleLabel}
          </span>

          {live && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(74,222,128,0.10)',
                border: '1px solid rgba(74,222,128,0.20)',
              }}
            >
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
                IA ATIVA
              </span>
            </span>
          )}
        </div>

        {/* Title — gradient text */}
        <h1
          className="gradient-text"
          style={{
            fontSize: '22px',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            margin: 0,
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
