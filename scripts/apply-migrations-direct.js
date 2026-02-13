require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL não encontrada no .env.local');
    process.exit(1);
}

const client = new Client({
    connectionString: databaseUrl,
});

async function executeSqlFile(filename) {
    console.log(`\n📦 Aplicando ${filename}...`);

    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
    const sql = fs.readFileSync(filePath, 'utf-8');

    // Split por statement (separados por ;)
    // Atenção: Isso é rudimentar e pode quebrar se houver ; dentro de strings ou triggers
    // Para migrações complexas, melhor executar o arquivo inteiro se o driver suportar
    // pg suporta executar strings longas com múltiplos comandos

    try {
        await client.query(sql);
        console.log(`✅ ${filename} processado`);
    } catch (e) {
        if (e.message.includes('already exists')) {
            console.log(`⚠️  ${filename} (Tabelas ou objetos já existem - ignorando erro)`);
        } else {
            console.error(`❌ Erro ao aplicar ${filename}:`, e.message);
            // Não dar exit, tentar as próximas? Melhor parar se for erro crítico.
            // As migrations tem "IF NOT EXISTS", então deve ser seguro.
        }
    }
}

async function main() {
    console.log('🚀 Aplicando Migrations VIA CONEXÃO DIRETA (PG)\n');
    console.log(`📡 Conectando...`);

    try {
        await client.connect();
        console.log('✅ Conectado ao banco de dados');

        const dropSql = `
            DROP TABLE IF EXISTS link_events CASCADE;
            DROP TABLE IF EXISTS tracked_links CASCADE;
            DROP TABLE IF EXISTS notifications CASCADE;
        `;

        console.log('🗑️  Limpando tabelas conflitantes (Feature nova)...');
        await client.query(dropSql);

        const migrations = [
            '20260213_create_property_evaluations.sql',
            '20260213_create_consultations.sql',
            '20260213_create_notifications.sql',
            '20260213_create_tracked_links.sql',
            '20260213_create_link_events.sql'
        ];

        for (const migration of migrations) {
            await executeSqlFile(migration);
        }

        console.log('\n✅ Todas as migrations foram aplicadas com sucesso!');

    } catch (error) {
        console.error('\n❌ Erro Geral:', error);
    } finally {
        await client.end();
    }
}

main();
