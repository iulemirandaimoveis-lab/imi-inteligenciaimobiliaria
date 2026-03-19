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
        // Check if caller has admin role — try both tables (users + profiles)
        let isAdmin = false
        if (hasServiceKey) {
            const { data: userRow } = await supabaseAdmin
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single()
            if (userRow && ['ADMIN', 'admin', 'SUPER_ADMIN'].includes(userRow.role)) {
                isAdmin = true
            }
            if (!isAdmin) {
                const { data: profileRow } = await supabaseAdmin
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()
                if (profileRow && ['admin', 'ADMIN', 'SUPER_ADMIN'].includes(profileRow.role)) {
                    isAdmin = true
                }
            }
        } else {
            // Without service key, check via authenticated client
            const { data: userRow } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single()
            if (userRow && ['ADMIN', 'admin', 'SUPER_ADMIN'].includes(userRow.role)) {
                isAdmin = true
            }
        }
        if (!isAdmin) {
            return NextResponse.json({ error: 'Apenas administradores podem criar usuários' }, { status: 403 })
        }
        const body = await request.json()
        const { email, password, name, role } = body
        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Email, senha e nome são obrigatórios' },
                { status: 400 }
            )
        }
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Senha deve ter pelo menos 6 caracteres' },
                { status: 400 }
            )
        }
        const validRole = role || 'EDITOR'
        if (hasServiceKey) {
            // Admin flow: create user via admin API (bypasses email confirmation)
            const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name, role: validRole }
            })
            if (createError) {
                return NextResponse.json({ error: createError.message }, { status: 500 })
            }
            const newUserId = authUser.user.id
            // Sync to public.users (camelCase columns)
            await supabaseAdmin
                .from('users')
                .upsert({ id: newUserId, email, name, role: validRole })
                .then(() => {})
            // Also sync to profiles
            await supabaseAdmin
                .from('profiles')
                .upsert({ id: newUserId, email, name, role: validRole.toLowerCase() })
                .then(() => {})
            return NextResponse.json({ success: true, user: { id: newUserId, email, name, role: validRole } })
        } else {
            // Fallback: use regular signUp (user will need to confirm email)
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
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
                    .from('users')
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
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Erro interno no servidor' },
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
        const { data: callerRow } = await client.from('users').select('role').eq('id', user.id).single()
        if (callerRow && ['ADMIN', 'admin', 'SUPER_ADMIN'].includes(callerRow.role)) isAdmin = true
        if (!isAdmin) {
            const { data: callerProfile } = await client.from('profiles').select('role').eq('id', user.id).single()
            if (callerProfile && ['admin', 'ADMIN', 'SUPER_ADMIN'].includes(callerProfile.role)) isAdmin = true
        }
        if (!isAdmin) return NextResponse.json({ error: 'Apenas administradores podem editar usuários' }, { status: 403 })
        const body = await request.json()
        const { id, name, role, is_active } = body
        if (!id) return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
        const updates: Record<string, any> = {}
        if (name !== undefined) updates.name = name
        if (role !== undefined) updates.role = role
        if (is_active !== undefined) updates.is_active = is_active
        // Update profiles table
        const { error: profileErr } = await client.from('profiles').update(updates).eq('id', id)
        // profileErr handled via response
        // Update users table (camelCase role, no is_active in that table typically)
        const userUpdates: Record<string, any> = {}
        if (name !== undefined) userUpdates.name = name
        if (role !== undefined) userUpdates.role = role
        if (is_active !== undefined) userUpdates.active = is_active
        await client.from('users').update(userUpdates).eq('id', id)
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
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
        const { data: callerRow } = await client.from('users').select('role').eq('id', user.id).single()
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
        // Soft-delete: mark as inactive in both tables
        await client.from('profiles').update({ is_active: false }).eq('id', id)
        await client.from('users').update({ active: false }).eq('id', id)
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
    }
}
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }
        // Try profiles first (has more columns), fallback to users
        const client = hasServiceKey ? supabaseAdmin : supabase
        const { data, error } = await client
            .from('profiles')
            .select('id, email, name, role, avatar_url, phone, is_active, created_at')
            .order('created_at', { ascending: false })
        if (error) {
            // Fallback to users table with camelCase columns
            const { data: usersData, error: usersError } = await client
                .from('users')
                .select('id, email, name, role, "createdAt"')
                .order('"createdAt"', { ascending: false })
            if (usersError) throw usersError
            return NextResponse.json({ users: usersData || [] })
        }
        return NextResponse.json({ users: data || [] })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
