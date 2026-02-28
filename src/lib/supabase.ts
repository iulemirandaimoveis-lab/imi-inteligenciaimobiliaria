import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-placeholder';

// Avoid crashing if keys are blank
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'))
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://placeholder.supabase.co', 'placeholder');

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are missing or invalid.');
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// Admin client for bypass - Required for internal API routes
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder';
export const supabaseAdmin = (supabaseUrl && serviceRoleKey && supabaseUrl.startsWith('http'))
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null as any;
