/**
 * @jest-environment node
 */
import { computeMatchScore, normalizeDocument } from '@/lib/finance/matching'

describe('normalizeDocument', () => {
    it('strips non-digit characters', () => {
        expect(normalizeDocument('09.856.046/0001-43')).toBe('09856046000143')
    })
    it('handles null/undefined', () => {
        expect(normalizeDocument(null)).toBe('')
        expect(normalizeDocument(undefined)).toBe('')
    })
})

describe('computeMatchScore', () => {
    const base = {
        repasseAmount: 5000,
        repasseDueDate: '2026-07-05',
        txAmount: 5000,
        txDate: '2026-07-05',
        txCounterpartyName: 'SEVERINO JOSE ALVES PAES IMOVEIS EIRELLE',
        txCounterpartyDocument: '09856046000143',
        agencyName: 'Mano Imóveis',
        agencyDocument: '09.856.046/0001-43',
    }

    it('scores a perfect match near 100', () => {
        const { score, method } = computeMatchScore(base)
        expect(score).toBeGreaterThanOrEqual(90)
        expect(method).toContain('valor_exato')
        expect(method).toContain('documento_exato')
    })

    it('scores lower for approximate value and distant date', () => {
        const { score } = computeMatchScore({
            ...base,
            txAmount: 5080, // ~1.6% off
            txDate: '2026-07-12', // 7 days off
        })
        expect(score).toBeLessThan(90)
        expect(score).toBeGreaterThan(0)
    })

    it('scores zero when nothing matches', () => {
        const { score, method } = computeMatchScore({
            repasseAmount: 5000,
            repasseDueDate: '2026-07-05',
            txAmount: 100,
            txDate: '2020-01-01',
            txCounterpartyName: 'ALGUEM QUALQUER',
            txCounterpartyDocument: '11111111000199',
            agencyName: 'Mano Imóveis',
            agencyDocument: '09.856.046/0001-43',
        })
        expect(score).toBe(0)
        expect(method).toBe('nenhum')
    })

    it('never exceeds 100', () => {
        const { score } = computeMatchScore(base)
        expect(score).toBeLessThanOrEqual(100)
    })
})
