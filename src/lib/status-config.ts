/**
 * Centralized status configuration for IMI
 * Colors, labels, and icons for all entity statuses
 */

export interface StatusConfig {
  label: string
  color: string
  bg: string
  icon?: string
}

// Property/Development statuses
export const PROPERTY_STATUS: Record<string, StatusConfig> = {
  lancamento: { label: 'Lançamento', color: '#C8A44A', bg: 'rgba(200,164,74,.12)' },
  disponivel: { label: 'Disponível', color: '#5DB887', bg: 'rgba(93,184,135,.12)' },
  em_construcao: { label: 'Em Construção', color: '#5B9BD5', bg: 'rgba(91,155,213,.12)' },
  vendido: { label: 'Vendido', color: '#E06B6B', bg: 'rgba(224,107,107,.12)' },
  reservado: { label: 'Reservado', color: '#D4913A', bg: 'rgba(212,145,58,.12)' },
  em_negociacao: { label: 'Em Negociação', color: '#D4913A', bg: 'rgba(212,145,58,.12)' },
  rascunho: { label: 'Rascunho', color: '#6B7280', bg: 'rgba(107,114,128,.12)' },
  privado: { label: 'Privado', color: '#6B7280', bg: 'rgba(107,114,128,.12)' },
  arquivado: { label: 'Arquivado', color: '#4B5563', bg: 'rgba(75,85,99,.12)' },
}

// Lead statuses
export const LEAD_STATUS: Record<string, StatusConfig> = {
  new: { label: 'Novo', color: '#5B9BD5', bg: 'rgba(91,155,213,.12)' },
  contacted: { label: 'Contactado', color: '#C8A44A', bg: 'rgba(200,164,74,.12)' },
  warm: { label: 'Morno', color: '#D4913A', bg: 'rgba(212,145,58,.12)' },
  hot: { label: 'Quente', color: '#E06B6B', bg: 'rgba(224,107,107,.12)' },
  cold: { label: 'Frio', color: '#6B7280', bg: 'rgba(107,114,128,.12)' },
  qualified: { label: 'Qualificado', color: '#5DB887', bg: 'rgba(93,184,135,.12)' },
  proposal: { label: 'Proposta', color: '#C8A44A', bg: 'rgba(200,164,74,.12)' },
  won: { label: 'Ganho', color: '#5DB887', bg: 'rgba(93,184,135,.12)' },
  lost: { label: 'Perdido', color: '#E06B6B', bg: 'rgba(224,107,107,.12)' },
}

// Deal statuses
export const DEAL_STATUS: Record<string, StatusConfig> = {
  prospecting: { label: 'Prospecção', color: '#5B9BD5', bg: 'rgba(91,155,213,.12)' },
  proposal: { label: 'Proposta', color: '#C8A44A', bg: 'rgba(200,164,74,.12)' },
  negotiation: { label: 'Negociação', color: '#D4913A', bg: 'rgba(212,145,58,.12)' },
  closed_won: { label: 'Fechado', color: '#5DB887', bg: 'rgba(93,184,135,.12)' },
  closed_lost: { label: 'Perdido', color: '#E06B6B', bg: 'rgba(224,107,107,.12)' },
  cancelled: { label: 'Cancelado', color: '#6B7280', bg: 'rgba(107,114,128,.12)' },
}

// Commission statuses
export const COMMISSION_STATUS: Record<string, StatusConfig> = {
  pending: { label: 'Pendente', color: '#D4913A', bg: 'rgba(212,145,58,.12)' },
  receivable: { label: 'A Receber', color: '#5B9BD5', bg: 'rgba(91,155,213,.12)' },
  paid: { label: 'Pago', color: '#5DB887', bg: 'rgba(93,184,135,.12)' },
  disputed: { label: 'Disputado', color: '#E06B6B', bg: 'rgba(224,107,107,.12)' },
  cancelled: { label: 'Cancelado', color: '#6B7280', bg: 'rgba(107,114,128,.12)' },
}

/**
 * Get status config for any entity type
 */
export function getStatusConfig(
  status: string,
  type: 'property' | 'lead' | 'deal' | 'commission' = 'property'
): StatusConfig {
  const maps = { property: PROPERTY_STATUS, lead: LEAD_STATUS, deal: DEAL_STATUS, commission: COMMISSION_STATUS }
  return maps[type][status] ?? { label: status, color: '#6B7280', bg: 'rgba(107,114,128,.12)' }
}
