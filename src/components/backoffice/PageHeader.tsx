'use client'

import { motion } from 'framer-motion'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Breadcrumb {
    label: string
    href: string
}

interface PageHeaderProps {
    title: string
    subtitle?: string
    breadcrumbs?: Breadcrumb[]
    actions?: React.ReactNode
}

export default function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
    const pathname = usePathname()

    // Generate default breadcrumbs if none provided
    const defaultBreadcrumbs = breadcrumbs || pathname?.split('/')
        .filter(Boolean)
        .map((part, i, arr) => ({
            label: part.charAt(0).toUpperCase() + part.slice(1),
            href: '/' + arr.slice(0, i + 1).join('/')
        }))
        .slice(1) // Remove 'backoffice' from list as it's the root

    return (
        <div className="mb-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 mb-3">
                <Link
                    href="/backoffice/dashboard"
                    className="text-imi-400 hover:text-accent-600 transition-colors"
                >
                    <Home size={14} />
                </Link>

                {defaultBreadcrumbs?.map((bc, i) => (
                    <div key={bc.href} className="flex items-center gap-2">
                        <ChevronRight size={12} className="text-imi-300" />
                        <Link
                            href={bc.href}
                            className={`text-xs font-medium transition-colors ${i === defaultBreadcrumbs.length - 1
                                    ? 'text-imi-900 pointer-events-none'
                                    : 'text-imi-400 hover:text-accent-600'
                                }`}
                        >
                            {bc.label}
                        </Link>
                    </div>
                ))}
            </nav>

            {/* Main Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-imi-900 mb-1"
                        style={{ letterSpacing: '-0.02em' }}>
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-sm text-imi-500 font-medium">{subtitle}</p>
                    )}

                    {/* Animated underline */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: 48 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="h-0.5 bg-gradient-to-r from-accent-500 to-transparent rounded-full mt-3"
                    />
                </motion.div>

                {actions && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="flex items-center gap-3"
                    >
                        {actions}
                    </motion.div>
                )}
            </div>
        </div>
    )
}
