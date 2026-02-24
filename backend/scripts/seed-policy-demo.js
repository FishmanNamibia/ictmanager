require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://root:root@localhost:5432/iictms';

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // find demo tenant
  const t = await client.query(`SELECT id FROM tenants WHERE slug = 'demo'`);
  if (!t.rows.length) throw new Error('demo tenant not found');
  const tenantId = t.rows[0].id;

  // create category if not exists
  const exists = await client.query(`SELECT id FROM policy_categories WHERE tenant_id=$1 AND name=$2`, [tenantId, 'Information Security']);
  let categoryId;
  if (exists.rows.length) {
    categoryId = exists.rows[0].id;
  } else {
    const ins = await client.query(`INSERT INTO policy_categories (id, tenant_id, name, slug, description, "createdAt") VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW()) RETURNING id`, [tenantId, 'Information Security', 'information-security', 'Policies for information security']);
    categoryId = ins.rows[0].id;
  }

  // create a staff user
  const staffEmail = 'staff1@demo.local';
  const pw = await bcrypt.hash('Password1', 12);
  await client.query(`INSERT INTO users (id, tenant_id, email, "passwordHash", "fullName", role, active, "createdAt", "updatedAt") VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, true, NOW(), NOW()) ON CONFLICT ON CONSTRAINT "UQ_users_tenant_email" DO NOTHING`, [tenantId, staffEmail, pw, 'Staff One', 'ict_staff']);

  // create two policies: one due today, one due in 30 days
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);
  const in30 = new Date(); in30.setDate(in30.getDate()+30);
  const in30Str = in30.toISOString().slice(0,10);

  await client.query(`INSERT INTO policies (id, tenant_id, title, policy_type, status, responsible_owner, last_review_date, next_review_due, document_url, notes, "createdAt", "updatedAt", category_id) VALUES (uuid_generate_v4(), $1, $2, 'security', 'approved', 'Business Owner', $3, $4, $5, $6, NOW(), NOW(), $7)`, [tenantId, 'Access Control Policy v1.0', todayStr, todayStr, 'https://example.local/policies/access-control.pdf', 'Initial import', categoryId]);

  await client.query(`INSERT INTO policies (id, tenant_id, title, policy_type, status, responsible_owner, last_review_date, next_review_due, document_url, notes, "createdAt", "updatedAt", category_id) VALUES (uuid_generate_v4(), $1, $2, 'security', 'approved', 'Business Owner', $3, $4, $5, $6, NOW(), NOW(), $7)`, [tenantId, 'Password & Authentication Policy v1.0', todayStr, in30Str, 'https://example.local/policies/password.pdf', 'Initial import', categoryId]);

  console.log('Seeded demo policies and staff user.');
  await client.end();
}

run().catch((e)=>{console.error(e); process.exit(1);});
