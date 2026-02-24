import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCybersecuritySchema1740000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "security_incidents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "title" character varying(500) NOT NULL,
        "description" text,
        "severity" character varying(50) NOT NULL,
        "status" character varying(50) NOT NULL DEFAULT 'reported',
        "reportedBy" character varying(255),
        "dateDetected" TIMESTAMP,
        "dateReported" TIMESTAMP,
        "dateContained" TIMESTAMP,
        "dateResolved" TIMESTAMP,
        "rootCause" text,
        "remediation" text,
        "affectedSystems" text,
        "affectedUsersCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_security_incidents" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "incident_evidence" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "incidentId" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "fileUrl" character varying(500),
        "fileType" character varying(100),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_incident_evidence" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ict_risks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "title" character varying(500) NOT NULL,
        "description" text,
        "category" character varying(100),
        "likelihood" character varying(50) NOT NULL,
        "impact" character varying(50) NOT NULL,
        "overallRisk" character varying(50) NOT NULL,
        "status" character varying(50) NOT NULL DEFAULT 'identified',
        "mitigation" character varying(500),
        "owner" text,
        "reviewDue" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ict_risks" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vulnerabilities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "cveId" character varying(255) NOT NULL,
        "title" character varying(500) NOT NULL,
        "description" text,
        "severity" character varying(50) NOT NULL,
        "affectedComponent" character varying(100),
        "affectedVersion" character varying(100),
        "patchVersion" character varying(100),
        "status" character varying(50) NOT NULL DEFAULT 'identified',
        "discoveredDate" TIMESTAMP,
        "patchAvailableDate" TIMESTAMP,
        "targetRemediationDate" TIMESTAMP,
        "remediatedDate" TIMESTAMP,
        "applicableSystems" text,
        "mitigation" text,
        "references" character varying(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vulnerabilities" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "access_reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "title" character varying(500) NOT NULL,
        "description" text,
        "scope" character varying(100),
        "status" character varying(50) NOT NULL DEFAULT 'scheduled',
        "dueDate" TIMESTAMP NOT NULL,
        "lastCompletedDate" TIMESTAMP,
        "nextDueDate" TIMESTAMP,
        "reviewer" character varying(255),
        "usersReviewedCount" integer NOT NULL DEFAULT 0,
        "accessRemovedCount" integer NOT NULL DEFAULT 0,
        "findings" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_access_reviews" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "security_audit_evidence" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "auditType" character varying(100) NOT NULL,
        "userId" character varying(255),
        "actionBy" character varying(255),
        "resource" character varying(500),
        "details" text,
        "ipAddress" character varying(100),
        "userAgent" character varying(500),
        "success" boolean NOT NULL DEFAULT true,
        "errorMessage" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_security_audit_evidence" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_incidents_tenant_status" ON "security_incidents" ("tenantId", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_risks_tenant_overall" ON "ict_risks" ("tenantId", "overallRisk")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vulns_tenant_severity" ON "vulnerabilities" ("tenantId", "severity")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_reviews_tenant_due" ON "access_reviews" ("tenantId", "dueDate")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_tenant_created" ON "security_audit_evidence" ("tenantId", "createdAt")`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_incidents_tenant') THEN
          ALTER TABLE "security_incidents"
          ADD CONSTRAINT "FK_incidents_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_incident_evidence_incident') THEN
          ALTER TABLE "incident_evidence"
          ADD CONSTRAINT "FK_incident_evidence_incident"
          FOREIGN KEY ("incidentId") REFERENCES "security_incidents"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_risks_tenant') THEN
          ALTER TABLE "ict_risks"
          ADD CONSTRAINT "FK_risks_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_vulns_tenant') THEN
          ALTER TABLE "vulnerabilities"
          ADD CONSTRAINT "FK_vulns_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_reviews_tenant') THEN
          ALTER TABLE "access_reviews"
          ADD CONSTRAINT "FK_reviews_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_audit_tenant') THEN
          ALTER TABLE "security_audit_evidence"
          ADD CONSTRAINT "FK_audit_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS "security_audit_evidence" DROP CONSTRAINT IF EXISTS "FK_audit_tenant"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "access_reviews" DROP CONSTRAINT IF EXISTS "FK_reviews_tenant"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "vulnerabilities" DROP CONSTRAINT IF EXISTS "FK_vulns_tenant"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "ict_risks" DROP CONSTRAINT IF EXISTS "FK_risks_tenant"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "incident_evidence" DROP CONSTRAINT IF EXISTS "FK_incident_evidence_incident"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "security_incidents" DROP CONSTRAINT IF EXISTS "FK_incidents_tenant"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_tenant_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reviews_tenant_due"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vulns_tenant_severity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_risks_tenant_overall"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_incidents_tenant_status"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "security_audit_evidence"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "access_reviews"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vulnerabilities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ict_risks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "incident_evidence"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "security_incidents"`);
  }
}
