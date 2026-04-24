// ─── Multi-Acquisition Strategy Engine ────────────────────────────────────────
// Structures optimal property acquisition sequences for multiple buyers/scenarios.
// Handles separate-CPF optimization, timeline planning, and equity projection.

import { simulate, SimulationInput, SubsidyResult } from './subsidy-engine'

export type AcquisitionScenario =
    | 'single_buyer'
    | 'couple_unmarried'
    | 'married'
    | 'mixed_income'

export interface BuyerProfile {
    id: string          // 'buyer_a' | 'buyer_b'
    label: string       // display name
    input: SimulationInput
}

export interface AcquisitionStep {
    step: number
    buyer_id: string
    buyer_label: string
    property_value: number
    subsidy: number
    financing: number
    monthly_payment: number
    month_offset: number     // months from start when this acquisition happens
    notes: string[]
}

export interface StrategyResult {
    scenario: AcquisitionScenario
    total_subsidy: number
    total_equity_12m: number
    steps: AcquisitionStep[]
    recommended_sequence: string
    subsidy_maximization_tips: string[]
    feasibility_summary: string
}

// ─── Equity appreciation estimate (conservative 5% p.a.) ────────────────────

function projectEquity(propertyValue: number, financing: number, months: number): number {
    const appreciationRate = 0.05 / 12
    const appreciatedValue = propertyValue * Math.pow(1 + appreciationRate, months)
    const monthlyRate = 0.0766 / 12
    const paymentsRemaining = 360 - months
    const remainingDebt = financing *
        (Math.pow(1 + monthlyRate, 360) - Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, 360) - 1)
    return Math.max(0, appreciatedValue - Math.max(0, remainingDebt))
}

// ─── Scenario builders ────────────────────────────────────────────────────────

function buildSingleBuyer(buyer: BuyerProfile): StrategyResult {
    const result: SubsidyResult = simulate(buyer.input)

    const step: AcquisitionStep = {
        step: 1,
        buyer_id: buyer.id,
        buyer_label: buyer.label,
        property_value: buyer.input.property_value,
        subsidy: result.estimated_subsidy,
        financing: result.financing_amount,
        monthly_payment: result.monthly_payment,
        month_offset: 0,
        notes: buildStepNotes(result, buyer.input),
    }

    return {
        scenario: 'single_buyer',
        total_subsidy: result.estimated_subsidy,
        total_equity_12m: projectEquity(buyer.input.property_value, result.financing_amount, 12),
        steps: [step],
        recommended_sequence: 'Aquisição única — foco em maximizar subsídio e prazo',
        subsidy_maximization_tips: buildTips(result, buyer.input),
        feasibility_summary: buildFeasibilitySummary([result], [buyer.input]),
    }
}

function buildCoupleUnmarried(buyers: [BuyerProfile, BuyerProfile]): StrategyResult {
    // Separate CPFs = each buyer can access MCMV independently
    const [buyerA, buyerB] = buyers
    const resultA = simulate(buyerA.input)
    const resultB = simulate({ ...buyerB.input, has_property: false })

    const steps: AcquisitionStep[] = [
        {
            step: 1,
            buyer_id: buyerA.id,
            buyer_label: buyerA.label,
            property_value: buyerA.input.property_value,
            subsidy: resultA.estimated_subsidy,
            financing: resultA.financing_amount,
            monthly_payment: resultA.monthly_payment,
            month_offset: 0,
            notes: [
                `CPF ${buyerA.label}: subsídio de ${fmtCurrency(resultA.estimated_subsidy)}`,
                ...buildStepNotes(resultA, buyerA.input),
            ],
        },
        {
            step: 2,
            buyer_id: buyerB.id,
            buyer_label: buyerB.label,
            property_value: buyerB.input.property_value,
            subsidy: resultB.estimated_subsidy,
            financing: resultB.financing_amount,
            monthly_payment: resultB.monthly_payment,
            month_offset: 6,
            notes: [
                `CPF ${buyerB.label}: subsídio de ${fmtCurrency(resultB.estimated_subsidy)}`,
                'Aguardar 6 meses entre aquisições para estabilidade de crédito',
                ...buildStepNotes(resultB, buyerB.input),
            ],
        },
    ]

    const totalSubsidy = resultA.estimated_subsidy + resultB.estimated_subsidy
    const equityA = projectEquity(buyerA.input.property_value, resultA.financing_amount, 12)
    const equityB = projectEquity(buyerB.input.property_value, resultB.financing_amount, 6)

    return {
        scenario: 'couple_unmarried',
        total_subsidy: totalSubsidy,
        total_equity_12m: equityA + equityB,
        steps,
        recommended_sequence:
            'Aquisição sequencial: primeiro o titular com maior subsídio, depois o segundo CPF após 6 meses',
        subsidy_maximization_tips: [
            'CPFs separados permitem dois subsídios MCMV independentes',
            'O segundo imóvel pode ser colocado em nome do cônjuge sem comprometer o subsídio do primeiro',
            'Considere usar o FGTS de ambos para reduzir o financiamento',
            `Subsídio combinado potencial: ${fmtCurrency(totalSubsidy)}`,
            ...buildTips(resultA, buyerA.input),
        ],
        feasibility_summary: buildFeasibilitySummary([resultA, resultB], [buyerA.input, buyerB.input]),
    }
}

