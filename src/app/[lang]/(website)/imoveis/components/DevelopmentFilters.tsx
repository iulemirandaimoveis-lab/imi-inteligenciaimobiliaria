'use client'

import { cn } from '@/lib/utils'

export type FilterOption = 'todos' | 'lancamento' | 'pronta-entrega' | 'frente-mar' | 'casas'

interface DevelopmentFiltersProps {
  active: FilterOption
  onChange: (filter: FilterOption) => void
}

const filters: { value: FilterOption; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'lancamento', label: 'Lançamento' },
  { value: 'pronta-entrega', label: 'Pronta Entrega' },
  { value: 'frente-mar', label: 'Frente Mar' },
  { value: 'casas', label: 'Casas' },
]

export default function DevelopmentFilters({ active, onChange }: DevelopmentFiltersProps) {
  return (
    <div className="sticky top-16 lg:top-20 z-30 bg-white border-b border-slate-200">
      <div className="container-custom py-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onChange(filter.value)}
              className={cn(
                'flex-shrink-0 h-10 px-5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                active === filter.value
                  ? 'bg-navy-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
