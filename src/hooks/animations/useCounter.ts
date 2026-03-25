'use client'

import { useRef, useEffect } from 'react'

interface CounterOptions {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  separator?: string
}

/**
 * Animated counter hook.
 * Usage: const ref = useCounter({ end: 2500, suffix: '+', prefix: 'R$' })
 *        <span ref={ref}>0</span>
 */
export function useCounter(options: CounterOptions) {
  const {
    end,
    duration = 2,
    prefix = '',
    suffix = '',
    decimals = 0,
    separator = '.',
  } = options

  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ref.current || typeof window === 'undefined') return

    // Set accessible value immediately
    ref.current.setAttribute('aria-label', `${prefix}${end}${suffix}`)

    import('@/lib/gsap-config').then(({ gsap, ScrollTrigger }) => {
      if (!ref.current) return

      const obj = { value: 0 }

      gsap.to(obj, {
        value: end,
        duration,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        onUpdate: () => {
          if (ref.current) {
            ref.current.textContent =
              prefix +
              obj.value
                .toFixed(decimals)
                .replace(/\B(?=(\d{3})+(?!\d))/g, separator) +
              suffix
          }
        },
      })
    })
  }, [end, duration, prefix, suffix, decimals, separator])

  return ref
}
