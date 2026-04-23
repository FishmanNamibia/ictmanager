/**
 * Seed script: creates the system tenant and owner account.
 * Run once after applying the AddOwnerSubscriptionFields migration.
 *
 *   node scripts/seed-owner.js
 *
 * Override credentials via env vars:
 *   OWNER_EMAIL=owner@example.com OWNER_PASSWORD=secret node scripts/seed-owner.js
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const DB_URL = process.env.DATABASE_URL || 'postgresql://root:root@localhost:5432/iictms';
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'owner@system.local';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'OwnerAdmin@2025';
const OWNER_FULL_NAME = process.env.OWNER_FULL_NAME || 'System Owner';

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    await client.query('BEGIN');

    // 1. Upsert the system tenant
    const tenantResult = await client.query(`
      INSERT INTO tenants (slug, name, active, is_system_tenant, plan, subscription_status)
      VALUES ('system', 'System', true, true, 'enterprise', 'active')
      ON CONFLICT (slug) DO UPDATE
        SET is_system_tenant = true,
            active = true
      RETURNING id, slug, name
    `);
    const tenant = tenantResult.rows[0];
    console.log(`✔ System tenant: ${tenant.name} (${tenant.id})`);

    // 2. Hash the password
    const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 12);

    // 3. Upsert the owner user
    const userResult = await client.query(`
      INSERT INTO users (tenant_id, email, "passwordHash", "fullName", role, active)
      VALUES ($1, $2, $3, $4, 'owner', true)
      ON CONFLICT (tenant_id, email) DO UPDATE
        SET "passwordHash" = EXCLUDED."passwordHash",
            "fullName"     = EXCLUDED."fullName",
            role          = 'owner',
            active        = true
      RETURNING id, email, role
    `, [tenant.id, OWNER_EMAIL, passwordHash, OWNER_FULL_NAME]);
    const user = userResult.rows[0];
    console.log(`✔ Owner user: ${user.email} (role: ${user.role})`);

    await client.query('COMMIT');
    console.log('\n✅ Owner seed complete.');
    console.log(`   Email   : ${OWNER_EMAIL}`);
    console.log(`   Password: ${OWNER_PASSWORD}`);
    console.log(`   Login at: http://localhost:3000/login  (tenant slug: system)`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
