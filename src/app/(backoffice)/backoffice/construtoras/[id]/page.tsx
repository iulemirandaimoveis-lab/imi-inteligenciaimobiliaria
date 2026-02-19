'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  User,
  Star,
  TrendingUp,
  Edit,
  Home,
  DollarSign,
  Calendar,
  FileText,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Dados construtora mockados
const construtoraData = {
  id: 1,
  nome: 'Construtora Central',
  nomeFantasia: 'Central Empreendimentos',
  cnpj: '12.345.678/0001-99',
  inscricaoEstadual: '123.456.789.012',
  email: 'contato@construtoracentral.com.br',
  phone: '(81) 3456-7890',
  website: 'www.construtoracentral.com.br',
  address: 'Av. Eng. Domingos Ferreira, 4000 - Boa Viagem, Recife/PE',
  cep: '51021-040',

  responsavel: {
    nome: 'Carlos Mendonça',
    cargo: 'Diretor Comercial',
    email: 'carlos@construtoracentral.com.br',
    phone: '(81) 99876-5432',
  },

  status: 'ativa',
  rating: 4.8,
  parceriaDuracao: '5 anos',
  parceriaInicio: '2021-03-15',

  stats: {
    empreendimentosAtivos: 3,
    empreendimentosConcluidos: 12,
    unidadesVendidas: 127,
    unidadesEmVenda: 48,
    receitaTotal: 45000000,
    receitaUltimos12Meses: 18500000,
  },

  empreendimentos: [
    {
      id: 1,
      name: 'Villa Jardins',
      location: 'Boa Viagem',
      unidadesTotal: 32,
      unidadesVendidas: 24,
      status: 'em_construcao',
      precoMedio: 680000,
      entregaPrevista: '2026-12-01',
    },
    {
      id: 2,
      name: 'Smart Pina',
      location: 'Pina',
      unidadesTotal: 24,
      unidadesVendidas: 18,
      status: 'em_construcao',
      precoMedio: 520000,
      entregaPrevista: '2027-06-01',
    },
    {
      id: 3,
      name: 'Península Gardens',
      location: 'Piedade',
      unidadesTotal: 40,
      unidadesVendidas: 40,
      status: 'concluido',
      precoMedio: 780000,
      entregaPrevista: '2025-08-01',
    },
  ],

  observacoes: 'Parceiro estratégico with excellent histórico de entregas no prazo. Foco em empreendimentos de alto padrão na zona sul do Recife.',
}

