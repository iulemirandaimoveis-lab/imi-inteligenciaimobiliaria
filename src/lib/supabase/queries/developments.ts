import { SupabaseClient } from '@supabase/supabase-js'

export type Development = {
    id: string
    [key: string]: any
}

export async function getAll(supabase: SupabaseClient): Promise<Development[]> {
    const { data, error } = await supabase.from('developments').select('*')
    if (error) throw error
    return data
}

export async function getById(supabase: SupabaseClient, id: string): Promise<Development> {
    const { data, error } = await supabase.from('developments').select('*').eq('id', id).single()
    if (error) throw error
    return data
}

export async function create(supabase: SupabaseClient, payload: Partial<Development>): Promise<Development> {
    const { data, error } = await supabase.from('developments').insert(payload).select().single()
    if (error) throw error
    return data
}

export async function update(supabase: SupabaseClient, id: string, payload: Partial<Development>): Promise<Development> {
    const { data, error } = await supabase.from('developments').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
}

export async function remove(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from('developments').delete().eq('id', id)
    if (error) throw error
}
