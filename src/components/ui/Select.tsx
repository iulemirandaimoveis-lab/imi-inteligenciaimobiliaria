// components/ui/Select.tsx
// Select Component - Dropdown Refinado

'use client'

import { forwardRef, SelectHTMLAttributes, useState } from 'react'
import { ChevronDown, AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
    value: string
    label: string
    disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    label?: string
    error?: string
    hint?: string
    success?: string
    options: SelectOption[]
    placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({
        className,
        label,
        error,
        hint,
        success,
        options,
        placeholder,
        disabled,
        ...props
    }, ref) => {

        const [isFocused, setIsFocused] = useState(false)

        const baseStyles = `
      w-full h-[48px] pl-[16px] pr-[40px]
      bg-white border rounded-[12px]
      text-sm text-imi-900
      appearance-none cursor-pointer
      transition-all duration-200 ease-smooth
      focus:outline-none focus:ring-2 focus:ring-offset-0
      hover:border-imi-300
      disabled:bg-imi-50 disabled:cursor-not-allowed disabled:opacity-60
    `

        const borderStyles = error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : success
                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                : isFocused
                    ? 'border-accent-500 ring-2 ring-accent-500'
                    : 'border-imi-200'

        return (
            <div className="space-y-[8px]">
                {/* Label */}
                {label && (
                    <label className="block text-sm font-medium text-imi-700">
                        {label}
                    </label>
                )}

                {/* Select Container */}
                <div className="relative">
                    <select
                        ref={ref}
                        className={cn(baseStyles, borderStyles, className)}
                        disabled={disabled}
                        onFocus={(e) => {
                            setIsFocused(true)
                            props.onFocus?.(e)
                        }}
                        onBlur={(e) => {
                            setIsFocused(false)
                            props.onBlur?.(e)
                        }}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {/* Chevron Icon */}
                    <div className="absolute right-[16px] top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown
                            className={cn(
                                'w-[20px] h-[20px] transition-transform duration-200',
                                isFocused && 'rotate-180',
                                error ? 'text-red-500' : success ? 'text-green-500' : 'text-imi-400'
                            )}
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <p className="text-xs text-red-600 leading-[16px] flex items-center gap-[4px]">
                        <AlertCircle size={12} />
                        {error}
                    </p>
                )}

                {/* Success Message */}
                {success && !error && (
                    <p className="text-xs text-green-600 leading-[16px] flex items-center gap-[4px]">
                        <Check size={12} />
                        {success}
                    </p>
                )}

                {/* Hint */}
                {hint && !error && !success && (
                    <p className="text-xs text-imi-500 leading-[16px]">
                        {hint}
                    </p>
                )}
            </div>
        )
    }
)

Select.displayName = 'Select'

export { Select }
export default Select
