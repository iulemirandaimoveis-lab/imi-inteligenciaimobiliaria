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
  success: { color: 'var(--bo-success)', bg: 'var(--bo-success-bg)', border: 'rgba(52,211,153,0.20)' },
  warning: { color: 'var(--bo-warning)', bg: 'var(--bo-warning-bg)', border: 'rgba(251,191,36,0.20)' },
  error:   { color: 'var(--bo-error)',   bg: 'var(--bo-error-bg)',   border: 'rgba(248,113,113,0.20)' },
  info:    { color: 'var(--bo-info)',    bg: 'var(--bo-info-bg)',    border: 'rgba(96,165,250,0.20)' },
  accent:  { color: 'var(--bo-accent)', bg: 'var(--bo-active-bg)',  border: 'var(--bo-border-gold)' },
  muted:   { color: 'var(--bo-text-muted)', bg: 'var(--bo-hover)',  border: 'var(--bo-border)' },
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
                transition: 'background 120ms ease',
              }}
            >
              <Home size={11} style={{ color: 'var(--bo-text-muted)' }} />
            </span>
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight size={12} style={{ color: 'var(--bo-text-tertiary, var(--bo-text-muted))' }} />
              {crumb.href ? (
                <Link href={crumb.href}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--bo-text-muted)',
                      transition: 'color 120ms ease',
                    }}
                  >
                    {crumb.label}
                  </span>
                </Link>
              ) : (
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--bo-text)' }}>
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

          {/* Title row — gradient text + optional badge */}
          <div className="flex items-center gap-3 flex-wrap">
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

            {badge && (() => {
              const c = BADGE_COLORS[badge.color || 'accent']
              return (
                <span
                  className="inline-flex items-center rounded-full"
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 10px',
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
    </div>
  )
}
