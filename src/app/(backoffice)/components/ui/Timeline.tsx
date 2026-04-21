'use client'

/**
 * Timeline — IMI Design System v3
 * DS3 pattern: vertical timeline for events, history, and workflow status.
 * Designed to sit inside a card/section (transparent background).
 * Supports framer-motion stagger entrance animation.
 */

import React, { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type TimelineStatus = 'done' | 'active' | 'pending' | 'error' | 'warning'

export interface TimelineEvent {
  id: string
  title: string
  description?: string
  /** Display string (not parsed) */
  date: string
  status?: TimelineStatus
  /** Optional icon node rendered inside the dot area (overrides status dot) */
  icon?: ReactNode
  /** Small secondary info, rendered in font-mono */
  meta?: string
  /** Badge pill text */
  badge?: string
}

export interface TimelineProps {
  events: TimelineEvent[]
  /** Reduce vertical spacing between events — default false */
  compact?: boolean
  /** Stagger entrance with framer-motion — default false */
  animated?: boolean
}

/* ── Status config ────────────────────────────────────────── */

interface StatusCfg {
  color: string
  bg: string
  border: string
  ring?: string
  pulse?: boolean
}

const STATUS_CFG: Record<TimelineStatus, StatusCfg> = {
  done:    { color: 'var(--success)',       bg: 'var(--success-bg)',  border: 'var(--success)',       ring: undefined,                     pulse: false },
  active:  { color: 'var(--accent-400)',  bg: 'rgba(200,164,74,.12)', border: 'var(--accent-400)', ring: 'rgba(200,164,74,.20)',  pulse: true  },
  pending: { color: 'var(--text-tertiary)', bg: 'var(--bg-muted)',    border: 'var(--border-default)', ring: undefined,                     pulse: false },
  error:   { color: 'var(--error)',         bg: 'var(--error-bg)',    border: 'var(--error)',          ring: undefined,                     pulse: false },
  warning: { color: 'var(--warning)',       bg: 'var(--warning-bg)', border: 'var(--warning)',         ring: undefined,                     pulse: false },
}

const DEFAULT_STATUS: StatusCfg = {
  color: 'var(--text-tertiary)',
  bg: 'var(--bg-muted)',
  border: 'var(--border-default)',
  pulse: false,
}

/* ── Badge pill ───────────────────────────────────────────── */

function BadgePill({ label, status }: { label: string; status?: TimelineStatus }) {
  const cfg = status ? STATUS_CFG[status] : STATUS_CFG.pending
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 'var(--r-chip, 6px)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}22`,
        whiteSpace: 'nowrap',
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  )
}

/* ── Single event row ─────────────────────────────────────── */

interface EventRowProps {
  event: TimelineEvent
  isLast: boolean
  compact: boolean
}

function EventRow({ event, isLast, compact }: EventRowProps) {
  const cfg = event.status ? (STATUS_CFG[event.status] ?? DEFAULT_STATUS) : DEFAULT_STATUS
  const gapV = compact ? 12 : 20

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        paddingBottom: isLast ? 0 : gapV,
        position: 'relative',
      }}
    >
      {/* ── Left column: dot + connector line ── */}
      <div
        style={{
          width: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {/* Dot */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: cfg.color,
            border: `1.5px solid ${cfg.border}`,
            flexShrink: 0,
            position: 'relative',
            zIndex: 1,
            marginTop: 4,
            boxShadow: cfg.ring ? `0 0 0 4px ${cfg.ring}` : undefined,
          }}
        >
          {/* Pulse ring for active */}
          {cfg.pulse && (
            <>
              <style>{`
                @keyframes tl-pulse {
                  0%, 100% { opacity: 0.6; transform: scale(1); }
                  50%       { opacity: 0;   transform: scale(2.2); }
                }
              `}</style>
              <span
                style={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '50%',
                  border: `1.5px solid ${cfg.color}`,
                  animation: 'tl-pulse 2s ease-in-out infinite',
                  pointerEvents: 'none',
                }}
              />
            </>
          )}
        </div>

        {/* Vertical connector line */}
        {!isLast && (
          <div
            style={{
              flex: 1,
              width: 1,
              background: 'var(--border-subtle)',
              marginTop: 4,
            }}
          />
        )}
      </div>

      {/* ── Right column: content ── */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: 2 }}>
        {/* Title row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: event.description || event.meta ? 4 : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text-primary)',
                lineHeight: 1.3,
              }}
            >
              {event.title}
            </span>
            {event.badge && (
              <BadgePill label={event.badge} status={event.status} />
            )}
          </div>
          {/* Date — top right */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-tertiary)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            {event.date}
          </span>
        </div>

        {/* Description */}
        {event.description && (
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: event.meta ? 4 : 0,
            }}
          >
            {event.description}
          </p>
        )}

        {/* Meta */}
        {event.meta && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-tertiary)',
              lineHeight: 1.4,
            }}
          >
            {event.meta}
          </span>
        )}
      </div>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────── */

export function Timeline({ events, compact = false, animated = false }: TimelineProps) {
  if (!events || events.length === 0) return null

  if (!animated) {
    return (
      <div>
        {events.map((event, idx) => (
          <EventRow
            key={event.id}
            event={event}
            isLast={idx === events.length - 1}
            compact={compact}
          />
        ))}
      </div>
    )
  }

  return (
    <AnimatePresence initial>
      <div>
        {events.map((event, idx) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.28,
              delay: idx * 0.06,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <EventRow
              event={event}
              isLast={idx === events.length - 1}
              compact={compact}
            />
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  )
}
