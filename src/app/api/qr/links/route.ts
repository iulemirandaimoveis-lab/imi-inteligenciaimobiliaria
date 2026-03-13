import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br'

function generateShortCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const developmentId = searchParams.get('development_id')

        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        let query = supabase
            .from('tracked_links')
            .select('*')
            .order('created_at', { ascending: false })
            .eq('is_active', true)

        if (developmentId) {
            query = query.eq('development_id', developmentId)
        }

        const { data: links, error } = await query

        if (error) {
            console.error('Error fetching links:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const enrichedLinks = (links || []).map(link => ({
            ...link,
            short_url: link.short_code ? `${BASE_URL}/l/${link.short_code}` : null
        }))

        return NextResponse.json({ links: enrichedLinks })

    } catch (error: any) {
        console.error('Error in GET /api/qr/links:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const body = await request.json()

        const {
            url,
            campaign_name,
            development_id,
            title,
            label,
            custom_slug,
            utm_source,
            utm_medium,
            utm_campaign,
            utm_content,
            utm_term,
            broker_id,
            team_label,
        } = body

        if (!url) return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 })
        if (!campaign_name) return NextResponse.json({ error: 'Nome da campanha é obrigatório' }, { status: 400 })

        // Generate unique short code
        let shortCode = custom_slug || generateShortCode()

        // Check short code uniqueness
        const { data: existing } = await supabase
            .from('tracked_links')
            .select('id')
            .eq('short_code', shortCode)
            .maybeSingle()

        if (existing) {
            // If custom slug conflicts, return error; if auto-generated, retry
            if (custom_slug) {
                return NextResponse.json({ error: 'Este slug já está em uso' }, { status: 409 })
            }
            shortCode = generateShortCode() + Math.floor(Math.random() * 100)
        }

        // Build UTM params JSON
        const utmParams: Record<string, string> = {}
        if (utm_source) utmParams.utm_source = utm_source
        if (utm_medium) utmParams.utm_medium = utm_medium
        if (utm_campaign) utmParams.utm_campaign = utm_campaign
        if (utm_content) utmParams.utm_content = utm_content
        if (utm_term) utmParams.utm_term = utm_term

        const { data: link, error } = await supabase
            .from('tracked_links')
            .insert({
                url,
                campaign_name,
                development_id: development_id || null,
                title: title || campaign_name,
                label: label || null,
                custom_slug: custom_slug || null,
                short_code: shortCode,
                utm_params: utmParams,
                utm_source: utm_source || null,
                utm_medium: utm_medium || null,
                utm_campaign: utm_campaign || null,
                utm_content: utm_content || null,
                utm_term: utm_term || null,
                broker_id: broker_id || null,
                team_label: team_label || null,
                created_by: user.id,
                is_active: true,
                clicks: 0,
                unique_clicks: 0,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating tracked link:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            link: {
                ...link,
                short_url: `${BASE_URL}/l/${shortCode}`,
            },
        }, { status: 201 })

    } catch (error: any) {
        console.error('Error in POST /api/qr/links:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        // Soft delete: set is_active = false to preserve audit trail
        const { error } = await supabase
            .from('tracked_links')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
