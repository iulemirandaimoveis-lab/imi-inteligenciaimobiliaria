'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'

export interface ActionMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

export interface ActionMenuProps {
  items: ActionMenuItem[]
  className?: string
  size?: 'sm' | 'md'
}

export function ActionMenu({ items, className, size = 'md' }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const triggerSize = size === 'sm' ? 28 : 32
  const iconSize = size === 'sm' ? 16 : 18

  return (
    <div ref={containerRef} style={{ position: 'relative' }} className={className}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
        }}
        style={{
          width: triggerSize,
          height: triggerSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: T.radius.sm,
          color: T.textMuted,
          cursor: 'pointer',
          transition: `background ${T.transition.fast}, color ${T.transition.fast}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = T.hover
          e.currentTarget.style.color = T.text
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = T.textMuted
        }}
        aria-label="Abrir menu de ações"
        aria-expanded={open}
      >
        <MoreHorizontal size={iconSize} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            minWidth: 180,
            background: T.elevated,
            border: `1px solid ${T.border}`,
            borderRadius: T.radius.md,
            boxShadow: T.shadowLg,
            zIndex: 50,
            padding: '4px 0',
            overflow: 'hidden',
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              disabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation()
                if (item.disabled) return
                item.onClick()
                setOpen(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: item.variant === 'danger' ? T.error : T.text,
                fontSize: 14,
                lineHeight: '20px',
                cursor: item.disabled ? 'default' : 'pointer',
                opacity: item.disabled ? 0.5 : 1,
                pointerEvents: item.disabled ? 'none' : 'auto',
                textAlign: 'left',
                transition: `background ${T.transition.fast}`,
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) {
                  e.currentTarget.style.background = T.hover
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {item.icon && (
                <span style={{ display: 'flex', flexShrink: 0, width: 16, height: 16 }}>
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
