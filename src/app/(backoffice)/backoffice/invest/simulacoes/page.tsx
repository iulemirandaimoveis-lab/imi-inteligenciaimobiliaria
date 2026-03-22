'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Plus, Search, ArrowUpRight, ArrowDownRight, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { T, inputStyle } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader, EmptyState } from '../../../components/ui'

interface Simulation {
  id: string
  market: string
  propertyType: string
  value: number
  irr: number
  createdAt: string
  status: 'completed' | 'draft' | 'running'
}

export default function SimulacoesPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/invest/simulations')
      .then(r => r.json())
      .then(data => { setSimulations(data.simulations || []); setLoading(false) })
      .catch(() => { toast.error('Erro ao carregar dados'); setLoading(false) })
  }, [])

  const filtered = simulations.filter(s =>
    s.market.toLowerCase().includes(search.toLowerCase()) ||
    s.propertyType.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageIntelHeader
        moduleLabel="INVEST · SIMULAÇÕES"
        title="Simulações"
        subtitle="Histórico de simulações de investimento"
        actions={
          <Link
            href="/backoffice/invest/simulacoes/nova"
            className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-sm font-medium"
            style={{ background: T.accent, color: T.textInverse }}
          >
            <Plus className="w-4 h-4" />
            Nova Simulação
          </Link>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.textDim }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por mercado, tipo..."
          style={{ ...inputStyle, paddingLeft: 40 }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin" size={28} style={{ color: T.textMuted }} />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-lg"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <EmptyState
            icon={<BarChart3 size={24} />}
            title="Nenhuma simulação encontrada"
            description={search ? 'Tente outros termos de busca.' : 'Crie sua primeira simulação de investimento para começar.'}
            action={!search ? (
              <Link
                href="/backoffice/invest/simulacoes/nova"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] text-sm font-medium"
                style={{ background: T.accent, color: T.textInverse }}
              >
                <Plus className="w-4 h-4" />
                Nova Simulação
              </Link>
            ) : undefined}
          />
        </div>
      ) : (
        <div
          className="rounded-lg overflow-hidden overflow-x-auto"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <table className="w-full min-w-[600px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: T.textDim }}>Mercado</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: T.textDim }}>Tipo</th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: T.textDim }}>Valor</th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: T.textDim }}>TIR</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: T.textDim }}>Status</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: T.textDim }}>Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sim => (
                <tr
                  key={sim.id}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: `1px solid ${T.borderSubtle}` }}
                  onClick={() => window.location.href = `/backoffice/invest/simulacoes/${sim.id}`}
                  onMouseEnter={e => { e.currentTarget.style.background = T.hover }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td className="px-4 py-3 text-sm" style={{ color: T.text }}>{sim.market}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: T.textMuted }}>{sim.propertyType}</td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: T.text, fontFamily: T.font.data }}>
                    R$ {sim.value.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="text-sm"
                      style={{ color: sim.irr >= 0 ? T.success : T.error, fontFamily: T.font.data }}
                    >
                      {sim.irr >= 0 ? <ArrowUpRight className="w-3 h-3 inline mr-0.5" /> : <ArrowDownRight className="w-3 h-3 inline mr-0.5" />}
                      {sim.irr.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-[6px] ${
                      sim.status === 'completed' ? 'bg-emerald-400/10 text-emerald-400' :
                      sim.status === 'running' ? 'bg-amber-400/10 text-amber-400' :
                      'bg-white/10 text-white/50'
                    }`}>
                      {sim.status === 'completed' ? 'Concluída' : sim.status === 'running' ? 'Processando' : 'Rascunho'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs flex items-center gap-1" style={{ color: T.textDim }}>
                    <Clock className="w-3 h-3" />
                    {new Date(sim.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
