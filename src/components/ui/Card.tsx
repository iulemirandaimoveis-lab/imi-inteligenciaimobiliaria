// components/ui/Card.tsx
// Card Component — Dark/Light theme aware

'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'outlined' | 'flat' | 'glass'
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
      bg-white dark:bg-[#0F1E30]
      rounded-[14px]
      transition-all duration-200 ease-smooth
    `

        const variants = {
            default: `
        border border-[rgba(11,17,32,0.10)] dark:border-[rgba(200,164,74,0.15)]
        shadow-[0_1px_4px_rgba(11,17,32,0.06)]
        dark:shadow-[0_4px_20px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,255,255,0.04)]
      `,
            elevated: `
        border border-[rgba(11,17,32,0.10)] dark:border-[rgba(200,164,74,0.20)]
        shadow-[0_4px_16px_rgba(11,17,32,0.08),0_1px_4px_rgba(11,17,32,0.04)]
        dark:shadow-[0_8px_32px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)]
      `,
            outlined: `
        border-2 border-[rgba(11,17,32,0.16)] dark:border-[rgba(200,164,74,0.28)]
      `,
            flat: `
        border border-[rgba(11,17,32,0.07)] dark:border-[rgba(200,164,74,0.10)]
      `,
            glass: `
        bg-[rgba(255,255,255,0.92)] dark:bg-[rgba(15,32,53,0.75)]
        backdrop-blur-md
        border border-[rgba(11,17,32,0.10)] dark:border-[rgba(200,164,74,0.18)]
        shadow-[0_4px_20px_rgba(11,17,32,0.08)]
        dark:shadow-[0_8px_32px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)]
      `,
        }

        const paddings = {
            none: '',
            sm: 'p-[16px]',
            md: 'p-[24px]',
            lg: 'p-[32px]',
        }

        const hoverEffect = hover ? `
      hover:shadow-[0_8px_24px_rgba(11,17,32,0.12),0_2px_6px_rgba(11,17,32,0.06)]
      dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]
      dark:hover:border-[rgba(200,164,74,0.28)]
      hover:-translate-y-[2px]
      cursor-pointer
    ` : ''

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
// CARD HEADER
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
                className={cn('flex items-start justify-between mb-[20px]', className)}
                {...props}
            >
                <div className="flex-1 min-w-0">
                    {subtitle && (
                        <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-imi-500 dark:text-[#C8A44A] mb-[4px]">
                            {subtitle}
                        </p>
                    )}
                    {title && (
                        <h3 className="text-[18px] font-semibold text-imi-900 dark:text-[#E8E4DC] leading-[26px] tracking-[-0.02em]">
                            {title}
                        </h3>
                    )}
                    {description && (
                        <p className="text-[13px] text-imi-500 dark:text-[#8E99AB] mt-[6px] leading-[20px]">
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
// CARD FOOTER
// ============================================

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'flex items-center justify-end gap-[12px]',
                    'mt-[20px] pt-[20px] border-t border-[rgba(11,17,32,0.08)] dark:border-[rgba(200,164,74,0.12)]',
                    className
                )}
                {...props}
            />
        )
    }
)

CardFooter.displayName = 'CardFooter'

// ============================================
// CARD SECTION
// ============================================

const CardSection = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'py-[20px] border-t border-[rgba(11,17,32,0.08)] dark:border-[rgba(200,164,74,0.12)] first:pt-0 first:border-t-0',
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
