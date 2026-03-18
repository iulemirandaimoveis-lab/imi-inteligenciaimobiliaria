'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, Target, FileText, BarChart3, Globe, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface IndexData {
  name: string
  value: number
  unit: string
  change: number
}

export default function InvestDashboard() {
  const [indices, setIndices] = useState<Record<string, IndexData>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/invest/indices')
      .then(r => r.json())
      .then(data => { setIndices(data.indices || {}); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const kpis = [
    { label: 'Simulações', value: '0', change: '+0%', icon: BarChart3, color: 'text-blue-400' },
    { label: 'Leads Invest', value: '0', change: '+0%', icon: Users, color: 'text-emerald-400' },
    { label: 'Conversão', value: '0%', change: '+0pp', icon: Target, color: 'text-amber-400' },
    { label: 'PDFs Gerados', value: '0', change: '+0%', icon: FileText, color: 'text-purple-400' },
    { label: 'Ticket Médio', value: 'R$ 0', change: '+0%', icon: TrendingUp, color: 'text-gold' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-editorial, serif)' }}>
            IMI Invest
          </h1>
          <p className="text-sm text-white/50 mt-1">Painel de Inteligência de Investimentos</p>
        </div>
        <button className="px-4 py-2 rounded-lg text-sm font-medium text-navy-900" style={{ background: 'var(--imi-gold-500, #C8A44A)' }}>
          Nova Simulação
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className="text-xs text-white/50">{kpi.label}</span>
            </div>
            <div className="text-xl font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>{kpi.value}</div>
            <div className="text-xs text-emerald-400 mt-1">{kpi.change}</div>
          </div>
        ))}
      </div>

      {/* Índices do Dia */}
      <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-gold" />
          <h2 className="text-sm font-semibold text-white">Índices Econômicos — Brasil</h2>
          <span className="text-xs text-white/30 ml-auto">Fonte: BCB</span>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {Object.entries(indices).map(([key, idx]) => (
              <div key={key} className="rounded-lg p-3 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-xs text-white/40 mb-1">{idx.name}</div>
                <div className="text-lg font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {idx.unit === 'R$' ? `R$ ${idx.value.toFixed(2)}` : `${idx.value.toFixed(2)}${idx.unit}`}
                </div>
                <div className={`text-xs flex items-center gap-0.5 mt-0.5 ${idx.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {idx.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(idx.change).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leads Quentes */}
      <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          Leads Quentes (Score &gt; 70)
        </h2>
        <div className="text-center py-8 text-white/30 text-sm">
          Nenhum lead de investimento ainda. O simulador público gerará leads automaticamente.
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Simulações', href: '/backoffice/invest/simulacoes', icon: BarChart3 },
          { label: 'Leads Invest', href: '/backoffice/invest/leads', icon: Users },
          { label: 'Comparador', href: '/backoffice/invest/comparador', icon: Globe },
          { label: 'Índices', href: '/backoffice/invest/indices', icon: TrendingUp },
        ].map(item => (
          <a key={item.label} href={item.href} className="rounded-xl p-4 border border-white/10 hover:border-gold/30 transition-all group" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <item.icon className="w-5 h-5 text-white/40 group-hover:text-gold transition-colors mb-2" />
            <div className="text-sm text-white/70 group-hover:text-white transition-colors">{item.label}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
