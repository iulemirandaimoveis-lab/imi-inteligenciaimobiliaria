import { SupabaseClient } from '@supabase/supabase-js'

export type Contract = {
    id: string
    [key: string]: any
}

export async function getAll(supabase: SupabaseClient): Promise<Contract[]> {
    const { data, error } = await supabase.from('contracts').select('*')
    if (error) throw error
    return data
}

export async function getById(supabase: SupabaseClient, id: string): Promise<Contract> {
    const { data, error } = await supabase.from('contracts').select('*').eq('id', id).single()
    if (error) throw error
    return data
}

export async function create(supabase: SupabaseClient, payload: Partial<Contract>): Promise<Contract> {
    const { data, error } = await supabase.from('contracts').insert(payload).select().single()
    if (error) throw error
    return data
}

export async function update(supabase: SupabaseClient, id: string, payload: Partial<Contract>): Promise<Contract> {
    const { data, error } = await supabase.from('contracts').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
}

export async function remove(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from('contracts').delete().eq('id', id)
    if (error) throw error
}
