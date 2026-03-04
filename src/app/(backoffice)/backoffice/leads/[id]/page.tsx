'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Phone, Mail, MapPin, Building2, DollarSign,
  Calendar, Star, Edit, MessageSquare, FileText,
  Clock, TrendingUp, Eye, MousePointerClick,
  ChevronRight, Sparkles, MoreVertical, Send, AlertCircle,
} from 'lucide-react'
import { useLead } from '@/hooks/use-leads-complete'

// ── Dark theme tokens ──────────────────────────────────────────
const T = {
  bg: 'var(--bo-surface)',
  elevated: 'var(--bo-elevated)',
  surface: 'var(--bo-surface)',
  border: 'var(--bo-border)',
  borderGold: 'var(--bo-border-gold)',
  text: 'var(--bo-text)',
  textSub: 'var(--bo-text-muted)',
  gold: '#486581',
  iconBg: 'var(--bo-icon-bg)',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  hot:       { label: 'Quente',      color: '#E8A87C', bg: 'rgba(232,168,124,0.12)', dot: '#E8A87C' },
  warm:      { label: 'Morno',       color: '#7EC8A4', bg: 'rgba(126,200,164,0.12)', dot: '#7EC8A4' },
  cold:      { label: 'Frio',        color: '#7B9EC4', bg: 'rgba(123,158,196,0.12)', dot: '#7B9EC4' },
  qualified: { label: 'Qualificado', color: '#6BB87B', bg: 'rgba(107,184,123,0.12)', dot: '#6BB87B' },
  new:       { label: 'Novo',        color: '#9B8EC4', bg: 'rgba(155,142,196,0.12)', dot: '#9B8EC4' },
  contacted: { label: 'Contactado',  color: '#7B9EC4', bg: 'rgba(123,158,196,0.12)', dot: '#7B9EC4' },
  proposal:  { label: 'Proposta',    color: '#486581', bg: 'rgba(72,101,129,0.15)',  dot: '#486581' },
  won:       { label: 'Ganho',       color: '#6BB87B', bg: 'rgba(107,184,123,0.15)', dot: '#6BB87B' },
  lost:      { label: 'Perdido',     color: '#7B8794', bg: 'rgba(123,135,148,0.12)', dot: '#7B8794' },
}

