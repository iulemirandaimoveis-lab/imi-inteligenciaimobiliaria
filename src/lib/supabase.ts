/** @deprecated — Use @/lib/supabase/client, /server, or /admin */
export { createClient } from '@/lib/supabase/client'
import { createClient as _cc } from '@/lib/supabase/client'
export const supabase = _cc()
export const signIn = (email: string, password: string) => supabase.auth.signInWithPassword({ email, password })
export const signOut = () => supabase.auth.signOut()
export const getSession = async () => { const { data: { user } } = await supabase.auth.getUser(); return user }
