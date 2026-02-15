'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  User,
  Award,
  Download,
  Mail,
  Phone,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  Home,
  Ruler,
  Bed,
  Bath,
  Car,
  TrendingUp,
  Camera,
  FileCheck,
  ClipboardList,
  BarChart3,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - DADOS COMPLETOS AVL-2026-001
const avaliacaoData = {
  id: 1,
  protocol: 'AVL-2026-001',

  // Cliente
  client: {
    name: 'Maria Santos Silva',
    email: 'maria.santos@gmail.com',
    phone: '(81) 99845-3421',
    cpf: '123.456.789-00',
    profession: 'Médica',
  },

  // Imóvel
  property: {
    type: 'Apartamento',
    subtype: 'Padrão Normal',
    location: 'Boa Viagem',
    address: 'Av. Boa Viagem, 3456',
    number: '802',
    complement: 'Torre A',
    neighborhood: 'Boa Viagem',
    city: 'Recife',
    state: 'PE',
    cep: '51020-123',

    // Características
    area: 85,
    privateArea: 85,
    commonArea: 0,
    bedrooms: 3,
    suites: 1,
    bathrooms: 2,
    parking: 2,
    floor: 8,
    totalFloors: 24,

    // Idade
    constructionYear: 2018,
    age: 8,
    condition: 'Bom estado de conservação',

    // Posição
    position: 'Nascente',
    view: 'Vista parcial para o mar',

    // Acabamento
    flooring: 'Porcelanato',
    walls: 'Pintura acrílica',
    ceiling: 'Gesso liso',
    windows: 'Vidro temperado com esquadrias de alumínio',
    doors: 'Madeira semi-oca',
  },

  // Condomínio
  building: {
    name: 'Edifício Atlântico Residence',
    units: 120,
    elevator: 2,
    facilities: [
      'Piscina adulto e infantil',
      'Academia equipada',
      'Salão de festas',
      'Playground',
      'Portaria 24h',
      'Circuito de câmeras',
    ],
  },

  // Valores
  valuation: {
    estimatedValue: 580000,
    minValue: 550000,
    maxValue: 610000,
    pricePerM2: 6823,
    method: 'Comparativo de Dados de Mercado',
    precision: 'Grau III - Precisão',
    confidence: '80%',
  },

  // Comparáveis (3 imóveis)
  comparables: [
    {
      address: 'Av. Boa Viagem, 3234 - Apto 705',
      area: 82,
      bedrooms: 3,
      parking: 2,
      price: 565000,
      pricePerM2: 6890,
      distance: '300m',
      date: '2026-01-15',
      adjustments: [
        { factor: 'Área', adjustment: '+3%' },
        { factor: 'Andar', adjustment: '-2%' },
      ],
      adjustedValue: 570000,
    },
    {
      address: 'Av. Conselheiro Aguiar, 4567 - Apto 901',
      area: 88,
      bedrooms: 3,
      parking: 2,
      price: 595000,
      pricePerM2: 6761,
      distance: '500m',
      date: '2026-01-20',
      adjustments: [
        { factor: 'Área', adjustment: '-3%' },
        { factor: 'Vista', adjustment: '+5%' },
      ],
      adjustedValue: 585000,
    },
    {
      address: 'Av. Boa Viagem, 3890 - Apto 604',
      area: 85,
      bedrooms: 3,
      parking: 2,
      price: 575000,
      pricePerM2: 6764,
      distance: '200m',
      date: '2026-02-05',
      adjustments: [
        { factor: 'Conservação', adjustment: '+2%' },
        { factor: 'Andar', adjustment: '-1%' },
      ],
      adjustedValue: 580000,
    },
  ],

  // Metodologia NBR 14653
  methodology: {
    norm: 'NBR 14653-2:2011',
    method: 'Método Comparativo Direto de Dados de Mercado',
    procedure: 'Tratamento por Fatores',
    samples: 3,
    fieldOfArbitration: 'Campo de arbítrio de ±15%',

    analysis: `A avaliação foi realizada através do Método Comparativo Direto de Dados de Mercado, 
    conforme a NBR 14653-2:2011. Foram coletados dados de 3 imóveis similares negociados 
    recentemente na região, com características comparáveis ao imóvel avaliando.
    
    Os dados foram tratados através do Método dos Fatores, aplicando-se ajustes para 
    características como área privativa, padrão de acabamento, posição no edifício, 
    vista e estado de conservação.
    
    O campo de arbítrio adotado foi de ±15%, resultando em valores entre R$ 550.000,00 
    e R$ 610.000,00, com valor central de R$ 580.000,00.`,
  },

  // Cronograma
  timeline: {
    requestDate: '2026-02-10T09:00:00',
    acceptanceDate: '2026-02-10T10:30:00',
    visitDate: '2026-02-12T14:00:00',
    reportDate: '2026-02-14T15:00:00',
    deliveryDate: '2026-02-14T17:00:00',
    validUntil: '2027-02-14',
  },

  // Avaliador
  evaluator: {
    name: 'Iule Miranda',
    creci: 'CRECI 17933',
    cnai: 'CNAI 53290',
    qualification: 'Engenheiro Civil e Avaliador de Imóveis',
    experience: '15 anos',
  },

  // Finalidade
  purpose: 'Venda',
  purposeDescription: 'Avaliação para definição de preço de venda',

  // Status
  status: 'concluida',
  priority: 'normal',

  // Observações
  observations: `Imóvel em bom estado de conservação, com acabamento padrão normal.
  Localização privilegiada próximo à praia (200m), com acesso facilitado a comércio e serviços.
  Condomínio bem administrado, com boa infraestrutura de lazer e segurança.
  Região valorizada, com alta liquidez no mercado imobiliário.`,

  // Fotos (placeholders)
  photos: [
    { id: 1, title: 'Fachada', description: 'Vista frontal do edifício' },
    { id: 2, title: 'Sala', description: 'Sala de estar com varanda' },
    { id: 3, title: 'Cozinha', description: 'Cozinha planejada' },
    { id: 4, title: 'Quarto Master', description: 'Suíte master' },
    { id: 5, title: 'Banheiro', description: 'Banheiro social' },
    { id: 6, title: 'Área de Lazer', description: 'Piscina e churrasqueira' },
  ],
}

