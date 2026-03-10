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
    accentBg: 'var(--bo-active-bg)',
    activeBg: 'var(--bo-active-bg)',
    gold: 'var(--bo-accent)',
    // States
    hover: 'var(--bo-hover)',
    shadow: 'var(--bo-shadow)',
    // Semantic colors
    success: '#34d399',
    successBg: 'rgba(52,211,153,0.10)',
    error: '#f87171',
    errorBg: 'rgba(248,113,113,0.08)',
}

/** Standard CTA button — solid accent, no gradients */
export const ctaColor = T.accent
export const ctaShadow = 'none'

/** Common inline styles */
export const cardStyle = {
    background: T.elevated,
    border: `1px solid ${T.border}`,
    borderRadius: '16px',
}

export const inputStyle = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    color: T.text,
    outline: 'none',
}
