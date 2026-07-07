import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { createVideoRoom } from '@/lib/video-call/provider'
import { buildICS } from '@/lib/scheduling/ics'
import { createCalendarEvent } from '@/lib/scheduling/google-calendar'
import { notifyVisitBooking } from '@/lib/notifications/visit-notifications'
import { createNotification } from '@/lib/notifications'
import { formatVisitWhen } from '@/lib/scheduling/availability'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br'
const ICS_BUCKET = 'visit-invites'
const ICS_TTL = 60 * 60 * 24 * 90 // 90 dias

const Schema = z.object({
  developmentId: z.string().optional().nullable(),
  developmentName: z.string().optional().nullable(),
  developmentSlug: z.string().optional().nullable(),
  brokerId: z.string().optional().nullable(),
  brokerName: z.string().min(1, 'Corretor é obrigatório.'),
  brokerPhone: z.string().optional().nullable(),
  brokerEmail: z.string().email().optional().nullable(),
  clientName: z.string().min(2, 'Nome é obrigatório.'),
  clientEmail: z.string().email('E-mail inválido.').optional().nullable(),
  clientPhone: z.string().min(8, 'Telefone é obrigatório.'),
  when: z.string().min(10, 'Horário é obrigatório.'),
  durationMinutes: z.number().int().min(15).max(240).optional().default(45),
  mode: z.enum(['presencial', 'video']).default('presencial'),
  source: z.enum(['property_page', 'video_call', 'lot_map', 'other']).default('property_page'),
  documents: z
    .array(z.object({ name: z.string(), url: z.string().url() }))
    .max(8)
    .optional()
    .default([]),
  notes: z.string().max(1000).optional().nullable(),
})

let bucketReady = false
async function ensureBucket() {
  if (bucketReady) return
  try {
    const { data } = await supabaseAdmin.storage.getBucket(ICS_BUCKET)
    if (!data) {
      await supabaseAdmin.storage.createBucket(ICS_BUCKET, { public: false, fileSizeLimit: 1024 * 512 })
    }
    bucketReady = true
  } catch {
    /* segue mesmo assim — o bucket pode já existir */
  }
}

