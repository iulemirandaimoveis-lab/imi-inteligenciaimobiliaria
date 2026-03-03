'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Award,
  AlertTriangle,
  Instagram,
  Facebook,
  Globe,
  Mail,
  MessageSquare,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Dados ROI mockados
const roiData = {
  // Campanhas por canal
  porCanal: [
    { platform: 'Instagram', budget: 5000, spent: 3200, revenue: 7800000, roi: 243750, conversions: 12, icon: Instagram },
    { platform: 'Google', budget: 3000, spent: 2100, revenue: 3400000, roi: 161905, conversions: 8, icon: Globe },
    { platform: 'Facebook', budget: 2000, spent: 800, revenue: 1440000, roi: 180000, conversions: 3, icon: Facebook },
    { platform: 'Email', budget: 800, spent: 800, revenue: 2125000, roi: 265625, conversions: 5, icon: Mail },
    { platform: 'WhatsApp', budget: 1200, spent: 1200, revenue: 2940000, roi: 245000, conversions: 7, icon: MessageSquare },
  ],

  // Top performers
  topPerformers: [
    { name: 'Email Marketing Piedade', roi: 265625, revenue: 2125000, spent: 800 },
    { name: 'WhatsApp Business Pina', roi: 245000, revenue: 2940000, spent: 1200 },
    { name: 'Lançamento Reserva Atlantis', roi: 243750, revenue: 7800000, spent: 3200 },
  ],

  // Bottom performers
  bottomPerformers: [
    { name: 'Google Ads Boa Viagem', roi: 161905, revenue: 3400000, spent: 2100 },
    { name: 'Facebook Villa Jardins', roi: 180000, revenue: 1440000, spent: 800 },
  ],

  // Evolução mensal
  evolucaoMensal: [
    { month: 'Set/25', invested: 8500, revenue: 12500000, roi: 147058 },
    { month: 'Out/25', invested: 9200, revenue: 14200000, roi: 154348 },
    { month: 'Nov/25', invested: 10100, revenue: 15800000, roi: 156436 },
    { month: 'Dez/25', invested: 11800, revenue: 19400000, roi: 164407 },
    { month: 'Jan/26', invested: 10500, revenue: 16900000, roi: 160952 },
    { month: 'Fev/26', invested: 8100, revenue: 17705000, roi: 218580 },
  ],
}

export default function CampanhasROIPage() {
  const router = useRouter()
  const [periodoFilter, setPeriodoFilter] = useState('mes')

  const totalInvested = roiData.porCanal.reduce((acc, c) => acc + c.spent, 0)
  const totalRevenue = roiData.porCanal.reduce((acc, c) => acc + c.revenue, 0)
  const avgROI = ((totalRevenue - totalInvested) / totalInvested) * 100

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `R$ ${(price / 1000000).toFixed(1)}M`
    if (price >= 1000) return `R$ ${(price / 1000).toFixed(1)}k`
    return `R$ ${price.toFixed(0)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ROI das Campanhas</h1>
          <p className="text-sm text-gray-600 mt-1">
            Análise de retorno sobre investimento
          </p>
        </div>
        <select
          value={periodoFilter}
          onChange={(e) => setPeriodoFilter(e.target.value)}
          className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
        >
          <option value="semana">Última Semana</option>
          <option value="mes">Último Mês</option>
          <option value="trimestre">Trimestre</option>
          <option value="ano">Ano</option>
        </select>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <DollarSign size={32} className="mb-4" />
          <p className="text-3xl font-bold mb-1">{avgROI.toFixed(0)}%</p>
          <p className="text-sm text-green-100">ROI Médio</p>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Investido</p>
          <p className="text-2xl font-bold text-orange-700">{formatPrice(totalInvested)}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Receita</p>
          <p className="text-2xl font-bold text-green-700">{formatPrice(totalRevenue)}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Lucro</p>
          <p className="text-2xl font-bold text-green-700">{formatPrice(totalRevenue - totalInvested)}</p>
        </div>
      </div>

      {/* ROI por Canal */}
      <div className="bg-white rounded-2xl p-6 border">
        <h2 className="text-lg font-bold text-gray-900 mb-6">ROI por Canal</h2>
        <div className="space-y-4">
          {roiData.porCanal.map((canal, idx) => {
            const PlatformIcon = canal.icon
            const maxROI = Math.max(...roiData.porCanal.map(c => c.roi))
            const barWidth = (canal.roi / maxROI) * 100

            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                      <PlatformIcon size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{canal.platform}</p>
                      <p className="text-xs text-gray-600">
                        {formatPrice(canal.spent)} investido • {canal.conversions} conversões
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-700">{canal.roi.toLocaleString('pt-BR')}%</p>
                    <p className="text-xs text-gray-600">{formatPrice(canal.revenue)} receita</p>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top & Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-2xl p-6 border">
          <div className="flex items-center gap-2 mb-6">
            <Award size={20} className="text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">Top 3 Performers</h2>
          </div>
          <div className="space-y-4">
            {roiData.topPerformers.map((camp, idx) => (
              <div key={idx} className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{camp.name}</p>
                  </div>
                  <p className="text-lg font-bold text-green-700">{camp.roi.toLocaleString('pt-BR')}%</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>Investido: {formatPrice(camp.spent)}</span>
                  <span>•</span>
                  <span>Receita: {formatPrice(camp.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Performers */}
        <div className="bg-white rounded-2xl p-6 border">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle size={20} className="text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">Requerem Atenção</h2>
          </div>
          <div className="space-y-4">
            {roiData.bottomPerformers.map((camp, idx) => (
              <div key={idx} className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-gray-900 text-sm">{camp.name}</p>
                  <p className="text-lg font-bold text-orange-700">{camp.roi.toLocaleString('pt-BR')}%</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>Investido: {formatPrice(camp.spent)}</span>
                  <span>•</span>
                  <span>Receita: {formatPrice(camp.revenue)}</span>
                </div>
                <p className="text-xs text-orange-700 mt-2">
                  💡 Considerar otimização ou realocação de orçamento
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evolução Mensal */}
      <div className="bg-white rounded-2xl p-6 border">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Evolução Mensal do ROI</h2>
        <div className="space-y-4">
          {roiData.evolucaoMensal.map((month, idx) => {
            const maxROI = Math.max(...roiData.evolucaoMensal.map(m => m.roi))
            const barWidth = (month.roi / maxROI) * 100
            const prevMonth = idx > 0 ? roiData.evolucaoMensal[idx - 1] : null
            const trend = prevMonth ? month.roi > prevMonth.roi : true

            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900 w-20">{month.month}</span>
                    <div className="flex items-center gap-2">
                      {trend ? (
                        <TrendingUp size={14} className="text-green-600" />
                      ) : (
                        <TrendingDown size={14} className="text-red-600" />
                      )}
                      <span className={`text-xs font-medium ${trend ? 'text-green-600' : 'text-red-600'}`}>
                        {month.roi.toLocaleString('pt-BR')}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-600">
                    <span>{formatPrice(month.invested)} → {formatPrice(month.revenue)}</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${trend ? 'bg-green-500' : 'bg-orange-500'
                      }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-sm font-bold text-blue-900 mb-3">💡 Insights Automáticos</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Email Marketing tem o melhor ROI (265,625%) com menor investimento</li>
          <li>• Instagram gerou maior receita absoluta (R$ 7.8M) com ROI de 243,750%</li>
          <li>• ROI cresceu 32% em fevereiro vs janeiro</li>
          <li>• Google Ads tem ROI 40% abaixo da média - considerar otimização</li>
        </ul>
      </div>
    </div>
  )
}
