'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  MapPin,
  Building2,
  Bed,
  Bath,
  Ruler,
  Car,
  DollarSign,
  Calendar,
  CheckCircle,
  Award,
  User,
  Phone,
  Mail,
  Download,
  Share2,
  Edit,
  Eye,
  Camera,
  TrendingUp,
  Home,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Dados reais AVL-2026-001
const avaliacaoData = {
  protocol: 'AVL-2026-001',
  status: 'concluida',
  client: {
    name: 'Maria Santos Silva',
    email: 'maria.santos@gmail.com',
    phone: '(81) 99845-3421',
    cpf: '123.456.789-00',
  },
  property: {
    type: 'Apartamento',
    location: 'Boa Viagem',
    address: 'Av. Boa Viagem, 3456 - Apto 802',
    city: 'Recife',
    state: 'PE',
    cep: '51020-240',
    area: 85,
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    floor: 8,
    totalFloors: 20,
    buildYear: 2018,
    condition: 'Excelente',
  },
  features: ['Varanda gourmet', 'Armários planejados', 'Ar-condicionado', 'Piso porcelanato'],
  evaluation: {
    estimatedValue: 580000,
    minValue: 550000,
    maxValue: 610000,
    pricePerM2: 6824,
    method: 'Comparativo de Dados de Mercado',
    confidenceLevel: '85%',
    marketVariation: '+3.2%',
  },
  comparables: [
    { address: 'Av. Boa Viagem, 3200 - Apto 705', area: 82, price: 570000, similarity: 95 },
    { address: 'Av. Conselheiro Aguiar, 2890 - Apto 903', area: 88, price: 595000, similarity: 92 },
  ],
  timeline: {
    requestDate: '2026-02-10',
    visitDate: '2026-02-12',
    deliveryDate: '2026-02-14',
  },
  team: {
    evaluator: 'Iule Miranda',
    cnai: 'CNAI 53290',
    creci: 'CRECI 17933',
  },
  purpose: 'Venda',
}

export default function AvaliacaoDetalhesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50">
            <ArrowLeft size={20} className="mx-auto" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{avaliacaoData.protocol}</h1>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
                <Award size={14} />
                {avaliacaoData.team.cnai}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {avaliacaoData.client.name} • {avaliacaoData.property.type} - {avaliacaoData.property.location}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="h-10 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download size={16} />
            Baixar PDF
          </button>
          <button className="h-10 px-4 bg-accent-600 text-white rounded-lg hover:bg-accent-700 flex items-center gap-2">
            <Edit size={16} />
            Editar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Valor Avaliado</p>
          <p className="text-xl font-bold text-green-700">{formatPrice(avaliacaoData.evaluation.estimatedValue)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Preço/m²</p>
          <p className="text-xl font-bold text-blue-700">{formatPrice(avaliacaoData.evaluation.pricePerM2)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Variação</p>
          <p className="text-xl font-bold text-purple-700">{avaliacaoData.evaluation.marketVariation}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Confiança</p>
          <p className="text-xl font-bold text-accent-700">{avaliacaoData.evaluation.confidenceLevel}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Área</p>
          <p className="text-xl font-bold">{avaliacaoData.property.area}m²</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Prazo</p>
          <p className="text-xl font-bold">3 dias</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6">
          {['overview', 'comparables'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-2 text-sm font-medium border-b-2 ${activeTab === tab ? 'border-accent-600 text-accent-600' : 'border-transparent text-gray-600'
                }`}
            >
              {tab === 'overview' ? 'Visão Geral' : 'Comparáveis'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Imóvel */}
            <div className="bg-white rounded-2xl p-6 border">
              <h2 className="text-lg font-bold mb-4">Dados do Imóvel</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Endereço</p>
                  <p className="text-sm font-medium">{avaliacaoData.property.address}</p>
                  <p className="text-sm text-gray-600">{avaliacaoData.property.city}/{avaliacaoData.property.state} - CEP: {avaliacaoData.property.cep}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-4 border-t">
                  <div className="text-center">
                    <Bed size={24} className="mx-auto mb-2 text-blue-600" />
                    <p className="text-xl font-bold">{avaliacaoData.property.bedrooms}</p>
                    <p className="text-xs text-gray-600">Quartos</p>
                  </div>
                  <div className="text-center">
                    <Bath size={24} className="mx-auto mb-2 text-purple-600" />
                    <p className="text-xl font-bold">{avaliacaoData.property.bathrooms}</p>
                    <p className="text-xs text-gray-600">Banheiros</p>
                  </div>
                  <div className="text-center">
                    <Ruler size={24} className="mx-auto mb-2 text-green-600" />
                    <p className="text-xl font-bold">{avaliacaoData.property.area}m²</p>
                    <p className="text-xs text-gray-600">Área</p>
                  </div>
                  <div className="text-center">
                    <Car size={24} className="mx-auto mb-2 text-orange-600" />
                    <p className="text-xl font-bold">{avaliacaoData.property.parking}</p>
                    <p className="text-xs text-gray-600">Vagas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-2xl p-6 border">
              <h2 className="text-lg font-bold mb-4">Características</h2>
              <div className="flex flex-wrap gap-2">
                {avaliacaoData.features.map((f, i) => (
                  <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">{f}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cliente */}
            <div className="bg-white rounded-2xl p-6 border">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Cliente</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Nome</p>
                  <p className="font-medium">{avaliacaoData.client.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">E-mail</p>
                  <a href={`mailto:${avaliacaoData.client.email}`} className="text-sm text-accent-600">
                    {avaliacaoData.client.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Telefone</p>
                  <a href={`tel:${avaliacaoData.client.phone}`} className="text-sm text-accent-600">
                    {avaliacaoData.client.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Avaliador */}
            <div className="bg-white rounded-2xl p-6 border">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Responsável</h3>
              <p className="font-medium mb-3">{avaliacaoData.team.evaluator}</p>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs">{avaliacaoData.team.cnai}</span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{avaliacaoData.team.creci}</span>
              </div>
            </div>

            {/* Cronograma */}
            <div className="bg-white rounded-2xl p-6 border">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Cronograma</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Solicitação</p>
                  <p className="text-sm font-medium">{new Date(avaliacaoData.timeline.requestDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Vistoria</p>
                  <p className="text-sm font-medium">{new Date(avaliacaoData.timeline.visitDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Entrega</p>
                  <p className="text-sm font-medium">{new Date(avaliacaoData.timeline.deliveryDate).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>

            {/* Valores */}
            <div className="bg-white rounded-2xl p-6 border">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Intervalo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mínimo</span>
                  <span className="font-medium">{formatPrice(avaliacaoData.evaluation.minValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avaliado</span>
                  <span className="font-bold text-accent-700">{formatPrice(avaliacaoData.evaluation.estimatedValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Máximo</span>
                  <span className="font-medium">{formatPrice(avaliacaoData.evaluation.maxValue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comparables' && (
        <div className="space-y-4">
          {avaliacaoData.comparables.map((comp, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="font-bold">Comparável {i + 1}</h3>
                  <p className="text-sm text-gray-600">{comp.address}</p>
                </div>
                <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                  {comp.similarity}% similar
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Área</p>
                  <p className="text-sm font-medium">{comp.area}m²</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Valor</p>
                  <p className="text-sm font-medium">{formatPrice(comp.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Preço/m²</p>
                  <p className="text-sm font-medium">{formatPrice(comp.price / comp.area)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
