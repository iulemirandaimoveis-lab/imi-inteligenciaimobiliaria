'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Plus, Search, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react'

interface Simulation {
  id: string
  market: string
  propertyType: string
  value: number
  irr: number
  createdAt: string
  status: 'completed' | 'draft' | 'running'
}

const dmMono = { fontFamily: "'DM Mono', monospace" }

export default function SimulacoesPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/invest/simulations')
      .then(r => r.json())
      .then(data => { setSimulations(data.simulations || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = simulations.filter(s =>
    s.market.toLowerCase().includes(search.toLowerCase()) ||
    s.propertyType.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-editorial, serif)' }}>
            Simulacoes
          </h1>
          <p className="text-sm text-white/50 mt-1">Historico de simulacoes de investimento</p>
        </div>
        <a
          href="/backoffice/invest/simulacoes/nova"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-navy-900"
          style={{ background: '#C8A44A' }}
        >
          <Plus className="w-4 h-4" />
          Nova Simulacao
        </a>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por mercado, tipo..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <BarChart3 className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <h3 className="text-white/70 font-medium mb-1">Nenhuma simulacao encontrada</h3>
          <p className="text-white/40 text-sm mb-4">
            {search ? 'Tente outros termos de busca.' : 'Crie sua primeira simulacao de investimento para comecar.'}
          </p>
          {!search && (
            <a
              href="/backoffice/invest/simulacoes/nova"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-navy-900"
              style={{ background: '#C8A44A' }}
            >
              <Plus className="w-4 h-4" />
              Nova Simulacao
            </a>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Mercado</th>
                <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Tipo</th>
                <th className="text-right text-xs text-white/40 font-medium px-4 py-3">Valor</th>
                <th className="text-right text-xs text-white/40 font-medium px-4 py-3">TIR</th>
                <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Status</th>
                <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sim => (
                <tr
                  key={sim.id}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/backoffice/invest/simulacoes/${sim.id}`}
                >
                  <td className="px-4 py-3 text-sm text-white">{sim.market}</td>
                  <td className="px-4 py-3 text-sm text-white/70">{sim.propertyType}</td>
                  <td className="px-4 py-3 text-sm text-white text-right" style={dmMono}>
                    R$ {sim.value.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-sm ${sim.irr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                      style={dmMono}
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
                      {sim.status === 'completed' ? 'Concluida' : sim.status === 'running' ? 'Processando' : 'Rascunho'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40 flex items-center gap-1">
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
