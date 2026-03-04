import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface Broker {
    id: string
    user_id: string
    name: string
    email: string
    phone: string | null
    creci: string
    avatar_url: string | null
    status: 'active' | 'inactive'
    role: 'broker' | 'broker_manager'
    permissions: string[]
    last_login_at: string | null
    created_at: string
    updated_at: string
    created_by: string | null
}

export interface BrokerFormData {
    name: string
    email: string
    phone?: string
    creci: string
    password: string
    status: 'active' | 'inactive'
    permissions: string[]
}

// Hook para listar corretores
export function useBrokers(filters?: {
    search?: string
    status?: string
}) {
    const { data, error, mutate } = useSWR(['brokers', filters], async () => {
        let query = supabase
            .from('brokers')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })

        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
        }

        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status)
        }

        const { data, error, count } = await query
        if (error) throw error
        return { data: data as Broker[], count }
    })

    return {
        brokers: data?.data || [],
        total: data?.count || 0,
        isLoading: !error && !data,
        isError: error,
        mutate
    }
}

// Hook para buscar um corretor específico
export function useBroker(id: string) {
    const { data, error, mutate } = useSWR(
        id ? ['broker', id] : null,
        async () => {
            const { data, error } = await supabase
                .from('brokers')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            return data as Broker
        }
    )

    return {
        broker: data,
        isLoading: !error && !data,
        isError: error,
        mutate
    }
}

// Criar novo corretor
export async function createBroker(formData: BrokerFormData) {
    try {
        // 1. Criar usuário no Supabase Auth (Sign Up)
        // Note: Creating user directly via client-side auth.signUp creates a session, which might not be ideal for admin creating user.
        // Ideally this should call an Edge Function or use Service Role key on server (admin api).
        // Given current client-side restrictions, we'll try to use the provided pattern, but be aware of limitations.

        // Attempting to use a server action or API route would be better here for admin creation.
        // For now, let's assume we call a custom API route which uses service role.

        const response = await fetch('/api/brokers/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Falha ao criar corretor via API')
        }

        return await response.json()

    } catch (error) {
        console.error('Error creating broker:', error)
        throw error
    }
}

// Atualizar corretor
export async function updateBroker(id: string, updates: Partial<BrokerFormData>) {
    const { data, error } = await supabase
        .from('brokers')
        .update({
            name: updates.name,
            phone: updates.phone,
            creci: updates.creci,
            status: updates.status,
            permissions: updates.permissions,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data as Broker
}

// Deletar corretor
export async function deleteBroker(id: string) {
    // Primeiro buscar o user_id
    const { data: broker, error: fetchError } = await supabase
        .from('brokers')
        .select('user_id')
        .eq('id', id)
        .single()

    if (fetchError) throw fetchError

    // Call API to delete user (since client-side cannot delete users easily without being that user)
    const response = await fetch(`/api/brokers/delete?userId=${broker.user_id}`, {
        method: 'DELETE'
    })

    if (!response.ok) {
        throw new Error('Falha ao deletar usuário')
    }
}

// Atualizar status do corretor
export async function updateBrokerStatus(id: string, status: 'active' | 'inactive') {
    const { data, error } = await supabase
        .from('brokers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data as Broker
}

// Verificar se usuário tem permissão
export async function checkBrokerPermission(moduleId: string): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return false

        const { data, error } = await supabase
            .from('brokers')
            .select('permissions, status')
            .eq('user_id', user.id)
            .single()

        if (error || !data) return false
        if (data.status !== 'active') return false

        return data.permissions.includes(moduleId)
    } catch {
        return false
    }
}

// Obter permissões do corretor atual
export function useCurrentBrokerPermissions() {
    const { data, error } = useSWR('current-broker-permissions', async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { data: broker, error } = await supabase
            .from('brokers')
            .select('permissions, status, role')
            .eq('user_id', user.id)
            .single()

        if (error) {
            // If broker not found, might be admin or regular user without broker record
            return { permissions: [], status: 'inactive', role: 'guest' }
        }
        return broker
    })

    return {
        permissions: data?.permissions || [],
        status: data?.status,
        role: data?.role,
        isLoading: !error && !data,
        hasPermission: (moduleId: string) => data?.permissions?.includes(moduleId) || false
    }
}
