/**
 * Centralized backoffice theme tokens
 * Single source of truth — import from here instead of redefining T per file
 */
export const T = {
    // Layout
    bg: 'transparent',
    surface: 'var(--bo-surface)',
    surfaceAlt: 'var(--bo-surface-alt)',
    elevated: 'var(--bo-elevated)',
    card: 'var(--bo-card)',
    // Borders
    border: 'var(--bo-border)',
    borderLight: 'var(--bo-border-light)',
    borderSubtle: 'var(--bo-border-subtle)',
    borderStrong: 'var(--bo-border-strong)',
    borderGold: 'var(--bo-border-gold)',
    borderActive: 'var(--bo-border-gold)',
    // Text
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    textDim: 'var(--bo-text-dim)',
    textTertiary: 'var(--bo-text-tertiary, var(--bo-text-muted))',
    // Aliases (for legacy compat)
    sub: 'var(--bo-text-muted)',
    // Accent
    accent: 'var(--bo-accent)',
    accentDim: 'var(--bo-accent-dim)',
    accentBg: 'var(--bo-active-bg)',
    activeBg: 'var(--bo-active-bg)',
    gold: 'var(--bo-accent)',
    // States
    hover: 'var(--bo-hover)',
    shadow: 'var(--bo-shadow)',
    // Semantic colors — CSS var with fallback
    success: 'var(--bo-success, #34d399)',
    successBg: 'var(--bo-success-bg, rgba(52,211,153,0.10))',
    warning: 'var(--bo-warning, #fbbf24)',
    warningBg: 'var(--bo-warning-bg, rgba(251,191,36,0.10))',
    error: 'var(--bo-error, #f87171)',
    errorBg: 'var(--bo-error-bg, rgba(248,113,113,0.08))',
    info: 'var(--bo-info, #60a5fa)',
    infoBg: 'var(--bo-info-bg, rgba(96,165,250,0.10))',
    // Radius — consistent rounding scale
    radius: { sm: '8px', md: '12px', lg: '16px', xl: '20px', full: '9999px' },
    // Shadow — layered depth scale
    shadowSm: '0 1px 2px rgba(0,0,0,0.05)',
    shadowMd: '0 4px 12px rgba(0,0,0,0.08)',
    shadowLg: '0 8px 24px rgba(0,0,0,0.12)',
    cardShadow: 'var(--bo-card-shadow)',
    // Transition — micro-interaction precision
    transition: { fast: '120ms ease', normal: '200ms ease', slow: '300ms ease' },
}

/** Standard CTA button — solid accent, no gradients */
export const ctaColor = T.accent
export const ctaShadow = 'none'

/** Common inline styles */
export const cardStyle = {
    background: T.elevated,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.lg,
}

export const inputStyle = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    color: T.text,
    outline: 'none',
    borderRadius: T.radius.md,
}
