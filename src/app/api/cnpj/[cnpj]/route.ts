import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { lookupCnpj } from '@/services/brazil-apis/cnpj'

export async function GET(_req: Request, { params }: { params: Promise<{ cnpj: string }> }) {
  const { cnpj } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await lookupCnpj(cnpj)
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar CNPJ'
    const status = message.includes('14 dígitos') ? 400 : 404
    return NextResponse.json({ error: message }, { status })
  }
}
