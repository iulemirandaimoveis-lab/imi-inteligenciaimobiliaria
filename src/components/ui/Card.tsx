// components/ui/Card.tsx
// Card Component - Sofisticação e Profundidade Sutil

'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'outlined' | 'flat'
    padding?: 'none' | 'sm' | 'md' | 'lg'
    hover?: boolean
    as?: 'div' | 'article' | 'section'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({
        className,
        variant = 'default',
        padding = 'md',
        hover = false,
        as: Component = 'div',
        children,
        ...props
    }, ref) => {

        const baseStyles = `
      bg-white rounded-[16px]
      transition-all duration-200 ease-smooth
    `

        const variants = {
            default: `
        border border-imi-100
        shadow-sm
      `,
            elevated: `
        border border-imi-100
        shadow-md
      `,
            outlined: `
        border-2 border-imi-200
      `,
            flat: `
        border border-imi-50
      `,
        }

        // Padding múltiplos de 8px
        const paddings = {
            none: '',
            sm: 'p-[16px]',  // 16px
            md: 'p-[24px]',  // 24px
            lg: 'p-[32px]',  // 32px
        }

        const hoverEffect = hover && `
      hover:shadow-lg 
      hover:border-imi-200 
      hover:-translate-y-[4px] 
      cursor-pointer
    `

        return (
            <Component
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    paddings[padding],
                    hoverEffect,
                    className
                )}
                {...props}
            >
                {children}
            </Component>
        )
    }
)

Card.displayName = 'Card'

// ============================================
// CARD HEADER - Hierarquia Clara
// ============================================

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
    title?: string
    subtitle?: string
    description?: string
    action?: React.ReactNode
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ title, subtitle, description, action, className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn('flex items-start justify-between mb-[24px]', className)}
                {...props}
            >
                <div className="flex-1 min-w-0">
                    {subtitle && (
                        <p className="text-xs font-medium text-imi-600 uppercase tracking-wide mb-[4px]">
                            {subtitle}
                        </p>
                    )}
                    {title && (
                        <h3 className="text-[20px] font-semibold text-imi-900 leading-[28px] tracking-tight">
                            {title}
                        </h3>
                    )}
                    {description && (
                        <p className="text-sm text-imi-600 mt-[8px] leading-[20px]">
                            {description}
                        </p>
                    )}
                    {children}
                </div>
                {action && (
                    <div className="ml-[16px] flex-shrink-0">
                        {action}
                    </div>
                )}
            </div>
        )
    }
)

CardHeader.displayName = 'CardHeader'

// ============================================
// CARD BODY
// ============================================

const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn('space-y-[16px]', className)}
                {...props}
            />
        )
    }
)

CardBody.displayName = 'CardBody'

// ============================================
// CARD FOOTER - Ações Alinhadas
// ============================================

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'flex items-center justify-end gap-[12px]',
                    'mt-[24px] pt-[24px] border-t border-imi-100',
                    className
                )}
                {...props}
            />
        )
    }
)

CardFooter.displayName = 'CardFooter'

// ============================================
// CARD SECTION - Divisão Interna
// ============================================

const CardSection = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'py-[24px] border-t border-imi-100 first:pt-0 first:border-t-0',
                    className
                )}
                {...props}
            />
        )
    }
)

CardSection.displayName = 'CardSection'

export { Card, CardHeader, CardBody, CardFooter, CardSection }
export default Card
