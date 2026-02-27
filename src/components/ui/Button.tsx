// components/ui/Button.tsx
// Button Component - Padrão Institucional Premium
// Altura mínima 48px (touch-friendly)

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
      inline-flex items-center justify-center gap-[8px]
      font-medium text-sm text-center max-w-full
      transition-all duration-200 ease-smooth
      focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
      active:scale-[0.98]
    `

        // Variants
        const variants = {
            primary: `
        bg-accent-500 text-white
        hover:bg-accent-600
        shadow-sm hover:shadow-md
      `,
            secondary: `
        bg-imi-100 text-imi-900
        border border-imi-200
        hover:bg-imi-200 hover:border-imi-300
      `,
            outline: `
        bg-transparent text-imi-700 
        border-2 border-imi-200
        hover:bg-imi-50 hover:border-imi-300
      `,
            ghost: `
        bg-transparent text-imi-700
        hover:bg-imi-100
      `,
            danger: `
        bg-red-500 text-white
        hover:bg-red-600
        shadow-sm hover:shadow-md
      `,
        }

        // Sizes - Mínimo 48px para touch, com min-h e h-auto para permitir wrap de texto longo
        const sizes = {
            sm: 'min-h-[40px] h-auto py-2 px-[16px] rounded-[8px]',
            md: 'min-h-[48px] h-auto py-3 px-[20px] sm:px-[24px] rounded-[12px]', // Padrão touch-friendly
            lg: 'min-h-[56px] h-auto py-4 px-[24px] sm:px-[32px] rounded-[12px] text-base',
        }

        const iconSizes = {
            sm: 'w-[16px] h-[16px]',
            md: 'w-[20px] h-[20px]',
            lg: 'w-[24px] h-[24px]',
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
