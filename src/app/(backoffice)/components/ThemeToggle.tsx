'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function ThemeToggle({ size = 'md' }: { size?: 'sm' | 'md' }) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    // Render placeholder to prevent layout shift
    if (!mounted) return (
        <div
            className={size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'}
            style={{ flexShrink: 0 }}
        />
    )

    const isDark = theme === 'dark'

    return (
        <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`flex items-center justify-center rounded-xl transition-all ${size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'}`}
            style={{
                background: 'transparent',
                border: '1px solid transparent',
                color: 'var(--bo-text-muted)',
            }}
            title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        >
            <motion.div
                key={isDark ? 'sun' : 'moon'}
                initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
                transition={{ duration: 0.2 }}
            >
                {isDark ? (
                    <Sun size={size === 'sm' ? 15 : 16} />
                ) : (
                    <Moon size={size === 'sm' ? 15 : 16} />
                )}
            </motion.div>
        </motion.button>
    )
}
