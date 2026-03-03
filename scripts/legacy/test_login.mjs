import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing env vars")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'iule@imi.com',
        password: 'admin123'
    })
    if (error) {
        console.error("Sign in failed:", error.message)
    } else {
        console.log("Sign in successful:", data.user?.email)
    }
}

login()
