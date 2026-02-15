'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calculator,
  Building2,
  User,
  Phone,
  Mail,
  Eye,
  Edit,
  FileText,
  Calendar,
  Percent,
  Home,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Simulações reais Recife
const simulacoesData = [
  {
    id: 1,
    protocol: 'CRE-2026-001',
    client: 'Maria Santos Silva',
    clientEmail: 'maria.santos@gmail.com',
    clientPhone: '(81) 99845-3421',
    propertyValue: 580000,
    downPayment: 116000,
    financedAmount: 464000,
    term: 360,
    interestRate: 9.5,
    monthlyPayment: 3891,
    totalPayment: 1400760,
    totalInterest: 936760,
    income: 15000,
    ltv: 80,
    dti: 25.9,
    status: 'aprovada',
    bank: 'Caixa Econômica',
    propertyType: 'Apartamento',
    location: 'Boa Viagem',
    created: '2026-02-10',
    approved: '2026-02-14',
  },
  {
    id: 2,
    protocol: 'CRE-2026-002',
    client: 'João Pedro Almeida',
    clientEmail: 'joao.almeida@hotmail.com',
    clientPhone: '(81) 98732-1098',
    propertyValue: 850000,
    downPayment: 170000,
    financedAmount: 680000,
    term: 420,
    interestRate: 9.8,
    monthlyPayment: 5834,
    totalPayment: 2450280,
    totalInterest: 1770280,
    income: 25000,
    ltv: 80,
    dti: 23.3,
    status: 'em_analise',
    bank: 'Banco do Brasil',
    propertyType: 'Casa',
    location: 'Piedade',
    created: '2026-02-12',
    approved: null,
  },
  {
    id: 3,
    protocol: 'CRE-2026-003',
    client: 'Ana Carolina Ferreira',
    clientEmail: 'anacarolina.f@outlook.com',
    clientPhone: '(81) 99234-5678',
    propertyValue: 420000,
    downPayment: 84000,
    financedAmount: 336000,
    term: 300,
    interestRate: 9.2,
    monthlyPayment: 3021,
    totalPayment: 906300,
    totalInterest: 570300,
    income: 12000,
    ltv: 80,
    dti: 25.2,
    status: 'pendente',
    bank: 'Itaú',
    propertyType: 'Apartamento',
    location: 'Pina',
    created: '2026-02-14',
    approved: null,
  },
  {
    id: 4,
    protocol: 'CRE-2026-004',
    client: 'Roberto Carlos Mendes',
    clientEmail: 'roberto.mendes@empresarial.com.br',
    clientPhone: '(81) 98123-4567',
    propertyValue: 1200000,
    downPayment: 360000,
    financedAmount: 840000,
    term: 360,
    interestRate: 8.9,
    monthlyPayment: 6789,
    totalPayment: 2444040,
    totalInterest: 1604040,
    income: 35000,
    ltv: 70,
    dti: 19.4,
    status: 'aprovada',
    bank: 'Santander',
    propertyType: 'Casa',
    location: 'Piedade',
    created: '2026-02-08',
    approved: '2026-02-11',
  },
  {
    id: 5,
    protocol: 'CRE-2026-005',
    client: 'Patricia Lima Costa',
    clientEmail: 'patricia.lima@gmail.com',
    clientPhone: '(81) 99876-5432',
    propertyValue: 480000,
    downPayment: 96000,
    financedAmount: 384000,
    term: 360,
    interestRate: 9.6,
    monthlyPayment: 3246,
    totalPayment: 1168560,
    totalInterest: 784560,
    income: 13000,
    ltv: 80,
    dti: 25.0,
    status: 'negada',
    bank: 'Bradesco',
    propertyType: 'Apartamento',
    location: 'Setúbal',
    created: '2026-02-09',
    approved: null,
  },
  {
    id: 6,
    protocol: 'CRE-2026-006',
    client: 'Fernando Augusto Rocha',
    clientEmail: 'fernando.rocha@yahoo.com',
    clientPhone: '(81) 98765-4321',
    propertyValue: 1500000,
    downPayment: 450000,
    financedAmount: 1050000,
    term: 420,
    interestRate: 8.7,
    monthlyPayment: 8456,
    totalPayment: 3551520,
    totalInterest: 2501520,
    income: 45000,
    ltv: 70,
    dti: 18.8,
    status: 'em_analise',
    bank: 'Caixa Econômica',
    propertyType: 'Cobertura',
    location: 'Boa Viagem',
    created: '2026-02-13',
    approved: null,
  },
]

// ⚠️ NÃO MODIFICAR - Stats
const stats = {
  total: simulacoesData.length,
  aprovadas: simulacoesData.filter(s => s.status === 'aprovada').length,
  emAnalise: simulacoesData.filter(s => s.status === 'em_analise').length,
  pendentes: simulacoesData.filter(s => s.status === 'pendente').length,
  negadas: simulacoesData.filter(s => s.status === 'negada').length,
  totalFinanciado: simulacoesData.reduce((acc, s) => acc + s.financedAmount, 0),
  avgLTV: Math.round(simulacoesData.reduce((acc, s) => acc + s.ltv, 0) / simulacoesData.length),
  avgDTI: (simulacoesData.reduce((acc, s) => acc + s.dti, 0) / simulacoesData.length).toFixed(1),
}

