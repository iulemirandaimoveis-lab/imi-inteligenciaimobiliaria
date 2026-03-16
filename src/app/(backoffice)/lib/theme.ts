/**
 * Centralized backoffice theme tokens — IMI Design System v3
 * Single source of truth — import from here instead of redefining T per file
 * Maps to CSS variables defined in globals.css
 */
export const T = {
    // Layout
    bg: 'transparent',
    base: 'var(--bg-base)',
    surface: 'var(--bg-surface)',
    surfaceAlt: 'var(--bg-subtle)',
    elevated: 'var(--bg-elevated)',
    subtle: 'var(--bg-subtle)',
    muted: 'var(--bg-muted)',
    overlay: 'var(--bg-overlay)',
    card: 'var(--bo-card)',
    // Borders
    border: 'var(--border-default)',
    borderLight: 'var(--border-subtle)',
    borderSubtle: 'var(--border-subtle)',
    borderStrong: 'var(--border-strong)',
    borderGold: 'var(--bo-border-gold)',
    borderActive: 'var(--bo-border-gold)',
    borderFocus: 'var(--border-focus)',
    // Text — DS3 semantic
    text: 'var(--text-primary)',
    textMuted: 'var(--text-secondary)',
    textDim: 'var(--text-tertiary)',
    textTertiary: 'var(--text-tertiary)',
    textDisabled: 'var(--text-disabled)',
    textGold: 'var(--text-gold)',
    textInverse: 'var(--text-inverse)',
    // Aliases (for legacy compat)
    sub: 'var(--text-secondary)',
    // Accent
    accent: 'var(--bo-accent)',
    accentDim: 'var(--bo-accent-dim)',
    accentBg: 'var(--bg-active)',
    activeBg: 'var(--bg-active)',
    gold: 'var(--imi-gold-500)',
    // States
    hover: 'var(--bg-hover)',
    active: 'var(--bg-active)',
    shadow: 'var(--shadow-sm)',
    // Semantic colors — DS3 tokens
    success: 'var(--success)',
    successBg: 'var(--success-bg)',
    warning: 'var(--warning)',
    warningBg: 'var(--warning-bg)',
    error: 'var(--error)',
    errorBg: 'var(--error-bg)',
    info: 'var(--info)',
    infoBg: 'var(--info-bg)',
    // Radius — DS3 scale
    radius: {
        xs: 'var(--r-xs, 3px)',
        sm: 'var(--r-sm, 6px)',
        md: 'var(--r-md, 8px)',
        lg: 'var(--r-lg, 12px)',
        xl: 'var(--r-xl, 16px)',
        '2xl': 'var(--r-2xl, 24px)',
        full: '9999px',
    },
    // Shadow — DS3 depth scale
    shadowXs: 'var(--shadow-xs)',
    shadowSm: 'var(--shadow-sm)',
    shadowMd: 'var(--shadow-md)',
    shadowLg: 'var(--shadow-lg)',
    shadowXl: 'var(--shadow-xl)',
    shadowGold: 'var(--shadow-gold)',
    cardShadow: 'var(--shadow-md)',
    // Transition — DS3 motion
    transition: {
        fast: 'var(--dur-1) var(--ease)',
        normal: 'var(--dur-2) var(--ease)',
        slow: 'var(--dur-3) var(--ease)',
        spring: 'var(--dur-3) var(--ease-spring)',
    },
    // Duration
    dur: { micro: 'var(--dur-1)', fast: 'var(--dur-2)', normal: 'var(--dur-3)', slow: 'var(--dur-4)' },
    // Easing
    ease: { default: 'var(--ease)', spring: 'var(--ease-spring)', out: 'var(--ease-out)' },
    // Font families
    font: {
        serif: 'var(--font-serif)',
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
    },
}

/** Standard CTA button — solid accent, no gradients */
export const ctaColor = T.accent
export const ctaShadow = 'none'

/** Common inline styles — DS3 */
export const cardStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--r-xl, 16px)',
    boxShadow: 'var(--shadow-xs)',
}

export const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 40,
    padding: '0 14px',
    background: 'var(--bg-surface)',
    border: '1.5px solid var(--border-default)',
    borderRadius: 'var(--r-md, 8px)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: 14,
    outline: 'none',
    transition: 'all var(--dur-2) var(--ease)',
}

// Importar React para CSSProperties
import type React from 'react'
