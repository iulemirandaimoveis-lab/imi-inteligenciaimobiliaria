import { supabaseAdmin } from '@/lib/supabase/admin'

export type NotificationType =
  | 'lead_novo' | 'lead_atualizado'
  | 'avaliacao_nova' | 'avaliacao_atualizada'
  | 'agenda_novo' | 'agenda_atualizado'
  | 'imovel_novo' | 'imovel_atualizado'
  | 'sistema'

export interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
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
  } catch (err) {
    console.error('[notifications] Failed to create notification:', err)
  }
}
