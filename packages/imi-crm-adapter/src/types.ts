// IMI CRM Adapter — read-only stub that surfaces CRM context for IMI admin.
// Leads, reservations, brokers, and client data live in CRM, never in CAD.

export interface LeadSceneContext {
  leadId: string
  interestedInDevelopmentId: string
  interestedInUnitIds: string[]
  source: 'organic' | 'meta_ads' | 'google_ads' | 'whatsapp' | 'referral' | 'other'
}

export interface ReservationSceneContext {
  reservationId: string
  unitId: string
  developmentId: string
  status: 'tentative' | 'confirmed' | 'cancelled'
}

export interface CrmAdapterReadResult {
  developmentId: string
  activeLeads: number
  activeReservations: number
  soldUnits: string[]
  availableUnits: string[]
}

export type CrmAdapterFn = (developmentId: string) => Promise<CrmAdapterReadResult>
