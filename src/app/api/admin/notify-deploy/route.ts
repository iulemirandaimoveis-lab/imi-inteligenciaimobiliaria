import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/notify-deploy
 * Notifies all admin users about a new deployment or feature update.
 * Protected by CRON_SECRET or admin session.
 *
 * Body: { title, message, type?: 'deploy' | 'feature' | 'bugfix', url? }
 */
export async function POST(request: Request) {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Allow CRON_SECRET bearer or check if caller is admin
    let authorized = false
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
        authorized = true
    } else {
        // Check admin session
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()
            const role = profile?.role?.toUpperCase() || ''
            authorized = ['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(role)
        }
    }

    if (!authorized) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const {
        title = 'IMI Atualizado',
        message = 'Uma nova versão da plataforma foi publicada.',
        type = 'deploy',
        url = '/backoffice/hoje',
        notifyAllUsers = false,
    } = body

    const emoji = type === 'bugfix' ? '🐛' : type === 'feature' ? '✨' : '🚀'
    const finalTitle = `${emoji} ${title}`

    if (notifyAllUsers) {
        // Broadcast to all users
        await createNotification({
            userId: null,
            type: 'sistema',
            title: finalTitle,
            message,
            url,
        })
    } else {
        // Notify admins only
        const { data: admins } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .in('role', ['admin', 'ADMIN', 'super_admin', 'SUPER_ADMIN', 'owner', 'OWNER'])

        await Promise.all(
            (admins ?? []).map(admin =>
                createNotification({
                    userId: admin.id,
                    type: 'sistema',
                    title: finalTitle,
                    message,
                    url,
                })
            )
        )
    }

    return NextResponse.json({ success: true, sent: notifyAllUsers ? 'broadcast' : 'admins' })
}
