/**
 * IMI Design System v3.1 — Motion Configuration
 * Centralized animation config for Framer Motion
 * Import from here instead of defining transitions per component
 */

// Standard transition presets
export const transitions = {
  fast:    { duration: 0.15, ease: 'easeOut' as const },
  medium:  { duration: 0.30, ease: 'easeOut' as const },
  slow:    { duration: 0.50, ease: [0.16, 1, 0.3, 1] as const },
  counter: { duration: 0.80, ease: 'easeOut' as const },
}

// Card entrance variants
export const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: transitions.medium },
}

// Container with stagger for groups of cards
export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}

// Fade in from below (generic)
export const fadeInUp = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitions.medium },
}

// Scale in (for modals, dialogs)
export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: transitions.medium },
}
