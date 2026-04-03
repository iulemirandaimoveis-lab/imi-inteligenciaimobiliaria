/**
 * @deprecated Use createNotification() from '@/lib/notifications' instead.
 * This module is kept for backwards compatibility only.
 */
import { createNotification, type NotificationType } from '@/lib/notifications'

interface NotificationPayload {
    title: string
    message: string
    type?: string
    userId?: string | null
    data?: Record<string, unknown>
    url?: string
}

const TYPE_MAP: Record<string, NotificationType> = {
    lead: 'lead_novo',
    deploy: 'sistema',
    system: 'sistema',
    info: 'sistema',
    success: 'sistema',
    warning: 'sistema',
    error: 'sistema',
    tracking: 'proposta_atualizada',
}

export async function sendNotification(payload: NotificationPayload) {
    const mappedType: NotificationType = TYPE_MAP[payload.type || 'info'] || 'sistema'
    await createNotification({
        userId: payload.userId ?? null,
        type: mappedType,
        title: payload.title,
        message: payload.message,
        data: payload.data,
        url: payload.url,
    })
}
