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
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: isActive ? 700 : 600,
              border: `1px solid ${isActive ? 'var(--imi-blue-border)' : 'var(--bo-border)'}`,
              background: isActive
                ? 'var(--imi-blue-dim)'
                : 'transparent',
              color: isActive ? 'var(--imi-blue-bright)' : 'var(--bo-text-muted)',
              transition: 'all 0.18s ease',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              minHeight: '32px',
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
                  fontSize: '10px',
                  fontWeight: 700,
                  background: isActive ? 'var(--imi-blue-dim)' : 'rgba(255,255,255,0.07)',
                  color: isActive ? 'var(--imi-blue-bright)' : 'var(--bo-text-muted)',
                  padding: '0px 5px',
                  borderRadius: '8px',
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
