// ─── Subsidy Engine — MCMV + Habite Seguro ───────────────────────────────────
// Rule-based, strictly typed, extensible. All monetary values in BRL.
// Income brackets and subsidy ranges per Caixa Econômica Federal rules (2024–2025).

export type MaritalStatus = 'single' | 'married' | 'couple_unmarried' | 'divorced' | 'widowed'
export type Profession = 'civilian' | 'police' | 'firefighter' | 'guard' | 'military'
export type EligibilityFlag =
    | 'mcmv_faixa_1'
    | 'mcmv_faixa_1_5'
    | 'mcmv_faixa_2'
    | 'mcmv_faixa_3'
    | 'habite_seguro'
    | 'fgts_eligible'
    | 'no_subsidy'

export interface SimulationInput {
    income: number            // gross monthly income in BRL
    marital_status: MaritalStatus
    profession: Profession
    has_property: boolean     // already owns real estate in Brazil
    fgts_balance: number      // FGTS accumulated balance
    location: string          // city/state for regional adjustments
    property_value: number    // target property value
    service_time_years?: number // for Habite Seguro eligibility
}

export interface SubsidyResult {
    estimated_subsidy: number
    financing_amount: number
    down_payment_required: number
    monthly_payment: number
    eligibility_flags: EligibilityFlag[]
    risk_score: number          // 0–100; higher = riskier financing
    programs: ProgramBreakdown[]
    feasibility: 'viable' | 'marginal' | 'inviable'
}

export interface ProgramBreakdown {
    name: string
    subsidy: number
    max_property_value: number
    interest_rate_pa: number  // annual percentage
    max_term_months: number
    eligible: boolean
    reason?: string           // why ineligible, if applicable
}

// ─── MCMV Constants (CEF 2024–2025) ──────────────────────────────────────────

const MCMV_FAIXAS = [
    {
        name: 'Faixa 1' as const,
        flag: 'mcmv_faixa_1' as EligibilityFlag,
        max_income: 2640,
        max_property_value: 264000,
        subsidy_base: 55000,
        subsidy_min: 30000,
        interest_rate_pa: 4.0,
        max_term_months: 360,
    },
    {
        name: 'Faixa 1.5' as const,
        flag: 'mcmv_faixa_1_5' as EligibilityFlag,
        max_income: 4400,
        max_property_value: 264000,
        subsidy_base: 29000,
        subsidy_min: 4000,
        interest_rate_pa: 5.0,
        max_term_months: 360,
    },
    {
        name: 'Faixa 2' as const,
        flag: 'mcmv_faixa_2' as EligibilityFlag,
        max_income: 8000,
        max_property_value: 350000,
        subsidy_base: 0,
        subsidy_min: 0,
        interest_rate_pa: 7.66,
        max_term_months: 420,
    },
    {
        name: 'Faixa 3' as const,
        flag: 'mcmv_faixa_3' as EligibilityFlag,
        max_income: 13000,
        max_property_value: 500000,
        subsidy_base: 0,
        subsidy_min: 0,
        interest_rate_pa: 9.16,
        max_term_months: 420,
    },
]

const HABITE_SEGURO = {
    eligible_professions: ['police', 'firefighter', 'guard', 'military'] as Profession[],
    max_income: 7000,
    max_property_value: 350000,
    subsidy_max: 13000,
    min_service_time_years: 3,
    interest_rate_pa: 5.25,
    max_term_months: 360,
}

// FGTS can be used as partial down payment for Faixas 1.5–3
const FGTS_MIN_ELIGIBLE_INCOME = 2640
const FGTS_MAX_ELIGIBLE_INCOME = 13000

// Commitment ratio: max % of gross income for housing payment (CEF standard)
const MAX_COMMITMENT_RATIO = 0.30

// ─── Core calculation helpers ─────────────────────────────────────────────────

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
    if (annualRate === 0 || principal <= 0) return principal / termMonths
    const r = annualRate / 100 / 12
    return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1)
}

function interpolateSubsidy(income: number, faixa: typeof MCMV_FAIXAS[0], prevMaxIncome: number): number {
    if (faixa.subsidy_base === 0) return 0
    const range = faixa.max_income - prevMaxIncome
    const position = income - prevMaxIncome
    const ratio = Math.max(0, Math.min(1, 1 - position / range))
    return Math.round((faixa.subsidy_min + ratio * (faixa.subsidy_base - faixa.subsidy_min)) / 1000) * 1000
}

function calcRiskScore(input: SimulationInput, monthlyPayment: number): number {
    let score = 0
    const commitmentRatio = monthlyPayment / input.income
    if (commitmentRatio > 0.35) score += 40
    else if (commitmentRatio > 0.30) score += 20
    else if (commitmentRatio > 0.25) score += 10
    if (input.has_property) score += 15
    if (input.fgts_balance < 10000) score += 10
    if (input.income < 2000) score += 20
    return Math.min(100, score)
}

// ─── Main simulation function ─────────────────────────────────────────────────

