export type LeadStatus = 'new' | 'contacted' | 'visit_scheduled' | 'proposal' | 'won' | 'lost'

export interface Lead {
    id: string
    name: string
    email: string
    phone?: string
    status: LeadStatus
    source?: string
    interest?: string // ID of development or type
    budget?: number
    created_at: string
    updated_at: string
    last_interaction?: string
    score?: number
    tags?: string[]
}
