/**
 * LeadsService — business logic for leads module
 * Accepts a Supabase client via DI so it works with both user-session and admin clients
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { z } from 'zod'
import type { leadSchema } from '@/lib/schemas'

export type CreateLeadInput = z.infer<typeof leadSchema>
export type UpdateLeadInput = Partial<CreateLeadInput> & { id: string }

export interface LeadListOptions {
    page?: number
    limit?: number
    status?: string
    source?: string
    search?: string
}

export class LeadsService {
    constructor(private supabase: SupabaseClient) {}

    /** List leads with pagination, excluding archived */
    async list(opts: LeadListOptions = {}) {
        const { page = 1, limit = 50, status, source, search } = opts
        const offset = (page - 1) * limit

        let query = this.supabase
            .from('leads')
            .select(
                'id, name, email, phone, status, score, source, capital, interest, development_id, assigned_to, created_at, updated_at, last_interaction_at',
                { count: 'exact' }
            )
            .not('status', 'eq', 'archived')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (status) query = query.eq('status', status)
        if (source) query = query.eq('source', source)
        if (search) query = query.ilike('name', `%${search}%`)

        return query
    }

    /** Get a single lead by ID */
    async findById(id: string) {
        return this.supabase
            .from('leads')
            .select('*')
            .eq('id', id)
            .single()
    }

    /** Create a new lead */
    async create(data: CreateLeadInput, createdBy?: string) {
        return this.supabase
            .from('leads')
            .insert({
                ...data,
                email: data.email || null,
                status: data.status || 'new',
                score: data.ai_score ?? 50,
                capital: data.budget_max ?? data.budget_min ?? 0,
                ...(createdBy ? { created_by: createdBy } : {}),
            })
            .select()
            .single()
    }

    /** Update a lead */
    async update(id: string, data: Omit<UpdateLeadInput, 'id'>) {
        return this.supabase
            .from('leads')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()
    }

    /** Soft delete a lead (status = 'archived') */
    async archive(id: string) {
        return this.supabase
            .from('leads')
            .update({ status: 'archived', updated_at: new Date().toISOString() })
            .eq('id', id)
    }

    /** Check if a lead with the given email was created in the last N minutes (dedup) */
    async findRecentByEmail(email: string, withinMinutes = 5) {
        const since = new Date(Date.now() - withinMinutes * 60 * 1000).toISOString()
        return this.supabase
            .from('leads')
            .select('id, name, email')
            .eq('email', email)
            .gte('created_at', since)
            .limit(1)
            .maybeSingle()
    }

    /** Compute basic KPIs for dashboard */
    async kpis() {
        const { data, error } = await this.supabase
            .from('leads')
            .select('status, capital')
            .not('status', 'eq', 'archived')

        if (error || !data) return { total: 0, new: 0, won: 0, conversionRate: 0, totalValue: 0 }

        const total = data.length
        const won = data.filter(l => l.status === 'won').length
        const newLeads = data.filter(l => l.status === 'new').length
        const totalValue = data.reduce((sum, l) => sum + (l.capital || 0), 0)
        const conversionRate = total > 0 ? Number(((won / total) * 100).toFixed(1)) : 0

        return { total, new: newLeads, won, conversionRate, totalValue }
    }
}
