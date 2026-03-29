import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUpsLifecycleFields1763500000000 implements MigrationInterface {
  name = 'AddUpsLifecycleFields1763500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "assets"
        ADD COLUMN IF NOT EXISTS "asset_subtype" character varying(50),
        ADD COLUMN IF NOT EXISTS "expected_end_of_life" date,
        ADD COLUMN IF NOT EXISTS "maintenance_provider" character varying,
        ADD COLUMN IF NOT EXISTS "maintenance_frequency_months" integer,
        ADD COLUMN IF NOT EXISTS "last_maintenance_date" date,
        ADD COLUMN IF NOT EXISTS "next_maintenance_date" date,
        ADD COLUMN IF NOT EXISTS "maintenance_contract_end" date,
        ADD COLUMN IF NOT EXISTS "battery_install_date" date,
        ADD COLUMN IF NOT EXISTS "battery_replacement_due" date,
        ADD COLUMN IF NOT EXISTS "load_capacity_kva" decimal(10,2),
        ADD COLUMN IF NOT EXISTS "runtime_minutes" integer,
        ADD COLUMN IF NOT EXISTS "protected_systems" text
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_assets_tenant_subtype" ON "assets" ("tenant_id", "asset_subtype")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_assets_tenant_subtype"`);
    await queryRunner.query(`
      ALTER TABLE "assets"
        DROP COLUMN IF EXISTS "protected_systems",
        DROP COLUMN IF EXISTS "runtime_minutes",
        DROP COLUMN IF EXISTS "load_capacity_kva",
        DROP COLUMN IF EXISTS "battery_replacement_due",
        DROP COLUMN IF EXISTS "battery_install_date",
        DROP COLUMN IF EXISTS "maintenance_contract_end",
        DROP COLUMN IF EXISTS "next_maintenance_date",
        DROP COLUMN IF EXISTS "last_maintenance_date",
        DROP COLUMN IF EXISTS "maintenance_frequency_months",
        DROP COLUMN IF EXISTS "maintenance_provider",
        DROP COLUMN IF EXISTS "expected_end_of_life",
        DROP COLUMN IF EXISTS "asset_subtype"
    `);
  }
}
