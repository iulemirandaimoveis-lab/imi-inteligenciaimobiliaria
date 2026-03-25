'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ANIMATION_TOKENS } from './animation-tokens'

// Register plugins ONCE, globally
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)

  // Global defaults
  gsap.defaults({
    ease: ANIMATION_TOKENS.ease.smooth,
    duration: ANIMATION_TOKENS.duration.normal,
  })

  // Respect prefers-reduced-motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) {
    gsap.globalTimeline.timeScale(100)
  }
}

export { gsap, ScrollTrigger }
