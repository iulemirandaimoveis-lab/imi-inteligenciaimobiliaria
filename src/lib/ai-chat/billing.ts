const PRICING: Record<string, { input: number; output: number }> = {
    'claude-haiku-4-5-20251001': { input: 1.0, output: 5.0 },
    'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
    'claude-opus-4-6': { input: 15.0, output: 75.0 },
}

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const p = PRICING[model]
    if (!p) return 0
    return Number(((inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output).toFixed(6))
}

export function getModelLabel(model: string): string {
    if (model.includes('haiku')) return 'Haiku'
    if (model.includes('sonnet')) return 'Sonnet'
    if (model.includes('opus')) return 'Opus'
    return model
}

export const MODELS = [
    { id: 'claude-haiku-4-5-20251001', label: 'Haiku', description: 'Rápido e econômico', speed: '⚡⚡⚡', quality: '★★★', cost: '$' },
    { id: 'claude-sonnet-4-6', label: 'Sonnet', description: 'Equilibrado', speed: '⚡⚡', quality: '★★★★', cost: '$$' },
    { id: 'claude-opus-4-6', label: 'Opus', description: 'Máxima inteligência', speed: '⚡', quality: '★★★★★', cost: '$$$' },
]
