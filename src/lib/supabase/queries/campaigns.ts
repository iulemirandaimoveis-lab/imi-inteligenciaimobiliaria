import { SupabaseClient } from '@supabase/supabase-js'

export type Campaign = {
    id: string
    [key: string]: any
}

export async function getAll(supabase: SupabaseClient): Promise<Campaign[]> {
    const { data, error } = await supabase.from('campaigns').select('*')
    if (error) throw error
    return data
}

export async function getById(supabase: SupabaseClient, id: string): Promise<Campaign> {
    const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).single()
    if (error) throw error
    return data
}

export async function create(supabase: SupabaseClient, payload: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase.from('campaigns').insert(payload).select().single()
    if (error) throw error
    return data
}

export async function update(supabase: SupabaseClient, id: string, payload: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase.from('campaigns').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
}

export async function remove(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from('campaigns').delete().eq('id', id)
    if (error) throw error
}
