'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Home,
  Ruler,
  DollarSign,
  User,
  Calendar,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Unidades mockadas
const unidadesData = {
  empreendimento: {
    id: 1,
    name: 'Reserva Atlantis',
    totalUnidades: 48,
    vendidas: 28,
    reservadas: 8,
    disponiveis: 12,
  },

  unidades: [
    {
      id: 1,
      codigo: 'APT-802',
      tipo: 'Apartamento',
      andar: 8,
      area: 85,
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      preco: 580000,
      status: 'disponivel',
      destaque: true,
    },
    {
      id: 2,
      codigo: 'APT-803',
      tipo: 'Apartamento',
      andar: 8,
      area: 92,
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      preco: 640000,
      status: 'vendida',
      destaque: false,
      cliente: 'Maria Santos Silva',
      dataVenda: '2026-02-10',
    },
    {
      id: 3,
      codigo: 'APT-804',
      tipo: 'Apartamento',
      andar: 8,
      area: 85,
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      preco: 580000,
      status: 'reservada',
      destaque: false,
      cliente: 'João Pedro Almeida',
      dataReserva: '2026-02-15',
    },
    {
      id: 4,
      codigo: 'APT-901',
      tipo: 'Apartamento',
      andar: 9,
      area: 120,
      quartos: 4,
      banheiros: 3,
      vagas: 3,
      preco: 850000,
      status: 'disponivel',
      destaque: true,
    },
    {
      id: 5,
      codigo: 'APT-902',
      tipo: 'Apartamento',
      andar: 9,
      area: 120,
      quartos: 4,
      banheiros: 3,
      vagas: 3,
      preco: 850000,
      status: 'vendida',
      destaque: false,
      cliente: 'Ana Carolina Ferreira',
      dataVenda: '2026-01-28',
    },
    {
      id: 6,
      codigo: 'COBER-2001',
      tipo: 'Cobertura',
      andar: 20,
      area: 185,
      quartos: 4,
      banheiros: 4,
      vagas: 4,
      preco: 1850000,
      status: 'disponivel',
      destaque: true,
    },
    {
      id: 7,
      codigo: 'APT-701',
      tipo: 'Apartamento',
      andar: 7,
      area: 78,
      quartos: 2,
      banheiros: 2,
      vagas: 1,
      preco: 450000,
      status: 'disponivel',
      destaque: false,
    },
    {
      id: 8,
      codigo: 'APT-702',
      tipo: 'Apartamento',
      andar: 7,
      area: 78,
      quartos: 2,
      banheiros: 2,
      vagas: 1,
      preco: 450000,
      status: 'reservada',
      destaque: false,
      cliente: 'Roberto Carlos Mendes',
      dataReserva: '2026-02-18',
    },
  ],
}

