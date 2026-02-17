/**
 * Seed demo tenant + ICT Manager user.
 * Run from backend folder: node scripts/seed.js
 * Requires: PostgreSQL running, migrations already run, .env with DATABASE_URL
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://root:root@localhost:5432/iictms';

async function seed() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  const tenantResult = await client.query(
    `INSERT INTO tenants (id, slug, name, "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), 'demo', 'Demo Organisation', NOW(), NOW())
     ON CONFLICT (slug) DO NOTHING
     RETURNING id`
  );

  let tenantId;
  if (tenantResult.rows.length > 0) {
    tenantId = tenantResult.rows[0].id;
    console.log('Created tenant: demo');
  } else {
    const existing = await client.query(`SELECT id FROM tenants WHERE slug = 'demo'`);
    tenantId = existing.rows[0].id;
    console.log('Tenant demo already exists');
  }

  const passwordHash = await bcrypt.hash('Password1', 12);
  await client.query(
    `INSERT INTO users (id, tenant_id, email, "passwordHash", "fullName", role, active, "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, true, NOW(), NOW())
     ON CONFLICT ON CONSTRAINT "UQ_users_tenant_email" DO NOTHING`,
    [tenantId, 'admin@demo.local', passwordHash, 'ICT Manager', 'ict_manager']
  );
  console.log('User created (or already exists): admin@demo.local');

  await client.end();
  console.log('\n--- Use these to sign in ---');
  console.log('Tenant (slug):  demo');
  console.log('Email:          admin@demo.local');
  console.log('Password:       Password1');
  console.log('----------------------------\n');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
