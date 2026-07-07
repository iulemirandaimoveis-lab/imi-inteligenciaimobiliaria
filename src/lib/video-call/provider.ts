import 'server-only'

import { createDailyRoom, isDailyConfigured } from './daily'
import { createJitsiRoom } from './jitsi'

/**
 * Orquestrador de vídeo chamada. Escolhe o melhor provedor disponível e sempre
 * devolve uma sala utilizável — o CTA nunca fica "indisponível" por falta de
 * configuração:
 *
 *   1. Daily.co  — se DAILY_API_KEY estiver configurada (melhor controle/qualidade).
 *   2. Jitsi     — padrão zero-config, grátis e sem chave (fallback sempre disponível).
 *
 * Só retorna null quando a vídeo chamada é explicitamente desligada
 * (VIDEO_CALL_DISABLED=1), caso em que o chamador cai no WhatsApp.
 */

export type VideoProvider = 'daily' | 'jitsi'

export interface VideoRoom {
  url: string
  name: string
  provider: VideoProvider
}

/** True a menos que a vídeo chamada seja explicitamente desligada por env. */
export function isVideoCallEnabled(): boolean {
  return process.env.VIDEO_CALL_DISABLED !== '1'
}

export async function createVideoRoom(
  opts: { expMinutes?: number; namePrefix?: string } = {}
): Promise<VideoRoom | null> {
  if (!isVideoCallEnabled()) return null

  // Preferência: Daily.co quando configurado.
  if (isDailyConfigured()) {
    const room = await createDailyRoom({ expMinutes: opts.expMinutes })
    if (room) return { ...room, provider: 'daily' }
    // Daily configurado mas indisponível agora → cai para Jitsi em vez de
    // derrubar o CTA.
  }

  // Fallback universal: Jitsi (sem chave, sem rede).
  const jitsi = createJitsiRoom({ namePrefix: opts.namePrefix })
  return { ...jitsi, provider: 'jitsi' }
}
