import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
export const dynamic = 'force-dynamic'

const hasServiceKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY)

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getCallerProfile(userId: string) {
    const client = hasServiceKey ? supabaseAdmin : await createClient()
    const { data } = await client.from('profiles').select('role').eq('id', userId).single()
    return data
}

function isAdminRole(role: string | null | undefined): boolean {
    if (!role) return false
    return ['admin', 'ADMIN', 'super_admin', 'SUPER_ADMIN', 'owner', 'OWNER'].includes(role)
}

// ── POST — Create user ────────────────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const callerProfile = await getCallerProfile(user.id)
        if (!isAdminRole(callerProfile?.role)) {
            return NextResponse.json({ error: 'Apenas administradores podem criar usuários' }, { status: 403 })
        }

        if (!hasServiceKey) {
            return NextResponse.json(
                { error: 'Criação de usuários requer a chave de serviço do Supabase (SUPABASE_SERVICE_ROLE_KEY). Verifique as variáveis de ambiente.' },
                { status: 500 }
            )
        }

        const body = await request.json()
        const { email, name, role } = body
        if (!email || !name) {
            return NextResponse.json({ error: 'Email e nome são obrigatórios' }, { status: 400 })
        }

        const tempPassword = crypto.randomUUID().slice(0, 12) + 'A1!'
        const validRole = role || 'CORRETOR'

        // Check if user already exists by email in profiles
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle()

        if (existingProfile) {
            const existingId = existingProfile.id
            await supabaseAdmin.from('profiles').upsert({
                id: existingId, email, name, role: validRole.toLowerCase(), is_active: true,
                updated_at: new Date().toISOString(),
            })
            const { data: existingBroker } = await supabaseAdmin
                .from('brokers').select('id').eq('email', email).maybeSingle()
            const brokerPayload = {
                user_id: existingId, name, status: 'active',
                role: validRole.toLowerCase() === 'admin' ? 'broker_manager' : 'broker',
                permissions: ['dashboard', 'imoveis', 'leads', 'agenda', 'avaliacoes', 'financeiro', 'contratos'],
                updated_at: new Date().toISOString(),
            }
            if (existingBroker) {
                await supabaseAdmin.from('brokers').update(brokerPayload).eq('id', existingBroker.id)
            } else {
                await supabaseAdmin.from('brokers').insert({ ...brokerPayload, email, created_at: new Date().toISOString() })
            }
            return NextResponse.json({
                success: true,
                user: { id: existingId, email, name, role: validRole },
                message: `Usuário ${email} já existia — perfil atualizado com sucesso.`,
            })
        }

        // Create new auth user
        const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { name, role: validRole },
        })

        if (createError) {
            const msg = createError.message

            if (msg.includes('already been registered') || msg.includes('already exists')) {
                return NextResponse.json({ error: `O email ${email} já está cadastrado no sistema.` }, { status: 409 })
            }

            // "Database error creating new user" = trigger on auth.users failing.
            // The migration 20260409_fix_user_creation_and_profiles.sql fixes this by adding
            // EXCEPTION handling to handle_new_user(). If the migration hasn't been applied yet,
            // retry without user_metadata (reduced trigger payload).
            if (msg.includes('Database error') || msg.includes('database error')) {
                console.error('[backoffice/users] Database error on createUser — trigger may not be fixed yet. Retrying...', msg)

                const { data: retryUser, error: retryError } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password: tempPassword,
                    email_confirm: true,
                    // No user_metadata — minimises trigger workload
                })

                if (retryError) {
                    console.error('[backoffice/users] Retry also failed:', retryError.message)
                    return NextResponse.json(
                        {
                            error: 'Erro no banco de dados ao criar usuário. Execute a migration 20260409_fix_user_creation_and_profiles.sql no Supabase para corrigir o trigger handle_new_user.',
                            detail: retryError.message,
                        },
                        { status: 500 }
                    )
                }

                const newUserId = retryUser.user.id
                await supabaseAdmin.auth.admin.updateUserById(newUserId, {
                    user_metadata: { name, role: validRole },
                }).catch(() => {})
                await syncProfileAndBroker(newUserId, email, name, validRole)
                await sendRecoveryEmail(email)
                return NextResponse.json({
                    success: true,
                    user: { id: newUserId, email, name, role: validRole },
                    message: `Convite enviado para ${email}. O usuário receberá um link para definir sua senha.`,
                })
            }

            return NextResponse.json({ error: `Erro ao criar usuário: ${msg}` }, { status: 500 })
        }

        const newUserId = authUser.user.id
        await syncProfileAndBroker(newUserId, email, name, validRole)
        await sendRecoveryEmail(email)

        return NextResponse.json({
            success: true,
            user: { id: newUserId, email, name, role: validRole },
            message: `Convite enviado para ${email}. O usuário receberá um link para definir sua senha.`,
        })
    } catch (error: unknown) {
        console.error('[backoffice/users POST]', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erro interno no servidor' },
            { status: 500 }
        )
    }
}

