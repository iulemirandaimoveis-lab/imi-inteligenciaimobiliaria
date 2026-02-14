'use client'

import { ReactNode } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'

interface Breadcrumb {
    label: string
    href?: string
}

interface PageHeaderProps {
    title: string
    description?: string
    breadcrumbs?: Breadcrumb[]
    action?: ReactNode
}

export default function PageHeader({ title, description, breadcrumbs, action }: PageHeaderProps) {
    return (
        <div className="mb-12 animate-fade-in">
            {/* Breadcrumbs - Subtle & Precise */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-6">
                    <Link href="/backoffice/dashboard" className="hover:text-imi-500 transition-colors flex items-center gap-1.5 group">
                        <Home size={11} />
                        <span className="sr-only">Home</span>
                    </Link>
                    {breadcrumbs.map((crumb, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <ChevronRight size={10} strokeWidth={3} className="opacity-30" />
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    className="hover:text-imi-500 transition-colors uppercase"
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-gray-900 dark:text-imi-400">{crumb.label}</span>
                            )}
                        </div>
                    ))}
                </nav>
            )}

            {/* Title & Action Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-3">
                    <h1 className="text-3xl md:text-5xl font-display font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-gray-500 dark:text-gray-400 max-w-2xl text-sm md:text-base font-medium leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>

                {action && (
                    <div className="flex items-center gap-4 shrink-0 pb-1">
                        {action}
                    </div>
                )}
            </div>

            {/* Institutional Hairline Divider */}
            <div className="mt-10 h-[1px] w-full bg-gray-100 dark:bg-white/5" />
        </div>
    )
}
