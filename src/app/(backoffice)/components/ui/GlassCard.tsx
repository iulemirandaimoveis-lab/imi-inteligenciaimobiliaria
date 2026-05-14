'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GlassCardProps {
    children: ReactNode
    variant?: 'default' | 'metric' | 'action'
    hover?: boolean
    glow?: boolean
    className?: string
    onClick?: () => void
    style?: React.CSSProperties
}

export default function GlassCard({
    children,
    variant = 'default',
    hover = true,
    glow = false,
    className = '',
    onClick,
    style,
}: GlassCardProps) {
    const baseStyle: React.CSSProperties = {
        background: 'var(--glass-surface)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-surface-border)',
        borderRadius: 16,
        boxShadow: 'var(--glass-surface-shadow)',
        transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        overflow: 'hidden',
        ...style,
    }

    if (variant === 'metric') {
        baseStyle.borderColor = 'var(--glass-hover-border)'
    }

    if (glow) {
        baseStyle.boxShadow = '0 0 30px rgba(200,164,74,0.2), 0 0 60px rgba(200,164,74,0.1), 0 1px 3px rgba(0,0,0,0.35)'
    }

    return (
        <motion.div
            className={className}
            style={baseStyle}
            onClick={onClick}
            whileHover={hover ? {
                y: -2,
                borderColor: 'var(--glass-hover-border)',
                boxShadow: 'var(--shadow-lg)',
            } : undefined}
            transition={{ duration: 0.2 }}
        >
            {children}
        </motion.div>
    )
}
