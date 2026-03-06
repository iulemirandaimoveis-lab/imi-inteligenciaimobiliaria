/**
 * FinanceService — business logic for financial_transactions module
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { z } from 'zod'
import type { transactionSchema } from '@/lib/schemas'

export type CreateTransactionInput = z.infer<typeof transactionSchema>
export type UpdateTransactionInput = Partial<CreateTransactionInput> & { id: string }

export interface TransactionListOptions {
    page?: number
    limit?: number
    type?: 'receita' | 'despesa'
    status?: 'pago' | 'pendente' | 'cancelado'
    month?: string // YYYY-MM
}

export class FinanceService {
    constructor(private supabase: SupabaseClient) {}

    /** List transactions with optional filters and pagination */
    async list(opts: TransactionListOptions = {}) {
        const { page = 1, limit = 50, type, status, month } = opts
        const offset = (page - 1) * limit

        let query = this.supabase
            .from('financial_transactions')
            .select(
                'id, type, category, description, amount, due_date, paid_date, status, payment_method, notes, created_at',
                { count: 'exact' }
            )
            .not('status', 'eq', 'cancelado')
            .order('due_date', { ascending: false })
            .range(offset, offset + limit - 1)

        if (type) query = query.eq('type', type)
        if (status) query = query.eq('status', status)
        if (month) {
            const [y, m] = month.split('-')
            const start = `${y}-${m}-01`
            const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate()
            const end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`
            query = query.gte('due_date', start).lte('due_date', end)
        }

        return query
    }

    /** Get a single transaction */
    async findById(id: string) {
        return this.supabase
            .from('financial_transactions')
            .select('*')
            .eq('id', id)
            .single()
    }

    /** Create a new transaction */
    async create(data: CreateTransactionInput, createdBy: string) {
        return this.supabase
            .from('financial_transactions')
            .insert({
                created_by: createdBy,
                type: data.type,
                category: data.category || 'Outros',
                description: data.description,
                amount: data.amount,
                due_date: data.date || new Date().toISOString().split('T')[0],
                status: data.status || 'pendente',
                notes: data.notes || null,
            })
            .select()
            .single()
    }

    /** Update a transaction */
    async update(id: string, data: Omit<UpdateTransactionInput, 'id'>) {
        const updates: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() }
        // Map date → due_date if present
        if ('date' in updates) {
            updates.due_date = updates.date
            delete updates.date
        }
        return this.supabase
            .from('financial_transactions')
            .update(updates)
            .eq('id', id)
            .select()
            .single()
    }

    /** Soft-cancel a transaction */
    async cancel(id: string) {
        return this.supabase
            .from('financial_transactions')
            .update({ status: 'cancelado', updated_at: new Date().toISOString() })
            .eq('id', id)
    }

    /** Summary for a given month: total receita, total despesa, saldo */
    async monthlySummary(month: string) {
        const [y, m] = month.split('-')
        const start = `${y}-${m}-01`
        const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate()
        const end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`

        const { data, error } = await this.supabase
            .from('financial_transactions')
            .select('type, amount, status')
            .gte('due_date', start)
            .lte('due_date', end)
            .not('status', 'eq', 'cancelado')

        if (error || !data) return { receita: 0, despesa: 0, saldo: 0 }

        const receita = data
            .filter(t => t.type === 'receita' && t.status === 'pago')
            .reduce((s, t) => s + (t.amount || 0), 0)
        const despesa = data
            .filter(t => t.type === 'despesa' && t.status === 'pago')
            .reduce((s, t) => s + (t.amount || 0), 0)

        return { receita, despesa, saldo: receita - despesa }
    }
}