export default function ConstrutoraDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'empreendimentos' | 'financeiro'>('overview')

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `R$ ${(price / 1000000).toFixed(1)}M`
    if (price >= 1000) return `R$ ${(price / 1000).toFixed(0)}k`
    return `R$ ${price.toLocaleString('pt-BR')}`
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      em_construcao: 'bg-blue-50 text-blue-700',
      concluido: 'bg-green-50 text-green-700',
      planejamento: 'bg-orange-50 text-orange-700',
    }
    return colors[status] || colors.planejamento
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      em_construcao: 'Em Construção',
      concluido: 'Concluído',
      planejamento: 'Planejamento',
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{construtoraData.nome}</h1>
              <span className={`px-3 py-1 rounded-lg text-xs font-medium ${construtoraData.status === 'ativa' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                {construtoraData.status === 'ativa' ? 'Ativa' : 'Inativa'}
              </span>
              <div className="flex items-center gap-1">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-bold text-gray-900">{construtoraData.rating}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">{construtoraData.nomeFantasia}</p>
          </div>
        </div>

        <button
          onClick={() => router.push(`/backoffice/construtoras/${params.id}/editar`)}
          className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-colors"
        >
          <Edit size={20} />
          Editar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Projetos Ativos</p>
          <p className="text-2xl font-bold text-blue-700">{construtoraData.stats.empreendimentosAtivos}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Concluídos</p>
          <p className="text-2xl font-bold text-green-700">{construtoraData.stats.empreendimentosConcluidos}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Unidades Vendidas</p>
          <p className="text-2xl font-bold text-purple-700">{construtoraData.stats.unidadesVendidas}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Em Venda</p>
          <p className="text-2xl font-bold text-orange-700">{construtoraData.stats.unidadesEmVenda}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border col-span-2">
          <p className="text-xs text-gray-600 mb-1">Receita Total</p>
          <p className="text-2xl font-bold text-green-700">{formatPrice(construtoraData.stats.receitaTotal)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {['overview', 'empreendimentos', 'financeiro'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-accent-600 text-accent-600' : 'border-transparent text-gray-600'
                }`}
            >
              {tab === 'overview' ? 'Visão Geral' : tab === 'empreendimentos' ? 'Empreendimentos' : 'Financeiro'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dados Cadastrais */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Dados Cadastrais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">CNPJ</p>
                  <p className="text-sm font-medium text-gray-900">{construtoraData.cnpj}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Inscrição Estadual</p>
                  <p className="text-sm font-medium text-gray-900">{construtoraData.inscricaoEstadual}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-600 mb-1">Endereço</p>
                  <p className="text-sm font-medium text-gray-900">{construtoraData.address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Telefone</p>
                  <p className="text-sm font-medium text-gray-900">{construtoraData.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900">{construtoraData.email}</p>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="bg-white rounded-2xl p-6 border">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Observações</h2>
              <p className="text-sm text-gray-700">{construtoraData.observacoes}</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Responsável */}
            <div className="bg-white rounded-2xl p-6 border">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Responsável</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Nome</p>
                  <p className="text-sm font-medium text-gray-900">{construtoraData.responsavel.nome}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Cargo</p>
                  <p className="text-sm font-medium text-gray-900">{construtoraData.responsavel.cargo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900">{construtoraData.responsavel.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Telefone</p>
                  <p className="text-sm font-medium text-gray-900">{construtoraData.responsavel.phone}</p>
                </div>
              </div>
            </div>

            {/* Parceria */}
            <div className="bg-white rounded-2xl p-6 border">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Parceria</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Duração</p>
                  <p className="text-sm font-medium text-gray-900">{construtoraData.parceriaDuracao}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Início</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(construtoraData.parceriaInicio).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'empreendimentos' && (
        <div className="space-y-4">
          {construtoraData.empreendimentos.map((emp) => {
            const progressVendas = (emp.unidadesVendidas / emp.unidadesTotal) * 100

            return (
              <div key={emp.id} className="bg-white rounded-2xl p-6 border hover:shadow-lg transition-all cursor-pointer"
                onClick={() => router.push(`/backoffice/imoveis/${emp.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{emp.name}</h3>
                    <p className="text-sm text-gray-600">{emp.location}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(emp.status)}`}>
                    {getStatusLabel(emp.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Unidades</p>
                    <p className="text-lg font-bold text-gray-900">{emp.unidadesTotal}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Vendidas</p>
                    <p className="text-lg font-bold text-green-700">{emp.unidadesVendidas}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Preço Médio</p>
                    <p className="text-lg font-bold text-accent-700">{formatPrice(emp.precoMedio)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Entrega</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(emp.entregaPrevista).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">Progresso de Vendas</span>
                    <span className="text-xs font-bold text-gray-900">{progressVendas.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${progressVendas}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'financeiro' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Receita</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Receita Total</p>
                <p className="text-3xl font-bold text-green-700">{formatPrice(construtoraData.stats.receitaTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Últimos 12 Meses</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(construtoraData.stats.receitaUltimos12Meses)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Performance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Taxa de Vendas</span>
                <span className="text-lg font-bold text-green-700">
                  {((construtoraData.stats.unidadesVendidas / (construtoraData.stats.unidadesVendidas + construtoraData.stats.unidadesEmVenda)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ticket Médio</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(construtoraData.stats.receitaTotal / construtoraData.stats.unidadesVendidas)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
