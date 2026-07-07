/**
 * Gerador de convite de calendário (.ics / RFC 5545) para o agendamento de
 * visita. É o mecanismo universal de "cair na agenda do corretor": o arquivo
 * é anexado no WhatsApp/e-mail e o corretor (e o cliente) adiciona em qualquer
 * app de calendário — Google, Apple, Outlook — com um toque.
 *
 * Função pura (sem I/O) para ser fácil de testar.
 */

export interface ICSInput {
  uid: string
  /** Início — ISO 8601 com offset (ex.: gerado por recifeISO). */
  startISO: string
  durationMinutes: number
  summary: string
  description?: string
  location?: string
  organizer?: { name?: string | null; email?: string | null } | null
  attendee?: { name?: string | null; email?: string | null } | null
  url?: string | null
}

/** ISO com offset → carimbo UTC compacto do iCalendar (YYYYMMDDTHHMMSSZ). */
function toICSDate(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  )
}

/** Escape de texto conforme RFC 5545 (vírgula, ponto-e-vírgula, quebra, barra). */
function esc(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** Dobra linhas longas em ≤75 octetos (recomendação do RFC). */
function fold(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  let rest = line
  chunks.push(rest.slice(0, 75))
  rest = rest.slice(75)
  while (rest.length > 74) {
    chunks.push(' ' + rest.slice(0, 74))
    rest = rest.slice(74)
  }
  if (rest.length) chunks.push(' ' + rest)
  return chunks.join('\r\n')
}

export function buildICS(input: ICSInput, now: Date = new Date()): string {
  const startMs = Date.parse(input.startISO)
  const endMs = startMs + input.durationMinutes * 60 * 1000

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IMI Inteligência Imobiliária//Agendamento de Visita//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${esc(input.uid)}`,
    `DTSTAMP:${toICSDate(now.getTime())}`,
    `DTSTART:${toICSDate(startMs)}`,
    `DTEND:${toICSDate(endMs)}`,
    `SUMMARY:${esc(input.summary)}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
  ]

  if (input.description) lines.push(`DESCRIPTION:${esc(input.description)}`)
  if (input.location) lines.push(`LOCATION:${esc(input.location)}`)
  if (input.url) lines.push(`URL:${esc(input.url)}`)
  if (input.organizer?.email) {
    const cn = input.organizer.name ? `;CN=${esc(input.organizer.name)}` : ''
    lines.push(`ORGANIZER${cn}:mailto:${input.organizer.email}`)
  }
  if (input.attendee?.email) {
    const cn = input.attendee.name ? `;CN=${esc(input.attendee.name)}` : ''
    lines.push(`ATTENDEE${cn};ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${input.attendee.email}`)
  }

  // Lembrete 1h antes.
  lines.push(
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(input.summary)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  )

  return lines.map(fold).join('\r\n')
}
