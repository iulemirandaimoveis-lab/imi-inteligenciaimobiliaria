'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Phone, Mail, MapPin, Building2, DollarSign,
  Calendar, Edit, MessageSquare, FileText,
  Clock, TrendingUp, Eye, MousePointerClick,
  AlertCircle, Send, Globe, MoreVertical,
} from 'lucide-react'
import { useLead } from '@/hooks/use-leads-complete'
import { StatusBadge } from '@/app/(backoffice)/components/ui/StatusBadge'
import { AIInsightCard } from '@/app/(backoffice)/components/ui/AIInsightCard'
import { AIScore } from '@/app/(backoffice)/components/ui/AIScore'
import { SectionHeader } from '@/app/(backoffice)/components/ui/SectionHeader'

const T = {
    surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)',
    gold: 'var(--bo-accent)',
}

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
      <div style={{ height: 36, background: 'var(--bo-card)', borderRadius: 10, width: '40%', opacity: 0.5 }} />
      <div style={{ height: 180, background: 'var(--bo-card)', borderRadius: 20, opacity: 0.4 }} />
      <div style={{ height: 80, background: 'var(--bo-card)', borderRadius: 16, opacity: 0.35 }} />
      <div style={{ height: 120, background: 'var(--bo-card)', borderRadius: 16, opacity: 0.3 }} />
      {[0,1,2].map(i => (
        <div key={i} style={{ height: 80, background: 'var(--bo-card)', borderRadius: 16, opacity: 0.25 - i * 0.05 }} />
      ))}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────
