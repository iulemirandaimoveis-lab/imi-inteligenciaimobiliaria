import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ADMIN_ROLES = ['admin', 'ADMIN', 'super_admin', 'SUPER_ADMIN', 'owner']

function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let pw = ''
    for (let i = 0; i < 12; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length))
    return pw + 'A1!'
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: sessionErr } = await supabase.auth.getUser()
        if (sessionErr || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Verify caller is admin
        const { data: callerProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!callerProfile || !ADMIN_ROLES.includes(callerProfile.role)) {
            return NextResponse.json(
                { error: 'Apenas administradores podem criar membros da equipe' },
                { status: 403 }
            )
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
            .eq('email', email.toLowerCase().trim())
            .maybeSingle()

        if (existingBroker) {
            return NextResponse.json(
                { error: 'Já existe um corretor cadastrado com este email.' },
                { status: 409 }
            )
        }

        const tempPassword = generateTempPassword()

        // Check if auth user already exists via profiles table
        let existingAuth: { id: string; user_metadata?: Record<string, unknown> } | null = null
        const { data: profileMatch } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle()

        if (profileMatch) {
            const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(profileMatch.id)
            if (authUser) existingAuth = authUser
        }

        let userId: string

        if (existingAuth) {
            userId = existingAuth.id
            await supabaseAdmin.auth.admin.updateUserById(userId, {
                password: tempPassword,
                user_metadata: {
                    ...existingAuth.user_metadata,
                    full_name: name,
                    must_change_password: true,
                },
            })
        } else {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: email.toLowerCase().trim(),
                password: tempPassword,
                email_confirm: true,
                user_metadata: { full_name: name, must_change_password: true },
            })
            if (authError) {
                return NextResponse.json({ error: authError.message }, { status: 400 })
            }
            userId = authData.user.id
        }

        // Create broker record
        const brokerRole = role || 'broker'
        const { data: broker, error: brokerError } = await supabaseAdmin
            .from('brokers')
            .insert({
                user_id: userId,
                name,
                email: email.toLowerCase().trim(),
                phone: phone || null,
                creci: creci || null,
                status: status || 'active',
                role: brokerRole,
                permissions: permissions?.length
                    ? permissions
                    : ['dashboard', 'imoveis', 'leads', 'agenda'],
                created_by: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (brokerError) {
            if (!existingAuth) {
                await supabaseAdmin.auth.admin.deleteUser(userId)
            }
            return NextResponse.json({ error: brokerError.message }, { status: 500 })
        }

        // Sync to profiles table
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                email: email.toLowerCase().trim(),
                name,
                role: brokerRole === 'broker_manager' ? 'admin' : 'corretor',
            }, { onConflict: 'id' })

        if (profileError) {
            console.error('Profile sync error (non-critical):', profileError.message)
        }

        return NextResponse.json({
            ...broker,
            temp_password: tempPassword,
            message: `${name} cadastrado. Compartilhe a senha provisória — o usuário deve alterá-la no primeiro acesso.`,
        }, { status: 201 })

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('brokers/create error:', msg)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
