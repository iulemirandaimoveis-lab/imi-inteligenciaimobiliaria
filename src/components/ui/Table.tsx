// components/ui/Table.tsx
// Table Component - Tabelas Profissionais e Refinadas

'use client'

import { HTMLAttributes, forwardRef, ThHTMLAttributes, TdHTMLAttributes } from 'react'
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// TABLE CONTAINER
// ============================================

const TableContainer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'w-full overflow-x-auto',
                    'border border-imi-100 rounded-[16px]',
                    'bg-white shadow-sm',
                    className
                )}
                {...props}
            />
        )
    }
)

TableContainer.displayName = 'TableContainer'

// ============================================
// TABLE
// ============================================

const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
    ({ className, ...props }, ref) => {
        return (
            <table
                ref={ref}
                className={cn('w-full', className)}
                {...props}
            />
        )
    }
)

Table.displayName = 'Table'

// ============================================
// TABLE HEADER
// ============================================

const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => {
        return (
            <thead
                ref={ref}
                className={cn(
                    'bg-imi-50 border-b border-imi-100',
                    className
                )}
                {...props}
            />
        )
    }
)

TableHeader.displayName = 'TableHeader'

// ============================================
// TABLE BODY
// ============================================

const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => {
        return (
            <tbody
                ref={ref}
                className={cn('divide-y divide-imi-50', className)}
                {...props}
            />
        )
    }
)

TableBody.displayName = 'TableBody'

// ============================================
// TABLE ROW
// ============================================

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
    clickable?: boolean
}

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
    ({ className, clickable, ...props }, ref) => {
        return (
            <tr
                ref={ref}
                className={cn(
                    'transition-colors duration-150',
                    clickable && 'hover:bg-imi-50 cursor-pointer',
                    className
                )}
                {...props}
            />
        )
    }
)

TableRow.displayName = 'TableRow'

// ============================================
// TABLE HEAD CELL
// ============================================

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
    sortable?: boolean
    sorted?: 'asc' | 'desc' | null
    onSort?: () => void
}

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
    ({ className, sortable, sorted, onSort, children, ...props }, ref) => {
        return (
            <th
                ref={ref}
                className={cn(
                    'px-[24px] py-[16px]',
                    'text-left text-xs font-medium text-imi-600',
                    'uppercase tracking-wide',
                    sortable && 'cursor-pointer select-none hover:text-imi-900 transition-colors',
                    className
                )}
                onClick={sortable ? onSort : undefined}
                {...props}
            >
                <div className="flex items-center gap-[8px]">
                    {children}
                    {sortable && (
                        <div className="w-[16px] h-[16px] flex items-center justify-center">
                            {sorted === 'asc' && <ArrowUp size={14} className="text-accent-600" />}
                            {sorted === 'desc' && <ArrowDown size={14} className="text-accent-600" />}
                            {!sorted && <ChevronsUpDown size={14} className="text-imi-400" />}
                        </div>
                    )}
                </div>
            </th>
        )
    }
)

TableHead.displayName = 'TableHead'

// ============================================
// TABLE CELL
// ============================================

const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
    ({ className, ...props }, ref) => {
        return (
            <td
                ref={ref}
                className={cn(
                    'px-[24px] py-[16px]',
                    'text-sm text-imi-900',
                    className
                )}
                {...props}
            />
        )
    }
)

TableCell.displayName = 'TableCell'

// ============================================
// TABLE FOOTER
// ============================================

const TableFooter = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => {
        return (
            <tfoot
                ref={ref}
                className={cn(
                    'bg-imi-50 border-t border-imi-100',
                    'font-medium',
                    className
                )}
                {...props}
            />
        )
    }
)

TableFooter.displayName = 'TableFooter'

// ============================================
// TABLE CAPTION
// ============================================

const TableCaption = forwardRef<HTMLTableCaptionElement, HTMLAttributes<HTMLTableCaptionElement>>(
    ({ className, ...props }, ref) => {
        return (
            <caption
                ref={ref}
                className={cn(
                    'py-[16px] text-sm text-imi-600',
                    className
                )}
                {...props}
            />
        )
    }
)

TableCaption.displayName = 'TableCaption'

// ============================================
// TABLE PAGINATION
// ============================================

interface TablePaginationProps extends HTMLAttributes<HTMLDivElement> {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    totalItems?: number
    itemsPerPage?: number
}

const TablePagination = forwardRef<HTMLDivElement, TablePaginationProps>(
    ({
        className,
        currentPage,
        totalPages,
        onPageChange,
        totalItems,
        itemsPerPage,
        ...props
    }, ref) => {

        const startItem = ((currentPage - 1) * (itemsPerPage || 10)) + 1
        const endItem = Math.min(currentPage * (itemsPerPage || 10), totalItems || 0)

        return (
            <div
                ref={ref}
                className={cn(
                    'flex items-center justify-between',
                    'px-[24px] py-[16px]',
                    'border-t border-imi-100',
                    className
                )}
                {...props}
            >
                {/* Info */}
                <div className="text-sm text-imi-600">
                    {totalItems && (
                        <span>
                            Mostrando <span className="font-medium text-imi-900">{startItem}</span> a{' '}
                            <span className="font-medium text-imi-900">{endItem}</span> de{' '}
                            <span className="font-medium text-imi-900">{totalItems}</span> resultados
                        </span>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex items-center gap-[8px]">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={cn(
                            'h-[40px] px-[16px] rounded-[8px]',
                            'text-sm font-medium',
                            'border border-imi-200',
                            'transition-all duration-200',
                            'hover:bg-imi-50 hover:border-imi-300',
                            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white'
                        )}
                    >
                        Anterior
                    </button>

                    <div className="flex items-center gap-[4px]">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                                pageNum = i + 1
                            } else if (currentPage <= 3) {
                                pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                            } else {
                                pageNum = currentPage - 2 + i
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={cn(
                                        'w-[40px] h-[40px] rounded-[8px]',
                                        'text-sm font-medium',
                                        'transition-all duration-200',
                                        pageNum === currentPage
                                            ? 'bg-accent-500 text-white'
                                            : 'text-imi-700 hover:bg-imi-100'
                                    )}
                                >
                                    {pageNum}
                                </button>
                            )
                        })}
                    </div>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={cn(
                            'h-[40px] px-[16px] rounded-[8px]',
                            'text-sm font-medium',
                            'border border-imi-200',
                            'transition-all duration-200',
                            'hover:bg-imi-50 hover:border-imi-300',
                            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white'
                        )}
                    >
                        Próximo
                    </button>
                </div>
            </div>
        )
    }
)

TablePagination.displayName = 'TablePagination'

export {
    Table,
    TableContainer,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    TableFooter,
    TableCaption,
    TablePagination,
}

export default Table
