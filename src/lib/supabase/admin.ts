import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    // Graceful fallback for build time — will fail at runtime if keys not provided
    console.warn('[supabase/admin] Missing environment variables — admin client not initialized')
}

/**
 * Supabase Admin Client with service role key.
 * Use ONLY for server-side admin operations that bypass RLS:
 *  - Creating auth users
 *  - Querying across all users' data
 *  - System-level operations
 * NEVER expose this client to the browser.
 */
export const supabaseAdmin = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseServiceKey || 'build-placeholder',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
)
