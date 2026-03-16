'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, SlidersHorizontal, X, TrendingDown } from 'lucide-react'
import type { PropertyFilters } from '../types'
import { PROPERTY_TYPES, PROPERTY_STATUSES } from '../types'
import { getScoreColor } from '../services/score.service'

interface AdvancedFilterPanelProps {
  filters: PropertyFilters
  onChange: (filters: PropertyFilters) => void
  totalCount: number
  filteredCount: number
  className?: string
}

const BEDROOMS = [1, 2, 3, 4, 5]

function FilterGroup({ title, children, defaultOpen = true }: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: '1px solid rgba(200,164,74,0.10)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{
          fontSize: '8.5px', fontWeight: 700, letterSpacing: '2.5px',
          textTransform: 'uppercase', color: 'var(--bo-text-dim, #5C6B7D)',
          fontFamily: 'var(--font-montserrat, sans-serif)',
        }}>
          {title}
        </span>
        {open
          ? <ChevronUp size={12} style={{ color: 'var(--bo-text-dim, #5C6B7D)' }} />
          : <ChevronDown size={12} style={{ color: 'var(--bo-text-dim, #5C6B7D)' }} />
        }
      </button>
      {open && <div style={{ paddingBottom: 14 }}>{children}</div>}
    </div>
  )
}

