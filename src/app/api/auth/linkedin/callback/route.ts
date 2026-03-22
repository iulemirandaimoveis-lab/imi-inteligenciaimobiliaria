/**
 * GET /api/auth/linkedin/callback
 * Callback OAuth2 LinkedIn — troca code por token e salva no DB
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    const state = req.nextUrl.searchParams.get('state')
    const error = req.nextUrl.searchParams.get('error')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (error || !code) {
        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=linkedin_denied`)
    }

    // Verify CSRF state
    const cookieStore = await cookies()
    const savedState = cookieStore.get('linkedin_oauth_state')?.value
    cookieStore.delete('linkedin_oauth_state')

    if (!state || state !== savedState) {
        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=linkedin_state_mismatch`)
    }

    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.redirect(`${appUrl}/login`)
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID!
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${appUrl}/api/auth/linkedin/callback`

    try {
        // 1. Exchange code for access token
        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
            }),
        })
        const tokens = await tokenRes.json()
        if (tokens.error) {
            return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=linkedin_token_error`)
        }

        // 2. Get user profile
        const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        })
        const profile = await profileRes.json()

        // 3. Save to social_accounts
        await supabaseAdmin.from('social_accounts').upsert({
            user_id: user.id,
            platform: 'linkedin',
            platform_account_id: profile.sub,
            account_name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
            profile_image_url: profile.picture || null,
            access_token: tokens.access_token,
            token_expires_at: new Date(Date.now() + (tokens.expires_in || 5184000) * 1000).toISOString(),
            metadata: {
                email: profile.email,
                locale: profile.locale,
            },
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,platform,platform_account_id' })

        // 4. Save to integration_configs
        await supabaseAdmin.from('integration_configs').upsert({
            integration_id: 'linkedin',
            config: {
                access_token: tokens.access_token,
                expires_at: Date.now() + (tokens.expires_in || 5184000) * 1000,
                name: profile.name,
                email: profile.email,
                picture: profile.picture,
                sub: profile.sub,
            },
            status: 'conectado',
            updated_by: user.id,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'integration_id' })

        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?success=linkedin`)
    } catch (e: unknown) {
        console.error('[LinkedIn OAuth] Error:', e)
        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=linkedin_error`)
    }
}
