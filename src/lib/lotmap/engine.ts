/**
 * LotMapEngine — Motor genérico para gestão comercial de loteamentos.
 *
 * Um único motor com configuração por empreendimento. Nunca duplicar lógica
 * para cada empreendimento — adicionar uma entrada em DEVELOPMENTS e seguir.
 */

// ── Status canônico do sistema ────────────────────────────────────────────────

export type LotStatus =
  | 'available'      // DISPONIVEL
  | 'negotiation'    // NEGOCIACAO
  | 'reserved'       // RESERVADO
  | 'documentation'  // DOCUMENTACAO
  | 'sold'           // VENDIDO
  | 'blocked'        // BLOQUEADO
  | 'unavailable'    // PROPRIETARIO / outros

/** Maps Supabase uppercase value → canonical LotStatus. */
export function normalizeLotStatus(raw: string | null | undefined): LotStatus {
  switch (String(raw ?? '').toUpperCase()) {
    case 'DISPONIVEL':   return 'available'
    case 'NEGOCIACAO':
    case 'EM_NEGOCIACAO':
    case 'NEGOCIACAO_EM_ANDAMENTO': return 'negotiation'
    case 'RESERVADO':    return 'reserved'
    case 'DOCUMENTACAO': return 'documentation'
    case 'VENDIDO':      return 'sold'
    case 'BLOQUEADO':    return 'blocked'
    default:             return 'unavailable'
  }
}

/** Maps canonical LotStatus → Supabase uppercase value. */
export function denormalizeLotStatus(status: LotStatus): string {
  const map: Record<LotStatus, string> = {
    available:     'DISPONIVEL',
    negotiation:   'NEGOCIACAO',
    reserved:      'RESERVADO',
    documentation: 'DOCUMENTACAO',
    sold:          'VENDIDO',
    blocked:       'BLOQUEADO',
    unavailable:   'PROPRIETARIO',
  }
  return map[status]
}

// ── Status visual config (colors + labels) ────────────────────────────────────

export interface LotStatusConfig {
  label: string
  dbValue: string
  color: string      // text / stroke color
  fill: string       // SVG polygon fill
  stroke: string     // SVG polygon stroke
  bg: string         // panel background tint
  border: string     // panel border color
}

export const LOT_STATUS_CONFIG: Record<LotStatus, LotStatusConfig> = {
  available: {
    label:  'DISPONÍVEL',
    dbValue: 'DISPONIVEL',
    color:  '#4ADE80',
    fill:   'rgba(74,222,128,0.72)',
    stroke: '#4ADE80',
    bg:     'rgba(74,222,128,0.06)',
    border: 'rgba(74,222,128,0.18)',
  },
  negotiation: {
    label:  'EM NEGOCIAÇÃO',
    dbValue: 'NEGOCIACAO',
    color:  '#FBBF24',
    fill:   'rgba(251,191,36,0.72)',
    stroke: '#FBBF24',
    bg:     'rgba(251,191,36,0.06)',
    border: 'rgba(251,191,36,0.18)',
  },
  reserved: {
    label:  'RESERVADO',
    dbValue: 'RESERVADO',
    color:  '#FB923C',
    fill:   'rgba(251,146,60,0.72)',
    stroke: '#FB923C',
    bg:     'rgba(251,146,60,0.06)',
    border: 'rgba(251,146,60,0.18)',
  },
  documentation: {
    label:  'DOCUMENTAÇÃO',
    dbValue: 'DOCUMENTACAO',
    color:  '#60A5FA',
    fill:   'rgba(96,165,250,0.72)',
    stroke: '#60A5FA',
    bg:     'rgba(96,165,250,0.06)',
    border: 'rgba(96,165,250,0.18)',
  },
  sold: {
    label:  'VENDIDO',
    dbValue: 'VENDIDO',
    color:  '#F87171',
    fill:   'rgba(248,113,113,0.55)',
    stroke: '#F87171',
    bg:     'rgba(248,113,113,0.06)',
    border: 'rgba(248,113,113,0.18)',
  },
  blocked: {
    label:  'BLOQUEADO',
    dbValue: 'BLOQUEADO',
    color:  '#94A3B8',
    fill:   'rgba(148,163,184,0.55)',
    stroke: '#94A3B8',
    bg:     'rgba(148,163,184,0.06)',
    border: 'rgba(148,163,184,0.18)',
  },
  unavailable: {
    label:  'INDISPONÍVEL',
    dbValue: 'PROPRIETARIO',
    color:  '#4F5B6B',
    fill:   'rgba(79,91,107,0.55)',
    stroke: '#4F5B6B',
    bg:     'rgba(79,91,107,0.06)',
    border: 'rgba(79,91,107,0.18)',
  },
}

