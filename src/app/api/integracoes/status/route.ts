import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('integration_configs')
    .select('integration_id, status, config, updated_at')

  if (error) {
    // Table may not exist yet — return empty gracefully
    return NextResponse.json({ data: [] })
  }

  return NextResponse.json({ data: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { integration_id, config, status } = body

  const { data, error } = await supabase
    .from('integration_configs')
    .upsert({
      integration_id,
      config: config || {},
      status: status || 'configurado',
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }, { onConflict: 'integration_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
