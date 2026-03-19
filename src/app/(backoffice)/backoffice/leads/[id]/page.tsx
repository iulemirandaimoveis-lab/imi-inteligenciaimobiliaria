'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Phone, Mail, MapPin, Building2, DollarSign,
  Calendar, Edit, MessageSquare, FileText,
  Clock, TrendingUp, Eye, MousePointerClick,
  AlertCircle, Send, Globe, MoreVertical, Sparkles, Loader2,
} from 'lucide-react'
import { useLead } from '@/hooks/use-leads-complete'
import { StatusBadge } from '@/app/(backoffice)/components/ui/StatusBadge'
import { AIInsightCard } from '@/app/(backoffice)/components/ui/AIInsightCard'
import { SectionHeader } from '@/app/(backoffice)/components/ui/SectionHeader'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'
import { T } from '@/app/(backoffice)/lib/theme'
import { toast } from 'sonner'

// ── Helpers ────────────────────────────────────────────────────────
function formatCapital(capital: number | null): string {
  if (!capital) return '—'
  if (capital >= 1_000_000) return `R$ ${(capital / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (capital >= 1_000) return `R$ ${(capital / 1_000).toFixed(0)}k`
  return `R$ ${capital.toLocaleString('pt-BR')}`
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function getTimeAgo(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor(diff / 60000)
  if (d > 0) return `${d}d atrás`
  if (h > 0) return `${h}h atrás`
  if (m > 0) return `${m}min atrás`
  return 'agora'
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Avatar gradient based on status ──────────────────────────────
const AVATAR_GRADIENTS: Record<string, string> = {
  hot:       'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)',
  warm:      'linear-gradient(135deg, #78350f 0%, #d97706 100%)',
  cold:      'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)',
  qualified: 'linear-gradient(135deg, #14532d 0%, #15803d 100%)',
  proposal:  'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)',
  won:       'linear-gradient(135deg, #14532d 0%, #166534 100%)',
  lost:      'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
}

// ── Timeline events ────────────────────────────────────────────────
const TIMELINE_ICONS: Record<string, React.ElementType> = {
  view: Eye,
  click: MousePointerClick,
  contact: MessageSquare,
  capture: Globe,
  calendar: Calendar,
}

// ── Skeleton ───────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto pb-24 space-y-4 animate-pulse">
      <div style={{ height: 36, background: 'var(--bg-surface)', borderRadius: 6, width: '40%', opacity: 0.5 }} />
      <div style={{ height: 180, background: 'var(--bg-surface)', borderRadius: 6, opacity: 0.4 }} />
      <div style={{ height: 80, background: 'var(--bg-surface)', borderRadius: 6, opacity: 0.35 }} />
      <div style={{ height: 120, background: 'var(--bg-surface)', borderRadius: 6, opacity: 0.3 }} />
      {[0,1,2].map(i => (
        <div key={i} style={{ height: 80, background: 'var(--bg-surface)', borderRadius: 6, opacity: 0.25 - i * 0.05 }} />
      ))}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────
export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string | undefined

  const { lead, isLoading, isError, revalidate } = useLead(id ?? null)
  const [activeTab, setActiveTab] = useState<'timeline' | 'history' | 'notes' | 'matches'>('timeline')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [matches, setMatches] = useState<Record<string, any>[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [note, setNote] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, any> | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [localStatus, setLocalStatus] = useState<string | null>(null)

  // Fire Claude analysis once lead loads
  useEffect(() => {
    if (!lead) return
    setAiLoading(true)
    fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'lead', data: lead }),
    })
      .then(r => r.json())
      .then(res => { if (res.analysis) setAiAnalysis(res.analysis) })
      .catch(() => {})
      .finally(() => setAiLoading(false))
  }, [lead?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <LoadingSkeleton />

  if (isError || !lead) {
    return (
      <div className="max-w-2xl mx-auto pb-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6"
          style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
        >
          ← Leads
        </button>
        <div
          className="rounded-lg text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '48px 24px' }}
        >
          <AlertCircle size={28} style={{ color: 'var(--text-secondary)', opacity: 0.3, margin: '0 auto 12px' }} />
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Lead não encontrado</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>O lead solicitado não existe ou foi removido.</p>
        </div>
      </div>
    )
  }

  const initials     = getInitials(lead.name)
  const leadStatus   = localStatus ?? lead.status ?? 'cold'
  const avatarBg     = AVATAR_GRADIENTS[leadStatus] ?? AVATAR_GRADIENTS.cold
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const devName      = (lead as any).development?.name ?? null
  const aiIntentPct  = lead.score ?? 0

  async function changeStatus(newStatus: string) {
    setLocalStatus(newStatus)
    setStatusMenuOpen(false)
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar')
      toast.success('Status atualizado')
      revalidate()
    } catch {
      setLocalStatus(null)
      toast.error('Erro ao atualizar status')
    }
  }

  // AI insight — real Claude analysis with heuristic fallback
  const aiInsight = aiAnalysis?.insight ?? (
    lead.score >= 85
      ? `${lead.name.split(' ')[0]} demonstra intenção de compra muito alta (score ${lead.score}). Abordagem proativa com proposta personalizada é a ação recomendada.`
      : lead.score >= 70
      ? `Score moderado (${lead.score}). Qualificar interesse específico antes de apresentar proposta.${devName ? ` Interesse em ${devName}.` : ''}`
      : `Lead em aquecimento (score ${lead.score}). Nutrição com conteúdo e follow-up consistente recomendados.`
  )

  const nextAction = aiAnalysis?.nextAction ?? (
    lead.status === 'hot' || lead.status === 'qualified'
      ? 'Apresentar proposta personalizada'
      : lead.status === 'warm' || lead.status === 'contacted'
      ? 'Agendar visita ou apresentação'
      : lead.status === 'proposal'
      ? 'Follow-up na proposta enviada'
      : 'Qualificar necessidade do lead'
  )

  // Build timeline
  const timeline = [
    lead.last_interaction_at && {
      icon: MessageSquare,
      label: 'Último Contato Registrado',
      detail: devName ? `Empreendimento: ${devName}` : lead.interest || '',
      time: getTimeAgo(lead.last_interaction_at),
      accent: true,
      trending: true,
    },
    {
      icon: lead.source?.toLowerCase().includes('whatsapp') ? MessageSquare
           : lead.source?.toLowerCase().includes('google') ? Globe
           : Globe,
      label: `Capturado via ${lead.source || 'Orgânico'}`,
      detail: lead.interest ? `Interesse: ${lead.interest}` : 'Lead sem interesse definido',
      time: getTimeAgo(lead.created_at),
      accent: !lead.last_interaction_at,
      trending: false,
    },
  ].filter(Boolean) as Array<{
    icon: React.ElementType; label: string; detail: string;
    time: string; accent: boolean; trending: boolean;
  }>

  return (
    <div className="max-w-2xl mx-auto pb-24 space-y-4">

      <PageIntelHeader
        moduleLabel="LEADS"
        title={lead.name}
        subtitle={[lead.source || 'Direto', lead.interest].filter(Boolean).join(' · ')}
        breadcrumbs={[
          { label: 'Leads', href: '/backoffice/leads' },
          { label: lead.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/backoffice/propostas/nova?lead_id=${id}`)}
              className="bo-btn bo-btn-sm"
              style={{ background: 'rgba(184,148,58,0.12)', color: 'var(--imi-gold-500)', borderColor: 'rgba(184,148,58,0.25)' }}
              title="Criar Proposta"
            >
              <FileText size={13} />
              <span className="hidden sm:inline">Proposta</span>
            </button>
            <button
              onClick={() => router.push(`/backoffice/leads/${id}/editar`)}
              style={{
                width: '36px', height: '36px', borderRadius: '6px',
                background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Edit size={14} style={{ color: 'var(--text-secondary)' }} />
            </button>
            {/* Quick Status Dropdown */}
            <div className="relative">
            <button
              onClick={() => setStatusMenuOpen(p => !p)}
              style={{
                width: '36px', height: '36px', borderRadius: '6px',
                background: statusMenuOpen ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <MoreVertical size={14} style={{ color: 'var(--text-secondary)' }} />
            </button>

            {statusMenuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setStatusMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.14 }}
                  style={{
                    position: 'absolute', right: 0, top: '40px', zIndex: 50,
                    background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                    borderRadius: '6px', padding: '8px', width: '180px',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  {/* Temperature */}
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px' }}>
                    Temperatura
                  </p>
                  {[
                    { key: 'hot',  emoji: '🔥', label: 'Hot',  color: 'var(--s-hot)' },
                    { key: 'warm', emoji: '🌡',  label: 'Warm', color: 'var(--s-warm)' },
                    { key: 'cold', emoji: '❄️', label: 'Cold', color: 'var(--s-cold)' },
                  ].map(s => (
                    <button
                      key={s.key}
                      onClick={() => changeStatus(s.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        width: '100%', padding: '8px', borderRadius: '6px',
                        background: leadStatus === s.key ? 'var(--bg-hover)' : 'transparent',
                        border: 'none', cursor: 'pointer', fontSize: '13px',
                        fontWeight: leadStatus === s.key ? 700 : 500,
                        color: leadStatus === s.key ? s.color : 'var(--text-primary)',
                        textAlign: 'left',
                      }}
                    >
                      <span>{s.emoji}</span>
                      <span>{s.label}</span>
                      {leadStatus === s.key && <span style={{ marginLeft: 'auto', fontSize: '11px', color: s.color }}>✓</span>}
                    </button>
                  ))}

                  <div style={{ height: '1px', background: 'var(--border-default)', margin: '8px 0' }} />

                  {/* Funil */}
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px' }}>
                    Funil de Vendas
                  </p>
                  {[
                    { key: 'qualified', label: 'Qualificado' },
                    { key: 'proposal',  label: 'Em Proposta' },
                    { key: 'won',       label: 'Ganho' },
                    { key: 'lost',      label: 'Perdido' },
                  ].map(s => (
                    <button
                      key={s.key}
                      onClick={() => changeStatus(s.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        width: '100%', padding: '8px', borderRadius: '6px',
                        background: leadStatus === s.key ? 'var(--bg-hover)' : 'transparent',
                        border: 'none', cursor: 'pointer', fontSize: '13px',
                        fontWeight: leadStatus === s.key ? 700 : 500,
                        color: leadStatus === s.key ? 'var(--bo-accent)' : 'var(--text-primary)',
                        textAlign: 'left',
                      }}
                    >
                      <span>{s.label}</span>
                      {leadStatus === s.key && <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--bo-accent)' }}>✓</span>}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
            </div>
          </div>
        }
      />

      {/* ── Hero Profile Card ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '6px',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background accent glow */}
        <div style={{
          position: 'absolute', top: '-30px', right: '-20px',
          width: '100px', height: '100px', borderRadius: '50%',
          background: 'rgba(184,148,58,0.10)', filter: 'blur(30px)', pointerEvents: 'none',
        }} />

        {/* Label */}
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--imi-gold-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', position: 'relative' }}>
          LEAD PROFILE
        </div>

        {/* Avatar + Info + AI Score */}
        <div className="flex items-start gap-4 mb-5" style={{ position: 'relative' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '6px',
            background: avatarBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.92)',
            flexShrink: 0, letterSpacing: '-0.02em',
          }}>
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '8px' }}>
              {lead.name}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={leadStatus} size="sm" glow dot />
              {lead.source && (
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  via {lead.source}
                </span>
              )}
            </div>
          </div>

          {/* AI Intent Score */}
          <div
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'var(--bg-elevated)',
              border: '1px solid rgba(184,148,58,0.25)',
              borderRadius: '6px', padding: '12px',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--imi-gold-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              AI Intent
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
              {aiIntentPct}%
            </span>
          </div>
        </div>

        {/* Contact actions */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <a
            href={`tel:${lead.phone}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              height: '44px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
              color: 'var(--text-primary)', background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)', textDecoration: 'none',
            }}
          >
            <Phone size={14} style={{ color: 'var(--imi-gold-500)' }} /> Ligar
          </a>
          <a
            href={`https://wa.me/55${(lead.phone ?? '').replace(/\D/g, '')}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              height: '44px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
              color: 'var(--text-inverse)', background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              border: 'none', textDecoration: 'none',
            }}
          >
            <MessageSquare size={14} /> WhatsApp
          </a>
          <button
            onClick={() => router.push(`/backoffice/hoje?lead_id=${id}&action=agendar`)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              height: '44px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
              color: 'var(--text-primary)', background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)', cursor: 'pointer',
            }}
          >
            <Calendar size={14} style={{ color: 'var(--imi-gold-500)' }} /> Agendar
          </button>
        </div>

        {/* Contact info grid */}
        <div className="space-y-2">
          {lead.email && (
            <div className="flex items-center gap-2">
              <Mail size={12} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lead.email}
              </span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2">
              <Phone size={12} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{lead.phone}</span>
            </div>
          )}
          {devName && (
            <div className="flex items-center gap-2">
              <Building2 size={12} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{devName}</span>
            </div>
          )}
          {lead.interest && (
            <div className="flex items-center gap-2">
              <MapPin size={12} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{lead.interest}</span>
            </div>
          )}
          {lead.capital && (
            <div className="flex items-center gap-2">
              <DollarSign size={12} style={{ color: 'var(--imi-ai-gold)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--imi-ai-gold)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {formatCapital(lead.capital)}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {lead.tags.map((tag: string, i: number) => (
              <span
                key={i}
                style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'var(--text-secondary)', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)', padding: '2px 8px', borderRadius: '6px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta: created + last contact */}
        <div
          className="flex items-center gap-3 mt-4 pt-3"
          style={{ borderTop: '1px solid var(--border-default)', fontSize: '11px', color: 'var(--text-secondary)' }}
        >
          <span className="flex items-center gap-1">
            <Calendar size={9} />
            Criado {getTimeAgo(lead.created_at)}
          </span>
          {lead.last_interaction_at && (
            <>
              <span style={{ color: 'var(--border-default)', fontSize: '12px' }}>·</span>
              <span className="flex items-center gap-1">
                <Clock size={9} />
                Último contato {getTimeAgo(lead.last_interaction_at)}
              </span>
            </>
          )}
        </div>
      </motion.div>

      {/* ── AI Insight Card ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.10 }}
      >
        <AIInsightCard
          title={aiLoading ? 'Analisando com IA...' : 'AI Insight Strategy'}
          variant="gold"
          nextStep={aiLoading ? undefined : nextAction}
        >
          {aiLoading ? (
            <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              <Loader2 size={12} className="animate-spin" />
              Consultando Claude AI...
            </div>
          ) : (
            <>
              <span style={{ color: 'var(--text-primary)', fontSize: '12px', lineHeight: 1.65 }}>
                {aiInsight}
              </span>
              {aiAnalysis && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {aiAnalysis.urgency && (
                    <span style={{
                      fontSize: '11px', fontWeight: 700,
                      color: aiAnalysis.urgency === 'alta' ? 'var(--error)' : aiAnalysis.urgency === 'media' ? 'var(--warning)' : 'var(--text-secondary)',
                      background: aiAnalysis.urgency === 'alta' ? 'var(--error-bg)' : aiAnalysis.urgency === 'media' ? 'var(--warning-bg)' : 'var(--bg-elevated)',
                      padding: '2px 8px', borderRadius: '6px',
                    }}>
                      Urgência {aiAnalysis.urgency}
                    </span>
                  )}
                  {aiAnalysis.approach && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--imi-gold-500)', background: 'var(--info-bg)', padding: '2px 8px', borderRadius: '6px' }}>
                      via {aiAnalysis.approach}
                    </span>
                  )}
                  {aiAnalysis.estimatedTimeline && (
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '2px 8px', background: 'var(--bg-subtle)', borderRadius: '6px' }}>
                      ⏱ {aiAnalysis.estimatedTimeline}
                    </span>
                  )}
                  {aiAnalysis.keyRisk && (
                    <span style={{ fontSize: '11px', color: 'var(--warning)', padding: '2px 8px', background: 'var(--warning-bg)', borderRadius: '6px' }}>
                      ⚠ {aiAnalysis.keyRisk}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </AIInsightCard>
      </motion.div>

      {/* ── Behavioral Timeline Tabs ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '6px', overflow: 'hidden' }}
      >
        {/* Tab header */}
        <div className="flex" style={{ borderBottom: '1px solid var(--border-default)' }}>
          {[
            { key: 'timeline', label: 'Timeline' },
            { key: 'history',  label: 'Histórico' },
            { key: 'notes',    label: 'Notas' },
            { key: 'matches',  label: 'Imóveis' },
          ].map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isActive ? 'var(--imi-gold-500)' : 'var(--text-secondary)',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? 'var(--imi-gold-500)' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all var(--dur-2) var(--ease)',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div style={{ padding: '16px' }}>

          {/* ── Timeline ── */}
          {activeTab === 'timeline' && (
            <div>
              <SectionHeader
                title="Eventos do Lead"
                badge={`${timeline.length} evento${timeline.length !== 1 ? 's' : ''}`}
              />

              {timeline.length > 0 ? (
                <div style={{ position: 'relative' }}>
                  {/* Vertical line */}
                  <div style={{
                    position: 'absolute', left: '19px', top: '20px', bottom: '20px',
                    width: '2px', background: 'var(--border-default)',
                  }} />

                  <div className="space-y-4">
                    {timeline.map((event, i) => (
                      <div key={i} className="flex gap-3">
                        {/* Icon node */}
                        <div style={{
                          position: 'relative', zIndex: 1,
                          width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                          background: event.accent
                            ? 'rgba(184,148,58,0.10)'
                            : 'rgba(255,255,255,0.04)',
                          border: `2px solid ${event.accent ? 'rgba(184,148,58,0.25)' : 'var(--border-default)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <event.icon
                            size={14}
                            style={{ color: event.accent ? 'var(--imi-gold-500)' : 'var(--text-secondary)' }}
                          />
                        </div>

                        {/* Card */}
                        <div
                          style={{
                            flex: 1,
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '6px',
                            padding: '12px',
                            opacity: i > 0 ? 0.75 : 1,
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {event.label}
                            </h4>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flexShrink: 0 }}>
                              {event.time}
                            </span>
                          </div>
                          {event.detail && (
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                              {event.detail}
                            </p>
                          )}
                          {event.trending && (
                            <div className="flex items-center gap-1" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--s-done)' }}>
                              <TrendingUp size={10} />
                              Evento mais recente
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <Eye size={26} style={{ color: 'var(--text-secondary)', opacity: 0.2, margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Nenhum evento registrado</p>
                </div>
              )}
            </div>
          )}

          {/* ── History ── */}
          {activeTab === 'history' && (
            <div>
              <SectionHeader
                title="Histórico de Contatos"
                action={{ label: '+ Registrar', onClick: () => {} }}
              />
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <Clock size={26} style={{ color: 'var(--text-secondary)', opacity: 0.2, margin: '0 auto 12px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Sem contatos registrados</p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Use o botão acima para registrar</p>
              </div>
            </div>
          )}

          {/* ── Notes ── */}
          {activeTab === 'notes' && (
            <div>
              <SectionHeader title="Observações" />
              {lead.message ? (
                <div
                  style={{
                    background: 'var(--bg-subtle)', border: '1px solid var(--border-default)',
                    borderRadius: '6px', padding: '12px', marginBottom: '12px',
                  }}
                >
                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    {lead.message}
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    background: 'var(--bg-subtle)', border: '1px solid var(--border-default)',
                    borderRadius: '6px', padding: '20px', textAlign: 'center', marginBottom: '12px',
                  }}
                >
                  <FileText size={20} style={{ color: 'var(--text-secondary)', opacity: 0.2, margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Nenhuma mensagem do lead</p>
                </div>
              )}
              {/* Note input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Adicionar observação..."
                  style={{
                    flex: 1, height: '44px', padding: '0 16px',
                    fontSize: '13px', background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)', borderRadius: '6px',
                    color: 'var(--text-primary)', outline: 'none',
                  }}
                />
                <button
                  disabled={!note.trim()}
                  onClick={async () => {
                    if (!note.trim() || !id) return
                    try {
                      await fetch('/api/leads/interactions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lead_id: id, interaction_type: 'note', notes: note.trim() }),
                      })
                      setNote('')
                    } catch { /* silent */ }
                  }}
                  style={{
                    width: '44px', height: '44px', borderRadius: '6px',
                    background: note.trim() ? 'var(--bo-accent)' : 'var(--bg-elevated)',
                    border: 'none', cursor: note.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: note.trim() ? 1 : 0.4,
                    transition: 'all var(--dur-2) var(--ease)',
                  }}
                >
                  <Send size={14} style={{ color: note.trim() ? 'var(--text-inverse)' : 'var(--text-secondary)' }} />
                </button>
              </div>
            </div>
          )}

          {/* ── Matches ── */}
          {activeTab === 'matches' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <SectionHeader title="Imóveis Compatíveis" badge={matches.length > 0 ? `${matches.length} resultado${matches.length !== 1 ? 's' : ''}` : undefined} />
                {matches.length === 0 && !matchesLoading && (
                  <button
                    onClick={() => {
                      if (!id) return
                      setMatchesLoading(true)
                      fetch(`/api/leads/${id}/matches`)
                        .then(r => r.json())
                        .then(res => setMatches(res.matches ?? []))
                        .catch(() => {})
                        .finally(() => setMatchesLoading(false))
                    }}
                    className="bo-btn bo-btn-sm"
                    style={{ fontSize: '11px' }}
                  >
                    <Sparkles size={11} />
                    Buscar matches
                  </button>
                )}
              </div>

              {matchesLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', padding: '24px 0' }}>
                  <Loader2 size={14} className="animate-spin" />
                  Analisando compatibilidade...
                </div>
              )}

              {!matchesLoading && matches.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <Building2 size={24} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                  <p>Clique em "Buscar matches" para encontrar imóveis compatíveis</p>
                </div>
              )}

              {matches.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '12px', borderRadius: '6px', marginBottom: '8px',
                    background: i === 0 ? 'rgba(184,148,58,0.07)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${i === 0 ? 'rgba(184,148,58,0.2)' : 'var(--border-default)'}`,
                  }}
                >
                  <div style={{
                    minWidth: '40px', height: '40px', borderRadius: '6px',
                    background: i === 0 ? 'rgba(184,148,58,0.15)' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Building2 size={16} style={{ color: i === 0 ? 'var(--imi-gold-500)' : 'var(--text-secondary)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</span>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '2px 8px',
                        borderRadius: '6px',
                        background: m.match_score >= 80 ? 'var(--success-bg)' : m.match_score >= 60 ? 'var(--warning-bg)' : 'var(--bg-hover)',
                        color: m.match_score >= 80 ? 'var(--success)' : m.match_score >= 60 ? 'var(--warning)' : 'var(--text-secondary)',
                      }}>
                        {m.match_score}% match
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                      {[m.city, m.state].filter(Boolean).join(', ')}
                      {m.min_price && ` · R$ ${(m.min_price / 1000).toFixed(0)}k${m.max_price ? `–${(m.max_price / 1000).toFixed(0)}k` : '+'}`}
                    </p>
                    {m.match_reasons?.length > 0 && (
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.7 }}>
                        {m.match_reasons.join(' · ')}
                      </p>
                    )}
                  </div>
                  <a
                    href={`/backoffice/empreendimentos/${m.id}`}
                    style={{
                      fontSize: '11px', color: 'var(--text-secondary)',
                      textDecoration: 'none', whiteSpace: 'nowrap',
                      padding: '4px 8px', borderRadius: '6px',
                      background: 'var(--bg-elevated)',
                    }}
                  >
                    Ver →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