export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string | undefined

  const { lead, isLoading, isError } = useLead(id ?? null)
  const [activeTab, setActiveTab] = useState<'timeline' | 'history' | 'notes'>('timeline')
  const [note, setNote] = useState('')

  if (isLoading) return <LoadingSkeleton />

  if (isError || !lead) {
    return (
      <div className="max-w-2xl mx-auto pb-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6"
          style={{ fontSize: '13px', fontWeight: 600, color: 'var(--bo-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
        >
          <ArrowLeft size={15} /> Leads
        </button>
        <div
          className="rounded-2xl text-center"
          style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)', padding: '48px 24px' }}
        >
          <AlertCircle size={28} style={{ color: 'var(--bo-text-muted)', opacity: 0.3, margin: '0 auto 12px' }} />
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--bo-text)', marginBottom: '6px' }}>Lead não encontrado</p>
          <p style={{ fontSize: '12px', color: 'var(--bo-text-muted)' }}>O lead solicitado não existe ou foi removido.</p>
        </div>
      </div>
    )
  }

  const initials     = getInitials(lead.name)
  const avatarBg     = AVATAR_GRADIENTS[lead.status] ?? AVATAR_GRADIENTS.cold
  const devName      = (lead as any).development?.name ?? null
  const aiIntentPct  = lead.score ?? 0
  const leadStatus   = lead.status || 'cold'

  // AI insight text
  const aiInsight = lead.score >= 85
    ? `${lead.name.split(' ')[0]} demonstra intenção de compra muito alta (score ${lead.score}). Abordagem proativa com proposta personalizada é a ação recomendada.`
    : lead.score >= 70
    ? `Score moderado (${lead.score}). Qualificar interesse específico antes de apresentar proposta. ${devName ? `Interesse em ${devName}.` : ''}`
    : `Lead em aquecimento (score ${lead.score}). Nutrição com conteúdo e follow-up consistente recomendados.`

  const nextAction = lead.status === 'hot' || lead.status === 'qualified'
    ? 'Apresentar proposta personalizada'
    : lead.status === 'warm' || lead.status === 'contacted'
    ? 'Agendar visita ou apresentação'
    : lead.status === 'proposal'
    ? 'Follow-up na proposta enviada'
    : 'Qualificar necessidade do lead'

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

      {/* ── Top Nav ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2"
          style={{ fontSize: '13px', fontWeight: 600, color: 'var(--bo-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
        >
          <ArrowLeft size={15} /> Leads
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/backoffice/leads/${id}/editar`)}
            style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'var(--bo-card)', border: '1px solid var(--bo-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Edit size={14} style={{ color: 'var(--bo-text-muted)' }} />
          </button>
          <button
            style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'var(--bo-card)', border: '1px solid var(--bo-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <MoreVertical size={14} style={{ color: 'var(--bo-text-muted)' }} />
          </button>
        </div>
      </div>

      {/* ── Hero Profile Card ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        style={{
          background: 'var(--bo-card)',
          border: '1px solid var(--bo-border)',
          borderRadius: '20px',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background accent glow */}
        <div style={{
          position: 'absolute', top: '-30px', right: '-20px',
          width: '100px', height: '100px', borderRadius: '50%',
          background: 'var(--imi-blue-dim)', filter: 'blur(30px)', pointerEvents: 'none',
        }} />

        {/* Label */}
        <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--imi-blue-bright)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px', position: 'relative' }}>
          LEAD PROFILE
        </div>

        {/* Avatar + Info + AI Score */}
        <div className="flex items-start gap-4 mb-5" style={{ position: 'relative' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: avatarBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.92)',
            flexShrink: 0, letterSpacing: '-0.02em',
          }}>
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--bo-text)', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '6px' }}>
              {lead.name}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={leadStatus} size="sm" glow dot />
              {lead.source && (
                <span style={{ fontSize: '10px', color: 'var(--bo-text-muted)', fontWeight: 500 }}>
                  via {lead.source}
                </span>
              )}
            </div>
          </div>

          {/* AI Intent Score */}
          <div
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'var(--bo-elevated)',
              border: '1px solid var(--imi-blue-border)',
              borderRadius: '14px', padding: '10px 12px',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--imi-blue-bright)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
              AI Intent
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--bo-text)', lineHeight: 1 }}>
              {aiIntentPct}%
            </span>
          </div>
        </div>

        {/* Contact actions */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <a
            href={`tel:${lead.phone}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              height: '46px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
              color: 'var(--bo-text)', background: 'var(--bo-elevated)',
              border: '1px solid var(--bo-border)', textDecoration: 'none',
            }}
          >
            <Phone size={15} style={{ color: 'var(--imi-blue-bright)' }} /> Ligar
          </a>
          <a
            href={`https://wa.me/55${(lead.phone ?? '').replace(/\D/g, '')}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              height: '46px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
              color: '#fff', background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              border: 'none', textDecoration: 'none',
            }}
          >
            <MessageSquare size={15} /> WhatsApp
          </a>
        </div>

        {/* Contact info grid */}
        <div className="space-y-2">
          {lead.email && (
            <div className="flex items-center gap-2">
              <Mail size={12} style={{ color: 'var(--bo-text-muted)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--bo-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lead.email}
              </span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2">
              <Phone size={12} style={{ color: 'var(--bo-text-muted)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--bo-text-muted)' }}>{lead.phone}</span>
            </div>
          )}
          {devName && (
            <div className="flex items-center gap-2">
              <Building2 size={12} style={{ color: 'var(--bo-text-muted)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--bo-text-muted)' }}>{devName}</span>
            </div>
          )}
          {lead.interest && (
            <div className="flex items-center gap-2">
              <MapPin size={12} style={{ color: 'var(--bo-text-muted)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--bo-text-muted)' }}>{lead.interest}</span>
            </div>
          )}
          {lead.capital && (
            <div className="flex items-center gap-2">
              <DollarSign size={12} style={{ color: 'var(--imi-ai-gold)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--imi-ai-gold)' }}>
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
                  fontSize: '10px', fontWeight: 600,
                  color: 'var(--bo-text-muted)', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--bo-border)', padding: '2px 8px', borderRadius: '6px',
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
          style={{ borderTop: '1px solid var(--bo-border)', fontSize: '10px', color: 'var(--bo-text-muted)' }}
        >
          <span className="flex items-center gap-1">
            <Calendar size={9} />
            Criado {getTimeAgo(lead.created_at)}
          </span>
          {lead.last_interaction_at && (
            <>
              <span style={{ color: 'var(--bo-border)', fontSize: '12px' }}>·</span>
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
          title="AI Insight Strategy"
          variant="gold"
          nextStep={nextAction}
        >
          <span style={{ color: 'var(--bo-text)', fontSize: '12px', lineHeight: 1.65 }}>
            {aiInsight}
          </span>
        </AIInsightCard>
      </motion.div>

      {/* ── Behavioral Timeline Tabs ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)', borderRadius: '20px', overflow: 'hidden' }}
      >
        {/* Tab header */}
        <div className="flex" style={{ borderBottom: '1px solid var(--bo-border)' }}>
          {[
            { key: 'timeline', label: 'Behavioral Timeline' },
            { key: 'history',  label: 'Histórico' },
            { key: 'notes',    label: 'Notas' },
          ].map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  flex: 1,
                  padding: '13px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: isActive ? 'var(--imi-blue-bright)' : 'var(--bo-text-muted)',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? 'var(--imi-blue-bright)' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
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
                    width: '2px', background: 'var(--bo-border)',
                  }} />

                  <div className="space-y-4">
                    {timeline.map((event, i) => (
                      <div key={i} className="flex gap-3">
                        {/* Icon node */}
                        <div style={{
                          position: 'relative', zIndex: 1,
                          width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                          background: event.accent
                            ? 'var(--imi-blue-dim)'
                            : 'rgba(255,255,255,0.04)',
                          border: `2px solid ${event.accent ? 'var(--imi-blue-border)' : 'var(--bo-border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <event.icon
                            size={14}
                            style={{ color: event.accent ? 'var(--imi-blue-bright)' : 'var(--bo-text-muted)' }}
                          />
                        </div>

                        {/* Card */}
                        <div
                          style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--bo-border)',
                            borderRadius: '12px',
                            padding: '10px 12px',
                            opacity: i > 0 ? 0.75 : 1,
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--bo-text)' }}>
                              {event.label}
                            </h4>
                            <span style={{ fontSize: '10px', color: 'var(--bo-text-muted)', flexShrink: 0 }}>
                              {event.time}
                            </span>
                          </div>
                          {event.detail && (
                            <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)', marginBottom: '4px' }}>
                              {event.detail}
                            </p>
                          )}
                          {event.trending && (
                            <div className="flex items-center gap-1" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--s-done)' }}>
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
                  <Eye size={26} style={{ color: 'var(--bo-text-muted)', opacity: 0.2, margin: '0 auto 10px' }} />
                  <p style={{ fontSize: '13px', color: 'var(--bo-text-muted)' }}>Nenhum evento registrado</p>
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
                <Clock size={26} style={{ color: 'var(--bo-text-muted)', opacity: 0.2, margin: '0 auto 10px' }} />
                <p style={{ fontSize: '13px', color: 'var(--bo-text-muted)', marginBottom: '4px' }}>Sem contatos registrados</p>
                <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)' }}>Use o botão acima para registrar</p>
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
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--bo-border)',
                    borderRadius: '12px', padding: '12px', marginBottom: '12px',
                  }}
                >
                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--bo-text-muted)' }}>
                    {lead.message}
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bo-border)',
                    borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '12px',
                  }}
                >
                  <FileText size={20} style={{ color: 'var(--bo-text-muted)', opacity: 0.2, margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '12px', color: 'var(--bo-text-muted)' }}>Nenhuma mensagem do lead</p>
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
                    flex: 1, height: '42px', padding: '0 14px',
                    fontSize: '13px', background: 'var(--bo-elevated)',
                    border: '1px solid var(--bo-border)', borderRadius: '10px',
                    color: 'var(--bo-text)', outline: 'none',
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
                    width: '42px', height: '42px', borderRadius: '10px',
                    background: note.trim() ? 'var(--bo-accent)' : 'rgba(255,255,255,0.05)',
                    border: 'none', cursor: note.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: note.trim() ? 1 : 0.4,
                    transition: 'all 0.18s',
                  }}
                >
                  <Send size={14} style={{ color: note.trim() ? '#fff' : 'var(--bo-text-muted)' }} />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
