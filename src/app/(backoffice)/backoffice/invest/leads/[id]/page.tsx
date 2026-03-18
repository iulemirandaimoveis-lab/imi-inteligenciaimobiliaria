'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, User, Mail, Phone, Target, TrendingUp, Clock, MessageSquare, DollarSign, Globe } from 'lucide-react'

const dmMono = { fontFamily: "'DM Mono', monospace" }

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
        <circle cx="35" cy="35" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
        <circle cx="35" cy="35" r={radius} fill="none" stroke={color} strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="text-center -mt-11">
        <div className="text-lg font-bold text-white" style={dmMono}>{value}</div>
      </div>
      <div className="text-xs text-white/40 mt-3">{label}</div>
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
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="rounded-xl border border-white/10 p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <User className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <h3 className="text-white/70 font-medium mb-1">Lead nao encontrado</h3>
        <p className="text-white/40 text-sm mb-4">ID: {id}</p>
        <a href="/backoffice/invest/leads" className="text-gold text-sm hover:underline">Voltar para lista</a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <a href="/backoffice/invest/leads" className="p-2 rounded-lg border border-white/10 hover:border-gold/30 transition-colors">
          <ArrowLeft className="w-4 h-4 text-white/50" />
        </a>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{lead.name}</h1>
          <div className="flex items-center gap-4 text-xs text-white/40 mt-0.5">
            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold">
          {lead.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Profile & Scoring */}
        <div className="space-y-4">
          {/* Scores */}
          <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h3 className="text-sm font-semibold text-white mb-4">Scoring</h3>
            <div className="flex justify-around">
              <ScoreRing value={lead.engagementScore} label="Engajamento" color="#C8A44A" />
              <ScoreRing value={lead.readinessScore} label="Prontidao" color={lead.readinessScore >= 70 ? '#34d399' : '#fbbf24'} />
            </div>
          </div>

          {/* Investment Profile */}
          <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h3 className="text-sm font-semibold text-white mb-3">Perfil de Investimento</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-xs text-white/40">Perfil</span>
                <span className="text-sm text-white">{lead.investProfile}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-xs text-white/40">Budget</span>
                <span className="text-sm text-white" style={dmMono}>R$ {(lead.budget / 1000).toFixed(0)}k</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-xs text-white/40">Mercados</span>
                <span className="text-sm text-white">{lead.markets.join(', ')}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-xs text-white/40">Tipos</span>
                <span className="text-sm text-white">{lead.preferredTypes.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Broker */}
          <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h3 className="text-sm font-semibold text-white mb-2">Corretor Responsavel</h3>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                <User className="w-4 h-4 text-gold" />
              </div>
              <div>
                <div className="text-sm text-white">{lead.assignedBroker || 'Nao atribuido'}</div>
                <div className="text-xs text-white/30">Desde {new Date(lead.createdAt).toLocaleDateString('pt-BR')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Center + Right: Interactions & Simulations */}
        <div className="md:col-span-2 space-y-4">
          {/* Simulations */}
          {lead.simulations && lead.simulations.length > 0 && (
            <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gold" />
                Simulacoes Vinculadas
              </h3>
              <div className="space-y-2">
                {lead.simulations.map(sim => (
                  <a
                    key={sim.id}
                    href={`/backoffice/invest/simulacoes/${sim.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-white/5 hover:border-gold/20 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-white/30" />
                      <span className="text-sm text-white">{sim.market}</span>
                      <span className="text-xs text-white/40" style={dmMono}>R$ {(sim.value / 1000).toFixed(0)}k</span>
                    </div>
                    <span className={`text-sm font-bold ${sim.irr >= 0 ? 'text-emerald-400' : 'text-red-400'}`} style={dmMono}>
                      {sim.irr.toFixed(1)}%
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Interaction History */}
          <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gold" />
              Historico de Interacoes
            </h3>
            {(!lead.interactions || lead.interactions.length === 0) ? (
              <div className="text-center py-8 text-white/30 text-sm">
                Nenhuma interacao registrada ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {lead.interactions.map((int, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-gold mt-1.5" />
                      {i < lead.interactions.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-white/70">{int.type}</span>
                        <span className="text-xs text-white/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(int.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-xs text-white/50">{int.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h3 className="text-sm font-semibold text-white mb-2">Notas</h3>
            <p className="text-sm text-white/50">{lead.notes || 'Sem notas registradas.'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
