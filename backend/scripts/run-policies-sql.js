require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://root:root@localhost:5432/iictms';

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const sql = fs.readFileSync(path.resolve(__dirname, 'policies-migration.sql'), 'utf8');
  console.log('Running policies SQL...');
  await client.query(sql);
  console.log('Policies table created (if not existed).');
  await client.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
