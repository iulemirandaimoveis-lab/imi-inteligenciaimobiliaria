'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  Download,
  Plus,
  FileText,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  TrendingUp,
  Award,
  Sparkles,
  User,
  Phone,
  Mail,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - DADOS REAIS DE AVALIAÇÕES RECIFE
const avaliacoesData = [
  {
    id: 1,
    protocol: 'AVL-2026-001',
    client: 'Maria Santos Silva',
    clientEmail: 'maria.santos@gmail.com',
    clientPhone: '(81) 99845-3421',
    propertyType: 'Apartamento',
    location: 'Boa Viagem',
    address: 'Av. Boa Viagem, 3456 - Apto 802',
    area: 85,
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    estimatedValue: 580000,
    method: 'Comparativo de Dados de Mercado',
    status: 'concluida',
    priority: 'normal',
    requestDate: '2026-02-10T09:00:00',
    visitDate: '2026-02-12T14:00:00',
    deliveryDate: '2026-02-14T17:00:00',
    evaluator: 'Iule Miranda',
    cnai: 'CNAI 53290',
    purpose: 'Venda',
    created: '2026-02-10T09:00:00',
  },
  {
    id: 2,
    protocol: 'AVL-2026-002',
    client: 'João Pedro Almeida',
    clientEmail: 'joao.almeida@hotmail.com',
    clientPhone: '(81) 98732-1098',
    propertyType: 'Casa',
    location: 'Piedade',
    address: 'R. Real da Torre, 234',
    area: 180,
    bedrooms: 4,
    bathrooms: 3,
    parking: 3,
    estimatedValue: 850000,
    method: 'Comparativo de Dados de Mercado',
    status: 'em_andamento',
    priority: 'alta',
    requestDate: '2026-02-13T10:30:00',
    visitDate: '2026-02-15T10:00:00',
    deliveryDate: null,
    evaluator: 'Iule Miranda',
    cnai: 'CNAI 53290',
    purpose: 'Financiamento',
    created: '2026-02-13T10:30:00',
  },
  {
    id: 3,
    protocol: 'AVL-2026-003',
    client: 'Ana Carolina Ferreira',
    clientEmail: 'anacarolina.f@outlook.com',
    clientPhone: '(81) 99234-5678',
    propertyType: 'Apartamento',
    location: 'Pina',
    address: 'Av. Herculano Bandeira, 567 - Apto 1204',
    area: 65,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    estimatedValue: 420000,
    method: 'Comparativo de Dados de Mercado',
    status: 'pendente',
    priority: 'normal',
    requestDate: '2026-02-14T11:15:00',
    visitDate: null,
    deliveryDate: null,
    evaluator: null,
    cnai: null,
    purpose: 'Venda',
    created: '2026-02-14T11:15:00',
  },
  {
    id: 4,
    protocol: 'AVL-2026-004',
    client: 'Roberto Carlos Mendes',
    clientEmail: 'roberto.mendes@empresarial.com.br',
    clientPhone: '(81) 98123-4567',
    propertyType: 'Sala Comercial',
    location: 'Boa Viagem',
    address: 'Av. Conselheiro Aguiar, 1234 - Sala 503',
    area: 45,
    bedrooms: 0,
    bathrooms: 1,
    parking: 1,
    estimatedValue: 280000,
    method: 'Método da Renda',
    status: 'concluida',
    priority: 'alta',
    requestDate: '2026-02-08T08:00:00',
    visitDate: '2026-02-09T15:00:00',
    deliveryDate: '2026-02-11T16:00:00',
    evaluator: 'Iule Miranda',
    cnai: 'CNAI 53290',
    purpose: 'Seguro',
    created: '2026-02-08T08:00:00',
  },
  {
    id: 5,
    protocol: 'AVL-2026-005',
    client: 'Patricia Lima Costa',
    clientEmail: 'patricia.lima@gmail.com',
    clientPhone: '(81) 99876-5432',
    propertyType: 'Apartamento',
    location: 'Setúbal',
    address: 'R. Setúbal Premium, 890 - Apto 302',
    area: 72,
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    estimatedValue: 480000,
    method: 'Comparativo de Dados de Mercado',
    status: 'em_andamento',
    priority: 'normal',
    requestDate: '2026-02-12T13:20:00',
    visitDate: '2026-02-14T16:00:00',
    deliveryDate: null,
    evaluator: 'Iule Miranda',
    cnai: 'CNAI 53290',
    purpose: 'Venda',
    created: '2026-02-12T13:20:00',
  },
  {
    id: 6,
    protocol: 'AVL-2026-006',
    client: 'Fernando Augusto Rocha',
    clientEmail: 'fernando.rocha@yahoo.com',
    clientPhone: '(81) 98765-4321',
    propertyType: 'Cobertura',
    location: 'Boa Viagem',
    address: 'Av. Boa Viagem, 6789 - Cobertura',
    area: 150,
    bedrooms: 4,
    bathrooms: 4,
    parking: 3,
    estimatedValue: 1500000,
    method: 'Comparativo de Dados de Mercado',
    status: 'pendente',
    priority: 'alta',
    requestDate: '2026-02-14T14:45:00',
    visitDate: null,
    deliveryDate: null,
    evaluator: null,
    cnai: null,
    purpose: 'Financiamento',
    created: '2026-02-14T14:45:00',
  },
  {
    id: 7,
    protocol: 'AVL-2026-007',
    client: 'Juliana Oliveira Santos',
    clientEmail: 'ju.oliveira@gmail.com',
    clientPhone: '(81) 99654-3210',
    propertyType: 'Apartamento',
    location: 'Candeias',
    address: 'Av. Caxangá, 4567 - Apto 1502',
    area: 55,
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    estimatedValue: 320000,
    method: 'Comparativo de Dados de Mercado',
    status: 'cancelada',
    priority: 'baixa',
    requestDate: '2026-02-05T09:30:00',
    visitDate: null,
    deliveryDate: null,
    evaluator: null,
    cnai: null,
    purpose: 'Venda',
    created: '2026-02-05T09:30:00',
  },
  {
    id: 8,
    protocol: 'AVL-2026-008',
    client: 'Carlos Eduardo Martins',
    clientEmail: 'carlos.martins@empresa.com',
    clientPhone: '(81) 98543-2109',
    propertyType: 'Casa',
    location: 'Piedade',
    address: 'R. Piedade Garden, 123',
    area: 200,
    bedrooms: 4,
    bathrooms: 4,
    parking: 4,
    estimatedValue: 950000,
    method: 'Comparativo de Dados de Mercado',
    status: 'concluida',
    priority: 'normal',
    requestDate: '2026-02-06T10:00:00',
    visitDate: '2026-02-08T09:00:00',
    deliveryDate: '2026-02-10T18:00:00',
    evaluator: 'Iule Miranda',
    cnai: 'CNAI 53290',
    purpose: 'Venda',
    created: '2026-02-06T10:00:00',
  },
]

