import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
export const dynamic = 'force-dynamic'
// Check if service role key is configured
const hasServiceKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY)
export async function POST(request: Request) {
    try {
        // Verify the caller is authenticated
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }
        // Check if caller has admin role
        const client = hasServiceKey ? supabaseAdmin : supabase
        const { data: callerProfile } = await client
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        const isAdmin = callerProfile && ['ADMIN', 'admin', 'SUPER_ADMIN', 'super_admin', 'owner'].includes(callerProfile.role)
        if (!isAdmin) {
            return NextResponse.json({ error: 'Apenas administradores podem criar usuários' }, { status: 403 })
        }
        const body = await request.json()
        const { email, name, role } = body
        if (!email || !name) {
            return NextResponse.json(
                { error: 'Email e nome são obrigatórios' },
                { status: 400 }
            )
        }
        // Auto-generate a temporary password — user will set their own via recovery email
        const tempPassword = crypto.randomUUID().slice(0, 12) + 'A1!'
        const validRole = role || 'EDITOR'
        if (hasServiceKey) {
            // Check for existing user with this email first
            const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers()
            const existingUser = existingUsers?.find(u => u.email === email)
            if (existingUser) {
                // User exists in auth — sync to profiles/brokers and return success
                const existingId = existingUser.id
                await supabaseAdmin.from('profiles').upsert({
                    id: existingId, email, name, role: validRole.toLowerCase()
                })
                await supabaseAdmin.from('brokers').upsert({
                    user_id: existingId, name, email, status: 'active',
                    role: validRole.toLowerCase() === 'admin' ? 'broker_manager' : 'broker',
                    permissions: ['dashboard', 'imoveis', 'leads', 'agenda', 'avaliacoes', 'financeiro', 'contratos'],
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' })
                return NextResponse.json({
                    success: true,
                    user: { id: existingId, email, name, role: validRole },
                    message: `Usuário ${email} já existia — perfil atualizado com sucesso.`
                })
            }
            // Admin flow: create user via admin API (bypasses email confirmation)
            const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { name, role: validRole }
            })
            if (createError) {
                const msg = createError.message
                if (msg.includes('already been registered') || msg.includes('already exists')) {
                    return NextResponse.json({ error: `O email ${email} já está cadastrado no sistema.` }, { status: 409 })
                }
                return NextResponse.json({ error: `Erro ao criar usuário: ${msg}` }, { status: 500 })
            }
            const newUserId = authUser.user.id
            // Sync to profiles
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({ id: newUserId, email, name, role: validRole.toLowerCase() })
            if (profileError) {
                console.error('Profiles sync error:', profileError.message)
            }
            // Sync to brokers table so user appears in Equipe
            const { error: brokerError } = await supabaseAdmin.from('brokers').upsert({
                user_id: newUserId,
                name,
                email,
                status: 'active',
                role: validRole.toLowerCase() === 'admin' ? 'broker_manager' : 'broker',
                permissions: ['dashboard', 'imoveis', 'leads', 'agenda', 'avaliacoes', 'financeiro', 'contratos'],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })
            if (brokerError) {
                console.error('Brokers sync error:', brokerError.message)
            }
            // Send password reset email so user can set their own password
            await supabaseAdmin.auth.admin.generateLink({
                type: 'recovery',
                email,
                options: {
                    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br'}/login?reset=true`
                }
            }).catch(() => { /* non-critical if email fails */ })
            return NextResponse.json({
                success: true,
                user: { id: newUserId, email, name, role: validRole },
                message: `Convite enviado para ${email}. O usuário receberá um link para definir sua senha.`
            })
        } else {
            // Fallback: use regular signUp (user will need to confirm email)
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password: tempPassword,
                options: {
                    data: { name, role: validRole },
                    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br'}/login`,
                }
            })
            if (signUpError) {
                return NextResponse.json({ error: signUpError.message }, { status: 500 })
            }
            // Sync to public.users and profiles so the user appears in the list
            if (signUpData.user) {
                const newUserId = signUpData.user.id
                await supabase
                    .from('profiles')
                    .upsert({ id: newUserId, email, name, role: validRole, createdAt: new Date().toISOString() })
                    .then(() => {})
                await supabase
                    .from('profiles')
                    .upsert({ id: newUserId, email, name, role: validRole.toLowerCase(), created_at: new Date().toISOString() })
                    .then(() => {})
            }
            return NextResponse.json({
                success: true,
                user: { id: signUpData.user?.id, email, name, role: validRole },
                message: 'Usuário criado com sucesso.'
            })
        }
    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erro interno no servidor' },
            { status: 500 }
        )
    }
}
export async function PUT(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        // Check admin
        let isAdmin = false
        const client = hasServiceKey ? supabaseAdmin : supabase
        const { data: callerRow } = await client.from('profiles').select('role').eq('id', user.id).single()
        if (callerRow && ['ADMIN', 'admin', 'SUPER_ADMIN'].includes(callerRow.role)) isAdmin = true
        if (!isAdmin) {
            const { data: callerProfile } = await client.from('profiles').select('role').eq('id', user.id).single()
            if (callerProfile && ['admin', 'ADMIN', 'SUPER_ADMIN'].includes(callerProfile.role)) isAdmin = true
        }
        if (!isAdmin) return NextResponse.json({ error: 'Apenas administradores podem editar usuários' }, { status: 403 })
        const body = await request.json()
        const { id, name, role, is_active } = body
        if (!id) return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
        const updates: Record<string, unknown> = {}
        if (name !== undefined) updates.name = name
        if (role !== undefined) updates.role = role
        updates.updated_at = new Date().toISOString()
        // Update profiles table
        await client.from('profiles').update(updates).eq('id', id)
        // If toggling active status, use auth admin API to ban/unban
        if (is_active !== undefined && hasServiceKey) {
            await supabaseAdmin.auth.admin.updateUserById(id, {
                ban_duration: is_active ? 'none' : '876000h' // ~100 years = effectively permanent
            })
        }
        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno' }, { status: 500 })
    }
}
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        // Check admin
        let isAdmin = false
        const client = hasServiceKey ? supabaseAdmin : supabase
        const { data: callerRow } = await client.from('profiles').select('role').eq('id', user.id).single()
        if (callerRow && ['ADMIN', 'admin', 'SUPER_ADMIN'].includes(callerRow.role)) isAdmin = true
        if (!isAdmin) {
            const { data: callerProfile } = await client.from('profiles').select('role').eq('id', user.id).single()
            if (callerProfile && ['admin', 'ADMIN', 'SUPER_ADMIN'].includes(callerProfile.role)) isAdmin = true
        }
        if (!isAdmin) return NextResponse.json({ error: 'Apenas administradores podem desativar usuários' }, { status: 403 })
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
        // Prevent self-deactivation
        if (id === user.id) return NextResponse.json({ error: 'Não é possível desativar o próprio usuário' }, { status: 400 })
        // Soft-delete: ban user via auth admin API
        if (hasServiceKey) {
            await supabaseAdmin.auth.admin.updateUserById(id, {
                ban_duration: '876000h' // effectively permanent
            })
        }
        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno' }, { status: 500 })
    }
}
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Self-heal: sync auth.users to profiles table
        // Handles users created via Supabase dashboard or manual SQL that are missing from profiles
        if (hasServiceKey) {
            try {
                const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers()
                if (authUsers) {
                    for (const au of authUsers) {
                        const { data: existing } = await supabaseAdmin
                            .from('profiles')
                            .select('id')
                            .eq('id', au.id)
                            .maybeSingle()
                        if (!existing) {
                            await supabaseAdmin.from('profiles').insert({
                                id: au.id,
                                email: au.email || '',
                                name: au.user_metadata?.name || au.user_metadata?.full_name || au.email?.split('@')[0] || 'Usuário',
                                role: au.user_metadata?.role || 'corretor',
                                avatar_url: au.user_metadata?.avatar_url || null,
                                phone: au.user_metadata?.phone || null,
                                created_at: au.created_at,
                            })
                        }
                    }
                }
            } catch {
                // Non-critical: if self-heal fails, continue with normal query
            }
        }

        // Try profiles first (has more columns), fallback to users
        const client = hasServiceKey ? supabaseAdmin : supabase
        const { data, error } = await client
            .from('profiles')
            .select('id, email, name, role, avatar_url, phone, created_at')
            .order('created_at', { ascending: false })
        if (error) {
            // Fallback to users table with camelCase columns
            const { data: usersData, error: usersError } = await client
                .from('profiles')
                .select('id, email, name, role, "createdAt"')
                .order('"createdAt"', { ascending: false })
            if (usersError) throw usersError
            return NextResponse.json({ users: usersData || [] })
        }
        return NextResponse.json({ users: data || [] })
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
}
