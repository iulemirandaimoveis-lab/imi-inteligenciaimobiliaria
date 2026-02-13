// components/backoffice/LoadingStates.tsx
// Loading states e animações profissionais

import { Loader } from 'lucide-react'
import React from 'react'

// ============================================
// LOADING SPINNER
// ============================================

export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    }

    return (
        <Loader
            className={`${sizes[size]} text-accent-500 animate-spin ${className}`}
        />
    )
}

// ============================================
// LOADING OVERLAY
// ============================================

export function LoadingOverlay({ message = 'Carregando...' }: { message?: string }) {
    return (
        <div className="fixed inset-0 bg-imi-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
                <LoadingSpinner size="lg" className="mx-auto mb-4" />
                <p className="text-imi-700 font-medium">{message}</p>
            </div>
        </div>
    )
}

// ============================================
// SKELETON LOADER
// ============================================

export function Skeleton({ className = '', variant = 'default' }: {
    className?: string
    variant?: 'default' | 'circle' | 'text'
}) {
    const baseClass = 'animate-pulse bg-imi-100' // Adjusted to imi-100 for lighter skeleton
    const variantClasses = {
        default: 'rounded-xl',
        circle: 'rounded-full',
        text: 'rounded h-4'
    }

    return (
        <div className={`${baseClass} ${variantClasses[variant]} ${className}`} />
    )
}

// ============================================
// CARD SKELETON
// ============================================

export function CardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-imi-100 p-6 space-y-4">
            <div className="flex items-start gap-4">
                <Skeleton variant="circle" className="w-12 h-12" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
            </div>
        </div>
    )
}

// ============================================
// TABLE SKELETON
// ============================================

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-white rounded-2xl border border-imi-100 overflow-hidden">
            {/* Header */}
            <div className="bg-imi-50 px-6 py-4 border-b border-imi-100">
                <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-4" />
                    ))}
                </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-imi-100">
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="px-6 py-4">
                        <div className="grid grid-cols-4 gap-4">
                            {[...Array(4)].map((_, j) => (
                                <Skeleton key={j} className="h-5" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ============================================
// EMPTY STATE
// ============================================

export function EmptyState({
    icon: Icon,
    title,
    description,
    action
}: {
    icon: any
    title: string
    description?: string
    action?: React.ReactNode
}) {
    return (
        <div className="bg-white rounded-2xl border border-imi-100 p-16 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-imi-50 flex items-center justify-center mx-auto mb-4 border border-imi-100">
                <Icon size={32} className="text-imi-300" />
            </div>
            <h3 className="text-lg font-semibold text-imi-900 mb-2">{title}</h3>
            {description && (
                <p className="text-imi-500 mb-6 max-w-md mx-auto">{description}</p>
            )}
            {action}
        </div>
    )
}

// ============================================
// PROGRESS BAR
// ============================================

export function ProgressBar({
    value,
    max = 100,
    color = 'accent',
    showPercentage = true,
    className = ''
}: {
    value: number
    max?: number
    color?: 'accent' | 'blue' | 'green' | 'red'
    showPercentage?: boolean
    className?: string
}) {
    const percentage = Math.round((value / max) * 100)

    const colorClasses = {
        accent: 'bg-accent-500',
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        red: 'bg-red-500'
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {showPercentage && (
                <div className="flex justify-between text-sm">
                    <span className="font-medium text-imi-700">Progresso</span>
                    <span className="text-imi-600">{percentage}%</span>
                </div>
            )}
            <div className="h-2 bg-imi-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${colorClasses[color]} transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}

// ============================================
// LOADING DOTS
// ============================================

export function LoadingDots({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="w-2 h-2 bg-accent-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-accent-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-accent-500 rounded-full animate-bounce" />
        </div>
    )
}

// ============================================
// BUTTON LOADING STATE
// ============================================

export function ButtonLoading({ children, loading, ...props }: any) {
    return (
        <button {...props} disabled={loading || props.disabled} className={`${props.className || ''} ${loading ? 'cursor-not-allowed opacity-80' : ''}`}>
            {loading ? (
                <div className="flex items-center gap-2 justify-center">
                    <LoadingSpinner size="sm" className="text-current" />
                    <span>Carregando...</span>
                </div>
            ) : (
                children
            )}
        </button>
    )
}

// ============================================
// SHIMMER EFFECT
// ============================================

export function ShimmerCard() {
    return (
        <div className="bg-white rounded-2xl border border-imi-100 p-6 overflow-hidden relative">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent z-10" />
            <div className="space-y-4">
                <div className="h-6 bg-imi-100 rounded w-3/4" />
                <div className="h-4 bg-imi-100 rounded w-full" />
                <div className="h-4 bg-imi-100 rounded w-5/6" />
            </div>
        </div>
    )
}

// ============================================
// FADE IN ANIMATION
// ============================================

export function FadeIn({
    children,
    delay = 0,
    className = ''
}: {
    children: React.ReactNode
    delay?: number
    className?: string
}) {
    return (
        <div
            className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${className}`}
            style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
        >
            {children}
        </div>
    )
}

// ============================================
// STAGGER CHILDREN
// ============================================

export function StaggerChildren({
    children,
    staggerDelay = 100
}: {
    children: React.ReactNode
    staggerDelay?: number
}) {
    return (
        <>
            {React.Children.map(children, (child, index) => (
                <FadeIn delay={index * staggerDelay}>
                    {child}
                </FadeIn>
            ))}
        </>
    )
}

// ============================================
// PULSE DOT
// ============================================

export function PulseDot({ color = 'green' }: { color?: 'green' | 'red' | 'yellow' | 'blue' }) {
    const colors = {
        green: 'bg-green-500',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
        blue: 'bg-blue-500'
    }

    return (
        <div className="relative w-3 h-3 flex items-center justify-center">
            <div className={`w-2 h-2 ${colors[color]} rounded-full relative z-10`} />
            <div className={`absolute inset-0 ${colors[color]} rounded-full animate-ping opacity-75`} />
        </div>
    )
}

// ============================================
// LOADING PLACEHOLDER
// ============================================

export function LoadingPlaceholder({
    lines = 3,
    className = ''
}: {
    lines?: number
    className?: string
}) {
    return (
        <div className={`space-y-3 ${className}`}>
            {[...Array(lines)].map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
                />
            ))}
        </div>
    )
}
