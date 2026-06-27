import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getImiSession } from '@/lib/imi-auth/server'
import { logActivity } from '@/lib/imi-auth/audit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/users/admin/cleanup — Master limpa dados mockados (mock=true).
 * Cobre as tabelas do ecossistema que possuem a flag `mock`. Best-effort por
 * tabela: tabelas ainda não migradas simplesmente retornam erro e são ignoradas.
 * Gate: SUPER_ADMIN. RLS de cada tabela reforça (delete → is_super_admin).
 */
export async function POST(_req: NextRequest) {
  try {
    const session = await getImiSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    if (!session.user.isSuper) {
      return NextResponse.json({ error: 'Apenas o Master pode limpar dados mockados.' }, { status: 403 })
    }

    const supabase = await createClient()
    const imi = supabase.schema('imi')
    const tables = ['proposals', 'goals'] as const
    const removed: Record<string, number> = {}

    for (const table of tables) {
      try {
        const { data, error } = await imi.from(table).delete().eq('mock', true).select('id')
        if (!error && data) removed[table] = data.length
      } catch {
        // table not present on this environment — skip
      }
    }

    await logActivity({
      userId: session.user.id,
      action: 'admin.cleanup_mock',
      entity: 'system',
      metadata: removed,
    })

    return NextResponse.json({ success: true, removed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro interno.' }, { status: 500 })
  }
}
