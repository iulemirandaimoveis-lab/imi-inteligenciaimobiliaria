import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseBody, calendarEventSchema, calendarEventUpdateSchema } from '@/lib/schemas'

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        const { searchParams } = new URL(req.url)
        const month = searchParams.get('month') // YYYY-MM
        const id = searchParams.get('id')

        if (id) {
            const { data, error } = await supabase.from('calendar_events').select('*').eq('id', id).single()
            if (error) return NextResponse.json({ error: error.message }, { status: 404 })
            return NextResponse.json(data)
        }

        let query = supabase.from('calendar_events').select('*').order('start_time', { ascending: true })
        if (month) {
            const start = `${month}-01T00:00:00`
            const y = parseInt(month.split('-')[0])
            const m = parseInt(month.split('-')[1])
            const lastDay = new Date(y, m, 0).getDate()
            const end = `${month}-${String(lastDay).padStart(2, '0')}T23:59:59`
            query = query.gte('start_time', start).lte('start_time', end)
        }

        const { data, error } = await query.limit(200)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data || [])
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const parsed = await parseBody(req, calendarEventSchema)
        if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error }, { status: 400 })
        const { title, description, event_type, start_time, end_time, all_day, location, color, related_type, related_id } = parsed.data

        const { data, error } = await supabase.from('calendar_events').insert({
            title, description: description || null, event_type: event_type || 'reuniao',
            start_time, end_time: end_time || null, all_day: all_day || false,
            location: location || null, color: color || '#486581',
            related_type: related_type || null, related_id: related_id || null,
        }).select().single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const parsed = await parseBody(req, calendarEventUpdateSchema)
        if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error }, { status: 400 })
        const { id, ...updates } = parsed.data
        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
        ;(updates as any).updated_at = new Date().toISOString()

        const { data, error } = await supabase.from('calendar_events').update(updates).eq('id', id).select().single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
        const { error } = await supabase.from('calendar_events').delete().eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
