/**
 * GET /api/auth/meta/callback
 * Callback OAuth2 Meta — troca code por tokens, busca pages/IG e salva no DB
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
        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=meta_denied`)
    }

    // Verify CSRF state
    const cookieStore = await cookies()
    const savedState = cookieStore.get('meta_oauth_state')?.value
    cookieStore.delete('meta_oauth_state')

    if (!state || state !== savedState) {
        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=meta_state_mismatch`)
    }

    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.redirect(`${appUrl}/login`)
    }

    const clientId = process.env.META_APP_ID!
    const clientSecret = process.env.META_APP_SECRET!
    const redirectUri = process.env.META_REDIRECT_URI || `${appUrl}/api/auth/meta/callback`

    try {
        // 1. Exchange code for short-lived access token
        const tokenRes = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
            }),
        })
        const tokens = await tokenRes.json()
        if (tokens.error) {
            return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=meta_token_error`)
        }

        // 2. Exchange for long-lived token
        const longTokenRes = await fetch(
            `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${tokens.access_token}`
        )
        const longToken = await longTokenRes.json()
        const accessToken = longToken.access_token || tokens.access_token
        const expiresIn = longToken.expires_in || tokens.expires_in || 5184000 // ~60 days default

        // 3. Fetch user pages
        const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`)
        const pagesData = await pagesRes.json()
        const pages = pagesData.data || []

        // 4. For each page, save to social_accounts and check for Instagram business account
        for (const page of pages) {
            // Save Facebook page
            await supabaseAdmin.from('social_accounts').upsert({
                user_id: user.id,
                platform: 'facebook',
                platform_account_id: page.id,
                account_name: page.name,
                access_token: page.access_token, // page-level token
                token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
                metadata: {
                    category: page.category,
                    page_access_token: page.access_token,
                    user_access_token: accessToken,
                },
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,platform,platform_account_id' })

            // 5. Check for Instagram business account linked to this page
            try {
                const igRes = await fetch(
                    `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account{id,username,profile_picture_url,followers_count}&access_token=${page.access_token}`
                )
                const igData = await igRes.json()

                if (igData.instagram_business_account) {
                    const ig = igData.instagram_business_account
                    await supabaseAdmin.from('social_accounts').upsert({
                        user_id: user.id,
                        platform: 'instagram',
                        platform_account_id: ig.id,
                        account_name: ig.username || '',
                        profile_image_url: ig.profile_picture_url || null,
                        access_token: page.access_token,
                        token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
                        metadata: {
                            followers_count: ig.followers_count,
                            linked_facebook_page_id: page.id,
                            page_access_token: page.access_token,
                        },
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id,platform,platform_account_id' })
                }
            } catch {
                // Instagram not available for this page — continue
            }
        }

        // 6. Save to integration_configs
        await supabaseAdmin.from('integration_configs').upsert({
            integration_id: 'meta',
            config: {
                access_token: accessToken,
                expires_at: Date.now() + expiresIn * 1000,
                pages: pages.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })),
            },
            status: 'conectado',
            updated_by: user.id,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'integration_id' })

        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?success=meta`)
    } catch (e: unknown) {
        console.error('[Meta OAuth] Error:', e)
        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=meta_error`)
    }
}
