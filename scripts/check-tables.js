require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function main() {
    console.log('Connecting to DB...', process.env.DIRECT_URL);
    const client = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const res = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
    `);
    console.log(res.rows.map(r => r.table_name).join('\n'));
    await client.end();
}
main().catch(console.error);
