import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// POST /api/bug-reports — Create a new bug report
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, severity, category, screenshot_urls, page_url, console_errors } = body

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Título e descrição são obrigatórios' }, { status: 400 })
    }

    const validSeverities = ['low', 'medium', 'high', 'critical']
    const validCategories = ['geral', 'visual', 'funcionalidade', 'performance', 'mobile', 'dados', 'seguranca']

    // Get reporter profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single()

    const reporterName = profile?.name || profile?.email || user.email || 'Usuário'

    // Insert bug report
    const { data: report, error: insertErr } = await supabaseAdmin
      .from('bug_reports')
      .insert({
        created_by: user.id,
        title: title.trim().slice(0, 300),
        description: description.trim().slice(0, 5000),
        severity: validSeverities.includes(severity) ? severity : 'medium',
        category: validCategories.includes(category) ? category : 'geral',
        screenshot_urls: Array.isArray(screenshot_urls) ? screenshot_urls.slice(0, 5) : [],
        page_url: page_url?.slice(0, 500) || null,
        user_agent: req.headers.get('user-agent')?.slice(0, 500) || null,
        console_errors: console_errors?.slice(0, 5000) || null,
      })
      .select('id, title, severity')
      .single()

    if (insertErr) {
      console.error('[bug-reports/POST] Insert error:', insertErr.message)
      return NextResponse.json({ error: 'Erro ao salvar relatório' }, { status: 500 })
    }

    // Notify admin (iule@imi.com) — always
    const severityEmoji: Record<string, string> = {
      critical: '🔴', high: '🟠', medium: '🟡', low: '🔵',
    }
    const emoji = severityEmoji[report.severity] || '🟡'

    // Get admin ID
    const { data: admin } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', 'iule@imi.com')
      .single()

    if (admin) {
      await createNotification({
        userId: admin.id,
        type: 'bug_report',
        title: `${emoji} Bug Report: ${report.title.slice(0, 80)}`,
        message: `${reporterName} reportou: ${description.slice(0, 200)}`,
        data: { bugId: report.id, severity: report.severity, reportedBy: reporterName },
        url: '/backoffice/settings?tab=bugs',
      }).catch((err) => console.error('[bug-reports] Notification failed:', err))
    }

    return NextResponse.json({ success: true, data: report })
  } catch (err) {
    console.error('[bug-reports/POST] Unexpected:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// GET /api/bug-reports — List bug reports (own for users, all for admin)
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Check if admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile && ['admin', 'owner', 'super_admin'].includes(profile.role)

    let query = supabaseAdmin
      .from('bug_reports')
      .select('*, profiles:created_by(name, email, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!isAdmin) {
      query = query.eq('created_by', user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('[bug-reports/GET] Error:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar relatórios' }, { status: 500 })
    }

    return NextResponse.json({ data: data || [], isAdmin })
  } catch (err) {
    console.error('[bug-reports/GET] Unexpected:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
