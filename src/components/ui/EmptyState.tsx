// components/ui/EmptyState.tsx
// Empty State e Loading Components - Estados Elegantes

'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

// ============================================
// EMPTY STATE
// ============================================

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  variant?: 'default' | 'subtle'
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ 
    icon: Icon,
    title,
    description,
    action,
    variant = 'default',
    className,
    ...props 
  }, ref) => {
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center',
          'py-[64px] px-[24px] text-center',
          variant === 'default' && 'border border-imi-100 rounded-[16px] bg-white',
          variant === 'subtle' && 'bg-imi-50 rounded-[16px]',
          className
        )}
        {...props}
      >
        {Icon && (
          <div className="w-[64px] h-[64px] rounded-[16px] bg-imi-100 flex items-center justify-center mb-[24px]">
            <Icon size={32} className="text-imi-400" />
          </div>
        )}
        
        <h3 className="text-[20px] font-semibold text-imi-900 mb-[8px]">
          {title}
        </h3>
        
        {description && (
          <p className="text-sm text-imi-600 max-w-md mb-[24px]">
            {description}
          </p>
        )}
        
        {action && (
          <Button onClick={action.onClick} icon={action.icon}>
            {action.label}
          </Button>
        )}
      </div>
    )
  }
)

EmptyState.displayName = 'EmptyState'

// ============================================
// SKELETON LOADER
// ============================================

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'title' | 'card' | 'circle' | 'rectangle'
  width?: string
  height?: string
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ 
    variant = 'rectangle',
    width,
    height,
    className,
    ...props 
  }, ref) => {
    
    const variants = {
      text: 'h-[16px] rounded-[4px]',
      title: 'h-[24px] rounded-[8px]',
      card: 'h-[120px] rounded-[16px]',
      circle: 'rounded-full',
      rectangle: 'h-[40px] rounded-[12px]',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'bg-imi-200 animate-pulse',
          variants[variant],
          className
        )}
        style={{ width, height }}
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'

// ============================================
// CARD SKELETON
// ============================================

const CardSkeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white border border-imi-100 rounded-[16px] p-[24px]',
          'space-y-[16px]',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-[16px]">
          <Skeleton variant="circle" width="48px" height="48px" />
          <div className="flex-1 space-y-[8px]">
            <Skeleton variant="title" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
        <div className="space-y-[8px]">
          <Skeleton variant="text" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="90%" />
        </div>
      </div>
    )
  }
)

CardSkeleton.displayName = 'CardSkeleton'

// ============================================
// TABLE SKELETON
// ============================================

interface TableSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  rows?: number
  columns?: number
}

const TableSkeleton = forwardRef<HTMLDivElement, TableSkeletonProps>(
  ({ rows = 5, columns = 4, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white border border-imi-100 rounded-[16px] overflow-hidden',
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="bg-imi-50 px-[24px] py-[16px] border-b border-imi-100">
          <div className="flex gap-[24px]">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} variant="text" width="100px" />
            ))}
          </div>
        </div>
        
        {/* Rows */}
        <div className="divide-y divide-imi-50">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="px-[24px] py-[16px]">
              <div className="flex gap-[24px]">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton 
                    key={colIndex} 
                    variant="text" 
                    width={colIndex === 0 ? '120px' : '80px'} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

TableSkeleton.displayName = 'TableSkeleton'

// ============================================
// LOADING OVERLAY
// ============================================

interface LoadingOverlayProps extends HTMLAttributes<HTMLDivElement> {
  show: boolean
  message?: string
}

const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ show, message = 'Carregando...', className, ...props }, ref) => {
    
    if (!show) return null
    
    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 z-[60]',
          'flex items-center justify-center',
          'bg-imi-900/50 backdrop-blur-sm',
          'animate-fade-in',
          className
        )}
        {...props}
      >
        <div className="bg-white rounded-[16px] shadow-xl p-[32px] text-center min-w-[200px]">
          <div className="w-[48px] h-[48px] mx-auto mb-[16px]">
            <div className="w-full h-full border-4 border-imi-200 border-t-accent-500 rounded-full animate-spin" />
          </div>
          <p className="text-sm font-medium text-imi-700">
            {message}
          </p>
        </div>
      </div>
    )
  }
)

LoadingOverlay.displayName = 'LoadingOverlay'

// ============================================
// SPINNER
// ============================================

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', className, ...props }, ref) => {
    
    const sizes = {
      sm: 'w-[16px] h-[16px] border-2',
      md: 'w-[24px] h-[24px] border-3',
      lg: 'w-[32px] h-[32px] border-4',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'border-imi-200 border-t-accent-500 rounded-full animate-spin',
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)

Spinner.displayName = 'Spinner'

export { 
  EmptyState, 
  Skeleton, 
  CardSkeleton, 
  TableSkeleton, 
  LoadingOverlay,
  Spinner 
}

export default EmptyState
