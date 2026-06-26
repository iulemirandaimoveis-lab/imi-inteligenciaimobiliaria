import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getImiSession } from '@/lib/imi-auth/server'
import { logActivity } from '@/lib/imi-auth/audit'

/**
 * IMI Console — hierarchical password reset.
 *
 * Authorization (enforced by imi.can_manage_user, executed as the caller):
 *   • SUPER_ADMIN / users.manage (Iule, master) → reset ANY user.
 *   • TEAM_MANAGER (Mateus) → reset members of teams they manage.
 *   • PROJECT_OWNER (Catel) and others → 403 (read/approve only).
 *
 * Resets to a provisional password and re-arms first access (needs_password_setup),
 * so the target sets their own password again at /users/primeiro-acesso.
 */
const Schema = z.object({
  target_user_id: z.string().uuid().optional(),
  email: z.string().email().optional(),
}).refine((d) => d.target_user_id || d.email, { message: 'Informe target_user_id ou email.' })

export async function POST(req: NextRequest) {
  try {
    const session = await getImiSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const parsed = Schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    }

    // Resolve the target imi.users row (service role — bypasses RLS).
    const imiAdmin = supabaseAdmin.schema('imi')
    let query = imiAdmin.from('users').select('id, auth_user_id, email, full_name')
    query = parsed.data.target_user_id
      ? query.eq('id', parsed.data.target_user_id)
      : query.eq('email', parsed.data.email!.trim().toLowerCase())
    const { data: target, error: targetErr } = await query.maybeSingle()
    if (targetErr || !target || !target.auth_user_id) {
      return NextResponse.json({ error: 'Usuário alvo não encontrado.' }, { status: 404 })
    }

    // Authorize via the SECURITY DEFINER helper, executed as the caller.
    const caller = await createClient()
    const { data: allowed, error: authzErr } = await caller
      .schema('imi')
      .rpc('can_manage_user', { target_user_id: target.id })
    if (authzErr || !allowed) {
      return NextResponse.json({ error: 'Sem permissão para redefinir este usuário.' }, { status: 403 })
    }

    // Reset to a provisional password + re-arm first access.
    const provisional = `Imi#${randomBytes(6).toString('hex')}`
    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(target.auth_user_id, {
      password: provisional,
      user_metadata: { needs_password_setup: true },
    })
    if (updErr) {
      return NextResponse.json({ error: 'Falha ao redefinir a senha.' }, { status: 500 })
    }

    await imiAdmin.from('users').update({ status: 'invited', metadata: { needs_password_setup: true } }).eq('id', target.id)

    await logActivity({
      userId: session.user.id,
      action: 'auth.password_reset',
      entity: 'user',
      entityId: target.id,
      metadata: { target_email: target.email, by: session.user.email },
    })

    return NextResponse.json({
      success: true,
      target: { id: target.id, email: target.email, name: target.full_name },
      provisional_password: provisional,
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno ao redefinir a senha.' }, { status: 500 })
  }
}
