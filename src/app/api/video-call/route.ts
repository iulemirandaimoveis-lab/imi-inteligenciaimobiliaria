import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createDailyRoom, isDailyConfigured } from '@/lib/video-call/daily'
import { sendWhatsAppText } from '@/lib/notifications/whatsapp'
import { rateLimit, getClientIP } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const Schema = z.object({
  brokerName: z.string().min(1),
  brokerPhone: z.string().min(8),
  clientName: z.string().optional().nullable(),
  context: z.string().max(200).optional().nullable(),
})

/**
 * POST /api/video-call — cria uma sala de vídeo chamada ao vivo (Daily.co) e
 * avisa o corretor por WhatsApp com o link, sem precisar de e-mail/cadastro —
 * "réplica de um Meet" acionada direto do site.
 *
 * Rota pública (o cliente ainda não está logado nesse ponto do funil).
 * Best-effort no aviso ao corretor: mesmo que o WhatsApp falhe, devolvemos a
 * sala para o cliente entrar — ele também recebe o link para compartilhar.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const rl = await rateLimit(`video-call:${ip}`, { limit: 5, windowMs: 60_000 })
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições. Aguarde um minuto.' }, { status: 429 })
  }

  if (!isDailyConfigured()) {
    return NextResponse.json(
      { error: 'Vídeo chamada indisponível no momento. Fale com o corretor pelo WhatsApp.' },
      { status: 503 }
    )
  }

  const parsed = Schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }
  const { brokerName, brokerPhone, clientName, context } = parsed.data

  const room = await createDailyRoom({ expMinutes: 60 })
  if (!room) {
    return NextResponse.json(
      { error: 'Não foi possível criar a sala agora. Fale com o corretor pelo WhatsApp.' },
      { status: 503 }
    )
  }

  const who = clientName?.trim() || 'Um cliente do site'
  const msg =
    `📹 ${who} quer falar agora por vídeo chamada${context ? ` sobre ${context}` : ''}.\n\n` +
    `Entre pelo link (não precisa instalar nada):\n${room.url}`
  await sendWhatsAppText(brokerPhone, msg).catch(() => {})

  return NextResponse.json({ roomUrl: room.url, brokerName })
}
