import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const status = searchParams.get('status')

    if (id) {
        const { data, error } = await supabase
            .from('credit_applications')
            .select('*')
            .eq('id', id)
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    }

    let query = supabase
        .from('credit_applications')
        .select('*')
        .order('created_at', { ascending: false })

    if (status && status !== 'todos') {
        query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { data, error } = await supabase
        .from('credit_applications')
        .insert([body])
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}
