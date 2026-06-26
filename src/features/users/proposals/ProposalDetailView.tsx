'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Check, X, Send, Ban, RotateCcw, Paperclip, Printer, AlertCircle, Clock,
} from 'lucide-react'
import { tokens as T } from '../ui/tokens'
import { GlassCard, Eyebrow, Spinner } from '../ui/primitives'
import { StatusBadge } from './StatusBadge'
import {
  PROPOSAL_STATUS_LABELS, brokerActions, approverActions, formatBRL,
  type ProposalAction, type ProposalStatus,
} from '@/lib/imi-proposals/status'
import { getProposalTemplate } from '@/lib/imi-proposals/template'
import type { ProposalRow, ProposalEventRow } from './data'

const ACTION_META: Record<ProposalAction, { label: string; icon: React.ReactNode; tone: string; needsNote?: boolean }> = {
  submit: { label: 'Enviar', icon: <Send size={15} />, tone: T.blue },
  review: { label: 'Marcar em análise', icon: <Clock size={15} />, tone: T.amber },
  approve: { label: 'Aprovar', icon: <Check size={15} />, tone: T.green },
  reject: { label: 'Rejeitar', icon: <X size={15} />, tone: T.red, needsNote: true },
  cancel: { label: 'Cancelar', icon: <Ban size={15} />, tone: T.t2 },
  reopen: { label: 'Reabrir', icon: <RotateCcw size={15} />, tone: T.t2 },
  expire: { label: 'Expirar', icon: <Clock size={15} />, tone: T.red },
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function ProposalDetailView({
  proposal,
  events,
  canApprove,
  isOwner,
  canManage,
}: {
  proposal: ProposalRow
  events: ProposalEventRow[]
  canApprove: boolean
  isOwner: boolean
  canManage: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<ProposalAction | null>(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [noteFor, setNoteFor] = useState<ProposalAction | null>(null)

  const status = proposal.status as ProposalStatus
  const ownerActs = isOwner && canManage ? brokerActions(status) : []
  const approverActs = canApprove ? approverActions(status) : []
  const allActs = Array.from(new Set([...ownerActs, ...approverActs]))

  const template = getProposalTemplate(
    // form_data may be from any template; default to mano-imoveis layout for rendering.
    'mano-imoveis-compra'
  )

  async function runAction(action: ProposalAction) {
    setError('')
    const meta = ACTION_META[action]
    if (meta.needsNote && noteFor !== action) {
      setNoteFor(action)
      return
    }
    setBusy(action)
    try {
      const res = await fetch(`/api/users/proposals/${proposal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: note.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Falha na ação.')
        setBusy(null)
        return
      }
      setNote('')
      setNoteFor(null)
      router.refresh()
      setBusy(null)
    } catch {
      setError('Erro técnico.')
      setBusy(null)
    }
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '24px 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <Link href="/users/proposals" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: T.t3, fontFamily: T.fSans, fontSize: 12.5, textDecoration: 'none' }}>
          <ArrowLeft size={15} /> Propostas
        </Link>
        <Link
          href={`/users/proposals/${proposal.id}/document`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: T.t2, fontFamily: T.fSans, fontSize: 12.5, textDecoration: 'none', padding: '7px 12px', borderRadius: T.rSm, border: `1px solid ${T.glassBorder}`, background: 'rgba(255,255,255,0.03)' }}
        >
          <Printer size={14} /> Documento / PDF
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <Eyebrow style={{ color: T.gold }}>Proposta de Compra</Eyebrow>
          <h1 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 28, color: T.t1, margin: '8px 0 6px' }}>
            {proposal.clientName}
          </h1>
          <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, margin: 0 }}>
            {[proposal.unitLabel, proposal.loteamento || proposal.projectName].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Resumo comercial */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 18 }}>
        <Stat label="Valor" value={formatBRL(proposal.totalAmount)} accent={T.gold} />
        <Stat label="Sinal" value={formatBRL(proposal.downPayment)} />
        <Stat label="Parcelas" value={proposal.installments || '—'} />
        <Stat label="Corretor" value={proposal.brokerName || '—'} />
      </div>

      {/* Janela de reserva */}
      {proposal.expiresAt && ['submitted', 'under_review'].includes(status) && (
        <GlassCard padding={14} style={{ marginBottom: 18, background: T.amberSoft, border: `1px solid rgba(251,191,36,0.22)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Clock size={15} color={T.amber} />
            <span style={{ fontFamily: T.fSans, fontSize: 12.5, color: T.t2 }}>
              Reserva válida até <strong style={{ color: T.t1 }}>{fmtDateTime(proposal.expiresAt)}</strong>
            </span>
          </div>
        </GlassCard>
      )}

      {/* Ações */}
      {allActs.length > 0 && (
        <GlassCard style={{ marginBottom: 18 }}>
          <Eyebrow style={{ marginBottom: 12 }}>Ações</Eyebrow>
          {noteFor && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Motivo / observação para "${ACTION_META[noteFor].label}" (opcional)`}
              rows={2}
              style={{
                width: '100%', padding: 12, borderRadius: T.rSm, marginBottom: 12,
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.glassBorder}`,
                color: T.t1, fontFamily: T.fSans, fontSize: 13, outline: 'none', resize: 'vertical',
              }}
            />
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {allActs.map((a) => {
              const meta = ACTION_META[a]
              return (
                <button
                  key={a}
                  type="button"
                  disabled={busy !== null}
                  onClick={() => runAction(a)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                    borderRadius: T.rMd, cursor: busy ? 'wait' : 'pointer',
                    border: `1px solid ${meta.tone}55`, background: `${meta.tone}1A`, color: meta.tone,
                    fontFamily: T.fSans, fontSize: 13, fontWeight: 600,
                  }}
                >
                  {busy === a ? <Spinner size={14} color={meta.tone} /> : meta.icon}
                  {meta.needsNote && noteFor === a ? `Confirmar ${meta.label.toLowerCase()}` : meta.label}
                </button>
              )
            })}
          </div>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, color: T.red, fontFamily: T.fSans, fontSize: 12.5 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </GlassCard>
      )}

      {/* Decisão registrada */}
      {(status === 'approved' || status === 'rejected') && (
        <GlassCard padding={16} style={{ marginBottom: 18, border: `1px solid ${status === 'approved' ? T.greenBorder : T.redBorder}` }}>
          <Eyebrow style={{ marginBottom: 8, color: status === 'approved' ? T.green : T.red }}>
            {status === 'approved' ? 'Aprovada' : 'Rejeitada'}
          </Eyebrow>
          <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t2, margin: 0 }}>
            {proposal.reviewerName ? `Por ${proposal.reviewerName} · ` : ''}{fmtDateTime(proposal.reviewedAt)}
          </p>
          {proposal.decisionNote && (
            <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t1, margin: '8px 0 0', lineHeight: 1.5 }}>
              “{proposal.decisionNote}”
            </p>
          )}
        </GlassCard>
      )}

      {/* Dados (template) */}
      {template && (
        <GlassCard style={{ marginBottom: 18 }}>
          <Eyebrow style={{ marginBottom: 16 }}>Dados da proposta</Eyebrow>
          {template.schema.groups.map((group) => {
            const repeats = group.repeat && group.repeat > 1 ? group.repeat : 1
            return (
              <div key={group.key} style={{ marginBottom: 18 }}>
                <p style={{ fontFamily: T.fSans, fontSize: 12, color: T.gold, fontWeight: 600, margin: '0 0 10px' }}>{group.title}</p>
                {Array.from({ length: repeats }).map((_, idx) => {
                  const dataKey = group.repeat && group.repeat > 1 ? `${group.key}.${idx + 1}` : group.key
                  const values = proposal.formData[dataKey] ?? {}
                  return (
                    <div key={dataKey} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px 18px', marginBottom: repeats > 1 ? 10 : 0 }}>
                      {group.fields.map((f) => (
                        <div key={f.key}>
                          <p style={{ fontFamily: T.fSans, fontSize: 10.5, color: T.t4, margin: 0 }}>{f.label}</p>
                          <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t1, margin: '2px 0 0' }}>{values[f.key] || '—'}</p>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </GlassCard>
      )}

      {/* Anexo */}
      {proposal.attachmentUrl && (
        <GlassCard padding={16} style={{ marginBottom: 18 }}>
          <Eyebrow style={{ marginBottom: 10 }}>Anexo</Eyebrow>
          <a
            href={proposal.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: T.gold, fontFamily: T.fSans, fontSize: 13, textDecoration: 'none' }}
          >
            <Paperclip size={15} /> Ver proposta anexada
          </a>
        </GlassCard>
      )}

      {/* Timeline */}
      <GlassCard>
        <Eyebrow style={{ marginBottom: 14 }}>Histórico & Auditoria</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {events.length === 0 && (
            <p style={{ fontFamily: T.fSans, fontSize: 12.5, color: T.t3, margin: 0 }}>Sem eventos registrados.</p>
          )}
          {events.map((e, i) => (
            <div key={e.id} style={{ display: 'flex', gap: 12, paddingBottom: i === events.length - 1 ? 0 : 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: T.gold, marginTop: 4 }} />
                {i !== events.length - 1 && <span style={{ width: 1, flex: 1, background: T.glassBorder, marginTop: 4 }} />}
              </div>
              <div style={{ paddingBottom: 4 }}>
                <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t1, margin: 0 }}>
                  <strong>{eventLabel(e)}</strong>
                  {e.actorName ? <span style={{ color: T.t3 }}> · {e.actorName}</span> : null}
                </p>
                {e.note && <p style={{ fontFamily: T.fSans, fontSize: 12, color: T.t3, margin: '3px 0 0' }}>“{e.note}”</p>}
                <p style={{ fontFamily: T.fSans, fontSize: 10.5, color: T.t4, margin: '3px 0 0' }}>{fmtDateTime(e.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

function eventLabel(e: ProposalEventRow): string {
  const map: Record<string, string> = {
    created: 'Proposta criada',
    submitted: 'Enviada para análise',
    submit: 'Enviada para análise',
    review: 'Em análise',
    approve: 'Aprovada',
    reject: 'Rejeitada',
    cancel: 'Cancelada',
    reopen: 'Reaberta',
    attachment: 'Anexo adicionado',
    note: 'Observação',
  }
  if (map[e.type]) return map[e.type]
  if (e.toStatus) return PROPOSAL_STATUS_LABELS[e.toStatus]
  return e.type
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <GlassCard padding={14}>
      <p style={{ fontFamily: T.fSans, fontSize: 10.5, color: T.t3, margin: 0, letterSpacing: '0.04em', fontWeight: 600 }}>{label}</p>
      <p style={{ fontFamily: T.fSans, fontSize: 17, fontWeight: 700, color: accent ?? T.t1, margin: '6px 0 0', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
    </GlassCard>
  )
}
