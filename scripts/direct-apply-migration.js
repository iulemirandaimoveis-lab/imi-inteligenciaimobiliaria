require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
    console.error('❌ DIRECT_URL não encontrada no .env.local');
    process.exit(1);
}

async function runMigration(filename) {
    console.log(`\n📦 Aplicando ${filename} via Direct Postgres Connection...`);
    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
    const sql = fs.readFileSync(filePath, 'utf-8');

    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();

        // Split por ; mas ignorando aspas
        // Para simplificar, vamos tentar rodar o bloco todo se não for gigante
        // Ou split básico e lidar com erros

        await client.query(sql);
        console.log(`✅ ${filename} aplicado com sucesso!`);
    } catch (err) {
        console.error(`❌ Erro ao aplicar ${filename}:`, err.message);
        // Se houver erro de "already exists", podemos ignorar dependendo do caso
    } finally {
        await client.end();
    }
}

async function main() {
    const migrations = [
        '004_multi_tenant_core.sql',
        '005_content_management.sql',
        'FIX_RLS_RECURSION_FINAL.sql',
        '024_contratos.sql'
    ];

    for (const m of migrations) {
        await runMigration(m);
    }
}

main();
