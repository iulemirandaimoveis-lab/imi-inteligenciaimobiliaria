import { supabaseAdmin } from '@/lib/supabase/admin'

export interface BudgetCheck {
    allowed: boolean
    spent: number
    limit: number
    remaining: number
    warning: boolean        // true when ≥ 70% of limit consumed
    daily_spent: number
    daily_limit: number
}

// Per-model estimated cost for budget pre-check (input only, conservative)
const ESTIMATED_COST_PER_CALL: Record<string, number> = {
    'claude-sonnet-4-6':         0.05,   // ~16k input tokens average
    'claude-haiku-4-5-20251001': 0.003,  // ~12k input tokens average
    'claude-opus-4-7':           0.25,
    'gpt-4o':                    0.04,
    'gpt-4o-mini':               0.002,
    'gemini-pro':                0.005,
    'gemini-flash':              0.001,
}

const MONTHLY_LIMIT_USD = 200
const WARNING_THRESHOLD = 0.70  // warn at 70% consumed
const DAILY_LIMIT_USD = MONTHLY_LIMIT_USD / 20  // ~$10/day soft cap

export async function checkBudget(tenantId: string = 'default'): Promise<BudgetCheck> {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const dayStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    try {
        const [monthRes, dayRes] = await Promise.all([
            supabaseAdmin
                .from('ai_requests')
                .select('cost_usd')
                .gte('created_at', monthStart)
                .eq('tenant_id', tenantId),
            supabaseAdmin
                .from('ai_requests')
                .select('cost_usd')
                .gte('created_at', dayStart)
                .eq('tenant_id', tenantId),
        ])

        const spent       = (monthRes.data || []).reduce((s, r) => s + (Number(r.cost_usd) || 0), 0)
        const daily_spent = (dayRes.data  || []).reduce((s, r) => s + (Number(r.cost_usd) || 0), 0)
        const remaining   = Math.max(0, MONTHLY_LIMIT_USD - spent)

        return {
            allowed:     spent < MONTHLY_LIMIT_USD && daily_spent < DAILY_LIMIT_USD,
            spent:       round2(spent),
            limit:       MONTHLY_LIMIT_USD,
            remaining:   round2(remaining),
            warning:     spent / MONTHLY_LIMIT_USD >= WARNING_THRESHOLD,
            daily_spent: round2(daily_spent),
            daily_limit: DAILY_LIMIT_USD,
        }
    } catch {
        console.warn('[cost-guard] Budget check failed, allowing request')
        return {
            allowed: true, spent: 0, limit: MONTHLY_LIMIT_USD, remaining: MONTHLY_LIMIT_USD,
            warning: false, daily_spent: 0, daily_limit: DAILY_LIMIT_USD,
        }
    }
}

/**
 * Quick pre-flight cost check before making an AI call.
 * Pass the model name to get an estimated cost comparison.
 * Returns false if the estimated cost would breach the daily cap.
 */
export async function canAffordCall(tenantId: string, model: string = 'claude-sonnet-4-6'): Promise<boolean> {
    try {
        const budget = await checkBudget(tenantId)
        if (!budget.allowed) return false

        const estimated = ESTIMATED_COST_PER_CALL[model] ?? 0.05
        return budget.daily_spent + estimated < DAILY_LIMIT_USD
    } catch {
        return true
    }
}

/**
 * Returns a human-readable budget status for admin dashboards.
 */
export async function getBudgetSummary(tenantId: string = 'default'): Promise<string> {
    const b = await checkBudget(tenantId)
    const pct = Math.round((b.spent / b.limit) * 100)
    const status = b.warning ? '⚠️ ATENÇÃO' : b.allowed ? '✅ OK' : '🚫 BLOQUEADO'
    return `${status} | Mensal: $${b.spent}/$${b.limit} (${pct}%) | Hoje: $${b.daily_spent}/$${b.daily_limit}`
}

function round2(n: number): number {
    return Math.round(n * 100) / 100
}
