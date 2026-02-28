'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  MapPin,
  Building2,
  Bed,
  Bath,
  Ruler,
  Car,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Eye,
  Edit,
  Share2,
  Download,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Home,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - DADOS REAIS DO RESERVA ATLANTIS
const imovelData = {
  id: 1,
  name: 'Reserva Atlantis',
  type: 'Apartamento',
  status: 'lancamento',
  location: 'Boa Viagem',
  address: 'Av. Boa Viagem, 5420',
  city: 'Recife',
  state: 'PE',
  cep: '51020-240',

  // Valores
  price: 650000,
  pricePerM2: 8125,
  minPrice: 580000,
  maxPrice: 1200000,

  // Características
  area: 80,
  minArea: 60,
  maxArea: 120,
  bedrooms: 3,
  bathrooms: 2,
  parking: 2,
  floors: 24,
  unitsPerFloor: 5,

  // Vendas
  units: 120,
  unitsSold: 45,
  unitsAvailable: 75,
  leads: 67,
  views: 1234,
  conversions: 12,

  // Construtora
  developer: 'Grupo IMI',
  developerPhone: '(81) 3025-5555',
  developerEmail: 'contato@grupoimi.com.br',

  // Cronograma
  launchDate: '2026-02-01',
  completionDate: '2027-06-30',
  completionProgress: 15,

  // Descrição
  description: `O Reserva Atlantis é um empreendimento premium localizado na orla de Boa Viagem, 
    com vista privilegiada para o mar. Projeto arquitetônico moderno de alto padrão, 
    assinado pelo renomado escritório Arquitetura Tropical.
    
    Com 24 andares e apenas 5 apartamentos por andar, garantindo privacidade e exclusividade.
    Apartamentos de 60m² (2 quartos) até 120m² (3 quartos com suíte master).
    
    Localização estratégica: a 200m da praia, próximo ao Shopping Recife, hospitais de referência,
    e principais avenidas da zona sul da cidade.`,

  // Features completas
  features: [
    { category: 'Apartamento', items: ['Vista Mar', 'Varanda Gourmet', 'Suite Master', 'Closet', 'Lavabo'] },
    { category: 'Lazer', items: ['Piscina Infinity', 'Academia Completa', 'Sauna', 'Salão de Festas', 'Espaço Gourmet'] },
    { category: 'Serviços', items: ['Portaria 24h', 'Concierge', 'Salão de Beleza', 'Coworking', 'Brinquedoteca'] },
    { category: 'Sustentabilidade', items: ['Energia Solar', 'Reuso de Água', 'Coleta Seletiva', 'Bike Place'] },
  ],

  // Plantas disponíveis
  floorPlans: [
    { name: '2 Quartos', area: 60, bedrooms: 2, bathrooms: 1, parking: 1, price: 580000, available: 8 },
    { name: '3 Quartos', area: 80, bedrooms: 3, bathrooms: 2, parking: 2, price: 650000, available: 42 },
    { name: '3 Quartos Premium', area: 95, bedrooms: 3, bathrooms: 2, parking: 2, price: 780000, available: 18 },
    { name: 'Cobertura', area: 120, bedrooms: 4, bathrooms: 3, parking: 3, price: 1200000, available: 7 },
  ],

  // Histórico de vendas (últimos 6 meses)
  salesHistory: [
    { month: 'Ago/25', sold: 4, revenue: 2600000 },
    { month: 'Set/25', sold: 6, revenue: 3900000 },
    { month: 'Out/25', sold: 8, revenue: 5200000 },
    { month: 'Nov/25', sold: 7, revenue: 4550000 },
    { month: 'Dez/25', sold: 12, revenue: 7800000 },
    { month: 'Jan/26', sold: 8, revenue: 5200000 },
  ],

  // Leads por origem
  leadsBySource: [
    { source: 'Instagram', count: 28, conversions: 5 },
    { source: 'Google Ads', count: 18, conversions: 3 },
    { source: 'Site', count: 12, conversions: 2 },
    { source: 'Indicação', count: 9, conversions: 2 },
  ],

  // Visitas agendadas
  scheduledVisits: [
    { date: '2026-02-15T10:00', client: 'Maria Santos', phone: '(81) 99845-3421' },
    { date: '2026-02-15T14:00', client: 'João Pedro', phone: '(81) 98732-1098' },
    { date: '2026-02-16T10:30', client: 'Ana Carolina', phone: '(81) 99234-5678' },
  ],
}

