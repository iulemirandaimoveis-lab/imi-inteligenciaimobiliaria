'use client'

import { useRef, useState } from 'react'
import { Search, ChevronDown, Loader2, MapPin } from 'lucide-react'
import { useIntelligenceLocationSearch } from '@/hooks/useIntelligenceLocationSearch'

interface LocationSearchPanelProps {
  onStateSelect?: (stateUf: string) => void
  onMunicipalitySelect?: (municipalityName: string, stateUf: string) => void
  onNeighborhoodSelect?: (neighborhoodName: string) => void
}

const TYPE_CONFIG = {
  state: { label: 'Estado', color: '#C8A44A', bg: 'rgba(200,164,74,0.12)' },
  municipality: { label: 'Município', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  neighborhood: { label: 'Bairro', color: '#4ADE80', bg: 'rgba(74,222,128,0.12)' },
} as const

export function LocationSearchPanel({
  onStateSelect,
  onMunicipalitySelect,
  onNeighborhoodSelect,
}: LocationSearchPanelProps) {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('')
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    query,
    setQuery,
    suggestions,
    selectSuggestion,
    stateUf,
    setStateUf,
    municipalityId,
    setMunicipalityId,
    states,
    municipalities,
    neighborhoods,
    selectedMunicipality,
    isLoading,
  } = useIntelligenceLocationSearch()

  function handleSelect(suggestion: (typeof suggestions)[number]) {
    selectSuggestion(suggestion)
    if (suggestion.type === 'state' && suggestion.stateUf) {
      onStateSelect?.(suggestion.stateUf)
      onNeighborhoodSelect?.('')
    }
    if (suggestion.type === 'municipality' && suggestion.stateUf) {
      onMunicipalitySelect?.(suggestion.name, suggestion.stateUf)
      onNeighborhoodSelect?.('')
    }
    if (suggestion.type === 'neighborhood' && suggestion.stateUf && suggestion.municipalityName) {
      onMunicipalitySelect?.(suggestion.municipalityName, suggestion.stateUf)
      onNeighborhoodSelect?.(suggestion.name)
    }
    setIsSuggestionsOpen(false)
    setFocusedIndex(-1)
  }

  return (
    <div className="space-y-2.5" aria-label="Busca de localização nacional">

      {/* ── Global search ── */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-[#8496AC] pointer-events-none" />
          {isLoading && query.trim() && (
            <Loader2 className="absolute right-3 w-3.5 h-3.5 text-[#8496AC] animate-spin pointer-events-none" />
          )}
          <input
            ref={inputRef}
            id="location-search-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsSuggestionsOpen(true)
              setFocusedIndex(-1)
            }}
            onFocus={() => setIsSuggestionsOpen(true)}
            onBlur={() => setTimeout(() => setIsSuggestionsOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsSuggestionsOpen(false)
                setFocusedIndex(-1)
                inputRef.current?.blur()
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setFocusedIndex((i) => Math.min(i + 1, suggestions.length - 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setFocusedIndex((i) => Math.max(i - 1, -1))
              }
              if (e.key === 'Enter') {
                e.preventDefault()
                const idx = focusedIndex >= 0 ? focusedIndex : 0
                if (suggestions[idx]) handleSelect(suggestions[idx])
              }
            }}
            placeholder="Busque estado, cidade ou bairro…"
            autoComplete="off"
            className={[
              'w-full h-9 pl-9 pr-9 rounded-lg text-sm text-white placeholder:text-[#75899E]',
              'bg-[#0B1928] border border-[#C8A44A]/50',
              'outline-none focus:border-white/[0.08] focus:ring-0',
              'transition-all duration-200',
            ].join(' ')}
            aria-expanded={isSuggestionsOpen && !!query.trim()}
            aria-controls="location-suggestions"
            aria-activedescendant={focusedIndex >= 0 ? `suggestion-${focusedIndex}` : undefined}
          />
        </div>

        {/* Dropdown suggestions */}
        {isSuggestionsOpen && query.trim() && (
          <div
            id="location-suggestions"
            role="listbox"
            className={[
              'absolute top-full left-0 right-0 mt-1 z-50',
              'bg-[#0B1928] border border-white/[0.08] rounded-xl',
              'shadow-xl shadow-black/40 overflow-hidden',
            ].join(' ')}
          >
            {suggestions.length > 0 ? (
              <ul className="py-1 max-h-64 overflow-y-auto">
                {suggestions.map((s, i) => {
                  const cfg = TYPE_CONFIG[s.type]
                  return (
                    <li key={s.id} id={`suggestion-${i}`} role="option" aria-selected={i === focusedIndex}>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleSelect(s) }}
                        onMouseEnter={() => setFocusedIndex(i)}
                        className={[
                          'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                          i === focusedIndex ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]',
                        ].join(' ')}
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: cfg.color }} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-white">{s.name}</span>
                          {s.context && (
                            <span className="text-xs text-[#8496AC] ml-1.5">{s.context}</span>
                          )}
                        </div>
                        <span
                          className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ color: cfg.color, background: cfg.bg }}
                        >
                          {cfg.label}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="flex items-center gap-2.5 px-3 py-3">
                <Search className="w-3.5 h-3.5 text-[#334E68] shrink-0" />
                <p className="text-xs text-[#8496AC]">
                  Nenhuma região encontrada. Tente buscar por cidade, estado ou bairro.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Hierarchical selects ── */}
      <div className="grid grid-cols-3 gap-2">
        <SelectField
          aria-label="Estado"
          value={stateUf}
          disabled={states.length === 0}
          onChange={(v) => {
            setStateUf(v)
            setMunicipalityId(null)
            setSelectedNeighborhood('')
            onStateSelect?.(v)
            onNeighborhoodSelect?.('')
          }}
          placeholder="Estado"
        >
          {states.map((s) => (
            <option key={s.id} value={s.uf}>{s.uf} — {s.name}</option>
          ))}
        </SelectField>

        <SelectField
          aria-label="Município"
          value={municipalityId != null ? String(municipalityId) : ''}
          disabled={!stateUf || municipalities.length === 0}
          onChange={(v) => {
            const nextId = v ? Number(v) : null
            setMunicipalityId(nextId)
            const mun = municipalities.find((m) => m.id === nextId)
            if (mun) {
              setSelectedNeighborhood('')
              onMunicipalitySelect?.(mun.name, mun.stateUf)
            }
          }}
          placeholder="Município"
        >
          {municipalities.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </SelectField>

        <SelectField
          aria-label="Bairro"
          value={selectedNeighborhood}
          disabled={!selectedMunicipality || neighborhoods.length === 0}
          onChange={(v) => {
            setSelectedNeighborhood(v)
            onNeighborhoodSelect?.(v)
          }}
          placeholder="Bairro"
        >
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.name}>{n.name}</option>
          ))}
        </SelectField>
      </div>
    </div>
  )
}

// ─── SelectField ─────────────────────────────────────────────────────────────

function SelectField({
  value,
  disabled,
  onChange,
  placeholder,
  children,
  ...rest
}: {
  value: string
  disabled?: boolean
  onChange: (v: string) => void
  placeholder: string
  children: React.ReactNode
  'aria-label'?: string
}) {
  return (
    <div className="relative">
      <select
        {...rest}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'w-full h-9 pl-3 pr-7 rounded-lg text-xs appearance-none',
          'bg-[#0B1928] border border-[#C8A44A]/50',
          'outline-none focus:border-white/[0.08] focus:ring-0',
          'transition-all duration-200',
          disabled
            ? 'text-[#75899E] cursor-not-allowed opacity-50'
            : 'text-white cursor-pointer',
        ].join(' ')}
      >
        <option value="" className="text-[#8496AC]">{placeholder}</option>
        {children}
      </select>
      <ChevronDown
        className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
        style={{ color: disabled ? '#334E68' : '#8496AC' }}
      />
    </div>
  )
}
