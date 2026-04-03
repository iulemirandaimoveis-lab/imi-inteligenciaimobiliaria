import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// PATCH /api/bug-reports/[id] — Admin updates status/notes
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Admin check
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'owner', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await req.json()
    const { status, admin_notes } = body

    const validStatuses = ['open', 'investigating', 'in_progress', 'resolved', 'wont_fix', 'closed']
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (status && validStatuses.includes(status)) {
      updates.status = status
      if (['resolved', 'closed', 'wont_fix'].includes(status)) {
        updates.resolved_at = new Date().toISOString()
        updates.resolved_by = user.id
      }
    }

    if (admin_notes !== undefined) {
      updates.admin_notes = admin_notes?.slice(0, 5000) || null
    }

    const { data, error } = await supabaseAdmin
      .from('bug_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[bug-reports/PATCH] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
