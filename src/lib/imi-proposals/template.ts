/**
 * IMI Proposals — template engine (single source of truth for the frontend,
 * mirrors the DB seed in supabase/migrations/20260626_imi_proposals_engine.sql).
 *
 * The proposal form is NOT hardcoded: it is described by a template schema so
 * new models (other construtoras / produtos) can be added without code changes.
 * This module mirrors the "mano-imoveis-compra" template so the form renders
 * instantly without a round trip; the DB row remains the authoritative copy.
 */

export type ProposalFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'currency'
  | 'number'
  | 'textarea'

export interface ProposalField {
  key: string
  label: string
  type: ProposalFieldType
  required?: boolean
}

export interface ProposalGroup {
  key: string
  title: string
  /** When set, the group repeats N times (e.g. 3 personal references). */
  repeat?: number
  fields: ProposalField[]
}

export interface ProposalTemplateSchema {
  reserveHours: number
  groups: ProposalGroup[]
  observacao: string
}

export interface ProposalTemplate {
  key: string
  name: string
  version: number
  description?: string
  schema: ProposalTemplateSchema
}

/**
 * "Proposta de Compra — Mano Imóveis" — modelado campo a campo a partir do
 * formulário físico MI GESTÃO fotografado.
 */
export const MANO_IMOVEIS_COMPRA: ProposalTemplate = {
  key: 'mano-imoveis-compra',
  name: 'Proposta de Compra — Mano Imóveis',
  version: 1,
  description:
    'Digitalização do formulário físico MI GESTÃO (Proposta de Compra). Reserva válida por 24h.',
  schema: {
    reserveHours: 24,
    groups: [
      {
        key: 'comprador',
        title: 'Comprador',
        fields: [
          { key: 'nome', label: 'Nome', type: 'text', required: true },
          { key: 'rg', label: 'RG', type: 'text' },
          { key: 'cpf', label: 'CPF', type: 'text' },
          { key: 'data_nasc', label: 'Data de Nasc.', type: 'date' },
          { key: 'est_civil', label: 'Est. Civil', type: 'text' },
          { key: 'profissao', label: 'Profissão', type: 'text' },
        ],
      },
      {
        key: 'conjuge',
        title: 'Cônjuge',
        fields: [
          { key: 'nome', label: 'Nome Cônjuge', type: 'text' },
          { key: 'rg', label: 'RG', type: 'text' },
          { key: 'cpf', label: 'CPF', type: 'text' },
          { key: 'data_nasc', label: 'Data de Nasc.', type: 'date' },
        ],
      },
      {
        key: 'contato',
        title: 'Contato & Endereço',
        fields: [
          { key: 'email', label: 'E-mail', type: 'email' },
          { key: 'fone', label: 'Fone', type: 'tel' },
          { key: 'end_comercial', label: 'End. Comercial', type: 'text' },
          { key: 'end_residencial', label: 'End. Residencial', type: 'text' },
          { key: 'cep', label: 'CEP', type: 'text' },
          { key: 'bairro', label: 'Bairro', type: 'text' },
          { key: 'cidade', label: 'Cidade', type: 'text' },
        ],
      },
      {
        key: 'imovel',
        title: 'Imóvel',
        fields: [
          { key: 'loteamento', label: 'Loteamento', type: 'text' },
          { key: 'lotes', label: 'Lote(s)', type: 'text' },
          { key: 'quadras', label: 'Quadra(s)', type: 'text' },
          { key: 'metragem', label: 'm²', type: 'text' },
        ],
      },
      {
        key: 'condicoes',
        title: 'Condições de Pagamento',
        fields: [
          { key: 'valor', label: 'Valor R$', type: 'currency' },
          { key: 'sinal', label: 'Sinal R$', type: 'currency' },
          { key: 'entrada_sinal', label: 'Entrada / Sinal', type: 'text' },
          { key: 'reajuste', label: 'Reajuste', type: 'text' },
          { key: 'parcelas', label: 'Parcelas', type: 'text' },
          { key: 'vencimento_primeira', label: 'Vencimento 1ª Parcela', type: 'date' },
        ],
      },
      {
        key: 'referencias',
        title: 'Referências Pessoais',
        repeat: 3,
        fields: [
          { key: 'nome', label: 'Nome', type: 'text' },
          { key: 'endereco', label: 'Endereço', type: 'text' },
          { key: 'fone', label: 'Fone', type: 'tel' },
        ],
      },
      {
        key: 'intervenientes',
        title: 'Intervenientes',
        fields: [
          { key: 'comprador', label: 'Comprador', type: 'text' },
          { key: 'corretor', label: 'Corretor', type: 'text' },
          { key: 'corretor_creci', label: 'Corretor / CRECI', type: 'text' },
          { key: 'imobiliaria', label: 'Imobiliária', type: 'text' },
          { key: 'imobiliaria_creci', label: 'Imobiliária / CRECI', type: 'text' },
        ],
      },
    ],
    observacao:
      'Esta proposta de reserva tem validade de 24 horas, a contar da data de assinatura. Se neste prazo não houver efetivação do pagamento do sinal, ficará este cliente descompromissado pelo mesmo, liberando o(s) lote(s) acima citado(s) para nova reserva.',
  },
}

export const PROPOSAL_TEMPLATES: Record<string, ProposalTemplate> = {
  [MANO_IMOVEIS_COMPRA.key]: MANO_IMOVEIS_COMPRA,
}

export function getProposalTemplate(key: string): ProposalTemplate | null {
  return PROPOSAL_TEMPLATES[key] ?? null
}

/** Build the flat key for a repeated group field, e.g. referencias.1.nome */
export function repeatFieldKey(groupKey: string, index: number, fieldKey: string): string {
  return `${groupKey}.${index}.${fieldKey}`
}

/**
 * Maps the structured form_data of the Mano Imóveis template onto the
 * denormalized columns stored on imi.proposals for fast listing/search.
 */
export function deriveProposalSummary(formData: Record<string, any>) {
  const num = (v: unknown): number | null => {
    if (v == null || v === '') return null
    const n =
      typeof v === 'number'
        ? v
        : Number(String(v).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }
  const comprador = formData.comprador ?? {}
  const contato = formData.contato ?? {}
  const imovel = formData.imovel ?? {}
  const condicoes = formData.condicoes ?? {}

  const lotes = imovel.lotes ? `Lote ${imovel.lotes}` : ''
  const quadras = imovel.quadras ? `Quadra ${imovel.quadras}` : ''
  const unitLabel = [lotes, quadras].filter(Boolean).join(' / ') || null

  return {
    client_name: (comprador.nome || '').trim() || 'Cliente sem nome',
    client_cpf: comprador.cpf || null,
    client_email: contato.email || null,
    client_phone: contato.fone || null,
    loteamento: imovel.loteamento || null,
    unit_label: unitLabel,
    total_amount: num(condicoes.valor),
    down_payment: num(condicoes.sinal),
    installments: condicoes.parcelas || null,
  }
}
