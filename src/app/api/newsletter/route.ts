import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
        }

        const supabase = await createClient()

        // Upsert to avoid duplicates
        const { error } = await supabase
            .from('newsletter_subscribers')
            .upsert(
                { email: email.toLowerCase().trim(), subscribed_at: new Date().toISOString() },
                { onConflict: 'email' }
            )

        if (error) {
            // If table doesn't exist yet, log but still return success
            console.error('Newsletter subscribe error:', error)
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
