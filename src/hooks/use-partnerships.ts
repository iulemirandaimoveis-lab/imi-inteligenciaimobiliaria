import useSWR from 'swr'

export interface Partnership {
    id: string
    property_id: string
    property_name: string
    property_price: number | null
    owner_id: string
    owner_user_id: string
    owner_name: string
    partner_id: string
    partner_user_id: string
    partner_name: string
    lead_name: string | null
    commission_owner_pct: number | null
    commission_partner_pct: number | null
    status: 'proposed' | 'negotiating' | 'accepted' | 'active' | 'completed' | 'cancelled' | 'rejected' | 'expired'
    total_messages: number
    unread_owner: number
    unread_partner: number
    last_message_at: string | null
    last_message_preview: string | null
    proposed_at: string
    updated_at: string
    sale_value: number | null
    total_commission: number | null
}

export interface PartnershipFilters {
    status?: string
}

// Hook para listar parcerias — uses API route
export function usePartnerships(filters?: PartnershipFilters) {
    const { data, error, mutate } = useSWR(
        ['partnerships', filters],
        async () => {
            const params = new URLSearchParams()
            if (filters?.status && filters.status !== 'all')
                params.set('status', filters.status)
            const res = await fetch(`/api/partnerships?${params.toString()}`)
            if (!res.ok) throw new Error('Failed to fetch partnerships')
            const json = await res.json()
            return { data: json.data as Partnership[], count: json.count as number }
        }
    )

    return {
        partnerships: data?.data || [],
        total: data?.count || 0,
        isLoading: !error && !data,
        isError: error,
        mutate,
    }
}

// Hook para buscar uma parceria específica
export function usePartnership(id: string) {
    const { data, error, mutate } = useSWR(
        id ? ['partnership', id] : null,
        async () => {
            const res = await fetch(`/api/partnerships/${id}`)
            if (!res.ok) throw new Error('Failed to fetch partnership')
            const json = await res.json()
            return json.data as Partnership
        }
    )

    return {
        partnership: data,
        isLoading: !error && !data,
        isError: error,
        mutate,
    }
}

// Criar nova parceria
export async function createPartnership(data: {
    property_id: string
    partner_id: string
    commission_owner_pct: number
    commission_partner_pct: number
    lead_name?: string
}) {
    const res = await fetch('/api/partnerships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Falha ao criar parceria')
    }
    return res.json()
}

// Aceitar parceria
export async function acceptPartnership(id: string) {
    const res = await fetch(`/api/partnerships/${id}/accept`, { method: 'POST' })
    if (!res.ok) throw new Error('Falha ao aceitar parceria')
    return res.json()
}

// Rejeitar parceria
export async function rejectPartnership(id: string, reason?: string) {
    const res = await fetch(`/api/partnerships/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
    })
    if (!res.ok) throw new Error('Falha ao rejeitar parceria')
    return res.json()
}

// Cancelar parceria
export async function cancelPartnership(id: string, reason?: string) {
    const res = await fetch(`/api/partnerships/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
    })
    if (!res.ok) throw new Error('Falha ao cancelar parceria')
    return res.json()
}

// Concluir parceria (venda realizada)
export async function completePartnership(id: string, saleValue: number) {
    const res = await fetch(`/api/partnerships/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sale_value: saleValue }),
    })
    if (!res.ok) throw new Error('Falha ao concluir parceria')
    return res.json()
}
