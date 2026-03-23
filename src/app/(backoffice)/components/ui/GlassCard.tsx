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
        background: 'rgba(15, 32, 53, 0.60)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(200, 164, 74, 0.15)',
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.25)',
        transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        overflow: 'hidden',
        ...style,
    }

    if (variant === 'metric') {
        baseStyle.borderColor = 'rgba(200, 164, 74, 0.25)'
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
                borderColor: 'rgba(200, 164, 74, 0.30)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3)',
            } : undefined}
            transition={{ duration: 0.2 }}
        >
            {children}
        </motion.div>
    )
}
