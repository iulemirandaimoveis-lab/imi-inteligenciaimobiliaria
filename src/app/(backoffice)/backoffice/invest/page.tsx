'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, Target, FileText, BarChart3, Globe, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader, KPICard } from '../../components/ui'

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
      .catch(() => { toast.error('Erro ao carregar dados'); setLoading(false) })
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageIntelHeader
        moduleLabel="INVEST"
        title="IMI Invest"
        subtitle="Painel de Inteligência de Investimentos"
        actions={
          <button
            className="px-4 py-2 rounded-[6px] text-sm font-medium"
            style={{ background: T.accent, color: T.textInverse }}
          >
            Nova Simulação
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard label="Simulações" value="0" icon={<BarChart3 size={16} />} accent="info" size="sm" />
        <KPICard label="Leads Invest" value="0" icon={<Users size={16} />} accent="success" size="sm" />
        <KPICard label="Conversão" value="0%" icon={<Target size={16} />} accent="warning" size="sm" />
        <KPICard label="PDFs Gerados" value="0" icon={<FileText size={16} />} accent="navy" size="sm" />
        <KPICard label="Ticket Médio" value="R$ 0" icon={<TrendingUp size={16} />} accent="gold" size="sm" />
      </div>

      {/* Índices do Dia */}
      <div
        className="rounded-lg p-5"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4" style={{ color: T.accent }} />
          <h2 className="text-sm font-semibold" style={{ color: T.text }}>Índices Econômicos — Brasil</h2>
          <span className="text-xs ml-auto" style={{ color: T.textDim }}>Fonte: BCB</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin" size={24} style={{ color: T.textMuted }} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {Object.entries(indices).map(([key, idx]) => (
              <div
                key={key}
                className="rounded-lg p-3"
                style={{ background: T.surface, border: `1px solid ${T.borderSubtle}` }}
              >
                <div className="text-xs mb-1" style={{ color: T.textMuted }}>{idx.name}</div>
                <div className="text-lg font-bold" style={{ color: T.text, fontFamily: T.font.data }}>
                  {idx.unit === 'R$' ? `R$ ${idx.value.toFixed(2)}` : `${idx.value.toFixed(2)}${idx.unit}`}
                </div>
                <div
                  className="text-xs flex items-center gap-0.5 mt-0.5"
                  style={{ color: idx.change >= 0 ? T.success : T.error }}
                >
                  {idx.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(idx.change).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leads Quentes */}
      <div
        className="rounded-lg p-5"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: T.text }}>
          <Target className="w-4 h-4" style={{ color: T.warning }} />
          Leads Quentes (Score &gt; 70)
        </h2>
        <div className="text-center py-8 text-sm" style={{ color: T.textDim }}>
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
          <Link
            key={item.label}
            href={item.href}
            className="rounded-lg p-4 transition-all group"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <item.icon className="w-5 h-5 mb-2" style={{ color: T.textDim }} />
            <div className="text-sm" style={{ color: T.textMuted }}>{item.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
