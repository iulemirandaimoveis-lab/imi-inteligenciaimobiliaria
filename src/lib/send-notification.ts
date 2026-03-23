import { supabaseAdmin } from '@/lib/supabase/admin'

interface NotificationPayload {
    title: string
    message: string
    type?: 'info' | 'success' | 'warning' | 'error' | 'tracking' | 'lead' | 'system' | 'deploy'
    userId?: string | null  // null = broadcast to all
    data?: Record<string, unknown>
}

export async function sendNotification(payload: NotificationPayload) {
    try {
        const { error } = await supabaseAdmin.from('notifications').insert({
            user_id: payload.userId || null,
            type: payload.type || 'info',
            title: payload.title,
            message: payload.message,
            data: payload.data || null,
            read: false,
        })
        if (error) console.error('[notification] Failed:', error.message)
        return !error
    } catch (err) {
        console.error('[notification] Error:', err)
        return false
    }
}
