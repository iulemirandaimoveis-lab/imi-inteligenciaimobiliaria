import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { ImiSession } from '@/lib/imi-auth/types'
import type { ProposalStatus } from '@/lib/imi-proposals/status'

export interface ProposalRow {
  id: string
  projectId: string
  projectName: string | null
  brokerId: string
  brokerName: string | null
  status: ProposalStatus
  clientName: string
  clientCpf: string | null
  clientEmail: string | null
  clientPhone: string | null
  loteamento: string | null
  unitLabel: string | null
  totalAmount: number | null
  downPayment: number | null
  installments: string | null
  formData: Record<string, any>
  attachmentUrl: string | null
  pdfUrl: string | null
  reviewedBy: string | null
  reviewerName: string | null
  reviewedAt: string | null
  decisionNote: string | null
  submittedAt: string | null
  expiresAt: string | null
  mock: boolean
  createdAt: string
  updatedAt: string
}

export interface ProposalEventRow {
  id: string
  type: string
  fromStatus: ProposalStatus | null
  toStatus: ProposalStatus | null
  note: string | null
  actorName: string | null
  createdAt: string
}

export interface ProposalsKpis {
  total: number
  open: number
  approved: number
  rejected: number
  totalVgv: number
}

const SELECT =
  'id, project_id, broker_id, status, client_name, client_cpf, client_email, client_phone, ' +
  'loteamento, unit_label, total_amount, down_payment, installments, form_data, ' +
  'attachment_url, pdf_url, reviewed_by, reviewed_at, decision_note, submitted_at, expires_at, ' +
  'mock, created_at, updated_at, ' +
  'project:projects ( name ), broker:users!proposals_broker_id_fkey ( full_name ), ' +
  'reviewer:users!proposals_reviewed_by_fkey ( full_name )'

function mapRow(r: any): ProposalRow {
  return {
    id: r.id,
    projectId: r.project_id,
    projectName: r.project?.name ?? null,
    brokerId: r.broker_id,
    brokerName: r.broker?.full_name ?? null,
    status: r.status,
    clientName: r.client_name,
    clientCpf: r.client_cpf,
    clientEmail: r.client_email,
    clientPhone: r.client_phone,
    loteamento: r.loteamento,
    unitLabel: r.unit_label,
    totalAmount: r.total_amount != null ? Number(r.total_amount) : null,
    downPayment: r.down_payment != null ? Number(r.down_payment) : null,
    installments: r.installments,
    formData: r.form_data ?? {},
    attachmentUrl: r.attachment_url,
    pdfUrl: r.pdf_url,
    reviewedBy: r.reviewed_by,
    reviewerName: r.reviewer?.full_name ?? null,
    reviewedAt: r.reviewed_at,
    decisionNote: r.decision_note,
    submittedAt: r.submitted_at,
    expiresAt: r.expires_at,
    mock: r.mock,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

/**
 * List proposals visible to the current session. RLS already scopes rows to
 * the broker's own + the projects they can read, so we just order them.
 */
export async function listProposals(_session: ImiSession): Promise<ProposalRow[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .schema('imi')
      .from('proposals')
      .select(SELECT)
      .order('created_at', { ascending: false })
      .limit(200)
    if (error || !data) return []
    return data.map(mapRow)
  } catch {
    return []
  }
}

export async function getProposal(id: string): Promise<ProposalRow | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .schema('imi')
      .from('proposals')
      .select(SELECT)
      .eq('id', id)
      .maybeSingle()
    if (error || !data) return null
    return mapRow(data)
  } catch {
    return null
  }
}

export async function getProposalEvents(proposalId: string): Promise<ProposalEventRow[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .schema('imi')
      .from('proposal_events')
      .select('id, type, from_status, to_status, note, created_at, actor:users ( full_name )')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: true })
    if (error || !data) return []
    return data.map((e: any) => ({
      id: e.id,
      type: e.type,
      fromStatus: e.from_status,
      toStatus: e.to_status,
      note: e.note,
      actorName: e.actor?.full_name ?? null,
      createdAt: e.created_at,
    }))
  } catch {
    return []
  }
}

export function computeKpis(rows: ProposalRow[]): ProposalsKpis {
  const open = rows.filter((r) => ['draft', 'submitted', 'under_review'].includes(r.status)).length
  const approved = rows.filter((r) => r.status === 'approved')
  const rejected = rows.filter((r) => r.status === 'rejected').length
  const totalVgv = approved.reduce((sum, r) => sum + (r.totalAmount ?? 0), 0)
  return { total: rows.length, open, approved: approved.length, rejected, totalVgv }
}
