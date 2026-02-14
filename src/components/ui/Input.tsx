// components/ui/Input.tsx
// Input Component - Estados Claros e Profissionais

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
      bg-white border rounded-[12px]
      text-sm text-imi-900 leading-[20px]
      placeholder:text-imi-400
      transition-all duration-200 ease-smooth
      focus:outline-none focus:ring-2 focus:ring-offset-0
      hover:border-imi-300
      disabled:bg-imi-50 disabled:cursor-not-allowed disabled:opacity-60
    `

        // Estados de borda
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

                {/* Input Container */}
                <div className="relative">
                    {/* Left Icon */}
                    {leftIcon && (
                        <div className="absolute left-[16px] top-1/2 -translate-y-1/2 text-imi-400 pointer-events-none">
                            <div className="w-[20px] h-[20px] flex items-center justify-center">
                                {leftIcon}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <input
                        ref={ref}
                        type={inputType}
                        className={cn(
                            baseStyles,
                            borderStyles,
                            leftIcon && 'pl-[48px]',
                            (rightIcon || showPasswordToggle || error || success) && 'pr-[48px]',
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

                    {/* Right Icons */}
                    <div className="absolute right-[16px] top-1/2 -translate-y-1/2 flex items-center gap-[8px]">
                        {/* Error Icon */}
                        {error && (
                            <AlertCircle className="w-[20px] h-[20px] text-red-500" />
                        )}

                        {/* Success Icon */}
                        {success && !error && (
                            <Check className="w-[20px] h-[20px] text-green-500" />
                        )}

                        {/* Custom Right Icon */}
                        {rightIcon && !error && !success && (
                            <div className="w-[20px] h-[20px] text-imi-400">
                                {rightIcon}
                            </div>
                        )}

                        {/* Password Toggle */}
                        {showPasswordToggle && !error && !success && (
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="w-[20px] h-[20px] text-imi-400 hover:text-imi-600 transition-colors focus:outline-none"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        )}
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

Input.displayName = 'Input'

// ============================================
// TEXTAREA COMPONENT
// ============================================

export interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
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
      w-full px-[16px] py-[12px]
      bg-white border rounded-[12px]
      text-sm text-imi-900 leading-[20px]
      placeholder:text-imi-400
      transition-all duration-200 ease-smooth
      resize-vertical min-h-[96px]
      focus:outline-none focus:ring-2 focus:ring-offset-0
      hover:border-imi-300
      disabled:bg-imi-50 disabled:cursor-not-allowed disabled:opacity-60
    `

        const borderStyles = error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : isFocused
                ? 'border-accent-500 ring-2 ring-accent-500'
                : 'border-imi-200'

        return (
            <div className="space-y-[8px]">
                {label && (
                    <label className="block text-sm font-medium text-imi-700">
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
                        props.onFocus?.(e as any)
                    }}
                    onBlur={(e) => {
                        setIsFocused(false)
                        props.onBlur?.(e as any)
                    }}
                    {...props}
                />

                {error && (
                    <p className="text-xs text-red-600 leading-[16px] flex items-center gap-[4px]">
                        <AlertCircle size={12} />
                        {error}
                    </p>
                )}

                {hint && !error && (
                    <p className="text-xs text-imi-500 leading-[16px]">
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
