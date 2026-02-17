/**
 * One-time seed: creates demo tenant and ICT Manager user.
 * Run: npx ts-node -r tsconfig-paths/register scripts/seed.ts
 * Or: pnpm exec ts-node scripts/seed.ts (from apps/api)
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://iictms:iictms_dev_secret@localhost:5432/iictms',
  entities: [],
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();
  const q = dataSource.query.bind(dataSource);

  const tenantRows = await q(
    `INSERT INTO tenants (id, slug, name, "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), 'demo', 'Demo Organisation', NOW(), NOW())
     ON CONFLICT (slug) DO NOTHING
     RETURNING id`
  );
  let tenantId: string;
  if (tenantRows.length > 0) {
    tenantId = tenantRows[0].id;
    console.log('Created tenant demo');
  } else {
    const existing = await q(`SELECT id FROM tenants WHERE slug = 'demo'`);
    tenantId = existing[0].id;
    console.log('Tenant demo already exists');
  }

  const passwordHash = await bcrypt.hash('Password1', 12);
  await q(
    `INSERT INTO users (id, tenant_id, email, "passwordHash", "fullName", role, active, "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), $1, 'admin@demo.local', $2, 'ICT Manager', 'ict_manager', true, NOW(), NOW())
     ON CONFLICT ON CONSTRAINT "UQ_users_tenant_email" DO NOTHING`,
    [tenantId, passwordHash]
  );
  console.log('User admin@demo.local created (password: Password1)');
  await dataSource.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
