/**
 * IMI Proposals — status model, labels and workflow transitions.
 * Mirrors the imi.imi_proposal_status enum in the DB.
 */

export const PROPOSAL_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'cancelled',
  'expired',
] as const

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number]

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: 'Rascunho',
  submitted: 'Enviada',
  under_review: 'Em análise',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  cancelled: 'Cancelada',
  expired: 'Expirada',
}

/** Semantic color keys (resolved against the design tokens in the UI). */
export const PROPOSAL_STATUS_TONE: Record<ProposalStatus, 'neutral' | 'blue' | 'amber' | 'green' | 'red'> = {
  draft: 'neutral',
  submitted: 'blue',
  under_review: 'amber',
  approved: 'green',
  rejected: 'red',
  cancelled: 'neutral',
  expired: 'red',
}

/**
 * Allowed status transitions, keyed by the action a user takes.
 * Enforcement of WHO may perform each action lives in the API (RBAC) and RLS.
 */
export type ProposalAction = 'submit' | 'review' | 'approve' | 'reject' | 'cancel' | 'expire' | 'reopen'

export const TRANSITIONS: Record<ProposalAction, { from: ProposalStatus[]; to: ProposalStatus }> = {
  submit: { from: ['draft'], to: 'submitted' },
  review: { from: ['submitted'], to: 'under_review' },
  approve: { from: ['submitted', 'under_review'], to: 'approved' },
  reject: { from: ['submitted', 'under_review'], to: 'rejected' },
  cancel: { from: ['draft', 'submitted', 'under_review'], to: 'cancelled' },
  expire: { from: ['submitted', 'under_review'], to: 'expired' },
  reopen: { from: ['rejected', 'cancelled', 'expired'], to: 'draft' },
}

export function canTransition(action: ProposalAction, current: ProposalStatus): boolean {
  return TRANSITIONS[action]?.from.includes(current) ?? false
}

export function nextStatus(action: ProposalAction): ProposalStatus {
  return TRANSITIONS[action].to
}

/** Actions a broker (owner of the proposal) may take, by current status. */
export function brokerActions(current: ProposalStatus): ProposalAction[] {
  return (['submit', 'cancel', 'reopen'] as ProposalAction[]).filter((a) => canTransition(a, current))
}

/** Actions an approver (proposals.approve) may take, by current status. */
export function approverActions(current: ProposalStatus): ProposalAction[] {
  return (['review', 'approve', 'reject'] as ProposalAction[]).filter((a) => canTransition(a, current))
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatBRL(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return BRL.format(value)
}
