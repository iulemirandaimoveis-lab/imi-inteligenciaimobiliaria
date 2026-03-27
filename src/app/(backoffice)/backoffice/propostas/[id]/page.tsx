'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Copy, ExternalLink, Send, CheckCircle, XCircle, Clock,
  Eye, Zap, Activity, TrendingUp, ChevronLeft,
  User, Building2, DollarSign, FileText, MoreVertical,
  Flame, Thermometer, Snowflake, RefreshCw, MessageCircle,
  AlertTriangle, Download, Edit3
} from 'lucide-react'
import { T, cardStyle } from '@/app/(backoffice)/lib/theme'
import { createClient } from '@/lib/supabase/client'
import { fmt } from '@/lib/format'

// ── Types ────────────────────────────────────────────────────
interface Proposal {
  id: string; token: string; status: string
  buyer_name: string; buyer_email: string; buyer_phone: string
  seller_name: string
  property_id: string; lead_id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  property_snapshot: Record<string, any>
  listed_price: number; proposed_value: number
  entry_value: number; financing_value: number
  financing_bank: string; financing_term_months: number; financing_rate: number
  consortium_value: number; fgts_value: number; cash_value: number
  direct_installments_count: number; direct_installments_value: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  balloon_installments: Record<string, any>[]
  validity_days: number; validity_until: string
  conditions: string; commission_pct: number; commission_who_pays: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notes: string; counter_proposal: Record<string, any> | null
  created_at: string; sent_at: string
  score: number; tier: string
  opens_count: number; total_time_seconds: number; last_activity: string
}

interface Event {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  id: string; event_type: string; metadata: Record<string, any>
  device_type: string; time_on_page_seconds: number; created_at: string
}

// ── Helpers ──────────────────────────────────────────────────
const fmtDate = (s: string) => s
  ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(s))
  : '--'