function ScoreRing({ score }: { score: number }) {
  const r = 20, c = 2 * Math.PI * r
  const fill = (score / 100) * c
  const color = score >= 85 ? '#6BB87B' : score >= 70 ? '#E8A87C' : '#7B9EC4'

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} strokeWidth="4" stroke="var(--bo-border)" fill="none" />
        <circle cx="24" cy="24" r={r} strokeWidth="4" stroke={color} fill="none"
          strokeDasharray={`${fill} ${c}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[13px] font-black leading-none" style={{ color: T.text }}>{score}</span>
        <span className="text-[9px] font-bold uppercase" style={{ color: T.textSub }}>score</span>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto pb-20 animate-pulse">
      <div className="h-8 w-24 rounded-lg mb-6" style={{ background: 'var(--bo-elevated)' }} />
      <div className="rounded-3xl p-6 mb-4" style={{ background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)' }}>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl flex-shrink-0" style={{ background: 'var(--bo-border)' }} />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 rounded" style={{ background: 'var(--bo-border)' }} />
            <div className="h-4 w-24 rounded" style={{ background: 'var(--bo-icon-bg)' }} />
          </div>
          <div className="w-16 h-16 rounded-full" style={{ background: 'var(--bo-border)' }} />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`h-4 rounded ${i === 4 ? 'col-span-2' : ''}`} style={{ background: 'var(--bo-icon-bg)' }} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-11 rounded-2xl" style={{ background: 'var(--bo-icon-bg)' }} />
          <div className="h-11 rounded-2xl" style={{ background: 'var(--bo-border)' }} />
        </div>
      </div>
      <div className="rounded-3xl h-36 mb-4" style={{ background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)' }} />
      <div className="rounded-3xl h-48" style={{ background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)' }} />
    </div>
  )
}

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
  return `${m}min atrás`
}

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
          className="flex items-center gap-2 font-medium text-sm mb-6 transition-colors"
          style={{ color: T.textSub }}
        >
          <ArrowLeft size={16} />
          Leads
        </button>
        <div className="rounded-3xl p-12 text-center" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
          <AlertCircle size={32} className="mx-auto mb-3" style={{ color: T.textSub, opacity: 0.4 }} />
          <p className="text-[15px] font-semibold mb-1" style={{ color: T.text }}>Lead não encontrado</p>
          <p className="text-[13px]" style={{ color: T.textSub }}>O lead solicitado não existe ou foi removido.</p>
        </div>
      </div>
    )
  }

  const status = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new
  const initials = getInitials(lead.name)
  const devName = (lead as any).development?.name ?? null

  // Build a generic timeline from what we know
  const timeline = [
    lead.last_interaction_at && {
      icon: MessageSquare,
      label: 'Último contato registrado',
      detail: devName ? `Empreendimento: ${devName}` : '',
      time: getTimeAgo(lead.last_interaction_at),
      accent: true,
    },
    {
      icon: Eye,
      label: `Lead capturado via ${lead.source || 'Orgânico'}`,
      detail: devName ? `Interesse: ${lead.interest || devName}` : (lead.interest || ''),
      time: getTimeAgo(lead.created_at),
      accent: !lead.last_interaction_at,
    },
  ].filter(Boolean) as Array<{ icon: any; label: string; detail: string; time: string; accent: boolean }>

  return (
    <div className="max-w-2xl mx-auto pb-20">

      {/* ── TOP NAV ── */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 font-medium text-sm transition-colors"
          style={{ color: T.textSub }}
        >
          <ArrowLeft size={16} />
          Leads
        </button>
        <div className="flex items-center gap-2">
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ border: `1px solid ${T.border}`, background: 'transparent' }}
          >
            <Edit size={15} style={{ color: T.textSub }} />
          </button>
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ border: `1px solid ${T.border}`, background: 'transparent' }}
          >
            <MoreVertical size={15} style={{ color: T.textSub }} />
          </button>
        </div>
      </div>

      {/* ── HERO CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-3xl p-6 mb-4"
        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
      >
        <div className="flex items-start gap-4 mb-5">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent-500), var(--accent-700))' }}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold mb-0.5 truncate" style={{ color: T.text }}>{lead.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ color: status.color, background: status.bg }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
                {status.label}
              </span>
              {lead.source && (
                <span className="text-[11px]" style={{ color: T.textSub }}>via {lead.source}</span>
              )}
            </div>
          </div>

          {/* Score Ring */}
          <ScoreRing score={lead.score ?? 0} />
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {lead.email && (
            <div className="flex items-center gap-2">
              <Mail size={13} className="flex-shrink-0" style={{ color: T.textSub }} />
              <span className="truncate text-[12px]" style={{ color: T.textSub }}>{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2">
              <Phone size={13} className="flex-shrink-0" style={{ color: T.textSub }} />
              <span className="text-[12px]" style={{ color: T.textSub }}>{lead.phone}</span>
            </div>
          )}
          {devName && (
            <div className="flex items-center gap-2">
              <Building2 size={13} className="flex-shrink-0" style={{ color: T.textSub }} />
              <span className="text-[12px]" style={{ color: T.textSub }}>{devName}</span>
            </div>
          )}
          {lead.interest && (
            <div className="flex items-center gap-2">
              <MapPin size={13} className="flex-shrink-0" style={{ color: T.textSub }} />
              <span className="text-[12px]" style={{ color: T.textSub }}>{lead.interest}</span>
            </div>
          )}
          {lead.capital && (
            <div className="flex items-center gap-2 col-span-2">
              <DollarSign size={13} className="flex-shrink-0" style={{ color: T.textSub }} />
              <span className="text-[12px] font-semibold" style={{ color: T.text }}>{formatCapital(lead.capital)}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {lead.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{ background: T.iconBg, border: `1px solid ${T.border}`, color: T.textSub }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-[11px] mb-5" style={{ color: T.textSub }}>
          <span>Criado {getTimeAgo(lead.created_at)}</span>
          {lead.last_interaction_at && (
            <>
              <span>·</span>
              <span>Último contato {getTimeAgo(lead.last_interaction_at)}</span>
            </>
          )}
        </div>

        {/* ── Action buttons — primary CTAs for field use ── */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center justify-center gap-2 h-12 rounded-2xl text-[14px] font-semibold transition-all"
            style={{ background: T.iconBg, border: `1px solid ${T.border}`, color: T.text }}
          >
            <Phone size={16} />
            Ligar
          </a>
          <a
            href={`https://wa.me/55${(lead.phone ?? '').replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-12 rounded-2xl text-[14px] font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
          >
            <MessageSquare size={16} />
            WhatsApp
          </a>
        </div>
      </motion.div>

      {/* ── AI INSIGHT CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="rounded-3xl p-6 mb-4 relative overflow-hidden"
        style={{ background: 'var(--bo-elevated)', border: `1px solid ${T.borderGold}` }}
      >
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl" style={{ background: 'rgba(72,101,129,0.15)' }} />
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <Sparkles size={16} style={{ color: T.gold }} />
          <h3 className="font-bold text-[15px]" style={{ color: T.text }}>AI Insight Strategy</h3>
        </div>
        <p className="text-[13px] leading-relaxed mb-4 relative z-10" style={{ color: T.textSub }}>
          {lead.score >= 85
            ? `${lead.name} tem score alto (${lead.score}). Abordagem proativa recomendada — alta probabilidade de conversão.`
            : lead.score >= 70
            ? `Score moderado (${lead.score}). Qualificar melhor interesse antes de apresentar propostas.`
            : `Lead em aquecimento (score ${lead.score}). Nutrição com conteúdo relevante recomendada antes de contato direto.`
          }
          {devName ? ` Interesse principal: ${devName}.` : ''}
          {lead.capital ? ` Capital declarado: ${formatCapital(lead.capital)}.` : ''}
        </p>
        <div
          className="rounded-2xl p-4 relative z-10"
          style={{ background: 'var(--bo-icon-bg)', border: `1px solid ${T.border}` }}
        >
          <p className="text-[10px] uppercase font-bold mb-1.5 tracking-widest" style={{ color: T.textSub }}>
            Próxima Ação Sugerida
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[13px]" style={{ color: T.text }}>
              {lead.status === 'new' || lead.status === 'cold'
                ? 'Entrar em contato e qualificar necessidade'
                : lead.status === 'contacted' || lead.status === 'warm'
                ? 'Agendar visita ou apresentação de proposta'
                : lead.status === 'proposal'
                ? 'Follow-up na proposta enviada'
                : lead.status === 'hot' || lead.status === 'qualified'
                ? 'Apresentar proposta personalizada'
                : 'Atualizar status do lead'
              }
            </span>
            <ChevronRight size={14} style={{ color: T.gold }} className="flex-shrink-0" />
          </div>
        </div>
      </motion.div>

      {/* ── TABS ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18 }}
        className="rounded-3xl overflow-hidden"
        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
      >
        {/* Tab bar */}
        <div className="flex" style={{ borderBottom: `1px solid ${T.border}` }}>
          {[
            { key: 'timeline', label: 'Timeline' },
            { key: 'history', label: 'Histórico' },
            { key: 'notes', label: 'Observações' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className="flex-1 py-3.5 text-[12px] font-bold uppercase tracking-wider transition-colors"
              style={{
                color: activeTab === tab.key ? T.text : T.textSub,
                borderBottom: activeTab === tab.key ? `2px solid ${T.gold}` : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── TIMELINE TAB ── */}
          {activeTab === 'timeline' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[14px]" style={{ color: T.text }}>Eventos do Lead</h3>
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ color: T.gold, background: 'rgba(72,101,129,0.12)', border: `1px solid rgba(72,101,129,0.2)` }}
                >
                  {timeline.length} evento{timeline.length !== 1 ? 's' : ''}
                </span>
              </div>

              {timeline.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px" style={{ background: T.border }} />
                  <div className="space-y-4">
                    {timeline.map((event, i) => (
                      <div key={i} className="flex gap-4 relative">
                        <div
                          className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={event.accent
                            ? { background: 'var(--bo-elevated)', border: `2px solid ${T.gold}` }
                            : { background: T.iconBg, border: `1px solid ${T.border}` }
                          }
                        >
                          <event.icon size={14} style={{ color: event.accent ? T.gold : T.textSub }} />
                        </div>
                        <div
                          className={`flex-1 rounded-2xl p-3.5 ${i > 0 ? 'opacity-75' : ''}`}
                          style={{ background: T.iconBg, border: `1px solid ${T.border}` }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <h4 className="font-semibold text-[13px]" style={{ color: T.text }}>{event.label}</h4>
                            <span className="text-[10px] flex-shrink-0" style={{ color: T.textSub }}>{event.time}</span>
                          </div>
                          {event.detail && (
                            <p className="text-[11px]" style={{ color: T.textSub }}>{event.detail}</p>
                          )}
                          {event.accent && (
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold" style={{ color: '#6BB87B' }}>
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
                <div className="text-center py-8" style={{ color: T.textSub }}>
                  <Eye size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-[13px]">Nenhum evento registrado</p>
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[14px]" style={{ color: T.text }}>Histórico de Contatos</h3>
                <button className="text-[11px] font-bold" style={{ color: T.gold }}>+ Registrar</button>
              </div>
              <div className="text-center py-8" style={{ color: T.textSub }}>
                <Clock size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-[13px]">Nenhum contato registrado ainda</p>
                <p className="text-[11px] mt-1">Use o botão acima para registrar um contato</p>
              </div>
            </div>
          )}

          {/* ── NOTES TAB ── */}
          {activeTab === 'notes' && (
            <div>
              {lead.message ? (
                <div
                  className="rounded-2xl p-4 mb-4"
                  style={{ background: T.iconBg, border: `1px solid ${T.border}` }}
                >
                  <p className="text-[13px] leading-relaxed" style={{ color: T.textSub }}>{lead.message}</p>
                </div>
              ) : (
                <div
                  className="rounded-2xl p-4 mb-4 text-center"
                  style={{ background: T.iconBg, border: `1px solid ${T.border}`, color: T.textSub }}
                >
                  <FileText size={20} className="mx-auto mb-1 opacity-40" />
                  <p className="text-[12px]">Nenhuma mensagem do lead</p>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Adicionar observação..."
                  className="flex-1 h-11 px-4 text-[13px] rounded-xl outline-none placeholder:opacity-40"
                  style={{
                    background: T.iconBg,
                    border: `1px solid ${T.border}`,
                    color: T.text,
                  }}
                />
                <button
                  disabled={!note.trim()}
                  className="w-11 h-11 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40"
                  style={{ background: T.gold }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
