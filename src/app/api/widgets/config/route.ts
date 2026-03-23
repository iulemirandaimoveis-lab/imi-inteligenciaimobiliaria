// GET  /api/widgets/config  — backoffice: all widgets with enabled status
// PUT  /api/widgets/config  — backoffice: update one or many widgets
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { data, error } = await supabase
            .from('widgets_config')
            .select('*')
            .order('display_order', { ascending: true })

        if (error) {
            // Table might not exist — return empty array gracefully
            console.warn('widgets_config query error:', error.message)
            return NextResponse.json([], {
                headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
            })
        }
        return NextResponse.json(data ?? [], {
            headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800' },
        })
    } catch {
        return NextResponse.json([], { status: 200 })
    }
}

export async function PUT(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { widget_id: string; enabled?: boolean; display_order?: number; config?: Record<string, unknown> }[]

    if (!Array.isArray(body)) return NextResponse.json({ error: 'Expected array' }, { status: 400 })

    const results = await Promise.allSettled(
        body.map(({ widget_id, ...updates }) =>
            supabase
                .from('widgets_config')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('widget_id', widget_id)
        )
    )

    const errors = results.filter(r => r.status === 'rejected')
    if (errors.length) return NextResponse.json({ error: 'Some updates failed' }, { status: 500 })

    return NextResponse.json({ ok: true })
}
