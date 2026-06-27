import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getImiSession, sessionHasPermission } from '@/lib/imi-auth/server'
import { PERMISSIONS } from '@/lib/imi-auth/rbac'
import { logActivity } from '@/lib/imi-auth/audit'
import { notifyProposalDecision } from '@/lib/notifications/proposal-notifications'
import {
  canTransition,
  nextStatus,
  type ProposalAction,
  type ProposalStatus,
} from '@/lib/imi-proposals/status'

export const dynamic = 'force-dynamic'

const Schema = z.object({
  action: z.enum(['submit', 'review', 'approve', 'reject', 'cancel', 'reopen']),
  note: z.string().max(2000).optional(),
})

/** Approver actions require proposals.approve; broker actions require manage. */
const APPROVER_ACTIONS: ProposalAction[] = ['review', 'approve', 'reject']

/**
 * PATCH /api/users/proposals/[id] — transição de status (workflow).
 *   • submit/cancel/reopen → corretor dono (proposals.manage)
 *   • review/approve/reject → responsável do produto / gestor (proposals.approve)
 * RLS reforça a mesma regra; aqui validamos a transição e registramos auditoria.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getImiSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const parsed = Schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    }
    const action = parsed.data.action as ProposalAction
    const note = parsed.data.note?.trim() || null

    const supabase = await createClient()
    const imi = supabase.schema('imi')

    const { data: proposal, error: getErr } = await imi
      .from('proposals')
      .select('id, project_id, broker_id, status, template_id, client_name, project:projects ( name )')
      .eq('id', params.id)
      .maybeSingle()
    if (getErr || !proposal) {
      return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 })
    }

    const current = proposal.status as ProposalStatus
    if (!canTransition(action, current)) {
      return NextResponse.json(
        { error: `Transição inválida: ${action} a partir de "${current}".` },
        { status: 409 }
      )
    }

    // Authorization by action class.
    const isApprover = APPROVER_ACTIONS.includes(action)
    if (isApprover) {
      if (!sessionHasPermission(session, PERMISSIONS.PROPOSALS_APPROVE)) {
        return NextResponse.json({ error: 'Sem permissão para aprovar/rejeitar.' }, { status: 403 })
      }
    } else {
      const isOwner = proposal.broker_id === session.user.id
      const canManage = sessionHasPermission(session, PERMISSIONS.PROPOSALS_MANAGE)
      if (!(isOwner && canManage) && !session.user.isSuper) {
        return NextResponse.json({ error: 'Apenas o corretor responsável pode fazer isso.' }, { status: 403 })
      }
    }

    const to = nextStatus(action)
    const patch: Record<string, unknown> = { status: to }

    if (action === 'submit') {
      // (Re)inicia a janela de reserva de 24h conforme o template.
      let reserveHours = 24
      if (proposal.template_id) {
        const { data: tpl } = await imi
          .from('proposal_templates')
          .select('schema')
          .eq('id', proposal.template_id)
          .maybeSingle()
        reserveHours = Number(tpl?.schema?.reserveHours) || 24
      }
      patch.submitted_at = new Date().toISOString()
      patch.expires_at = new Date(Date.now() + reserveHours * 3600_000).toISOString()
    }
    if (action === 'approve' || action === 'reject') {
      patch.reviewed_by = session.user.id
      patch.reviewed_at = new Date().toISOString()
      patch.decision_note = note
    }
    if (action === 'reopen') {
      patch.reviewed_by = null
      patch.reviewed_at = null
      patch.decision_note = null
      patch.submitted_at = null
      patch.expires_at = null
    }

    const { error: updErr } = await imi.from('proposals').update(patch).eq('id', params.id)
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    await imi.from('proposal_events').insert({
      proposal_id: params.id,
      actor_id: session.user.id,
      type: action,
      from_status: current,
      to_status: to,
      note,
    })

    await logActivity({
      userId: session.user.id,
      projectId: proposal.project_id,
      action: `proposal.${action}`,
      entity: 'proposal',
      entityId: params.id,
      metadata: { from: current, to, note },
    })

    // Notifica o corretor via WhatsApp na decisão (best-effort).
    if (action === 'approve' || action === 'reject') {
      await notifyProposalDecision({
        brokerId: proposal.broker_id,
        clientName: (proposal as any).client_name ?? 'Cliente',
        projectName: (proposal as any).project?.name ?? null,
        decision: action === 'approve' ? 'approved' : 'rejected',
        note,
      })
    }

    return NextResponse.json({ success: true, status: to })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro interno ao atualizar proposta.' },
      { status: 500 }
    )
  }
}

/** DELETE — limpeza de dados mockados (apenas SUPER_ADMIN; RLS reforça). */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getImiSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    if (!session.user.isSuper) {
      return NextResponse.json({ error: 'Apenas o Master pode excluir propostas.' }, { status: 403 })
    }
    const supabase = await createClient()
    const { error } = await supabase.schema('imi').from('proposals').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity({
      userId: session.user.id,
      action: 'proposal.delete',
      entity: 'proposal',
      entityId: params.id,
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro interno.' },
      { status: 500 }
    )
  }
}