export function simulate(input: SimulationInput): SubsidyResult {
    validateInput(input)

    const programs: ProgramBreakdown[] = []
    const flags: EligibilityFlag[] = []

    // ── MCMV Faixas ──────────────────────────────────────────────────────────
    let mcmvSubsidy = 0
    let bestMcmvProgram: (typeof MCMV_FAIXAS)[0] | null = null

    for (let i = 0; i < MCMV_FAIXAS.length; i++) {
        const faixa = MCMV_FAIXAS[i]
        const prevMaxIncome = i > 0 ? MCMV_FAIXAS[i - 1].max_income : 0
        const eligible =
            input.income <= faixa.max_income &&
            input.property_value <= faixa.max_property_value &&
            !input.has_property

        let reason: string | undefined
        if (input.has_property) reason = 'Titular já possui imóvel registrado no CPF'
        else if (input.income > faixa.max_income) reason = `Renda acima do limite (R$ ${faixa.max_income.toLocaleString('pt-BR')})`
        else if (input.property_value > faixa.max_property_value) reason = `Valor do imóvel acima do teto (R$ ${faixa.max_property_value.toLocaleString('pt-BR')})`

        const subsidy = eligible ? interpolateSubsidy(input.income, faixa, prevMaxIncome) : 0

        programs.push({
            name: `Minha Casa Minha Vida — ${faixa.name}`,
            subsidy,
            max_property_value: faixa.max_property_value,
            interest_rate_pa: faixa.interest_rate_pa,
            max_term_months: faixa.max_term_months,
            eligible,
            reason,
        })

        if (eligible) {
            flags.push(faixa.flag)
            if (subsidy > mcmvSubsidy) {
                mcmvSubsidy = subsidy
                bestMcmvProgram = faixa
            }
        }
    }

    // ── Habite Seguro ─────────────────────────────────────────────────────────
    const habiteEligible =
        HABITE_SEGURO.eligible_professions.includes(input.profession) &&
        input.income <= HABITE_SEGURO.max_income &&
        input.property_value <= HABITE_SEGURO.max_property_value &&
        !input.has_property &&
        (input.service_time_years ?? 0) >= HABITE_SEGURO.min_service_time_years

    let habiteReason: string | undefined
    if (!HABITE_SEGURO.eligible_professions.includes(input.profession)) habiteReason = 'Profissão não elegível (policial, bombeiro, guarda ou militar)'
    else if (input.income > HABITE_SEGURO.max_income) habiteReason = 'Renda acima do limite do programa'
    else if (input.has_property) habiteReason = 'Titular já possui imóvel'
    else if ((input.service_time_years ?? 0) < HABITE_SEGURO.min_service_time_years) habiteReason = `Tempo mínimo de serviço: ${HABITE_SEGURO.min_service_time_years} anos`

    const habiteSubsidy = habiteEligible ? HABITE_SEGURO.subsidy_max : 0
    programs.push({
        name: 'Habite Seguro',
        subsidy: habiteSubsidy,
        max_property_value: HABITE_SEGURO.max_property_value,
        interest_rate_pa: HABITE_SEGURO.interest_rate_pa,
        max_term_months: HABITE_SEGURO.max_term_months,
        eligible: habiteEligible,
        reason: habiteReason,
    })

    if (habiteEligible) flags.push('habite_seguro')

    // ── FGTS ─────────────────────────────────────────────────────────────────
    const fgtsEligible =
        input.income >= FGTS_MIN_ELIGIBLE_INCOME &&
        input.income <= FGTS_MAX_ELIGIBLE_INCOME &&
        input.fgts_balance > 0 &&
        !input.has_property
    if (fgtsEligible) flags.push('fgts_eligible')

    if (flags.length === 0) flags.push('no_subsidy')

    // ── Best scenario assembly ────────────────────────────────────────────────
    // Max subsidy = best MCMV subsidy + Habite Seguro (stackable if eligible for both)
    const estimatedSubsidy = mcmvSubsidy + habiteSubsidy
    const effectiveFgts = fgtsEligible ? Math.min(input.fgts_balance, input.property_value * 0.20) : 0

    const financedPrincipal = Math.max(0, input.property_value - estimatedSubsidy - effectiveFgts)
    const downPaymentRequired = Math.max(0, input.property_value - estimatedSubsidy - financedPrincipal)

    // Choose interest rate from best eligible program
    const bestRate = bestMcmvProgram?.interest_rate_pa ??
        (habiteEligible ? HABITE_SEGURO.interest_rate_pa : 10.5)
    const bestTerm = bestMcmvProgram?.max_term_months ??
        (habiteEligible ? HABITE_SEGURO.max_term_months : 360)

    const monthlyPayment = calcMonthlyPayment(financedPrincipal, bestRate, bestTerm)
    const riskScore = calcRiskScore(input, monthlyPayment)

    const commitmentRatio = monthlyPayment / input.income
    const feasibility: SubsidyResult['feasibility'] =
        commitmentRatio <= MAX_COMMITMENT_RATIO ? 'viable'
            : commitmentRatio <= 0.40 ? 'marginal'
                : 'inviable'

    return {
        estimated_subsidy: estimatedSubsidy,
        financing_amount: financedPrincipal,
        down_payment_required: downPaymentRequired,
        monthly_payment: Math.round(monthlyPayment),
        eligibility_flags: flags,
        risk_score: riskScore,
        programs,
        feasibility,
    }
}

// ─── Input validation ─────────────────────────────────────────────────────────

export class SimulationValidationError extends Error {
    constructor(public field: string, message: string) {
        super(message)
        this.name = 'SimulationValidationError'
    }
}

function validateInput(input: SimulationInput): void {
    if (!Number.isFinite(input.income) || input.income < 0)
        throw new SimulationValidationError('income', 'Renda deve ser um valor positivo')
    if (!Number.isFinite(input.property_value) || input.property_value <= 0)
        throw new SimulationValidationError('property_value', 'Valor do imóvel deve ser maior que zero')
    if (!Number.isFinite(input.fgts_balance) || input.fgts_balance < 0)
        throw new SimulationValidationError('fgts_balance', 'Saldo FGTS deve ser zero ou positivo')
    if (input.service_time_years !== undefined && (!Number.isFinite(input.service_time_years) || input.service_time_years < 0))
        throw new SimulationValidationError('service_time_years', 'Tempo de serviço deve ser zero ou positivo')
}
