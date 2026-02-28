'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, Home } from 'lucide-react'

interface Breadcrumb {
    label: string
    href?: string
}

interface PageHeaderProps {
    title: string
    description?: string
    subtitle?: string
    breadcrumbs?: Breadcrumb[]
    action?: React.ReactNode
    badge?: { label: string; color?: 'gold' | 'green' | 'blue' | 'red' | 'gray' }
    /** @deprecated use description */
    hint?: string
}

const badgeColors = {
    gold: { bg: 'rgba(26,26,46,0.10)', text: 'var(--accent-700)', border: 'rgba(26,26,46,0.2)' },
    green: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
    blue: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
    red: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
    gray: { bg: '#F8F9FA', text: '#495057', border: '#DEE2E6' },
}

export default function PageHeader({
    title,
    description,
    subtitle,
    breadcrumbs,
    action,
    badge,
    hint,
}: PageHeaderProps) {
    const desc = description || subtitle || hint

    return (
        <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="mb-6"
        >
            {/* ── Breadcrumbs ───────────────────────────────────── */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <motion.nav
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className="flex items-center gap-1 mb-3 flex-wrap"
                >
                    <Link href="/backoffice/dashboard">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md transition-colors duration-120 hover:bg-imi-100">
                            <Home size={11} style={{ color: '#ADB5BD' }} />
                        </span>
                    </Link>

                    {breadcrumbs.map((crumb, i) => (
                        <span key={i} className="flex items-center gap-1">
                            <ChevronRight size={12} style={{ color: '#CED4DA' }} />
                            {crumb.href ? (
                                <Link href={crumb.href}>
                                    <span
                                        className="text-xs font-medium transition-colors duration-120"
                                        style={{ color: '#6C757D' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-600)')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#6C757D')}
                                    >
                                        {crumb.label}
                                    </span>
                                </Link>
                            ) : (
                                <span className="text-xs font-medium" style={{ color: '#343A40' }}>
                                    {crumb.label}
                                </span>
                            )}
                        </span>
                    ))}
                </motion.nav>
            )}

            {/* ── Main row ──────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Title + badge */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <motion.h1
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.06, duration: 0.3 }}
                            className="text-[26px] sm:text-[30px] font-bold tracking-tight leading-tight"
                            style={{
                                color: 'var(--imi-900)',
                                fontFamily: 'var(--font-inter), sans-serif',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {title}
                        </motion.h1>

                        {badge && (() => {
                            const c = badgeColors[badge.color || 'gold']
                            return (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.15, type: 'spring', stiffness: 500, damping: 25 }}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                                    style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                                >
                                    {badge.label}
                                </motion.span>
                            )
                        })()}
                    </div>

                    {/* Description */}
                    {desc && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.12 }}
                            className="mt-1.5 text-sm leading-relaxed"
                            style={{ color: '#6C757D', maxWidth: '560px' }}
                        >
                            {desc}
                        </motion.p>
                    )}

                    {/* Accent underline */}
                    <motion.div
                        initial={{ scaleX: 0, originX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.2, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                        className="mt-4 h-px"
                        style={{
                            background: 'linear-gradient(90deg, rgba(26,26,46,0.5) 0%, rgba(26,26,46,0.15) 40%, transparent 100%)',
                        }}
                    />
                </div>

                {/* Action area */}
                {action && (
                    <motion.div
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex-shrink-0 flex items-center gap-2"
                    >
                        {action}
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}
