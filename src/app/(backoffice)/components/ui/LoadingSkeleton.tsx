'use client'

// LoadingSkeleton — premium shimmer loading state
// Usage: <LoadingSkeleton variant="card" count={4} />
// Variants: 'card' | 'row' | 'kpi' | 'table' | 'list'

import React from 'react'

interface LoadingSkeletonProps {
  variant?: 'card' | 'row' | 'kpi' | 'table' | 'list'
  count?: number
  height?: number
  className?: string
}

const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--bo-elevated) 25%, var(--bo-surface-alt, var(--bo-surface)) 50%, var(--bo-elevated) 75%)',
  backgroundSize: '200% 100%',
  animation: 'bo-shimmer 1.6s ease-in-out infinite',
  borderRadius: '8px',
}

// Single shimmer block with configurable style overrides
function ShimmerBlock({ style, className }: { style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={className}
      style={{ ...shimmerStyle, ...style }}
      aria-hidden="true"
    />
  )
}

// card variant — rounded-2xl block
function CardSkeleton({ height = 120, count = 1 }: { height?: number; count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid var(--bo-border)',
          }}
          aria-hidden="true"
        >
          <ShimmerBlock style={{ height }} />
        </div>
      ))}
    </>
  )
}

// kpi variant — 4-column grid of mini KPI blocks
function KPISkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
      }}
      aria-hidden="true"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bo-elevated)',
            border: '1px solid var(--bo-border)',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* label row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShimmerBlock style={{ width: 26, height: 26, borderRadius: '8px', flexShrink: 0 }} />
            <ShimmerBlock style={{ height: 8, width: '55%', borderRadius: '4px' }} />
          </div>
          {/* number */}
          <ShimmerBlock style={{ height: 22, width: '70%', borderRadius: '6px' }} />
          {/* sublabel */}
          <ShimmerBlock style={{ height: 8, width: '40%', borderRadius: '4px' }} />
        </div>
      ))}
    </div>
  )
}

// row variant — single horizontal row (table-row style)
function RowSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '14px 16px',
            borderBottom: '1px solid var(--bo-border)',
          }}
          aria-hidden="true"
        >
          <ShimmerBlock style={{ width: 36, height: 36, borderRadius: '8px', flexShrink: 0 }} />
          <ShimmerBlock style={{ height: 12, flex: 1, borderRadius: '6px' }} />
          <ShimmerBlock style={{ height: 12, width: 80, borderRadius: '6px', flexShrink: 0 }} />
          <ShimmerBlock style={{ height: 12, width: 60, borderRadius: '6px', flexShrink: 0 }} />
          <ShimmerBlock style={{ height: 24, width: 70, borderRadius: '20px', flexShrink: 0 }} />
        </div>
      ))}
    </>
  )
}

// table variant — thead + 5 tbody rows
function TableSkeleton() {
  return (
    <div
      style={{
        background: 'var(--bo-elevated)',
        border: '1px solid var(--bo-border)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {/* thead */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '12px 16px',
          borderBottom: '1px solid var(--bo-border)',
          background: 'var(--bo-surface)',
        }}
      >
        {[40, 120, 80, 80, 60, 60].map((w, i) => (
          <ShimmerBlock key={i} style={{ height: 10, width: w, borderRadius: '4px', flexShrink: 0, opacity: 0.6 }} />
        ))}
      </div>
      {/* tbody rows */}
      <RowSkeleton count={5} />
    </div>
  )
}

// list variant — avatar circle + 2 text lines
function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderBottom: '1px solid var(--bo-border)',
          }}
        >
          {/* avatar circle */}
          <ShimmerBlock
            style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }}
          />
          {/* text lines */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <ShimmerBlock style={{ height: 11, width: `${55 + (i % 3) * 15}%`, borderRadius: '5px' }} />
            <ShimmerBlock style={{ height: 9, width: `${35 + (i % 2) * 20}%`, borderRadius: '5px' }} />
          </div>
          <ShimmerBlock style={{ height: 22, width: 60, borderRadius: '20px', flexShrink: 0 }} />
        </div>
      ))}
    </div>
  )
}

export function LoadingSkeleton({
  variant = 'card',
  count = 1,
  height = 120,
  className = '',
}: LoadingSkeletonProps) {
  return (
    <>
      {/* Inject keyframes once via a style tag — safe in RSC/client alike */}
      <style>{`
        @keyframes bo-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className={className} role="status" aria-label="Carregando...">
        {variant === 'card'  && <CardSkeleton  height={height} count={count} />}
        {variant === 'kpi'   && <KPISkeleton />}
        {variant === 'row'   && <RowSkeleton   count={count} />}
        {variant === 'table' && <TableSkeleton />}
        {variant === 'list'  && <ListSkeleton  count={count > 1 ? count : 4} />}
      </div>
    </>
  )
}
