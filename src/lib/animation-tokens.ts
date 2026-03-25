// IMI Animation Tokens — Centralized animation values
// Every animation hook/component MUST import from here.

export const ANIMATION_TOKENS = {
  // ─── TIMING ───
  duration: {
    instant: 0.15,
    fast: 0.3,
    normal: 0.6,
    slow: 1.0,
    dramatic: 1.5,
  },

  // ─── STAGGER ───
  stagger: {
    tight: 0.03,
    normal: 0.08,
    relaxed: 0.15,
    dramatic: 0.25,
  },

  // ─── DISTANCES ───
  distance: {
    subtle: 20,
    normal: 60,
    dramatic: 120,
  },

  // ─── EASING ───
  ease: {
    smooth: 'power2.out',
    dramatic: 'power3.out',
    reveal: 'power4.out',
    bounce: 'back.out(1.2)',
    linear: 'none',
  },

  // ─── SCROLL TRIGGER DEFAULTS ───
  scrollTrigger: {
    startDefault: 'top 85%',
    startEarly: 'top 95%',
    startLate: 'top 70%',
  },

  // ─── PARALLAX SPEEDS ───
  parallax: {
    subtle: 0.3,
    normal: 0.5,
    strong: 0.8,
    inverse: -0.3,
  },

  // ─── BREAKPOINTS ───
  breakpoints: {
    mobile: '(max-width: 767px)',
    tablet: '(min-width: 768px) and (max-width: 1023px)',
    desktop: '(min-width: 1024px)',
    wide: '(min-width: 1440px)',
  },
} as const

export type AnimationTokens = typeof ANIMATION_TOKENS
