/**
 * GET /api/auth/tiktok
 * Inicia OAuth2 TikTok
 * Requer env: TIKTOK_CLIENT_KEY, TIKTOK_REDIRECT_URI
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const SCOPES = 'video.publish,user.info.basic'

export async function GET(req: NextRequest) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.redirect(`${appUrl}/login`)
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${appUrl}/api/auth/tiktok/callback`

    if (!clientKey) {
        return NextResponse.json({ error: 'TIKTOK_CLIENT_KEY não configurado. Adicione nas variáveis de ambiente da Vercel.' }, { status: 500 })
    }

    // Generate CSRF state
    const state = crypto.randomUUID()
    const cookieStore = await cookies()
    cookieStore.set('tiktok_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600,
        path: '/',
    })

    const url = new URL('https://www.tiktok.com/v2/auth/authorize/')
    url.searchParams.set('client_key', clientKey)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', SCOPES)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('state', state)

    return NextResponse.redirect(url.toString())
}
