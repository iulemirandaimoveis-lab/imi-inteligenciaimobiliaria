'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface PageHeaderProps {
    title: string
    subtitle?: string
    breadcrumbs?: Array<{ name: string; href?: string }>
    action?: React.ReactNode
}

export default function PageHeader({
    title,
    subtitle,
    breadcrumbs,
    action,
}: PageHeaderProps) {
    return (
        <div className="space-y-4">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 text-sm">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={index} className="flex items-center gap-2">
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    className="text-imi-600 hover:text-accent-600 transition-colors"
                                >
                                    {crumb.name}
                                </Link>
                            ) : (
                                <span className="text-imi-900 font-medium">{crumb.name}</span>
                            )}
                            {index < breadcrumbs.length - 1 && (
                                <ChevronRight size={14} className="text-imi-400" />
                            )}
                        </div>
                    ))}
                </nav>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h1 className="text-[32px] font-bold text-imi-900 tracking-tight leading-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-sm text-imi-600 mt-2 leading-relaxed">
                            {subtitle}
                        </p>
                    )}
                </div>

                {action && (
                    <div className="flex-shrink-0">
                        {action}
                    </div>
                )}
            </div>
        </div>
    )
}
