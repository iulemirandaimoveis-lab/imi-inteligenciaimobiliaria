/**
 * Motor de disponibilidade do calendário do corretor.
 *
 * Gera os horários livres para agendamento de visita, num fuso fixo de Recife
 * (America/Recife = UTC-03:00, sem horário de verão). É uma função PURA:
 * recebe `now` e a lista de horários já ocupados e devolve a grade — o que a
 * torna trivialmente testável e independente de rede/banco.
 *
 * Regras de negócio (configuráveis):
 *  • dias úteis (padrão seg–sáb);
 *  • janela de trabalho (padrão 09:00–18:00);
 *  • duração do slot (padrão 45 min);
 *  • antecedência mínima (padrão 3h) — evita agendar "pra já";
 *  • horizonte (padrão 21 dias).
 */

import type { AvailabilityDay, AvailabilityResponse, Slot } from './types'

export const RECIFE_OFFSET_MS = 3 * 60 * 60 * 1000 // UTC-03:00
export const RECIFE_TZ = 'America/Recife'

const WEEKDAY_LABELS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export interface AvailabilityConfig {
  /** Dias da semana atendidos (0=domingo … 6=sábado). Padrão: seg–sáb. */
  workingDays: number[]
  /** Hora de abertura (0–23). */
  openHour: number
  /** Hora de fechamento (0–23) — o último slot termina até aqui. */
  closeHour: number
  /** Duração de cada horário, em minutos. */
  slotMinutes: number
  /** Antecedência mínima em minutos entre agora e o horário. */
  leadMinutes: number
  /** Quantos dias à frente gerar. */
  horizonDays: number
}

export const DEFAULT_AVAILABILITY: AvailabilityConfig = {
  workingDays: [1, 2, 3, 4, 5, 6],
  openHour: 9,
  closeHour: 18,
  slotMinutes: 45,
  leadMinutes: 180,
  horizonDays: 21,
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Componentes civis (parede) de Recife a partir de um instante UTC. */
function recifeParts(utc: Date): { y: number; m: number; d: number; weekday: number } {
  const shifted = new Date(utc.getTime() - RECIFE_OFFSET_MS)
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth(), // 0-based
    d: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  }
}

/** Monta um ISO 8601 com offset fixo de Recife (ex.: 2026-07-10T09:00:00-03:00). */
export function recifeISO(y: number, m0: number, d: number, hh: number, mm: number): string {
  return `${y}-${pad(m0 + 1)}-${pad(d)}T${pad(hh)}:${pad(mm)}:00-03:00`
}

/**
 * Gera a grade de disponibilidade.
 *
 * @param booked  Conjunto de horários já ocupados (ISO idêntico ao gerado por
 *                `recifeISO`) — normalmente vindos de public.visit_bookings.
 * @param now     Instante atual (injetável para testes). Padrão: agora.
 */
export function generateAvailability(
  booked: Set<string> = new Set(),
  now: Date = new Date(),
  cfg: Partial<AvailabilityConfig> = {},
): AvailabilityResponse {
  const c = { ...DEFAULT_AVAILABILITY, ...cfg }
  const leadMs = c.leadMinutes * 60 * 1000
  const minStart = now.getTime() + leadMs

  const base = recifeParts(now)
  const days: AvailabilityDay[] = []

  for (let i = 0; i < c.horizonDays; i++) {
    // Avança i dias no calendário civil de Recife usando aritmética em UTC
    // (Date.UTC normaliza viradas de mês/ano).
    const civil = new Date(Date.UTC(base.y, base.m, base.d + i))
    const y = civil.getUTCFullYear()
    const m0 = civil.getUTCMonth()
    const d = civil.getUTCDate()
    const weekday = civil.getUTCDay()

    if (!c.workingDays.includes(weekday)) continue

    const slots: Slot[] = []
    for (let hh = c.openHour; hh < c.closeHour; hh++) {
      for (let mm = 0; mm < 60; mm += c.slotMinutes) {
        // Garante que o slot cabe inteiro dentro da janela de trabalho.
        const endMinutes = hh * 60 + mm + c.slotMinutes
        if (endMinutes > c.closeHour * 60) continue

        const start = recifeISO(y, m0, d, hh, mm)
        if (Date.parse(start) < minStart) continue // passado / dentro da antecedência
        if (booked.has(start)) continue // já ocupado

        slots.push({ start, label: `${pad(hh)}:${pad(mm)}` })
      }
    }

    if (slots.length === 0) continue

    days.push({
      date: `${y}-${pad(m0 + 1)}-${pad(d)}`,
      weekdayLabel: WEEKDAY_LABELS[weekday],
      dayLabel: `${d} ${MONTH_LABELS[m0]}`,
      slots,
    })
  }

  return { timezone: RECIFE_TZ, slotMinutes: c.slotMinutes, days }
}

/**
 * Canonicaliza um instante qualquer (ex.: `scheduled_at` lido do banco em UTC)
 * para o mesmo formato de ISO de Recife gerado por `recifeISO` — permite
 * comparar horários ocupados com os slots por igualdade de string.
 */
export function toRecifeSlotISO(instant: Date | string): string {
  const utc = typeof instant === 'string' ? new Date(Date.parse(instant)) : instant
  const shifted = new Date(utc.getTime() - RECIFE_OFFSET_MS)
  return recifeISO(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
    shifted.getUTCHours(),
    shifted.getUTCMinutes(),
  )
}

/** Formata um ISO de Recife para exibição amigável (ex.: "qua, 10 jul às 09:00"). */
export function formatVisitWhen(iso: string): string {
  const parts = recifeParts(new Date(Date.parse(iso)))
  const time = iso.slice(11, 16)
  return `${WEEKDAY_LABELS[parts.weekday]}, ${parts.d} ${MONTH_LABELS[parts.m]} às ${time}`
}
