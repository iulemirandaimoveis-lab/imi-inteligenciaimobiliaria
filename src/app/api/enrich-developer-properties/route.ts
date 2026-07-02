// src/app/api/enrich-developer-properties/route.ts
// Proxy to Supabase Edge Function: enrich-developer-properties
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    // Autorização via getUser() (valida o JWT no servidor); a sessão é lida
    // apenas para encaminhar o access_token à Edge Function.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()

    const edgeFnUrl = `${SUPABASE_URL}/functions/v1/enrich-developer-properties`
    const response = await fetch(edgeFnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        ...body,
        triggered_by: session.user.id,
      }),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
