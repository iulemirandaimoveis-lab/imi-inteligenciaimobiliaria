import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            // ============================================
            // CORES - COM PRIMARY DEFINIDO (FIX CRÍTICO)
            // ============================================
            colors: {
                // ── Brand primary (maps to CSS var for theme-aware) ──
                primary: 'var(--bo-accent)',
                'primary-dark': 'var(--gold-deep, #A8842A)',
                'primary-light': 'var(--gold-bright, #D4B86A)',

                // ── Gold scale ──
                gold: {
                    DEFAULT: 'var(--imi-gold-500, #B8943A)',
                    50:      'var(--imi-gold-50, #FAF4E4)',
                    100:     'var(--imi-gold-100, #F4EACC)',
                    200:     'var(--imi-gold-200, #E8D4A8)',
                    300:     'var(--imi-gold-300, #D8BC84)',
                    400:     'var(--imi-gold-400, #C9A660)',
                    500:     'var(--imi-gold-500, #B8943A)',
                    600:     'var(--imi-gold-600, #A07830)',
                    700:     'var(--imi-gold-700, #8A6820)',
                },

                // ── Navy scale ──
                navy: {
                    DEFAULT: 'var(--imi-navy-900, #0B1120)',
                    50:      'var(--imi-navy-50, #E4E8F2)',
                    100:     'var(--imi-navy-100, #B8C0DC)',
                    200:     'var(--imi-navy-200, #8C9CC8)',
                    300:     'var(--imi-navy-300, #6070A8)',
                    400:     'var(--imi-navy-400, #3D518A)',
                    500:     'var(--imi-navy-500, #253565)',
                    600:     'var(--imi-navy-600, #1D2B52)',
                    700:     'var(--imi-navy-700, #162040)',
                    800:     'var(--imi-navy-800, #101830)',
                    900:     'var(--imi-navy-900, #0B1120)',
                    950:     'var(--imi-navy-950, #05080F)',
                },

                // ── ACCENT (legacy compat) ──
                accent: {
                    50: 'var(--accent-50)',
                    100: 'var(--accent-100)',
                    200: 'var(--accent-200)',
                    300: 'var(--accent-300)',
                    400: 'var(--accent-400)',
                    500: 'var(--accent-500)',
                    600: 'var(--accent-600)',
                    700: 'var(--accent-700)',
                    800: 'var(--accent-800)',
                    900: 'var(--accent-900)',
                },

                // ── IMI Neutros (updated to warm palette) ──
                imi: {
                    50: 'var(--imi-50)',
                    100: 'var(--imi-100)',
                    200: 'var(--imi-200)',
                    300: 'var(--imi-300)',
                    400: 'var(--imi-400)',
                    500: 'var(--imi-500)',
                    600: 'var(--imi-600)',
                    700: 'var(--imi-700)',
                    800: 'var(--imi-800)',
                    900: 'var(--imi-900)',
                },

                // ── Backoffice semantic tokens ──
                'bo-bg':      'var(--bo-bg)',
                'bo-surface': 'var(--bo-surface)',
                'bo-elevated':'var(--bo-elevated)',
                'bo-card':    'var(--bo-card)',
                'bo-accent':  'var(--bo-accent)',
                'bo-text':    'var(--bo-text)',
                'bo-muted':   'var(--bo-text-muted)',
                'bo-border':  'var(--bo-border)',

                // BACKGROUNDS (mantém)
                'background-light': 'var(--imi-cream, #F8F6EE)',
                'background-dark': '#0B1120',
            },

            // ============================================
            // BORDER RADIUS - COM 3XL ADICIONADO (FIX)
            // ============================================
            borderRadius: {
                none:  '0',
                xs:    'var(--r-xs, 3px)',
                sm:    'var(--r-sm, 6px)',
                DEFAULT: 'var(--r-sm, 6px)',
                md:    'var(--r-md, 8px)',
                lg:    'var(--r-lg, 12px)',
                xl:    'var(--r-xl, 16px)',
                '2xl': 'var(--r-2xl, 24px)',
                '3xl': '24px',
                full:  '9999px',
                pill:  '9999px',
            },

            // ============================================
            // SPACING - GRID 8PT COM INTERMEDIÁRIOS (FIX)
            // ============================================
            spacing: {
                '0': '0px',
                '0.5': '4px',   // NOVO - granularidade 4px
                '1': '8px',
                '1.5': '12px',  // NOVO - granularidade 12px
                '2': '16px',
                '3': '24px',
                '4': '32px',
                '5': '40px',
                '6': '48px',
                '7': '56px',    // NOVO - valor intermediário
                '8': '64px',
                '10': '80px',
            },

            // ============================================
            // TIPOGRAFIA (mantém estrutura institucional)
            // ============================================
            fontFamily: {
                display:  ['var(--font-libre-baskerville)', 'Georgia', 'serif'],
                sans:     ['var(--font-figtree)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
                serif:    ['var(--font-libre-baskerville)', 'Georgia', 'serif'],
                mono:     ['var(--font-jetbrains-mono)', 'SF Mono', 'monospace'],
                ui:       ['var(--font-figtree)', 'system-ui', 'sans-serif'],
            },
            fontSize: {
                xs: ['12px', { lineHeight: '16px', letterSpacing: '0' }],
                sm: ['14px', { lineHeight: '20px', letterSpacing: '0' }],
                base: ['16px', { lineHeight: '24px', letterSpacing: '0' }],
                lg: ['18px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
                xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
                '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
                '3xl': ['28px', { lineHeight: '36px', letterSpacing: '-0.01em' }],
                '4xl': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em' }],
            },

            fontWeight: {
                normal: '400',
                medium: '500',
                semibold: '600',
                bold: '700',
            },

            // ============================================
            // BOX SHADOW - PROFUNDIDADE SUTIL (mantém)
            // ============================================
            boxShadow: {
                xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
                sm: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                md: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                lg: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
                xl: '0 20px 25px -5px rgba(0, 0, 0, 0.04), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
                none: 'none',
            },

            // ============================================
            // TRANSIÇÕES (mantém)
            // ============================================
            transitionDuration: {
                '150': '150ms',
                '200': '200ms',
                '300': '300ms',
                '400': '400ms',
            },

            transitionTimingFunction: {
                smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
            },

            // ============================================
            // ANIMATIONS (mantém + adiciona)
            // ============================================
            keyframes: {
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'slide-up': {
                    '0%': { transform: 'translateY(8px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'slide-down': {
                    '0%': { transform: 'translateY(-8px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'scale-in': {
                    '0%': { transform: 'scale(0.96)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                shimmer: {
                    '100%': { transform: 'translateX(100%)' },
                },
            },

            animation: {
                'fade-in': 'fade-in 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                'slide-up': 'slide-up 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                'slide-down': 'slide-down 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                'scale-in': 'scale-in 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                shimmer: 'shimmer 2s infinite',
            },

            // ============================================
            // Z-INDEX HIERARQUIA (mantém)
            // ============================================
            zIndex: {
                '0': '0',
                '10': '10',
                '20': '20',
                '30': '30',
                '40': '40',
                '50': '50',
                '60': '60',
                '70': '70',
                '80': '80',
            },

            // ============================================
            // HEIGHTS PADRONIZADOS (mantém)
            // ============================================
            height: {
                'btn-sm': '40px',
                'btn': '48px',
                'btn-lg': '56px',
                'input-sm': '40px',
                'input': '48px',
                'input-lg': '56px',
            },

            // ============================================
            // MAX WIDTH (mantém)
            // ============================================
            maxWidth: {
                'screen-2xl': '1536px',
                container: '1440px',
            },

            // ============================================
            // CONTAINER (mantém)
            // ============================================
            container: {
                center: true,
                padding: {
                    DEFAULT: '1rem',
                    sm: '1.5rem',
                    lg: '2rem',
                },
            },
        },
    },
    plugins: [],
}

export default config
