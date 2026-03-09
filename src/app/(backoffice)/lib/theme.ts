/**
 * Centralized backoffice theme tokens
 * Single source of truth — import from here instead of redefining T per file
 */
export const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    card: 'var(--bo-card)',
    border: 'var(--bo-border)',
    borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    textDim: 'var(--bo-text-dim)',
    accent: 'var(--bo-accent)',
    hover: 'var(--bo-hover)',
    shadow: 'var(--bo-shadow)',
}

/** Standard CTA button — solid accent, no gradients */
export const ctaColor = T.accent
export const ctaShadow = 'none'
/** @deprecated use ctaColor instead */
export const ctaGradient = T.accent

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
