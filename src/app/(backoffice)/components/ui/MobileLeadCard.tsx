'use client'

/**
 * MobileLeadCard — IMI Design System v3
 * DS3 pattern: surface card with avatar, status badge, AI state chip, summary
 */

import React from 'react'
import Link from 'next/link'
import { StatusBadge } from './StatusBadge'
import { AIScore } from './AIScore'
import { Clock, MapPin, Globe, MessageCircle } from 'lucide-react'

interface LeadMeta {
  origin?: string
  location?: string
  lastActivity?: string
  sessionDuration?: string
  product?: string
}

interface MobileLeadCardProps {
  id?: string
  name: string
  status: 'hot' | 'warm' | 'cold' | string
  score?: number
  aiState?: 'qualifying' | 'scheduled' | 'waiting' | 'done' | null
  aiSummary?: string
  meta?: LeadMeta
  isNew?: boolean
  href?: string
  onClick?: () => void
  className?: string
  animDelay?: number
}

const AI_STATE_CONFIG = {
  qualifying: {
    label: 'Qualificando',
    icon: '🧠',
    color: 'var(--success)',
    bg: 'var(--success-bg)',
    border: 'rgba(74,222,128,0.20)',
  },
  scheduled: {
    label: 'Agendado',
    icon: '📅',
    color: 'var(--warning)',
    bg: 'var(--warning-bg)',
    border: 'rgba(167,139,250,0.20)',
  },
  waiting: {
    label: 'Aguardando Humano',
    icon: '👤',
    color: 'var(--text-primary)',
    bg: 'var(--bg-muted)',
    border: 'var(--border-subtle)',
  },
  done: {
    label: 'Concluído',
    icon: '✓',
    color: 'var(--success)',
    bg: 'var(--success-bg)',
    border: 'rgba(74,222,128,0.20)',
  },
}

const ORIGIN_ICON: Record<string, React.ReactNode> = {
  'meta ads':    <Globe size={9} />,
  'google':      <Globe size={9} />,
  'whatsapp':    <MessageCircle size={9} />,
  'direct':      <Globe size={9} />,
  'referral':    <Globe size={9} />,
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function MobileLeadCard({
  name,
  status,
  score,
  aiState,
  aiSummary,
  meta,
  isNew = false,
  href,
  onClick,
  className = '',
  animDelay,
}: MobileLeadCardProps) {
  const aiCfg = aiState ? AI_STATE_CONFIG[aiState] : null
  const initials = getInitials(name)

  const avatarColors: Record<string, string> = {
    hot:  'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
    warm: 'linear-gradient(135deg, #78350f 0%, #92400e 100%)',
    cold: 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)',
  }
  const avatarBg = avatarColors[status.toLowerCase()] ?? 'linear-gradient(135deg, var(--imi-navy-700) 0%, var(--imi-navy-500) 100%)'

  const cardStyle: React.CSSProperties = {
    padding: '14px 16px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--r-xl, 4px)',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all var(--dur-2, 200ms) var(--ease)',
    animationDelay: animDelay !== undefined ? `${animDelay}ms` : undefined,
  }

  const Wrapper = href ? Link : 'div'
  const wrapperProps = href
    ? { href, className: `animate-fade-in-up ${className} cursor-pointer no-underline block`, style: cardStyle }
    : { className: `animate-fade-in-up ${className} ${onClick ? 'cursor-pointer' : ''}`, style: cardStyle, onClick }

  return (
    <Wrapper {...(wrapperProps as any)}>
      {/* NEW badge — top accent line */}
      {isNew && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, var(--imi-gold-500), transparent)',
          }}
        />
      )}

      {/* Row 1: Avatar + Name + Status + Time */}
      <div className="flex items-center gap-3 mb-3">
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--r-lg, 4px)',
            background: avatarBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            flexShrink: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              {name}
            </span>
            <StatusBadge status={status} size="xs" glow dot />
          </div>

          {(meta?.origin || meta?.location) && (
            <div className="flex items-center gap-2 mt-1" style={{ flexWrap: 'wrap' }}>
              {meta?.origin && (
                <span className="flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {ORIGIN_ICON[meta.origin.toLowerCase()] ?? <Globe size={9} />}
                  {meta.origin}
                </span>
              )}
              {meta?.location && (
                <span className="flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  <MapPin size={9} />
                  {meta.location}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {score !== undefined && <AIScore score={score} size="xs" />}
          {meta?.lastActivity && (
            <span className="flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
              <Clock size={8} />
              {meta.lastActivity}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: AI state chip + product */}
      {(aiCfg || meta?.product) && (
        <div className="flex items-center gap-2 mb-3">
          {aiCfg && (
            <span
              className="flex items-center gap-1"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                color: aiCfg.color,
                background: aiCfg.bg,
                border: `1px solid ${aiCfg.border}`,
                padding: '4px 8px',
                borderRadius: 'var(--r-md, 4px)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{aiCfg.icon}</span>
              {aiCfg.label}
            </span>
          )}
          {meta?.product && (
            <>
              <span style={{ color: 'var(--border-default)', fontSize: '11px' }}>•</span>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '160px',
                }}
              >
                {meta.product}
              </span>
            </>
          )}
        </div>
      )}

      {/* Row 3: AI summary */}
      {aiSummary && (
        <div
          style={{
            background: 'var(--bg-muted)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--r-lg, 4px)',
            padding: '8px 10px',
          }}
        >
          <div className="flex items-start gap-2">
            <span style={{ fontSize: '11px', color: 'var(--imi-gold-500)', marginTop: '1px', flexShrink: 0 }}>
              ✦
            </span>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {aiSummary}
            </p>
          </div>
        </div>
      )}

      {/* Session duration chip */}
      {meta?.sessionDuration && (
        <div className="flex justify-end mt-2">
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--imi-gold-500)',
              background: 'rgba(184,148,58,0.10)',
              border: '1px solid rgba(184,148,58,0.20)',
              padding: '2px 7px',
              borderRadius: 'var(--r-sm, 4px)',
            }}
          >
            ▶ {meta.sessionDuration}
          </span>
        </div>
      )}
    </Wrapper>
  )
}
