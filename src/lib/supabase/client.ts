import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        // Graceful fallback for build time — will fail at runtime if keys not provided
        console.warn('Supabase Client: Missing environment variables — using build placeholder')
        return createBrowserClient(
            'https://placeholder.supabase.co',
            'build-placeholder-key'
        )
    }

    return createBrowserClient(url, key)
}
