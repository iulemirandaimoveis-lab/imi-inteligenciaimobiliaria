/**
 * Uso:
 *   npx ts-node scripts/reset-user-password.ts
 *
 * Requer .env.local com:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Operações realizadas:
 *   1. iule@imi.com → nova senha Imi@2026@ + encerramento de sessões
 *   2. teste@imi.com → criar (ou garantir) com senha abc123 e role viewer
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
})

async function resetPassword(email: string, newPassword: string) {
    console.log(`\n[1] Redefinindo senha de ${email}...`)

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (listError) { console.error('  Erro ao listar usuarios:', listError.message); return }

    const user = users.find(u => u.email === email)
    if (!user) { console.error(`  Usuario ${email} nao encontrado.`); return }

    console.log(`  ID: ${user.id}`)

    const { error: pwError } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })
    if (pwError) { console.error('  Erro ao atualizar senha:', pwError.message); return }
    console.log('  Senha atualizada.')

    const { error: signOutError } = await supabase.auth.admin.signOut(user.id, 'global')
    if (signOutError) {
        console.warn('  Aviso: nao foi possivel encerrar sessoes via API:', signOutError.message)
    } else {
        console.log('  Sessoes encerradas (global).')
    }

    await supabase.from('profiles').update({ must_reset_password: false, updated_at: new Date().toISOString() }).eq('id', user.id)
    console.log(`  OK — ${email} deve usar a nova senha no proximo login.`)
}

async function createViewerUser(email: string, password: string, name: string) {
    console.log(`\n[2] Garantindo usuario viewer: ${email}...`)

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (listError) { console.error('  Erro ao listar usuarios:', listError.message); return }

    const existing = users.find(u => u.email === email)

    if (existing) {
        console.log(`  Usuario ja existe (ID: ${existing.id}). Atualizando senha e role...`)
        await supabase.auth.admin.updateUserById(existing.id, {
            password,
            user_metadata: { ...existing.user_metadata, role: 'viewer', name },
        })
        await supabase.from('profiles').update({ role: 'viewer', is_active: true, updated_at: new Date().toISOString() }).eq('id', existing.id)
        console.log(`  OK — ${email} role=viewer confirmado.`)
        return
    }

    const { data, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: 'viewer' },
    })

    if (createError) { console.error('  Erro ao criar usuario:', createError.message); return }

    const userId = data.user.id
    console.log(`  Usuario criado (ID: ${userId}).`)

    // Garante perfil com role viewer (o trigger handle_new_user ja cria, mas reforçamos)
    await supabase.from('profiles').upsert({
        id: userId,
        email,
        name,
        role: 'viewer',
        is_active: true,
        must_reset_password: false,
    }, { onConflict: 'id' })

    console.log(`  OK — ${email} criado com role=viewer.`)
}

async function main() {
    await resetPassword('iule@imi.com', 'Imi@2026@')
    await createViewerUser('teste@imi.com', 'abc123', 'Usuário Teste')

    console.log('\nConcluido.\n')
}

main()
