import 'server-only'

import crypto from 'node:crypto'

/**
 * Sincronização com o Google Calendar do corretor — o "conectar a agenda do
 * corretor" do agendamento de visitas. Cria um evento na agenda quando uma
 * Service Account está configurada; caso contrário é um no-op gracioso (o
 * convite .ics já garante que a visita cai em qualquer calendário).
 *
 * Best-effort: NUNCA lança no caminho da request.
 *
 * Env (opcional — sem elas, `isGoogleCalendarConfigured()` = false):
 *   GOOGLE_CALENDAR_SA_EMAIL        — e-mail da Service Account
 *   GOOGLE_CALENDAR_SA_PRIVATE_KEY  — chave privada PEM (com \n literais ok)
 *   GOOGLE_CALENDAR_ID              — id do calendário alvo (compartilhado com a SA)
 *   GOOGLE_CALENDAR_SUBJECT         — (opcional) e-mail para delegação domain-wide
 *
 * Como ligar: veja docs/AGENDAMENTO_VISITAS.md.
 */

const TOKEN_URI = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/calendar.events'

interface SAConfig {
  email: string
  privateKey: string
  calendarId: string
  subject?: string
}

function readConfig(): SAConfig | null {
  const email = process.env.GOOGLE_CALENDAR_SA_EMAIL
  const rawKey = process.env.GOOGLE_CALENDAR_SA_PRIVATE_KEY
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!email || !rawKey || !calendarId) return null
  return {
    email,
    // Aceita chave com \n literais (formato comum em .env de host).
    privateKey: rawKey.replace(/\\n/g, '\n'),
    calendarId,
    subject: process.env.GOOGLE_CALENDAR_SUBJECT || undefined,
  }
}

export function isGoogleCalendarConfigured(): boolean {
  return readConfig() !== null
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Assina um JWT RS256 para o fluxo de Service Account (sem dependências externas). */
function signJwt(cfg: SAConfig, nowSec: number): string {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64url(
    JSON.stringify({
      iss: cfg.email,
      scope: SCOPE,
      aud: TOKEN_URI,
      iat: nowSec,
      exp: nowSec + 3600,
      ...(cfg.subject ? { sub: cfg.subject } : {}),
    }),
  )
  const signingInput = `${header}.${claim}`
  const signature = crypto.createSign('RSA-SHA256').update(signingInput).sign(cfg.privateKey)
  return `${signingInput}.${base64url(signature)}`
}

async function getAccessToken(cfg: SAConfig): Promise<string | null> {
  const nowSec = Math.floor(Date.now() / 1000)
  const assertion = signJwt(cfg, nowSec)
  const res = await fetch(TOKEN_URI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const body = (await res.json()) as { access_token?: string }
  return body.access_token ?? null
}

export interface CalendarEventInput {
  summary: string
  description?: string
  location?: string
  /** Início — ISO 8601 com offset. */
  startISO: string
  durationMinutes: number
  attendees?: Array<{ email?: string | null; name?: string | null }>
}

/**
 * Cria o evento na agenda do corretor. Retorna o id do evento, ou null quando
 * não configurado / falha (sempre best-effort).
 */
export async function createCalendarEvent(input: CalendarEventInput): Promise<string | null> {
  const cfg = readConfig()
  if (!cfg) return null

  try {
    const token = await getAccessToken(cfg)
    if (!token) return null

    const startMs = Date.parse(input.startISO)
    const endISO = new Date(startMs + input.durationMinutes * 60 * 1000).toISOString()

    const attendees = (input.attendees ?? [])
      .filter((a): a is { email: string; name?: string | null } => !!a.email)
      .map((a) => ({ email: a.email, displayName: a.name ?? undefined }))

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cfg.calendarId)}/events`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: input.summary,
          description: input.description,
          location: input.location,
          start: { dateTime: input.startISO, timeZone: 'America/Recife' },
          end: { dateTime: endISO, timeZone: 'America/Recife' },
          ...(attendees.length ? { attendees } : {}),
          reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }] },
        }),
        signal: AbortSignal.timeout(8000),
      },
    )
    if (!res.ok) return null
    const body = (await res.json()) as { id?: string }
    return body.id ?? null
  } catch {
    return null
  }
}