function buildMarried(buyers: [BuyerProfile, BuyerProfile]): StrategyResult {
    // Married = combined income for financing but shared subsidy eligibility (one MCMV per family)
    const [buyerA, buyerB] = buyers
    const combinedIncome = buyerA.input.income + buyerB.input.income
    const combinedInput: SimulationInput = {
        ...buyerA.input,
        income: combinedIncome,
        fgts_balance: buyerA.input.fgts_balance + buyerB.input.fgts_balance,
    }
    const result = simulate(combinedInput)

    const step: AcquisitionStep = {
        step: 1,
        buyer_id: 'couple',
        buyer_label: `${buyerA.label} + ${buyerB.label}`,
        property_value: buyerA.input.property_value,
        subsidy: result.estimated_subsidy,
        financing: result.financing_amount,
        monthly_payment: result.monthly_payment,
        month_offset: 0,
        notes: [
            `Renda combinada: ${fmtCurrency(combinedIncome)}/mês`,
            `FGTS combinado: ${fmtCurrency(combinedInput.fgts_balance)}`,
            ...buildStepNotes(result, combinedInput),
        ],
    }

    return {
        scenario: 'married',
        total_subsidy: result.estimated_subsidy,
        total_equity_12m: projectEquity(combinedInput.property_value, result.financing_amount, 12),
        steps: [step],
        recommended_sequence: 'Aquisição conjunta com renda e FGTS combinados — potencializa financiamento',
        subsidy_maximization_tips: [
            'Casados têm um único subsídio MCMV, mas a renda combinada permite financiar imóveis maiores',
            'Use o FGTS de ambos como entrada para reduzir parcelas',
            'Para o segundo imóvel, avalie separação em CPF de familiar próximo',
            ...buildTips(result, combinedInput),
        ],
        feasibility_summary: buildFeasibilitySummary([result], [combinedInput]),
    }
}

