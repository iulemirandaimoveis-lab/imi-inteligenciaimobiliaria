'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, TrendingUp, DollarSign, Building, BarChart3, Scale, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const dmMono = { fontFamily: "'DM Mono', monospace" }

type Tab = 'overview' | 'cashflow' | 'financing' | 'scenarios' | 'benchmarks' | 'fiscal'

interface SimulationDetail {
  id: string
  market: string
  city: string
  propertyType: string
  purchasePrice: number
  area: number
  irr: number
  roi: number
  capRate: number
  paybackYears: number
  npv: number
  monthlyNet: number
  rentalIncome: number
  appreciation: number
  horizon: number
  financingRate: number
  downPayment: number
  createdAt: string
}

const tabs: { key: Tab; label: string; icon: typeof TrendingUp }[] = [
  { key: 'overview', label: 'Visao Geral', icon: BarChart3 },
  { key: 'cashflow', label: 'Fluxo de Caixa', icon: DollarSign },
  { key: 'financing', label: 'Financiamento', icon: Building },
  { key: 'scenarios', label: 'Cenarios', icon: TrendingUp },
  { key: 'benchmarks', label: 'Benchmarks', icon: Scale },
  { key: 'fiscal', label: 'Fiscal', icon: FileText },
]

export default function SimulacaoDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [tab, setTab] = useState<Tab>('overview')
  const [sim, setSim] = useState<SimulationDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/invest/simulations/${id}`)
      .then(r => r.json())
      .then(data => { setSim(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!sim) {
    return (
      <div className="rounded-lg border border-white/10 p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <BarChart3 className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <h3 className="text-white/70 font-medium mb-1">Simulacao nao encontrada</h3>
        <p className="text-white/40 text-sm mb-4">ID: {id}</p>
        <a href="/backoffice/invest/simulacoes" className="text-gold text-sm hover:underline">Voltar para lista</a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <a href="/backoffice/invest/simulacoes" className="p-2 rounded-lg border border-white/10 hover:border-gold/30 transition-colors">
          <ArrowLeft className="w-4 h-4 text-white/50" />
        </a>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{sim.propertyType} — {sim.city}</h1>
          <p className="text-xs text-white/40">{sim.market} | Criada em {new Date(sim.createdAt).toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/40">TIR</div>
          <div className={`text-2xl font-bold ${sim.irr >= 0 ? 'text-emerald-400' : 'text-red-400'}`} style={dmMono}>
            {sim.irr.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Valor', value: `R$ ${(sim.purchasePrice / 1000).toFixed(0)}k`, positive: true },
          { label: 'ROI', value: `${sim.roi.toFixed(1)}%`, positive: sim.roi > 0 },
          { label: 'Cap Rate', value: `${sim.capRate.toFixed(1)}%`, positive: true },
          { label: 'Payback', value: `${sim.paybackYears.toFixed(1)}a`, positive: sim.paybackYears < sim.horizon },
          { label: 'VPL', value: `R$ ${(sim.npv / 1000).toFixed(0)}k`, positive: sim.npv > 0 },
          { label: 'Renda Liq', value: `R$ ${sim.monthlyNet.toLocaleString('pt-BR')}`, positive: sim.monthlyNet > 0 },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-lg p-3 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xs text-white/40 mb-1">{kpi.label}</div>
            <div className={`text-sm font-bold ${kpi.positive ? 'text-white' : 'text-red-400'}`} style={dmMono}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key ? 'border-gold text-gold' : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-lg border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
        {tab === 'overview' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Resumo do Investimento</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Mercado', value: sim.market },
                { label: 'Cidade', value: sim.city },
                { label: 'Tipo', value: sim.propertyType },
                { label: 'Area', value: `${sim.area} m2` },
                { label: 'Preco', value: `R$ ${sim.purchasePrice.toLocaleString('pt-BR')}` },
                { label: 'Aluguel/mes', value: `R$ ${sim.rentalIncome.toLocaleString('pt-BR')}` },
                { label: 'Valorizacao', value: `${sim.appreciation}% a.a.` },
                { label: 'Horizonte', value: `${sim.horizon} anos` },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-xs text-white/40">{row.label}</span>
                  <span className="text-sm text-white" style={dmMono}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'cashflow' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Projecao de Fluxo de Caixa</h3>
            <div className="space-y-2">
              {Array.from({ length: Math.min(sim.horizon, 10) }, (_, i) => {
                const year = i + 1
                const income = sim.rentalIncome * 12 * Math.pow(1.03, i)
                const appreciation = sim.purchasePrice * (Math.pow(1 + sim.appreciation / 100, year) - Math.pow(1 + sim.appreciation / 100, year - 1))
                const net = income + appreciation
                const maxNet = sim.rentalIncome * 12 * Math.pow(1.03, sim.horizon) + sim.purchasePrice * sim.appreciation / 100 * 2
                const pct = (net / maxNet) * 100
                return (
                  <div key={year} className="flex items-center gap-3">
                    <span className="text-xs text-white/40 w-12" style={dmMono}>Ano {year}</span>
                    <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: 'linear-gradient(90deg, #3D6FFF, #34d399)' }} />
                    </div>
                    <span className="text-xs text-white/60 w-24 text-right" style={dmMono}>
                      R$ {(net / 1000).toFixed(0)}k
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'financing' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Simulacao de Financiamento</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Valor Financiado', value: `R$ ${((sim.purchasePrice * (100 - sim.downPayment)) / 100000).toFixed(0)}k` },
                { label: 'Entrada', value: `R$ ${((sim.purchasePrice * sim.downPayment) / 100000).toFixed(0)}k (${sim.downPayment}%)` },
                { label: 'Taxa', value: `${sim.financingRate}% a.a.` },
                { label: 'Prazo', value: '360 meses (30 anos)' },
                { label: 'Parcela Inicial', value: `R$ ${((sim.purchasePrice * (100 - sim.downPayment) / 100) * (sim.financingRate / 1200) / (1 - Math.pow(1 + sim.financingRate / 1200, -360))).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` },
                { label: 'CET Estimado', value: `${(sim.financingRate + 0.8).toFixed(1)}% a.a.` },
              ].map(row => (
                <div key={row.label} className="rounded-lg p-3 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-xs text-white/40 mb-1">{row.label}</div>
                  <div className="text-sm font-medium text-white" style={dmMono}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'scenarios' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Analise de Cenarios</h3>
            {[
              { label: 'Otimista', irr: sim.irr * 1.3, color: '#34d399', desc: 'Valorizacao acima da media + ocupacao 100%' },
              { label: 'Base', irr: sim.irr, color: '#3D6FFF', desc: 'Cenario projetado com premissas atuais' },
              { label: 'Pessimista', irr: sim.irr * 0.5, color: '#fbbf24', desc: 'Vacancia 20% + valorizacao abaixo do IPCA' },
              { label: 'Estresse', irr: sim.irr * 0.1, color: '#f87171', desc: 'Queda de precos + vacancia alta + juros altos' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-4 p-3 rounded-lg border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-2 h-10 rounded-full" style={{ background: s.color }} />
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">{s.label}</div>
                  <div className="text-xs text-white/40">{s.desc}</div>
                </div>
                <div className={`text-lg font-bold`} style={{ ...dmMono, color: s.color }}>
                  {s.irr.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'benchmarks' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Comparacao com Benchmarks</h3>
            {[
              { label: 'CDI', value: 13.25, color: '#60a5fa' },
              { label: 'IPCA + 6%', value: 10.5, color: '#a78bfa' },
              { label: 'Poupanca', value: 7.5, color: '#94a3b8' },
              { label: 'FIIs (IFIX)', value: 11.2, color: '#34d399' },
              { label: 'Esta Simulacao', value: sim.irr, color: '#3D6FFF' },
            ].sort((a, b) => b.value - a.value).map(b => {
              const max = Math.max(sim.irr, 15)
              const pct = (b.value / max) * 100
              return (
                <div key={b.label} className="flex items-center gap-3">
                  <span className={`text-xs w-28 ${b.label === 'Esta Simulacao' ? 'text-gold font-semibold' : 'text-white/50'}`}>{b.label}</span>
                  <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: b.color }} />
                  </div>
                  <span className={`text-xs w-14 text-right ${b.label === 'Esta Simulacao' ? 'text-gold font-bold' : 'text-white/60'}`} style={dmMono}>
                    {b.value.toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'fiscal' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Impacto Fiscal</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'ITBI (compra)', value: `R$ ${(sim.purchasePrice * 0.03 / 1000).toFixed(0)}k`, desc: '3% sobre valor venal' },
                { label: 'IR Aluguel/mes', value: `R$ ${(sim.rentalIncome * 0.275).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, desc: 'Aliquota 27.5% (faixa mais alta)' },
                { label: 'IPTU Anual', value: 'Conforme municipio', desc: 'Varia por cidade e zoneamento' },
                { label: 'Ganho Capital', value: '15-22.5%', desc: 'Progressivo sobre lucro na venda' },
                { label: 'Depreciacao', value: `R$ ${(sim.purchasePrice * 0.04 / 12 / 1000).toFixed(1)}k/mes`, desc: '4% a.a. sobre construcao' },
                { label: 'Economia Anual', value: `R$ ${(sim.purchasePrice * 0.04 * 0.275 / 1000).toFixed(0)}k`, desc: 'Beneficio fiscal depreciacao' },
              ].map(row => (
                <div key={row.label} className="rounded-lg p-3 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-xs text-white/40 mb-1">{row.label}</div>
                  <div className="text-sm font-medium text-white mb-0.5" style={dmMono}>{row.value}</div>
                  <div className="text-[10px] text-white/30">{row.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
