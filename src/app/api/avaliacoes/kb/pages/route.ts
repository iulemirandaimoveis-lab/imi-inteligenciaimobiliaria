import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const sourceFile = searchParams.get('source_file')

    let query = supabaseAdmin
        .from('avaliacoes_kb_pages')
        .select('id, source_file, source_type, page_title, normas_citadas, created_at, avaliacoes_kb_topics(count)')
        .order('created_at', { ascending: false })

    if (sourceFile) {
        query = query.eq('source_file', sourceFile)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
    return NextResponse.json(data ?? [])
}

export async function DELETE(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    // Topics will cascade delete due to FK
    const { error } = await supabaseAdmin
        .from('avaliacoes_kb_pages')
        .delete()
        .eq('id', id)

    if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
    return NextResponse.json({ success: true })
}
