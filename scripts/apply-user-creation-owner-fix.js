require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  console.error('❌ DIRECT_URL não encontrada no ambiente (.env.local/.env).');
  process.exit(1);
}

async function main() {
  const migrationFile = path.join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '20260428_fix_user_creation_and_iule_access.sql'
  );

  const sql = fs.readFileSync(migrationFile, 'utf-8');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('🚀 Aplicando migração 20260428_fix_user_creation_and_iule_access.sql...');
    await client.query(sql);
    console.log('✅ Migração aplicada com sucesso.');
  } catch (error) {
    console.error('❌ Falha ao aplicar migração:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
