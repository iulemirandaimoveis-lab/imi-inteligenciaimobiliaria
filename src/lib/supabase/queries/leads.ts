import { SupabaseClient } from '@supabase/supabase-js'

export type Lead = {
    id: string
    [key: string]: any
}

export async function getAll(supabase: SupabaseClient): Promise<Lead[]> {
    const { data, error } = await supabase.from('leads').select('*')
    if (error) throw error
    return data
}

export async function getById(supabase: SupabaseClient, id: string): Promise<Lead> {
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).single()
    if (error) throw error
    return data
}

export async function create(supabase: SupabaseClient, payload: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase.from('leads').insert(payload).select().single()
    if (error) throw error
    return data
}

export async function update(supabase: SupabaseClient, id: string, payload: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase.from('leads').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
}

export async function remove(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) throw error
}