export default function ImoveisUnidadesPage() {
  const params = useParams()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tipoFilter, setTipoFilter] = useState('all')

  const filteredUnidades = unidadesData.unidades.filter(unidade => {
    const matchesSearch =
      unidade.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade.cliente?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || unidade.status === statusFilter
    const matchesTipo = tipoFilter === 'all' || unidade.tipo === tipoFilter
    return matchesSearch && matchesStatus && matchesTipo
  })

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string; icon: any }> = {
      disponivel: { label: 'Disponível', color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle },
      reservada: { label: 'Reservada', color: 'text-orange-700', bg: 'bg-orange-50', icon: Clock },
      vendida: { label: 'Vendida', color: 'text-gray-700', bg: 'bg-gray-100', icon: XCircle },
    }
    return configs[status] || configs.disponivel
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `R$ ${(price / 1000000).toFixed(2)}M`
    if (price >= 1000) return `R$ ${(price / 1000).toFixed(0)}k`
    return `R$ ${price.toLocaleString('pt-BR')}`
  }

  const progressDisponiveis = (unidadesData.empreendimento.disponiveis / unidadesData.empreendimento.totalUnidades) * 100
  const progressVendidas = (unidadesData.empreendimento.vendidas / unidadesData.empreendimento.totalUnidades) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push(`/backoffice/imoveis/${params.id}`)}
            className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">{unidadesData.empreendimento.name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gestão de unidades e disponibilidade
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 h-11 px-6 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            <Download size={20} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button
            onClick={() => router.push(`/backoffice/imoveis/${params.id}/unidades/nova`)}
            className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-colors"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nova Unidade</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{unidadesData.empreendimento.totalUnidades}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-green-600 mb-1">Disponíveis</p>
          <p className="text-2xl font-bold text-green-700">{unidadesData.empreendimento.disponiveis}</p>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-green-500" style={{ width: `${progressDisponiveis}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-orange-600 mb-1">Reservadas</p>
          <p className="text-2xl font-bold text-orange-700">{unidadesData.empreendimento.reservadas}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Vendidas</p>
          <p className="text-2xl font-bold text-gray-700">{unidadesData.empreendimento.vendidas}</p>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-gray-500" style={{ width: `${progressVendidas}%` }} />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por código ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
          >
            <option value="all">Todos os status</option>
            <option value="disponivel">Disponível</option>
            <option value="reservada">Reservada</option>
            <option value="vendida">Vendida</option>
          </select>
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
          >
            <option value="all">Todos os tipos</option>
            <option value="Apartamento">Apartamento</option>
            <option value="Cobertura">Cobertura</option>
          </select>
        </div>
      </div>

      {/* Grid de Unidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredUnidades.map((unidade) => {
          const statusConfig = getStatusConfig(unidade.status)
          const StatusIcon = statusConfig.icon

          return (
            <div
              key={unidade.id}
              className={`bg-white rounded-xl p-4 border transition-all hover:shadow-lg cursor-pointer ${unidade.destaque ? 'ring-2 ring-accent-500' : ''
                }`}
              onClick={() => router.push(`/backoffice/imoveis/${params.id}/unidades/${unidade.id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{unidade.codigo}</h3>
                    {unidade.destaque && (
                      <span className="px-2 py-0.5 bg-accent-50 text-accent-700 text-xs font-medium rounded">
                        Destaque
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{unidade.tipo} • Andar {unidade.andar}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${statusConfig.bg} ${statusConfig.color}`}>
                  <StatusIcon size={12} />
                  {statusConfig.label}
                </span>
              </div>

              {/* Características */}
              <div className="grid grid-cols-2 gap-2 mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Ruler size={12} />
                  <span>{unidade.area}m²</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Home size={12} />
                  <span>{unidade.quartos}Q {unidade.banheiros}B</span>
                </div>
              </div>

              {/* Preço */}
              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-1">Valor</p>
                <p className="text-xl font-bold text-gray-900">{formatPrice(unidade.preco)}</p>
              </div>

              {/* Cliente/Data */}
              {(unidade.status === 'vendida' || unidade.status === 'reservada') && unidade.cliente && (
                <div className="p-2 bg-gray-50 rounded-lg mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                    <User size={12} />
                    <span className="font-medium text-gray-900">{unidade.cliente}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Calendar size={12} />
                    <span>
                      {unidade.status === 'vendida'
                        ? new Date(unidade.dataVenda!).toLocaleDateString('pt-BR')
                        : new Date(unidade.dataReserva!).toLocaleDateString('pt-BR')
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/backoffice/imoveis/${params.id}/unidades/${unidade.id}`)
                  }}
                  className="flex-1 h-9 flex items-center justify-center gap-1.5 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                >
                  <Eye size={14} />
                  Ver
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/backoffice/imoveis/${params.id}/unidades/${unidade.id}/editar`)
                  }}
                  className="flex-1 h-9 flex items-center justify-center gap-1.5 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                >
                  <Edit size={14} />
                  Editar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredUnidades.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma unidade encontrada</h3>
          <p className="text-gray-600 mb-6">Tente ajustar os filtros ou adicionar uma nova unidade</p>
          <button
            onClick={() => router.push(`/backoffice/imoveis/${params.id}/unidades/nova`)}
            className="inline-flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700"
          >
            <Plus size={20} />
            Nova Unidade
          </button>
        </div>
      )}
    </div>
  )
}
