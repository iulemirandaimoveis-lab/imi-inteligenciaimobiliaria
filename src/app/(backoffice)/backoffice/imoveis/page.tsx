'use client'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Grid3X3, List, SortAsc, SortDesc,
  Building2, TrendingUp, BarChart2, Sparkles, Scale, LineChart,
  ChevronDown, RefreshCw, Loader2, X, SlidersHorizontal,
  CheckSquare, Keyboard,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PropertyCard, PropertyListRow } from '@/features/properties/components/PropertyCard'
import { AdvancedFilterPanel } from '@/features/properties/components/AdvancedFilterPanel'
import { enrichProperty } from '@/features/properties/services/score.service'
import { mapDevToProperty } from '@/features/properties/services/mapDevToProperty'
import type { IMIProperty, PropertyFilters } from '@/features/properties/types'
import { DEFAULT_FILTERS } from '@/features/properties/types'
import { useIsMobile } from '@/hooks/use-is-mobile'
import {
  MobileGlobalStyles, MobileAppBar, MobileAppBarAction,
  MobileSearchBar, MobileFilterChips, MobileFiltersButton,
  MobilePropertyCard, MobilePropertyCardSkeleton,
  MobileBottomSheet, MobileEmptyState, MobileSortChips,
} from './mobile-ui'
import { normalizeStatus } from '@/lib/format'
type ViewMode = 'grid' | 'list'
type SortField = 'price' | 'imi_score' | 'area' | 'created_at' | 'yield_est'
type SortDir = 'asc' | 'desc'
type Market = 'BR' | 'US' | 'AE' | null
type ListingType = 'venda' | 'aluguel' | 'temporada' | null

const MARKET_MAP: Record<string, string[]> = {
  BR: ['Brasil', 'BR', 'brazil'],
  US: ['Estados Unidos', 'US', 'EUA', 'USA', 'united states'],
  AE: ['Emirados Árabes Unidos', 'AE', 'UAE', 'Dubai', 'emirates'],
}
// ─── Shared helpers ────────────────────────────────────────────────────────────
function fmt(n?: number | null): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(2).replace('.', ',')}M`
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}K`
  return `R$ ${n.toLocaleString('pt-BR')}`
}

