import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/organizacao/members
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: myMembership } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    if (!myMembership) {
      return NextResponse.json({ members: [] })
    }

    const { data: members, error } = await supabase
      .from('tenant_users')
      .select('id, user_id, role, created_at')
      .eq('tenant_id', myMembership.tenant_id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ members: members ?? [] })
  } catch (err) {
    console.error('[api/organizacao/members GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST /api/organizacao/members — invite by user_id (simplified — in production use email invite flow)
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: myMembership } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .single()

    if (!myMembership) {
      return NextResponse.json({ error: 'Sem permissão para convidar membros' }, { status: 403 })
    }

    const { email, role = 'member' } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'email é obrigatório' }, { status: 400 })
    }

    // Look up user by email in auth.users (admin API)
    const supabaseAdmin = await createClient()
    const { data: { users }, error: searchErr } = await (supabaseAdmin as any).auth.admin.listUsers()

    const targetUser = users?.find((u: any) => u.email === email)

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado. O usuário precisa ter uma conta IMI.' }, { status: 404 })
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', myMembership.tenant_id)
      .eq('user_id', targetUser.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Usuário já é membro desta organização' }, { status: 409 })
    }

    const { data: member, error } = await supabase
      .from('tenant_users')
      .insert({
        tenant_id: myMembership.tenant_id,
        user_id: targetUser.id,
        role,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ member }, { status: 201 })
  } catch (err) {
    console.error('[api/organizacao/members POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE /api/organizacao/members?member_id=xxx
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: myMembership } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .single()

    if (!myMembership) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('member_id')

    if (!memberId) {
      return NextResponse.json({ error: 'member_id é obrigatório' }, { status: 400 })
    }

    // Cannot remove owner
    const { data: target } = await supabase
      .from('tenant_users')
      .select('role, user_id')
      .eq('id', memberId)
      .eq('tenant_id', myMembership.tenant_id)
      .single()

    if (!target) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    if (target.role === 'owner') {
      return NextResponse.json({ error: 'Não é possível remover o proprietário' }, { status: 400 })
    }

    const { error } = await supabase
      .from('tenant_users')
      .delete()
      .eq('id', memberId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/organizacao/members DELETE]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
