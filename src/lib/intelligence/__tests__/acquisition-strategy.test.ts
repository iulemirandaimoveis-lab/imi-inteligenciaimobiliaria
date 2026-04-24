/**
 * @jest-environment node
 */
import { buildStrategy } from '../acquisition-strategy'
import type { BuyerProfile } from '../acquisition-strategy'

const buyerA: BuyerProfile = {
    id: 'buyer_a',
    label: 'Comprador A',
    input: {
        income: 3000,
        marital_status: 'single',
        profession: 'civilian',
        has_property: false,
        fgts_balance: 15000,
        location: 'Recife',
        property_value: 220000,
    },
}

const buyerB: BuyerProfile = {
    id: 'buyer_b',
    label: 'Comprador B',
    input: {
        income: 3500,
        marital_status: 'single',
        profession: 'civilian',
        has_property: false,
        fgts_balance: 8000,
        location: 'Recife',
        property_value: 220000,
    },
}

const highIncomeBuyer: BuyerProfile = {
    id: 'buyer_b',
    label: 'Comprador B',
    input: {
        income: 14000,
        marital_status: 'single',
        profession: 'civilian',
        has_property: false,
        fgts_balance: 60000,
        location: 'São Paulo',
        property_value: 900000,
    },
}

// ─── single_buyer ─────────────────────────────────────────────────────────────

describe('single_buyer', () => {
    const result = buildStrategy('single_buyer', [buyerA])

    it('returns exactly one step', () => {
        expect(result.steps).toHaveLength(1)
    })

    it('step 1 offset is 0', () => {
        expect(result.steps[0].month_offset).toBe(0)
    })

    it('total_subsidy matches step subsidy', () => {
        expect(result.total_subsidy).toBe(result.steps[0].subsidy)
    })

    it('projected equity is positive', () => {
        expect(result.total_equity_12m).toBeGreaterThan(0)
    })
})

// ─── couple_unmarried — separate CPF strategy ─────────────────────────────────

describe('couple_split_strategy (couple_unmarried)', () => {
    const result = buildStrategy('couple_unmarried', [buyerA, buyerB])

    it('returns exactly two steps', () => {
        expect(result.steps).toHaveLength(2)
    })

    it('step 2 starts at month offset 6', () => {
        expect(result.steps[1].month_offset).toBe(6)
    })

    it('total subsidy is sum of both individual subsidies', () => {
        const sumSteps = result.steps.reduce((s, st) => s + st.subsidy, 0)
        expect(result.total_subsidy).toBe(sumSteps)
    })

    it('total_subsidy is greater than single buyer subsidy', () => {
        const single = buildStrategy('single_buyer', [buyerA])
        expect(result.total_subsidy).toBeGreaterThan(single.total_subsidy)
    })
})

// ─── married — combined income ────────────────────────────────────────────────

describe('married', () => {
    const result = buildStrategy('married', [buyerA, buyerB])

    it('returns exactly one step with combined label', () => {
        expect(result.steps).toHaveLength(1)
        expect(result.steps[0].buyer_label).toContain('+')
    })

    it('step 1 offset is 0', () => {
        expect(result.steps[0].month_offset).toBe(0)
    })
})

// ─── mixed_income — optimization ─────────────────────────────────────────────

describe('mixed_income', () => {
    const result = buildStrategy('mixed_income', [buyerA, highIncomeBuyer])

    it('returns exactly two steps', () => {
        expect(result.steps).toHaveLength(2)
    })

    it('subsidized buyer goes first (step 1)', () => {
        expect(result.steps[0].subsidy).toBeGreaterThan(result.steps[1].subsidy)
    })

    it('second step starts at month 12', () => {
        expect(result.steps[1].month_offset).toBe(12)
    })
})

// ─── Error handling ───────────────────────────────────────────────────────────

describe('buildStrategy errors', () => {
    it('throws when couple_unmarried receives fewer than 2 buyers', () => {
        expect(() => buildStrategy('couple_unmarried', [buyerA])).toThrow()
    })

    it('throws on unknown scenario', () => {
        expect(() => buildStrategy('unknown_scenario' as never, [buyerA])).toThrow()
    })
})
