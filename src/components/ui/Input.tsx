// components/ui/Input.tsx
// Input Component — Dark/Light theme, Apple HIG touch targets

'use client'

import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
    success?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    showPasswordToggle?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({
        className,
        label,
        error,
        hint,
        success,
        leftIcon,
        rightIcon,
        showPasswordToggle,
        disabled,
        type = 'text',
        ...props
    }, ref) => {

        const [showPassword, setShowPassword] = useState(false)
        const [isFocused, setIsFocused] = useState(false)

        const inputType = showPasswordToggle && showPassword ? 'text' : type

        const baseStyles = `
      w-full h-[48px] px-[16px]
      bg-white dark:bg-[#081624]
      border rounded-[10px]
      text-[14px] text-imi-900 dark:text-[#E8E4DC] leading-[20px]
      placeholder:text-imi-400 dark:placeholder:text-[#3F4E5E]
      transition-all duration-200 ease-smooth
      focus:outline-none
      hover:border-imi-300 dark:hover:border-[rgba(200,164,74,0.38)]
      disabled:bg-imi-50 dark:disabled:bg-[rgba(255,255,255,0.03)] disabled:cursor-not-allowed disabled:opacity-55
    `

        const borderStyles = error
            ? 'border-red-300 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)] focus:border-red-400 dark:border-red-500/40 dark:focus:border-red-400/60 dark:focus:shadow-[0_0_0_3px_rgba(248,113,113,0.10)]'
            : success
                ? 'border-green-300 focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(34,197,94,0.10)] dark:border-green-500/40 dark:focus:border-green-400/60'
                : isFocused
                    ? 'border-[#C8A44A] shadow-[0_0_0_3px_rgba(200,164,74,0.12)] dark:border-[rgba(200,164,74,0.60)] dark:shadow-[0_0_0_3px_rgba(200,164,74,0.10)]'
                    : 'border-imi-200 dark:border-[rgba(200,164,74,0.20)]'

        return (
            <div className="space-y-[6px]">
                {label && (
                    <label className="block text-[11px] font-semibold uppercase tracking-[1.2px] text-imi-600 dark:text-[#C8A44A]">
                        {label}
                    </label>
                )}

                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-[14px] top-1/2 -translate-y-1/2 text-imi-400 dark:text-[#4F5B6B] pointer-events-none">
                            <div className="w-[18px] h-[18px] flex items-center justify-center">
                                {leftIcon}
                            </div>
                        </div>
                    )}

                    <input
                        ref={ref}
                        type={inputType}
                        className={cn(
                            baseStyles,
                            borderStyles,
                            leftIcon && 'pl-[44px]',
                            (rightIcon || showPasswordToggle || error || success) && 'pr-[44px]',
                            className
                        )}
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
                    />

                    <div className="absolute right-[14px] top-1/2 -translate-y-1/2 flex items-center gap-[6px]">
                        {error && (
                            <AlertCircle className="w-[16px] h-[16px] text-red-500" />
                        )}
                        {success && !error && (
                            <Check className="w-[16px] h-[16px] text-green-500" />
                        )}
                        {rightIcon && !error && !success && (
                            <div className="w-[18px] h-[18px] text-imi-400 dark:text-[#4F5B6B]">
                                {rightIcon}
                            </div>
                        )}
                        {showPasswordToggle && !error && !success && (
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="w-[18px] h-[18px] text-imi-400 dark:text-[#4F5B6B] hover:text-imi-600 dark:hover:text-[#8E99AB] transition-colors focus:outline-none"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 leading-[16px] flex items-center gap-[4px]">
                        <AlertCircle size={11} />
                        {error}
                    </p>
                )}
                {success && !error && (
                    <p className="text-[11px] text-green-600 dark:text-green-400 leading-[16px] flex items-center gap-[4px]">
                        <Check size={11} />
                        {success}
                    </p>
                )}
                {hint && !error && !success && (
                    <p className="text-[11px] text-imi-500 dark:text-[#4F5B6B] leading-[16px]">
                        {hint}
                    </p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'

// ============================================
// TEXTAREA
// ============================================

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
    hint?: string
    rows?: number
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({
        className,
        label,
        error,
        hint,
        rows = 4,
        disabled,
        ...props
    }, ref) => {

        const [isFocused, setIsFocused] = useState(false)

        const baseStyles = `
      w-full px-[14px] py-[12px]
      bg-white dark:bg-[#081624]
      border rounded-[10px]
      text-[14px] text-imi-900 dark:text-[#E8E4DC] leading-relaxed
      placeholder:text-imi-400 dark:placeholder:text-[#3F4E5E]
      transition-all duration-200 ease-smooth
      resize-vertical min-h-[88px]
      focus:outline-none
      hover:border-imi-300 dark:hover:border-[rgba(200,164,74,0.38)]
      disabled:bg-imi-50 dark:disabled:bg-[rgba(255,255,255,0.03)] disabled:cursor-not-allowed disabled:opacity-55
    `

        const borderStyles = error
            ? 'border-red-300 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.10)] focus:border-red-400 dark:border-red-500/40'
            : isFocused
                ? 'border-[#C8A44A] shadow-[0_0_0_3px_rgba(200,164,74,0.12)] dark:border-[rgba(200,164,74,0.60)] dark:shadow-[0_0_0_3px_rgba(200,164,74,0.10)]'
                : 'border-imi-200 dark:border-[rgba(200,164,74,0.20)]'

        return (
            <div className="space-y-[6px]">
                {label && (
                    <label className="block text-[11px] font-semibold uppercase tracking-[1.2px] text-imi-600 dark:text-[#C8A44A]">
                        {label}
                    </label>
                )}

                <textarea
                    ref={ref}
                    rows={rows}
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
                />

                {error && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 leading-[16px] flex items-center gap-[4px]">
                        <AlertCircle size={11} />
                        {error}
                    </p>
                )}
                {hint && !error && (
                    <p className="text-[11px] text-imi-500 dark:text-[#4F5B6B] leading-[16px]">
                        {hint}
                    </p>
                )}
            </div>
        )
    }
)

Textarea.displayName = 'Textarea'

export { Input, Textarea }
export default Input
