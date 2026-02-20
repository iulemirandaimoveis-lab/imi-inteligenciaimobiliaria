'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, SlidersHorizontal, Grid3X3, List, Building2, MapPin,
  Bed, Bath, Car, Ruler, DollarSign, TrendingUp, Eye, Edit, MoreHorizontal,
  Heart, Share2, Star, Phone, MessageSquare, Filter, Home, ChevronDown,
  BarChart2, BookmarkPlus, ExternalLink, Tag, Camera, CheckCircle,
  Clock, AlertCircle, XCircle, Map
} from 'lucide-react'
import Link from 'next/link'

// ============================================================
// DADOS MOCK — Imóveis
// ============================================================

const IMOVEIS = [
  {
    id: '1', codigo: 'IMI-2026-001', status: 'disponivel', destaque: true,
    tipo: 'Apartamento', subtipo: 'Padrão', operacao: 'venda',
    titulo: 'Apartamento Premium com Vista Mar',
    bairro: 'Boa Viagem', cidade: 'Recife', estado: 'PE',
    endereco: 'Av. Boa Viagem, 3456 - Apto 1802',
    area: 120, areaTotal: 145, quartos: 3, suites: 1, banheiros: 3, vagas: 2, andar: 18,
    preco: 950000, precoM2: 7917, precoAnterior: 980000,
    construtora: 'Moura Dubeux', anoContrucao: 2019, padrao: 'Alto',
    caracteristicas: ['Piscina', 'Academia', 'Varanda Gourmet', 'Vista Mar', 'Portaria 24h'],
    fotos: 12, visitas: 234, favoritos: 45,
    corretor: 'Iule Miranda', dataCadastro: '2026-01-10',
    iptu: 3600, condominio: 1200,
    fipezap_variacao: 2.3,
  },
  {
    id: '2', codigo: 'IMI-2026-002', status: 'disponivel', destaque: false,
    tipo: 'Casa', subtipo: 'Condomínio Fechado', operacao: 'venda',
    titulo: 'Casa em Condomínio de Alto Padrão',
    bairro: 'Setúbal', cidade: 'Recife', estado: 'PE',
    endereco: 'Rua das Bromélias, 45 - Cond. Portal do Atlântico',
    area: 450, areaTotal: 1200, quartos: 5, suites: 4, banheiros: 6, vagas: 4, andar: 0,
    preco: 3500000, precoM2: 7778, precoAnterior: null,
    construtora: null, anoContrucao: 2021, padrao: 'Luxo',
    caracteristicas: ['Piscina Privativa', 'Home Theater', 'Adega', 'Quadra Privativa', 'Churrasqueira'],
    fotos: 28, visitas: 89, favoritos: 31,
    corretor: 'Iule Miranda', dataCadastro: '2026-01-22',
    iptu: 8400, condominio: 4500,
    fipezap_variacao: 1.8,
  },
  {
    id: '3', codigo: 'IMI-2026-003', status: 'em_negociacao', destaque: true,
    tipo: 'Cobertura', subtipo: 'Duplex', operacao: 'venda',
    titulo: 'Cobertura Duplex com Piscina Privativa',
    bairro: 'Boa Viagem', cidade: 'Recife', estado: 'PE',
    endereco: 'Av. Conselheiro Aguiar, 2200 - Cobertura',
    area: 320, areaTotal: 380, quartos: 4, suites: 3, banheiros: 5, vagas: 3, andar: 22,
    preco: 2800000, precoM2: 8750, precoAnterior: 2900000,
    construtora: 'Queiroz Galvão', anoContrucao: 2017, padrao: 'Luxo',
    caracteristicas: ['Piscina Privativa', 'Terraço', 'Vista 360°', 'Armários Planejados', 'AC'],
    fotos: 35, visitas: 178, favoritos: 67,
    corretor: 'Iule Miranda', dataCadastro: '2026-02-01',
    iptu: 9600, condominio: 3200,
    fipezap_variacao: 3.1,
  },
  {
    id: '4', codigo: 'IMI-2026-004', status: 'disponivel', destaque: false,
    tipo: 'Apartamento', subtipo: 'Studio', operacao: 'locacao',
    titulo: 'Studio Moderno no Coração de Boa Viagem',
    bairro: 'Boa Viagem', cidade: 'Recife', estado: 'PE',
    endereco: 'Rua Tibúrcio Cavalcante, 580 - Apto 704',
    area: 42, areaTotal: 50, quartos: 1, suites: 0, banheiros: 1, vagas: 1, andar: 7,
    preco: 2800, precoM2: 67, precoAnterior: null,
    construtora: 'JHSF', anoContrucao: 2022, padrao: 'Alto',
    caracteristicas: ['Mobiliado', 'Ar-condicionado', 'Academia', 'Co-working'],
    fotos: 15, visitas: 312, favoritos: 28,
    corretor: 'Iule Miranda', dataCadastro: '2026-02-10',
    iptu: 0, condominio: 800,
    fipezap_variacao: 4.2,
  },
  {
    id: '5', codigo: 'IMI-2026-005', status: 'disponivel', destaque: true,
    tipo: 'Comercial - Sala', subtipo: 'Conjunto', operacao: 'venda',
    titulo: 'Conjunto Corporativo — Torre Premium',
    bairro: 'Empresarial', cidade: 'Recife', estado: 'PE',
    endereco: 'Av. Engenheiro Domingos Ferreira, 4150 — Sala 1204',
    area: 280, areaTotal: 300, quartos: 0, suites: 0, banheiros: 4, vagas: 6, andar: 12,
    preco: 2100000, precoM2: 7500, precoAnterior: null,
    construtora: 'RPS Incorporações', anoContrucao: 2020, padrao: 'Alto',
    caracteristicas: ['Varanda', 'Recepção Exclusiva', 'Copa', 'Data Center'],
    fotos: 20, visitas: 145, favoritos: 19,
    corretor: 'Iule Miranda', dataCadastro: '2026-02-15',
    iptu: 12000, condominio: 6000,
    fipezap_variacao: 1.2,
  },
]

