import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOwnerSubscriptionFields1763800000000 implements MigrationInterface {
  name = 'AddOwnerSubscriptionFields1763800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
        ADD COLUMN IF NOT EXISTS "plan" varchar(50) NOT NULL DEFAULT 'trial',
        ADD COLUMN IF NOT EXISTS "subscription_status" varchar(50) NOT NULL DEFAULT 'trial',
        ADD COLUMN IF NOT EXISTS "subscription_expires_at" timestamp NULL,
        ADD COLUMN IF NOT EXISTS "max_users" integer NULL,
        ADD COLUMN IF NOT EXISTS "billing_email" varchar NULL,
        ADD COLUMN IF NOT EXISTS "contact_name" varchar NULL,
        ADD COLUMN IF NOT EXISTS "notes" text NULL,
        ADD COLUMN IF NOT EXISTS "is_system_tenant" boolean NOT NULL DEFAULT false
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
        DROP COLUMN IF EXISTS "plan",
        DROP COLUMN IF EXISTS "subscription_status",
        DROP COLUMN IF EXISTS "subscription_expires_at",
        DROP COLUMN IF EXISTS "max_users",
        DROP COLUMN IF EXISTS "billing_email",
        DROP COLUMN IF EXISTS "contact_name",
        DROP COLUMN IF EXISTS "notes",
        DROP COLUMN IF EXISTS "is_system_tenant"
    `);
  }
}