// ⚠️ NÃO MODIFICAR CÁLCULOS
const stats = {
  total: avaliacoesData.length,
  concluidas: avaliacoesData.filter(a => a.status === 'concluida').length,
  emAndamento: avaliacoesData.filter(a => a.status === 'em_andamento').length,
  pendentes: avaliacoesData.filter(a => a.status === 'pendente').length,
  canceladas: avaliacoesData.filter(a => a.status === 'cancelada').length,
  totalValue: avaliacoesData.reduce((acc, a) => acc + a.estimatedValue, 0),
  avgValue: Math.round(avaliacoesData.reduce((acc, a) => acc + a.estimatedValue, 0) / avaliacoesData.length),
  avgTime: 3.2, // dias
}

export default function AvaliacoesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // ⚠️ NÃO MODIFICAR LÓGICA DE FILTROS
  const filteredAvaliacoes = avaliacoesData.filter(avaliacao => {
    const matchesSearch =
      avaliacao.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avaliacao.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avaliacao.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avaliacao.address.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || avaliacao.status === statusFilter
    const matchesType = typeFilter === 'all' || avaliacao.propertyType === typeFilter
    const matchesPriority = priorityFilter === 'all' || avaliacao.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesType && matchesPriority
  })

  // ⚠️ NÃO MODIFICAR FUNÇÃO getStatusConfig
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string; icon: any }> = {
      pendente: {
        label: 'Pendente',
        color: 'text-orange-700',
        bg: 'bg-orange-50',
        icon: Clock
      },
      em_andamento: {
        label: 'Em Andamento',
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        icon: AlertCircle
      },
      concluida: {
        label: 'Concluída',
        color: 'text-green-700',
        bg: 'bg-green-50',
        icon: CheckCircle
      },
      cancelada: {
        label: 'Cancelada',
        color: 'text-red-700',
        bg: 'bg-red-50',
        icon: XCircle
      },
    }
    return configs[status] || configs.pendente
  }

  // ⚠️ NÃO MODIFICAR FUNÇÃO getPriorityConfig
  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { label: string; color: string; bg: string }> = {
      alta: { label: 'Alta', color: 'text-red-700', bg: 'bg-red-50' },
      normal: { label: 'Normal', color: 'text-blue-700', bg: 'bg-blue-50' },
      baixa: { label: 'Baixa', color: 'text-gray-700', bg: 'bg-gray-50' },
    }
    return configs[priority] || configs.normal
  }

  // ⚠️ NÃO MODIFICAR FUNÇÃO formatPrice
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `R$ ${(price / 1000000).toFixed(1)}M`
    }
    return `R$ ${(price / 1000).toFixed(0)}k`
  }

  // ⚠️ NÃO MODIFICAR FUNÇÃO getTimeAgo
  const getTimeAgo = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays} dias atrás`
    return past.toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      {/* ⚠️ NÃO MODIFICAR HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avaliações Técnicas</h1>
          <p className="text-sm text-gray-600 mt-1">
            Laudos técnicos NBR 14653 com certificação CNAI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/backoffice/avaliacoes/ia')}
            className="flex items-center gap-2 h-11 px-6 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all shadow-sm hover:shadow-md"
          >
            <Sparkles size={20} />
            Gerar com IA
          </button>
          <button
            onClick={() => router.push('/backoffice/avaliacoes/nova')}
            className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={20} />
            Nova Avaliação
          </button>
        </div>
      </div>

      {/* ⚠️ NÃO MODIFICAR STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-orange-600 mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-orange-700">{stats.pendentes}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-blue-600 mb-1">Em Andamento</p>
          <p className="text-2xl font-bold text-blue-700">{stats.emAndamento}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-green-600 mb-1">Concluídas</p>
          <p className="text-2xl font-bold text-green-700">{stats.concluidas}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-600 mb-1">Valor Total</p>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalValue)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-600 mb-1">Ticket Médio</p>
          <p className="text-2xl font-bold text-accent-700">{formatPrice(stats.avgValue)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-600 mb-1">Tempo Médio</p>
          <p className="text-2xl font-bold text-gray-900">{stats.avgTime}d</p>
        </div>
      </div>

      {/* ⚠️ NÃO MODIFICAR FILTROS */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por protocolo, cliente ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
          >
            <option value="all">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
          >
            <option value="all">Todos os tipos</option>
            <option value="Apartamento">Apartamento</option>
            <option value="Casa">Casa</option>
            <option value="Cobertura">Cobertura</option>
            <option value="Sala Comercial">Sala Comercial</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
          >
            <option value="all">Todas prioridades</option>
            <option value="alta">Alta</option>
            <option value="normal">Normal</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>

      {/* ⚠️ NÃO MODIFICAR LISTA */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredAvaliacoes.map((avaliacao) => {
            const statusConfig = getStatusConfig(avaliacao.status)
            const priorityConfig = getPriorityConfig(avaliacao.priority)
            const StatusIcon = statusConfig.icon

            return (
              <div
                key={avaliacao.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => router.push(`/backoffice/avaliacoes/${avaliacao.id}`)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={24} className="text-accent-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-bold text-accent-600">{avaliacao.protocol}</span>
                          {avaliacao.cnai && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                              <Award size={12} />
                              {avaliacao.cnai}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {avaliacao.client}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <Building2 size={14} />
                            {avaliacao.propertyType}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {avaliacao.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign size={14} />
                            {formatPrice(avaliacao.estimatedValue)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {avaliacao.address}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.color}`}>
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </div>
                        <div className={`px-3 py-1 rounded-md text-xs font-medium ${priorityConfig.bg} ${priorityConfig.color}`}>
                          {priorityConfig.label}
                        </div>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
                      <span>Solicitação: {getTimeAgo(avaliacao.requestDate)}</span>
                      {avaliacao.visitDate && (
                        <>
                          <span>•</span>
                          <span>Vistoria: {new Date(avaliacao.visitDate).toLocaleDateString('pt-BR')}</span>
                        </>
                      )}
                      {avaliacao.deliveryDate && (
                        <>
                          <span>•</span>
                          <span>Entrega: {new Date(avaliacao.deliveryDate).toLocaleDateString('pt-BR')}</span>
                        </>
                      )}
                      {avaliacao.evaluator && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {avaliacao.evaluator}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {avaliacao.method}
                      </span>
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                        {avaliacao.purpose}
                      </span>
                      <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded text-xs font-medium">
                        {avaliacao.area}m² • {avaliacao.bedrooms}Q • {avaliacao.bathrooms}B
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = `mailto:${avaliacao.clientEmail}`
                      }}
                      className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                      title="Email"
                    >
                      <Mail size={16} className="text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = `https://wa.me/55${avaliacao.clientPhone.replace(/\D/g, '')}`
                      }}
                      className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                      title="WhatsApp"
                    >
                      <Phone size={16} className="text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/backoffice/avaliacoes/${avaliacao.id}`)
                      }}
                      className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ⚠️ NÃO MODIFICAR EMPTY STATE */}
      {filteredAvaliacoes.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma avaliação encontrada
          </h3>
          <p className="text-gray-600 mb-6">
            Tente ajustar os filtros ou criar uma nova avaliação
          </p>
          <button
            onClick={() => router.push('/backoffice/avaliacoes/nova')}
            className="inline-flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-all"
          >
            <Plus size={20} />
            Nova Avaliação
          </button>
        </div>
      )}
    </div>
  )
}