export default function AvaliacaoDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const [activeTab, setActiveTab] = useState<'info' | 'laudo' | 'comparaveis' | 'fotos'>('info')

  // ⚠️ NÃO MODIFICAR FUNÇÃO getStatusConfig
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string; icon: any }> = {
      pendente: { label: 'Pendente', color: 'text-orange-700', bg: 'bg-orange-50', icon: Clock },
      em_andamento: { label: 'Em Andamento', color: 'text-blue-700', bg: 'bg-blue-50', icon: AlertCircle },
      concluida: { label: 'Concluída', color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle },
    }
    return configs[status] || configs.pendente
  }

  const statusConfig = getStatusConfig(avaliacaoData.status)
  const StatusIcon = statusConfig.icon

  // ⚠️ NÃO MODIFICAR FUNÇÃO formatPrice
  const formatPrice = (price: number) => {
    return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // ⚠️ NÃO MODIFICAR FUNÇÃO formatDate
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {avaliacaoData.protocol}
              </h1>
              <span className={`px-4 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.color}`}>
                <StatusIcon size={16} />
                {statusConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <User size={14} />
                {avaliacaoData.client.name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 size={14} />
                {avaliacaoData.property.type} • {avaliacaoData.property.location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Award size={14} className="text-amber-600" />
                {avaliacaoData.evaluator.cnai}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`/api/avaliacoes/${params.id}/pdf`, '_blank')}
            className="h-10 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
          <button
            onClick={() => router.push(`/backoffice/avaliacoes/${params.id}/editar`)}
            className="h-10 px-4 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors flex items-center gap-2"
          >
            <Edit size={16} />
            <span className="hidden sm:inline">Editar</span>
          </button>
        </div>
      </div>

      {/* ⚠️ NÃO MODIFICAR VALOR ESTIMADO */}
      <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-2xl p-8 border border-accent-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-accent-700 mb-2">Valor Estimado</p>
            <p className="text-4xl font-bold text-accent-900 mb-2">
              {formatPrice(avaliacaoData.valuation.estimatedValue)}
            </p>
            <p className="text-sm text-accent-700">
              Campo: {formatPrice(avaliacaoData.valuation.minValue)} - {formatPrice(avaliacaoData.valuation.maxValue)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-accent-700 mb-1">Valor/m²</p>
            <p className="text-2xl font-bold text-accent-900">
              {formatPrice(avaliacaoData.valuation.pricePerM2)}
            </p>
          </div>
        </div>
      </div>

      {/* ⚠️ NÃO MODIFICAR TABS */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { id: 'info', label: 'Informações', icon: ClipboardList },
            { id: 'laudo', label: 'Laudo Técnico', icon: FileCheck },
            { id: 'comparaveis', label: 'Comparáveis', icon: BarChart3 },
            { id: 'fotos', label: 'Fotos', icon: Camera },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab.id
                    ? 'border-accent-600 text-accent-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ⚠️ NÃO MODIFICAR TAB CONTENT - INFO */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados do Imóvel */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Dados do Imóvel</h2>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Tipo</p>
                  <p className="text-sm font-medium text-gray-900">{avaliacaoData.property.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Subtipo</p>
                  <p className="text-sm font-medium text-gray-900">{avaliacaoData.property.subtype}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Posição</p>
                  <p className="text-sm font-medium text-gray-900">{avaliacaoData.property.position}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Vista</p>
                  <p className="text-sm font-medium text-gray-900">{avaliacaoData.property.view}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Endereço Completo</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>{avaliacaoData.property.address}, {avaliacaoData.property.number}</p>
                  <p>{avaliacaoData.property.complement}</p>
                  <p>{avaliacaoData.property.neighborhood} - {avaliacaoData.property.city}/{avaliacaoData.property.state}</p>
                  <p>CEP: {avaliacaoData.property.cep}</p>
                </div>
              </div>
            </div>

            {/* Características */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Características</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Ruler size={24} className="text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{avaliacaoData.property.area}m²</p>
                  <p className="text-xs text-gray-600">Área Total</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Bed size={24} className="text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{avaliacaoData.property.bedrooms}</p>
                  <p className="text-xs text-gray-600">Quartos ({avaliacaoData.property.suites} suíte)</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Bath size={24} className="text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{avaliacaoData.property.bathrooms}</p>
                  <p className="text-xs text-gray-600">Banheiros</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Car size={24} className="text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{avaliacaoData.property.parking}</p>
                  <p className="text-xs text-gray-600">Vagas</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Andar</p>
                  <p className="text-sm font-medium text-gray-900">{avaliacaoData.property.floor}º de {avaliacaoData.property.totalFloors}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Idade</p>
                  <p className="text-sm font-medium text-gray-900">{avaliacaoData.property.age} anos ({avaliacaoData.property.constructionYear})</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Conservação</p>
                  <p className="text-sm font-medium text-gray-900">{avaliacaoData.property.condition}</p>
                </div>
              </div>
            </div>

            {/* Acabamento */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Acabamento</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Piso</p>
                  <p className="text-sm font-medium text-gray-900">{avaliacaoData.property.flooring}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Paredes</p>
                  <p className="text-sm font-medium text-gray-900">{avaliacaoData.property.walls}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Teto</p>
                  <p className="text-sm font-medium text-gray-900">{avaliacaoData.property.ceiling}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Janelas</p>
                  <p className="text-sm font-medium text-gray-900">{avaliacaoData.property.windows}</p>
                </div>
              </div>
            </div>

            {/* Condomínio */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Condomínio</h2>
              <p className="font-medium text-gray-900 mb-4">{avaliacaoData.building.name}</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Unidades</p>
                  <p className="text-sm font-medium text-gray-900">{avaliacaoData.building.units}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Elevadores</p>
                  <p className="text-sm font-medium text-gray-900">{avaliacaoData.building.elevator}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-2">Infraestrutura</p>
                <ul className="space-y-1">
                  {avaliacaoData.building.facilities.map((facility, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle size={14} className="text-green-600" />
                      {facility}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 */}
          <div className="space-y-6">
            {/* Cliente */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Cliente
              </h3>
              <p className="font-bold text-gray-900 mb-4">{avaliacaoData.client.name}</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">CPF</p>
                  <p className="text-sm text-gray-900">{avaliacaoData.client.cpf}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Profissão</p>
                  <p className="text-sm text-gray-900">{avaliacaoData.client.profession}</p>
                </div>
                <a
                  href={`mailto:${avaliacaoData.client.email}`}
                  className="flex items-center gap-2 text-sm text-accent-600 hover:text-accent-700 transition-colors"
                >
                  <Mail size={14} />
                  {avaliacaoData.client.email}
                </a>
                <a
                  href={`tel:${avaliacaoData.client.phone}`}
                  className="flex items-center gap-2 text-sm text-accent-600 hover:text-accent-700 transition-colors"
                >
                  <Phone size={14} />
                  {avaliacaoData.client.phone}
                </a>
              </div>
            </div>

            {/* Avaliador */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Avaliador
              </h3>
              <p className="font-bold text-gray-900 mb-2">{avaliacaoData.evaluator.name}</p>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">{avaliacaoData.evaluator.qualification}</p>
                <div className="flex items-center gap-2 text-amber-600">
                  <Award size={14} />
                  <span className="font-medium">{avaliacaoData.evaluator.creci}</span>
                </div>
                <div className="flex items-center gap-2 text-amber-600">
                  <Award size={14} />
                  <span className="font-medium">{avaliacaoData.evaluator.cnai}</span>
                </div>
                <p className="text-gray-600">{avaliacaoData.evaluator.experience} de experiência</p>
              </div>
            </div>

            {/* Cronograma */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Cronograma
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Solicitação</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(avaliacaoData.timeline.requestDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Vistoria</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(avaliacaoData.timeline.visitDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Entrega</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(avaliacaoData.timeline.deliveryDate)}
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-600 mb-1">Validade</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(avaliacaoData.timeline.validUntil).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Finalidade */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Finalidade
              </h3>
              <p className="text-sm font-medium text-gray-900 mb-2">{avaliacaoData.purpose}</p>
              <p className="text-sm text-gray-600">{avaliacaoData.purposeDescription}</p>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ NÃO MODIFICAR TAB CONTENT - LAUDO */}
      {activeTab === 'laudo' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Metodologia NBR 14653</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 pb-8 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-600 mb-1">Norma</p>
                <p className="text-sm font-medium text-gray-900">{avaliacaoData.methodology.norm}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Método</p>
                <p className="text-sm font-medium text-gray-900">{avaliacaoData.valuation.method}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Amostras</p>
                <p className="text-sm font-medium text-gray-900">{avaliacaoData.methodology.samples} comparáveis</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Precisão</p>
                <p className="text-sm font-medium text-gray-900">{avaliacaoData.valuation.precision}</p>
              </div>
            </div>

            <div className="prose prose-sm max-w-none">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Análise Técnica</h3>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {avaliacaoData.methodology.analysis}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Observações</h3>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {avaliacaoData.observations}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ NÃO MODIFICAR TAB CONTENT - COMPARÁVEIS */}
      {activeTab === 'comparaveis' && (
        <div className="space-y-6">
          {avaliacaoData.comparables.map((comp, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Comparável {index + 1}
                  </h3>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <MapPin size={14} />
                    {comp.address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 mb-1">Valor Ajustado</p>
                  <p className="text-2xl font-bold text-accent-700">
                    {formatPrice(comp.adjustedValue)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Área</p>
                  <p className="text-sm font-medium text-gray-900">{comp.area}m²</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Quartos</p>
                  <p className="text-sm font-medium text-gray-900">{comp.bedrooms}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Vagas</p>
                  <p className="text-sm font-medium text-gray-900">{comp.parking}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Distância</p>
                  <p className="text-sm font-medium text-gray-900">{comp.distance}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Valor Original</p>
                  <p className="text-sm font-medium text-gray-900">{formatPrice(comp.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Valor/m²</p>
                  <p className="text-sm font-medium text-gray-900">{formatPrice(comp.pricePerM2)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-2">Ajustes Aplicados</p>
                <div className="space-y-2">
                  {comp.adjustments.map((adj, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{adj.factor}</span>
                      <span className={`font-medium ${adj.adjustment.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {adj.adjustment}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ⚠️ NÃO MODIFICAR TAB CONTENT - FOTOS */}
      {activeTab === 'fotos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {avaliacaoData.photos.map((photo) => (
            <div key={photo.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon size={48} className="text-gray-400" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{photo.title}</h3>
                <p className="text-sm text-gray-600">{photo.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
