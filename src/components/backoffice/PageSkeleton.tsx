'use client'

import { T } from '@/app/(backoffice)/lib/theme'

/* ── Shimmer block ── */
function Shimmer({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{
        background: `linear-gradient(90deg, ${T.elevated} 0%, ${T.surface} 50%, ${T.elevated} 100%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    />
  )
}

/* ── KPI row skeleton ── */
export function KPIRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl space-y-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-8 w-32" />
          <Shimmer className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

/* ── Table skeleton ── */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
      {/* Header */}
      <div className="flex gap-4 px-6 py-4" style={{ background: T.elevated, borderBottom: `1px solid ${T.border}` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Shimmer key={i} className="h-3" style={{ width: i === 0 ? '140px' : '80px', flexShrink: 0 }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 items-center px-6 py-4"
          style={{ borderBottom: `1px solid ${T.border}`, background: rowIdx % 2 === 0 ? T.surface : T.bg }}>
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Shimmer key={colIdx} className="h-3" style={{ width: colIdx === 0 ? '140px' : '80px', flexShrink: 0 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

/* ── Card grid skeleton ── */
export function CardGridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-5`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 space-y-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <Shimmer className="w-full h-40" />
          <Shimmer className="h-5 w-3/4" />
          <Shimmer className="h-3 w-1/2" />
          <div className="flex gap-2">
            <Shimmer className="h-7 w-20" />
            <Shimmer className="h-7 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Full page skeleton (header + KPIs + table) ── */
export default function PageSkeleton({
  title = '',
  kpis = 4,
  tableRows = 6,
}: {
  title?: string
  kpis?: number
  tableRows?: number
}) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          {title
            ? <p className="text-lg font-bold" style={{ color: T.text }}>{title}</p>
            : <Shimmer className="h-7 w-48" />
          }
          <Shimmer className="h-3 w-32" />
        </div>
        <Shimmer className="h-10 w-32" />
      </div>

      {/* KPI row */}
      <KPIRowSkeleton count={kpis} />

      {/* Table */}
      <TableSkeleton rows={tableRows} />
    </div>
  )
}
