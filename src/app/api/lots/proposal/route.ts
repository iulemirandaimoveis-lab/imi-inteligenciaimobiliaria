import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { notifyLotProposal } from '@/lib/notifications/proposal-notifications'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

const LotSchema = z.object({
  id: z.string(),
  block: z.string().optional().default(''),
  lot: z.string().optional().default(''),
  areaM2: z.number().optional().default(0),
  price: z.number().optional().default(0),
})

const Schema = z.object({
  developmentId: z.string().optional().nullable(),
  developmentName: z.string().min(1),
  developmentSlug: z.string().optional().nullable(),
  templateKey: z.string().default('mano-imoveis-compra'),
  clientName: z.string().min(1, 'Nome é obrigatório.'),
  clientPhone: z.string().min(8, 'Telefone é obrigatório.'),
  clientEmail: z.string().email().optional().nullable(),
  formData: z.record(z.any()).default({}),
  lots: z.array(LotSchema).default([]),
  totalAmount: z.number().optional().nullable(),
  downPayment: z.number().optional().nullable(),
})

/**
 * POST /api/lots/proposal — proposta PÚBLICA preenchida pelo CLIENTE a partir do
 * mapa de lotes. Sem auth (captação): dispara a confirmação ao cliente (OpenWA)
 * e notifica a equipe (responsável do produto + gestor + corretores). Os lotes
 * entram em "negociação" no fluxo comercial; nenhuma escrita de schema é feita
 * aqui — best-effort, nunca quebra o envio para o cliente.
 */
export async function POST(req: NextRequest) {
  let parsed
  try {
    parsed = Schema.safeParse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Corpo inválido.' }, { status: 400 })
  }
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
  }
  const d = parsed.data

  const unitLabel =
    d.lots.length > 0
      ? d.lots.map((l) => `Q${l.block}-L${l.lot}`).join(', ')
      : null

  // Notificação interna (console /users) — broadcast, best-effort.
  await createNotification({
    userId: null,
    type: 'proposta_nova',
    title: 'Nova proposta (site)',
    message: `${d.clientName} — ${unitLabel ?? d.developmentName}`,
    data: { source: 'public-map', development: d.developmentName, lots: d.lots, total: d.totalAmount },
    url: '/users/proposals',
  }).catch(() => {})

  // WhatsApp: confirmação ao cliente + alerta à equipe (OpenWA, best-effort).
  const result = await notifyLotProposal({
    projectId: d.developmentId ?? undefined,
    projectName: d.developmentName,
    clientName: d.clientName,
    clientPhone: d.clientPhone,
    unitLabel,
    totalAmount: d.totalAmount ?? undefined,
    downPayment: d.downPayment ?? undefined,
    lotCount: d.lots.length || undefined,
  })

  return NextResponse.json({ success: true, ...result })
}
