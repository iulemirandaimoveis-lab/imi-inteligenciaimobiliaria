import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
    try {
        const { email, temp_password, new_password } = await req.json()

        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
        const tempPassword = typeof temp_password === 'string' ? temp_password : ''
        const newPassword = typeof new_password === 'string' ? new_password : ''

        if (!normalizedEmail || !tempPassword || !newPassword) {
            return NextResponse.json({ error: 'Dados obrigatórios não informados.' }, { status: 400 })
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'A nova senha deve ter no mínimo 8 caracteres.' }, { status: 400 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (!supabaseUrl || !supabaseAnonKey) {
            return NextResponse.json({ error: 'Configuração de autenticação ausente no servidor.' }, { status: 500 })
        }

        const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        })

        const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
            email: normalizedEmail,
            password: tempPassword,
        })

        if (signInError || !signInData.user) {
            return NextResponse.json({ error: 'E-mail ou senha provisória inválidos.' }, { status: 401 })
        }

        const userId = signInData.user.id
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword,
            email_confirm: true,
        })

        if (updateError) {
            return NextResponse.json({ error: 'Não foi possível atualizar a senha.' }, { status: 500 })
        }

        await supabaseAdmin
            .from('profiles')
            .update({
                must_reset_password: false,
                first_login: false,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Erro interno ao processar primeiro acesso.' }, { status: 500 })
    }
}
