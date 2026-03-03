import { SupabaseClient } from '@supabase/supabase-js'

export type Content = {
    id: string
    [key: string]: any
}

export async function getAll(supabase: SupabaseClient): Promise<Content[]> {
    const { data, error } = await supabase.from('content').select('*')
    if (error) throw error
    return data
}

export async function getById(supabase: SupabaseClient, id: string): Promise<Content> {
    const { data, error } = await supabase.from('content').select('*').eq('id', id).single()
    if (error) throw error
    return data
}

export async function create(supabase: SupabaseClient, payload: Partial<Content>): Promise<Content> {
    const { data, error } = await supabase.from('content').insert(payload).select().single()
    if (error) throw error
    return data
}

export async function update(supabase: SupabaseClient, id: string, payload: Partial<Content>): Promise<Content> {
    const { data, error } = await supabase.from('content').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
}

export async function remove(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from('content').delete().eq('id', id)
    if (error) throw error
}
