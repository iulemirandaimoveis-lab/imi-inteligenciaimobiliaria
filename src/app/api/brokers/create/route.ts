import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, email, phone, creci, password, status, permissions } = body

        if (!name || !email || !creci || !password) {
            return NextResponse.json(
                { error: 'name, email, creci e password são obrigatórios' },
                { status: 400 }
            )
        }

        // 1. Create auth user with service role (admin.createUser requires service role)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name },
        })

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        const userId = authData.user.id

        // 2. Create broker record
        const { data: broker, error: brokerError } = await supabaseAdmin
            .from('brokers')
            .insert({
                user_id: userId,
                name,
                email,
                phone: phone || null,
                creci,
                status: status || 'active',
                permissions: permissions || [],
                role: 'broker',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (brokerError) {
            // Rollback: delete the auth user to avoid orphaned records
            await supabaseAdmin.auth.admin.deleteUser(userId)
            return NextResponse.json({ error: brokerError.message }, { status: 500 })
        }

        return NextResponse.json(broker, { status: 201 })
    } catch (err: any) {
        console.error('Error in POST /api/brokers/create:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