function Badge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; bg: string; color: string }> = {
    draft:     { label: 'Rascunho',     bg: 'rgba(107,119,133,0.12)', color: 'var(--text-tertiary)' },
    sent:      { label: 'Enviada',      bg: 'rgba(96,165,250,0.12)',  color: 'var(--info)' },
    viewed:    { label: 'Visualizada',  bg: 'rgba(167,139,250,0.12)', color: 'var(--info)' },
    countered: { label: 'Contraposta',  bg: 'rgba(251,191,36,0.12)', color: 'var(--warning)' },
    accepted:  { label: 'Aceita',       bg: 'rgba(52,211,153,0.12)', color: 'var(--success)' },
    rejected:  { label: 'Recusada',     bg: 'rgba(248,113,113,0.10)', color: 'var(--error)' },
    expired:   { label: 'Expirada',     bg: 'rgba(107,119,133,0.10)', color: 'var(--text-tertiary)' },
  }
  const c = cfg[status] ?? cfg.draft
  return (
    <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

function TierIcon({ tier }: { tier: string }) {
  if (tier === 'hot')  return <Flame size={16} color="var(--error)" />
  if (tier === 'warm') return <Thermometer size={16} color="var(--warning)" />
  return <Snowflake size={16} color="var(--info)" />
}

function EventIcon({ type }: { type: string }) {
  const icons: Record<string, any> = {
    proposal_created: FileText,
    proposal_sent: Send,
    proposal_opened: Eye,
    simulation_opened: TrendingUp,
    whatsapp_clicked: MessageCircle,
    cta_clicked: Zap,
    counter_submitted: RefreshCw,
    proposal_accepted: CheckCircle,
    proposal_rejected: XCircle,
  }
  const Icon = icons[type] ?? Activity
  return <Icon size={13} />
}

function EventLabel(type: string) {
  const map: Record<string, string> = {
    proposal_created: 'Proposta criada',
    proposal_sent: 'Link enviado',
    proposal_opened: 'Proposta aberta pelo cliente',
    section_viewed: 'Secao visualizada',
    simulation_opened: 'Simulação aberta',
    whatsapp_clicked: 'Clicou no WhatsApp',
    cta_clicked: 'Clicou em CTA',
    counter_submitted: 'Contraproposta enviada',
    proposal_accepted: 'Proposta aceita',
    proposal_rejected: 'Proposta recusada',
  }
  return map[type] ?? type
}

function KPI({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ ...cardStyle, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: accent ? T.accent : T.text, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────
export default function PropostaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    const [{ data: p }, { data: e }] = await Promise.all([
      supabase.from('v_proposals_with_score').select('*').eq('id', id).single(),
      supabase.from('proposal_events').select('*').eq('proposal_id', id).order('created_at', { ascending: false }).limit(50),
    ])
    if (p) setProposal(p as Proposal)
    if (e) setEvents(e as Event[])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const publicLink = proposal
    ? `${window?.location?.origin}/p/${proposal.token}`
    : ''

  async function copyLink() {
    await navigator.clipboard.writeText(publicLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function updateStatus(newStatus: string) {
    if (!proposal) return
    setUpdating(true)
    await supabase.from('proposals').update({ status: newStatus }).eq('id', id)
    await supabase.from('proposal_events').insert({
      proposal_id: id,
      event_type: newStatus === 'accepted' ? 'proposal_accepted' : 'proposal_rejected',
    })
    await load()
    setUpdating(false)
  }

  const estParcel = proposal && proposal.financing_value && proposal.financing_term_months && proposal.financing_rate
    ? (() => {
        const P = proposal.financing_value
        const r = (proposal.financing_rate / 100) / 12
        const n = proposal.financing_term_months
        if (r === 0) return P / n
        return P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
      })()
    : null

  if (loading) {
    return (
      <div style={{ padding: 48, color: T.textMuted, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Activity size={16} style={{ opacity: 0.5 }} />
        Carregando proposta...
      </div>
    )
  }

  if (!proposal) {
    return (
      <div style={{ padding: 48, color: T.textMuted, fontSize: 13 }}>
        Proposta nao encontrada.
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button
            onClick={() => router.push('/backoffice/propostas')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 13 }}
          >
            <ChevronLeft size={16} /> Propostas
          </button>

          <div style={{ height: 16, width: 1, background: T.border }} />

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: T.text, fontWeight: 500, flex: 1 }}>
            Proposta -- {proposal.buyer_name}
          </h1>

          <Badge status={proposal.status} />

          {/* Tier */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...cardStyle, padding: '8px 12px' }}>
            <TierIcon tier={proposal.tier ?? 'cold'} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: T.textMuted }}>
              Score {proposal.score ?? 0}
            </span>
          </div>
        </div>

        {/* Link bar */}
        {proposal.status !== 'draft' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              ...cardStyle,
              padding: '12px 16px',
              marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 12,
              background: T.accentBg, borderColor: T.borderGold,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.accent, whiteSpace: 'nowrap' }}>
              Link do Cliente
            </div>
            <div style={{ flex: 1, fontSize: 12, color: T.textMuted, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {publicLink}
            </div>
            <button
              onClick={copyLink}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.accent, border: 'none', borderRadius: T.radius.sm, padding: '8px 12px', color: 'var(--text-inverse)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: T.transition.fast }}
            >
              <Copy size={12} />
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            <a
              href={publicLink}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.textMuted, fontSize: 11, textDecoration: 'none', border: `1px solid ${T.border}`, borderRadius: T.radius.sm, padding: '8px 12px', transition: T.transition.fast }}
            >
              <ExternalLink size={12} />
              Abrir
            </a>
          </motion.div>
        )}

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <KPI label="Valor Proposto" value={fmt(proposal.proposed_value)} accent />
              {proposal.listed_price && (
                <KPI
                  label="Desconto"
                  value={`${((proposal.listed_price - proposal.proposed_value) / proposal.listed_price * 100).toFixed(1)}%`}
                  sub={`De ${fmt(proposal.listed_price)}`}
                />
              )}
              <KPI label="Validade" value={`${proposal.validity_days} dias`} sub={fmtDate(proposal.validity_until)} />
            </div>

            {/* Financial breakdown */}
            <div style={{ ...cardStyle, padding: 20 }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.accent, marginBottom: 16 }}>
                Composição do Pagamento
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Sinal / Entrada', v: proposal.entry_value },
                  { label: `Financiamento${proposal.financing_bank ? ` · ${proposal.financing_bank}` : ''}`, v: proposal.financing_value },
                  { label: 'Consórcio', v: proposal.consortium_value },
                  { label: 'FGTS', v: proposal.fgts_value },
                  { label: 'A Vista', v: proposal.cash_value },
                  {
                    label: `Parcelas Diretas (${proposal.direct_installments_count}x)`,
                    v: (proposal.direct_installments_count || 0) * (proposal.direct_installments_value || 0)
                  },
                ].filter(({ v }) => v && v > 0).map(({ label, v }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.borderSubtle}` }}>
                    <span style={{ fontSize: 12, color: T.textMuted }}>{label}</span>
                    <span style={{ fontSize: 12, color: T.text, fontWeight: 500, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{fmt(v)}</span>
                  </div>
                ))}
                {proposal.financing_value && estParcel && (
                  <div style={{ padding: '8px 0 4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: T.textMuted }}>Parcela estimada (SAC Price)</span>
                    <span style={{ fontSize: 11, color: T.accent, fontWeight: 600, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{fmt(estParcel)}/mês</span>
                  </div>
                )}
              </div>
            </div>

            {/* Intercaladas */}
            {proposal.balloon_installments?.length > 0 && (
              <div style={{ ...cardStyle, padding: 20 }}>
                <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.accent, marginBottom: 16 }}>
                  Parcelas Intercaladas
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {proposal.balloon_installments.map((b: Record<string, any>, i: number) => (
                    <div key={i} style={{ ...cardStyle, padding: '8px 12px', background: T.surface }}>
                      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Mês {b.month}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{fmt(b.value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conditions */}
            {(proposal.conditions || proposal.commission_pct) && (
              <div style={{ ...cardStyle, padding: 20 }}>
                <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.accent, marginBottom: 16 }}>
                  Condições
                </h3>
                {proposal.commission_pct && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.borderSubtle}` }}>
                    <span style={{ fontSize: 12, color: T.textMuted }}>Comissão</span>
                    <span style={{ fontSize: 12, color: T.text, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                      {proposal.commission_pct}% · paga pelo {proposal.commission_who_pays === 'seller' ? 'vendedor' : proposal.commission_who_pays === 'buyer' ? 'comprador' : 'ambos'}
                    </span>
                  </div>
                )}
                {proposal.conditions && (
                  <p style={{ fontSize: 12, color: T.textMuted, marginTop: 12, lineHeight: 1.7 }}>
                    {proposal.conditions}
                  </p>
                )}
              </div>
            )}

            {/* Counter proposal */}
            {proposal.counter_proposal && (
              <div style={{ ...cardStyle, padding: 20, borderColor: 'var(--warning)', background: 'var(--warning-bg)' }}>
                <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--warning)', marginBottom: 16 }}>
                  Contraproposta do Cliente
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {proposal.counter_proposal.value && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: T.textMuted }}>Valor sugerido</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{fmt(proposal.counter_proposal.value)}</span>
                    </div>
                  )}
                  {proposal.counter_proposal.conditions && (
                    <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>{proposal.counter_proposal.conditions}</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            {['sent', 'viewed', 'countered'].includes(proposal.status) && (
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => updateStatus('accepted')}
                  disabled={updating}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 20px', borderRadius: T.radius.md, cursor: 'pointer',
                    background: T.successBg, border: `1px solid var(--success)`,
                    color: 'var(--success)', fontSize: 13, fontWeight: 700,
                    transition: T.transition.fast,
                  }}
                >
                  <CheckCircle size={15} /> Marcar como Aceita
                </button>
                <button
                  onClick={() => updateStatus('rejected')}
                  disabled={updating}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 20px', borderRadius: T.radius.md, cursor: 'pointer',
                    background: T.errorBg, border: `1px solid var(--error)`,
                    color: 'var(--error)', fontSize: 13, fontWeight: 600,
                    transition: T.transition.fast,
                  }}
                >
                  <XCircle size={15} /> Recusada
                </button>
              </div>
            )}

            {/* Draft: send */}
            {proposal.status === 'draft' && (
              <button
                onClick={async () => {
                  await supabase.from('proposals').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id)
                  await supabase.from('proposal_events').insert({ proposal_id: id, event_type: 'proposal_sent', metadata: { channel: 'link' } })
                  load()
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 20px', borderRadius: T.radius.md, cursor: 'pointer',
                  background: T.accent, border: 'none', color: 'var(--text-inverse)', fontSize: 13, fontWeight: 700,
                  width: '100%',
                  transition: T.transition.fast,
                }}
              >
                <Send size={15} /> Gerar & Enviar Link ao Cliente
              </button>
            )}
          </div>

          {/* RIGHT: sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Tracking summary */}
            <div style={{ ...cardStyle, padding: 20 }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.accent, marginBottom: 16 }}>
                Tracking de Interesse
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Visualizações', val: String(proposal.opens_count ?? 0), icon: Eye },
                  { label: 'Tempo total', val: proposal.total_time_seconds ? `${Math.round((proposal.total_time_seconds || 0) / 60)}min` : '0min', icon: Clock },
                  { label: 'Última atividade', val: proposal.last_activity ? fmtDate(proposal.last_activity) : '--', icon: Activity },
                ].map(({ label, val, icon: Icon }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: T.radius.sm, background: T.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={13} color={T.accent} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
                      <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Score bar */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score de interesse</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <TierIcon tier={proposal.tier ?? 'cold'} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: proposal.tier === 'hot' ? 'var(--error)' : proposal.tier === 'warm' ? 'var(--warning)' : 'var(--info)' }}>
                      {(proposal.score ?? 0)}/50
                    </span>
                  </div>
                </div>
                <div style={{ height: 4, background: T.border, borderRadius: 6, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ((proposal.score ?? 0) / 50) * 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                      height: '100%', borderRadius: 6,
                      background: proposal.tier === 'hot' ? 'var(--error)' : proposal.tier === 'warm' ? 'var(--warning)' : 'var(--info)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Buyer card */}
            <div style={{ ...cardStyle, padding: 16 }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.accent, marginBottom: 12 }}>
                Comprador
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.accentBg, border: `1px solid ${T.borderGold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: T.accent }}>
                  {proposal.buyer_name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{proposal.buyer_name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{proposal.buyer_email}</div>
                </div>
              </div>
              {proposal.buyer_phone && (
                <a
                  href={`https://wa.me/55${proposal.buyer_phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '8px 0', background: T.successBg, border: `1px solid var(--success)`,
                    borderRadius: T.radius.md, color: 'var(--success)', fontSize: 11, fontWeight: 600, textDecoration: 'none', width: '100%',
                    transition: T.transition.fast,
                  }}
                >
                  <MessageCircle size={13} /> WhatsApp
                </a>
              )}
            </div>

            {/* Event log */}
            <div style={{ ...cardStyle, padding: 20 }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.accent, marginBottom: 16 }}>
                Linha do Tempo
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {events.slice(0, 12).map((ev, idx) => (
                  <div key={ev.id} style={{ display: 'flex', gap: 8, paddingBottom: 12, position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.accentBg, border: `1px solid ${T.borderGold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent, flexShrink: 0 }}>
                        <EventIcon type={ev.event_type} />
                      </div>
                      {idx < events.slice(0, 12).length - 1 && (
                        <div style={{ width: 1, flex: 1, background: T.border, marginTop: 4 }} />
                      )}
                    </div>
                    <div style={{ paddingTop: 4 }}>
                      <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>
                        {EventLabel(ev.event_type)}
                      </div>
                      {ev.device_type && (
                        <div style={{ fontSize: 11, color: T.textMuted }}>{ev.device_type}</div>
                      )}
                      {ev.time_on_page_seconds && (
                        <div style={{ fontSize: 11, color: T.textMuted }}>{ev.time_on_page_seconds}s na página</div>
                      )}
                      <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>
                        {fmtDate(ev.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <span style={{ fontSize: 12, color: T.textDim }}>Nenhuma atividade ainda</span>
                )}
              </div>
            </div>

            {/* Notes */}
            {proposal.notes && (
              <div style={{ ...cardStyle, padding: 16 }}>
                <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 8 }}>
                  Notas Internas
                </h3>
                <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>{proposal.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
