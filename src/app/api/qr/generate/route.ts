import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import QRCode from 'qrcode'

function generateShortCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { development_id, campaign_name, utm_source, utm_medium, utm_campaign, utm_content, custom_slug } = body

        if (!development_id || !utm_source || !utm_medium || !utm_campaign) {
            return NextResponse.json({ error: 'Campos obrigatórios: development_id, utm_source, utm_medium, utm_campaign' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Get development slug
        const { data: dev } = await supabase
            .from('developments')
            .select('id, name, slug')
            .eq('id', development_id)
            .single()

        if (!dev) {
            return NextResponse.json({ error: 'Empreendimento não encontrado' }, { status: 404 })
        }

        const devSlug = dev.slug || dev.name.toLowerCase().replace(/\s+/g, '-')

        // Build UTM URL
        const baseUrl = 'https://www.iulemirandaimoveis.com.br'
        const params = new URLSearchParams()
        params.set('utm_source', utm_source)
        params.set('utm_medium', utm_medium)
        params.set('utm_campaign', utm_campaign)
        if (utm_content) params.set('utm_content', utm_content)

        const originalUrl = `${baseUrl}/imoveis/${devSlug}?${params.toString()}`

        // Generate short code
        let shortCode = custom_slug || generateShortCode()
        
        // Check uniqueness
        const { data: existing } = await supabase
            .from('tracked_links')
            .select('id')
            .eq('short_code', shortCode)
            .single()

        if (existing) {
            shortCode = generateShortCode(8) // fallback longer code
        }

        // Insert tracked link
        const { data: link, error } = await supabase
            .from('tracked_links')
            .insert({
                development_id,
                campaign_name: campaign_name || `${utm_source}-${utm_campaign}`,
                url: originalUrl,
                short_code: shortCode,
                custom_slug: custom_slug || null,
                utm_source,
                utm_medium,
                utm_campaign,
                utm_content: utm_content || null,
                utm_params: { source: utm_source, medium: utm_medium, campaign: utm_campaign, content: utm_content || null },
                clicks: 0,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating tracked link:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Generate QR code data URL
        const shortUrl = `${baseUrl}/l/${shortCode}`
        const qrDataUrl = await QRCode.toDataURL(shortUrl, {
            width: 600,
            margin: 2,
            color: { dark: '#0A0A0A', light: '#FFFFFF' },
            errorCorrectionLevel: 'H'
        })

        return NextResponse.json({
            success: true,
            link: {
                ...link,
                short_url: shortUrl,
                qr_data_url: qrDataUrl,
            }
        })

    } catch (error: any) {
        console.error('Error in /api/qr/generate:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
