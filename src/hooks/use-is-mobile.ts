'use client'
import { useState, useLayoutEffect } from 'react'

/**
 * Returns true when viewport width is below the given breakpoint.
 * Uses useLayoutEffect + matchMedia to avoid the hydration flash —
 * the correct value is set synchronously before the first paint.
 * Defaults to false on SSR (no window available).
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useLayoutEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}
