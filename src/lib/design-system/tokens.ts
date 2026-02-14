// lib/design-system/tokens.ts
// Sistema de Design IMI - Padrão Institucional Premium
// Aplique estes tokens em todos os componentes

/**
 * ESPAÇAMENTO - Regra Apple (múltiplos de 8px)
 * CRÍTICO: Nenhum espaçamento fora destes valores
 */
export const spacing = {
    '0': '0px',
    '0.5': '4px',    // Mini step (sub-multiple)
    '1': '8px',      // 1x 8px
    '2': '16px',     // 2x 8px
    '3': '24px',     // 3x 8px
    '4': '32px',     // 4x 8px
    '5': '40px',     // 5x 8px
    '6': '48px',     // 6x 8px
    '7': '56px',     // 7x 8px
    '8': '64px',     // 8x 8px
    '9': '72px',     // 9x 8px
    '10': '80px',    // 10x 8px
    '12': '96px',    // 12x 8px
    '16': '128px',   // 16x 8px
    '20': '160px',   // 20x 8px
} as const

/**
 * TIPOGRAFIA INSTITUCIONAL
 * Hierarquia clara, profissional, sem exageros
 */
export const typography = {
    // Display (Títulos principais de página)
    display: {
        fontSize: '32px',
        lineHeight: '40px',
        fontWeight: '700',
        letterSpacing: '-0.02em',
    },

    // Headings
    h1: {
        fontSize: '28px',
        lineHeight: '36px',
        fontWeight: '700',
        letterSpacing: '-0.01em',
    },
    h2: {
        fontSize: '24px',
        lineHeight: '32px',
        fontWeight: '700',
        letterSpacing: '-0.01em',
    },
    h3: {
        fontSize: '20px',
        lineHeight: '28px',
        fontWeight: '600',
        letterSpacing: '-0.01em',
    },
    h4: {
        fontSize: '16px',
        lineHeight: '24px',
        fontWeight: '600',
        letterSpacing: '0',
    },

    // Body
    bodyLarge: {
        fontSize: '16px',
        lineHeight: '24px',
        fontWeight: '400',
        letterSpacing: '0',
    },
    body: {
        fontSize: '14px',
        lineHeight: '20px',
        fontWeight: '400',
        letterSpacing: '0',
    },
    bodySmall: {
        fontSize: '13px',
        lineHeight: '18px',
        fontWeight: '400',
        letterSpacing: '0',
    },

    // Labels
    label: {
        fontSize: '14px',
        lineHeight: '20px',
        fontWeight: '500',
        letterSpacing: '0',
    },
    labelSmall: {
        fontSize: '12px',
        lineHeight: '16px',
        fontWeight: '500',
        letterSpacing: '0.01em',
    },

    // Captions
    caption: {
        fontSize: '12px',
        lineHeight: '16px',
        fontWeight: '400',
        letterSpacing: '0',
    },

    // Code/Números
    mono: {
        fontSize: '14px',
        lineHeight: '20px',
        fontWeight: '500',
        fontFamily: 'ui-monospace, monospace',
    },
} as const

/**
 * ELEVAÇÃO - Profundidade Sutil (não exagerada)
 */
export const elevation = {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.04), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
} as const

/**
 * BORDER RADIUS - Consistência Visual
 */
export const radius = {
    none: '0',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    full: '9999px',
} as const

/**
 * TRANSIÇÕES - Suaves e Profissionais
 * Usar cubic-bezier para movimento natural
 */
export const transition = {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slower: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const

/**
 * TAMANHOS DE COMPONENTES
 * Altura mínima de 48px para touch-friendly
 */
export const sizes = {
    button: {
        sm: { height: '40px', padding: '0 16px', fontSize: '14px' },
        md: { height: '48px', padding: '0 24px', fontSize: '14px' }, // Padrão
        lg: { height: '56px', padding: '0 32px', fontSize: '16px' },
    },
    input: {
        sm: { height: '40px', padding: '0 12px', fontSize: '14px' },
        md: { height: '48px', padding: '0 16px', fontSize: '14px' }, // Padrão
        lg: { height: '56px', padding: '0 16px', fontSize: '16px' },
    },
    icon: {
        sm: '16px',
        md: '20px',
        lg: '24px',
        xl: '32px',
    },
} as const

/**
 * Z-INDEX HIERARQUIA
 * Sistema organizado para evitar conflitos
 */
export const zIndex = {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    overlay: 40,
    modal: 50,
    popover: 60,
    toast: 70,
    tooltip: 80,
} as const

/**
 * BREAKPOINTS - Mobile First
 */
export const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
} as const

/**
 * GRID SYSTEM
 */
export const grid = {
    columns: 12,
    gutter: '24px',
    maxWidth: '1440px',
} as const

/**
 * INSTRUÇÕES DE USO:
 * 
 * 1. Importar os tokens:
 *    import { spacing, typography, elevation } from '@/lib/design-system/tokens'
 * 
 * 2. Usar no Tailwind (adicionar ao tailwind.config.js):
 *    spacing: { ...spacing }
 * 
 * 3. Usar inline:
 *    style={{ padding: spacing[3], fontSize: typography.h2.fontSize }}
 * 
 * 4. Criar classes utilitárias baseadas nestes valores
 */
