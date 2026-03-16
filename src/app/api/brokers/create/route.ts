import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { parseBody, brokerCreateSchema } from '@/lib/schemas'

export async function POST(request: Request) {
    try {
        // Auth check — only authenticated users can create brokers
        const supabase = await createClient()
        const { data: { user }, error: sessionErr } = await supabase.auth.getUser()
        if (sessionErr || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const parsed = await parseBody(request, brokerCreateSchema)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error }, { status: 400 })
        }
        const { name, email, phone, creci, password, status, permissions } = parsed.data

        // 0. Check if broker with this email already exists in our table
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

        // 1. Create auth user with service role (admin.createUser requires service role)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name },
        })

        if (authError) {
            // If auth user already exists (orphaned from a failed previous attempt),
            // find and delete it so we can recreate cleanly.
            if (authError.message.includes('already been registered') || authError.message.includes('already registered')) {
                // List users to find the orphaned one
                const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
                const orphan = users?.find(u => u.email === email)
                if (orphan) {
                    // Delete orphaned auth user and retry
                    await supabaseAdmin.auth.admin.deleteUser(orphan.id)
                    // Retry auth user creation
                    const { data: retryAuth, error: retryError } = await supabaseAdmin.auth.admin.createUser({
                        email,
                        password,
                        email_confirm: true,
                        user_metadata: { name },
                    })
                    if (retryError) {
                        return NextResponse.json({ error: retryError.message }, { status: 400 })
                    }
                    // Continue with the retried auth user
                    const userId = retryAuth.user.id
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
                        await supabaseAdmin.auth.admin.deleteUser(userId)
                        return NextResponse.json({ error: brokerError.message }, { status: 500 })
                    }
                    return NextResponse.json(broker, { status: 201 })
                }
                return NextResponse.json(
                    { error: 'Este email já está em uso. Tente outro email.' },
                    { status: 409 }
                )
            }
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
