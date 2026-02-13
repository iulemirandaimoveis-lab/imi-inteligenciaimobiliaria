import { HTMLAttributes, forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'outline' | 'flat'
    padding?: 'none' | 'sm' | 'md' | 'lg'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
        const variants = {
            default: 'bg-white dark:bg-card-dark border border-gray-100 dark:border-white/5 shadow-soft',
            glass: 'backdrop-blur-xl bg-white/80 dark:bg-card-dark/80 border border-white/20 dark:border-white/10 shadow-lg',
            outline: 'bg-transparent border border-gray-200 dark:border-white/10 shadow-none',
            flat: 'bg-gray-50 dark:bg-white/5 border-none shadow-none'
        }

        const paddings = {
            none: 'p-0',
            sm: 'p-4',
            md: 'p-6', // 24px as requested
            lg: 'p-8'  // 32px
        }

        return (
            <div
                ref={ref}
                className={twMerge(
                    "rounded-2xl transition-all duration-300",
                    variants[variant],
                    paddings[padding],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
)
Card.displayName = 'Card'

export default Card
