import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveClick } from '@/lib/link-tracker'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const supabase = await createClient()

  try {
    // 1. Try unified tracked_links first (new QR codes go here)
    const { data: trackedLink } = await supabase
      .from('tracked_links')
      .select('id, short_code, destination_url')
      .eq('id', id)
      .single()

    if (trackedLink?.short_code) {
      // Use the unified pipeline via resolveClick for full tracking
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? '0.0.0.0'
      const ua = req.headers.get('user-agent') ?? ''
      const referrer = req.headers.get('referer') ?? null
      const country = req.headers.get('x-vercel-ip-country') ?? null
      const region = req.headers.get('x-vercel-ip-country-region') ?? null
      const city = req.headers.get('x-vercel-ip-city') ?? null

      const result = await resolveClick({
        shortCode: trackedLink.short_code,
        ip, userAgent: ua, referrer, country, region, city,
      })

      if (result) {
        const dest = new URL(result.destination_url)
        if (result.click_id) dest.searchParams.set('_tid', result.click_id)
        return NextResponse.redirect(dest.toString(), { status: 302 })
      }
    }

    // 2. Fallback: legacy qr_links table (for old QR codes printed before unification)
    const { data: legacyLink } = await supabase
      .from('qr_links')
      .select('destination_url, property_id, source, campaign_name, id')
      .eq('id', id)
      .single()

    if (!legacyLink) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Log legacy scan
    const ua = req.headers.get('user-agent') ?? ''
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? ''
    const isMobile = /Mobile|Android|iPhone|iPad/.test(ua)
    const country = req.headers.get('x-vercel-ip-country') ?? ''
    const city = req.headers.get('x-vercel-ip-city') ?? ''

    await Promise.allSettled([
      supabase.from('qr_scans').insert({
        qr_link_id: id,
        property_id: legacyLink.property_id ?? null,
        source: legacyLink.source ?? 'qr',
        campaign_name: legacyLink.campaign_name ?? null,
        user_agent: ua.slice(0, 500),
        referer: (req.headers.get('referer') ?? '').slice(0, 500),
        ip_address: ip.slice(0, 45),
        is_mobile: isMobile,
        country,
        city,
        scanned_at: new Date().toISOString(),
      }),
      supabase.rpc('increment_qr_scans', { link_id: id }),
    ])

    const dest = legacyLink.destination_url.startsWith('http')
      ? legacyLink.destination_url
      : `https://${legacyLink.destination_url}`
    return NextResponse.redirect(dest, { status: 302 })
  } catch {
    return NextResponse.redirect(new URL('/', req.url))
  }
}
