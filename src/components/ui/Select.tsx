import { forwardRef, SelectHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    placeholder?: string
    fullWidth?: boolean
    icon?: React.ReactNode
    options?: { label: string, value: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, placeholder = "Selecione...", fullWidth = true, icon, options, children, ...props }, ref) => {
        return (
            <div className={twMerge(fullWidth && "w-full")}>
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
                    <select
                        ref={ref}
                        className={twMerge(
                            "w-full bg-white dark:bg-card-dark border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm pr-10 cursor-pointer",
                            icon && "pl-11",
                            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                            className
                        )}
                        {...props}
                    >
                        <option value="" disabled className="text-gray-400 dark:text-gray-500">{placeholder}</option>
                        {options ? options.map(opt => (
                            <option key={opt.value} value={opt.value} className="text-gray-900 dark:text-white bg-white dark:bg-card-dark">
                                {opt.label}
                            </option>
                        )) : children}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={16} />
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
Select.displayName = 'Select'

export default Select
