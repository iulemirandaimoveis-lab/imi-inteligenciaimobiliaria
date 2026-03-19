'use client'

/**
 * IntegrationRequired — IMI Design System v3
 * DS3 pattern: centered empty state for modules requiring external integration setup
 */

import React, { type ReactNode } from 'react'
import Link from 'next/link'
import { Settings, ExternalLink, ChevronRight, Plug } from 'lucide-react'

interface IntegrationRequiredProps {
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>
  service: string
  description: string
  steps?: string[]
  docsUrl?: string
  contactUrl?: string
  settingsHref?: string
  badge?: string
  badgeColor?: string
  children?: ReactNode
}

export function IntegrationRequired({
  icon: Icon,
  service,
  description,
  steps,
  docsUrl,
  contactUrl,
  settingsHref,
  badge,
  badgeColor,
  children,
}: IntegrationRequiredProps) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      {/* Icon container */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 'var(--r-xl, 4px)',
          background: 'rgba(184,148,58,0.08)',
          border: '1px solid rgba(184,148,58,0.20)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          position: 'relative',
        }}
      >
        {Icon ? (
          <Icon size={36} style={{ color: 'var(--imi-gold-500)', opacity: 0.9 }} />
        ) : (
          <Plug size={36} style={{ color: 'var(--imi-gold-500)', opacity: 0.9 }} />
        )}

        {badge && (
          <span
            style={{
              position: 'absolute',
              top: -10,
              right: -10,
              background: badgeColor ?? 'var(--imi-gold-500)',
              color: 'var(--text-inverse)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              padding: '4px 8px',
              borderRadius: 'var(--r-chip, 6px)',
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap',
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Eyebrow */}
      <p
        style={{
          fontSize: 11,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: 'var(--imi-gold-500)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Integração necessária
      </p>

      {/* Title */}
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-serif)',
          marginBottom: 12,
          maxWidth: 420,
        }}
      >
        {service}
      </h2>

      {/* Description */}
      <p
        style={{
          fontSize: 14,
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
          maxWidth: 480,
          marginBottom: steps && steps.length > 0 ? 32 : 28,
        }}
      >
        {description}
      </p>

      {/* Setup steps */}
      {steps && steps.length > 0 && (
        <div
          style={{
            background: 'var(--bg-muted)',
            border: '1px solid rgba(184,148,58,0.12)',
            borderRadius: 'var(--r-xl, 4px)',
            padding: '20px 24px',
            maxWidth: 440,
            width: '100%',
            marginBottom: 28,
            textAlign: 'left',
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'var(--imi-gold-500)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              marginBottom: 14,
            }}
          >
            Como configurar
          </p>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps.map((step, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span
                  style={{
                    minWidth: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'rgba(184,148,58,0.15)',
                    border: '1px solid rgba(184,148,58,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--imi-gold-500)',
                    fontFamily: 'var(--font-mono)',
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {settingsHref && (
          <Link
            href={settingsHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 44,
              padding: '0 20px',
              background: 'var(--imi-gold-500)',
              color: 'var(--text-inverse)',
              borderRadius: 'var(--r-md, 4px)',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              textDecoration: 'none',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all var(--dur-2, 200ms) var(--ease)',
            }}
          >
            <Settings size={15} />
            Configurar agora
            <ChevronRight size={14} />
          </Link>
        )}

        {docsUrl && (
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 44,
              padding: '0 20px',
              background: 'rgba(184,148,58,0.08)',
              border: '1px solid rgba(184,148,58,0.20)',
              color: 'var(--imi-gold-500)',
              borderRadius: 'var(--r-md, 4px)',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              textDecoration: 'none',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all var(--dur-2, 200ms) var(--ease)',
            }}
          >
            <ExternalLink size={14} />
            Ver documentação
          </a>
        )}

        {contactUrl && (
          <a
            href={contactUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 44,
              padding: '0 20px',
              background: 'rgba(184,148,58,0.08)',
              border: '1px solid rgba(184,148,58,0.20)',
              color: 'var(--imi-gold-500)',
              borderRadius: 'var(--r-md, 4px)',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              textDecoration: 'none',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all var(--dur-2, 200ms) var(--ease)',
            }}
          >
            <ExternalLink size={14} />
            Falar com suporte
          </a>
        )}
      </div>

      {children && (
        <div style={{ marginTop: 28, width: '100%', maxWidth: 480 }}>
          {children}
        </div>
      )}
    </div>
  )
}
