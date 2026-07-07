import { buildICS } from '@/lib/scheduling/ics'

const NOW = new Date('2026-07-06T12:00:00.000Z')

describe('buildICS', () => {
  const ics = buildICS(
    {
      uid: 'abc123@iulemirandaimoveis.com.br',
      startISO: '2026-07-10T09:00:00-03:00', // 12:00 UTC
      durationMinutes: 45,
      summary: 'Visita — Alto Bellevue · Maria',
      description: 'Cliente: Maria; Corretor: Iule',
      location: 'Garanhuns, PE',
      organizer: { name: 'Iule Miranda', email: 'iule@imi.com' },
      attendee: { name: 'Maria', email: 'maria@email.com' },
    },
    NOW,
  )

  it('emite um VCALENDAR/VEVENT válido', () => {
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('END:VEVENT')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).toContain('UID:abc123@iulemirandaimoveis.com.br')
  })

  it('converte o horário para UTC compacto (Z)', () => {
    // 09:00 Recife = 12:00 UTC; +45min = 12:45 UTC.
    expect(ics).toContain('DTSTART:20260710T120000Z')
    expect(ics).toContain('DTEND:20260710T124500Z')
  })

  it('escapa a vírgula do RFC 5545 no SUMMARY', () => {
    // A separação " · " não tem vírgula, mas garantimos que vírgulas viram \,
    const withComma = buildICS(
      { uid: 'x', startISO: '2026-07-10T09:00:00-03:00', durationMinutes: 30, summary: 'Visita, urgente' },
      NOW,
    )
    expect(withComma).toContain('SUMMARY:Visita\\, urgente')
  })

  it('inclui organizer, attendee e alarme', () => {
    expect(ics).toContain('ORGANIZER;CN=Iule Miranda:mailto:iule@imi.com')
    expect(ics).toContain('ATTENDEE;CN=Maria;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:maria@email.com')
    expect(ics).toContain('BEGIN:VALARM')
    expect(ics).toContain('TRIGGER:-PT1H')
  })
})
