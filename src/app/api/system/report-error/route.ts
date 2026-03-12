// src/app/api/system/report-error/route.ts
// Captura erros do frontend e os salva para auditoria

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { error: errorMsg, stack, page, component, userAgent, timestamp } = body

    if (!errorMsg) {
      return NextResponse.json({ error: 'error message is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Save to error_logs table (create if needed)
    const { error: dbError } = await supabase
      .from('system_error_logs')
      .insert({
        user_id: user?.id || null,
        error_message: errorMsg?.substring(0, 500),
        stack_trace: stack?.substring(0, 2000) || null,
        page_url: page?.substring(0, 500) || null,
        component_name: component?.substring(0, 200) || null,
        user_agent: userAgent?.substring(0, 500) || null,
        metadata: { timestamp },
      })

    if (dbError) {
      // Table might not exist — log to console instead
      console.error('[ErrorReport]', {
        user: user?.email,
        error: errorMsg,
        page,
        component,
        time: new Date().toISOString(),
      })
    }

    // Also create a notification for the admin
    if (user) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'system',
        title: `⚠️ Erro no frontend: ${component || page || 'desconhecido'}`,
        message: `${errorMsg?.substring(0, 200)} — Página: ${page || 'N/A'}`,
        data: { error: errorMsg, stack: stack?.substring(0, 500), page, component },
        read: false,
      }) // fire-and-forget — errors already logged above
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[ErrorReport] Failed:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
