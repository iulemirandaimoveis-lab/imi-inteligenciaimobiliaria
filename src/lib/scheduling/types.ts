/**
 * Tipos do agendamento de visitas (calendário do corretor).
 * Compartilhados entre o motor de disponibilidade, as rotas de API e a UI.
 */

export type VisitMode = 'presencial' | 'video'
export type VisitSource = 'property_page' | 'video_call' | 'lot_map' | 'other'
export type VisitStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

/** Um horário disponível para agendamento (instante em ISO 8601 com offset). */
export interface Slot {
  /** Início do horário — ISO com offset de Recife (ex.: 2026-07-10T09:00:00-03:00). */
  start: string
  /** Rótulo curto para exibição (ex.: "09:00"). */
  label: string
}

/** Um dia da grade de disponibilidade. */
export interface AvailabilityDay {
  /** Data no formato YYYY-MM-DD (fuso de Recife). */
  date: string
  /** Rótulo do dia da semana (ex.: "seg"). */
  weekdayLabel: string
  /** Rótulo do dia/mês (ex.: "10 jul"). */
  dayLabel: string
  /** Horários livres do dia (vazio = sem disponibilidade). */
  slots: Slot[]
}

export interface AvailabilityResponse {
  timezone: string
  slotMinutes: number
  days: AvailabilityDay[]
}

/** Documento anexado pelo cliente (URL assinada do bucket de propostas). */
export interface VisitDocument {
  name: string
  url: string
}

export interface VisitBrokerInfo {
  id?: string | null
  name: string
  phone?: string | null
  email?: string | null
}
