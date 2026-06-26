/**
 * IMI Console design tokens.
 *
 * Visual language: Apple HIG spacing + Linear/Stripe/Vercel restraint +
 * discreet institutional luxury. Deep navy canvas, single gold accent,
 * subtle glassmorphism, soft shadows, consistent radius.
 *
 * Self-contained (no theme import) so the /users area renders identically
 * regardless of the surrounding app theme.
 */
export const tokens = {
  // Canvas
  bg: '#070C14',
  bgElevated: '#0B1220',
  bgDeep: '#050A12',

  // Glass surfaces
  glass: 'rgba(20, 30, 48, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.07)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.12)',
  glassHover: 'rgba(28, 40, 62, 0.7)',

  // Accent (single, discreet gold)
  gold: '#C8A44A',
  goldSoft: 'rgba(200, 164, 74, 0.10)',
  goldBorder: 'rgba(200, 164, 74, 0.28)',
  goldGlow: 'rgba(200, 164, 74, 0.18)',

  // Text
  t1: '#F4F2EC', // primary
  t2: '#AEB6C2', // secondary
  t3: '#6B7686', // muted
  t4: '#47505E', // faint

  // Semantic
  green: '#34D399',
  greenSoft: 'rgba(52, 211, 153, 0.10)',
  greenBorder: 'rgba(52, 211, 153, 0.22)',
  amber: '#FBBF24',
  amberSoft: 'rgba(251, 191, 36, 0.10)',
  blue: '#60A5FA',
  blueSoft: 'rgba(96, 165, 250, 0.10)',
  red: '#F87171',
  redSoft: 'rgba(248, 113, 113, 0.10)',
  redBorder: 'rgba(248, 113, 113, 0.20)',

  // Radius (consistent)
  rSm: '10px',
  rMd: '14px',
  rLg: '20px',
  rXl: '28px',

  // Shadows (soft)
  shadowSoft: '0 1px 2px rgba(0,0,0,0.3)',
  shadowCard: '0 8px 30px rgba(0,0,0,0.35)',
  shadowOverlay: '0 20px 60px rgba(0,0,0,0.5)',

  // Type
  fSans: "var(--font-sans, 'Geist', system-ui, sans-serif)",
  fSerif: "'Playfair Display', Georgia, serif",
  fMono: "var(--font-mono, 'Geist Mono', ui-monospace, monospace)",

  // Motion
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  dur: '220ms',
} as const

export type Tokens = typeof tokens
