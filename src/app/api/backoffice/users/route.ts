import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password, name, role } = body

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Email, senha e nome são obrigatórios' },
                { status: 400 }
            )
        }

        // Initialize Supabase Admin client to bypass RLS and use Admin API
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Create user in Supabase Auth (auth.users)
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name,
                role: role || 'EDITOR'
            }
        })

        if (authError) {
            console.error('Error creating auth user:', authError)
            return NextResponse.json(
                { error: authError.message },
                { status: 500 }
            )
        }

        const newUserId = authUser.user.id

        // 2. Insert user into public.users table
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .insert({
                id: newUserId,
                email,
                name,
                role: role || 'EDITOR'
            })

        if (dbError) {
            console.error('Error creating public user:', dbError)
            // Ideally we'd rollback the auth user creation here
            return NextResponse.json(
                { error: dbError.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, user: authUser.user })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Erro interno no servidor' },
            { status: 500 }
        )
    }
}