export default function CreditoPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [bankFilter, setBankFilter] = useState('all')

  const filteredSimulacoes = simulacoesData.filter(sim => {
    const matchesSearch =
      sim.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sim.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || sim.status === statusFilter
    const matchesBank = bankFilter === 'all' || sim.bank === bankFilter
    return matchesSearch && matchesStatus && matchesBank
  })

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string; icon: any }> = {
      aprovada: { label: 'Aprovada', color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle },
      em_analise: { label: 'Em Análise', color: 'text-blue-700', bg: 'bg-blue-50', icon: Clock },
      pendente: { label: 'Pendente', color: 'text-orange-700', bg: 'bg-orange-50', icon: AlertCircle },
      negada: { label: 'Negada', color: 'text-red-700', bg: 'bg-red-50', icon: XCircle },
    }
    return configs[status] || configs.pendente
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(price)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crédito Imobiliário</h1>
          <p className="text-sm text-gray-600 mt-1">Simulações e análise de financiamento</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/backoffice/credito/simulador')}
            className="flex items-center gap-2 h-11 px-6 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-all"
          >
            <Calculator size={20} />
            Simulador
          </button>
          <button
            onClick={() => router.push('/backoffice/credito/nova')}
            className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-all"
          >
            <Plus size={20} />
            Nova Simulação
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-green-600 mb-1">Aprovadas</p>
          <p className="text-2xl font-bold text-green-700">{stats.aprovadas}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-blue-600 mb-1">Em Análise</p>
          <p className="text-2xl font-bold text-blue-700">{stats.emAnalise}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-orange-600 mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-orange-700">{stats.pendentes}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-red-600 mb-1">Negadas</p>
          <p className="text-2xl font-bold text-red-700">{stats.negadas}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 col-span-2">
          <p className="text-xs text-gray-600 mb-1">Total Financiado</p>
          <p className="text-2xl font-bold text-accent-700">{formatPrice(stats.totalFinanciado)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-600 mb-1">LTV Médio</p>
          <p className="text-2xl font-bold text-gray-900">{stats.avgLTV}%</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por protocolo ou cliente..."
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
            <option value="aprovada">Aprovada</option>
            <option value="em_analise">Em Análise</option>
            <option value="pendente">Pendente</option>
            <option value="negada">Negada</option>
          </select>
          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
          >
            <option value="all">Todos os bancos</option>
            <option value="Caixa Econômica">Caixa Econômica</option>
            <option value="Banco do Brasil">Banco do Brasil</option>
            <option value="Itaú">Itaú</option>
            <option value="Santander">Santander</option>
            <option value="Bradesco">Bradesco</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredSimulacoes.map((simulacao) => {
            const statusConfig = getStatusConfig(simulacao.status)
            const StatusIcon = statusConfig.icon

            return (
              <div
                key={simulacao.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => router.push(`/backoffice/credito/${simulacao.id}`)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <DollarSign size={24} className="text-green-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-bold text-accent-600">{simulacao.protocol}</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                            {simulacao.bank}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">{simulacao.client}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Building2 size={14} />
                            {simulacao.propertyType}
                          </span>
                          <span className="flex items-center gap-1">
                            <Home size={14} />
                            {simulacao.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign size={14} />
                            {formatPrice(simulacao.propertyValue)}
                          </span>
                        </div>
                      </div>

                      <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon size={14} />
                        {statusConfig.label}
                      </div>
                    </div>

                    {/* Financiamento Info */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Financiado</p>
                        <p className="text-sm font-bold text-gray-900">{formatPrice(simulacao.financedAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Entrada</p>
                        <p className="text-sm font-bold text-gray-900">{formatPrice(simulacao.downPayment)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Parcela</p>
                        <p className="text-sm font-bold text-accent-700">{formatPrice(simulacao.monthlyPayment)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Taxa</p>
                        <p className="text-sm font-bold text-purple-700">{simulacao.interestRate}% a.a.</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Prazo</p>
                        <p className="text-sm font-bold text-gray-900">{simulacao.term} meses</p>
                      </div>
                    </div>

                    {/* Indicadores */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                        LTV: {simulacao.ltv}%
                      </span>
                      <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                        DTI: {simulacao.dti}%
                      </span>
                      <span className="px-3 py-1 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium">
                        Renda: {formatPrice(simulacao.income)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Criado em {new Date(simulacao.created).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = `mailto:${simulacao.clientEmail}`
                      }}
                      className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                    >
                      <Mail size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = `https://wa.me/55${simulacao.clientPhone.replace(/\D/g, '')}`
                      }}
                      className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/backoffice/credito/${simulacao.id}`)
                      }}
                      className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredSimulacoes.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma simulação encontrada</h3>
          <p className="text-gray-600 mb-6">Tente ajustar os filtros ou criar uma nova simulação</p>
          <button
            onClick={() => router.push('/backoffice/credito/nova')}
            className="inline-flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700"
          >
            <Plus size={20} />
            Nova Simulação
          </button>
        </div>
      )}
    </div>
  )
}
