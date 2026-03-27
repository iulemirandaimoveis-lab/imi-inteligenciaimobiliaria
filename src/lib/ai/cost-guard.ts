import { supabaseAdmin } from '@/lib/supabase/admin'

interface BudgetCheck {
  allowed: boolean
  spent: number
  limit: number
  remaining: number
}

const MONTHLY_LIMIT_USD = 200

export async function checkBudget(tenantId: string = 'default'): Promise<BudgetCheck> {
  try {
    const { data } = await supabaseAdmin
      .from('ai_requests')
      .select('cost_usd')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .eq('tenant_id', tenantId)

    const spent = (data || []).reduce((sum, r) => sum + (Number(r.cost_usd) || 0), 0)
    const remaining = Math.max(0, MONTHLY_LIMIT_USD - spent)

    return {
      allowed: spent < MONTHLY_LIMIT_USD,
      spent: Math.round(spent * 100) / 100,
      limit: MONTHLY_LIMIT_USD,
      remaining: Math.round(remaining * 100) / 100,
    }
  } catch {
    // If check fails, allow but log
    console.warn('[cost-guard] Budget check failed, allowing request')
    return { allowed: true, spent: 0, limit: MONTHLY_LIMIT_USD, remaining: MONTHLY_LIMIT_USD }
  }
}
