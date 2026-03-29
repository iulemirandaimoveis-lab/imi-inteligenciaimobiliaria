import { createClient as createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { new_password } = await req.json()

    if (!new_password || new_password.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter no minimo 8 caracteres' },
        { status: 400 }
      )
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      session.user.id,
      { password: new_password }
    )

    if (authError) {
      return NextResponse.json({ error: 'Erro ao atualizar senha' }, { status: 500 })
    }

    await supabaseAdmin
      .from('profiles')
      .update({ must_reset_password: false, first_login: false })
      .eq('id', session.user.id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