const STATUS_CONFIG = {
  disponivel: { label: 'Disponível', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  em_negociacao: { label: 'Em Negociação', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  vendido: { label: 'Vendido', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  locado: { label: 'Locado', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
}

export default function ImoveisPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [operacao, setOperacao] = useState('todos')
  const [tipo, setTipo] = useState('todos')
  const [status, setStatus] = useState('todos')
  const [showFilters, setShowFilters] = useState(false)
  const [precoMin, setPrecoMin] = useState('')
  const [precoMax, setPrecoMax] = useState('')
  const [areaMin, setAreaMin] = useState('')
  const [quartos, setQuartos] = useState('todos')

  const formatCurrency = (v: number, isLocacao = false) =>
    isLocacao ? `R$ ${v.toLocaleString('pt-BR')}/mês` :
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

  const filtered = IMOVEIS.filter(im => {
    const matchSearch = !search || im.titulo.toLowerCase().includes(search.toLowerCase()) ||
      im.bairro.toLowerCase().includes(search.toLowerCase()) || im.codigo.includes(search.toUpperCase())
    const matchOp = operacao === 'todos' || im.operacao === operacao
    const matchTipo = tipo === 'todos' || im.tipo.startsWith(tipo)
    const matchStatus = status === 'todos' || im.status === status
    const matchPrecoMin = !precoMin || im.preco >= Number(precoMin)
    const matchPrecoMax = !precoMax || im.preco <= Number(precoMax)
    const matchArea = !areaMin || im.area >= Number(areaMin)
    const matchQuartos = quartos === 'todos' || im.quartos >= Number(quartos)
    return matchSearch && matchOp && matchTipo && matchStatus && matchPrecoMin && matchPrecoMax && matchArea && matchQuartos
  })

  const totalValor = filtered.filter(i => i.operacao === 'venda').reduce((s, i) => s + i.preco, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Imóveis</h1>
          <p className="text-xs text-gray-500 mt-0.5">Portfólio IMI • {IMOVEIS.length} ativos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <a href="https://www.fipe.org.br/pt-br/indices/fipezap/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 h-9 px-3 border border-gray-200 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors">
            <BarChart2 size={14} /> FIPE ZAP
          </a>
          <Link href="/backoffice/imoveis/novo"
            className="flex items-center gap-2 h-9 px-4 bg-[#C49D5B] text-white rounded-xl text-sm font-semibold hover:bg-[#b08a4a] transition-colors">
            <Plus size={16} /> Novo Imóvel
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: 'Portfólio Total', v: formatCurrency(IMOVEIS.filter(i => i.operacao === 'venda').reduce((s, i) => s + i.preco, 0)), icon: DollarSign, c: 'text-[#C49D5B] bg-amber-50' },
          { l: 'Disponíveis', v: IMOVEIS.filter(i => i.status === 'disponivel').length, icon: CheckCircle, c: 'text-emerald-600 bg-emerald-50' },
          { l: 'Visualizações', v: IMOVEIS.reduce((s, i) => s + i.visitas, 0).toLocaleString('pt-BR'), icon: Eye, c: 'text-blue-600 bg-blue-50' },
          { l: 'Favoritos', v: IMOVEIS.reduce((s, i) => s + i.favoritos, 0), icon: Heart, c: 'text-red-500 bg-red-50' },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.l} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${kpi.c}`}>
                <Icon size={16} />
              </div>
              <p className="text-xl font-bold text-gray-900">{kpi.v}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.l}</p>
            </div>
          )
        })}
      </div>

      {/* Barra de busca e filtros */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título, bairro, código..."
              className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C49D5B]" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 h-10 px-4 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'border-[#C49D5B] text-[#C49D5B] bg-amber-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <SlidersHorizontal size={16} /> Filtros
          </button>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`w-9 h-10 flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}>
              <Grid3X3 size={16} />
            </button>
            <button onClick={() => setViewMode('list')} className={`w-9 h-10 flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}>
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Pills */}
        <div className="flex gap-2 flex-wrap">
          {[
            { group: 'operacao', options: [{ v: 'todos', l: 'Todos' }, { v: 'venda', l: 'Venda' }, { v: 'locacao', l: 'Locação' }], state: operacao, setState: setOperacao },
            { group: 'tipo', options: [{ v: 'todos', l: 'Tipos' }, { v: 'Apartamento', l: 'Apto' }, { v: 'Casa', l: 'Casa' }, { v: 'Cobertura', l: 'Cobertura' }, { v: 'Comercial', l: 'Comercial' }], state: tipo, setState: setTipo },
          ].map(g => g.options.map(opt => (
            <button key={`${g.group}-${opt.v}`} onClick={() => g.setState(opt.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${g.state === opt.v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
              {opt.l}
            </button>
          )))}
        </div>

        {/* Filtros avançados */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Preço mínimo</label>
              <input type="number" value={precoMin} onChange={e => setPrecoMin(e.target.value)} placeholder="R$ 0"
                className="w-full h-8 px-2 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Preço máximo</label>
              <input type="number" value={precoMax} onChange={e => setPrecoMax(e.target.value)} placeholder="Sem limite"
                className="w-full h-8 px-2 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Área mínima (m²)</label>
              <input type="number" value={areaMin} onChange={e => setAreaMin(e.target.value)} placeholder="0"
                className="w-full h-8 px-2 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Quartos mínimos</label>
              <select value={quartos} onChange={e => setQuartos(e.target.value)} className="w-full h-8 px-2 border border-gray-200 rounded-lg text-xs bg-white">
                <option value="todos">Qualquer</option>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+ quartos</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">{filtered.length} imóveis encontrados</p>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(im => {
            const Stt = STATUS_CONFIG[im.status as keyof typeof STATUS_CONFIG]
            return (
              <div key={im.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                {/* Photo placeholder */}
                <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 size={40} className="text-gray-300" />
                  </div>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${Stt.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${Stt.dot}`} /> {Stt.label}
                    </span>
                    {im.operacao === 'venda' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Venda</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Locação</span>
                    )}
                  </div>
                  {im.destaque && (
                    <div className="absolute top-3 right-3">
                      <Star size={16} className="text-amber-500 fill-amber-500" />
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                    <Camera size={11} /> {im.fotos}
                  </div>
                  {im.fipezap_variacao > 0 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-emerald-500/90 text-white text-xs px-2 py-0.5 rounded-full">
                      <TrendingUp size={11} /> +{im.fipezap_variacao}% FIPE ZAP
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-xs text-gray-400 font-mono mb-1">{im.codigo}</p>
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">{im.titulo}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                    <MapPin size={11} /> {im.bairro}, {im.cidade}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Ruler size={11} />{im.area}m²</span>
                    {im.quartos > 0 && <span className="flex items-center gap-1"><Bed size={11} />{im.quartos}</span>}
                    <span className="flex items-center gap-1"><Bath size={11} />{im.banheiros}</span>
                    <span className="flex items-center gap-1"><Car size={11} />{im.vagas}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(im.preco, im.operacao === 'locacao')}
                      </p>
                      <p className="text-xs text-gray-400">R$ {im.precoM2.toLocaleString('pt-BR')}/m²</p>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/backoffice/imoveis/${im.id}`}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <Eye size={14} />
                      </Link>
                      <Link href={`/backoffice/imoveis/${im.id}/editar`}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <Edit size={14} />
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
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {filtered.map(im => {
            const Stt = STATUS_CONFIG[im.status as keyof typeof STATUS_CONFIG]
            return (
              <div key={im.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                  <Building2 size={22} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-gray-400">{im.codigo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${Stt.color}`}>{Stt.label}</span>
                    {im.destaque && <Star size={12} className="text-amber-500 fill-amber-500" />}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{im.titulo}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span>📍 {im.bairro}</span>
                    <span>{im.area}m²</span>
                    {im.quartos > 0 && <span>{im.quartos} quartos</span>}
                    <span className="flex items-center gap-1"><Eye size={10} /> {im.visitas}</span>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-base font-bold text-gray-900">
                    {formatCurrency(im.preco, im.operacao === 'locacao')}
                  </p>
                  <p className="text-xs text-gray-400">R$ {im.precoM2.toLocaleString('pt-BR')}/m²</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/backoffice/imoveis/${im.id}`}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-colors">
                    <Eye size={14} />
                  </Link>
                  <Link href={`/backoffice/imoveis/${im.id}/editar`}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-colors">
                    <Edit size={14} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-12 text-center bg-white rounded-xl border border-gray-100">
          <Building2 size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Nenhum imóvel encontrado</p>
        </div>
      )}
    </div>
  )
}
