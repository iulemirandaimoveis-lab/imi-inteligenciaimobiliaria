'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface Breadcrumb {
  label: string
  href?: string
}

interface BadgeConfig {
  label: string
  color?: 'success' | 'warning' | 'error' | 'info' | 'accent' | 'muted'
}

const BADGE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  success: { color: 'var(--success)', bg: 'var(--success-bg)', border: 'color-mix(in srgb, var(--success) 20%, transparent)' },
  warning: { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'color-mix(in srgb, var(--warning) 20%, transparent)' },
  error:   { color: 'var(--error)',   bg: 'var(--error-bg)',   border: 'color-mix(in srgb, var(--error) 20%, transparent)' },
  info:    { color: 'var(--info)',    bg: 'var(--info-bg)',    border: 'color-mix(in srgb, var(--info) 20%, transparent)' },
  accent:  { color: 'var(--accent-400)', bg: 'color-mix(in srgb, var(--accent-400) 10%, transparent)', border: 'color-mix(in srgb, var(--accent-400) 25%, transparent)' },
  muted:   { color: 'var(--text-secondary)', bg: 'var(--bg-hover)', border: 'var(--border-default)' },
}

interface PageIntelHeaderProps {
  /** Small uppercase label above the title — e.g. "INTELLIGENCE OS" */
  moduleLabel?: string
  /** Main page title */
  title: string
  /** Optional subtitle */
  subtitle?: string
  /** Show live pulsing dot + "IA ATIVA" */
  live?: boolean
  /** Slot for right-side actions (buttons, filters, etc.) */
  actions?: React.ReactNode
  /** Optional breadcrumb navigation */
  breadcrumbs?: Breadcrumb[]
  /** Optional badge next to title */
  badge?: BadgeConfig
  className?: string
}

export function PageIntelHeader({
  moduleLabel = 'INTELLIGENCE OS',
  title,
  subtitle,
  live = false,
  actions,
  breadcrumbs,
  badge,
  className = '',
}: PageIntelHeaderProps) {
  return (
    <div
      className={className}
      style={{ marginBottom: '20px' }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          className="flex items-center gap-1 flex-wrap"
          style={{ marginBottom: '12px' }}
        >
          <Link href="/backoffice/dashboard">
            <span
              className="inline-flex items-center justify-center rounded-md"
              style={{
                width: 20,
                height: 20,
                transition: `background var(--dur-1, 120ms) var(--ease)`,
              }}
            >
              <Home size={11} style={{ color: 'var(--text-tertiary)' }} />
            </span>
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />
              {crumb.href ? (
                <Link href={crumb.href}>
                  <span
                    className="breadcrumb-link"
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--text-secondary)',
                      transition: `color var(--dur-1, 120ms) var(--ease)`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-gold)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
                  >
                    {crumb.label}
                  </span>
                </Link>
              ) : (
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-primary)',
                }}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {/* Module micro-label */}
          <div className="flex items-center gap-2">
            {/* Accent dot */}
            <span style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'var(--accent-400)',
              flexShrink: 0,
              boxShadow: '0 0 6px var(--accent-400)',
              display: 'inline-block',
            }} />

            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--text-gold)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              {moduleLabel}
            </span>

            {live && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-[6px]"
                style={{
                  background: 'var(--success-bg)',
                  border: `1px solid color-mix(in srgb, var(--success) 20%, transparent)`,
                }}
              >
                <span className="live-dot" />
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--success)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  IA ATIVA
                </span>
              </span>
            )}
          </div>

          {/* Title row + optional badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1
              style={{
                fontSize: '20px',
                fontFamily: 'var(--font-serif)',
                fontWeight: 500,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {title}
            </h1>

            {badge && (() => {
              const c = BADGE_COLORS[badge.color || 'accent']
              return (
                <span
                  className="inline-flex items-center rounded-[6px]"
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 700,
                    padding: '4px 12px',
                    color: c.color,
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    letterSpacing: '0.03em',
                    lineHeight: 1,
                  }}
                >
                  {badge.label}
                </span>
              )
            })()}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-tertiary)',
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

      {/* Bottom accent line */}
      <div
        style={{
          height: '2px',
          marginTop: '16px',
          background: 'linear-gradient(90deg, var(--accent-400), transparent)',
          borderRadius: 'var(--r-full, 9999px)',
        }}
      />
    </div>
  )
}
