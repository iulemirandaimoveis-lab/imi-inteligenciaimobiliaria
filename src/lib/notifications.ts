import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendWebPush } from '@/lib/web-push'

export type NotificationType =
  | 'lead_novo' | 'lead_atualizado'
  | 'avaliacao_nova' | 'avaliacao_atualizada'
  | 'agenda_novo' | 'agenda_atualizado'
  | 'imovel_novo' | 'imovel_atualizado'
  | 'mensagem_nova'
  | 'sistema'

export interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  url?: string
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data ?? {},
      read: false,
    })

    // Trigger real browser push notification
    await sendWebPush(params.userId, {
      title: params.title,
      body: params.message,
      url: params.url || '/backoffice/hoje',
    }).catch(() => {}) // best-effort
  } catch (err) {
    console.error('[notifications] Failed to create notification:', err)
  }
}