const STATUS_CONFIGS: Record<string, { label: string; color: string }> = {
  disponivel:     { label: 'Disponível',     color: 'var(--success)' },
  lancamento:     { label: 'Lançamento',     color: 'var(--info)' },
  em_construcao:  { label: 'Em Construção',  color: 'var(--warning)' },
  reservado:      { label: 'Reservado',      color: 'var(--accent-400)' },
  em_negociacao:  { label: 'Negociação',     color: 'var(--text-secondary)' },
  vendido:        { label: 'Vendido',        color: 'var(--error)' },
  arquivado:      { label: 'Arquivado',      color: 'var(--text-tertiary)' },
  rascunho:       { label: 'Rascunho',       color: 'var(--text-tertiary)' },
}
// ─── Shared props interface ─────────────────────────────────────────────────────
interface SharedProps {
  properties: IMIProperty[]
  filtered: IMIProperty[]
  loading: boolean
  searchInput: string
  setSearchInput: (v: string) => void
  filters: PropertyFilters
  setFilters: (f: PropertyFilters) => void
  sortField: SortField
  setSortField: (f: SortField) => void
  sortDir: SortDir
  setSortDir: (d: SortDir) => void
  compareIds: Set<string>
  favorites: Set<string>
  toggleCompare: (id: string) => void
  clearCompare: () => void
  toggleFavorite: (id: string) => void
  fetchProperties: () => void
  activeFiltersCount: number
  market: Market
  setMarket: (m: Market) => void
  listingType: ListingType
  setListingType: (lt: ListingType) => void
}
// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
function KPIStrip({ properties }: { properties: IMIProperty[] }) {
  const total = properties.length
  const avgScore = total > 0 ? Math.round(properties.reduce((a, p) => a + (p.imi_score ?? 0), 0) / total) : 0
  const avgYield = total > 0
    ? (properties.reduce((a, p) => a + (p.yield_est ?? 0), 0) / total).toFixed(1)
    : '0'
  const totalVGV = properties.reduce((a, p) => a + (p.price ?? 0), 0)
  const disponivel = properties.filter(p => p.status === 'disponivel').length
  const kpis = [
    { label: 'Total', value: total.toString(), icon: Building2, color: 'var(--text-secondary)' },
    { label: 'Score', value: avgScore.toString(), icon: Sparkles, color: 'var(--accent-400)' },
    { label: 'Yield', value: `${avgYield}%`, icon: TrendingUp, color: 'var(--success)' },
    { label: 'VGV', value: fmt(totalVGV), icon: BarChart2, color: 'var(--info)' },
    { label: 'Disponíveis', value: disponivel.toString(), icon: Building2, color: 'var(--success)' },
  ]
  return (
    <div className="imi-kpi-strip">
      {kpis.map(kpi => (
        <div key={kpi.label} className="imi-kpi-item">
          <div className="imi-kpi-label-row">
            <kpi.icon size={10} style={{ color: kpi.color, flexShrink: 0 }} />
            <span className="imi-kpi-label">{kpi.label}</span>
          </div>
          <span className="imi-kpi-value" style={{ color: kpi.color }}>
            {kpi.value}
          </span>
        </div>
      ))}
    </div>
  )
}
function SortDropdown({ field, dir, onChange }: {
  field: SortField; dir: SortDir
  onChange: (f: SortField, d: SortDir) => void
}) {
  const [open, setOpen] = useState(false)
  const options: { field: SortField; label: string }[] = [
    { field: 'imi_score', label: 'IMI Score' },
    { field: 'price', label: 'Preço' },
    { field: 'yield_est', label: 'Yield' },
    { field: 'area', label: 'Área' },
    { field: 'created_at', label: 'Data' },
  ]
  const current = options.find(o => o.field === field)?.label ?? 'Ordenar'
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} className="imi-sort-btn">
        {dir === 'asc' ? <SortAsc size={13} /> : <SortDesc size={13} />}
        <span className="imi-sort-label">{current}</span>
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="imi-dropdown">
          {options.map(o => (
            <button
              key={o.field}
              onClick={() => {
                const newDir = field === o.field ? (dir === 'asc' ? 'desc' : 'asc') : 'desc'
                onChange(o.field, newDir)
                setOpen(false)
              }}
              className={`imi-dropdown-item ${field === o.field ? 'active' : ''}`}
            >
              {o.label}
              {field === o.field && (dir === 'asc' ? ' ↑' : ' ↓')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
function PropertyCardSkeleton() {
  return (
    <div className="imi-skeleton-card">
      <div className="imi-skeleton-image" />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[24, 14, 10].map((h, i) => (
          <div key={i} className="imi-skeleton-line" style={{ height: h, width: i === 1 ? '65%' : '85%' }} />
        ))}
      </div>
    </div>
  )
}
// ─── Desktop list component ────────────────────────────────────────────────────
function DesktopImoveisList(props: SharedProps) {
  const {
    properties, filtered, loading, searchInput, setSearchInput,
    filters, setFilters, sortField, setSortField, sortDir, setSortDir,
    compareIds, favorites, toggleCompare, clearCompare, toggleFavorite,
    fetchProperties, activeFiltersCount, market, setMarket,
    listingType, setListingType,
  } = props
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [shortcutPanelOpen, setShortcutPanelOpen] = useState(false)
  const shortcutBtnRef = useRef<HTMLButtonElement>(null)
  // ── Bulk selection helpers ───────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }, [])
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])
  // ── CSV export ───────────────────────────────────────────
  const exportCSV = useCallback(() => {
    const selected = filtered.filter(p => selectedIds.has(p.id))
    const header = 'id,titulo,bairro,status,preco,area,quartos'
    const rows = selected.map(p =>
      [p.id, `"${(p.name ?? '').replace(/"/g, '""')}"`, p.neighborhood ?? '', p.status ?? '',
       p.price ?? '', p.area ?? '', p.bedrooms ?? ''].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'imoveis.csv'; a.click()
    URL.revokeObjectURL(url)
  }, [filtered, selectedIds])
  // ── Keyboard shortcuts ───────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      switch (e.key.toLowerCase()) {
        case 'n': router.push('/backoffice/imoveis/novo'); break
        case 'f': setFilterSheetOpen(o => !o); break
        case 'b': setBulkMode(o => !o); break
        case 'escape':
          if (selectedIds.size > 0) clearSelection()
          else if (bulkMode) setBulkMode(false)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router, bulkMode, selectedIds, clearSelection])
  return (
    <div className="imi-page">
      {/* ── HEADER ─────────────────────────────────── */}
      <header className="imi-header">
        <div className="imi-header-bg-grid" />
        <div className="imi-header-glow" />
        <div className="imi-header-content">
          {/* Breadcrumb — desktop only */}
          <div className="imi-breadcrumb">
            <Link href="/backoffice/hoje" style={{ textDecoration: 'none' }}>
              <span className="imi-breadcrumb-root" style={{ cursor: 'pointer' }}>IMI</span>
            </Link>
            <span className="imi-breadcrumb-sep">›</span>
            <Link href="/backoffice/hoje" style={{ textDecoration: 'none' }}>
              <span className="imi-breadcrumb-page" style={{ cursor: 'pointer' }}>Menu Principal</span>
            </Link>
            <span className="imi-breadcrumb-sep">›</span>
            <span className="imi-breadcrumb-page" style={{ color: 'var(--accent-400)', opacity: 0.9 }}>Imóveis</span>
          </div>
          <div className="imi-header-row">
            <div>
              <h1 className="imi-page-title">
                Módulo de <em>Imóveis</em>
              </h1>
              <p className="imi-page-subtitle">
                Inteligência de mercado · Avaliação · Análise de investimento
              </p>
            </div>
            {/* Desktop action buttons */}
            <div className="imi-header-actions">
              <Link href="/backoffice/imoveis/explorer">
                <button className="imi-btn-ghost">
                  <BarChart2 size={12} />
                  Explorer
                </button>
              </Link>
              <Link href="/backoffice/imoveis/comparar">
                <button className="imi-btn-ghost">
                  <Scale size={12} />
                  Comparar
                </button>
              </Link>
              <Link href="/backoffice/imoveis/portfolio">
                <button className="imi-btn-ghost">
                  <LineChart size={12} />
                  Portfolio
                </button>
              </Link>
              {/* Keyboard shortcut help */}
              <div style={{ position: 'relative' }}>
                <button
                  ref={shortcutBtnRef}
                  onClick={() => setShortcutPanelOpen(o => !o)}
                  className="imi-kbd-help-btn"
                  title="Atalhos de teclado"
                >
                  <Keyboard size={14} />
                </button>
                {shortcutPanelOpen && (
                  <div className="imi-kbd-panel">
                    <div className="imi-kbd-panel-title">Atalhos</div>
                    {[
                      { key: 'N', desc: 'Novo imóvel' },
                      { key: 'F', desc: 'Filtros' },
                      { key: 'M', desc: 'Mapa' },
                      { key: 'B', desc: 'Modo seleção' },
                      { key: 'Esc', desc: 'Limpar' },
                    ].map(({ key, desc }) => (
                      <div key={key} className="imi-kbd-row">
                        <kbd className="imi-kbd">{key}</kbd>
                        <span className="imi-kbd-desc">{desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Link href="/backoffice/imoveis/novo">
                <button className="imi-btn-primary">
                  <Plus size={13} />
                  Novo Imóvel
                </button>
              </Link>
            </div>
          </div>
          {/* Mobile quick nav chips */}
          <div className="imi-mobile-chips">
            <Link href="/backoffice/imoveis/explorer">
              <button className="imi-chip"><BarChart2 size={11} />Explorer</button>
            </Link>
            <Link href="/backoffice/imoveis/comparar">
              <button className="imi-chip"><Scale size={11} />Comparar</button>
            </Link>
            <Link href="/backoffice/imoveis/portfolio">
              <button className="imi-chip"><LineChart size={11} />Portfolio</button>
            </Link>
          </div>
        </div>
      </header>
      {/* ── KPI STRIP ────────────────────────────────── */}
      <KPIStrip properties={properties} />
      {/* ── MARKET SELECTOR ──────────────────────────── */}
      {/* Market selector — client-side only; DB filtering pending country column */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 28px 4px' }}>
        {[
          { id: null, flag: '🌐', label: 'Todos' },
          { id: 'BR', flag: '🇧🇷', label: 'Brasil' },
          { id: 'US', flag: '🇺🇸', label: 'EUA' },
          { id: 'AE', flag: '🇦🇪', label: 'UAE' },
        ].map(m => (
          <button
            key={m.id ?? 'all'}
            onClick={() => setMarket(m.id as Market)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 32, padding: '0 12px',
              borderRadius: 6,
              border: market === m.id ? '1.5px solid var(--accent-400)' : '1.5px solid var(--border-subtle)',
              background: market === m.id ? 'rgba(61,111,255,0.10)' : 'transparent',
              color: market === m.id ? 'var(--accent-400)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: market === m.id ? 600 : 400,
              cursor: 'pointer', transition: 'all var(--dur-2) var(--ease)',
            }}
          >
            <span style={{ fontSize: 16 }}>{m.flag}</span>
            {m.label}
          </button>
        ))}
      </div>
      {/* ── LISTING TYPE SELECTOR ──────────────────────── */}
      <div style={{ display: 'flex', gap: 6, padding: '4px 28px 4px' }}>
        {[
          { id: null, label: 'Todos' },
          { id: 'venda', label: 'Venda' },
          { id: 'aluguel', label: 'Aluguel' },
          { id: 'temporada', label: 'Temporada' },
        ].map(lt => (
          <button
            key={lt.id ?? 'all'}
            onClick={() => setListingType(lt.id as ListingType)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              height: 28, padding: '0 10px',
              borderRadius: 6,
              border: listingType === lt.id ? '1.5px solid var(--success)' : '1.5px solid var(--border-subtle)',
              background: listingType === lt.id ? 'rgba(93,184,135,0.10)' : 'transparent',
              color: listingType === lt.id ? 'var(--success)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: listingType === lt.id ? 600 : 400,
              cursor: 'pointer', transition: 'all var(--dur-2) var(--ease)',
            }}
          >
            {lt.label}
          </button>
        ))}
      </div>
      {/* ── TOOLBAR ──────────────────────────────────── */}
      <div className="imi-toolbar">
        {/* Search row */}
        <div className="imi-toolbar-search-row">
          <div className="imi-search-wrap">
            <Search size={13} className="imi-search-icon" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Buscar por nome, bairro…"
              className="imi-search-input"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="imi-search-clear">
                <X size={11} />
              </button>
            )}
          </div>
        </div>
        {/* Controls row */}
        <div className="imi-toolbar-controls">
          {/* Mobile filter button */}
          <button
            onClick={() => setFilterSheetOpen(true)}
            className="imi-filter-btn"
          >
            <SlidersHorizontal size={14} />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="imi-filter-badge">{activeFiltersCount}</span>
            )}
          </button>
          <span className="imi-results-count">
            {filtered.length} imóvel{filtered.length !== 1 ? 's' : ''}
          </span>
          <div style={{ flex: 1 }} />
          <SortDropdown
            field={sortField}
            dir={sortDir}
            onChange={(f, d) => { setSortField(f); setSortDir(d) }}
          />
          <div className="imi-view-toggle">
            {([
              { mode: 'grid' as ViewMode, Icon: Grid3X3 },
              { mode: 'list' as ViewMode, Icon: List },
            ]).map(({ mode, Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`imi-view-btn ${viewMode === mode ? 'active' : ''}`}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
          {/* Bulk mode toggle */}
          <button
            onClick={() => { setBulkMode(o => !o); if (bulkMode) clearSelection() }}
            className="imi-refresh-btn"
            title="Modo seleção (B)"
            style={{
              border: bulkMode ? '1px solid rgba(61,111,255,0.6)' : undefined,
              color: bulkMode ? 'var(--accent-400)' : undefined,
            }}
          >
            <CheckSquare size={13} />
          </button>
          <button onClick={fetchProperties} disabled={loading} className="imi-refresh-btn">
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>
      {/* ── BODY: sidebar filter + content ─────────── */}
      <div className="imi-body">
        {/* Desktop sidebar filter */}
        <div className="imi-filter-sidebar">
          <AdvancedFilterPanel
            filters={filters}
            onChange={setFilters}
            totalCount={properties.length}
            filteredCount={filtered.length}
          />
        </div>
        {/* Mobile filter bottom sheet */}
        {filterSheetOpen && (
          <div className="imi-sheet-overlay" onClick={() => setFilterSheetOpen(false)}>
            <div className="imi-sheet" onClick={e => e.stopPropagation()}>
              <div className="imi-sheet-header">
                <span className="imi-sheet-title">Filtros</span>
                <button className="imi-sheet-close" onClick={() => setFilterSheetOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="imi-sheet-body">
                <AdvancedFilterPanel
                  filters={filters}
                  onChange={setFilters}
                  totalCount={properties.length}
                  filteredCount={filtered.length}
                />
              </div>
              <div className="imi-sheet-footer">
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="imi-sheet-clear-btn"
                >
                  Limpar filtros
                </button>
                <button
                  onClick={() => setFilterSheetOpen(false)}
                  className="imi-sheet-apply-btn"
                >
                  Ver {filtered.length} imóvel{filtered.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Content */}
        <div className="imi-content">
          {loading ? (
            <div className="imi-grid">
              {Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="imi-empty">
              <div className="imi-empty-icon">
                <Building2 size={28} style={{ color: 'rgba(61,111,255,0.4)' }} />
              </div>
              <p className="imi-empty-title">Nenhum imóvel encontrado</p>
              <p className="imi-empty-subtitle">Ajuste os filtros ou cadastre um novo imóvel.</p>
              <Link href="/backoffice/imoveis/novo">
                <button className="imi-btn-primary">
                  <Plus size={12} /> Cadastrar Imóvel
                </button>
              </Link>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="imi-grid">
              {filtered.map(p => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onCompare={bulkMode ? undefined : toggleCompare}
                  isComparing={compareIds.has(p.id)}
                  onFavorite={bulkMode ? undefined : toggleFavorite}
                  isFavorited={favorites.has(p.id)}
                  bulkMode={bulkMode}
                  isSelected={selectedIds.has(p.id)}
                  onSelect={toggleSelect}
                />
              ))}
            </div>
          ) : (
            <div className="imi-list-wrap">
              <div className="imi-list-header">
                {['Imóvel', 'Preço', 'R$/m²', 'Yield', 'Status', 'Área', 'Score', 'Ações'].map(h => (
                  <span key={h} className="imi-list-th">{h}</span>
                ))}
              </div>
              {filtered.map(p => (
                <PropertyListRow
                  key={p.id}
                  property={p}
                  onCompare={toggleCompare}
                  isComparing={compareIds.has(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {/* ── MOBILE FAB ────────────────────────────────── */}
      <Link href="/backoffice/imoveis/novo" className="imi-fab">
        <Plus size={22} />
      </Link>
      {/* ── BULK ACTION BAR ───────────────────────────── */}
      {selectedIds.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 110,
          background: 'rgba(11,25,40,0.97)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(61,111,255,0.35)',
          borderRadius: 6,
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: 'var(--shadow-xl)',
          whiteSpace: 'nowrap',
        }}>
          {/* Left: count */}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12, color: 'var(--accent-400)', fontWeight: 400,
          }}>
            {selectedIds.size} imóvel{selectedIds.size !== 1 ? 's' : ''} selecionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div style={{ width: 1, height: 20, background: 'rgba(61,111,255,0.2)' }} />
          {/* Center: action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="imi-bulk-btn imi-bulk-btn-publish">Publicar</button>
            <button className="imi-bulk-btn imi-bulk-btn-archive">Arquivar</button>
            <button className="imi-bulk-btn imi-bulk-btn-export" onClick={exportCSV}>Exportar CSV</button>
          </div>
          <div style={{ width: 1, height: 20, background: 'rgba(61,111,255,0.2)' }} />
          {/* Right: close */}
          <button
            onClick={() => { clearSelection(); setBulkMode(false) }}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}
      {/* ── COMPARE BAR ───────────────────────────────── */}
      {compareIds.size > 0 && (
        <div className="imi-compare-bar">
          <span className="imi-compare-label">
            Comparando {compareIds.size}/5
          </span>
          <Link href={`/backoffice/imoveis/comparar?ids=${Array.from(compareIds).join(',')}`}>
            <button className="imi-compare-btn">Comparar agora</button>
          </Link>
          <button onClick={clearCompare} className="imi-compare-clear">
            <X size={13} />
          </button>
        </div>
      )}
      <style suppressHydrationWarning>{`
        /* ═══ PAGE BASE ═══ */
        .imi-page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--bg-base);
        }
        /* ═══ HEADER ═══ */
        .imi-header {
          padding: 24px 28px 0;
          border-bottom: 1px solid rgba(61,111,255,0.12);
          background: var(--bg-surface);
          position: relative;
          overflow: hidden;
        }
        .imi-header-bg-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(61,111,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(61,111,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .imi-header-glow {
          position: absolute; top: -60px; right: 40px;
          width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(61,111,255,0.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .imi-header-content { position: relative; z-index: 1; }
        .imi-breadcrumb {
          display: flex; align-items: center; gap: 6px; margin-bottom: 14px;
        }
        .imi-breadcrumb-root {
          font-size: 8px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: var(--accent-400);
          font-family: var(--font-outfit, sans-serif);
        }
        .imi-breadcrumb-sep { color: rgba(61,111,255,0.3); font-size: 11px; }
        .imi-breadcrumb-page {
          font-size: 8px; font-weight: 500; letter-spacing: 2px;
          text-transform: uppercase; color: var(--text-tertiary);
          font-family: var(--font-outfit, sans-serif);
        }
        .imi-header-row {
          display: flex; align-items: flex-end; justify-content: space-between;
          padding-bottom: 20px; gap: 16px;
        }
        .imi-page-title {
          font-family: var(--font-playfair, 'Libre Baskerville', Georgia, serif);
          font-size: 28px; font-weight: 600;
          color: var(--text-primary);
          line-height: 1.1; margin-bottom: 6px;
        }
        .imi-page-title em { font-style: italic; color: var(--accent-400); }
        .imi-page-subtitle {
          font-size: 11px; color: var(--text-tertiary);
          font-family: var(--font-outfit, sans-serif); font-weight: 300;
        }
        .imi-header-actions {
          display: flex; gap: 8px; align-items: center; flex-shrink: 0;
        }
        .imi-mobile-chips { display: none; }
        /* ═══ BUTTONS ═══ */
        .imi-btn-ghost {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 14px; border-radius: 6px;
          background: transparent;
          border: 1px solid rgba(61,111,255,0.25);
          color: var(--accent-400);
          font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
          text-transform: uppercase;
          font-family: var(--font-outfit, sans-serif);
          cursor: pointer;
          white-space: nowrap;
          transition: background var(--dur-2) var(--ease), border-color var(--dur-2) var(--ease);
          min-height: 36px;
        }
        .imi-btn-ghost:hover { background: rgba(61,111,255,0.08); border-color: rgba(61,111,255,0.4); }
        .imi-btn-primary {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: 6px;
          background: var(--accent-400); border: none;
          color: var(--bg-base);
          font-size: 11px; font-weight: 700; letter-spacing: 0.05em;
          text-transform: uppercase;
          font-family: var(--font-outfit, sans-serif);
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          white-space: nowrap;
          min-height: 36px;
        }
        .imi-btn-primary:hover { background: var(--platinum-400); }
        /* ═══ KPI STRIP ═══ */
        .imi-kpi-strip {
          display: flex; gap: 1px;
          border-bottom: 1px solid rgba(61,111,255,0.12);
          background: var(--bg-surface, rgba(255,255,255,0.02));
        }
        .imi-kpi-item {
          flex: 1; padding: 14px 20px;
          border-right: 1px solid rgba(61,111,255,0.08);
          display: flex; flex-direction: column; gap: 4px;
        }
        .imi-kpi-label-row {
          display: flex; align-items: center; gap: 5px;
        }
        .imi-kpi-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
          text-transform: uppercase; color: var(--text-tertiary);
          font-family: var(--font-outfit, sans-serif);
        }
        .imi-kpi-value {
          font-family: var(--font-mono);
          font-size: 20px; font-weight: 400;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.5px; line-height: 1;
        }
        /* ═══ TOOLBAR ═══ */
        .imi-toolbar {
          display: flex; flex-direction: column; gap: 0;
          border-bottom: 1px solid rgba(61,111,255,0.08);
          background: var(--bg-surface, rgba(255,255,255,0.02));
          flex-shrink: 0;
        }
        .imi-toolbar-search-row {
          padding: 10px 16px 0;
        }
        .imi-toolbar-controls {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px 10px;
        }
        .imi-search-wrap {
          position: relative; width: 100%;
        }
        .imi-search-icon {
          position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
          color: var(--text-tertiary); pointer-events: none;
        }
        .imi-search-input {
          width: 100%; padding: 0 32px 0 32px;
          height: 40px; border-radius: 6px;
          background: var(--bg-surface, rgba(255,255,255,0.04));
          border: 1px solid rgba(61,111,255,0.15);
          color: var(--text-primary);
          font-size: 13px; font-family: var(--font-outfit, sans-serif);
          outline: none;
        }
        .imi-search-input:focus { border-color: rgba(61,111,255,0.35); }
        .imi-search-clear {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; padding: 4px;
          color: var(--text-tertiary);
          display: flex; align-items: center;
          min-width: 24px; min-height: 24px;
        }
        .imi-results-count {
          font-size: 11px; color: var(--text-tertiary);
          font-family: var(--font-outfit, sans-serif);
          white-space: nowrap; flex-shrink: 0;
        }
        .imi-filter-btn {
          display: none; /* hidden on desktop */
          align-items: center; gap: 6px;
          padding: 0 12px; height: 36px; border-radius: 6px;
          background: var(--bg-surface, rgba(255,255,255,0.04));
          border: 1px solid rgba(61,111,255,0.20);
          color: var(--text-secondary);
          font-size: 12px; font-family: var(--font-outfit, sans-serif);
          cursor: pointer; white-space: nowrap; flex-shrink: 0;
          min-height: 44px;
        }
        .imi-filter-badge {
          background: var(--accent-400); color: var(--bg-base);
          font-size: 11px; font-weight: 700; border-radius: 6px;
          padding: 1px 5px; min-width: 16px; text-align: center;
        }
        .imi-sort-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 0 12px; height: 36px; border-radius: 6px;
          background: var(--bg-surface, rgba(255,255,255,0.04));
          border: 1px solid rgba(61,111,255,0.18);
          color: var(--text-secondary);
          font-size: 11px; font-family: var(--font-outfit, sans-serif);
          cursor: pointer; white-space: nowrap;
          min-height: 36px;
        }
        .imi-sort-label { /* hide on very small screens */ }
        .imi-dropdown {
          position: absolute; top: calc(100% + 4px); right: 0; z-index: 50;
          background: var(--bg-elevated);
          border: 1px solid rgba(61,111,255,0.22);
          border-radius: 6px; padding: 4px; min-width: 160px;
          box-shadow: var(--shadow-lg);
        }
        .imi-dropdown-item {
          width: 100%; text-align: left;
          padding: 10px 12px; border-radius: 6px;
          background: transparent; border: none;
          color: var(--text-secondary);
          font-size: 12px; font-family: var(--font-outfit, sans-serif);
          cursor: pointer; display: block; min-height: 40px;
        }
        .imi-dropdown-item.active { background: rgba(61,111,255,0.08); color: var(--accent-400); }
        .imi-view-toggle {
          display: flex; border-radius: 6px; overflow: hidden;
          border: 1px solid rgba(61,111,255,0.15); flex-shrink: 0;
        }
        .imi-view-btn {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: none;
          border-right: 1px solid rgba(61,111,255,0.15);
          cursor: pointer;
          color: var(--text-tertiary);
          min-height: 36px;
        }
        .imi-view-btn:last-child { border-right: none; }
        .imi-view-btn.active { background: rgba(61,111,255,0.12); color: var(--accent-400); }
        .imi-refresh-btn {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          background: transparent;
          border: 1px solid rgba(61,111,255,0.15);
          border-radius: 6px; cursor: pointer;
          color: var(--text-tertiary);
          flex-shrink: 0;
        }
        /* ═══ BODY ═══ */
        .imi-body {
          display: flex; flex: 1; min-height: 0;
        }
        .imi-filter-sidebar {
          width: 248px; flex-shrink: 0;
          border-right: 1px solid rgba(61,111,255,0.10);
          overflow-y: auto;
          position: sticky; top: 0; max-height: calc(100vh - 200px);
        }
        .imi-content {
          flex: 1; padding: 20px; overflow-y: auto; min-width: 0;
        }
        /* ═══ GRID / LIST ═══ */
        .imi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .imi-list-wrap {
          background: var(--bg-surface);
          border: 1px solid rgba(61,111,255,0.12);
          border-radius: 10px; overflow: hidden;
        }
        .imi-list-header {
          display: grid;
          grid-template-columns: 1fr 100px 90px 90px 80px 80px 48px 116px;
          padding: 10px 16px;
          background: rgba(61,111,255,0.04);
          border-bottom: 1px solid rgba(61,111,255,0.12);
        }
        .imi-list-th {
          font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
          text-transform: uppercase; color: var(--text-tertiary);
          font-family: var(--font-outfit, sans-serif);
        }
        /* ═══ EMPTY STATE ═══ */
        .imi-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 80px 24px; gap: 16px; text-align: center;
        }
        .imi-empty-icon {
          width: 64px; height: 64px; border-radius: 16px;
          background: rgba(61,111,255,0.06);
          border: 1px solid rgba(61,111,255,0.18);
          display: flex; align-items: center; justify-content: center;
        }
        .imi-empty-title {
          font-family: var(--font-playfair, serif);
          font-size: 18px; color: var(--text-primary);
        }
        .imi-empty-subtitle {
          font-size: 12px; color: var(--text-tertiary);
          font-family: var(--font-outfit, sans-serif);
          margin-top: -8px;
        }
        /* ═══ SKELETON ═══ */
        .imi-skeleton-card {
          background: var(--bg-surface);
          border: 1px solid rgba(61,111,255,0.10);
          border-radius: 12px; overflow: hidden;
        }
        .imi-skeleton-image {
          aspect-ratio: 16/9;
          background: linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-elevated) 50%, var(--bg-surface) 75%);
          background-size: 200% 100%;
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }
        .imi-skeleton-line {
          border-radius: 3px;
          background: linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-elevated) 50%, var(--bg-surface) 75%);
          background-size: 200% 100%;
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }
        /* ═══ MOBILE FAB ═══ */
        .imi-fab {
          display: none;
          position: fixed; bottom: 84px; right: 20px;
          width: 52px; height: 52px; border-radius: 50%;
          background: var(--accent-400); color: var(--bg-base);
          align-items: center; justify-content: center;
          box-shadow: var(--shadow-gold);
          z-index: 90; text-decoration: none;
        }
        /* ═══ FILTER BOTTOM SHEET ═══ */
        .imi-sheet-overlay {
          display: none;
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(2px);
          align-items: flex-end;
        }
        .imi-sheet {
          width: 100%; max-height: 85vh;
          background: var(--bg-surface);
          border-radius: 20px 20px 0 0;
          border-top: 1px solid rgba(61,111,255,0.25);
          display: flex; flex-direction: column;
          box-shadow: var(--shadow-xl);
        }
        .imi-sheet-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(61,111,255,0.10);
          flex-shrink: 0;
        }
        .imi-sheet-title {
          font-size: 14px; font-weight: 600; color: var(--text-primary);
          font-family: var(--font-outfit, sans-serif); letter-spacing: 0.5px;
        }
        .imi-sheet-close {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,0.06); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary);
        }
        .imi-sheet-body {
          flex: 1; overflow-y: auto; padding: 0 4px;
        }
        .imi-sheet-footer {
          display: flex; gap: 10px; padding: 14px 20px;
          border-top: 1px solid rgba(61,111,255,0.10);
          flex-shrink: 0; padding-bottom: max(14px, env(safe-area-inset-bottom));
        }
        .imi-sheet-clear-btn {
          flex: 1; height: 48px; border-radius: 6px;
          background: transparent;
          border: 1px solid rgba(61,111,255,0.25);
          color: var(--accent-400);
          font-size: 12px; font-weight: 600; letter-spacing: 1px;
          text-transform: uppercase; cursor: pointer;
          font-family: var(--font-outfit, sans-serif);
        }
        .imi-sheet-apply-btn {
          flex: 2; height: 48px; border-radius: 6px;
          background: var(--accent-400); border: none;
          color: var(--bg-base);
          font-size: 12px; font-weight: 700; letter-spacing: 1px;
          text-transform: uppercase; cursor: pointer;
          font-family: var(--font-outfit, sans-serif);
        }
        /* ═══ KEYBOARD HELP BUTTON ═══ */
        .imi-kbd-help-btn {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          background: transparent;
          border: 1px solid rgba(61,111,255,0.25);
          border-radius: 6px; cursor: pointer;
          color: rgba(61,111,255,0.6);
          flex-shrink: 0;
          transition: all var(--dur-2) var(--ease);
        }
        .imi-kbd-help-btn:hover { background: rgba(61,111,255,0.08); color: var(--accent-400); }
        .imi-kbd-panel {
          position: absolute; top: calc(100% + 8px); right: 0; z-index: 60;
          background: var(--bg-elevated);
          border: 1px solid rgba(61,111,255,0.25);
          border-radius: 10px; padding: 12px 14px;
          min-width: 180px;
          box-shadow: var(--shadow-lg);
        }
        .imi-kbd-panel-title {
          font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
          text-transform: uppercase; color: var(--accent-400);
          font-family: var(--font-outfit, sans-serif);
          margin-bottom: 12px;
        }
        .imi-kbd-row {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 0;
        }
        .imi-kbd {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 28px; height: 22px; padding: 0 6px;
          background: rgba(61,111,255,0.10);
          border: 1px solid rgba(61,111,255,0.30);
          border-radius: 6px;
          font-family: var(--font-mono);
          font-size: 11px; color: var(--accent-400);
          flex-shrink: 0;
        }
        .imi-kbd-desc {
          font-family: var(--font-outfit, sans-serif);
          font-size: 11px; color: var(--text-secondary);
        }
        /* ═══ BULK ACTION BAR BUTTONS ═══ */
        .imi-bulk-btn {
          padding: 7px 14px; border-radius: 6px; cursor: pointer;
          font-family: var(--font-outfit, sans-serif);
          font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
          text-transform: uppercase;
          border: none;
          min-height: 32px;
          transition: all var(--dur-2) var(--ease);
        }
        .imi-bulk-btn-publish {
          background: rgba(93,184,135,0.15);
          border: 1px solid rgba(93,184,135,0.35);
          color: var(--success);
        }
        .imi-bulk-btn-publish:hover { background: rgba(93,184,135,0.25); }
        .imi-bulk-btn-archive {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          color: var(--text-secondary);
        }
        .imi-bulk-btn-archive:hover { background: rgba(255,255,255,0.10); }
        .imi-bulk-btn-export {
          background: transparent;
          border: 1px solid rgba(61,111,255,0.45);
          color: var(--accent-400);
        }
        .imi-bulk-btn-export:hover { background: rgba(61,111,255,0.10); }
        /* ═══ COMPARE BAR ═══ */
        .imi-compare-bar {
          position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
          z-index: 100;
          display: flex; align-items: center; gap: 12px;
          padding: 12px 20px; border-radius: 12px;
          background: rgba(20,40,64,0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(61,111,255,0.30);
          box-shadow: var(--shadow-xl);
          white-space: nowrap;
        }
        .imi-compare-label {
          font-size: 11px; color: var(--accent-400);
          font-family: var(--font-outfit, sans-serif);
          font-weight: 600;
        }
        .imi-compare-btn {
          padding: 7px 16px; border-radius: 6px;
          background: var(--accent-400); border: none;
          color: var(--bg-base);
          font-size: 11px; font-weight: 700; letter-spacing: 0.05em;
          text-transform: uppercase; cursor: pointer;
          font-family: var(--font-outfit, sans-serif);
          min-height: 36px;
        }
        .imi-compare-clear {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.06); border: none; cursor: pointer;
          color: var(--text-secondary);
        }
        /* ═══ CHIP ═══ */
        .imi-chip {
          display: flex; align-items: center; gap: 5px;
          padding: 6px 12px; border-radius: 6px;
          background: rgba(61,111,255,0.08);
          border: 1px solid rgba(61,111,255,0.22);
          color: var(--accent-400);
          font-size: 11px; font-weight: 500;
          font-family: var(--font-outfit, sans-serif);
          cursor: pointer; white-space: nowrap;
          min-height: 32px;
        }
        /* ═══ ANIMATIONS ═══ */
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes skeletonPulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        /* ═══ LIGHT THEME ═══ */
        .light .imi-page, [data-theme="light"] .imi-page {
          background: var(--bg-base);
        }
        .light .imi-search-input, [data-theme="light"] .imi-search-input {
          background: rgba(0,0,0,0.04);
          border-color: rgba(168,132,42,0.20);
          color: var(--text-primary);
        }
        /* ═══════════════════════════════════════════
           MOBILE — ≤ 767px
        ═══════════════════════════════════════════ */
        @media (max-width: 767px) {
          /* Header mobile */
          .imi-header {
            padding: 16px 16px 0;
          }
          .imi-breadcrumb { display: none; }
          .imi-header-row { align-items: center; padding-bottom: 12px; }
          .imi-page-title { font-size: 20px; margin-bottom: 2px; }
          .imi-page-subtitle { font-size: 11px; }
          .imi-header-actions { display: none; }
          .imi-mobile-chips {
            display: flex; gap: 8px; padding-bottom: 12px;
            overflow-x: auto; -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .imi-mobile-chips::-webkit-scrollbar { display: none; }
          /* KPI strip mobile — horizontal scroll */
          .imi-kpi-strip {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            flex-wrap: nowrap;
            gap: 0;
          }
          .imi-kpi-strip::-webkit-scrollbar { display: none; }
          .imi-kpi-item {
            min-width: 110px; flex-shrink: 0;
            padding: 12px 14px;
          }
          .imi-kpi-value { font-size: 16px; }
          .imi-kpi-label { font-size: 11px; }
          /* Toolbar mobile */
          .imi-toolbar-search-row { padding: 10px 14px 0; }
          .imi-toolbar-controls { padding: 8px 14px 10px; gap: 8px; }
          .imi-filter-btn { display: flex; }
          .imi-sort-label { display: none; }
          /* Body mobile — no sidebar */
          .imi-filter-sidebar { display: none; }
          .imi-sheet-overlay { display: flex; }
          .imi-sheet { animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1); }
          .imi-content { padding: 12px 14px; }
          /* Grid mobile — single column */
          .imi-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          /* List view — scroll horizontally on mobile */
          .imi-list-wrap { overflow-x: auto; }
          .imi-list-header {
            min-width: 700px;
            grid-template-columns: 1.5fr 90px 80px 70px 70px 70px 44px 100px;
          }
          /* FAB mobile */
          .imi-fab { display: flex; }
          /* Compare bar mobile */
          .imi-compare-bar {
            bottom: 70px;
            left: 14px; right: 14px; transform: none;
            border-radius: 10px;
          }
        }
        /* ═══════════════════════════════════════════
           TABLET — 768px–1023px
        ═══════════════════════════════════════════ */
        @media (min-width: 768px) and (max-width: 1023px) {
          .imi-filter-sidebar { width: 220px; }
          .imi-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          }
          .imi-header-actions {
            flex-wrap: wrap; justify-content: flex-end; max-width: 240px;
          }
          .imi-page-title { font-size: 24px; }
        }
      `}</style>
    </div>
  )
}
// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE TREE (native proptech app)
// ═══════════════════════════════════════════════════════════════════════════════
const STATUS_FILTER_CHIPS = [
  { value: '', label: 'Todos' },
  { value: 'disponivel', label: 'Disponível' },
  { value: 'lancamento', label: 'Lançamento' },
  { value: 'em_construcao', label: 'Em Construção' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'vendido', label: 'Vendido' },
]
const SORT_CHIPS = [
  { field: 'imi_score', dir: 'desc' as const, label: 'Maior Score' },
  { field: 'created_at', dir: 'desc' as const, label: 'Mais Novo' },
  { field: 'price', dir: 'asc' as const, label: 'Menor Preço' },
  { field: 'price', dir: 'desc' as const, label: 'Maior Preço' },
  { field: 'yield_est', dir: 'desc' as const, label: 'Maior Yield' },
]
function MobileImoveisList(props: SharedProps) {
  const {
    filtered, loading, searchInput, setSearchInput,
    filters, setFilters, favorites,
    toggleFavorite, activeFiltersCount, sortField, setSortField, sortDir, setSortDir,
    properties, market, setMarket, listingType, setListingType,
  } = props
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  useEffect(() => {
    setFilters({ ...filters, status: statusFilter ? [statusFilter] : [] })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingTop: 56, paddingBottom: 120 }}>
      <MobileGlobalStyles />
      {/* ── APP BAR ── */}
      <MobileAppBar
        title="Imóveis"
        subtitle={`${properties.length} no portfólio`}
        backHref="/backoffice/hoje"
        actions={
          <>
            <MobileAppBarAction icon={<BarChart2 size={20} />} href="/backoffice/imoveis/explorer" />
            <MobileAppBarAction icon={<Plus size={20} />} href="/backoffice/imoveis/novo" variant="primary" />
          </>
        }
      />
      {/* ── STICKY SEARCH + FILTERS ── */}
      <div style={{
        position: 'sticky', top: 56, zIndex: 90,
        background: 'var(--bg-base)',
        paddingTop: 10,
        borderBottom: '1px solid rgba(61,111,255,0.06)',
        paddingBottom: 10,
      }}>
        {/* Search row */}
        <div style={{ padding: '0 16px', marginBottom: 10 }}>
          <MobileSearchBar
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Buscar imóveis, bairros..."
          />
        </div>
        {/* Mobile Market Selector */}
        {/* Market selector (mobile) — client-side only; DB filtering pending country column */}
        <div style={{ display: 'flex', gap: 6, padding: '4px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { id: null, flag: '🌐', label: 'Todos' },
            { id: 'BR', flag: '🇧🇷', label: 'Brasil' },
            { id: 'US', flag: '🇺🇸', label: 'EUA' },
            { id: 'AE', flag: '🇦🇪', label: 'UAE' },
          ].map(m => (
            <button
              key={m.id ?? 'all'}
              onClick={() => setMarket(m.id as Market)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                height: 30, padding: '0 10px',
                borderRadius: 6,
                border: market === m.id ? '1.5px solid var(--accent-400)' : '1.5px solid rgba(61,111,255,0.20)',
                background: market === m.id ? 'rgba(61,111,255,0.10)' : 'var(--bg-muted)',
                color: market === m.id ? 'var(--accent-400)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: market === m.id ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14 }}>{m.flag}</span>
              {m.label}
            </button>
          ))}
        </div>
        {/* Listing type chips (mobile) */}
        <div style={{ display: 'flex', gap: 6, padding: '4px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { id: null, label: 'Todos' },
            { id: 'venda', label: 'Venda' },
            { id: 'aluguel', label: 'Aluguel' },
            { id: 'temporada', label: 'Temporada' },
          ].map(lt => (
            <button
              key={lt.id ?? 'all-lt'}
              onClick={() => setListingType(lt.id as ListingType)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                height: 28, padding: '0 10px',
                borderRadius: 6,
                border: listingType === lt.id ? '1.5px solid var(--success)' : '1.5px solid rgba(61,111,255,0.20)',
                background: listingType === lt.id ? 'rgba(93,184,135,0.10)' : 'var(--bg-muted)',
                color: listingType === lt.id ? 'var(--success)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: listingType === lt.id ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {lt.label}
            </button>
          ))}
        </div>
        {/* Status chips */}
        <MobileFilterChips
          chips={STATUS_FILTER_CHIPS}
          active={statusFilter}
          onChange={setStatusFilter}
        />
      </div>
      {/* ── RESULTS ROW + SORT ── */}
      <div style={{ padding: '10px 16px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12, color: 'var(--text-tertiary)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {filtered.length} imóvel{filtered.length !== 1 ? 's' : ''}
        </span>
        <MobileFiltersButton count={activeFiltersCount} onClick={() => setFilterSheetOpen(true)} />
      </div>
      {/* Sort chips */}
      <div style={{ paddingBottom: 8 }}>
        <MobileSortChips
          options={SORT_CHIPS}
          activeField={sortField}
          activeDir={sortDir}
          onChange={(f, d) => { setSortField(f as SortField); setSortDir(d) }}
        />
      </div>
      {/* ── PROPERTY LIST ── */}
      <div style={{ padding: '4px 16px 16px' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <MobilePropertyCardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <MobileEmptyState
            title="Nenhum imóvel encontrado"
            subtitle="Ajuste os filtros ou cadastre um novo imóvel para começar."
            action={{ label: 'Cadastrar Imóvel', href: '/backoffice/imoveis/novo' }}
          />
        ) : (
          filtered.map((p, i) => (
            <MobilePropertyCard
              key={p.id}
              property={p}
              isFavorite={favorites.has(p.id)}
              onFavorite={() => toggleFavorite(p.id)}
              animationDelay={Math.min(i * 60, 300)}
            />
          ))
        )}
      </div>
      {/* ── FILTER BOTTOM SHEET ── */}
      <MobileBottomSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filtros"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { setFilters(DEFAULT_FILTERS); setStatusFilter('') }}
              className="mob-btn-tap"
              style={{
                flex: 1, height: 48, borderRadius: 6,
                background: 'transparent',
                border: '1px solid rgba(61,111,255,0.25)',
                color: 'var(--accent-400)',
                fontFamily: 'var(--font-sans)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Limpar
            </button>
            <button
              onClick={() => setFilterSheetOpen(false)}
              className="mob-btn-tap"
              style={{
                flex: 2, height: 48, borderRadius: 6,
                background: 'var(--accent-400)', border: 'none',
                color: 'var(--bg-base)',
                fontFamily: 'var(--font-sans)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Ver {filtered.length} imóvel{filtered.length !== 1 ? 's' : ''}
            </button>
          </div>
        }
      >
        <AdvancedFilterPanel
          filters={filters}
          onChange={setFilters}
          totalCount={properties.length}
          filteredCount={filtered.length}
        />
      </MobileBottomSheet>
      {/* Bottom nav now handled by global MobileBottomNav */}
    </div>
  )
}
// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ImoveisPage() {
  const isMobile = useIsMobile()
  const [properties, setProperties] = useState<IMIProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<PropertyFilters>(DEFAULT_FILTERS)
  const [sortField, setSortField] = useState<SortField>('imi_score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [compareIds, setCompareIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const saved = localStorage.getItem('imi_compare_ids')
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set()
    } catch { return new Set() }
  })
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [searchInput, setSearchInput] = useState('')
  const [market, setMarket] = useState<Market>(null)
  const [listingType, setListingType] = useState<ListingType>(null)
  const fetchProperties = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('developments')
        .select('*, developer:developers!developer_id(id, name, logo_url), brokers:brokers!broker_id(id, name, phone, avatar_url)')
        .order('created_at', { ascending: false })
      if (error) {
        console.error('[Imoveis] Query error:', error.message)
        // Fallback: query without joins
        const { data: fallback } = await supabase
          .from('developments')
          .select('*')
          .order('created_at', { ascending: false })
        const normalized: IMIProperty[] = (fallback ?? []).map(mapDevToProperty)
        setProperties(normalized.map(enrichProperty))
        return
      }
      const normalized: IMIProperty[] = (data ?? []).map(mapDevToProperty)
      setProperties(normalized.map(enrichProperty))
    } catch (err) {
      console.error('[Imoveis] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { fetchProperties() }, [fetchProperties])
  const filtered = useMemo(() => {
    let list = [...properties]
    // Market/country filter
    if (market) {
      const accepted = MARKET_MAP[market]?.map(v => v.toLowerCase()) ?? []
      list = list.filter(p => {
        const country = (p.country ?? '').toLowerCase()
        return accepted.includes(country)
      })
    }
    // Listing type filter (venda/aluguel/temporada)
    if (listingType) {
      list = list.filter(p => (p.listing_type ?? 'venda') === listingType)
    }
    const q = (filters.search || searchInput).toLowerCase()
    if (q) list = list.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.neighborhood?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q)
    )
    if (filters.status.length > 0) list = list.filter(p => filters.status.includes(p.status ?? ''))
    if (filters.type.length > 0) list = list.filter(p => filters.type.some(t => p.type?.toLowerCase().includes(t)))
    if (filters.city) list = list.filter(p => p.city?.toLowerCase().includes(filters.city.toLowerCase()))
    if (filters.neighborhood) list = list.filter(p => p.neighborhood?.toLowerCase().includes(filters.neighborhood.toLowerCase()))
    if (filters.minPrice) list = list.filter(p => (p.price ?? 0) >= filters.minPrice!)
    if (filters.maxPrice) list = list.filter(p => (p.price ?? Infinity) <= filters.maxPrice!)
    if (filters.minArea) list = list.filter(p => (p.area ?? 0) >= filters.minArea!)
    if (filters.maxArea) list = list.filter(p => (p.area ?? Infinity) <= filters.maxArea!)
    if (filters.minBedrooms) list = list.filter(p => (p.bedrooms ?? 0) >= filters.minBedrooms!)
    if (filters.minScore) list = list.filter(p => (p.imi_score ?? 0) >= filters.minScore!)
    if (filters.minYield) list = list.filter(p => (p.yield_est ?? 0) >= filters.minYield!)
    if (filters.belowMarket) list = list.filter(p => (p.market_delta_pct ?? 0) > 0)
    list.sort((a, b) => {
      if (sortField === 'created_at') {
        return sortDir === 'desc'
          ? new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
          : new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
      }
      const av = (a[sortField] as number) ?? 0
      const bv = (b[sortField] as number) ?? 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
    return list
  }, [properties, filters, searchInput, sortField, sortDir, market, listingType])
  const activeFiltersCount = useMemo(() => {
    let c = 0
    if (filters.status.length > 0) c++
    if (filters.type.length > 0) c++
    if (filters.city) c++
    if (filters.neighborhood) c++
    if (filters.minPrice || filters.maxPrice) c++
    if (filters.minArea || filters.maxArea) c++
    if (filters.minBedrooms) c++
    if (filters.minScore) c++
    if (filters.minYield) c++
    if (filters.belowMarket) c++
    return c
  }, [filters])
  const toggleCompare = useCallback((id: string) => {
    setCompareIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else if (next.size < 5) { next.add(id) }
      try { localStorage.setItem('imi_compare_ids', JSON.stringify(Array.from(next))) } catch {}
      return next
    })
  }, [])
  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }, [])
  const sharedProps: SharedProps = {
    properties,
    filtered,
    loading,
    searchInput,
    setSearchInput,
    filters,
    setFilters,
    sortField,
    setSortField,
    sortDir,
    setSortDir,
    compareIds,
    favorites,
    toggleCompare,
    clearCompare: useCallback(() => {
      setCompareIds(new Set())
      try { localStorage.removeItem('imi_compare_ids') } catch {}
    }, []),
    toggleFavorite,
    fetchProperties,
    activeFiltersCount,
    market,
    setMarket,
    listingType,
    setListingType,
  }
  if (isMobile) return <MobileImoveisList {...sharedProps} />
  return <DesktopImoveisList {...sharedProps} />
}
