import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let pw = ''
    for (let i = 0; i < 12; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length))
    return pw
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: sessionErr } = await supabase.auth.getUser()
        if (sessionErr || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { name, email, phone, creci, role, status, permissions } = body

        if (!name || !email) {
            return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 })
        }

        // Check if broker already exists
        const { data: existingBroker } = await supabaseAdmin
            .from('brokers')
            .select('id, email')
            .eq('email', email)
            .maybeSingle()
        if (existingBroker) {
            return NextResponse.json(
                { error: 'Já existe um corretor cadastrado com este email.' },
                { status: 409 }
            )
        }

        // Generate temporary password — user will change on first login
        const tempPassword = generateTempPassword()

        // Check if auth user already exists (from a previous failed attempt)
        const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers()
        const existingAuth = existingUsers?.find(u => u.email === email)

        let userId: string

        if (existingAuth) {
            // Auth user exists but no broker record — reuse the auth user
            userId = existingAuth.id
            // Update the password to the new temp password
            await supabaseAdmin.auth.admin.updateUserById(userId, {
                password: tempPassword,
                user_metadata: {
                    ...existingAuth.user_metadata,
                    full_name: name,
                    must_change_password: true,
                },
            })
        } else {
            // Create new auth user with temp password
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    full_name: name,
                    must_change_password: true,
                },
            })
            if (authError) {
                return NextResponse.json({ error: authError.message }, { status: 400 })
            }
            userId = authData.user.id
        }

        // Create broker record
        const { data: broker, error: brokerError } = await supabaseAdmin
            .from('brokers')
            .insert({
                user_id: userId,
                name,
                email,
                phone: phone || null,
                creci: creci || null,
                status: status || 'active',
                role: role || 'broker',
                permissions: permissions?.length ? permissions : ['dashboard', 'imoveis', 'leads', 'agenda'],
                created_by: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (brokerError) {
            // Only delete auth user if WE just created it (not reused)
            if (!existingAuth) {
                await supabaseAdmin.auth.admin.deleteUser(userId)
            }
            return NextResponse.json({ error: brokerError.message }, { status: 500 })
        }

        // Return broker + temp password (admin sees it once to share with user)
        return NextResponse.json({
            ...broker,
            temp_password: tempPassword,
            message: `Corretor ${name} cadastrado. Senha provisória gerada. O usuário deve alterá-la no primeiro acesso.`,
        }, { status: 201 })
    } catch (err: unknown) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
