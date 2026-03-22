'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { User, Mail, Phone, Target, TrendingUp, Clock, MessageSquare, DollarSign, Globe } from 'lucide-react'
import { T } from '../../../../lib/theme'
import { PageIntelHeader } from '../../../../components/ui'

interface LeadDetail {
  id: string
  name: string
  email: string
  phone: string
  engagementScore: number
  readinessScore: number
  investProfile: string
  budget: number
  markets: string[]
  preferredTypes: string[]
  assignedBroker: string
  status: string
  createdAt: string
  notes: string
  interactions: { date: string; type: string; summary: string }[]
  simulations: { id: string; market: string; irr: number; value: number }[]
}

function ScoreRing({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  return (
    <div className="flex flex-col items-center">
      <svg width="70" height="70" className="-rotate-90">
        <circle cx="35" cy="35" r={radius} fill="none" stroke="var(--border-subtle)" strokeWidth="5" />
        <circle cx="35" cy="35" r={radius} fill="none" stroke={color} strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="text-center -mt-11">
        <div className="text-lg font-bold" style={{ color: T.text, fontFamily: T.font.data }}>{value}</div>
      </div>
      <div className="text-xs mt-3" style={{ color: T.textMuted }}>{label}</div>
    </div>
  )
}

export default function LeadDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/invest/leads/${id}`)
      .then(r => r.json())
      .then(data => { setLead(data); setLoading(false) })
      .catch(() => { toast.error('Erro ao carregar lead'); setLoading(false) })
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg animate-pulse" style={{ background: T.hover }} />
        ))}
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="rounded-lg p-12 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <User className="w-10 h-10 mx-auto mb-3" style={{ color: T.textDim }} />
        <h3 className="font-medium mb-1" style={{ color: T.textMuted }}>Lead nao encontrado</h3>
        <p className="text-sm mb-4" style={{ color: T.textMuted }}>ID: {id}</p>
        <Link href="/backoffice/invest/leads" className="text-sm hover:underline" style={{ color: T.accent }}>Voltar para lista</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageIntelHeader
        moduleLabel="INVEST · LEAD"
        title={lead.name}
        subtitle={lead.email}
        breadcrumbs={[
          { label: 'Invest', href: '/backoffice/invest' },
          { label: 'Leads', href: '/backoffice/invest/leads' },
          { label: lead.name },
        ]}
        actions={
          <span className="px-3 py-1 rounded-[6px] text-xs font-medium" style={{ background: T.activeBg, color: T.accent }}>
            {lead.status}
          </span>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Profile & Scoring */}
        <div className="space-y-4">
          {/* Scores */}
          <div className="rounded-lg p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: T.text }}>Scoring</h3>
            <div className="flex justify-around">
              <ScoreRing value={lead.engagementScore} label="Engajamento" color={T.accent} />
              <ScoreRing value={lead.readinessScore} label="Prontidao" color={lead.readinessScore >= 70 ? '#34d399' : '#fbbf24'} />
            </div>
          </div>

          {/* Investment Profile */}
          <div className="rounded-lg p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: T.text }}>Perfil de Investimento</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${T.borderSubtle}` }}>
                <span className="text-xs" style={{ color: T.textMuted }}>Perfil</span>
                <span className="text-sm" style={{ color: T.text }}>{lead.investProfile}</span>
              </div>
              <div className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${T.borderSubtle}` }}>
                <span className="text-xs" style={{ color: T.textMuted }}>Budget</span>
                <span className="text-sm" style={{ color: T.text, fontFamily: T.font.data }}>R$ {(lead.budget / 1000).toFixed(0)}k</span>
              </div>
              <div className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${T.borderSubtle}` }}>
                <span className="text-xs" style={{ color: T.textMuted }}>Mercados</span>
                <span className="text-sm" style={{ color: T.text }}>{lead.markets.join(', ')}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-xs" style={{ color: T.textMuted }}>Tipos</span>
                <span className="text-sm" style={{ color: T.text }}>{lead.preferredTypes.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Broker */}
          <div className="rounded-lg p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: T.text }}>Corretor Responsavel</h3>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: T.activeBg }}>
                <User className="w-4 h-4" style={{ color: T.accent }} />
              </div>
              <div>
                <div className="text-sm" style={{ color: T.text }}>{lead.assignedBroker || 'Nao atribuido'}</div>
                <div className="text-xs" style={{ color: T.textDim }}>Desde {new Date(lead.createdAt).toLocaleDateString('pt-BR')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Center + Right: Interactions & Simulations */}
        <div className="md:col-span-2 space-y-4">
          {/* Simulations */}
          {lead.simulations && lead.simulations.length > 0 && (
            <div className="rounded-lg p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: T.text }}>
                <TrendingUp className="w-4 h-4" style={{ color: T.accent }} />
                Simulacoes Vinculadas
              </h3>
              <div className="space-y-2">
                {lead.simulations.map(sim => (
                  <Link
                    key={sim.id}
                    href={`/backoffice/invest/simulacoes/${sim.id}`}
                    className="flex items-center justify-between p-3 rounded-lg transition-colors"
                    style={{ background: T.surface, border: `1px solid ${T.borderSubtle}` }}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4" style={{ color: T.textDim }} />
                      <span className="text-sm" style={{ color: T.text }}>{sim.market}</span>
                      <span className="text-xs" style={{ color: T.textMuted, fontFamily: T.font.data }}>R$ {(sim.value / 1000).toFixed(0)}k</span>
                    </div>
                    <span className={`text-sm font-bold ${sim.irr >= 0 ? 'text-emerald-400' : 'text-red-400'}`} style={{ fontFamily: T.font.data }}>
                      {sim.irr.toFixed(1)}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Interaction History */}
          <div className="rounded-lg p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: T.text }}>
              <MessageSquare className="w-4 h-4" style={{ color: T.accent }} />
              Historico de Interacoes
            </h3>
            {(!lead.interactions || lead.interactions.length === 0) ? (
              <div className="text-center py-8 text-sm" style={{ color: T.textDim }}>
                Nenhuma interacao registrada ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {lead.interactions.map((int, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: T.accent }} />
                      {i < lead.interactions.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: T.border }} />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium" style={{ color: T.textMuted }}>{int.type}</span>
                        <span className="text-xs flex items-center gap-1" style={{ color: T.textDim }}>
                          <Clock className="w-3 h-3" />
                          {new Date(int.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: T.textMuted }}>{int.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-lg p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: T.text }}>Notas</h3>
            <p className="text-sm" style={{ color: T.textMuted }}>{lead.notes || 'Sem notas registradas.'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
