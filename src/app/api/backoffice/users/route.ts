import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
export const dynamic = 'force-dynamic'
// Check if service role key is configured
const hasServiceKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY)

function mapRoleForAuthMetadata(role: string) {
    const normalized = role.trim().toUpperCase()
    if (normalized === 'ADMIN' || normalized === 'SUPER_ADMIN' || normalized === 'OWNER') return 'admin'
    if (normalized === 'GESTOR' || normalized === 'MANAGER') return 'manager'
    return 'broker'
}

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
        const authMetadataRole = mapRoleForAuthMetadata(validRole)
        if (hasServiceKey) {
            // Check for existing user with this email (efficient — no listUsers)
            const { data: existingProfile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('email', email)
                .maybeSingle()

            if (existingProfile) {
                // User exists — sync to profiles/brokers and return success
                const existingId = existingProfile.id
                await supabaseAdmin.from('profiles').upsert({
                    id: existingId, email, name, role: validRole.toLowerCase()
                })
                // Upsert broker — handle both user_id and email unique constraints
                const { data: existingBroker } = await supabaseAdmin
                    .from('brokers').select('id').eq('email', email).maybeSingle()
                if (existingBroker) {
                    await supabaseAdmin.from('brokers').update({
                        user_id: existingId, name, status: 'active',
                        role: validRole.toLowerCase() === 'admin' ? 'broker_manager' : 'broker',
                        permissions: ['dashboard', 'imoveis', 'leads', 'agenda', 'avaliacoes', 'financeiro', 'contratos'],
                        updated_at: new Date().toISOString(),
                    }).eq('id', existingBroker.id)
                } else {
                    await supabaseAdmin.from('brokers').upsert({
                        user_id: existingId, name, email, status: 'active',
                        role: validRole.toLowerCase() === 'admin' ? 'broker_manager' : 'broker',
                        permissions: ['dashboard', 'imoveis', 'leads', 'agenda', 'avaliacoes', 'financeiro', 'contratos'],
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id' })
                }
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
                user_metadata: { name, role: authMetadataRole }
            })
            if (createError) {
                const msg = createError.message
                if (msg.includes('already been registered') || msg.includes('already exists')) {
                    return NextResponse.json({ error: `O email ${email} já está cadastrado no sistema.` }, { status: 409 })
                }
                // "Database error creating new user" usually means a trigger on auth.users is failing
                if (msg.includes('Database error')) {
                    console.error('Database error creating user — likely a trigger issue on auth.users or profiles table:', msg)
                    // Try to create user without triggering the database issue by first checking if the issue
                    // is a trigger on auth.users that inserts into profiles — since we do our own profile insert below
                    // Retry without user_metadata to reduce trigger failure chance
                    const { data: retryUser, error: retryError } = await supabaseAdmin.auth.admin.createUser({
                        email,
                        password: tempPassword,
                        email_confirm: true,
                    })
                    if (!retryError && retryUser?.user) {
                        const newUserId = retryUser.user.id
                        // Manually set metadata
                        await supabaseAdmin.auth.admin.updateUserById(newUserId, {
                            user_metadata: { name, role: authMetadataRole }
                        }).catch(() => {})
                        // Continue with the rest of the flow (profile + broker sync below)
                        const { error: profileError } = await supabaseAdmin
                            .from('profiles')
                            .upsert({ id: newUserId, email, name, role: validRole.toLowerCase() })
                        if (profileError) console.error('Profiles sync error (retry):', profileError.message)
                        const { data: existingBrokerByEmail2 } = await supabaseAdmin
                            .from('brokers').select('id').eq('email', email).maybeSingle()
                        const brokerPayload2 = {
                            user_id: newUserId, name, email, status: 'active',
                            role: validRole.toLowerCase() === 'admin' ? 'broker_manager' : 'broker',
                            permissions: ['dashboard', 'imoveis', 'leads', 'agenda', 'avaliacoes', 'financeiro', 'contratos'],
                            updated_at: new Date().toISOString(),
                        }
                        if (existingBrokerByEmail2) {
                            await supabaseAdmin.from('brokers').update(brokerPayload2).eq('id', existingBrokerByEmail2.id)
                        } else {
                            await supabaseAdmin.from('brokers').insert({ ...brokerPayload2, created_at: new Date().toISOString() })
                        }
                        await supabaseAdmin.auth.admin.generateLink({
                            type: 'recovery', email,
                            options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br'}/login?reset=true` }
                        }).catch(() => {})
                        return NextResponse.json({
                            success: true,
                            user: { id: newUserId, email, name, role: validRole },
                            message: `Convite enviado para ${email}. O usuário receberá um link para definir sua senha.`
                        })
                    }
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
                // Non-critical: user was created in auth, profile sync can be retried
            }
            // Sync to brokers table so user appears in Equipe
            // Check by email first to avoid unique constraint violation on email
            const { data: existingBrokerByEmail } = await supabaseAdmin
                .from('brokers').select('id').eq('email', email).maybeSingle()
            const brokerPayload = {
                user_id: newUserId,
                name,
                email,
                status: 'active',
                role: validRole.toLowerCase() === 'admin' ? 'broker_manager' : 'broker',
                permissions: ['dashboard', 'imoveis', 'leads', 'agenda', 'avaliacoes', 'financeiro', 'contratos'],
                updated_at: new Date().toISOString(),
            }
            const { error: brokerError } = existingBrokerByEmail
                ? await supabaseAdmin.from('brokers').update(brokerPayload).eq('id', existingBrokerByEmail.id)
                : await supabaseAdmin.from('brokers').insert({ ...brokerPayload, created_at: new Date().toISOString() })
            if (brokerError) {
                console.error('Brokers sync error:', brokerError.message)
                // Non-critical: user was created, broker sync can be retried
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
            return NextResponse.json(
                { error: 'Criação de usuários requer a chave de serviço do Supabase (SUPABASE_SERVICE_ROLE_KEY). Verifique as variáveis de ambiente no Vercel.' },
                { status: 500 }
            )
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
        const client = hasServiceKey ? supabaseAdmin : supabase
        const { data: callerRow } = await client.from('profiles').select('role').eq('id', user.id).single()
        const isAdmin = callerRow && ['ADMIN', 'admin', 'SUPER_ADMIN', 'super_admin', 'owner'].includes(callerRow.role)
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
        const client = hasServiceKey ? supabaseAdmin : supabase
        const { data: callerRow } = await client.from('profiles').select('role').eq('id', user.id).single()
        const isAdmin = callerRow && ['ADMIN', 'admin', 'SUPER_ADMIN', 'super_admin', 'owner'].includes(callerRow.role)
        if (!isAdmin) return NextResponse.json({ error: 'Apenas administradores podem desativar usuários' }, { status: 403 })
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
        // Prevent self-deactivation
        if (id === user.id) return NextResponse.json({ error: 'Não é possível desativar o próprio usuário' }, { status: 400 })
        if (!hasServiceKey) {
            return NextResponse.json({ error: 'Operação requer chave de serviço. Verifique as variáveis de ambiente do servidor.' }, { status: 500 })
        }
        // Soft-delete: ban user via auth admin API
        const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            ban_duration: '876000h' // effectively permanent
        })
        if (banError) {
            return NextResponse.json({ error: `Erro ao desativar: ${banError.message}` }, { status: 500 })
        }
        // Also update profiles.is_active
        await supabaseAdmin.from('profiles').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id)
        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno' }, { status: 500 })
    }
}
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        // Check admin
        const client = hasServiceKey ? supabaseAdmin : supabase
        const { data: callerRow } = await client.from('profiles').select('role').eq('id', user.id).single()
        const isAdmin = callerRow && ['ADMIN', 'admin', 'SUPER_ADMIN', 'super_admin', 'owner'].includes(callerRow.role)
        if (!isAdmin) return NextResponse.json({ error: 'Apenas administradores' }, { status: 403 })

        const body = await request.json()
        const { id, action } = body
        if (!id || action !== 'reset_password') {
            return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
        }
        if (!hasServiceKey) {
            return NextResponse.json({ error: 'Service role key não configurada' }, { status: 500 })
        }

        // Look up user email
        const { data: profile } = await supabaseAdmin.from('profiles').select('email, name').eq('id', id).single()
        if (!profile?.email) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        // Generate recovery link — Supabase sends the email automatically
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br'
        const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: profile.email,
            options: { redirectTo: `${siteUrl}/login?reset=true` },
        })
        if (linkError) {
            return NextResponse.json({ error: `Erro ao gerar link: ${linkError.message}` }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: `Link de recuperação enviado para ${profile.email}`,
        })
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

        const client = hasServiceKey ? supabaseAdmin : supabase
        const { data, error } = await client
            .from('profiles')
            .select('id, email, name, role, avatar_url, phone, is_active, created_at, updated_at')
            .order('created_at', { ascending: false })
        if (error) throw error

        // Merge ban status from auth.users so the UI can show banned users as inactive
        let users = data || []
        if (hasServiceKey) {
            try {
                const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 })
                if (authUsers) {
                    const banMap: Record<string, boolean> = {}
                    for (const au of authUsers) {
                        if (au.banned_until && new Date(au.banned_until) > new Date()) {
                            banMap[au.id] = true
                        }
                    }
                    users = users.map(u => ({
                        ...u,
                        is_active: banMap[u.id] ? false : (u.is_active !== false),
                    }))
                }
            } catch {
                // Non-critical: if auth.users lookup fails, use profiles.is_active as-is
            }
        }
        return NextResponse.json({ users })
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
}
