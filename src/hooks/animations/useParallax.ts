'use client'

import { useRef, useEffect } from 'react'
import { ANIMATION_TOKENS } from '@/lib/animation-tokens'

interface ParallaxOptions {
  speed?: number
  direction?: 'y' | 'x'
}

/**
 * Parallax hook per element.
 * Usage: const ref = useParallax({ speed: 0.5 })
 *        <img ref={ref} src="..." />
 */
export function useParallax(options: ParallaxOptions = {}) {
  const {
    speed = ANIMATION_TOKENS.parallax.normal,
    direction = 'y',
  } = options

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || typeof window === 'undefined') return

    // Skip parallax on mobile
    if (window.innerWidth < 768) return

    import('@/lib/gsap-config').then(({ gsap }) => {
      if (!ref.current) return

      const distance = speed * 100

      gsap.fromTo(
        ref.current,
        { [direction]: -distance },
        {
          [direction]: distance,
          ease: 'none',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        }
      )
    })
  }, [speed, direction])

  return ref
}
