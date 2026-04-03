export interface CommissionCalculation {
    propertyValue: number
    totalCommissionRate: number
    totalCommissionValue: number
    proposerPercentage: number
    proposerValue: number
    accepterPercentage: number
    accepterValue: number
    platformFeePercentage: number
    platformFeeValue: number
    proposerNet: number
    accepterNet: number
}

export function calculateCommission(params: {
    propertyValue: number
    totalCommissionRate: number // %
    proposerSplitPercentage: number // %
    platformFeePercentage?: number // % default 10
}): CommissionCalculation {
    const platformFee = params.platformFeePercentage ?? 10
    const totalCommission = params.propertyValue * (params.totalCommissionRate / 100)
    const platformFeeValue = totalCommission * (platformFee / 100)
    const distributable = totalCommission - platformFeeValue
    const proposerValue = distributable * (params.proposerSplitPercentage / 100)
    const accepterValue = distributable * ((100 - params.proposerSplitPercentage) / 100)

    return {
        propertyValue: params.propertyValue,
        totalCommissionRate: params.totalCommissionRate,
        totalCommissionValue: totalCommission,
        proposerPercentage: params.proposerSplitPercentage,
        proposerValue,
        accepterPercentage: 100 - params.proposerSplitPercentage,
        accepterValue,
        platformFeePercentage: platformFee,
        platformFeeValue,
        proposerNet: proposerValue,
        accepterNet: accepterValue,
    }
}

/** @deprecated Use formatCurrency from @/lib/format instead */
export function formatBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
