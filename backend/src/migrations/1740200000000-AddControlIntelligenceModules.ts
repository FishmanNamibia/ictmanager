import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddControlIntelligenceModules1740200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "risk_register_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "title" character varying(500) NOT NULL,
        "description" text,
        "domain" character varying(40) NOT NULL DEFAULT 'operations',
        "likelihood" integer NOT NULL DEFAULT 3,
        "impact" integer NOT NULL DEFAULT 3,
        "riskScore" integer NOT NULL DEFAULT 9,
        "residualRiskScore" integer,
        "status" character varying(30) NOT NULL DEFAULT 'open',
        "owner" character varying(255),
        "mitigation" text,
        "reviewFrequency" character varying(100),
        "lastReviewDate" TIMESTAMP,
        "nextReviewDate" TIMESTAMP,
        "complianceArea" character varying(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_risk_register_items" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "compliance_audit_findings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "findingRef" character varying(80) NOT NULL,
        "title" character varying(500) NOT NULL,
        "description" text,
        "source" character varying(120),
        "severity" character varying(20) NOT NULL DEFAULT 'medium',
        "status" character varying(20) NOT NULL DEFAULT 'open',
        "owner" character varying(255),
        "dueDate" TIMESTAMP,
        "closedDate" TIMESTAMP,
        "correctiveAction" text,
        "evidenceUrl" character varying(500),
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_compliance_audit_findings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_compliance_findings_ref" UNIQUE ("tenantId", "findingRef")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendors" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "serviceCategory" character varying(120),
        "vendorType" character varying(120),
        "contactPerson" character varying(255),
        "contactEmail" character varying(255),
        "contactPhone" character varying(120),
        "supportContact" character varying(255),
        "website" character varying(255),
        "performanceScore" integer NOT NULL DEFAULT 100,
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "lastReviewDate" TIMESTAMP,
        "nextReviewDate" TIMESTAMP,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vendors" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendor_contracts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "vendorId" uuid NOT NULL,
        "contractNumber" character varying(80),
        "title" character varying(500) NOT NULL,
        "contractType" character varying(100),
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "startDate" TIMESTAMP,
        "endDate" TIMESTAMP,
        "renewalNoticeDays" integer NOT NULL DEFAULT 90,
        "autoRenew" boolean NOT NULL DEFAULT false,
        "annualValue" numeric(14,2),
        "currency" character varying(5) NOT NULL DEFAULT 'NAD',
        "slaTarget" character varying(255),
        "slaMetPercent" numeric(5,2),
        "penaltyClause" text,
        "owner" character varying(255),
        "documentUrl" character varying(500),
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vendor_contracts" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "change_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "changeNumber" character varying(50) NOT NULL,
        "title" character varying(500) NOT NULL,
        "description" text,
        "category" character varying(120),
        "riskLevel" character varying(20) NOT NULL DEFAULT 'medium',
        "impactLevel" character varying(20) NOT NULL DEFAULT 'medium',
        "status" character varying(30) NOT NULL DEFAULT 'requested',
        "requestedBy" character varying(255) NOT NULL,
        "approver" character varying(255),
        "assignedTo" character varying(255),
        "plannedStart" TIMESTAMP,
        "plannedEnd" TIMESTAMP,
        "actualStart" TIMESTAMP,
        "actualEnd" TIMESTAMP,
        "outageExpected" boolean NOT NULL DEFAULT false,
        "businessApproval" boolean NOT NULL DEFAULT false,
        "rollbackPlan" text,
        "testPlan" text,
        "implementationNotes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_change_requests" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_change_requests_number" UNIQUE ("tenantId", "changeNumber")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "release_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "releaseNumber" character varying(50) NOT NULL,
        "name" character varying(255) NOT NULL,
        "version" character varying(80),
        "environment" character varying(80) NOT NULL DEFAULT 'production',
        "status" character varying(30) NOT NULL DEFAULT 'planned',
        "plannedDate" TIMESTAMP,
        "releaseDate" TIMESTAMP,
        "changeRequestId" uuid,
        "releaseManager" character varying(255),
        "notes" text,
        "postReleaseSummary" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_release_records" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_release_records_number" UNIQUE ("tenantId", "releaseNumber")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_risk_register_tenant" ON "risk_register_items" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_risk_register_status" ON "risk_register_items" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_risk_register_domain" ON "risk_register_items" ("domain")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_risk_register_next_review" ON "risk_register_items" ("nextReviewDate")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_findings_tenant" ON "compliance_audit_findings" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_findings_status" ON "compliance_audit_findings" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_findings_severity" ON "compliance_audit_findings" ("severity")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_findings_due_date" ON "compliance_audit_findings" ("dueDate")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vendors_tenant" ON "vendors" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vendors_status" ON "vendors" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vendors_name" ON "vendors" ("name")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vendor_contracts_tenant" ON "vendor_contracts" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vendor_contracts_status" ON "vendor_contracts" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vendor_contracts_vendor" ON "vendor_contracts" ("vendorId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vendor_contracts_end" ON "vendor_contracts" ("endDate")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_change_requests_tenant" ON "change_requests" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_change_requests_status" ON "change_requests" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_change_requests_risk" ON "change_requests" ("riskLevel")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_change_requests_planned" ON "change_requests" ("plannedStart")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_release_records_tenant" ON "release_records" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_release_records_status" ON "release_records" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_release_records_planned" ON "release_records" ("plannedDate")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_release_records_change" ON "release_records" ("changeRequestId")`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_risk_register_items_tenant') THEN
          ALTER TABLE "risk_register_items"
          ADD CONSTRAINT "FK_risk_register_items_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_compliance_findings_tenant') THEN
          ALTER TABLE "compliance_audit_findings"
          ADD CONSTRAINT "FK_compliance_findings_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_vendors_tenant') THEN
          ALTER TABLE "vendors"
          ADD CONSTRAINT "FK_vendors_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_vendor_contracts_tenant') THEN
          ALTER TABLE "vendor_contracts"
          ADD CONSTRAINT "FK_vendor_contracts_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_vendor_contracts_vendor') THEN
          ALTER TABLE "vendor_contracts"
          ADD CONSTRAINT "FK_vendor_contracts_vendor"
          FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_change_requests_tenant') THEN
          ALTER TABLE "change_requests"
          ADD CONSTRAINT "FK_change_requests_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_release_records_tenant') THEN
          ALTER TABLE "release_records"
          ADD CONSTRAINT "FK_release_records_tenant"
          FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_release_records_change') THEN
          ALTER TABLE "release_records"
          ADD CONSTRAINT "FK_release_records_change"
          FOREIGN KEY ("changeRequestId") REFERENCES "change_requests"("id") ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS "release_records" DROP CONSTRAINT IF EXISTS "FK_release_records_change"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "release_records" DROP CONSTRAINT IF EXISTS "FK_release_records_tenant"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "change_requests" DROP CONSTRAINT IF EXISTS "FK_change_requests_tenant"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "vendor_contracts" DROP CONSTRAINT IF EXISTS "FK_vendor_contracts_vendor"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "vendor_contracts" DROP CONSTRAINT IF EXISTS "FK_vendor_contracts_tenant"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "vendors" DROP CONSTRAINT IF EXISTS "FK_vendors_tenant"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "compliance_audit_findings" DROP CONSTRAINT IF EXISTS "FK_compliance_findings_tenant"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "risk_register_items" DROP CONSTRAINT IF EXISTS "FK_risk_register_items_tenant"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_release_records_change"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_release_records_planned"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_release_records_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_release_records_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_change_requests_planned"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_change_requests_risk"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_change_requests_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_change_requests_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vendor_contracts_end"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vendor_contracts_vendor"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vendor_contracts_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vendor_contracts_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vendors_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vendors_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vendors_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_findings_due_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_findings_severity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_findings_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_findings_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_risk_register_next_review"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_risk_register_domain"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_risk_register_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_risk_register_tenant"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "release_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "change_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vendor_contracts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vendors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "compliance_audit_findings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "risk_register_items"`);
  }
}

