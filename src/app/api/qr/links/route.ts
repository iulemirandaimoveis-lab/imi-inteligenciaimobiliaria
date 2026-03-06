import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const developmentId = searchParams.get('development_id')

        const supabase = await createClient()

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

        // Build short URLs
        const baseUrl = 'https://www.iulemirandaimoveis.com.br'
        const enrichedLinks = (links || []).map(link => ({
            ...link,
            short_url: link.short_code ? `${baseUrl}/l/${link.short_code}` : null
        }))

        return NextResponse.json({ links: enrichedLinks })

    } catch (error: any) {
        console.error('Error in /api/qr/links:', error)
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
