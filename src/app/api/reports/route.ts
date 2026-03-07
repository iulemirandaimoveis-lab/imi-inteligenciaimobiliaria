import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/reports — list market reports
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const publishedOnly = searchParams.get('published') === 'true'

        if (id) {
            const { data, error } = await supabase
                .from('market_reports')
                .select('*')
                .eq('id', id)
                .single()
            if (error) return NextResponse.json({ error: error.message }, { status: 404 })
            return NextResponse.json(data)
        }

        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 250)
        const offset = (page - 1) * limit

        let query = supabase
            .from('market_reports')
            .select('*', { count: 'exact' })
            .order('published_at', { ascending: false })

        if (publishedOnly) query = query.eq('is_published', true)

        query = query.range(offset, offset + limit - 1)

        const { data, error, count } = await query
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({
            data: data || [],
            pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// POST /api/reports — create market report
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        if (!body.title) return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 })

        const { data, error } = await supabase
            .from('market_reports')
            .insert({ ...body })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// PATCH /api/reports — update market report
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { id, ...updates } = body
        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

        const { data, error } = await supabase
            .from('market_reports')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// DELETE /api/reports?id=xxx
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

        const { error } = await supabase
            .from('market_reports')
            .update({ is_published: false, updated_at: new Date().toISOString() })
            .eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
