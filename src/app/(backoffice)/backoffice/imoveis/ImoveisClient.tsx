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

const STATUS_CONFIG = {
  disponivel: { label: 'Disponível', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  ready: { label: 'Pronto', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  launch: { label: 'Lançamento', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  under_construction: { label: 'Em Construção', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  em_negociacao: { label: 'Em Negociação', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  vendido: { label: 'Vendido', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' },
  inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
}

export default function ImoveisClient({ developments }: { developments: Development[] }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
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
          <h1 className="text-xl font-bold text-gray-900">Portfólio / Empreendimentos</h1>
          <p className="text-xs text-gray-500 mt-0.5">Gestão Global IMI • {developments.length} ativos comerciais listados</p>
        </div>
        <div className="flex gap-2">
          <Link href="/backoffice/imoveis/novo"
            className="flex items-center gap-2 h-9 px-4 bg-[#C49D5B] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:bg-[#b08a4a] transition-all">
            <Plus size={16} /> Novo Empreendimento
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: 'VGV Global (Est.)', v: formatCurrency(totalValor), icon: DollarSign, c: 'text-[#C49D5B] bg-[#C49D5B]/10' },
          { l: 'Lançamentos', v: developments.filter(i => i.status === 'launch').length, icon: Activity, c: 'text-blue-600 bg-blue-50' },
          { l: 'Em Destaque (Premium)', v: developments.filter(i => i.isHighlighted).length, icon: Star, c: 'text-amber-500 bg-amber-50' },
          { l: 'Prontos / Disponíveis', v: developments.filter(i => i.status === 'ready').length, icon: CheckCircle, c: 'text-emerald-600 bg-emerald-50' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div key={idx} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${kpi.c}`}>
                <Icon size={16} />
              </div>
              <p className="text-xl font-bold text-gray-900 truncate">{kpi.v}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.l}</p>
            </div>
          )
        })}
      </div>

      {/* Barra de busca e filtros */}
      <div className="space-y-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar construtora, ativo, bairro..."
              className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C49D5B] focus:border-transparent transition-all" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 sm:flex-none flex justify-center items-center gap-2 h-10 px-4 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'border-[#C49D5B] text-[#C49D5B] bg-[#C49D5B]/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <SlidersHorizontal size={16} /> Filtros
            </button>
            <div className="flex border border-gray-200 rounded-xl overflow-hidden shrink-0">
              <button onClick={() => setViewMode('grid')} className={`w-10 h-10 flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}>
                <Grid3X3 size={16} />
              </button>
              <button onClick={() => setViewMode('list')} className={`w-10 h-10 flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}>
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filtros avançados */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
            <div>
              <label className="text-xs text-gray-500 block mb-1 font-medium">Preço mínimo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">R$</span>
                <input type="number" value={precoMin} onChange={e => setPrecoMin(e.target.value)} placeholder="0"
                  className="w-full h-9 pl-8 pr-3 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#C49D5B] focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1 font-medium">Preço máximo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">R$</span>
                <input type="number" value={precoMax} onChange={e => setPrecoMax(e.target.value)} placeholder="Sem limite"
                  className="w-full h-9 pl-8 pr-3 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#C49D5B] focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1 font-medium">Status de Obra</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#C49D5B] focus:outline-none bg-white">
                <option value="todos">Todos</option>
                <option value="launch">Lançamento</option>
                <option value="under_construction">Em Construção</option>
                <option value="ready">Prontos</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 font-medium">{filtered.length} imóveis/empreendimentos encontrados</p>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(im => {
            const statusKey = im.status as keyof typeof STATUS_CONFIG;
            const Stt = STATUS_CONFIG[statusKey] || STATUS_CONFIG['em_negociacao'];

            return (
              <div key={im.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full">
                {/* Photo Header */}
                <div className="relative h-48 bg-gray-100 overflow-hidden shrink-0">
                  {im.images.main ? (
                    <img src={im.images.main} alt={im.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 uppercase text-gray-400 font-bold text-lg">{im.developer?.slice(0, 3)}</div>
                  )}

                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold flex items-center shadow-sm gap-1 uppercase tracking-tight ${Stt.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${Stt.dot}`} /> {Stt.label}
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
                  <p className="text-[10px] text-gray-400 font-mono mb-1 uppercase tracking-wider">{im.slug.slice(0, 15)}</p>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2 line-clamp-2">{im.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-3">
                    <MapPin size={12} className="text-[#C49D5B]" /> <span className="truncate">{im.location.neighborhood}, {im.location.city}</span>
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg">
                    <span className="flex items-center gap-1" title="Área"><Ruler size={13} className="text-gray-400" /> {im.specs.areaRange}</span>
                    <span className="flex items-center gap-1" title="Quartos"><Bed size={13} className="text-gray-400" /> {im.specs.bedroomsRange}</span>
                  </div>

                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">A partir de</p>
                      <p className="text-base font-black text-gray-900 tracking-tight">
                        {im.priceRange.min > 0 ? formatCurrency(im.priceRange.min) : 'Sob Consulta'}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Link href={`/imoveis/${im.slug}`} target="_blank"
                        className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-[#C49D5B] hover:text-white transition-colors">
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
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 shadow-sm">
          {filtered.map(im => {
            const statusKey = im.status as keyof typeof STATUS_CONFIG;
            const Stt = STATUS_CONFIG[statusKey] || STATUS_CONFIG['em_negociacao'];

            return (
              <div key={im.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
                <div className="w-full sm:w-20 sm:h-20 h-32 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {im.images.main ? (
                    <img src={im.images.main} alt={im.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={24} className="text-gray-300" />
                  )}
                  {im.isHighlighted && <div className="absolute top-1 right-1 bg-black/50 p-1 rounded"><Star size={10} className="text-yellow-400 fill-current" /></div>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${Stt.color}`}>{Stt.label}</span>
                    <span className="text-xs font-medium text-[#C49D5B] bg-[#C49D5B]/10 px-2 py-0.5 rounded-full truncate max-w-[150px]">{im.developer}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 truncate mb-1">{im.name}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin size={11} /> {im.location.neighborhood}</span>
                    <span className="flex items-center gap-1"><Ruler size={11} /> {im.specs.areaRange}</span>
                    <span className="flex items-center gap-1"><Bed size={11} /> {im.specs.bedroomsRange} quartos</span>
                  </div>
                </div>

                <div className="sm:text-right flex sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5 sm:block hidden">A partir de</p>
                    <p className="text-base font-black text-gray-900">
                      {im.priceRange.min > 0 ? formatCurrency(im.priceRange.min) : 'Consulta'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:mt-2">
                    <Link href={`/imoveis/${im.slug}`} target="_blank"
                      className="h-8 px-3 rounded-lg border border-gray-200 text-gray-500 flex items-center gap-2 text-xs font-semibold hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors">
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
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-gray-300" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">Nenhum imóvel encontrado</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">Tente ajustar os filtros ou os termos da busca para encontrar os empreendimentos do portfólio.</p>
        </div>
      )}
    </div>
  )
}
