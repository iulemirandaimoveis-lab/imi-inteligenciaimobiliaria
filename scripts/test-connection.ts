
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import chalk from 'chalk'

const supabase = createClient()

async function testConnection() {
    console.log(chalk.blue('🔍 Iniciando teste de conexão com Supabase...'))

    try {
        const start = Date.now()
        const { data, error, count } = await supabase
            .from('developments')
            .select('*', { count: 'exact', head: true })

        const duration = Date.now() - start

        if (error) {
            console.error(chalk.red('❌ Falha na conexão:'), error.message)
            console.error(chalk.yellow('Detalhes:'), error)
            return false
        }

        console.log(chalk.green('✅ Conexão estabelecida com sucesso!'))
        console.log(`⏱️  Latência: ${duration}ms`)
        console.log(`📊 Total de empreendimentos encontrados: ${count}`)

        return true

    } catch (err: any) {
        console.error(chalk.red('❌ Erro inesperado:'), err.message)
        return false
    }
}

testConnection()
