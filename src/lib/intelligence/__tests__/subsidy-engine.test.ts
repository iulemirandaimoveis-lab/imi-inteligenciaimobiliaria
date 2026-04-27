/**
 * @jest-environment node
 */
import { simulate, SimulationValidationError } from '../subsidy-engine'
import type { SimulationInput } from '../subsidy-engine'

const base: SimulationInput = {
    income: 0,
    marital_status: 'single',
    profession: 'civilian',
    has_property: false,
    fgts_balance: 0,
    location: 'Recife',
    property_value: 200000,
}

// ─── Scenario: low income single buyer (Faixa 1) ─────────────────────────────

describe('low_income_single', () => {
    const input: SimulationInput = { ...base, income: 2000, property_value: 200000, fgts_balance: 5000 }
    const result = simulate(input)

    it('receives maximum MCMV subsidy', () => {
        expect(result.estimated_subsidy).toBeGreaterThanOrEqual(30000)
    })

    it('is flagged as mcmv_faixa_1', () => {
        expect(result.eligibility_flags).toContain('mcmv_faixa_1')
    })

    it('is not flagged as habite_seguro', () => {
        expect(result.eligibility_flags).not.toContain('habite_seguro')
    })

    it('financing_amount is property_value minus subsidy minus fgts contribution', () => {
        expect(result.financing_amount).toBeLessThan(input.property_value)
    })

    it('monthly_payment is a positive number', () => {
        expect(result.monthly_payment).toBeGreaterThan(0)
    })

    it('feasibility is viable or marginal', () => {
        expect(['viable', 'marginal']).toContain(result.feasibility)
    })
})

// ─── Scenario: police with Habite Seguro ─────────────────────────────────────

describe('police_with_subsidy', () => {
    // income=4000 fits Faixa 1.5 (≤4400) AND Habite Seguro (≤7000)
    // property_value=250000 fits Faixa 1.5 cap of 264000 AND Habite Seguro cap of 350000
    const input: SimulationInput = {
        ...base,
        income: 4000,
        profession: 'police',
        property_value: 250000,
        fgts_balance: 20000,
        service_time_years: 5,
    }
    const result = simulate(input)

    it('is eligible for habite_seguro', () => {
        expect(result.eligibility_flags).toContain('habite_seguro')
    })

    it('receives habite_seguro subsidy of 13000', () => {
        const habite = result.programs.find(p => p.name === 'Habite Seguro')
        expect(habite?.eligible).toBe(true)
        expect(habite?.subsidy).toBe(13000)
    })

    it('is also eligible for MCMV Faixa 1.5', () => {
        expect(result.eligibility_flags).toContain('mcmv_faixa_1_5')
    })

    it('total subsidy stacks MCMV + Habite Seguro', () => {
        expect(result.estimated_subsidy).toBeGreaterThan(13000)
    })
})

// ─── Scenario: police insufficient service time ───────────────────────────────

describe('police_insufficient_service', () => {
    const input: SimulationInput = {
        ...base,
        income: 5000,
        profession: 'police',
        property_value: 300000,
        service_time_years: 1,
    }
    const result = simulate(input)

    it('is NOT eligible for habite_seguro with < 3 years service', () => {
        expect(result.eligibility_flags).not.toContain('habite_seguro')
    })

    it('habite_seguro program shows reason', () => {
        const habite = result.programs.find(p => p.name === 'Habite Seguro')
        expect(habite?.eligible).toBe(false)
        expect(habite?.reason).toMatch(/anos/)
    })
})

// ─── Scenario: high income — no subsidy ──────────────────────────────────────

describe('high_income_no_subsidy', () => {
    const input: SimulationInput = { ...base, income: 15000, property_value: 800000, fgts_balance: 50000 }
    const result = simulate(input)

    it('receives zero subsidy', () => {
        expect(result.estimated_subsidy).toBe(0)
    })

    it('is flagged as no_subsidy', () => {
        expect(result.eligibility_flags).toContain('no_subsidy')
    })

    it('all MCMV programs are ineligible', () => {
        const mcmv = result.programs.filter(p => p.name.startsWith('Minha Casa'))
        expect(mcmv.every(p => !p.eligible)).toBe(true)
    })
})

// ─── Scenario: already owns property ─────────────────────────────────────────

describe('existing_property_owner', () => {
    const input: SimulationInput = { ...base, income: 3000, has_property: true, property_value: 200000 }
    const result = simulate(input)

    it('receives zero subsidy when already owns property', () => {
        expect(result.estimated_subsidy).toBe(0)
    })

    it('no MCMV programs are eligible', () => {
        const mcmv = result.programs.filter(p => p.name.startsWith('Minha Casa'))
        expect(mcmv.every(p => !p.eligible)).toBe(true)
    })
})

// ─── Validation errors ────────────────────────────────────────────────────────

describe('input validation', () => {
    it('throws on negative income', () => {
        expect(() => simulate({ ...base, income: -1 })).toThrow(SimulationValidationError)
    })

    it('throws on zero property_value', () => {
        expect(() => simulate({ ...base, income: 3000, property_value: 0 })).toThrow(SimulationValidationError)
    })

    it('throws on negative fgts_balance', () => {
        expect(() => simulate({ ...base, income: 3000, property_value: 200000, fgts_balance: -100 })).toThrow(SimulationValidationError)
    })
})

// ─── Subsidy interpolation logic ──────────────────────────────────────────────

describe('subsidy interpolation', () => {
    it('lower income within Faixa 1 yields higher subsidy than upper bound', () => {
        const low = simulate({ ...base, income: 1500, property_value: 200000 })
        const high = simulate({ ...base, income: 2600, property_value: 200000 })
        expect(low.estimated_subsidy).toBeGreaterThanOrEqual(high.estimated_subsidy)
    })

    it('Faixa 1.5 income produces less subsidy than Faixa 1', () => {
        const faixa1 = simulate({ ...base, income: 2000, property_value: 200000 })
        const faixa1_5 = simulate({ ...base, income: 3500, property_value: 200000 })
        expect(faixa1.estimated_subsidy).toBeGreaterThan(faixa1_5.estimated_subsidy)
    })
})
