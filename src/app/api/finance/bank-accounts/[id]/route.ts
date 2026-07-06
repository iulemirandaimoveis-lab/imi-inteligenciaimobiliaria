import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isFinanceAdmin } from '@/lib/finance/auth'

const BankAccountPatchSchema = z.object({
  label: z.string().min(1).optional(),
  holder_name: z.string().optional(),
  holder_document: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  provider: z.enum(['manual', 'btg_empresas_api']).optional(),
  env_prefix: z.string().nullable().optional(),
  active: z.boolean().optional(),
  notes: z.string().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!(await isFinanceAdmin(user.id))) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  let rawBody: unknown
  try { rawBody = await request.json() } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  const parsed = BankAccountPatchSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('bank_accounts')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
