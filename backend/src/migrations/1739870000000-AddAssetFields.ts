import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssetFields1739870000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "assets"
        ADD COLUMN IF NOT EXISTS "assigned_to_name" character varying,
        ADD COLUMN IF NOT EXISTS "supplier" character varying,
        ADD COLUMN IF NOT EXISTS "po_number" character varying,
        ADD COLUMN IF NOT EXISTS "ip_address" character varying,
        ADD COLUMN IF NOT EXISTS "condition" character varying(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "assets"
        DROP COLUMN IF EXISTS "assigned_to_name",
        DROP COLUMN IF EXISTS "supplier",
        DROP COLUMN IF EXISTS "po_number",
        DROP COLUMN IF EXISTS "ip_address",
        DROP COLUMN IF EXISTS "condition"
    `);
  }
}