function buildMixedIncome(buyers: [BuyerProfile, BuyerProfile]): StrategyResult {
    // One eligible for subsidy (lower income), one not — optimize who buys what
    const [buyerA, buyerB] = buyers
    const resultA = simulate(buyerA.input)
    const resultB = simulate(buyerB.input)

    const subsidizedBuyer = resultA.estimated_subsidy >= resultB.estimated_subsidy ? buyerA : buyerB
    const subsidizedResult = resultA.estimated_subsidy >= resultB.estimated_subsidy ? resultA : resultB
    const nonSubsidizedBuyer = subsidizedBuyer === buyerA ? buyerB : buyerA
    const nonSubsidizedResult = subsidizedBuyer === buyerA ? resultB : resultA

    const steps: AcquisitionStep[] = [
        {
            step: 1,
            buyer_id: subsidizedBuyer.id,
            buyer_label: `${subsidizedBuyer.label} (imóvel subsidiado)`,
            property_value: subsidizedBuyer.input.property_value,
            subsidy: subsidizedResult.estimated_subsidy,
            financing: subsidizedResult.financing_amount,
            monthly_payment: subsidizedResult.monthly_payment,
            month_offset: 0,
            notes: [
                'Titular com menor renda inicia — maximiza subsídio MCMV',
                ...buildStepNotes(subsidizedResult, subsidizedBuyer.input),
            ],
        },
        {
            step: 2,
            buyer_id: nonSubsidizedBuyer.id,
            buyer_label: `${nonSubsidizedBuyer.label} (imóvel de investimento)`,
            property_value: nonSubsidizedBuyer.input.property_value,
            subsidy: nonSubsidizedResult.estimated_subsidy,
            financing: nonSubsidizedResult.financing_amount,
            monthly_payment: nonSubsidizedResult.monthly_payment,
            month_offset: 12,
            notes: [
                'Titular com maior renda compra imóvel de maior valor ou investimento',
                'Sem subsídio, mas com maior capacidade de financiamento',
                ...buildStepNotes(nonSubsidizedResult, nonSubsidizedBuyer.input),
            ],
        },
    ]

    return {
        scenario: 'mixed_income',
        total_subsidy: subsidizedResult.estimated_subsidy + nonSubsidizedResult.estimated_subsidy,
        total_equity_12m:
            projectEquity(subsidizedBuyer.input.property_value, subsidizedResult.financing_amount, 12) +
            projectEquity(nonSubsidizedBuyer.input.property_value, nonSubsidizedResult.financing_amount, 12),
        steps,
        recommended_sequence:
            'Otimização por renda: titular elegível ao subsídio compra primeiro, titular de maior renda compra imóvel de maior valor depois',
        subsidy_maximization_tips: [
            'Separar compras por CPF e renda maximiza o acesso a subsídios',
            'O imóvel subsidiado gera valorização enquanto o de maior valor é adquirido',
            `Subsídio MCMV capturado: ${fmtCurrency(subsidizedResult.estimated_subsidy)}`,
            ...buildTips(subsidizedResult, subsidizedBuyer.input),
        ],
        feasibility_summary: buildFeasibilitySummary(
            [subsidizedResult, nonSubsidizedResult],
            [subsidizedBuyer.input, nonSubsidizedBuyer.input],
        ),
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function buildStrategy(
    scenario: AcquisitionScenario,
    buyers: BuyerProfile[],
): StrategyResult {
    switch (scenario) {
        case 'single_buyer':
            if (buyers.length < 1) throw new Error('single_buyer requer ao menos 1 comprador')
            return buildSingleBuyer(buyers[0])

        case 'couple_unmarried':
        case 'married':
        case 'mixed_income':
            if (buyers.length < 2) throw new Error(`${scenario} requer 2 compradores`)
            return scenario === 'married'
                ? buildMarried([buyers[0], buyers[1]])
                : scenario === 'couple_unmarried'
                    ? buildCoupleUnmarried([buyers[0], buyers[1]])
                    : buildMixedIncome([buyers[0], buyers[1]])

        default:
            throw new Error(`Cenário desconhecido: ${scenario}`)
    }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function fmtCurrency(v: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
    }).format(v)
}

function buildStepNotes(result: SubsidyResult, input: SimulationInput): string[] {
    const notes: string[] = []
    if (result.feasibility === 'inviable') {
        notes.push(`Atenção: parcela compromete ${Math.round((result.monthly_payment / input.income) * 100)}% da renda`)
    }
    if (result.eligibility_flags.includes('fgts_eligible') && input.fgts_balance > 0) {
        notes.push(`FGTS de ${fmtCurrency(input.fgts_balance)} pode reduzir o financiamento`)
    }
    if (result.estimated_subsidy > 0) {
        notes.push(`Subsídio estimado: ${fmtCurrency(result.estimated_subsidy)}`)
    }
    return notes
}

function buildTips(result: SubsidyResult, input: SimulationInput): string[] {
    const tips: string[] = []
    if (result.feasibility === 'marginal') {
        tips.push('Considere aumentar a entrada para reduzir as parcelas mensais')
    }
    if (input.fgts_balance > 5000 && result.eligibility_flags.includes('fgts_eligible')) {
        tips.push(`Usar FGTS de ${fmtCurrency(input.fgts_balance)} reduz o principal financiado`)
    }
    if (!result.eligibility_flags.includes('mcmv_faixa_1') && input.income <= 3000) {
        tips.push('Verificar se há imóveis no teto do MCMV Faixa 1 na sua região')
    }
    return tips
}

function buildFeasibilitySummary(results: SubsidyResult[], inputs: SimulationInput[]): string {
    const allViable = results.every(r => r.feasibility === 'viable')
    const anyInviable = results.some(r => r.feasibility === 'inviable')
    const totalSubsidy = results.reduce((s, r) => s + r.estimated_subsidy, 0)

    if (anyInviable) {
        return 'Um ou mais cenários apresentam comprometimento de renda acima do recomendado. Revise o valor do imóvel ou aumente a entrada.'
    }
    if (allViable && totalSubsidy > 0) {
        return `Cenário viável com subsídio total de ${fmtCurrency(totalSubsidy)}. Parcelas dentro do limite de 30% da renda.`
    }
    if (allViable) {
        return 'Cenário viável sem subsídio. Financiamento dentro da capacidade de pagamento.'
    }
    return 'Cenário limítrofe — viável, mas recomenda-se atenção ao orçamento mensal.'
}
