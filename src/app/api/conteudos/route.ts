import { createClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()

        // 1. Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = req.nextUrl.searchParams
        const status = searchParams.get('status')
        const view = searchParams.get('view')

        let query = supabase.from('content_items').select('*')

        if (status && status !== 'all') {
            query = query.eq('status', status)
        }

        // Ordenação padrão decrescente
        query = query.order('created_at', { ascending: false })

        const { data: contentItems, error } = await query

        if (error) {
            console.error('API /conteudos error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(contentItems)
    } catch (error: any) {
        console.error('API /conteudos crash:', error)
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()

        // 1. Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { title, topic, content_type, base_copy, status, scheduled_date } = body

        if (!title) {
            return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('content_items')
            .insert([{
                title,
                topic,
                content_type: content_type || 'blog',
                base_copy,
                status: status || 'draft',
                scheduled_date
            }])
            .select()
            .single()

        if (error) {
            console.error('API /conteudos POST error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('API /conteudos POST crash:', error)
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
    }
}
