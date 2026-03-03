import { SupabaseClient } from '@supabase/supabase-js'

export type Avaliacao = {
    id: string
    [key: string]: any
}

export async function getAll(supabase: SupabaseClient): Promise<Avaliacao[]> {
    const { data, error } = await supabase.from('avaliacoes').select('*')
    if (error) throw error
    return data
}

export async function getById(supabase: SupabaseClient, id: string): Promise<Avaliacao> {
    const { data, error } = await supabase.from('avaliacoes').select('*').eq('id', id).single()
    if (error) throw error
    return data
}

export async function create(supabase: SupabaseClient, payload: Partial<Avaliacao>): Promise<Avaliacao> {
    const { data, error } = await supabase.from('avaliacoes').insert(payload).select().single()
    if (error) throw error
    return data
}

export async function update(supabase: SupabaseClient, id: string, payload: Partial<Avaliacao>): Promise<Avaliacao> {
    const { data, error } = await supabase.from('avaliacoes').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
}

export async function remove(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from('avaliacoes').delete().eq('id', id)
    if (error) throw error
}