function ChipSelect({ options, value, onChange, multi = true }: {
  options: { value: string; label: string }[]
  value: string[]
  onChange: (v: string[]) => void
  multi?: boolean
}) {
  const toggle = (v: string) => {
    if (multi) {
      onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
    } else {
      onChange(value.includes(v) ? [] : [v])
    }
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
      {options.map(o => {
        const active = value.includes(o.value)
        return (
          <button
            key={o.value}
            onClick={() => toggle(o.value)}
            style={{
              padding: '6px 12px', borderRadius: 999,
              background: active ? 'rgba(200,164,74,0.12)' : 'var(--bo-surface, rgba(255,255,255,0.04))',
              border: `1px solid ${active ? 'rgba(200,164,74,0.40)' : 'rgba(255,255,255,0.08)'}`,
              color: active ? '#C8A44A' : 'var(--bo-text-muted, #9FAAB8)',
              fontSize: '12px', fontWeight: active ? 600 : 400,
              fontFamily: 'var(--font-montserrat, sans-serif)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              minHeight: 36,
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function RangeRow({ labelMin, labelMax, min, max, onMin, onMax, prefix = '' }: {
  labelMin: string; labelMax: string
  min: number | null; max: number | null
  onMin: (v: number | null) => void
  onMax: (v: number | null) => void
  prefix?: string
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
      <div>
        <label style={{
          display: 'block', fontSize: '8px', letterSpacing: '1.5px',
          textTransform: 'uppercase', color: 'var(--bo-text-dim, #5C6B7D)',
          marginBottom: 3, fontFamily: 'var(--font-montserrat, sans-serif)',
        }}>
          {labelMin}
        </label>
        <input
          type="number"
          placeholder={`${prefix} mín`}
          value={min ?? ''}
          onChange={e => onMin(e.target.value ? Number(e.target.value) : null)}
          style={{
            width: '100%', padding: '9px 8px',
            background: 'var(--bo-surface, rgba(255,255,255,0.04))',
            border: '1px solid rgba(200,164,74,0.18)',
            borderRadius: 4, color: 'var(--bo-text, #EBE7E0)',
            fontSize: '13px', fontFamily: 'var(--font-dm-mono, monospace)',
            outline: 'none', minHeight: 40,
          }}
        />
      </div>
      <div>
        <label style={{
          display: 'block', fontSize: '8px', letterSpacing: '1.5px',
          textTransform: 'uppercase', color: 'var(--bo-text-dim, #5C6B7D)',
          marginBottom: 3, fontFamily: 'var(--font-montserrat, sans-serif)',
        }}>
          {labelMax}
        </label>
        <input
          type="number"
          placeholder={`${prefix} máx`}
          value={max ?? ''}
          onChange={e => onMax(e.target.value ? Number(e.target.value) : null)}
          style={{
            width: '100%', padding: '9px 8px',
            background: 'var(--bo-surface, rgba(255,255,255,0.04))',
            border: '1px solid rgba(200,164,74,0.18)',
            borderRadius: 4, color: 'var(--bo-text, #EBE7E0)',
            fontSize: '13px', fontFamily: 'var(--font-dm-mono, monospace)',
            outline: 'none', minHeight: 40,
          }}
        />
      </div>
    </div>
  )
}

function ScoreSlider({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const pct = value ?? 0
  const color = getScoreColor(pct)
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '9px', color: 'var(--bo-text-dim, #5C6B7D)', fontFamily: 'var(--font-montserrat, sans-serif)' }}>
          Score mínimo
        </span>
        <span style={{
          fontFamily: 'var(--font-dm-mono, monospace)',
          fontSize: '11px', color,
        }}>
          {value ?? 0}
        </span>
      </div>
      <input
        type="range" min={0} max={100} step={5}
        value={value ?? 0}
        onChange={e => onChange(Number(e.target.value) || null)}
        style={{ width: '100%', accentColor: color }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        <span style={{ fontSize: '8px', color: 'var(--bo-text-dim, #5C6B7D)', fontFamily: 'var(--font-montserrat, sans-serif)' }}>0</span>
        <span style={{ fontSize: '8px', color: 'var(--bo-text-dim, #5C6B7D)', fontFamily: 'var(--font-montserrat, sans-serif)' }}>100</span>
      </div>
    </div>
  )
}

export function AdvancedFilterPanel({
  filters, onChange, totalCount, filteredCount,
}: AdvancedFilterPanelProps) {
  const activeCount = [
    filters.status.length > 0,
    filters.type.length > 0,
    filters.minPrice || filters.maxPrice,
    filters.minArea || filters.maxArea,
    filters.minBedrooms,
    filters.minScore,
    filters.minYield,
    filters.belowMarket,
    filters.city,
    filters.neighborhood,
  ].filter(Boolean).length

  const reset = () => onChange({
    search: filters.search,
    status: [], type: [],
    city: '', neighborhood: '',
    minPrice: null, maxPrice: null,
    minArea: null, maxArea: null,
    minBedrooms: null,
    minScore: null, minYield: null,
    belowMarket: false,
  })

  const update = (partial: Partial<PropertyFilters>) => onChange({ ...filters, ...partial })

  return (
    <aside style={{
      width: '100%',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 16px 24px',
      overflowY: 'auto',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SlidersHorizontal size={13} style={{ color: '#C8A44A' }} />
          <span style={{
            fontSize: '9px', fontWeight: 700, letterSpacing: '2px',
            textTransform: 'uppercase', color: 'var(--bo-text, #EBE7E0)',
            fontFamily: 'var(--font-montserrat, sans-serif)',
          }}>
            Filtros
          </span>
          {activeCount > 0 && (
            <span style={{
              width: 16, height: 16, borderRadius: 999,
              background: 'rgba(200,164,74,0.20)',
              border: '1px solid rgba(200,164,74,0.40)',
              fontSize: '9px', fontFamily: 'var(--font-dm-mono, monospace)',
              color: '#C8A44A', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={reset}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: '9px', color: 'var(--bo-text-dim, #5C6B7D)',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-montserrat, sans-serif)',
            }}
          >
            <X size={10} /> Limpar
          </button>
        )}
      </div>

      {/* Results count */}
      <div style={{
        padding: '8px 10px', borderRadius: 6, marginBottom: 12,
        background: 'rgba(200,164,74,0.06)',
        border: '1px solid rgba(200,164,74,0.12)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '10px', color: 'var(--bo-text-muted, #9FAAB8)', fontFamily: 'var(--font-montserrat, sans-serif)' }}>
          Resultados
        </span>
        <span style={{ fontFamily: 'var(--font-dm-mono, monospace)', fontSize: '11px', color: '#C8A44A' }}>
          {filteredCount} / {totalCount}
        </span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <FilterGroup title="Status">
          <ChipSelect
            options={PROPERTY_STATUSES}
            value={filters.status}
            onChange={v => update({ status: v })}
          />
        </FilterGroup>

        <FilterGroup title="Tipo de Imóvel">
          <ChipSelect
            options={PROPERTY_TYPES}
            value={filters.type}
            onChange={v => update({ type: v })}
          />
        </FilterGroup>

        <FilterGroup title="Localização">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
            <input
              type="text"
              placeholder="Cidade"
              value={filters.city}
              onChange={e => update({ city: e.target.value })}
              style={{
                padding: '9px 10px',
                background: 'var(--bo-surface, rgba(255,255,255,0.04))',
                border: '1px solid rgba(200,164,74,0.18)',
                borderRadius: 4, color: 'var(--bo-text, #EBE7E0)',
                fontSize: '13px', fontFamily: 'var(--font-montserrat, sans-serif)',
                outline: 'none', minHeight: 40, width: '100%',
              }}
            />
            <input
              type="text"
              placeholder="Bairro"
              value={filters.neighborhood}
              onChange={e => update({ neighborhood: e.target.value })}
              style={{
                padding: '9px 10px',
                background: 'var(--bo-surface, rgba(255,255,255,0.04))',
                border: '1px solid rgba(200,164,74,0.18)',
                borderRadius: 4, color: 'var(--bo-text, #EBE7E0)',
                fontSize: '13px', fontFamily: 'var(--font-montserrat, sans-serif)',
                outline: 'none', minHeight: 40, width: '100%',
              }}
            />
          </div>
        </FilterGroup>

        <FilterGroup title="Preço">
          <RangeRow
            labelMin="Mínimo" labelMax="Máximo"
            min={filters.minPrice} max={filters.maxPrice}
            onMin={v => update({ minPrice: v })}
            onMax={v => update({ maxPrice: v })}
            prefix="R$"
          />
        </FilterGroup>

        <FilterGroup title="Área (m²)">
          <RangeRow
            labelMin="Mínima" labelMax="Máxima"
            min={filters.minArea} max={filters.maxArea}
            onMin={v => update({ minArea: v })}
            onMax={v => update({ maxArea: v })}
          />
        </FilterGroup>

        <FilterGroup title="Quartos">
          <ChipSelect
            multi={false}
            options={BEDROOMS.map(b => ({ value: String(b), label: b === 5 ? '5+' : String(b) }))}
            value={filters.minBedrooms ? [String(filters.minBedrooms)] : []}
            onChange={v => update({ minBedrooms: v[0] ? Number(v[0]) : null })}
          />
        </FilterGroup>

        <FilterGroup title="Inteligência IMI" defaultOpen={false}>
          <ScoreSlider value={filters.minScore} onChange={v => update({ minScore: v })} />

          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '9px', color: 'var(--bo-text-dim, #5C6B7D)', fontFamily: 'var(--font-montserrat, sans-serif)' }}>
                Yield mínimo (%)
              </span>
              <span style={{ fontFamily: 'var(--font-dm-mono, monospace)', fontSize: '11px', color: '#5DB887' }}>
                {filters.minYield ?? 0}%
              </span>
            </div>
            <input
              type="range" min={0} max={15} step={0.5}
              value={filters.minYield ?? 0}
              onChange={e => update({ minYield: Number(e.target.value) || null })}
              style={{ width: '100%', accentColor: '#5DB887' }}
            />
          </div>

          <button
            onClick={() => update({ belowMarket: !filters.belowMarket })}
            style={{
              width: '100%', marginTop: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', borderRadius: 6,
              background: filters.belowMarket ? 'rgba(93,184,135,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filters.belowMarket ? 'rgba(93,184,135,0.30)' : 'rgba(255,255,255,0.08)'}`,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingDown size={12} style={{ color: filters.belowMarket ? '#5DB887' : '#9FAAB8' }} />
              <span style={{
                fontSize: '10px', fontWeight: 500,
                color: filters.belowMarket ? '#5DB887' : 'var(--bo-text-muted, #9FAAB8)',
                fontFamily: 'var(--font-montserrat, sans-serif)',
              }}>
                Abaixo do mercado
              </span>
            </div>
            <div style={{
              width: 32, height: 18, borderRadius: 999,
              background: filters.belowMarket ? '#5DB887' : 'rgba(255,255,255,0.1)',
              position: 'relative', transition: 'background 150ms',
            }}>
              <div style={{
                position: 'absolute', top: 3,
                left: filters.belowMarket ? 16 : 3,
                width: 12, height: 12, borderRadius: '50%',
                background: filters.belowMarket ? '#0B1928' : '#9FAAB8',
                transition: 'left 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }} />
            </div>
          </button>
        </FilterGroup>
      </div>
    </aside>
  )
}
