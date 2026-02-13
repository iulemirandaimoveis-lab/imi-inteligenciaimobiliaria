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
        <div className="mb-10 animate-fade-in">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">
                    <Link href="/backoffice/dashboard" className="hover:text-primary transition-colors flex items-center gap-1.5 group">
                        <Home size={12} className="group-hover:scale-110 transition-transform" />
                        <span className="sr-only">Home</span>
                    </Link>
                    {breadcrumbs.map((crumb, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <ChevronRight size={10} strokeWidth={3} className="opacity-50" />
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    className="hover:text-primary transition-colors hover:underline decoration-2 underline-offset-4"
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-gray-900 dark:text-gray-200">{crumb.label}</span>
                            )}
                        </div>
                    ))}
                </nav>
            )}

            {/* Title & Action Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white tracking-tight leading-none">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-gray-500 dark:text-gray-400 max-w-2xl font-medium leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>

                {action && (
                    <div className="flex items-center gap-3 shrink-0">
                        {action}
                    </div>
                )}
            </div>

            {/* Premium Divider */}
            <div className="mt-8 h-px w-full bg-gradient-to-r from-gray-100 via-gray-100 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent" />
        </div>
    )
}
