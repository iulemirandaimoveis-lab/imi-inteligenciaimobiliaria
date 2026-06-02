'use client'

import React, { useRef } from 'react'

export interface FilterTab {
  id: string
  label: string
  count?: number
  dotColor?: string   // CSS color string for the dot indicator
}

interface FilterTabsProps {
  tabs: FilterTab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function FilterTabs({ tabs, active, onChange, className = '' }: FilterTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={scrollRef}
      className={`flex gap-2 overflow-x-auto ${className}`}
      style={{
        scrollbarWidth: 'none',
        paddingBottom: '2px',
        width: '100%',
        maxWidth: '100%',
        position: 'relative',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex-shrink-0 flex items-center gap-1.5"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--r-chip, 6px)',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              fontWeight: isActive ? 600 : 500,
              border: `1px solid ${isActive ? 'var(--border-gold, rgba(200,164,74,.35))' : 'var(--border-subtle)'}`,
              background: isActive
                ? 'var(--bg-active)'
                : 'transparent',
              color: isActive ? 'var(--accent-400)' : 'var(--text-secondary)',
              transition: 'all var(--dur-2, 200ms) var(--ease)',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              minHeight: '32px',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--bg-hover)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            {tab.dotColor && (
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: tab.dotColor,
                  display: 'inline-block',
                  flexShrink: 0,
                  boxShadow: `0 0 5px ${tab.dotColor}`,
                }}
              />
            )}
            {tab.label}
            {tab.count !== undefined && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: isActive ? 'var(--bg-active)' : 'var(--bg-muted)',
                  color: isActive ? 'var(--accent-400)' : 'var(--text-secondary)',
                  padding: '0px 5px',
                  borderRadius: '6px',
                  lineHeight: '16px',
                  minWidth: '18px',
                  textAlign: 'center',
                  display: 'inline-block',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
