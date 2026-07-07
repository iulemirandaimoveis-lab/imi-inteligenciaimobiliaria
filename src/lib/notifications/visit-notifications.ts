import 'server-only'
import { sendWhatsAppText, sendWhatsAppFile, sendWhatsAppBatch } from './whatsapp'
import { formatVisitWhen } from '@/lib/scheduling/availability'
import type { VisitDocument, VisitMode } from '@/lib/scheduling/types'

/**
 * Notificações do agendamento de visita. Best-effort: nunca lança no caminho da
 * request. Envia:
 *  • confirmação ao CLIENTE (com data/hora e canal de contato do corretor);
 *  • alerta ao CORRETOR (com dados do cliente, documento anexado e convite .ics);
 *  • (opcional) espelha para uma lista extra de telefones da equipe.
 */

export interface VisitNotificationInput {
  clientName: string
  clientPhone: string
  clientEmail?: string | null
  brokerName: string
  brokerPhone?: string | null
  developmentName?: string | null
  whenISO: string
  mode: VisitMode
  videoRoomUrl?: string | null
  documents?: VisitDocument[] | null
  /** URL assinada do convite .ics no storage (para anexar no WhatsApp). */
  icsUrl?: string | null
  /** Telefones extra da equipe a espelhar (gestores, responsável do produto). */
  teamPhones?: string[]
}

export interface VisitNotificationResult {
  clientNotified: boolean
  brokerNotified: boolean
  teamNotified: number
}

export async function notifyVisitBooking(
  input: VisitNotificationInput,
): Promise<VisitNotificationResult> {
  const result: VisitNotificationResult = { clientNotified: false, brokerNotified: false, teamNotified: 0 }
  const when = formatVisitWhen(input.whenISO)
  const local = [input.developmentName].filter(Boolean).join('')
  const modoLabel = input.mode === 'video' ? 'Vídeo chamada' : 'Visita presencial'

  try {
    // 1) Confirmação ao cliente.
    const clientMsg =
      `Olá, ${input.clientName}! ✅ Sua *${modoLabel.toLowerCase()}* está agendada.\n\n` +
      `🗓️ *${when}*` +
      (local ? `\n🏡 ${local}` : '') +
      `\n👤 Corretor: ${input.brokerName}` +
      (input.brokerPhone ? `\n📱 ${input.brokerPhone}` : '') +
      (input.mode === 'video' && input.videoRoomUrl
        ? `\n\n📹 Link da vídeo chamada (entre na hora marcada):\n${input.videoRoomUrl}`
        : '') +
      `\n\nAdicione ao seu calendário pelo convite anexo. Até lá! 🤝`
    const cRes = await sendWhatsAppText(input.clientPhone, clientMsg)
    result.clientNotified = cRes.ok

    // Convite .ics para o cliente (best-effort).
    if (input.icsUrl) {
      await sendWhatsAppFile(input.clientPhone, {
        url: input.icsUrl,
        filename: 'visita.ics',
        caption: 'Adicione a visita ao seu calendário',
      }).catch(() => {})
    }

    // 2) Alerta ao corretor.
    const docs = (input.documents ?? []).filter((d) => d?.url)
    const docsBlock =
      docs.length > 0
        ? `\n\n📎 *Documento(s) do cliente (${docs.length})*\n` +
          docs.map((d, i) => `${i + 1}. ${d.name}\n${d.url}`).join('\n')
        : ''
    const brokerMsg =
      `🗓️ *Nova visita agendada*\n` +
      `${modoLabel} — *${when}*\n` +
      (local ? `Imóvel: ${local}\n` : '') +
      `\nCliente: ${input.clientName}\n` +
      `Contato: ${input.clientPhone}` +
      (input.clientEmail ? `\nE-mail: ${input.clientEmail}` : '') +
      (input.mode === 'video' && input.videoRoomUrl ? `\n\n📹 Sala: ${input.videoRoomUrl}` : '') +
      docsBlock +
      `\n\nAgendado pelo cliente no site. Convite no anexo.`

    if (input.brokerPhone) {
      const bRes = await sendWhatsAppText(input.brokerPhone, brokerMsg)
      result.brokerNotified = bRes.ok

      if (input.icsUrl) {
        await sendWhatsAppFile(input.brokerPhone, {
          url: input.icsUrl,
          filename: 'visita.ics',
          caption: `Visita — ${input.clientName}`,
        }).catch(() => {})
      }
      // Encaminha o documento do cliente ao corretor.
      if (docs.length > 0) {
        await Promise.all(
          docs.map((d) =>
            sendWhatsAppFile(input.brokerPhone!, {
              url: d.url,
              filename: d.name,
              caption: `Documento — visita de ${input.clientName}`,
            }),
          ),
        ).catch(() => {})
      }
    }

    // 3) Espelha para a equipe (sem duplicar o corretor).
    const extra = Array.from(new Set((input.teamPhones ?? []).filter((p) => p && p !== input.brokerPhone)))
    if (extra.length > 0) {
      await sendWhatsAppBatch(extra.map((phone) => ({ phone, text: brokerMsg })))
      result.teamNotified = extra.length
    }
  } catch {
    // swallow — notificação é best-effort
  }

  return result
}
