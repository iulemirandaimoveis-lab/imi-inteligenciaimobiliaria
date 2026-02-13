/** @type {import('tailwindcss').Config} */
const config = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Luxury Real Estate Palette
                primary: '#D4AF37', // Gold
                'primary-dark': '#B8952F', // Dark Gold
                'primary-light': '#E5C158', // Light Gold

                // Alias for user request 'accent-500'
                accent: {
                    50: '#FFF9E5',
                    100: '#FFEEB3',
                    200: '#FFE280',
                    300: '#E5C158',
                    400: '#D4AF37', // Gold
                    500: '#D4AF37', // Gold (Main)
                    600: '#B8952F',
                    700: '#8C7224',
                    800: '#614F19',
                    900: '#362C0E',
                },

                // Backgrounds
                'background-light': '#F8F9FA',
                'background-dark': '#0F1E28', // Deep Luxury Blue

                // Cards / Surfaces
                'card-light': '#FFFFFF',
                'card-dark': '#132742',
                'card-darker': '#0B1623',

                // Typography
                'text-header-light': '#0F1E28',
                'text-header-dark': '#F5F5F5',
                'text-body-light': '#4B5563',
                'text-body-dark': '#9CA3AF',

                // Borders
                'border-light': '#E5E7EB',
                'border-dark': '#1E3A5F',

                // IMI Specific
                'imi-blue': '#0F1E28', // Deepest Blue
                'imi-slate': '#1E293B',

                imi: {
                    50: '#F7F8FA',
                    100: '#ECEEF2',
                    200: '#D0D5DE',
                    300: '#A0AABB',
                    400: '#6B83A0',
                    500: '#59718C',
                    600: '#3C495D',
                    700: '#2E2E3A',
                    800: '#1F2937', // Refined
                    900: '#0F1E28', // Deepest
                },

                // Functional
                success: '#10B981',
                warning: '#F59E0B',
                error: '#EF4444',
                info: '#3B82F6',
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                display: ['var(--font-playfair)', 'Georgia', 'serif'],
            },
            fontSize: {
                'display-xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
                'display-lg': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
                'display-md': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
                'display-sm': ['2.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
            },
            spacing: {
                '18': '4.5rem',
                '22': '5.5rem',
                '26': '6.5rem',
                '30': '7.5rem',
            },
            maxWidth: {
                '8xl': '88rem',
                '9xl': '96rem',
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(15, 30, 40, 0.05)',
                'card': '0 2px 8px rgba(15, 30, 40, 0.04)',
                'card-hover': '0 10px 15px -3px rgba(15, 30, 40, 0.1), 0 4px 6px -4px rgba(15, 30, 40, 0.1)',
                'header': '0 1px 3px rgba(15, 30, 40, 0.05)',
                'elevated': '0 20px 25px -5px rgba(15, 30, 40, 0.1), 0 8px 10px -6px rgba(15, 30, 40, 0.1)',
                'glow': '0 0 15px rgba(212, 175, 55, 0.3)', // Gold glow
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-down': 'slideDown 0.5s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}

module.exports = config
