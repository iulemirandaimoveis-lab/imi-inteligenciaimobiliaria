import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function POST(request: NextRequest) {
    try {
        const data = await request.json()
        const supabase = await createClient()
        // Validate required fields
        const requiredFields = ['name', 'phone']
        for (const field of requiredFields) {
            if (!data[field]) {
                return NextResponse.json(
                    { error: `Campo obrigatório ausente: ${field}` },
                    { status: 400 }
                )
            }
        }
        // Store in Supabase 'leads' table
        const { error } = await supabase.from('leads').insert({
            name: data.name,
            email: data.email,
            phone: data.phone,
            origin: 'website-contact', // Identifying the origin
            message: data.message,
            interest: data.interest || 'Geral', // Optional interest
            status: 'new'
        })
        if (error) {
            return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
        }
        return NextResponse.json(
            { success: true, message: 'Mensagem recebida com sucesso' },
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { error: 'Erro ao processar mensagem' },
            { status: 500 }
        )
    }
}
