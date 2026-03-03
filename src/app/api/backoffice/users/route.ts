import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Protected: requires CRON_SECRET or valid admin session
function isAuthorized(request: Request): boolean {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Allow if valid CRON_SECRET is provided
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true

    // In production, this should validate a Supabase Auth session + admin role.
    // For now, we block unauthenticated access entirely.
    return false
}

export async function POST(request: Request) {
    try {
        if (!isAuthorized(request)) {
            return NextResponse.json(
                { error: 'Acesso não autorizado. Use o Supabase Dashboard para criar usuários.' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { email, password, name, role } = body

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Email, senha e nome são obrigatórios' },
                { status: 400 }
            )
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Create user in Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role: role || 'EDITOR' }
        })

        if (authError) {
            console.error('Error creating auth user:', authError)
            return NextResponse.json({ error: authError.message }, { status: 500 })
        }

        const newUserId = authUser.user.id

        // 2. Insert into public.users
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .insert({ id: newUserId, email, name, role: role || 'EDITOR' })

        if (dbError) {
            console.error('Error creating public user:', dbError)
            return NextResponse.json({ error: dbError.message }, { status: 500 })
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
