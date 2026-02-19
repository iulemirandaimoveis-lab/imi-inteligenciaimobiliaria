'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  Eye,
  Edit,
  Star,
  TrendingUp,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Construtoras mockadas Recife
const construtorasData = [
  {
    id: 1,
    nome: 'Construtora Central',
    nomeFantasia: 'Central Empreendimentos',
    cnpj: '12.345.678/0001-99',
    email: 'contato@construtoracentral.com.br',
    phone: '(81) 3456-7890',
    address: 'Av. Eng. Domingos Ferreira, 4000 - Boa Viagem, Recife/PE',
    responsavel: 'Carlos Mendonça',
    phoneResponsavel: '(81) 99876-5432',
    empreendimentosAtivos: 3,
    unidadesVendidas: 127,
    receitaTotal: 45000000,
    status: 'ativa',
    rating: 4.8,
    parceriaDuracao: '5 anos',
  },
  {
    id: 2,
    nome: 'Grupo Moura Dubeux',
    nomeFantasia: 'Moura Dubeux',
    cnpj: '23.456.789/0001-88',
    email: 'comercial@mouradubeux.com.br',
    phone: '(81) 3234-5678',
    address: 'R. Padre Carapuceiro, 777 - Boa Viagem, Recife/PE',
    responsavel: 'Fernanda Lima',
    phoneResponsavel: '(81) 98765-4321',
    empreendimentosAtivos: 5,
    unidadesVendidas: 234,
    receitaTotal: 89000000,
    status: 'ativa',
    rating: 4.9,
    parceriaDuracao: '8 anos',
  },
  {
    id: 3,
    nome: 'Queiroz Galvão',
    nomeFantasia: 'QG Desenvolvimento',
    cnpj: '34.567.890/0001-77',
    email: 'imoveis@qg.com.br',
    phone: '(81) 3345-6789',
    address: 'Av. Conselheiro Aguiar, 1500 - Boa Viagem, Recife/PE',
    responsavel: 'Roberto Silva',
    phoneResponsavel: '(81) 99654-3210',
    empreendimentosAtivos: 2,
    unidadesVendidas: 89,
    receitaTotal: 32000000,
    status: 'ativa',
    rating: 4.6,
    parceriaDuracao: '3 anos',
  },
  {
    id: 4,
    nome: 'Cyrela Plano&Plano',
    nomeFantasia: 'Cyrela PE',
    cnpj: '45.678.901/0001-66',
    email: 'vendas@cyrela-pe.com.br',
    phone: '(81) 3456-7891',
    address: 'Av. Boa Viagem, 5000 - Boa Viagem, Recife/PE',
    responsavel: 'Patricia Costa',
    phoneResponsavel: '(81) 99543-2109',
    empreendimentosAtivos: 1,
    unidadesVendidas: 45,
    receitaTotal: 18000000,
    status: 'ativa',
    rating: 4.7,
    parceriaDuracao: '2 anos',
  },
  {
    id: 5,
    nome: 'Rossi Residencial',
    nomeFantasia: 'Rossi PE',
    cnpj: '56.789.012/0001-55',
    email: 'contato@rossi-pe.com.br',
    phone: '(81) 3567-8902',
    address: 'R. Barão de Souza Leão, 400 - Boa Viagem, Recife/PE',
    responsavel: 'João Santos',
    phoneResponsavel: '(81) 99432-1098',
    empreendimentosAtivos: 0,
    unidadesVendidas: 23,
    receitaTotal: 8500000,
    status: 'inativa',
    rating: 4.2,
    parceriaDuracao: '1 ano',
  },
]

export default function ConstrutorasPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredConstrutoras = construtorasData.filter(constItem => {
    const matchesSearch =
      constItem.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      constItem.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || constItem.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: construtorasData.length,
    ativas: construtorasData.filter(c => c.status === 'ativa').length,
    projetos: construtorasData.reduce((acc, c) => acc + c.empreendimentosAtivos, 0),
    vendas: construtorasData.reduce((acc, c) => acc + c.unidadesVendidas, 0),
    receita: construtorasData.reduce((acc, c) => acc + c.receitaTotal, 0),
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `R$ ${(price / 1000000).toFixed(1)}M`
    if (price >= 1000) return `R$ ${(price / 1000).toFixed(0)}k`
    return `R$ ${price.toFixed(0)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Construtoras Parceiras</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie parceiros e empreendimentos
          </p>
        </div>
        <button
          onClick={() => router.push('/backoffice/construtoras/nova')}
          className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-colors"
        >
          <Plus size={20} />
          Nova Construtora
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-green-600 mb-1">Ativas</p>
          <p className="text-2xl font-bold text-green-700">{stats.ativas}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Projetos Ativos</p>
          <p className="text-2xl font-bold text-blue-700">{stats.projetos}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Unidades Vendidas</p>
          <p className="text-2xl font-bold text-purple-700">{stats.vendas}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Receita Total</p>
          <p className="text-xl font-bold text-green-700">{formatPrice(stats.receita)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar construtoras..."
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
            <option value="ativa">Ativa</option>
            <option value="inativa">Inativa</option>
          </select>
        </div>
      </div>

      {/* Grid de Construtoras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredConstrutoras.map((construtora) => (
          <div
            key={construtora.id}
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => router.push(`/backoffice/construtoras/${construtora.id}`)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 size={24} className="text-accent-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{construtora.nome}</h3>
                  <p className="text-sm text-gray-600">{construtora.nomeFantasia}</p>
                  <p className="text-xs text-gray-500">{construtora.cnpj}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${construtora.status === 'ativa' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {construtora.status === 'ativa' ? 'Ativa' : 'Inativa'}
                </span>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-bold text-gray-900">{construtora.rating}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-gray-100">
              <div>
                <p className="text-xs text-gray-600 mb-1">Projetos</p>
                <p className="text-lg font-bold text-blue-700">{construtora.empreendimentosAtivos}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Vendas</p>
                <p className="text-lg font-bold text-purple-700">{construtora.unidadesVendidas}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Receita</p>
                <p className="text-sm font-bold text-green-700">{formatPrice(construtora.receitaTotal)}</p>
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} />
                <span className="line-clamp-1">{construtora.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} />
                <span>{construtora.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} />
                <span>{construtora.email}</span>
              </div>
            </div>

            {/* Responsável */}
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <p className="text-xs text-gray-600 mb-1">Responsável</p>
              <p className="text-sm font-medium text-gray-900">{construtora.responsavel}</p>
              <p className="text-xs text-gray-600">{construtora.phoneResponsavel}</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp size={14} className="text-green-600" />
                <span className="text-gray-600">Parceria: {construtora.parceriaDuracao}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/backoffice/construtoras/${construtora.id}`)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Eye size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/backoffice/construtoras/${construtora.id}/editar`)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredConstrutoras.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma construtora encontrada</h3>
          <p className="text-gray-600 mb-6">Tente ajustar os filtros ou cadastrar uma nova construtora</p>
          <button
            onClick={() => router.push('/backoffice/construtoras/nova')}
            className="inline-flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700"
          >
            <Plus size={20} />
            Nova Construtora
          </button>
        </div>
      )}
    </div>
  )
}
