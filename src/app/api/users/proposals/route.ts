import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getImiSession, sessionHasPermission } from '@/lib/imi-auth/server'
import { PERMISSIONS } from '@/lib/imi-auth/rbac'
import { logActivity } from '@/lib/imi-auth/audit'
import { deriveProposalSummary } from '@/lib/imi-proposals/template'

export const dynamic = 'force-dynamic'

const Schema = z.object({
  project_id: z.string().uuid(),
  template_key: z.string().min(1).default('mano-imoveis-compra'),
  form_data: z.record(z.any()).default({}),
  attachment_url: z.string().url().nullish(),
  attachment_path: z.string().nullish(),
  submit: z.boolean().default(false),
  mock: z.boolean().default(false),
})

/**
 * POST /api/users/proposals — corretor cria uma proposta (rascunho ou enviada).
 * Autorização: proposals.manage. RLS garante broker_id = usuário atual.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getImiSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    if (!sessionHasPermission(session, PERMISSIONS.PROPOSALS_MANAGE)) {
      return NextResponse.json({ error: 'Sem permissão para criar propostas.' }, { status: 403 })
    }

    const parsed = Schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    }
    const { project_id, template_key, form_data, attachment_url, attachment_path, submit, mock } = parsed.data

    // O corretor só cria proposta em projeto do qual participa.
    if (!session.projects.some((p) => p.id === project_id)) {
      return NextResponse.json({ error: 'Empreendimento inválido para este usuário.' }, { status: 403 })
    }

    const supabase = await createClient()
    const imi = supabase.schema('imi')

    // Resolve o template (id + horas de reserva).
    const { data: tpl } = await imi
      .from('proposal_templates')
      .select('id, schema')
      .eq('key', template_key)
      .maybeSingle()

    const summary = deriveProposalSummary(form_data)
    const now = new Date()
    const reserveHours = Number(tpl?.schema?.reserveHours) || 24
    const expiresAt = submit ? new Date(now.getTime() + reserveHours * 3600_000).toISOString() : null

    const { data: inserted, error: insErr } = await imi
      .from('proposals')
      .insert({
        project_id,
        template_id: tpl?.id ?? null,
        broker_id: session.user.id,
        status: submit ? 'submitted' : 'draft',
        ...summary,
        form_data,
        attachment_url: attachment_url ?? null,
        attachment_path: attachment_path ?? null,
        submitted_at: submit ? now.toISOString() : null,
        expires_at: expiresAt,
        mock,
      })
      .select('id, status')
      .single()

    if (insErr || !inserted) {
      return NextResponse.json({ error: insErr?.message ?? 'Falha ao criar proposta.' }, { status: 500 })
    }

    // Eventos (histórico).
    const events: any[] = [
      { proposal_id: inserted.id, actor_id: session.user.id, type: 'created', to_status: 'draft' },
    ]
    if (submit) {
      events.push({
        proposal_id: inserted.id,
        actor_id: session.user.id,
        type: 'submitted',
        from_status: 'draft',
        to_status: 'submitted',
      })
    }
    await imi.from('proposal_events').insert(events)

    await logActivity({
      userId: session.user.id,
      projectId: project_id,
      action: submit ? 'proposal.submit' : 'proposal.create',
      entity: 'proposal',
      entityId: inserted.id,
      metadata: { client: summary.client_name, mock },
    })

    return NextResponse.json({ success: true, id: inserted.id, status: inserted.status })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro interno ao criar proposta.' },
      { status: 500 }
    )
  }
}
