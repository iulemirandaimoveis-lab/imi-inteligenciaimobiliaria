/**
 * GET /api/auth/google/callback
 * Callback OAuth2 Google — troca code por tokens e salva no DB
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    const error = req.nextUrl.searchParams.get('error')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (error || !code) {
        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=google_denied`)
    }

    const clientId = process.env.GOOGLE_CLIENT_ID!
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appUrl}/api/auth/google/callback`

    try {
        // Exchange code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
        })
        const tokens = await tokenRes.json()

        if (tokens.error) {
            return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=google_token_error`)
        }

        // Get user info
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        })
        const userInfo = await userRes.json()

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Save tokens to integration_configs
        await supabase.from('integration_configs').upsert({
            integration_id: 'google',
            config: {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: Date.now() + (tokens.expires_in * 1000),
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
            },
            status: 'conectado',
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'integration_id' })

        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?success=google`)
    } catch (e: any) {
        console.error('[google/callback]', e)
        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=google_error`)
    }
}
