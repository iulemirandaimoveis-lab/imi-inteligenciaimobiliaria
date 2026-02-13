import { TextareaHTMLAttributes, forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={twMerge(
                        "w-full bg-white dark:bg-card-dark border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm resize-y min-h-[100px]",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-xs text-red-500 font-medium animate-slide-up">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)
Textarea.displayName = 'Textarea'

export default Textarea
