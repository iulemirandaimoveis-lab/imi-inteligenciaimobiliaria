import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * IMI Console — FIRST ACCESS (primeiro acesso).
 *
 * Mirrors the backoffice flow: a user signs in with the provisional password
 * (from the seed / an admin reset) and sets their own password. On success the
 * imi.users row is flipped 'invited' → 'active' and the setup flag cleared.
 */
const Schema = z.object({
  email: z.string().email(),
  temp_password: z.string().min(1),
  new_password: z.string().min(8, 'A nova senha deve ter no mínimo 8 caracteres.'),
})

export async function POST(req: NextRequest) {
  try {
    const parsed = Schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    }
    const email = parsed.data.email.trim().toLowerCase()
    const { temp_password, new_password } = parsed.data

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) {
      return NextResponse.json({ error: 'Configuração de autenticação ausente.' }, { status: 500 })
    }

    // 1. Verify the provisional credentials.
    const supabaseAnon = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: signIn, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password: temp_password,
    })
    if (signInError || !signIn.user) {
      return NextResponse.json({ error: 'E-mail ou senha provisória inválidos.' }, { status: 401 })
    }

    const userId = signIn.user.id

    // 2. Set the real password.
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: new_password,
      email_confirm: true,
      user_metadata: { ...(signIn.user.user_metadata ?? {}), needs_password_setup: false },
    })
    if (updateError) {
      return NextResponse.json({ error: 'Não foi possível definir a senha.' }, { status: 500 })
    }

    // 3. Activate the imi.users row.
    await supabaseAdmin
      .schema('imi')
      .from('users')
      .update({ status: 'active', metadata: { needs_password_setup: false } })
      .eq('auth_user_id', userId)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno ao processar primeiro acesso.' }, { status: 500 })
  }
}
