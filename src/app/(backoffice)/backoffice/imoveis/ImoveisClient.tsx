'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, SlidersHorizontal, Grid3X3, List, Building2, MapPin,
  Bed, Bath, Car, Ruler, DollarSign, TrendingUp, Eye, Edit, MoreHorizontal,
  Heart, Share2, Star, Phone, MessageSquare, Filter, Home, ChevronDown,
  BarChart2, BookmarkPlus, ExternalLink, Tag, Camera, CheckCircle,
  Clock, AlertCircle, XCircle, Map, Activity
} from 'lucide-react'
import Link from 'next/link'
import { Development } from '@/app/[lang]/(website)/imoveis/types/development'
import dynamic from 'next/dynamic'

const PropertyMap = dynamic(() => import('@/components/maps/PropertyMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '480px', background: 'var(--bo-card)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--bo-text-muted)', fontSize: 13 }}>Carregando mapa...</div>
    </div>
  ),
})

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    hover: 'var(--bo-hover)',
    accent: 'var(--bo-accent)',
}

const STATUS_CONFIG = {
  disponivel: { label: 'Disponível', color: '#10B981', bg: 'rgba(16,185,129,0.14)', dot: '#10B981' },
  ready: { label: 'Pronto', color: '#10B981', bg: 'rgba(16,185,129,0.14)', dot: '#10B981' },
  launch: { label: 'Lançamento', color: '#60A5FA', bg: 'rgba(96,165,250,0.14)', dot: '#3B82F6' },
  under_construction: { label: 'Em Construção', color: '#F59E0B', bg: 'rgba(245,158,11,0.14)', dot: '#F59E0B' },
  em_negociacao: { label: 'Em Negociação', color: '#F59E0B', bg: 'rgba(245,158,11,0.14)', dot: '#F59E0B' },
  vendido: { label: 'Vendido', color: 'var(--bo-text-muted)', bg: 'var(--bo-elevated)', dot: 'var(--bo-text-muted)' },
  inativo: { label: 'Inativo', color: 'var(--bo-text-muted)', bg: 'var(--bo-elevated)', dot: 'var(--bo-text-muted)' },
}

