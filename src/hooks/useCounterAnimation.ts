'use client'

import { useEffect, useRef, useState } from 'react'

interface Options {
  duration?: number  // in ms, default 800
  start?: number     // initial value, default 0
}

/**
 * Animated counter hook — DS3.1
 * Counts from `start` to `end` with easeOut cubic easing.
 * Usage: const displayed = useCounterAnimation(27)
 */
export function useCounterAnimation(end: number, options: Options = {}) {
  const { duration = 800, start = 0 } = options
  const [count, setCount] = useState(start)
  const rafRef = useRef<number>()
  const startTimeRef = useRef<number>()

  useEffect(() => {
    startTimeRef.current = undefined

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      // easeOut cubic: decelerates at the end
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(start + (end - start) * eased))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [end, start, duration])

  return count
}
