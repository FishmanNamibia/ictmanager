require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://root:root@localhost:5432/iictms';

async function apply() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  console.log('Applying policy categories table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS policy_categories (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      tenant_id uuid NOT NULL,
      name character varying(150) NOT NULL,
      slug character varying(150),
      description text,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT PK_policy_categories PRIMARY KEY (id)
    )
  `);

  console.log('Applying policy acknowledgements table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS policy_acknowledgements (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      tenant_id uuid NOT NULL,
      policy_id uuid NOT NULL,
      user_id uuid NOT NULL,
      acknowledged_at TIMESTAMP NOT NULL DEFAULT now(),
      ip_address character varying,
      user_agent character varying,
      CONSTRAINT PK_policy_ack PRIMARY KEY (id)
    )
  `);

  console.log('Altering policies table for new columns...');
  await client.query('ALTER TABLE policies ADD COLUMN IF NOT EXISTS category_id uuid');
  await client.query('ALTER TABLE policies ADD COLUMN IF NOT EXISTS approval_authority character varying(255)');
  await client.query('ALTER TABLE policies ADD COLUMN IF NOT EXISTS version character varying(50)');
  await client.query('ALTER TABLE policies ADD COLUMN IF NOT EXISTS approval_date date');
  await client.query('ALTER TABLE policies ADD COLUMN IF NOT EXISTS effective_date date');
  await client.query('ALTER TABLE policies ADD COLUMN IF NOT EXISTS review_frequency character varying(50)');
  await client.query('ALTER TABLE policies ADD COLUMN IF NOT EXISTS risk_level character varying(10)');
  await client.query('ALTER TABLE policies ADD COLUMN IF NOT EXISTS attachments jsonb');

  await client.query('CREATE INDEX IF NOT EXISTS IDX_policy_category ON policies (category_id)');
  await client.query('CREATE INDEX IF NOT EXISTS IDX_policy_next_review ON policies (next_review_due)');

  try {
    await client.query('ALTER TABLE policies ADD CONSTRAINT FK_policies_category FOREIGN KEY (category_id) REFERENCES policy_categories(id) ON DELETE SET NULL');
  } catch (e) {
    // ignore if already exists
  }

  try {
    await client.query('ALTER TABLE policy_acknowledgements ADD CONSTRAINT FK_ack_policy FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE');
  } catch (e) {
    // ignore if already exists
  }

  console.log('Migration applied.');
  await client.end();
}

apply().catch((e) => {
  console.error(e);
  process.exit(1);
});
