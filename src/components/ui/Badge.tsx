// components/ui/Badge.tsx
// Badge Component - Tags e Status Refinados

'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
    size?: 'sm' | 'md' | 'lg'
    icon?: React.ReactNode
    onRemove?: () => void
    dot?: boolean
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
    ({
        className,
        variant = 'default',
        size = 'md',
        icon,
        onRemove,
        dot,
        children,
        ...props
    }, ref) => {

        const baseStyles = `
      inline-flex items-center gap-[4px]
      rounded-[8px] font-medium
      transition-all duration-200
    `

        const variants = {
            default: 'bg-imi-100 text-imi-700 border border-imi-200',
            primary: 'bg-accent-100 text-accent-700 border border-accent-200',
            success: 'bg-green-100 text-green-700 border border-green-200',
            warning: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
            danger: 'bg-red-100 text-red-700 border border-red-200',
            info: 'bg-blue-100 text-blue-700 border border-blue-200',
            neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
        }

        const sizes = {
            sm: 'px-[8px] py-[4px] text-xs',
            md: 'px-[12px] py-[6px] text-xs',
            lg: 'px-[16px] py-[8px] text-sm',
        }

        const iconSizes = {
            sm: 'w-[12px] h-[12px]',
            md: 'w-[14px] h-[14px]',
            lg: 'w-[16px] h-[16px]',
        }

        const dotColors = {
            default: 'bg-imi-500',
            primary: 'bg-accent-500',
            success: 'bg-green-500',
            warning: 'bg-yellow-500',
            danger: 'bg-red-500',
            info: 'bg-blue-500',
            neutral: 'bg-gray-500',
        }

        return (
            <div
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {dot && (
                    <div className={cn('w-[6px] h-[6px] rounded-full', dotColors[variant])} />
                )}

                {icon && !dot && (
                    <span className={iconSizes[size]}>{icon}</span>
                )}

                {children}

                {onRemove && (
                    <button
                        onClick={onRemove}
                        className="hover:bg-black/10 rounded-full p-[2px] transition-colors"
                        type="button"
                    >
                        <X className="w-[12px] h-[12px]" />
                    </button>
                )}
            </div>
        )
    }
)

Badge.displayName = 'Badge'

// ============================================
// KPI CARD - Métricas com Hierarquia Clara
// ============================================

export interface KPICardProps extends HTMLAttributes<HTMLDivElement> {
    label: string
    value: string | number
    change?: {
        value: number
        label?: string
        trend?: 'up' | 'down' | 'neutral'
    }
    icon?: React.ReactNode
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
    loading?: boolean
}

const KPICard = forwardRef<HTMLDivElement, KPICardProps>(
    ({
        className,
        label,
        value,
        change,
        icon,
        variant = 'default',
        loading,
        ...props
    }, ref) => {

        const variantColors = {
            default: 'border-imi-100 bg-white',
            primary: 'border-accent-100 bg-accent-50',
            success: 'border-green-100 bg-green-50',
            warning: 'border-yellow-100 bg-yellow-50',
            danger: 'border-red-100 bg-red-50',
        }

        const iconColors = {
            default: 'text-imi-600 bg-imi-100',
            primary: 'text-accent-600 bg-accent-100',
            success: 'text-green-600 bg-green-100',
            warning: 'text-yellow-600 bg-yellow-100',
            danger: 'text-red-600 bg-red-100',
        }

        const trendColors = {
            up: 'text-green-600',
            down: 'text-red-600',
            neutral: 'text-imi-600',
        }

        if (loading) {
            return (
                <div
                    ref={ref}
                    className={cn(
                        'p-[24px] border rounded-[16px]',
                        variantColors[variant],
                        className
                    )}
                    {...props}
                >
                    <div className="animate-pulse space-y-[16px]">
                        <div className="h-[16px] bg-imi-200 rounded w-1/2" />
                        <div className="h-[32px] bg-imi-200 rounded w-3/4" />
                        <div className="h-[16px] bg-imi-200 rounded w-1/3" />
                    </div>
                </div>
            )
        }

        return (
            <div
                ref={ref}
                className={cn(
                    'p-[24px] border rounded-[16px] shadow-sm',
                    'transition-all duration-200 hover:shadow-md',
                    variantColors[variant],
                    className
                )}
                {...props}
            >
                {/* Header com ícone */}
                <div className="flex items-center justify-between mb-[16px]">
                    <span className="text-xs font-medium text-imi-600 uppercase tracking-wide">
                        {label}
                    </span>
                    {icon && (
                        <div className={cn(
                            'w-[40px] h-[40px] rounded-[12px] flex items-center justify-center',
                            iconColors[variant]
                        )}>
                            <div className="w-[20px] h-[20px]">
                                {icon}
                            </div>
                        </div>
                    )}
                </div>

                {/* Valor principal */}
                <div className="text-[32px] font-bold text-imi-900 leading-[40px] tracking-tight mb-[8px]">
                    {value}
                </div>

                {/* Mudança/Tendência */}
                {change && (
                    <div className="flex items-center gap-[8px]">
                        <span className={cn(
                            'text-sm font-medium',
                            change.trend ? trendColors[change.trend] : 'text-imi-600'
                        )}>
                            {change.trend === 'up' && '↑ '}
                            {change.trend === 'down' && '↓ '}
                            {change.value > 0 && change.trend !== 'down' && '+'}
                            {change.value}%
                        </span>
                        {change.label && (
                            <span className="text-xs text-imi-500">
                                {change.label}
                            </span>
                        )}
                    </div>
                )}
            </div>
        )
    }
)

KPICard.displayName = 'KPICard'

export { Badge, KPICard }
export default Badge
