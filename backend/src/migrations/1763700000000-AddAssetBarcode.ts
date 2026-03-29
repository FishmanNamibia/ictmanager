import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssetBarcode1763700000000 implements MigrationInterface {
  name = 'AddAssetBarcode1763700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "assets"
        ADD COLUMN IF NOT EXISTS "barcode" character varying
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_assets_tenant_barcode"
      ON "assets" ("tenant_id", "barcode")
      WHERE "barcode" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_assets_tenant_barcode"`);
    await queryRunner.query(`
      ALTER TABLE "assets"
        DROP COLUMN IF EXISTS "barcode"
    `);
  }
}
