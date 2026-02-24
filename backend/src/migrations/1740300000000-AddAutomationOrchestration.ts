import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAutomationOrchestration1740300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "automation_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "automationType" character varying(100) NOT NULL,
        "sourceType" character varying(80) NOT NULL,
        "sourceId" character varying(120) NOT NULL,
        "targetType" character varying(80) NOT NULL,
        "targetId" character varying(120),
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "lastEvaluatedAt" TIMESTAMP,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_automation_links" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_automation_link_scope" UNIQUE ("tenantId", "automationType", "sourceType", "sourceId", "targetType")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "automation_runs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid,
        "trigger" character varying(20) NOT NULL DEFAULT 'scheduled',
        "status" character varying(20) NOT NULL DEFAULT 'running',
        "startedAt" TIMESTAMP NOT NULL,
        "completedAt" TIMESTAMP,
        "processedCount" integer NOT NULL DEFAULT 0,
        "createdCount" integer NOT NULL DEFAULT 0,
        "updatedCount" integer NOT NULL DEFAULT 0,
        "skippedCount" integer NOT NULL DEFAULT 0,
        "errorCount" integer NOT NULL DEFAULT 0,
        "details" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_automation_runs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_automation_links_tenant" ON "automation_links" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_automation_links_type" ON "automation_links" ("automationType")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_automation_links_target" ON "automation_links" ("targetType")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_automation_links_last" ON "automation_links" ("lastEvaluatedAt")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_automation_runs_tenant" ON "automation_runs" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_automation_runs_started" ON "automation_runs" ("startedAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_automation_runs_status" ON "automation_runs" ("status")`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_automation_links_tenant') THEN
          ALTER TABLE "automation_links"
          ADD CONSTRAINT "FK_automation_links_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_automation_runs_tenant') THEN
          ALTER TABLE "automation_runs"
          ADD CONSTRAINT "FK_automation_runs_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS "automation_runs" DROP CONSTRAINT IF EXISTS "FK_automation_runs_tenant"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "automation_links" DROP CONSTRAINT IF EXISTS "FK_automation_links_tenant"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_automation_runs_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_automation_runs_started"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_automation_runs_tenant"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_automation_links_last"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_automation_links_target"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_automation_links_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_automation_links_tenant"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "automation_runs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "automation_links"`);
  }
}
