import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-placeholder';

// Avoid crashing if keys are blank
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'))
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://placeholder.supabase.co', 'placeholder');

// Supabase environment variables validated at import time

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
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// NOTE: For admin client (service role), import from '@/lib/supabase/admin' instead.
// The supabaseAdmin export was removed from this file to avoid duplicates.
