import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendWebPush } from '@/lib/web-push'

export type NotificationType =
  | 'lead_novo' | 'lead_atualizado'
  | 'avaliacao_nova' | 'avaliacao_atualizada'
  | 'agenda_novo' | 'agenda_atualizado'
  | 'imovel_novo' | 'imovel_atualizado'
  | 'mensagem_nova'
  | 'proposta_nova' | 'proposta_atualizada'
  | 'bug_report'
  | 'sistema'

export interface CreateNotificationParams {
  userId: string | null  // null = broadcast to all users
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  url?: string
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: params.userId || null,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data ?? {},
      read: false,
    })

    if (process.env.NODE_ENV === 'test') return

    // Trigger real browser push notification
    const pushPayload = {
      title: params.title,
      body: params.message,
      url: params.url || '/backoffice/hoje',
    }

    if (params.userId) {
      await sendWebPush(params.userId, pushPayload).catch(() => {})
      // Always CC admin on all notifications
      try {
        const { data: admin } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', 'iule@imi.com')
          .single()
        if (admin && params.userId !== admin.id) {
          await sendWebPush(admin.id, pushPayload).catch(() => {})
        }
      } catch { /* admin lookup failed — non-blocking */ }
    } else {
      // Broadcast — import sendWebPushToAll dynamically to keep import light
      const { sendWebPushToAll } = await import('@/lib/web-push')
      await sendWebPushToAll(pushPayload).catch(() => {})
    }
  } catch (err) {
    console.error('[notifications] Failed to create notification:', err)
  }
}
