import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIctProjectsSchema1740120000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ict_projects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "status" character varying(50) NOT NULL DEFAULT 'planning',
        "currentPhase" character varying(50) NOT NULL DEFAULT 'initiation',
        "projectManager" character varying(255),
        "sponsor" character varying(255),
        "startDate" TIMESTAMP NOT NULL,
        "plannedEndDate" TIMESTAMP,
        "actualEndDate" TIMESTAMP,
        "budget" character varying(500),
        "scope" character varying(500),
        "completionPercentage" integer NOT NULL DEFAULT 0,
        "objectives" text,
        "deliverables" text,
        "risks" text,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ict_projects" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_milestones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "projectId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "status" character varying(50) NOT NULL DEFAULT 'planned',
        "targetDate" TIMESTAMP NOT NULL,
        "completionDate" TIMESTAMP,
        "deliverable" character varying(500),
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_milestones" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ict_projects_tenant" ON "ict_projects" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ict_projects_status" ON "ict_projects" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ict_projects_phase" ON "ict_projects" ("currentPhase")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_project_milestones_project" ON "project_milestones" ("projectId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_project_milestones_status" ON "project_milestones" ("status")`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ict_projects_tenant') THEN
          ALTER TABLE "ict_projects"
          ADD CONSTRAINT "FK_ict_projects_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_project_milestones_project') THEN
          ALTER TABLE "project_milestones"
          ADD CONSTRAINT "FK_project_milestones_project"
          FOREIGN KEY ("projectId") REFERENCES "ict_projects"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS "project_milestones" DROP CONSTRAINT IF EXISTS "FK_project_milestones_project"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "ict_projects" DROP CONSTRAINT IF EXISTS "FK_ict_projects_tenant"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_project_milestones_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_project_milestones_project"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ict_projects_phase"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ict_projects_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ict_projects_tenant"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "project_milestones"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ict_projects"`);
  }
}
