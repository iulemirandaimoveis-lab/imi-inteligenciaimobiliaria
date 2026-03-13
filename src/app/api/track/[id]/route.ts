import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { id } = params

  try {
    // Fetch the QR link
    const { data: link } = await supabase
      .from('qr_links')
      .select('destination_url, property_id, source, campaign_name, id')
      .eq('id', id)
      .single()

    if (!link) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Log the scan — await before redirect (serverless terminates on response return)
    const ua = req.headers.get('user-agent') ?? ''
    const referer = req.headers.get('referer') ?? ''
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? ''
    const isMobile = /Mobile|Android|iPhone|iPad/.test(ua)
    const country = req.headers.get('x-vercel-ip-country') ?? ''
    const city = req.headers.get('x-vercel-ip-city') ?? ''

    await Promise.allSettled([
      supabase.from('qr_scans').insert({
        qr_link_id: id,
        property_id: link.property_id ?? null,
        source: link.source ?? 'qr',
        campaign_name: link.campaign_name ?? null,
        user_agent: ua.slice(0, 500),
        referer: referer.slice(0, 500),
        ip_address: ip.slice(0, 45),
        is_mobile: isMobile,
        country: country,
        city: city,
        scanned_at: new Date().toISOString(),
      }),
      supabase.rpc('increment_qr_scans', { link_id: id }),
    ])

    // Redirect to destination
    const dest = link.destination_url.startsWith('http')
      ? link.destination_url
      : `https://${link.destination_url}`

    return NextResponse.redirect(dest, { status: 302 })
  } catch {
    return NextResponse.redirect(new URL('/', req.url))
  }
}
