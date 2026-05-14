'use client'

import { useTheme } from 'next-themes'
import { Toaster } from 'sonner'

export function BackofficeToaster() {
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'

    return (
        <Toaster
            position="top-right"
            closeButton
            theme={isDark ? 'dark' : 'light'}
            offset={72}
            toastOptions={{
                duration: 4000,
                style: {
                    background: isDark ? 'var(--imi-navy-900, #0B1120)' : 'var(--bg-surface, #FFFFFF)',
                    border: `1px solid ${isDark ? 'var(--imi-gold-700, #8A6820)' : 'var(--border-default, rgba(11,17,32,0.12))'}`,
                    borderLeft: '3px solid var(--imi-gold-500, #B8943A)',
                    color: isDark ? 'var(--imi-gold-100, #F4EACC)' : 'var(--text-primary, #0B1120)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px',
                    borderRadius: 'var(--r-lg, 14px)',
                    boxShadow: isDark
                        ? '0 10px 25px -5px rgba(11, 17, 32, 0.5), 0 0 15px -3px rgba(200, 164, 74, 0.1)'
                        : '0 4px 16px rgba(0,0,0,0.08)',
                },
                classNames: {
                    success: 'imi-toast-success',
                    error: 'imi-toast-error',
                    info: 'imi-toast-info',
                    closeButton: 'imi-toast-close',
                },
            }}
        />
    )
}