// ── User roles ────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'manager' | 'broker' | 'viewer' | 'public'

export interface UserPermissions {
  canReserve: boolean
  canNegotiate: boolean
  canSell: boolean
  canBlock: boolean
  canViewBrokerPanel: boolean
  canViewHistory: boolean
  canViewDashboard: boolean
  canEditLot: boolean
  canCancelReservation: boolean
}

export function getPermissions(role: UserRole): UserPermissions {
  switch (role) {
    case 'admin':
    case 'manager':
      return {
        canReserve: true, canNegotiate: true, canSell: true, canBlock: true,
        canViewBrokerPanel: true, canViewHistory: true, canViewDashboard: true,
        canEditLot: true, canCancelReservation: true,
      }
    case 'broker':
      return {
        canReserve: true, canNegotiate: true, canSell: false, canBlock: false,
        canViewBrokerPanel: true, canViewHistory: false, canViewDashboard: false,
        canEditLot: false, canCancelReservation: false,
      }
    default:
      return {
        canReserve: false, canNegotiate: false, canSell: false, canBlock: false,
        canViewBrokerPanel: false, canViewHistory: false, canViewDashboard: false,
        canEditLot: false, canCancelReservation: false,
      }
  }
}

// ── Development config ────────────────────────────────────────────────────────

export interface ReservationRules {
  expirationHours: number
  allowMultipleLots: boolean
  requireManagerApproval: boolean
}

export interface DevelopmentConfig {
  id: string
  name: string
  slug: string
  type: 'loteamento' | 'condominio_fechado'
  mapJsonUrl: string
  blocks?: string[]
  reservationRules: ReservationRules
  whatsappContact?: string
}

/** Registry of known developments. New empreendimentos: add an entry here. */
export const DEVELOPMENTS: Record<string, DevelopmentConfig> = {
  'alto-bellevue': {
    id:         'ab7d1fc1-f069-4e3b-a515-8e1204c11247',
    name:       'Alto Bellevue',
    slug:       'alto-bellevue',
    type:       'condominio_fechado',
    mapJsonUrl: '/maps/alto-bellevue-lots.json',
    reservationRules: {
      expirationHours: 48,
      allowMultipleLots: false,
      requireManagerApproval: true,
    },
    whatsappContact: '5581986141487',
  },
  'miguel-marques': {
    id:         '8b9f6835-1bd0-4850-80b0-aaef2223300d',
    name:       'Loteamento Miguel Marques',
    slug:       'miguel-marques',
    type:       'loteamento',
    mapJsonUrl: '/maps/miguel-marques-lots.json',
    blocks:     ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'],
    reservationRules: {
      expirationHours: 72,
      allowMultipleLots: true,
      requireManagerApproval: false,
    },
    whatsappContact: '5581986141487',
  },
}

export function getDevelopmentBySlug(slug: string): DevelopmentConfig | null {
  return DEVELOPMENTS[slug] ?? null
}

export function getDevelopmentById(id: string): DevelopmentConfig | null {
  return Object.values(DEVELOPMENTS).find(d => d.id === id) ?? null
}

// ── WhatsApp message template ──────────────────────────────────────────────────

export interface LotWhatsAppContext {
  developmentName: string
  block: string
  lot: string
  area?: number
  status: LotStatus
  brokerName?: string
  expiresAt?: Date
}

export function buildWhatsAppMessage(ctx: LotWhatsAppContext): string {
  const statusLabel = LOT_STATUS_CONFIG[ctx.status]?.label ?? ctx.status
  const lines = [
    `*${ctx.developmentName}*`,
    `Quadra: ${ctx.block} — Lote: ${ctx.lot}`,
    ctx.area ? `Área: ${ctx.area}m²` : '',
    `Status: ${statusLabel}`,
    ctx.brokerName ? `Corretor: ${ctx.brokerName}` : '',
    ctx.expiresAt
      ? `Prazo reserva: ${ctx.expiresAt.toLocaleDateString('pt-BR')}`
      : '',
  ].filter(Boolean)

  return lines.join('\n')
}
