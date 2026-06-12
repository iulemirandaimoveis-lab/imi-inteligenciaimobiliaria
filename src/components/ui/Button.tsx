// components/ui/Button.tsx
// Button Component — Institutional Dark/Light, Apple HIG 44px minimum

'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold'
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

        const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-semibold text-sm tracking-[-0.01em]
      transition-all duration-200 ease-smooth
      focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(200,164,74,0.5)] focus-visible:ring-offset-2
      disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none
      active:scale-[0.97]
    `

        const variants = {
            // Light: navy fill / dark: white fill with navy text (institutional)
            primary: `
        bg-[#0B1928] text-white
        shadow-[0_1px_3px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]
        hover:bg-[#162840] hover:shadow-[0_2px_10px_rgba(0,0,0,0.22)]
        dark:bg-white dark:text-[#0B1928]
        dark:shadow-[0_1px_4px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.9)]
        dark:hover:bg-[#F4F2EA] dark:hover:shadow-[0_2px_12px_rgba(0,0,0,0.18)]
      `,
            // Subtle fill — secondary action
            secondary: `
        bg-[rgba(11,17,32,0.06)] text-[#0B1928]
        border border-[rgba(11,17,32,0.12)]
        hover:bg-[rgba(11,17,32,0.10)] hover:border-[rgba(11,17,32,0.18)]
        dark:bg-[rgba(255,255,255,0.07)] dark:text-[#E8E4DC] dark:border-[rgba(255,255,255,0.10)]
        dark:hover:bg-[rgba(255,255,255,0.11)] dark:hover:border-[rgba(255,255,255,0.16)]
      `,
            // Outlined — tertiary action
            outline: `
        bg-transparent text-[#0B1928]
        border border-[rgba(11,17,32,0.24)]
        hover:bg-[rgba(11,17,32,0.05)] hover:border-[rgba(11,17,32,0.34)]
        dark:text-[#E8E4DC] dark:border-[rgba(200,164,74,0.28)]
        dark:hover:bg-[rgba(200,164,74,0.07)] dark:hover:border-[rgba(200,164,74,0.45)]
      `,
            // Ghost — minimal
            ghost: `
        bg-transparent text-[#545248]
        hover:bg-[rgba(11,17,32,0.06)] hover:text-[#0B1928]
        dark:text-[#8E99AB]
        dark:hover:bg-[rgba(255,255,255,0.07)] dark:hover:text-[#E8E4DC]
      `,
            // Destructive
            danger: `
        bg-red-600 text-white
        shadow-[0_1px_3px_rgba(220,38,38,0.25)]
        hover:bg-red-700 hover:shadow-[0_2px_8px_rgba(220,38,38,0.30)]
        dark:bg-[rgba(248,113,113,0.15)] dark:text-red-400
        dark:border dark:border-red-500/30
        dark:hover:bg-[rgba(248,113,113,0.22)] dark:hover:border-red-400/45
      `,
            // Gold accent — premium CTA (dark only)
            gold: `
        bg-[rgba(200,164,74,0.14)] text-[#C8A44A]
        border border-[rgba(200,164,74,0.28)]
        shadow-[0_1px_6px_rgba(200,164,74,0.10),inset_0_1px_0_rgba(255,255,255,0.06)]
        hover:bg-[rgba(200,164,74,0.20)] hover:border-[rgba(200,164,74,0.42)]
        hover:shadow-[0_2px_14px_rgba(200,164,74,0.18)]
      `,
        }

        const sizes = {
            sm: 'h-9 px-[14px] rounded-[8px] text-[12px]',
            md: 'h-11 px-[20px] rounded-[10px] text-[13px]',
            lg: 'h-12 px-[24px] rounded-[11px] text-[14px]',
        }

        const iconSizes = {
            sm: 'w-[14px] h-[14px]',
            md: 'w-[16px] h-[16px]',
            lg: 'w-[18px] h-[18px]',
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
                    <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
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
