/**
 * Centralized backoffice theme tokens — IMI MASTER v2
 * Single source of truth — import from here instead of redefining T per file
 * Maps to CSS variables defined in globals.css
 */
export const T = {
    // Layout
    bg: 'transparent',
    base: 'var(--bg, #050B14)',
    surface: 'var(--n, #0A1624)',
    surfaceAlt: 'var(--n2, #0E1C30)',
    elevated: 'var(--n2, #0E1C30)',
    subtle: 'var(--n2, #0E1C30)',
    muted: 'var(--bg-muted)',
    overlay: 'var(--bg-overlay)',
    card: 'var(--n, #0A1624)',
    // Borders
    border: 'var(--bdg, rgba(200,164,74,.14))',
    borderLight: 'var(--bdr, rgba(255,255,255,.05))',
    borderSubtle: 'var(--bdr, rgba(255,255,255,.05))',
    borderStrong: 'var(--bdg, rgba(200,164,74,.14))',
    borderGold: 'var(--bdg, rgba(200,164,74,.14))',
    borderActive: 'var(--bdg, rgba(200,164,74,.14))',
    borderFocus: 'var(--border-focus)',
    // Text — MASTER v2 semantic
    text: 'var(--t1, #E8E4DC)',
    textMuted: 'var(--t2, #8E99AB)',
    textDim: 'var(--t3, #4F5B6B)',
    textTertiary: 'var(--t3, #4F5B6B)',
    textDisabled: 'var(--text-disabled)',
    textGold: 'var(--gold, #C8A44A)',
    textInverse: 'var(--text-inverse)',
    // Aliases (for legacy compat)
    sub: 'var(--t2, #8E99AB)',
    // Accent
    accent: 'var(--gold, #C8A44A)',
    accentDim: 'rgba(200,164,74,0.6)',
    accentBg: 'var(--g10, rgba(200,164,74,.10))',
    activeBg: 'var(--g10, rgba(200,164,74,.10))',
    gold: 'var(--gold, #C8A44A)',
    // States
    hover: 'var(--g06, rgba(200,164,74,.06))',
    active: 'var(--g10, rgba(200,164,74,.10))',
    shadow: 'var(--shadow-sm)',
    // Semantic colors
    success: 'var(--success)',
    successBg: 'var(--success-bg)',
    warning: 'var(--warning)',
    warningBg: 'var(--warning-bg)',
    error: 'var(--error)',
    errorBg: 'var(--error-bg)',
    info: 'var(--info)',
    infoBg: 'var(--info-bg)',
    // Radius
    radius: {
        xs: 'var(--r-xs, 4px)',
        sm: 'var(--r-sm, 4px)',
        md: 'var(--r-md, 4px)',
        lg: 'var(--r-lg, 4px)',
        xl: 'var(--r-xl, 4px)',
        '2xl': 'var(--r-2xl, 4px)',
        full: '9999px',
    },
    // Shadow
    shadowXs: 'var(--shadow-xs)',
    shadowSm: 'var(--shadow-sm)',
    shadowMd: 'var(--shadow-md)',
    shadowLg: 'var(--shadow-lg)',
    shadowXl: 'var(--shadow-xl)',
    shadowGold: 'var(--shadow-gold)',
    cardShadow: 'var(--shadow-md)',
    // Transition
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
    // Font families — MASTER v2 semantic roles
    font: {
        display: "var(--fd, 'Playfair Display', Georgia, serif)",
        serif: "var(--fd, 'Playfair Display', Georgia, serif)",
        sans: "var(--fu, 'Outfit', system-ui, sans-serif)",
        ui: "var(--fu, 'Outfit', system-ui, sans-serif)",
        data: "var(--fm, 'JetBrains Mono', monospace)",
        mono: "var(--fm, 'JetBrains Mono', monospace)",
    },
}

/** Standard CTA button — navy bg + gold gradient line (IMI Design System) */
export const ctaColor = 'var(--n, #0A1624)'
export const ctaShadow = 'none'

/** Common inline styles — MASTER v2 */
/** Glass card v3.2 */
export const cardStyle: React.CSSProperties = {
    background: 'rgba(14,28,48,.52)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(200,164,74,.12)',
    borderRadius: '10px',
    boxShadow: '0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.04)',
}

/** Glass card v3.2 hover border */
export const cardHoverBorder = 'rgba(200,164,74,.30)'

export const inputStyle: React.CSSProperties = {
    background: 'rgba(20,36,64,.4)',
    border: '1px solid var(--bdg, rgba(200,164,74,.14))',
    color: 'var(--t1, #E8E4DC)',
    padding: '10px 14px',
    fontFamily: "var(--fu, 'Outfit', system-ui, sans-serif)",
    fontSize: 11,
    borderRadius: 8,
    outline: 'none',
    width: '100%',
}

// Importar React para CSSProperties
import type React from 'react'
