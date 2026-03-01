import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit, getRequestMeta } from '@/lib/governance'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { data: lead, error } = await supabase
            .from('leads')
            .select('*')
            .eq('id', params.id)
            .single()

        if (error) {
            console.error('Error fetching lead:', error)
            return NextResponse.json({ error: error.message }, { status: 404 })
        }

        return NextResponse.json(lead)
    } catch (error) {
        console.error('Error in GET /api/leads/[id]:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()

        // Only allow safe fields to be updated
        const allowedFields = [
            'name', 'email', 'phone', 'status', 'source',
            'score', 'ai_score', 'ai_priority', 'interest_type',
            'interest_location', 'budget_min', 'budget_max',
            'notes', 'assigned_to', 'development_id',
        ]

        const updates: Record<string, any> = { updated_at: new Date().toISOString() }
        for (const key of allowedFields) {
            if (body[key] !== undefined) {
                updates[key] = body[key]
            }
        }

        const { data: lead, error } = await supabase
            .from('leads')
            .update(updates)
            .eq('id', params.id)
            .select()
            .single()

        if (error) {
            console.error('Error updating lead:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Audit log
        const meta = getRequestMeta(request)
        logAudit({
            user_id: user.id,
            action: 'update',
            entity_type: 'lead',
            entity_id: params.id,
            new_data: updates,
            ...meta,
        })

        return NextResponse.json({ success: true, lead })
    } catch (error) {
        console.error('Error in PATCH /api/leads/[id]:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Soft delete — set status to 'archived'
        const { error } = await supabase
            .from('leads')
            .update({ status: 'archived', updated_at: new Date().toISOString() })
            .eq('id', params.id)

        if (error) {
            console.error('Error archiving lead:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Audit log
        const meta = getRequestMeta(request)
        logAudit({
            user_id: user.id,
            action: 'delete',
            entity_type: 'lead',
            entity_id: params.id,
            ...meta,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in DELETE /api/leads/[id]:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
