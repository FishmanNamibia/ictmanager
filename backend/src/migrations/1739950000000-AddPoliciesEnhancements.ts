import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPoliciesEnhancements1739950000000 implements MigrationInterface {
  name = 'AddPoliciesEnhancements1739950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Base policies table used by this module.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "policies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "policy_type" character varying(50) NOT NULL DEFAULT 'other',
        "status" character varying(20) NOT NULL DEFAULT 'draft',
        "responsible_owner" character varying,
        "last_review_date" date,
        "next_review_due" date,
        "document_url" character varying,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_policies" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_policies_tenant" ON "policies" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_policies_tenant_status" ON "policies" ("tenant_id", "status")`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_policies_tenant') THEN
          ALTER TABLE "policies"
          ADD CONSTRAINT "FK_policies_tenant"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "policy_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "slug" character varying(150),
        "description" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_policy_categories" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "policy_acknowledgements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "policy_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "acknowledged_at" TIMESTAMP NOT NULL DEFAULT now(),
        "ip_address" character varying,
        "user_agent" character varying,
        CONSTRAINT "PK_policy_ack" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "category_id" uuid`);
    await queryRunner.query(`ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "approval_authority" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "version" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "approval_date" date`);
    await queryRunner.query(`ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "effective_date" date`);
    await queryRunner.query(`ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "review_frequency" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "risk_level" character varying(10)`);
    await queryRunner.query(`ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "attachments" jsonb`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_policy_category" ON "policies" ("category_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_policy_next_review" ON "policies" ("next_review_due")`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_policies_category') THEN
          ALTER TABLE "policies"
          ADD CONSTRAINT "FK_policies_category"
          FOREIGN KEY ("category_id") REFERENCES "policy_categories"("id") ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ack_policy') THEN
          ALTER TABLE "policy_acknowledgements"
          ADD CONSTRAINT "FK_ack_policy"
          FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "policy_acknowledgements" DROP CONSTRAINT IF EXISTS "FK_ack_policy"`);
    await queryRunner.query(`ALTER TABLE "policies" DROP CONSTRAINT IF EXISTS "FK_policies_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policy_next_review"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policy_category"`);
    await queryRunner.query(`ALTER TABLE "policies" DROP COLUMN IF EXISTS "attachments"`);
    await queryRunner.query(`ALTER TABLE "policies" DROP COLUMN IF EXISTS "risk_level"`);
    await queryRunner.query(`ALTER TABLE "policies" DROP COLUMN IF EXISTS "review_frequency"`);
    await queryRunner.query(`ALTER TABLE "policies" DROP COLUMN IF EXISTS "effective_date"`);
    await queryRunner.query(`ALTER TABLE "policies" DROP COLUMN IF EXISTS "approval_date"`);
    await queryRunner.query(`ALTER TABLE "policies" DROP COLUMN IF EXISTS "version"`);
    await queryRunner.query(`ALTER TABLE "policies" DROP COLUMN IF EXISTS "approval_authority"`);
    await queryRunner.query(`ALTER TABLE "policies" DROP COLUMN IF EXISTS "category_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "policy_acknowledgements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "policy_categories"`);
  }
}
