'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { T } from '@/app/(backoffice)/lib/theme'

/* ── Types ──────────────────────────────────────────────── */

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  width?: string
  render?: (value: unknown, row: T) => React.ReactNode
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyState?: React.ReactNode
  onRowClick?: (row: T) => void
  className?: string
  stickyHeader?: boolean
}

/* ── Shimmer Row ────────────────────────────────────────── */

function ShimmerRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div
            style={{
              height: 14,
              borderRadius: 4,
              background: T.border,
              opacity: 0.5,
              width: `${55 + (i * 17) % 40}%`,
              animation: 'shimmer 1.6s ease-in-out infinite',
            }}
          />
        </td>
      ))}
    </tr>
  )
}

/* ── Sort Direction ─────────────────────────────────────── */

type SortDir = 'asc' | 'desc' | null

/* ── DataTable ──────────────────────────────────────────── */

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyState,
  onRowClick,
  className,
  stickyHeader = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  /* ── Sort handler ── */
  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'))
        if (sortDir === 'desc') setSortKey(null)
      } else {
        setSortKey(key)
        setSortDir('asc')
      }
    },
    [sortKey, sortDir],
  )

  /* ── Sorted data ── */
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const aStr = String(aVal)
      const bStr = String(bVal)
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })
  }, [data, sortKey, sortDir])

  /* ── Chevron indicator ── */
  const renderSortIcon = (key: string) => {
    if (sortKey !== key || !sortDir) {
      return (
        <span style={{ color: T.textMuted, opacity: 0.35, marginLeft: 4, fontSize: 9 }}>
          {'▲'}
        </span>
      )
    }
    return (
      <span style={{ color: T.accent, marginLeft: 4, fontSize: 9 }}>
        {sortDir === 'asc' ? '▲' : '▼'}
      </span>
    )
  }

  /* ── Styles ── */
  const tableWrapperStyle: React.CSSProperties = {
    width: '100%',
    overflowX: 'auto',
    borderRadius: T.radius.md,
    border: `1px solid ${T.border}`,
    background: T.elevated,
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    borderSpacing: 0,
  }

  const thStyle = (col: Column<T>): React.CSSProperties => ({
    padding: '10px 16px',
    textAlign: 'left',
    background: T.surface,
    color: T.textMuted,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    cursor: col.sortable ? 'pointer' : 'default',
    width: col.width ?? 'auto',
    borderBottom: `1px solid ${T.border}`,
    position: stickyHeader ? 'sticky' : undefined,
    top: stickyHeader ? 0 : undefined,
    zIndex: stickyHeader ? 2 : undefined,
    transition: `color ${T.transition.fast}`,
  })

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    color: T.text,
    fontSize: 13,
    borderBottom: `1px solid ${T.border}`,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 320,
  }

  const rowInteractive = !!onRowClick

  return (
    <>
      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>

      <div style={tableWrapperStyle} className={className}>
        <table style={tableStyle}>
          {/* ── Head ── */}
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={thStyle(col)}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  {col.label}
                  {col.sortable && renderSortIcon(col.key)}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {/* Loading */}
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <ShimmerRow key={`shimmer-${i}`} cols={columns.length} />
              ))}

            {/* Empty */}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ padding: '48px 16px', textAlign: 'center' }}>
                  {emptyState ?? (
                    <span style={{ color: T.textMuted, fontSize: 13 }}>
                      Nenhum registro encontrado.
                    </span>
                  )}
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!loading &&
              sortedData.map((row, rowIdx) => (
                <tr
                  key={(row.id as string | number) ?? rowIdx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={{
                    cursor: rowInteractive ? 'pointer' : 'default',
                    transition: `background ${T.transition.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    if (rowInteractive) {
                      ;(e.currentTarget as HTMLElement).style.background = T.hover
                    }
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{ ...tdStyle, width: col.width ?? 'auto' }}>
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] as React.ReactNode) ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
