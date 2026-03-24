import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import QRCode from 'qrcode'

/**
 * Simple QR code generator — takes a URL and returns a data URL image.
 * Used by the backoffice FloatingActions QR dialog.
 */
export async function POST(request: Request) {
    try {
        // Auth: require authenticated user (backoffice only)
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { url } = await request.json()
        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        const qr_data_url = await QRCode.toDataURL(url, {
            width: 400,
            margin: 2,
            color: { dark: '#1A1A2E', light: '#FFFFFF' },
            errorCorrectionLevel: 'H',
        })

        return NextResponse.json({ qr_data_url })
    } catch {
        return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
    }
}
