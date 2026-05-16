// src/types/duty-roster.ts
// Types for the Duty Roster (Rodízio de Plantão) system

// ── Status / enum union types ────────────────────────────────────────────────

export type AgencyType = 'propria' | 'parceira' | 'incorporadora' | 'loteadora'

export type LocationType = 'imobiliaria' | 'loteamento' | 'condominio' | 'empreendimento'

export type WeekCycleStatus = 'draft' | 'open' | 'closed' | 'published'

export type ScheduleStatus = 'confirmed' | 'cancelled' | 'swapped' | 'no_show' | 'completed'

export type SwapType = 'bilateral' | 'offer' | 'emergency'

export type SwapStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'approved' | 'expired'

export type WaitlistStatus = 'waiting' | 'promoted' | 'expired' | 'cancelled'

export type ShiftLabel = 'Manhã' | 'Tarde' | 'Noite' | string

// ── Core entity types ────────────────────────────────────────────────────────

export interface PartnerAgency {
  id: string
  name: string
  cnpj: string | null
  address: string | null
  city: string | null
  state: string
  phone: string | null
  email: string | null
  responsible: string | null
  agency_type: AgencyType
  max_brokers_per_slot: number
  working_hours_start: string // TIME as "HH:MM"
  working_hours_end: string   // TIME as "HH:MM"
  duty_rules: Record<string, unknown>
  is_active: boolean
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DutyLocation {
  id: string
  name: string
  location_type: LocationType
  agency_id: string | null
  address: string | null
  city: string | null
  state: string
  lat: number | null
  lng: number | null
  max_brokers_per_slot: number
  is_active: boolean
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DutyTimeSlot {
  id: string
  location_id: string
  label: string
  start_time: string // "HH:MM"
  end_time: string   // "HH:MM"
  day_of_week: number[] | null // null = all days; [1..7] = specific ISO weekdays
  max_brokers: number
  is_active: boolean
  created_at: string
}

export interface DutyWeekCycle {
  id: string
  week_start: string   // DATE "YYYY-MM-DD"
  week_end: string     // DATE "YYYY-MM-DD"
  selection_opens: string  // ISO timestamp
  selection_closes: string // ISO timestamp
  status: WeekCycleStatus
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface BrokerPriorityScore {
  id: string
  broker_id: string
  week_cycle_id: string
  score: number
  selection_order: number | null
  score_breakdown: ScoreBreakdown
  created_at: string
  updated_at: string
}

export interface ScoreBreakdown {
  base?: number
  chose_first_last_week?: number     // -20
  fewer_premium_slots?: number        // +15
  fewer_total_slots?: number          // +10
  no_show_last_week?: number          // -30
  late_cancellation?: number          // -20
  covered_emergency_slot?: number     // +10
  [key: string]: number | undefined
}

export interface DutyAvailability {
  id: string
  broker_id: string
  week_cycle_id: string
  available_dates: string[]     // DATE strings "YYYY-MM-DD"
  preferred_shifts: string[]    // 'manha' | 'tarde' | 'noite'
  preferred_locations: string[] // duty_location UUIDs
  notes: string | null
  declared_at: string
  updated_at: string
}

export interface DutySchedule {
  id: string
  week_cycle_id: string
  location_id: string
  time_slot_id: string
  broker_id: string
  schedule_date: string // DATE "YYYY-MM-DD"
  start_time: string    // "HH:MM"
  end_time: string      // "HH:MM"
  status: ScheduleStatus
  booked_at: string
  booked_by: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancel_reason: string | null
  // Performance metrics
  leads_attended: number
  visits_done: number
  proposals_made: number
  sales_closed: number
  // Check-in / check-out
  checkin_at: string | null
  checkout_at: string | null
  checkin_lat: number | null
  checkin_lng: number | null
  checkin_photo_url: string | null
  checkin_metadata: Record<string, unknown>
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DutySwapRequest {
  id: string
  requester_id: string
  requester_schedule_id: string
  target_broker_id: string | null
  target_schedule_id: string | null
  swap_type: SwapType
  status: SwapStatus
  reason: string | null
  response_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface DutyWaitlist {
  id: string
  location_id: string
  time_slot_id: string
  broker_id: string
  schedule_date: string // DATE "YYYY-MM-DD"
  position: number
  week_cycle_id: string
  status: WaitlistStatus
  created_at: string
}

// ── Joined / enriched types ──────────────────────────────────────────────────

export interface DutyLocationWithRelations extends DutyLocation {
  agency?: Pick<PartnerAgency, 'id' | 'name' | 'agency_type'> | null
  time_slots?: DutyTimeSlot[]
  time_slots_count?: number
  active_schedules_count?: number
}

export interface DutyScheduleWithRelations extends DutySchedule {
  location?: Pick<DutyLocation, 'id' | 'name' | 'location_type'>
  time_slot?: Pick<DutyTimeSlot, 'id' | 'label' | 'start_time' | 'end_time'>
  broker?: {
    id: string
    name: string
    email: string
    avatar_url?: string | null
  }
}

export interface DutySwapRequestWithRelations extends DutySwapRequest {
  requester?: { id: string; name: string; email: string }
  requester_schedule?: DutyScheduleWithRelations
  target_broker?: { id: string; name: string; email: string } | null
  target_schedule?: DutyScheduleWithRelations | null
}

// ── Calendar view helpers ────────────────────────────────────────────────────

export interface DutyCalendarDay {
  date: string // "YYYY-MM-DD"
  schedules: DutyScheduleWithRelations[]
}

export interface DutyCalendarView {
  week_cycle?: DutyWeekCycle
  days: DutyCalendarDay[]
}

// ── Report types ─────────────────────────────────────────────────────────────

export type ReportType = 'broker' | 'location' | 'week'

export interface BrokerKpiRow {
  broker_id: string
  broker_name: string
  total_slots: number
  attended: number
  no_shows: number
  cancellations: number
  occupancy_rate: number
  leads_attended: number
  visits_done: number
  proposals_made: number
  sales_closed: number
  priority_score: number | null
}

export interface LocationKpiRow {
  location_id: string
  location_name: string
  total_slots: number
  filled_slots: number
  occupancy_rate: number
  no_shows: number
  leads_total: number
  visits_total: number
  proposals_total: number
  sales_total: number
}

export interface WeekSummaryRow {
  week_cycle_id: string
  week_start: string
  week_end: string
  total_schedules: number
  confirmed: number
  cancelled: number
  no_shows: number
  completed: number
  overall_occupancy_rate: number
  total_leads: number
  total_sales: number
}
