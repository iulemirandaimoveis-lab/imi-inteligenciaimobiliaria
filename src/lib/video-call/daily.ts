import 'server-only'

/**
 * Daily.co REST client — cria salas de vídeo chamada efêmeras para o CTA
 * "Vídeo chamada com o corretor" (réplica de um Meet, sem e-mail: o cliente
 * entra pelo site, o corretor recebe o link por WhatsApp).
 *
 * Best-effort e configurável: sem DAILY_API_KEY, `createDailyRoom` retorna
 * null e o chamador deve cair no fallback de WhatsApp — nunca lança.
 *
 * Env:
 *   DAILY_API_KEY — obtida em https://dashboard.daily.co/developers
 */

export interface DailyRoom {
  url: string
  name: string
}

function readApiKey(): string | null {
  return process.env.DAILY_API_KEY || null
}

export function isDailyConfigured(): boolean {
  return !!readApiKey()
}

/**
 * Cria uma sala Daily.co que expira sozinha (`exp`) — não precisamos limpar
 * depois. `nbf`/`exp` limitam a janela de uso a poucas horas.
 */
export async function createDailyRoom(opts: { namePrefix?: string; expMinutes?: number } = {}): Promise<DailyRoom | null> {
  const apiKey = readApiKey()
  if (!apiKey) return null

  const expMinutes = opts.expMinutes ?? 60
  const exp = Math.floor(Date.now() / 1000) + expMinutes * 60

  try {
    const res = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        privacy: 'public',
        properties: {
          exp,
          enable_chat: true,
          enable_screenshare: true,
          eject_at_room_exp: true,
        },
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { url?: string; name?: string }
    if (!data.url || !data.name) return null
    return { url: data.url, name: data.name }
  } catch {
    return null
  }
}
