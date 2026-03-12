'use client'

import React from 'react'
import Link from 'next/link'
import { StatusBadge } from './StatusBadge'
import { AIScore } from './AIScore'
import { Clock, MapPin, Globe, MessageCircle } from 'lucide-react'

interface LeadMeta {
  origin?: string          // Ex: "Meta Ads", "Google", "WhatsApp"
  location?: string        // Ex: "Jardins, SP"
  lastActivity?: string    // Ex: "há 2 min", "Hoje 14:32"
  sessionDuration?: string // Ex: "5:42 min"
  product?: string         // Ex: "Apartamento Jardins"
}

interface MobileLeadCardProps {
  id?: string
  name: string
  status: 'hot' | 'warm' | 'cold' | string
  score?: number           // 0-100 AI score
  aiState?: 'qualifying' | 'scheduled' | 'waiting' | 'done' | null
  aiSummary?: string       // short AI insight text
  meta?: LeadMeta
  isNew?: boolean
  href?: string            // Link destination (preferred over onClick)
  onClick?: () => void
  className?: string
  animDelay?: number       // for staggered entrance
}

const AI_STATE_CONFIG = {
  qualifying: {
    label: 'Qualificando',
    icon: '🧠',
    color: 'var(--imi-ai-green)',
    bg: 'var(--imi-ai-green-bg)',
    border: 'rgba(74,222,128,0.20)',
  },
  scheduled: {
    label: 'Agendado',
    icon: '📅',
    color: 'var(--s-pend)',
    bg: 'var(--s-pend-bg)',
    border: 'rgba(167,139,250,0.20)',
  },
  waiting: {
    label: 'Aguardando Humano',
    icon: '👤',
    color: 'var(--bo-text)',
    bg: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.12)',
  },
  done: {
    label: 'Concluído',
    icon: '✓',
    color: 'var(--s-done)',
    bg: 'var(--s-done-bg)',
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
  id,
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
  const avatarBg = avatarColors[status.toLowerCase()] ?? 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)'

  const Wrapper = href ? Link : 'div'
  const wrapperProps = href
    ? { href, className: `intel-card animate-fade-in-up ${className} cursor-pointer no-underline block`, style: { padding: '14px 16px', animationDelay: animDelay !== undefined ? `${animDelay}ms` : undefined, position: 'relative' as const, overflow: 'hidden' as const } }
    : { className: `intel-card animate-fade-in-up ${className} ${onClick ? 'cursor-pointer' : ''}`, style: { padding: '14px 16px', animationDelay: animDelay !== undefined ? `${animDelay}ms` : undefined, position: 'relative' as const, overflow: 'hidden' as const }, onClick }

  return (
    <Wrapper {...(wrapperProps as any)}>
      {/* NEW badge — top right accent line */}
      {isNew && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, var(--imi-blue) 0%, var(--imi-blue-bright) 100%)`,
          }}
        />
      )}

      {/* Row 1: Avatar + Name + Status + Time */}
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: avatarBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            flexShrink: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {initials}
        </div>

        {/* Name + Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--bo-text)',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              {name}
            </span>
            <StatusBadge status={status} size="xs" glow dot />
          </div>

          {/* Meta: origin / location */}
          {(meta?.origin || meta?.location) && (
            <div className="flex items-center gap-2 mt-1" style={{ flexWrap: 'wrap' }}>
              {meta.origin && (
                <span className="flex items-center gap-1" style={{ fontSize: '10px', color: 'var(--bo-text-muted)' }}>
                  {ORIGIN_ICON[meta.origin.toLowerCase()] ?? <Globe size={9} />}
                  {meta.origin}
                </span>
              )}
              {meta.location && (
                <span className="flex items-center gap-1" style={{ fontSize: '10px', color: 'var(--bo-text-muted)' }}>
                  <MapPin size={9} />
                  {meta.location}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right side: AI score + time */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {score !== undefined && <AIScore score={score} size="xs" />}
          {meta?.lastActivity && (
            <span className="flex items-center gap-1" style={{ fontSize: '9px', color: 'var(--bo-text-muted)' }}>
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
                fontSize: '9px',
                fontWeight: 700,
                color: aiCfg.color,
                background: aiCfg.bg,
                border: `1px solid ${aiCfg.border}`,
                padding: '3px 8px',
                borderRadius: '8px',
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
              <span style={{ color: 'var(--bo-border)', fontSize: '10px' }}>•</span>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--bo-text-muted)',
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
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--bo-border)',
            borderRadius: '10px',
            padding: '8px 10px',
          }}
        >
          <div className="flex items-start gap-2">
            <span style={{ fontSize: '11px', color: 'var(--bo-text-muted)', marginTop: '1px', flexShrink: 0 }}>
              ✦
            </span>
            <p
              style={{
                fontSize: '11px',
                color: 'var(--bo-text-muted)',
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
              fontSize: '9px',
              fontWeight: 600,
              color: 'var(--imi-blue-bright)',
              background: 'var(--imi-blue-dim)',
              border: '1px solid var(--imi-blue-border)',
              padding: '2px 7px',
              borderRadius: '6px',
            }}
          >
            ▶ {meta.sessionDuration}
          </span>
        </div>
      )}
    </Wrapper>
  )
}
