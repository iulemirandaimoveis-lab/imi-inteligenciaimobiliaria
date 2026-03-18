'use client'

import { useState, useEffect } from 'react'
import { Users, Search, Plus, TrendingUp, Target, Phone, Mail, ArrowUpRight } from 'lucide-react'

const dmMono = { fontFamily: "'DM Mono', monospace" }

interface InvestLead {
  id: string
  name: string
  email: string
  phone: string
  engagementScore: number
  readinessScore: number
  investProfile: string
  budget: number
  markets: string[]
  lastInteraction: string
  assignedBroker: string
  status: 'new' | 'contacted' | 'qualified' | 'negotiating' | 'converted'
}

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-white/60" style={dmMono}>{value}</span>
    </div>
  )
}

export default function InvestLeadsPage() {
  const [leads, setLeads] = useState<InvestLead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/invest/leads')
      .then(r => r.json())
      .then(data => { setLeads(data.leads || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase())
  )

  const statusLabel: Record<string, { label: string; cls: string }> = {
    new: { label: 'Novo', cls: 'bg-blue-400/10 text-blue-400' },
    contacted: { label: 'Contactado', cls: 'bg-amber-400/10 text-amber-400' },
    qualified: { label: 'Qualificado', cls: 'bg-emerald-400/10 text-emerald-400' },
    negotiating: { label: 'Negociando', cls: 'bg-purple-400/10 text-purple-400' },
    converted: { label: 'Convertido', cls: 'bg-gold/10 text-gold' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-editorial, serif)' }}>
            Leads Invest
          </h1>
          <p className="text-sm text-white/50 mt-1">Leads qualificados para investimento imobiliario</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-navy-900" style={{ background: '#C8A44A' }}>
          <Plus className="w-4 h-4" />
          Novo Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: leads.length.toString(), icon: Users, color: 'text-blue-400' },
          { label: 'Score Medio', value: leads.length ? (leads.reduce((s, l) => s + l.engagementScore, 0) / leads.length).toFixed(0) : '0', icon: Target, color: 'text-amber-400' },
          { label: 'Qualificados', value: leads.filter(l => l.readinessScore >= 70).length.toString(), icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Convertidos', value: leads.filter(l => l.status === 'converted').length.toString(), icon: ArrowUpRight, color: 'text-gold' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-white/50">{s.label}</span>
            </div>
            <div className="text-xl font-bold text-white" style={dmMono}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <h3 className="text-white/70 font-medium mb-1">Nenhum lead de investimento</h3>
          <p className="text-white/40 text-sm">
            {search
              ? 'Nenhum lead encontrado com esses termos.'
              : 'Leads serao gerados automaticamente pelo simulador publico ou podem ser importados manualmente.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(lead => (
            <a
              key={lead.id}
              href={`/backoffice/invest/leads/${lead.id}`}
              className="block rounded-xl border border-white/10 hover:border-gold/30 p-4 transition-all"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium text-white">{lead.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-[6px] ${statusLabel[lead.status]?.cls || 'bg-white/10 text-white/50'}`}>
                      {statusLabel[lead.status]?.label || lead.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
                    <span>Perfil: {lead.investProfile}</span>
                    <span style={dmMono}>R$ {(lead.budget / 1000).toFixed(0)}k</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs text-white/30 mb-1">Engajamento</div>
                    <ScoreBar value={lead.engagementScore} color="#C8A44A" />
                  </div>
                  <div>
                    <div className="text-xs text-white/30 mb-1">Prontidao</div>
                    <ScoreBar value={lead.readinessScore} color={lead.readinessScore >= 70 ? '#34d399' : '#fbbf24'} />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
