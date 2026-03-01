// components/ui/Button.tsx
// Button Component - Institutional Dark Premium
// Height: sm=36px, md=44px (Apple HIG), lg=48px

'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Loader } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    icon?: React.ReactNode
    iconPosition?: 'left' | 'right'
    fullWidth?: boolean
    asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        className,
        variant = 'primary',
        size = 'md',
        loading = false,
        icon,
        iconPosition = 'left',
        fullWidth = false,
        asChild = false,
        disabled,
        children,
        ...props
    }, ref) => {

        // Base: Focus, transitions, disabled
        const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-semibold text-sm
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1
      disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
      active:scale-[0.97]
    `

        // Variants — institutional dark, NO gold
        const variants = {
            primary: `
        bg-[#102A43] text-white
        hover:bg-[#16162A]
        shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.05)_inset]
        hover:shadow-[0_2px_8px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.08)_inset]
        dark:bg-white dark:text-[#102A43]
        dark:hover:bg-gray-100
        dark:shadow-[0_1px_3px_rgba(0,0,0,0.1)]
      `,
            secondary: `
        bg-gray-100 text-gray-800
        border border-gray-200
        hover:bg-gray-200 hover:border-gray-300
        dark:bg-white/8 dark:text-gray-200 dark:border-white/10
        dark:hover:bg-white/12
      `,
            outline: `
        bg-transparent text-gray-700
        border border-gray-300
        hover:bg-gray-50 hover:border-gray-400
        dark:text-gray-300 dark:border-white/15
        dark:hover:bg-white/5 dark:hover:border-white/25
      `,
            ghost: `
        bg-transparent text-gray-600
        hover:bg-gray-100
        dark:text-gray-400
        dark:hover:bg-white/8
      `,
            danger: `
        bg-red-600 text-white
        hover:bg-red-700
        shadow-sm hover:shadow-md
      `,
        }

        // Sizes — 44px default (Apple HIG standard)
        const sizes = {
            sm: 'h-9 px-3.5 rounded-lg text-xs',
            md: 'h-11 px-5 rounded-xl',       // 44px — touch-friendly standard
            lg: 'h-12 px-6 rounded-xl text-base', // 48px
        }

        const iconSizes = {
            sm: 'w-4 h-4',
            md: 'w-[18px] h-[18px]',
            lg: 'w-5 h-5',
        }

        const commonClasses = cn(
            baseStyles,
            variants[variant],
            sizes[size],
            fullWidth && 'w-full',
            className
        )

        if (asChild) {
            return (
                <Slot ref={ref} className={commonClasses} {...props}>
                    {children}
                </Slot>
            )
        }

        return (
            <button
                ref={ref}
                className={commonClasses}
                disabled={disabled || loading}
                {...props}
            >
                {loading && (
                    <Loader className={cn(iconSizes[size], 'animate-spin')} />
                )}

                {!loading && icon && iconPosition === 'left' && (
                    <span className={iconSizes[size]}>{icon}</span>
                )}

                {children}

                {!loading && icon && iconPosition === 'right' && (
                    <span className={iconSizes[size]}>{icon}</span>
                )}
            </button>
        )
    }
)

Button.displayName = 'Button'

export { Button }
export default Button
