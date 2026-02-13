import { HTMLAttributes, forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
        const variants = {
            default: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
            primary: 'bg-primary/10 text-primary border border-primary/20',
            success: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20',
            warning: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20',
            danger: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
            outline: 'bg-transparent border border-gray-200 dark:border-white/20 text-gray-500 dark:text-gray-400',
            ghost: 'bg-transparent text-gray-500 dark:text-gray-400'
        }

        const sizes = {
            sm: 'px-2 py-0.5 text-[10px]',
            md: 'px-2.5 py-0.5 text-xs',
            lg: 'px-3 py-1 text-sm'
        }

        return (
            <span
                ref={ref}
                className={twMerge(
                    "inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-full transition-all whitespace-nowrap",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {children}
            </span>
        )
    }
)
Badge.displayName = 'Badge'

export default Badge
