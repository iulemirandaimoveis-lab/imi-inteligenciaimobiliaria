'use client'

import { useState, useEffect } from 'react'
import { Users, Search, Plus, TrendingUp, Target, Phone, Mail, ArrowUpRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { T, inputStyle } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader, KPICard, EmptyState } from '../../../components/ui'

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
      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: T.borderSubtle }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs" style={{ color: T.textMuted, fontFamily: T.font.data }}>{value}</span>
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
      .catch(() => { toast.error('Erro ao carregar dados'); setLoading(false) })
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
      <PageIntelHeader
        moduleLabel="INVEST · LEADS"
        title="Leads Invest"
        subtitle="Leads qualificados para investimento imobiliário"
        actions={
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-sm font-medium"
            style={{ background: T.accent, color: T.textInverse }}
          >
            <Plus className="w-4 h-4" />
            Novo Lead
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Leads" value={leads.length.toString()} icon={<Users size={16} />} accent="info" size="sm" />
        <KPICard
          label="Score Médio"
          value={leads.length ? (leads.reduce((s, l) => s + l.engagementScore, 0) / leads.length).toFixed(0) : '0'}
          icon={<Target size={16} />}
          accent="warning"
          size="sm"
        />
        <KPICard label="Qualificados" value={leads.filter(l => l.readinessScore >= 70).length.toString()} icon={<TrendingUp size={16} />} accent="success" size="sm" />
        <KPICard label="Convertidos" value={leads.filter(l => l.status === 'converted').length.toString()} icon={<ArrowUpRight size={16} />} accent="gold" size="sm" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.textDim }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, email..."
          style={{ ...inputStyle, paddingLeft: 40 }}
        />
      </div>

      {/* List */}
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
            icon={<Users size={24} />}
            title="Nenhum lead de investimento"
            description={
              search
                ? 'Nenhum lead encontrado com esses termos.'
                : 'Leads serão gerados automaticamente pelo simulador público ou podem ser importados manualmente.'
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(lead => (
            <Link
              key={lead.id}
              href={`/backoffice/invest/leads/${lead.id}`}
              className="block rounded-lg p-4 transition-all"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium" style={{ color: T.text }}>{lead.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-[6px] ${statusLabel[lead.status]?.cls || 'bg-white/10 text-white/50'}`}>
                      {statusLabel[lead.status]?.label || lead.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs" style={{ color: T.textDim }}>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
                    <span>Perfil: {lead.investProfile}</span>
                    <span style={{ fontFamily: T.font.data }}>R$ {(lead.budget / 1000).toFixed(0)}k</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs mb-1" style={{ color: T.textDim }}>Engajamento</div>
                    <ScoreBar value={lead.engagementScore} color={T.accent} />
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: T.textDim }}>Prontidão</div>
                    <ScoreBar value={lead.readinessScore} color={lead.readinessScore >= 70 ? T.success : T.warning} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
