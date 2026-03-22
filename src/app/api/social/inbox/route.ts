/**
 * GET /api/social/inbox
 * Unified inbox — fetches messages from ALL platforms (Instagram, Facebook, WhatsApp, Twitter)
 * Supports filters: ?platform=...&status=...&limit=50
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const platform = req.nextUrl.searchParams.get('platform')
    const status = req.nextUrl.searchParams.get('status')
    const limit = Number(req.nextUrl.searchParams.get('limit') || '50')

    try {
        let query = supabase
            .from('social_messages')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .limit(limit)

        if (platform) {
            const validPlatforms = ['instagram', 'facebook', 'whatsapp', 'twitter']
            if (!validPlatforms.includes(platform)) {
                return NextResponse.json(
                    { error: `Plataforma inválida. Use: ${validPlatforms.join(', ')}` },
                    { status: 400 },
                )
            }
            query = query.eq('platform', platform)
        }

        if (status) {
            const validStatuses = ['received', 'read', 'replied']
            if (!validStatuses.includes(status)) {
                return NextResponse.json(
                    { error: `Status inválido. Use: ${validStatuses.join(', ')}` },
                    { status: 400 },
                )
            }
            query = query.eq('status', status)
        }

        const { data: messages, count, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            messages: messages || [],
            total: count || 0,
        })
    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erro ao buscar mensagens' },
            { status: 500 },
        )
    }
}
