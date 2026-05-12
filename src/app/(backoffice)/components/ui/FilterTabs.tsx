'use client'

import React, { useRef, useState } from 'react'

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
  const [pressedId, setPressedId] = useState<string | null>(null)

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
        const isPressed = pressedId === tab.id

        // Inverted border behavior: border lit by default, dims on press
        const borderColor = isActive
          ? 'var(--platinum-400)'
          : isPressed
            ? 'rgba(200,164,74,0.12)'
            : 'rgba(200,164,74,0.45)'

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            onMouseDown={() => setPressedId(tab.id)}
            onMouseUp={() => setPressedId(null)}
            onMouseLeave={() => setPressedId(null)}
            onTouchStart={() => setPressedId(tab.id)}
            onTouchEnd={() => setPressedId(null)}
            className="flex-shrink-0 flex items-center gap-1.5"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--r-chip, 6px)',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              fontWeight: isActive ? 600 : 500,
              border: `1px solid ${borderColor}`,
              background: isActive
                ? 'rgba(61,111,255,0.10)'
                : isPressed
                  ? 'rgba(200,164,74,0.04)'
                  : 'transparent',
              color: isActive ? 'var(--accent-400)' : 'var(--text-secondary)',
              transition: 'border-color var(--dur-2, 200ms) var(--ease), background var(--dur-2, 200ms) var(--ease)',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              minHeight: '32px',
              opacity: isPressed && !isActive ? 0.75 : 1,
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
                  boxShadow: isPressed ? 'none' : `0 0 5px ${tab.dotColor}`,
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
                  background: isActive ? 'rgba(61,111,255,0.12)' : 'var(--bg-muted)',
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
