import {
  generateAvailability,
  recifeISO,
  toRecifeSlotISO,
  formatVisitWhen,
  DEFAULT_AVAILABILITY,
} from '@/lib/scheduling/availability'

// Instante de referência fixo: 2026-07-06 12:00:00 UTC = 09:00 em Recife (seg).
const NOW = new Date('2026-07-06T12:00:00.000Z')

describe('generateAvailability', () => {
  it('gera dias úteis (seg–sáb), pulando domingo', () => {
    const { days } = generateAvailability(new Set(), NOW)
    expect(days.length).toBeGreaterThan(0)
    // Nenhum domingo na grade padrão.
    expect(days.some((d) => d.weekdayLabel === 'dom')).toBe(false)
    // Cada dia tem ao menos um horário.
    for (const d of days) expect(d.slots.length).toBeGreaterThan(0)
  })

  it('respeita a antecedência mínima (não oferece slots dentro do lead time)', () => {
    const { days } = generateAvailability(new Set(), NOW)
    const minStart = NOW.getTime() + DEFAULT_AVAILABILITY.leadMinutes * 60_000
    for (const d of days) {
      for (const s of d.slots) {
        expect(Date.parse(s.start)).toBeGreaterThanOrEqual(minStart)
      }
    }
  })

  it('mantém os horários dentro da janela de trabalho (09:00–18:00)', () => {
    const { days } = generateAvailability(new Set(), NOW)
    for (const d of days) {
      for (const s of d.slots) {
        const hh = Number(s.label.slice(0, 2))
        expect(hh).toBeGreaterThanOrEqual(9)
        expect(hh).toBeLessThan(18)
      }
    }
  })

  it('exclui horários já ocupados', () => {
    const full = generateAvailability(new Set(), NOW)
    // Pega um slot real de um dia futuro e o marca como ocupado.
    const target = full.days[1].slots[0].start
    const booked = new Set([target])
    const filtered = generateAvailability(booked, NOW)
    const stillThere = filtered.days.flatMap((d) => d.slots).some((s) => s.start === target)
    expect(stillThere).toBe(false)
  })

  it('honra o horizonte configurado', () => {
    const { days } = generateAvailability(new Set(), NOW, { horizonDays: 3 })
    // Máximo de 3 dias civis à frente → no máx 3 dias úteis retornados.
    expect(days.length).toBeLessThanOrEqual(3)
  })
})

describe('toRecifeSlotISO', () => {
  it('canonicaliza um instante UTC para o ISO de slot de Recife', () => {
    // 2026-07-10T12:00:00Z = 09:00 em Recife (UTC-3).
    expect(toRecifeSlotISO('2026-07-10T12:00:00Z')).toBe(recifeISO(2026, 6, 10, 9, 0))
  })

  it('casa com o formato dos slots gerados (round-trip)', () => {
    const { days } = generateAvailability(new Set(), NOW)
    const slot = days[0].slots[0].start
    // Reinterpretar o slot como instante e recanonicalizar deve devolver o mesmo.
    expect(toRecifeSlotISO(slot)).toBe(slot)
  })
})

describe('formatVisitWhen', () => {
  it('formata em pt-BR com dia da semana e hora', () => {
    // 2026-07-10 é uma sexta-feira.
    expect(formatVisitWhen(recifeISO(2026, 6, 10, 9, 0))).toBe('sex, 10 jul às 09:00')
  })
})
