import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit, getRequestMeta } from '@/lib/governance'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching leads:', error)
            return NextResponse.json([], { status: 200 })
        }

        return NextResponse.json(data || [])
    } catch (error) {
        console.error('Error in GET /api/leads:', error)
        return NextResponse.json([], { status: 200 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        const { data: lead, error } = await supabase
            .from('leads')
            .insert({
                name: body.name,
                email: body.email,
                phone: body.phone,
                source: body.source || 'website',
                status: body.status || 'new',
                ai_score: body.ai_score || 0,
                ai_priority: body.ai_priority || 'medium',
                development_id: body.development_id || null,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating lead:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Audit log
        const meta = getRequestMeta(request)
        logAudit({
            user_id: session?.user?.id,
            action: 'create',
            entity_type: 'lead',
            entity_id: lead.id,
            new_data: { name: body.name, email: body.email, source: body.source },
            ...meta,
        })

        return NextResponse.json({ success: true, lead })
    } catch (error) {
        console.error('Error in POST /api/leads:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
