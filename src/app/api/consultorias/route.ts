import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json([], { status: 200 })
        }

        const { data, error } = await supabase
            .from('consultorias')
            .select('id, protocolo, cliente_nome, cliente_email, tipo, descricao, cidade, status, honorarios, honorarios_status, data_inicio, data_prev_conclusao, created_at')
            .order('created_at', { ascending: false })
            .limit(100)

        if (error) {
            console.error('Error fetching consultorias:', error)
            return NextResponse.json([], { status: 200 })
        }

        return NextResponse.json(data || [])
    } catch (err) {
        console.error('consultorias GET error:', err)
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
            .from('consultorias')
            .insert(body)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json(data, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
