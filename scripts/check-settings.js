require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const res = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'settings'
    `);
    console.log(res.rows.map(r => r.column_name + ': ' + r.data_type).join('\n'));
    await client.end();
}
main().catch(console.error);