export default function ImovelDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'leads'>('overview')

  // ⚠️ NÃO MODIFICAR CÁLCULOS
  const soldPercentage = (imovelData.unitsSold / imovelData.units) * 100
  const conversionRate = (imovelData.conversions / imovelData.leads) * 100
  const totalRevenue = imovelData.salesHistory.reduce((acc, h) => acc + h.revenue, 0)
  const avgTicket = totalRevenue / imovelData.salesHistory.reduce((acc, h) => acc + h.sold, 0)

  // ⚠️ NÃO MODIFICAR FUNÇÃO getStatusConfig
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string }> = {
      lancamento: { label: 'Lançamento 🚀', color: 'text-blue-700', bg: 'bg-blue-50' },
      obras: { label: 'Em Obras 🏗️', color: 'text-orange-700', bg: 'bg-orange-50' },
      pronto: { label: 'Pronto ✅', color: 'text-green-700', bg: 'bg-green-50' },
    }
    return configs[status] || configs.lancamento
  }

  const statusConfig = getStatusConfig(imovelData.status)

  // ⚠️ NÃO MODIFICAR FUNÇÃO formatPrice
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `R$ ${(price / 1000000).toFixed(1)}M`
    }
    return `R$ ${(price / 1000).toFixed(0)}k`
  }

  // ⚠️ NÃO MODIFICAR FUNÇÃO formatDate
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      {/* ⚠️ NÃO MODIFICAR HEADER */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {imovelData.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {imovelData.address}, {imovelData.location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 size={14} />
                {imovelData.developer}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="h-10 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Share2 size={16} />
            <span className="hidden sm:inline">Compartilhar</span>
          </button>
          <button className="h-10 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Download size={16} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button
            onClick={() => router.push(`/backoffice/imoveis/${params.id}/editar`)}
            className="h-10 px-4 bg-[#16162A] text-white rounded-lg hover:bg-[#0F0F1E] transition-colors flex items-center gap-2"
          >
            <Edit size={16} />
            <span className="hidden sm:inline">Editar</span>
          </button>
        </div>
      </div>

      {/* ⚠️ NÃO MODIFICAR STATUS E PREÇO */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`px-4 py-2 rounded-xl border ${statusConfig.bg} border-current`}>
          <span className={`text-sm font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
        <div className="px-4 py-2 rounded-xl bg-green-50 border border-green-200">
          <span className="text-sm font-medium text-green-700">
            {imovelData.unitsSold} vendidas • {imovelData.unitsAvailable} disponíveis
          </span>
        </div>
        <div className="px-4 py-2 rounded-xl bg-accent-50 border border-accent-200">
          <span className="text-sm font-medium text-[#0F0F1E]">
            {formatPrice(imovelData.minPrice)} - {formatPrice(imovelData.maxPrice)}
          </span>
        </div>
      </div>

      {/* ⚠️ NÃO MODIFICAR KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-blue-600" />
            <p className="text-xs text-gray-600">Total Unidades</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{imovelData.units}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-green-600" />
            <p className="text-xs text-gray-600">Vendidas</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{imovelData.unitsSold}</p>
          <p className="text-xs text-gray-500">{soldPercentage.toFixed(1)}%</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-[#3B82F6]" />
            <p className="text-xs text-gray-600">Leads</p>
          </div>
          <p className="text-2xl font-bold text-[#0F0F1E]">{imovelData.leads}</p>
          <p className="text-xs text-gray-500">{imovelData.conversions} conversões</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-purple-600" />
            <p className="text-xs text-gray-600">Taxa Conversão</p>
          </div>
          <p className="text-2xl font-bold text-purple-700">{conversionRate.toFixed(1)}%</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-gray-600" />
            <p className="text-xs text-gray-600">Visualizações</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{imovelData.views.toLocaleString('pt-BR')}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-green-600" />
            <p className="text-xs text-gray-600">Ticket Médio</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{formatPrice(avgTicket)}</p>
        </div>
      </div>

      {/* ⚠️ NÃO MODIFICAR TABS */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
                ? 'border-[#3B82F6] text-[#3B82F6]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sales'
                ? 'border-[#3B82F6] text-[#3B82F6]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            Vendas & Analytics
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'leads'
                ? 'border-[#3B82F6] text-[#3B82F6]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            Leads & Visitas
          </button>
        </div>
      </div>

      {/* ⚠️ NÃO MODIFICAR TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Imagem */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="relative h-96 bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon size={64} className="text-gray-400" />
                </div>
                <div className="absolute top-6 left-6">
                  <span className={`px-4 py-2 rounded-xl text-sm font-medium border ${statusConfig.bg} ${statusConfig.color} backdrop-blur-sm`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Sobre o Empreendimento</h2>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                {imovelData.description}
              </div>
            </div>

            {/* Características */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Características</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Bed size={24} className="text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{imovelData.bedrooms}</p>
                  <p className="text-sm text-gray-600">Quartos</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Bath size={24} className="text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{imovelData.bathrooms}</p>
                  <p className="text-sm text-gray-600">Banheiros</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Ruler size={24} className="text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{imovelData.area}m²</p>
                  <p className="text-sm text-gray-600">Área</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Car size={24} className="text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{imovelData.parking}</p>
                  <p className="text-sm text-gray-600">Vagas</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Diferenciais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {imovelData.features.map((category, index) => (
                  <div key={index}>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                      {category.category}
                    </h3>
                    <ul className="space-y-2">
                      {category.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Plantas */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Plantas Disponíveis</h2>
              <div className="space-y-4">
                {imovelData.floorPlans.map((plan, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-xl hover:border-accent-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900">{plan.name}</h3>
                      <span className="text-2xl font-bold text-[#0F0F1E]">
                        {formatPrice(plan.price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Ruler size={14} />
                        {plan.area}m²
                      </span>
                      <span className="flex items-center gap-1">
                        <Bed size={14} />
                        {plan.bedrooms}Q
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath size={14} />
                        {plan.bathrooms}B
                      </span>
                      <span className="flex items-center gap-1">
                        <Car size={14} />
                        {plan.parking}V
                      </span>
                      <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${plan.available > 10 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                        {plan.available} disponíveis
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Contato Construtora */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Construtora
              </h3>
              <p className="font-bold text-gray-900 mb-4">{imovelData.developer}</p>
              <div className="space-y-3">
                <a
                  href={`tel:${imovelData.developerPhone}`}
                  className="flex items-center gap-3 text-sm text-gray-700 hover:text-[#3B82F6] transition-colors"
                >
                  <Phone size={16} />
                  {imovelData.developerPhone}
                </a>
                <a
                  href={`mailto:${imovelData.developerEmail}`}
                  className="flex items-center gap-3 text-sm text-gray-700 hover:text-[#3B82F6] transition-colors"
                >
                  <Mail size={16} />
                  {imovelData.developerEmail}
                </a>
              </div>
            </div>

            {/* Cronograma */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Cronograma
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Lançamento</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(imovelData.launchDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Entrega Prevista</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(imovelData.completionDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-2">Progresso da Obra</p>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1A1A2E] rounded-full transition-all duration-500"
                      style={{ width: `${imovelData.completionProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{imovelData.completionProgress}% concluído</p>
                </div>
              </div>
            </div>

            {/* Localização */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Localização
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>{imovelData.address}</p>
                <p>{imovelData.location} - {imovelData.city}/{imovelData.state}</p>
                <p>CEP: {imovelData.cep}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Histórico de Vendas */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Histórico de Vendas (6 meses)</h2>
            <div className="space-y-4">
              {imovelData.salesHistory.map((history, index) => {
                const maxSold = Math.max(...imovelData.salesHistory.map(h => h.sold))
                const percentage = (history.sold / maxSold) * 100

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{history.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600">{history.sold} unidades</span>
                        <span className="font-bold text-green-700">{formatPrice(history.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-[#1A1A2E] rounded-lg transition-all duration-700"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Leads por Origem */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Leads por Origem</h2>
            <div className="space-y-4">
              {imovelData.leadsBySource.map((source, index) => {
                const convRate = (source.conversions / source.count) * 100

                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 mb-1">{source.source}</p>
                      <p className="text-sm text-gray-600">
                        {source.count} leads • {source.conversions} conversões
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#0F0F1E]">{convRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">taxa conversão</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="space-y-6">
          {/* Visitas Agendadas */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Visitas Agendadas</h2>
            <div className="space-y-4">
              {imovelData.scheduledVisits.map((visit, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-accent-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center">
                      <Calendar size={20} className="text-[#3B82F6]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{visit.client}</p>
                      <p className="text-sm text-gray-600">{formatDate(visit.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/55${visit.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                    >
                      <MessageSquare size={16} />
                    </a>
                    <a
                      href={`tel:${visit.phone}`}
                      className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                    >
                      <Phone size={16} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
