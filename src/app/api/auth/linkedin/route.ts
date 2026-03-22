/**
 * GET /api/auth/linkedin
 * Inicia OAuth2 LinkedIn
 * Requer env: LINKEDIN_CLIENT_ID, LINKEDIN_REDIRECT_URI
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const SCOPES = 'w_member_social r_organization_social'

export async function GET(req: NextRequest) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.redirect(`${appUrl}/login`)
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${appUrl}/api/auth/linkedin/callback`

    if (!clientId) {
        return NextResponse.json({ error: 'LINKEDIN_CLIENT_ID não configurado. Adicione nas variáveis de ambiente da Vercel.' }, { status: 500 })
    }

    // Generate CSRF state
    const state = crypto.randomUUID()
    const cookieStore = await cookies()
    cookieStore.set('linkedin_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600,
        path: '/',
    })

    const url = new URL('https://www.linkedin.com/oauth/v2/authorization')
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', SCOPES)
    url.searchParams.set('state', state)

    return NextResponse.redirect(url.toString())
}
