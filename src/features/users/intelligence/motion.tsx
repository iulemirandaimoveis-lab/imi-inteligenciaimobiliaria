'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useInView } from 'framer-motion'
import { tokens as T } from '../ui/tokens'

/**
 * Motion system for the IMI Intelligence layer.
 * Restrained, Apple-Intelligence-grade: animated numbers, contextual reveals,
 * premium skeletons. Never gamer-like.
 */

const EASE = [0.22, 1, 0.36, 1] as const

/** Count-up number that animates when scrolled into view. */
export function AnimatedNumber({
  value,
  format,
  duration = 1.2,
  className,
  style,
}: {
  value: number
  format?: (n: number) => string
  duration?: number
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(format ? format(v) : Math.round(v).toLocaleString('pt-BR')),
    })
    return () => controls.stop()
  }, [inView, value, duration, format])

  return (
    <span ref={ref} className={className} style={style}>
      {display}
    </span>
  )
}

/** Contextual reveal: fade + rise as the element enters the viewport. */
export function Reveal({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/** Staggered container — children fade in one after another. */
export function Stagger({ children, style, className }: { children: ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-30px' }}
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, style, className }: { children: ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } }}
    >
      {children}
    </motion.div>
  )
}

/** Premium shimmer skeleton block. */
export function Skeleton({ height = 16, width = '100%', radius = 8 }: { height?: number; width?: number | string; radius?: number }) {
  return (
    <span
      style={{
        display: 'block',
        height,
        width,
        borderRadius: radius,
        background: `linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 37%, rgba(255,255,255,0.04) 63%)`,
        backgroundSize: '400% 100%',
        animation: 'imiShimmer 1.4s ease infinite',
      }}
    />
  )
}

/** Soft live pulse used by the realtime activity center. */
export function ActivityPulse({ color = T.gold }: { color?: string }) {
  return (
    <motion.span
      style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }}
      animate={{ scale: [1, 1.35, 1], opacity: [1, 0.6, 1] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}
