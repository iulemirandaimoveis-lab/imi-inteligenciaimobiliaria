'use client'

import { useRef, useEffect } from 'react'
import { ANIMATION_TOKENS } from '@/lib/animation-tokens'

interface RevealOptions {
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
  duration?: number
  delay?: number
  start?: string
  stagger?: number
}

/**
 * Generic reveal-on-scroll hook.
 * Usage: const ref = useReveal({ direction: 'up', stagger: 0.1 })
 *        <div ref={ref}>...</div>
 */
export function useReveal(options: RevealOptions = {}) {
  const {
    direction = 'up',
    distance = ANIMATION_TOKENS.distance.normal,
    duration = ANIMATION_TOKENS.duration.slow,
    delay = 0,
    start = ANIMATION_TOKENS.scrollTrigger.startDefault,
    stagger = 0,
  } = options

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || typeof window === 'undefined') return

    // Dynamically import GSAP to avoid SSR issues
    import('@/lib/gsap-config').then(({ gsap, ScrollTrigger }) => {
      if (!ref.current) return

      const fromVars: Record<string, number> = { opacity: 0 }
      if (direction === 'up') fromVars.y = distance
      if (direction === 'down') fromVars.y = -distance
      if (direction === 'left') fromVars.x = distance
      if (direction === 'right') fromVars.x = -distance

      const targets = stagger > 0 ? ref.current.children : ref.current

      gsap.from(targets, {
        ...fromVars,
        duration,
        delay,
        ease: ANIMATION_TOKENS.ease.smooth,
        stagger: stagger > 0 ? stagger : undefined,
        scrollTrigger: {
          trigger: ref.current,
          start,
          toggleActions: 'play none none reverse',
        },
      })
    })

    return () => {
      // Cleanup handled by ScrollTrigger route cleanup
    }
  }, [direction, distance, duration, delay, start, stagger])

  return ref
}
