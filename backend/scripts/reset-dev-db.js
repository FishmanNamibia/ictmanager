/**
 * Dev-only DB reset: drops and recreates public schema.
 * Usage: node backend/scripts/reset-dev-db.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://root:root@localhost:5432/iictms';

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  await client.query('DROP SCHEMA IF EXISTS public CASCADE');
  await client.query('CREATE SCHEMA public');
  await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await client.end();
  console.log('Database schema reset complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
