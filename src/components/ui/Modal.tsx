// components/ui/Modal.tsx
// Modal Component - Modais Elegantes e Profissionais

'use client'

import { HTMLAttributes, forwardRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
    open: boolean
    onClose: () => void
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    closeOnBackdrop?: boolean
    showCloseButton?: boolean
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
    ({
        open,
        onClose,
        size = 'md',
        closeOnBackdrop = true,
        showCloseButton = true,
        className,
        children,
        ...props
    }, ref) => {

        // Prevenir scroll do body quando modal está aberto
        useEffect(() => {
            if (open) {
                document.body.style.overflow = 'hidden'
            } else {
                document.body.style.overflow = 'unset'
            }

            return () => {
                document.body.style.overflow = 'unset'
            }
        }, [open])

        // Fechar com ESC
        useEffect(() => {
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape' && open) {
                    onClose()
                }
            }

            document.addEventListener('keydown', handleEsc)
            return () => document.removeEventListener('keydown', handleEsc)
        }, [open, onClose])

        if (!open) return null

        const sizes = {
            sm: 'max-w-md',
            md: 'max-w-lg',
            lg: 'max-w-2xl',
            xl: 'max-w-4xl',
            full: 'max-w-[calc(100vw-64px)] max-h-[calc(100vh-64px)]',
        }

        return (
            <>
                {/* Backdrop */}
                <div
                    className="fixed inset-0 z-[50] bg-imi-900/50 backdrop-blur-sm animate-fade-in"
                    onClick={closeOnBackdrop ? onClose : undefined}
                    aria-hidden="true"
                />

                {/* Modal Container */}
                <div
                    className="fixed inset-0 z-[50] flex items-center justify-center p-[16px] md:p-[32px]"
                    onClick={closeOnBackdrop ? onClose : undefined}
                >
                    {/* Modal Content */}
                    <div
                        ref={ref}
                        className={cn(
                            'relative w-full',
                            sizes[size],
                            'bg-white rounded-[16px] shadow-xl',
                            'animate-scale-in',
                            className
                        )}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        {...props}
                    >
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className={cn(
                                    'absolute top-[16px] right-[16px] z-10',
                                    'w-[32px] h-[32px] rounded-[8px]',
                                    'flex items-center justify-center',
                                    'text-imi-500 hover:text-imi-900',
                                    'hover:bg-imi-100',
                                    'transition-all duration-200',
                                    'focus:outline-none focus:ring-2 focus:ring-accent-500'
                                )}
                                aria-label="Fechar"
                            >
                                <X size={20} />
                            </button>
                        )}

                        {children}
                    </div>
                </div>
            </>
        )
    }
)

Modal.displayName = 'Modal'

// ============================================
// MODAL HEADER
// ============================================

interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
    title?: string
    subtitle?: string
}

const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
    ({ title, subtitle, className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'px-[24px] md:px-[32px] pt-[24px] md:pt-[32px] pb-[16px]',
                    'border-b border-imi-100',
                    className
                )}
                {...props}
            >
                {title && (
                    <h2 className="text-[24px] font-bold text-imi-900 leading-[32px] tracking-tight pr-[40px]">
                        {title}
                    </h2>
                )}
                {subtitle && (
                    <p className="text-sm text-imi-600 mt-[8px]">
                        {subtitle}
                    </p>
                )}
                {children}
            </div>
        )
    }
)

ModalHeader.displayName = 'ModalHeader'

// ============================================
// MODAL BODY
// ============================================

const ModalBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'px-[24px] md:px-[32px] py-[24px]',
                    'max-h-[calc(100vh-240px)] overflow-y-auto',
                    className
                )}
                {...props}
            />
        )
    }
)

ModalBody.displayName = 'ModalBody'

// ============================================
// MODAL FOOTER
// ============================================

interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
    align?: 'left' | 'center' | 'right' | 'between'
}

const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
    ({ align = 'right', className, ...props }, ref) => {

        const alignments = {
            left: 'justify-start',
            center: 'justify-center',
            right: 'justify-end',
            between: 'justify-between',
        }

        return (
            <div
                ref={ref}
                className={cn(
                    'flex items-center gap-[12px]',
                    'px-[24px] md:px-[32px] pb-[24px] md:pb-[32px] pt-[16px]',
                    'border-t border-imi-100',
                    alignments[align],
                    className
                )}
                {...props}
            />
        )
    }
)

ModalFooter.displayName = 'ModalFooter'

export { Modal, ModalHeader, ModalBody, ModalFooter }
export default Modal
