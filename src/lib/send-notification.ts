import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendWebPush, sendWebPushToAll } from '@/lib/web-push'

interface NotificationPayload {
    title: string
    message: string
    type?: 'info' | 'success' | 'warning' | 'error' | 'tracking' | 'lead' | 'system' | 'deploy'
    userId?: string | null  // null = broadcast to all
    data?: Record<string, unknown>
    url?: string            // deep link for push notification click
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

        // 🔔 Trigger real browser push notification
        const pushPayload = {
            title: payload.title,
            body: payload.message,
            url: payload.url || '/backoffice/hoje',
        }

        try {
            if (payload.userId) {
                await sendWebPush(payload.userId, pushPayload)
            } else {
                // Broadcast to all subscribed users
                await sendWebPushToAll(pushPayload)
            }
        } catch (pushErr) {
            // Push is best-effort — don't fail the whole notification
            console.error('[notification] Push delivery error:', pushErr)
        }

        return !error
    } catch (err) {
        console.error('[notification] Error:', err)
        return false
    }
}