export default function ImoveisClient({ developments }: { developments: Development[] }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')
  const [search, setSearch] = useState('')
  const [operacao, setOperacao] = useState('todos')
  const [tipo, setTipo] = useState('todos')
  const [status, setStatus] = useState('todos')
  const [showFilters, setShowFilters] = useState(false)
  const [precoMin, setPrecoMin] = useState('')
  const [precoMax, setPrecoMax] = useState('')

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

  const filtered = developments.filter(im => {
    const matchSearch = !search || im.name.toLowerCase().includes(search.toLowerCase()) ||
      im.location.neighborhood.toLowerCase().includes(search.toLowerCase()) ||
      im.developer.toLowerCase().includes(search.toLowerCase())

    // Todos como "venda" na plataforma web atual
    const matchOp = operacao === 'todos' || operacao === 'venda';

    const matchStatus = status === 'todos' || im.status === status
    const matchPrecoMin = !precoMin || im.priceRange.min >= Number(precoMin)
    const matchPrecoMax = !precoMax || (im.priceRange.max > 0 ? im.priceRange.max <= Number(precoMax) : im.priceRange.min <= Number(precoMax))

    return matchSearch && matchOp && matchStatus && matchPrecoMin && matchPrecoMax
  })

  // Estimar VGV (Usando o maximo do preço se disponível)
  const totalValor = developments.reduce((s, i) => s + (i.priceRange.max > 0 ? i.priceRange.max : i.priceRange.min), 0)

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: T.text }}>Portfólio / Empreendimentos</h1>
          <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>Gestão Global IMI • {developments.length} ativos comerciais listados</p>
        </div>
        <div className="flex gap-2">
          <Link href="/backoffice/imoveis/novo"
            className="flex items-center gap-2 h-9 px-4 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
            style={{ background: 'var(--bo-accent)' }}>
            <Plus size={16} /> Novo Empreendimento
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: 'VGV Global (Est.)', v: formatCurrency(totalValor), icon: DollarSign, c: 'text-[var(--bo-accent)] bg-[#102A43]/10' },
          { l: 'Lançamentos', v: developments.filter(i => i.status === 'launch').length, icon: Activity, c: 'text-blue-400 bg-blue-500/10' },
          { l: 'Em Destaque (Premium)', v: developments.filter(i => i.isHighlighted).length, icon: Star, c: 'text-amber-400 bg-amber-500/10' },
          { l: 'Prontos / Disponíveis', v: developments.filter(i => i.status === 'ready').length, icon: CheckCircle, c: 'text-emerald-400 bg-emerald-500/10' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div key={idx} className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${kpi.c}`}>
                <Icon size={16} />
              </div>
              <p className="text-xl font-bold truncate" style={{ color: T.text }}>{kpi.v}</p>
              <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>{kpi.l}</p>
            </div>
          )
        })}
      </div>

      {/* Barra de busca e filtros */}
      <div className="space-y-3 p-3 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: T.textMuted }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar construtora, ativo, bairro..."
              className="w-full h-10 pl-9 pr-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68] transition-all"
              style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }} />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex-1 sm:flex-none flex justify-center items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium transition-colors"
              style={showFilters
                ? { border: `1px solid ${T.accent}`, color: T.accent, background: 'rgba(72,101,129,0.1)' }
                : { border: `1px solid ${T.border}`, color: T.textMuted, background: T.elevated }
              }>
              <SlidersHorizontal size={16} /> Filtros
            </button>
            <div className="flex rounded-xl overflow-hidden shrink-0" style={{ border: `1px solid ${T.border}` }}>
              <button onClick={() => setViewMode('grid')}
                className="w-10 h-10 flex items-center justify-center transition-colors"
                title="Grade"
                style={viewMode === 'grid'
                  ? { background: T.text, color: T.surface }
                  : { background: T.elevated, color: T.textMuted }
                }>
                <Grid3X3 size={16} />
              </button>
              <button onClick={() => setViewMode('list')}
                className="w-10 h-10 flex items-center justify-center transition-colors"
                title="Lista"
                style={viewMode === 'list'
                  ? { background: T.text, color: T.surface }
                  : { background: T.elevated, color: T.textMuted }
                }>
                <List size={16} />
              </button>
              <button onClick={() => setViewMode('map')}
                className="w-10 h-10 flex items-center justify-center transition-colors"
                title="Mapa"
                style={viewMode === 'map'
                  ? { background: 'var(--imi-blue)', color: 'white' }
                  : { background: T.elevated, color: T.textMuted }
                }>
                <Map size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filtros avançados */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
            <div>
              <label className="text-xs block mb-1 font-medium" style={{ color: T.textMuted }}>Preço mínimo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: T.textMuted }}>R$</span>
                <input type="number" value={precoMin} onChange={e => setPrecoMin(e.target.value)} placeholder="0"
                  className="w-full h-9 pl-8 pr-3 rounded-lg text-sm focus:ring-1 focus:ring-[#334E68] focus:outline-none"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }} />
              </div>
            </div>
            <div>
              <label className="text-xs block mb-1 font-medium" style={{ color: T.textMuted }}>Preço máximo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: T.textMuted }}>R$</span>
                <input type="number" value={precoMax} onChange={e => setPrecoMax(e.target.value)} placeholder="Sem limite"
                  className="w-full h-9 pl-8 pr-3 rounded-lg text-sm focus:ring-1 focus:ring-[#334E68] focus:outline-none"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }} />
              </div>
            </div>
            <div>
              <label className="text-xs block mb-1 font-medium" style={{ color: T.textMuted }}>Status de Obra</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm focus:ring-1 focus:ring-[#334E68] focus:outline-none"
                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
                <option value="todos">Todos</option>
                <option value="launch">Lançamento</option>
                <option value="under_construction">Em Construção</option>
                <option value="ready">Prontos</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs font-medium" style={{ color: T.textMuted }}>{filtered.length} imóveis/empreendimentos encontrados</p>

      {/* Map View */}
      {viewMode === 'map' && (
        <PropertyMap
          developments={filtered}
          height="480px"
          lang="pt"
          darkMode={true}
          className="w-full"
        />
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(im => {
            const statusKey = im.status as keyof typeof STATUS_CONFIG;
            const Stt = STATUS_CONFIG[statusKey] || STATUS_CONFIG['em_negociacao'];

            return (
              <div key={im.id} className="rounded-2xl overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                {/* Photo Header */}
                <div className="relative h-48 overflow-hidden shrink-0" style={{ background: T.elevated }}>
                  {im.images.main ? (
                    <img src={im.images.main} alt={im.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center uppercase font-bold text-lg" style={{ color: T.textMuted }}>{im.developer?.slice(0, 3)}</div>
                  )}

                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="text-xs px-2 py-1 rounded-full font-bold flex items-center shadow-sm gap-1 uppercase tracking-tight"
                      style={{ color: Stt.color, background: Stt.bg }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: Stt.dot }} /> {Stt.label}
                    </span>
                  </div>

                  {im.isHighlighted && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-1.5 rounded-full shadow-sm text-yellow-400">
                      <Star size={14} className="fill-current" />
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full shadow-sm">
                    <Building2 size={12} /> <span className="truncate max-w-[120px] font-medium">{im.developer}</span>
                  </div>

                  {im.images.gallery.length > 0 && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full shadow-sm">
                      <Camera size={12} /> {im.images.gallery.length}
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-[10px] font-mono mb-1 uppercase tracking-wider" style={{ color: T.textMuted }}>{im.slug.slice(0, 15)}</p>
                  <h3 className="font-bold text-sm leading-tight mb-2 line-clamp-2" style={{ color: T.text }}>{im.name}</h3>
                  <p className="text-xs flex items-center gap-1.5 mb-3" style={{ color: T.textMuted }}>
                    <MapPin size={12} style={{ color: T.accent }} /> <span className="truncate">{im.location.neighborhood}, {im.location.city}</span>
                  </p>

                  <div className="flex items-center gap-3 text-xs mb-4 p-2 rounded-lg" style={{ background: T.elevated, color: T.textMuted }}>
                    <span className="flex items-center gap-1" title="Área"><Ruler size={13} style={{ color: T.textMuted }} /> {im.specs.areaRange}</span>
                    <span className="flex items-center gap-1" title="Quartos"><Bed size={13} style={{ color: T.textMuted }} /> {im.specs.bedroomsRange}</span>
                  </div>

                  <div className="mt-auto pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${T.border}` }}>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: T.textMuted }}>A partir de</p>
                      <p className="text-base font-black tracking-tight" style={{ color: T.text }}>
                        {im.priceRange.min > 0 ? formatCurrency(im.priceRange.min) : 'Sob Consulta'}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Link href={`/imoveis/${im.slug}`} target="_blank"
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[#102A43] hover:text-white"
                        style={{ background: T.elevated, color: T.textMuted }}>
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && filtered.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          {filtered.map((im, idx) => {
            const statusKey = im.status as keyof typeof STATUS_CONFIG;
            const Stt = STATUS_CONFIG[statusKey] || STATUS_CONFIG['em_negociacao'];

            return (
              <div key={im.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 transition-colors group"
                style={{
                  borderTop: idx > 0 ? `1px solid ${T.border}` : undefined,
                }}>
                <div className="w-full sm:w-20 sm:h-20 h-32 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative" style={{ background: T.elevated }}>
                  {im.images.main ? (
                    <img src={im.images.main} alt={im.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={24} style={{ color: T.textMuted }} />
                  )}
                  {im.isHighlighted && <div className="absolute top-1 right-1 bg-black/50 p-1 rounded"><Star size={10} className="text-yellow-400 fill-current" /></div>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                      style={{ color: Stt.color, background: Stt.bg }}>{Stt.label}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full truncate max-w-[150px]"
                      style={{ color: T.accent, background: 'rgba(72,101,129,0.1)' }}>{im.developer}</span>
                  </div>
                  <p className="text-sm font-bold truncate mb-1" style={{ color: T.text }}>{im.name}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: T.textMuted }}>
                    <span className="flex items-center gap-1"><MapPin size={11} /> {im.location.neighborhood}</span>
                    <span className="flex items-center gap-1"><Ruler size={11} /> {im.specs.areaRange}</span>
                    <span className="flex items-center gap-1"><Bed size={11} /> {im.specs.bedroomsRange} quartos</span>
                  </div>
                </div>

                <div className="sm:text-right flex sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5 sm:block hidden" style={{ color: T.textMuted }}>A partir de</p>
                    <p className="text-base font-black" style={{ color: T.text }}>
                      {im.priceRange.min > 0 ? formatCurrency(im.priceRange.min) : 'Consulta'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:mt-2">
                    <Link href={`/imoveis/${im.slug}`} target="_blank"
                      className="h-8 px-3 rounded-lg flex items-center gap-2 text-xs font-semibold transition-colors hover:bg-[#102A43] hover:text-white"
                      style={{ border: `1px solid ${T.border}`, color: T.textMuted }}>
                      VER <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-16 text-center rounded-2xl border-dashed" style={{ background: T.surface, border: `2px dashed ${T.border}` }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: T.elevated }}>
            <Search size={24} style={{ color: T.textMuted }} />
          </div>
          <h3 className="text-sm font-bold mb-1" style={{ color: T.text }}>Nenhum imóvel encontrado</h3>
          <p className="text-xs max-w-sm mx-auto" style={{ color: T.textMuted }}>Tente ajustar os filtros ou os termos da busca para encontrar os empreendimentos do portfólio.</p>
        </div>
      )}
    </div>
  )
}