async function syncProfileAndBroker(userId: string, email: string, name: string, role: string) {
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({ id: userId, email, name, role: role.toLowerCase(), is_active: true, updated_at: new Date().toISOString() })
    if (profileError) console.error('[backoffice/users] Profile sync error:', profileError.message)

    const { data: existingBroker } = await supabaseAdmin
        .from('brokers').select('id').eq('email', email).maybeSingle()
    const brokerPayload = {
        user_id: userId, name, email, status: 'active',
        role: role.toLowerCase() === 'admin' ? 'broker_manager' : 'broker',
        permissions: ['dashboard', 'imoveis', 'leads', 'agenda', 'avaliacoes', 'financeiro', 'contratos'],
        updated_at: new Date().toISOString(),
    }
    if (existingBroker) {
        const { error: brokerError } = await supabaseAdmin.from('brokers').update(brokerPayload).eq('id', existingBroker.id)
        if (brokerError) console.error('[backoffice/users] Broker update error:', brokerError.message)
    } else {
        const { error: brokerError } = await supabaseAdmin.from('brokers').insert({ ...brokerPayload, created_at: new Date().toISOString() })
        if (brokerError) console.error('[backoffice/users] Broker insert error:', brokerError.message)
    }
}

async function sendRecoveryEmail(email: string) {
    await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br'}/login?reset=true`,
        },
    }).catch(() => { /* non-critical */ })
}

// ── PUT — Edit user (name / role) ─────────────────────────────────────────────

export async function PUT(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const callerProfile = await getCallerProfile(user.id)
        if (!isAdminRole(callerProfile?.role)) {
            return NextResponse.json({ error: 'Apenas administradores podem editar usuários' }, { status: 403 })
        }

        const body = await request.json()
        const { id, name, role, is_active } = body
        if (!id) return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })

        const client = hasServiceKey ? supabaseAdmin : supabase
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (name !== undefined) updates.name = name
        if (role !== undefined) updates.role = role
        if (is_active !== undefined) updates.is_active = is_active

        await client.from('profiles').update(updates).eq('id', id)

        // Sync ban/unban in auth
        if (is_active !== undefined && hasServiceKey) {
            await supabaseAdmin.auth.admin.updateUserById(id, {
                ban_duration: is_active ? 'none' : '876000h',
            })
        }

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno' }, { status: 500 })
    }
}

// ── DELETE — Deactivate (soft) or permanently delete (hard) user ──────────────
//
// Soft delete:  DELETE /api/backoffice/users?id=xxx
// Hard delete:  DELETE /api/backoffice/users?id=xxx&action=delete

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const callerProfile = await getCallerProfile(user.id)
        if (!isAdminRole(callerProfile?.role)) {
            return NextResponse.json({ error: 'Apenas administradores podem remover usuários' }, { status: 403 })
        }

        if (!hasServiceKey) {
            return NextResponse.json({ error: 'Operação requer chave de serviço. Verifique as variáveis de ambiente.' }, { status: 500 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const action = searchParams.get('action') // 'delete' = hard delete, absent = soft deactivate

        if (!id) return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
        if (id === user.id) return NextResponse.json({ error: 'Não é possível remover o próprio usuário' }, { status: 400 })

        if (action === 'delete') {
            // Hard delete — permanently remove from auth.users (cascades to profiles + brokers)
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id)
            if (deleteError) {
                return NextResponse.json({ error: `Erro ao excluir usuário: ${deleteError.message}` }, { status: 500 })
            }
            // Cleanup brokers in case FK cascade didn't cover it
            await supabaseAdmin.from('brokers').delete().eq('user_id', id).catch(() => {})
            return NextResponse.json({ success: true, message: 'Usuário excluído permanentemente.' })
        }

        // Soft delete — ban user so they can't log in, but data is preserved
        const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            ban_duration: '876000h', // ~100 years
        })
        if (banError) {
            return NextResponse.json({ error: `Erro ao desativar: ${banError.message}` }, { status: 500 })
        }
        await supabaseAdmin.from('profiles').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id)

        return NextResponse.json({ success: true, message: 'Usuário desativado com sucesso.' })
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno' }, { status: 500 })
    }
}

// ── PATCH — Reset password ────────────────────────────────────────────────────

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const callerProfile = await getCallerProfile(user.id)
        if (!isAdminRole(callerProfile?.role)) {
            return NextResponse.json({ error: 'Apenas administradores podem resetar senhas' }, { status: 403 })
        }

        const body = await request.json()
        const { id, action } = body
        if (!id || action !== 'reset_password') {
            return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
        }

        if (!hasServiceKey) {
            return NextResponse.json({ error: 'Service role key não configurada' }, { status: 500 })
        }

        const { data: profile } = await supabaseAdmin.from('profiles').select('email, name').eq('id', id).single()
        if (!profile?.email) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

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

// ── GET — List users ──────────────────────────────────────────────────────────

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Self-heal: ensure all auth.users have a corresponding profile row
        if (hasServiceKey) {
            try {
                const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 })
                if (authUsers) {
                    for (const au of authUsers) {
                        const { data: existing } = await supabaseAdmin
                            .from('profiles').select('id').eq('id', au.id).maybeSingle()
                        if (!existing) {
                            await supabaseAdmin.from('profiles').insert({
                                id: au.id,
                                email: au.email || '',
                                name: au.user_metadata?.name || au.user_metadata?.full_name || au.email?.split('@')[0] || 'Usuário',
                                role: au.user_metadata?.role || 'corretor',
                                avatar_url: au.user_metadata?.avatar_url || null,
                                phone: au.user_metadata?.phone || null,
                                is_active: true,
                                created_at: au.created_at,
                            }).catch(() => {})
                        }
                    }
                }
            } catch {
                // Non-critical
            }
        }

        const client = hasServiceKey ? supabaseAdmin : supabase
        const { data, error } = await client
            .from('profiles')
            .select('id, email, name, role, avatar_url, phone, is_active, created_at, updated_at')
            .order('created_at', { ascending: false })
        if (error) throw error

        // Merge real ban status from auth.users
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
                // Non-critical
            }
        }

        return NextResponse.json({ users })
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
}
