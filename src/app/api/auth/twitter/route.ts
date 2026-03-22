/**
 * GET /api/auth/twitter
 * Inicia OAuth2 Twitter (X) com PKCE
 * Requer env: TWITTER_CLIENT_ID, TWITTER_REDIRECT_URI
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const SCOPES = 'tweet.read tweet.write dm.read dm.write users.read'

/**
 * Generate a random code verifier (43-128 characters, URL-safe)
 */
function generateCodeVerifier(): string {
    const array = new Uint8Array(64)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(36).padStart(2, '0'))
        .join('')
        .slice(0, 128)
}

/**
 * Generate code challenge from verifier using SHA-256 (S256)
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
}

export async function GET(req: NextRequest) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.redirect(`${appUrl}/login`)
    }

    const clientId = process.env.TWITTER_CLIENT_ID
    const redirectUri = process.env.TWITTER_REDIRECT_URI || `${appUrl}/api/auth/twitter/callback`

    if (!clientId) {
        return NextResponse.json({ error: 'TWITTER_CLIENT_ID não configurado. Adicione nas variáveis de ambiente da Vercel.' }, { status: 500 })
    }

    // Generate CSRF state
    const state = crypto.randomUUID()

    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    const cookieStore = await cookies()
    cookieStore.set('twitter_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600,
        path: '/',
    })
    cookieStore.set('twitter_code_verifier', codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600,
        path: '/',
    })

    const url = new URL('https://twitter.com/i/oauth2/authorize')
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', SCOPES)
    url.searchParams.set('state', state)
    url.searchParams.set('code_challenge', codeChallenge)
    url.searchParams.set('code_challenge_method', 'S256')

    return NextResponse.redirect(url.toString())
}
