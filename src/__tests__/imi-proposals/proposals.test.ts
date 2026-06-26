import {
  PROPOSAL_STATUSES,
  canTransition,
  nextStatus,
  brokerActions,
  approverActions,
  formatBRL,
} from '@/lib/imi-proposals/status'
import { MANO_IMOVEIS_COMPRA, deriveProposalSummary, getProposalTemplate } from '@/lib/imi-proposals/template'

describe('imi-proposals · status workflow', () => {
  it('has the 7 canonical statuses', () => {
    expect(PROPOSAL_STATUSES).toHaveLength(7)
    expect(PROPOSAL_STATUSES).toContain('approved')
    expect(PROPOSAL_STATUSES).toContain('expired')
  })

  it('allows submit from draft only', () => {
    expect(canTransition('submit', 'draft')).toBe(true)
    expect(canTransition('submit', 'approved')).toBe(false)
    expect(nextStatus('submit')).toBe('submitted')
  })

  it('allows approve/reject from submitted or under_review', () => {
    expect(canTransition('approve', 'submitted')).toBe(true)
    expect(canTransition('approve', 'under_review')).toBe(true)
    expect(canTransition('reject', 'draft')).toBe(false)
    expect(canTransition('reject', 'approved')).toBe(false)
  })

  it('exposes broker vs approver actions by status', () => {
    expect(brokerActions('draft')).toEqual(expect.arrayContaining(['submit', 'cancel']))
    expect(approverActions('submitted')).toEqual(expect.arrayContaining(['approve', 'reject']))
    // A broker cannot approve.
    expect(brokerActions('submitted')).not.toContain('approve')
    // No actions once approved (terminal for these sets).
    expect(approverActions('approved')).toHaveLength(0)
  })

  it('formats BRL and handles empty', () => {
    expect(formatBRL(null)).toBe('—')
    expect(formatBRL(250000).replace(/ /g, ' ')).toBe('R$ 250.000,00')
  })
})

describe('imi-proposals · template engine', () => {
  it('exposes the Mano Imóveis template', () => {
    expect(getProposalTemplate('mano-imoveis-compra')).toBe(MANO_IMOVEIS_COMPRA)
    expect(getProposalTemplate('inexistente')).toBeNull()
  })

  it('models the physical form groups (incl. 3 references)', () => {
    const keys = MANO_IMOVEIS_COMPRA.schema.groups.map((g) => g.key)
    expect(keys).toEqual(
      expect.arrayContaining(['comprador', 'conjuge', 'contato', 'imovel', 'condicoes', 'referencias', 'intervenientes'])
    )
    const refs = MANO_IMOVEIS_COMPRA.schema.groups.find((g) => g.key === 'referencias')
    expect(refs?.repeat).toBe(3)
    expect(MANO_IMOVEIS_COMPRA.schema.reserveHours).toBe(24)
  })

  it('derives denormalized summary from structured form_data', () => {
    const summary = deriveProposalSummary({
      comprador: { nome: 'Maria Silva', cpf: '123.456.789-00' },
      contato: { email: 'maria@example.com', fone: '81 99999-0000' },
      imovel: { loteamento: 'Alto Bellevue', lotes: '12', quadras: 'B' },
      condicoes: { valor: 'R$ 350.000,00', sinal: '35.000', parcelas: '120x' },
    })
    expect(summary.client_name).toBe('Maria Silva')
    expect(summary.client_email).toBe('maria@example.com')
    expect(summary.unit_label).toBe('Lote 12 / Quadra B')
    expect(summary.total_amount).toBe(350000)
    expect(summary.down_payment).toBe(35000)
    expect(summary.installments).toBe('120x')
  })

  it('falls back to a safe client name when missing', () => {
    expect(deriveProposalSummary({}).client_name).toBe('Cliente sem nome')
  })
})