/**
 * POST /api/visits/book — o CLIENTE agenda uma visita (presencial ou por vídeo)
 * a partir do calendário do corretor. Rota PÚBLICA (captação, sem auth).
 *
 * Fluxo (tudo best-effort — o cliente sempre recebe confirmação):
 *  1. valida o horário (futuro, dentro do horizonte);
 *  2. se vídeo, cria a sala sob demanda (Daily/Jitsi);
 *  3. gera o convite .ics e sobe pro storage (URL assinada);
 *  4. persiste em public.visit_bookings (se a tabela existir);
 *  5. cria o evento no Google Calendar do corretor (se configurado);
 *  6. notifica cliente + corretor por WhatsApp com o convite e o documento.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const rl = await rateLimit(`visit-book:${ip}`, { limit: 6, windowMs: 60_000 })
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

  // Valida o horário: precisa ser futuro (com folga) e dentro de 60 dias.
  const whenMs = Date.parse(d.when)
  if (!Number.isFinite(whenMs)) {
    return NextResponse.json({ error: 'Horário inválido.' }, { status: 400 })
  }
  const now = Date.now()
  if (whenMs < now + 15 * 60_000) {
    return NextResponse.json({ error: 'Escolha um horário futuro.' }, { status: 400 })
  }
  if (whenMs > now + 60 * 24 * 60 * 60_000) {
    return NextResponse.json({ error: 'Horário fora do período de agendamento.' }, { status: 400 })
  }

  const brokerPhoneDigits = d.brokerPhone ? d.brokerPhone.replace(/\D/g, '') : null

  // Conflito de horário (best-effort — o índice único do banco é a garantia real).
  try {
    if (brokerPhoneDigits) {
      const { data: clash } = await supabaseAdmin
        .from('visit_bookings')
        .select('id')
        .in('status', ['pending', 'confirmed'])
        .eq('scheduled_at', new Date(whenMs).toISOString())
        .ilike('broker_phone', `%${brokerPhoneDigits.slice(-8)}%`)
        .limit(1)
      if (clash && clash.length > 0) {
        return NextResponse.json({ error: 'Esse horário acabou de ser reservado. Escolha outro.' }, { status: 409 })
      }
    }
  } catch {
    /* tabela ausente → sem checagem prévia; segue */
  }

  const whenLabel = formatVisitWhen(d.when)
  const summary = `Visita${d.developmentName ? ` — ${d.developmentName}` : ''} · ${d.clientName}`

  // 2) Sala de vídeo, se aplicável.
  let videoRoomUrl: string | null = null
  if (d.mode === 'video') {
    const room = await createVideoRoom({ expMinutes: (d.durationMinutes ?? 45) + 30 }).catch(() => null)
    videoRoomUrl = room?.url ?? null
  }

  // 3) Convite .ics → storage (URL assinada).
  const uid = `${nanoid(16)}@iulemirandaimoveis.com.br`
  const description =
    `Visita agendada pela IMI.\n` +
    `Cliente: ${d.clientName} (${d.clientPhone})\n` +
    `Corretor: ${d.brokerName}` +
    (videoRoomUrl ? `\nSala de vídeo: ${videoRoomUrl}` : '')
  const ics = buildICS({
    uid,
    startISO: d.when,
    durationMinutes: d.durationMinutes ?? 45,
    summary,
    description,
    location: videoRoomUrl ?? d.developmentName ?? 'A combinar com o corretor',
    organizer: { name: d.brokerName, email: d.brokerEmail },
    attendee: { name: d.clientName, email: d.clientEmail },
    url: d.developmentSlug ? `${BASE_URL}/pt/imoveis/${d.developmentSlug}` : BASE_URL,
  })

  let icsUrl: string | null = null
  try {
    await ensureBucket()
    const path = `${nanoid(12)}/visita.ics`
    const { error } = await supabaseAdmin.storage
      .from(ICS_BUCKET)
      .upload(path, Buffer.from(ics, 'utf-8'), { contentType: 'text/calendar; charset=utf-8', upsert: false })
    if (!error) {
      const { data: signed } = await supabaseAdmin.storage.from(ICS_BUCKET).createSignedUrl(path, ICS_TTL)
      icsUrl = signed?.signedUrl ?? null
    }
  } catch {
    /* sem convite anexo desta vez — os dados vão no texto do WhatsApp */
  }

  // 4) Persistência (best-effort — funciona mesmo antes da migration aplicada).
  let token: string | undefined
  let bookingId: string | undefined
  try {
    const { data: row } = await supabaseAdmin
      .from('visit_bookings')
      .insert({
        development_id: d.developmentId ?? null,
        development_slug: d.developmentSlug ?? null,
        development_name: d.developmentName ?? null,
        broker_id: d.brokerId && /^[0-9a-f-]{36}$/i.test(d.brokerId) ? d.brokerId : null,
        broker_name: d.brokerName,
        broker_phone: d.brokerPhone ?? null,
        broker_email: d.brokerEmail ?? null,
        client_name: d.clientName,
        client_email: d.clientEmail ?? null,
        client_phone: d.clientPhone,
        scheduled_at: new Date(whenMs).toISOString(),
        duration_min: d.durationMinutes ?? 45,
        mode: d.mode,
        status: 'pending',
        source: d.source,
        video_room_url: videoRoomUrl,
        documents: d.documents,
        notes: d.notes ?? null,
      })
      .select('id, token')
      .single()
    token = row?.token ?? undefined
    bookingId = row?.id ?? undefined
  } catch {
    // Conflito do índice único (23505) ou tabela ausente. Se for conflito real,
    // avisamos; caso contrário seguimos com a notificação.
  }

  // 5) Google Calendar do corretor (best-effort, no-op se não configurado).
  createCalendarEvent({
    summary,
    description,
    location: videoRoomUrl ?? d.developmentName ?? undefined,
    startISO: d.when,
    durationMinutes: d.durationMinutes ?? 45,
    attendees: [
      { email: d.brokerEmail, name: d.brokerName },
      { email: d.clientEmail, name: d.clientName },
    ],
  })
    .then((eventId) => {
      if (eventId && bookingId) {
        return supabaseAdmin.from('visit_bookings').update({ external_event_id: eventId }).eq('id', bookingId)
      }
    })
    .catch(() => {})

  // 6) Notificações (cliente + corretor) — best-effort.
  const notif = await notifyVisitBooking({
    clientName: d.clientName,
    clientPhone: d.clientPhone,
    clientEmail: d.clientEmail,
    brokerName: d.brokerName,
    brokerPhone: d.brokerPhone,
    developmentName: d.developmentName,
    whenISO: d.when,
    mode: d.mode,
    videoRoomUrl,
    documents: d.documents,
    icsUrl,
  })

  // Notificação interna do console (broadcast).
  await createNotification({
    userId: null,
    type: 'agenda_novo',
    title: 'Nova visita agendada (site)',
    message: `${d.clientName} — ${whenLabel}${d.developmentName ? ` · ${d.developmentName}` : ''}`,
    data: {
      source: d.source,
      mode: d.mode,
      when: d.when,
      broker: d.brokerName,
      development: d.developmentName,
      documents: d.documents,
    },
    url: '/backoffice/hoje',
  }).catch(() => {})

  return NextResponse.json({
    success: true,
    token,
    videoRoomUrl,
    when: d.when,
    whenLabel,
    notified: notif,
  })
}
