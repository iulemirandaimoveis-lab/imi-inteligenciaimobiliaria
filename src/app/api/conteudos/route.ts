import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json([], { status: 200 })

        const { data, error } = await supabase
            .from('conteudos')
            .select('id, titulo, tipo, plataforma, status, data_publicacao, visualizacoes, engajamento, created_at')
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) return NextResponse.json([], { status: 200 })
        return NextResponse.json(data || [])
    } catch {
        return NextResponse.json([], { status: 200 })
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { data, error } = await supabase
            .from('conteudos')
            .insert({ ...body, user_id: user.id })
            .select().single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json(data, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
