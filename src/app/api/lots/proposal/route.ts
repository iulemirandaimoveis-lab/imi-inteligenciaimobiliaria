import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { notifyLotProposal } from '@/lib/notifications/proposal-notifications'
import { createNotification } from '@/lib/notifications'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase/admin'

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
  documents: z
    .array(z.object({ name: z.string(), url: z.string().url() }))
    .max(8)
    .optional()
    .default([]),
})

/**
 * POST /api/lots/proposal — proposta PÚBLICA preenchida pelo CLIENTE a partir do
 * mapa de lotes. Sem auth (captação): dispara a confirmação ao cliente (OpenWA)
 * e notifica a equipe (responsável do produto + gestor + corretores). Os lotes
 * entram em "negociação" no fluxo comercial; nenhuma escrita de schema é feita
 * aqui — best-effort, nunca quebra o envio para o cliente.
 */
export async function POST(req: NextRequest) {
  // Rota pública que dispara WhatsApp/notificações: 5 envios/min por IP
  const ip = getClientIP(req)
  const rl = await rateLimit(`lot-proposal:${ip}`, { limit: 5, windowMs: 60_000 })
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições. Aguarde um minuto.' }, { status: 429 })
  }

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
    data: {
      source: 'public-map',
      development: d.developmentName,
      lots: d.lots,
      total: d.totalAmount,
      documents: d.documents,
    },
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
    documents: d.documents,
  })

  // Registro em public.proposals — habilita o link /carrinho?id=<token>&p=<token>
  // a virar página de status ao vivo (enviada/aceita/etc.) em vez de só listar
  // os lotes. Best-effort: nunca bloqueia a confirmação por WhatsApp acima.
  // Grava só em colunas confirmadas no schema real (ver docs/DECISION_LOG) —
  // detalhes específicos do carrinho (lotes, cliente, docs) ficam em `metadata`.
  let proposalToken: string | undefined
  try {
    const { data: proposalRow } = await supabaseAdmin
      .from('proposals')
      .insert({
        title: `Proposta — ${d.developmentName}${unitLabel ? ` — ${unitLabel}` : ''}`,
        status: 'sent',
        development_id: d.developmentId ?? null,
        valor_proposta: d.totalAmount ?? null,
        valor_entrada: d.downPayment ?? null,
        metadata: {
          source: 'lot_cart',
          development_slug: d.developmentSlug ?? null,
          lots: d.lots,
          client: { name: d.clientName, phone: d.clientPhone, email: d.clientEmail ?? null },
          form_data: d.formData,
          documents: d.documents,
        },
      })
      .select('token')
      .single()
    proposalToken = proposalRow?.token ?? undefined
  } catch {
    // Sem registro de status desta vez — cliente já foi notificado via WhatsApp.
  }

  return NextResponse.json({ success: true, proposalToken, ...result })
}
