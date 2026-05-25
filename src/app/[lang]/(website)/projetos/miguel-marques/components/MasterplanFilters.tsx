'use client'

import React, { useMemo, useState } from 'react'
import { ALL_LOTS, type Lot, type LotStatus } from '../data/lotsData'

interface Props {
  onFilterChange: (ids: Set<string> | null) => void
}

type StatusFilter = 'todos' | LotStatus
type SizeFilter = 'todos' | 'small' | 'standard' | 'large'
type SpecialFilter = 'none' | 'lakefront' | 'corner'

const STATUS_OPTIONS: { value: StatusFilter; label: string; color: string }[] = [
  { value: 'todos',       label: 'Todos',         color: '#6B6B6B' },
  { value: 'disponivel',  label: 'Disponíveis',   color: '#7EA87A' },
  { value: 'negociacao',  label: 'Em Negociação', color: '#C8A878' },
  { value: 'proprietario',label: 'Proprietário',  color: '#6B7C56' },
]

const SIZE_OPTIONS: { value: SizeFilter; label: string }[] = [
  { value: 'todos',    label: 'Qualquer tamanho' },
  { value: 'small',    label: '< 160 m²' },
  { value: 'standard', label: '160 m²' },
  { value: 'large',    label: '> 200 m²' },
]

export default function MasterplanFilters({ onFilterChange }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('todos')
  const [specialFilter, setSpecialFilter] = useState<SpecialFilter>('none')

  const stats = useMemo(() => {
    const disponivel = ALL_LOTS.filter(l => l.status === 'disponivel').length
    const vendido = ALL_LOTS.filter(l => l.status === 'vendido').length
    const proprietario = ALL_LOTS.filter(l => l.status === 'proprietario').length
    const negociacao = ALL_LOTS.filter(l => l.status === 'negociacao').length
    return { disponivel, vendido, proprietario, negociacao, total: ALL_LOTS.length }
  }, [])

  function applyFilters(status: StatusFilter, size: SizeFilter, special: SpecialFilter) {
    let filtered: Lot[] = ALL_LOTS

    if (status !== 'todos') {
      filtered = filtered.filter(l => l.status === status)
    }
    if (size === 'small') {
      filtered = filtered.filter(l => l.metragem < 160)
    } else if (size === 'standard') {
      filtered = filtered.filter(l => l.metragem >= 155 && l.metragem <= 165)
    } else if (size === 'large') {
      filtered = filtered.filter(l => l.metragem > 200)
    }
    if (special === 'lakefront') {
      filtered = filtered.filter(l => l.isLakefront || l.quadra === 'Z')
    } else if (special === 'corner') {
      filtered = filtered.filter(l => l.isCorner)
    }

    const isAll = status === 'todos' && size === 'todos' && special === 'none'
    onFilterChange(isAll ? null : new Set(filtered.map(l => l.id)))
  }

  function handleStatus(value: StatusFilter) {
    setStatusFilter(value)
    applyFilters(value, sizeFilter, specialFilter)
  }
  function handleSize(value: SizeFilter) {
    setSizeFilter(value)
    applyFilters(statusFilter, value, specialFilter)
  }
  function handleSpecial(value: SpecialFilter) {
    const next = specialFilter === value ? 'none' : value
    setSpecialFilter(next)
    applyFilters(statusFilter, sizeFilter, next)
  }

  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#E8E2D8] shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats bar */}
        <div className="flex items-center gap-6 py-2.5 border-b border-[#F0EBE3] text-xs text-[#8A8278]">
          <span className="font-medium text-[#1A1A1A]">{stats.total} lotes</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7EA87A]" />
            {stats.disponivel} disponíveis
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#B8B4AE]" />
            {stats.vendido} vendidos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C8A878]" />
            {stats.negociacao} em negociação
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#6B7C56]" />
            {stats.proprietario} proprietários
          </span>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 py-3 flex-wrap">
          <span className="text-xs font-semibold text-[#8A8278] uppercase tracking-widest mr-1">
            Filtrar:
          </span>

          {/* Status filters */}
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleStatus(opt.value)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                border transition-all duration-200
                ${statusFilter === opt.value
                  ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                  : 'border-[#E8E2D8] bg-white text-[#4A4A4A] hover:border-[#C8C0B4]'
                }
              `}
            >
              {opt.value !== 'todos' && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: opt.color }}
                />
              )}
              {opt.label}
            </button>
          ))}

          <div className="w-px h-4 bg-[#E8E2D8] mx-1" />

          {/* Size filters */}
          {SIZE_OPTIONS.slice(1).map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSize(sizeFilter === opt.value ? 'todos' : opt.value)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200
                ${sizeFilter === opt.value
                  ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                  : 'border-[#E8E2D8] bg-white text-[#4A4A4A] hover:border-[#C8C0B4]'
                }
              `}
            >
              {opt.label}
            </button>
          ))}

          <div className="w-px h-4 bg-[#E8E2D8] mx-1" />

          {/* Special filters */}
          <button
            onClick={() => handleSpecial('lakefront')}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              border transition-all duration-200
              ${specialFilter === 'lakefront'
                ? 'border-[#7AAFC8] bg-[#7AAFC8]/10 text-[#2A6A88]'
                : 'border-[#E8E2D8] bg-white text-[#4A4A4A] hover:border-[#B8D4E8]'
              }
            `}
          >
            <span className="text-[#7AAFC8]">◈</span>
            Frente ao Lago
          </button>
          <button
            onClick={() => handleSpecial('corner')}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              border transition-all duration-200
              ${specialFilter === 'corner'
                ? 'border-[#C8A44A] bg-[#C8A44A]/10 text-[#8A6A1A]'
                : 'border-[#E8E2D8] bg-white text-[#4A4A4A] hover:border-[#E8D89A]'
              }
            `}
          >
            <span className="text-[#C8A44A]">◆</span>
            Esquinas
          </button>
        </div>
      </div>
    </div>
  )
}
