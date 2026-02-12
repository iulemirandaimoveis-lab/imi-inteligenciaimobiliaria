import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function useDevelopers() {
    const { data, error, mutate } = useSWR('developers', async () => {
        const { data, error } = await supabase
            .from('developers')
            .select('*')
            .order('name')

        if (error) throw error
        return data
    })

    return {
        developers: data || [],
        isLoading: !error && !data,
        isError: error,
        mutate
    }
}
