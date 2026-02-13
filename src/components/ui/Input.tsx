import { InputHTMLAttributes, forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, icon, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={twMerge(
                            "w-full bg-white dark:bg-card-dark border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm",
                            icon && "pl-11",
                            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="mt-1 text-xs text-red-500 font-medium animate-slide-up">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)
Input.displayName = 'Input'

export default Input
