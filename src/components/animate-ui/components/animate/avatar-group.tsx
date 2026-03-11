'use client'

/**
 * animate-ui compatible AvatarGroup
 * API matches https://animate-ui.com/docs/components/animate/avatar-group
 *
 * Usage:
 *   <AvatarGroup>
 *     {users.map(u => (
 *       <Avatar key={u.id} className="size-10 border-2" style={{ borderColor: 'var(--bo-surface)' }}>
 *         <AvatarImage src={u.avatar_url} />
 *         <AvatarFallback>{initials(u.name)}</AvatarFallback>
 *         <AvatarGroupTooltip>{u.name}</AvatarGroupTooltip>
 *       </Avatar>
 *     ))}
 *   </AvatarGroup>
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── AvatarGroupTooltip ────────────────────────────────────────────
// Marker component — never rendered directly.
// AvatarGroup extracts its children during render.
export function AvatarGroupTooltip({
  children,
  layout: _layout,
}: {
  children: React.ReactNode
  layout?: boolean | 'position' | 'size' | 'preserve-aspect'
}) {
  return null
}

// ── AvatarGroup ───────────────────────────────────────────────────
interface AvatarGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'translate'> {
  /** Mirror the overlap direction (leftmost on top vs rightmost on top) */
  invertOverlap?: boolean
  /** How much each avatar shifts left into the previous one. CSS value or px number. Default: '-10px' */
  translate?: string | number
  /** Framer Motion transition for scale animation */
  transition?: object
  /** Framer Motion transition for tooltip appear */
  tooltipTransition?: object
  /** Side tooltip appears on — 'top' | 'bottom'. Default: 'top' */
  side?: 'top' | 'bottom'
  sideOffset?: number
}

export function AvatarGroup({
  children,
  invertOverlap = false,
  translate = '-10px',
  transition = { type: 'spring', stiffness: 300, damping: 20 },
  tooltipTransition = { type: 'spring', stiffness: 300, damping: 35 },
  side = 'top',
  sideOffset = 8,
  className = '',
  style,
  ...props
}: AvatarGroupProps) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null)

  const items = React.Children.toArray(children)

  return (
    <div
      className={`flex items-center ${className}`}
      style={style}
      {...props}
    >
      {items.map((child, i) => {
        if (!React.isValidElement<any>(child)) return null

        // ── Extract AvatarGroupTooltip from Avatar's children ──
        let tooltipContent: React.ReactNode = null
        const cleanChildren: React.ReactNode[] = []

        React.Children.forEach(child.props.children as React.ReactNode, (c) => {
          if (
            React.isValidElement(c) &&
            (c.type as any) === AvatarGroupTooltip
          ) {
            tooltipContent = (c.props as any).children
          } else {
            cleanChildren.push(c)
          }
        })

        const isHovered = hoveredIdx === i
        const zIndex = isHovered ? 50 : invertOverlap ? i : items.length - i

        const translateVal =
          typeof translate === 'number' ? `${translate}px` : translate

        return (
          <motion.div
            key={i}
            className="relative"
            style={{
              marginLeft: i === 0 ? 0 : translateVal,
              zIndex,
            }}
            animate={{ scale: isHovered ? 1.14 : 1 }}
            transition={transition as any}
            onHoverStart={() => setHoveredIdx(i)}
            onHoverEnd={() => setHoveredIdx(null)}
          >
            {/* Avatar without the tooltip marker */}
            {React.cloneElement(child, { children: cleanChildren })}

            {/* Tooltip */}
            <AnimatePresence>
              {isHovered && tooltipContent && (
                <motion.div
                  initial={{ opacity: 0, y: side === 'top' ? 8 : -8, scale: 0.88 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: side === 'top' ? 6 : -6, scale: 0.92 }}
                  transition={tooltipTransition as any}
                  className="absolute pointer-events-none"
                  style={{
                    [side === 'top' ? 'bottom' : 'top']: `calc(100% + ${sideOffset}px)`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 100,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(10,14,20,0.92)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      borderRadius: '10px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.92)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.50)',
                    }}
                  >
                    {tooltipContent}
                  </div>
                  {/* Arrow */}
                  <div
                    style={{
                      position: 'absolute',
                      [side === 'top' ? 'top' : 'bottom']: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      ...(side === 'top'
                        ? { borderTop: '5px solid rgba(10,14,20,0.92)' }
                        : { borderBottom: '5px solid rgba(10,14,20,0.92)' }),
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
