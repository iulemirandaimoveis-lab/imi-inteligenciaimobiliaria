'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Calculator,
  Phone,
  Mail,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Dados reais
const creditoData = [
  {
    id: 1,
    protocol: 'CRD-2026-001',
    client: 'Maria Santos Silva',
    clientEmail: 'maria.santos@gmail.com',
    clientPhone: '(81) 99845-3421',
    propertyValue: 580000,
    financedAmount: 464000,
    term: 360,
    interestRate: 9.5,
    monthlyPayment: 3901,
    totalInterest: 940360,
    bank: 'Caixa Econômica Federal',
    status: 'aprovado',
    ltv: 80,
    dti: 26,
    created: '2026-02-10',
  },
  {
    id: 2,
    protocol: 'CRD-2026-002',
    client: 'João Pedro Almeida',
    clientEmail: 'joao.almeida@hotmail.com',
    clientPhone: '(81) 98732-1098',
    propertyValue: 850000,
    financedAmount: 595000,
    term: 420,
    interestRate: 8.9,
    monthlyPayment: 4982,
    totalInterest: 1497440,
    bank: 'Banco do Brasil',
    status: 'analise',
    ltv: 70,
    dti: 23,
    created: '2026-02-13',
  },
  {
    id: 3,
    protocol: 'CRD-2026-003',
    client: 'Ana Carolina Ferreira',
    clientEmail: 'anacarolina.f@outlook.com',
    clientPhone: '(81) 99234-5678',
    propertyValue: 420000,
    financedAmount: 336000,
    term: 300,
    interestRate: 9.8,
    monthlyPayment: 3152,
    totalInterest: 609600,
    bank: 'Santander',
    status: 'aprovado',
    ltv: 80,
    dti: 26,
    created: '2026-02-11',
  },
  {
    id: 4,
    protocol: 'CRD-2026-004',
    client: 'Roberto Carlos Mendes',
    clientEmail: 'roberto.mendes@empresarial.com.br',
    clientPhone: '(81) 98123-4567',
    propertyValue: 1200000,
    financedAmount: 840000,
    term: 360,
    interestRate: 8.5,
    monthlyPayment: 6456,
    totalInterest: 1484160,
    bank: 'Itaú',
    status: 'pendente',
    ltv: 70,
    dti: 22,
    created: '2026-02-14',
  },
]

const stats = {
  total: creditoData.length,
  aprovados: creditoData.filter(c => c.status === 'aprovado').length,
  analise: creditoData.filter(c => c.status === 'analise').length,
  pendentes: creditoData.filter(c => c.status === 'pendente').length,
}

export default function CreditoPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredCredito = creditoData.filter(cred => {
    const matchesSearch =
      cred.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || cred.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string; icon: any }> = {
      aprovado: { label: 'Aprovado', color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle },
      analise: { label: 'Em Análise', color: 'text-blue-700', bg: 'bg-blue-50', icon: Clock },
      pendente: { label: 'Pendente', color: 'text-orange-700', bg: 'bg-orange-50', icon: Clock },
      negado: { label: 'Negado', color: 'text-red-700', bg: 'bg-red-50', icon: XCircle },
    }
    return configs[status] || configs.pendente
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Crédito Imobiliário</h1>
          <p className="text-sm text-gray-600 mt-1">Simulações e análise de financiamento</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/backoffice/credito/simulador')}
            className="flex items-center gap-2 h-11 px-6 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
          >
            <Calculator size={20} />
            Simulador
          </button>
          <button
            onClick={() => router.push('/backoffice/credito/nova')}
            className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700"
          >
            <Plus size={20} />
            Nova Análise
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-green-600 mb-1">Aprovados</p>
          <p className="text-2xl font-bold text-green-700">{stats.aprovados}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-blue-600 mb-1">Em Análise</p>
          <p className="text-2xl font-bold text-blue-700">{stats.analise}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-orange-600 mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-orange-700">{stats.pendentes}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por protocolo ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
          >
            <option value="all">Todos os status</option>
            <option value="aprovado">Aprovado</option>
            <option value="analise">Em Análise</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border">
        <div className="divide-y">
          {filteredCredito.map((cred) => {
            const statusConfig = getStatusConfig(cred.status)
            const StatusIcon = statusConfig.icon

            return (
              <div
                key={cred.id}
                className="p-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/backoffice/credito/${cred.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <DollarSign size={24} className="text-purple-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-bold text-purple-600">{cred.protocol}</span>
                          <span className="text-xs text-gray-500">{cred.bank}</span>
                        </div>
                        <h3 className="font-semibold mb-1">{cred.client}</h3>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>Imóvel: {formatPrice(cred.propertyValue)}</span>
                          <span>•</span>
                          <span>Financiado: {formatPrice(cred.financedAmount)}</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4 py-3 border-t">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Parcela</p>
                        <p className="text-sm font-bold">{formatPrice(cred.monthlyPayment)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Prazo</p>
                        <p className="text-sm font-bold">{cred.term} meses</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Taxa</p>
                        <p className="text-sm font-bold text-purple-700">{cred.interestRate}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">LTV</p>
                        <p className="text-sm font-bold text-accent-700">{cred.ltv}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">DTI</p>
                        <p className={`text-sm font-bold ${cred.dti > 30 ? 'text-red-700' : 'text-green-700'}`}>
                          {cred.dti}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = `mailto:${cred.clientEmail}`
                      }}
                      className="w-9 h-9 rounded-lg border hover:bg-gray-50 flex items-center justify-center"
                    >
                      <Mail size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = `https://wa.me/55${cred.clientPhone.replace(/\D/g, '')}`
                      }}
                      className="w-9 h-9 rounded-lg border hover:bg-gray-50 flex items-center justify-center"
                    >
                      <Phone size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
