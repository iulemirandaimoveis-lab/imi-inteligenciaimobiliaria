import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Erro: variaveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorias.')
    console.error('Crie um arquivo .env.local com essas variaveis e tente novamente.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})

const TARGET_EMAIL = process.env.TARGET_EMAIL || 'iule@imi.com'
const NEW_PASSWORD = process.env.NEW_PASSWORD || 'Imi@2026@'

async function main() {
    console.log(`Redefinindo senha para: ${TARGET_EMAIL}`)

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })

    if (listError) {
        console.error('Erro ao listar usuarios:', listError.message)
        process.exit(1)
    }

    const user = users.find(u => u.email === TARGET_EMAIL)

    if (!user) {
        console.error(`Usuario nao encontrado: ${TARGET_EMAIL}`)
        process.exit(1)
    }

    console.log(`Usuario encontrado — ID: ${user.id}`)

    // 1. Atualiza a senha
    const { error: passwordError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: NEW_PASSWORD }
    )

    if (passwordError) {
        console.error('Erro ao atualizar senha:', passwordError.message)
        process.exit(1)
    }

    console.log('Senha atualizada com sucesso.')

    // 2. Encerra todas as sessoes ativas (sign out global)
    const { error: signOutError } = await supabase.auth.admin.signOut(user.id, 'global')

    if (signOutError) {
        console.warn('Aviso: nao foi possivel encerrar as sessoes:', signOutError.message)
    } else {
        console.log('Todas as sessoes encerradas.')
    }

    // 3. Garante que must_reset_password esta desativado (senha definitiva foi definida)
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            must_reset_password: false,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

    if (profileError) {
        console.warn('Aviso: erro ao atualizar perfil:', profileError.message)
    } else {
        console.log('Perfil atualizado.')
    }

    console.log('')
    console.log('Concluido.')
    console.log(`  Email : ${TARGET_EMAIL}`)
    console.log(`  Sessoes encerradas: sim`)
    console.log(`  Proximo login: usuario deve entrar com a nova senha.`)
}

main()
