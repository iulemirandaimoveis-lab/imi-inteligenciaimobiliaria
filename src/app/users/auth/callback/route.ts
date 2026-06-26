import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * OAuth / magic-link callback for the IMI Console.
 * Exchanges the PKCE code for a session, then routes to ?next (defaults to the
 * console dashboard). On failure, returns to /users/login with an error flag.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/users/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next.startsWith('/users') ? next : '/users/dashboard'}`)
    }
  }

  return NextResponse.redirect(`${origin}/users/login?error=oauth`)
}
