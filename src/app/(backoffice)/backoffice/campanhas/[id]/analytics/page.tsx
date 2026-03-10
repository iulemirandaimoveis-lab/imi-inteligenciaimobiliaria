'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  MousePointerClick,
  Eye,
  Target,
  Calendar,
  Download,
  Share2,
  Edit,
  BarChart3,
  Activity,
  Zap,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { T } from '../../../../lib/theme'

interface Campaign {
  id: string
  name: string
  status: string
  channel: string | null
  platform: string | null
  budget: number | null
  daily_budget: number | null
  start_date: string | null
  end_date: string | null
  leads: number | null
  cost_per_lead: number | null
  objective: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
}

export default function CampanhaAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [timeRange, setTimeRange] = useState('7d')
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/campanhas?id=${id}`)
      .then(r => r.json())
      .then(d => { if (d && d.id) setCampaign(d) })
      .catch(() => { toast.error('Erro ao carregar campanha') })
      .finally(() => setLoading(false))
  }, [id])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value)

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('pt-BR').format(value)

  const calcDaysRemaining = () => {
    if (!campaign?.end_date) return null
    const end = new Date(campaign.end_date)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  const budgetUsed = campaign?.budget && campaign.budget > 0 ? 100 : 0 // can't compute without spent
  const leads = campaign?.leads ?? 0
  const cpl = campaign?.cost_per_lead ?? 0
  const channelLabel = campaign?.channel || campaign?.platform || '—'
  const daysRemaining = calcDaysRemaining()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin" size={22} style={{ color: T.accent }} />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p style={{ color: T.textMuted }}>Campanha não encontrada.</p>
        <button onClick={() => router.back()} className="text-sm underline" style={{ color: T.accent }}>Voltar</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ border: `1px solid ${T.border}` }}
          >
            <ArrowLeft size={20} style={{ color: T.text }} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: T.text }}>{campaign.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 rounded-lg text-sm font-medium"
                style={campaign.status === 'active'
                  ? { background: 'rgba(16,185,129,0.12)', color: '#10B981' }
                  : { background: T.elevated, color: T.textMuted }}>
                ● {campaign.status === 'active' ? 'Ativa' : campaign.status === 'paused' ? 'Pausada' : campaign.status || 'Rascunho'}
              </span>
              <span className="text-sm" style={{ color: T.textMuted }}>{channelLabel}</span>
              {campaign.start_date && campaign.end_date && (
                <span className="text-sm" style={{ color: T.textMuted }}>
                  {new Date(campaign.start_date).toLocaleDateString('pt-BR')} — {new Date(campaign.end_date).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="h-10 px-4 rounded-xl font-medium flex items-center gap-2"
            style={{ border: `1px solid ${T.border}`, color: T.text }}
          >
            <Download size={18} />
            Exportar
          </button>
          <button
            onClick={() => router.push(`/backoffice/campanhas/${id}/editar`)}
            className="h-10 px-4 rounded-xl font-medium flex items-center gap-2 text-white"
            style={{ background: T.accent }}
          >
            <Edit size={18} />
            Editar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orçamento */}
        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
              <DollarSign size={20} style={{ color: '#3B82F6' }} />
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: T.textMuted }}>Orçamento Total</p>
            </div>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: T.text }}>
            {campaign.budget ? formatCurrency(campaign.budget) : '—'}
          </p>
          {campaign.daily_budget && (
            <p className="text-sm" style={{ color: T.textMuted }}>
              Diário: {formatCurrency(campaign.daily_budget)}
            </p>
          )}
        </div>

        {/* Leads */}
        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <Users size={20} style={{ color: '#10B981' }} />
            </div>
            <TrendingUp size={16} style={{ color: '#10B981' }} />
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: T.text }}>{formatNumber(leads)}</p>
          <p className="text-sm" style={{ color: T.textMuted }}>
            Leads Gerados{cpl > 0 ? ` • CPL ${formatCurrency(cpl)}` : ''}
          </p>
        </div>

        {/* Prazo */}
        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)' }}>
              <Calendar size={20} style={{ color: '#8B5CF6' }} />
            </div>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: T.text }}>
            {daysRemaining !== null ? daysRemaining : '—'}
          </p>
          <p className="text-sm" style={{ color: T.textMuted }}>
            {daysRemaining !== null ? 'Dias Restantes' : 'Sem prazo definido'}
          </p>
        </div>

        {/* Objetivo */}
        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.12)' }}>
              <Target size={20} style={{ color: '#F97316' }} />
            </div>
          </div>
          <p className="text-sm font-bold mb-1 line-clamp-2" style={{ color: T.text }}>
            {campaign.objective || 'Objetivo não definido'}
          </p>
          <p className="text-xs" style={{ color: T.textMuted }}>Objetivo da Campanha</p>
        </div>
      </div>

      {/* Meta Ads Notice */}
      <div className="rounded-2xl p-5 flex items-start gap-4"
        style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <Zap size={20} style={{ color: '#3B82F6', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="text-sm font-bold mb-1" style={{ color: T.text }}>Métricas de performance em tempo real</p>
          <p className="text-sm" style={{ color: T.textMuted }}>
            Impressões, CTR, CPC e dados diários são sincronizados via <strong>Meta Ads API</strong>.
            Configure o token de acesso em <a href="/backoffice/integracoes" className="underline" style={{ color: '#3B82F6' }}>Integrações → Meta Ads</a> para visualizar.
          </p>
        </div>
      </div>

      {/* UTM Tracking */}
      {(campaign.utm_source || campaign.utm_campaign) && (
        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <h3 className="text-base font-bold mb-4" style={{ color: T.text }}>Rastreamento UTM</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {campaign.utm_source && (
              <div className="p-4 rounded-xl" style={{ background: T.elevated }}>
                <p className="text-xs mb-1" style={{ color: T.textMuted }}>utm_source</p>
                <p className="text-sm font-bold font-mono" style={{ color: T.text }}>{campaign.utm_source}</p>
              </div>
            )}
            {campaign.utm_campaign && (
              <div className="p-4 rounded-xl" style={{ background: T.elevated }}>
                <p className="text-xs mb-1" style={{ color: T.textMuted }}>utm_campaign</p>
                <p className="text-sm font-bold font-mono" style={{ color: T.text }}>{campaign.utm_campaign}</p>
              </div>
            )}
            {campaign.utm_medium && (
              <div className="p-4 rounded-xl" style={{ background: T.elevated }}>
                <p className="text-xs mb-1" style={{ color: T.textMuted }}>utm_medium</p>
                <p className="text-sm font-bold font-mono" style={{ color: T.text }}>{campaign.utm_medium}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
