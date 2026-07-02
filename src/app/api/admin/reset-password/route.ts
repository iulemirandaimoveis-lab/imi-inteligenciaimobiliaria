import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    // getUser() valida o JWT no servidor (getSession só lê o cookie)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = adminProfile?.role?.toLowerCase() || ''
    if (!['admin', 'manager', 'super_admin', 'owner'].includes(role)) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }

    const { user_id } = await req.json()

    if (!user_id) {
      return NextResponse.json({ error: 'user_id obrigatorio' }, { status: 400 })
    }

    // 12 bytes → 16 chars base64url (~96 bits). A senha é de uso único:
    // must_reset_password força a troca no primeiro login.
    const tempPassword = crypto.randomBytes(12).toString('base64url')

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password: tempPassword }
    )

    if (authError) {
      console.error('[reset-password] Auth error:', authError)
      return NextResponse.json({ error: 'Erro ao resetar senha' }, { status: 500 })
    }

    await supabaseAdmin
      .from('profiles')
      .update({
        must_reset_password: true,
        password_reset_at: new Date().toISOString(),
        password_reset_by: user.id,
      })
      .eq('id', user_id)

    return NextResponse.json({
      success: true,
      temp_password: tempPassword,
      message: 'Senha resetada. Comunique a senha temporaria ao corretor.',
    })
  } catch (e) {
    console.error('[reset-password] Unexpected error:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
