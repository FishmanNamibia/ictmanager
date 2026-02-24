import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataGovernanceSchema1740100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "data_assets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "assetType" character varying(50) NOT NULL,
        "classification" character varying(50) NOT NULL,
        "owner" character varying(255),
        "steward" character varying(255),
        "recordCount" integer NOT NULL DEFAULT 0,
        "location" character varying(500),
        "dataElements" text,
        "lastAccessDate" TIMESTAMP,
        "accessCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_data_assets" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "data_processing_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "dataAssets" character varying(500),
        "purpose" character varying(255) NOT NULL,
        "processor" character varying(255),
        "recipients" character varying(500),
        "consentStatus" character varying(50) NOT NULL DEFAULT 'obtained',
        "affectedDataSubjects" integer,
        "securityMeasures" text,
        "retentionUntil" TIMESTAMP,
        "dpia" boolean NOT NULL DEFAULT false,
        "dpiaDate" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_data_processing_records" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "data_quality_metrics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "dataAssetName" character varying(255) NOT NULL,
        "dimension" character varying(100) NOT NULL,
        "score" double precision NOT NULL DEFAULT 0,
        "findings" text,
        "remediation" text,
        "nextReviewDate" TIMESTAMP,
        "reviewer" character varying(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_data_quality_metrics" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_data_assets_tenant" ON "data_assets" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_data_assets_type" ON "data_assets" ("assetType")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_data_assets_class" ON "data_assets" ("classification")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_data_processing_tenant" ON "data_processing_records" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_data_processing_consent" ON "data_processing_records" ("consentStatus")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_data_quality_tenant" ON "data_quality_metrics" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_data_quality_dimension" ON "data_quality_metrics" ("dimension")`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_data_assets_tenant') THEN
          ALTER TABLE "data_assets"
          ADD CONSTRAINT "FK_data_assets_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_data_processing_tenant') THEN
          ALTER TABLE "data_processing_records"
          ADD CONSTRAINT "FK_data_processing_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_data_quality_tenant') THEN
          ALTER TABLE "data_quality_metrics"
          ADD CONSTRAINT "FK_data_quality_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS "data_quality_metrics" DROP CONSTRAINT IF EXISTS "FK_data_quality_tenant"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "data_processing_records" DROP CONSTRAINT IF EXISTS "FK_data_processing_tenant"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "data_assets" DROP CONSTRAINT IF EXISTS "FK_data_assets_tenant"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_data_quality_dimension"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_data_quality_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_data_processing_consent"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_data_processing_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_data_assets_class"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_data_assets_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_data_assets_tenant"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "data_quality_metrics"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "data_processing_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "data_assets"`);
  }
}
