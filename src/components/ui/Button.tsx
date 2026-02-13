import { ButtonHTMLAttributes, forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    isLoading?: boolean
    block?: boolean
    fullWidth?: boolean
    icon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading = false, block, fullWidth, icon, children, ...props }, ref) => {
        const variants = {
            primary: 'bg-primary hover:bg-primary-dark text-background-dark shadow-glow',
            secondary: 'bg-background-dark text-white border border-white/10 hover:bg-white/5',
            ghost: 'text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white',
            outline: 'border border-gray-200 dark:border-white/10 bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5',
            danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-none border border-red-500/20'
        }

        const sizes = {
            sm: 'px-3 py-1.5 text-xs font-bold rounded-lg',
            md: 'px-6 py-3 text-sm font-bold rounded-xl',
            lg: 'px-8 py-4 text-base font-bold rounded-2xl'
        }

        return (
            <button
                ref={ref}
                disabled={isLoading || props.disabled}
                className={twMerge(
                    "inline-flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                    variants[variant],
                    sizes[size],
                    (block || fullWidth) && "w-full",
                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {!isLoading && icon}
                {children}
            </button>
        )
    }
)
Button.displayName = 'Button'

export default Button
