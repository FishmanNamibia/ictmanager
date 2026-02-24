import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignLegacyModuleSchemas1740140000000 implements MigrationInterface {
  name = 'AlignLegacyModuleSchemas1740140000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      ALTER TABLE "software_licenses"
        ADD COLUMN IF NOT EXISTS "software_category" character varying,
        ADD COLUMN IF NOT EXISTS "version" character varying,
        ADD COLUMN IF NOT EXISTS "vendor" character varying,
        ADD COLUMN IF NOT EXISTS "contract_ref" character varying,
        ADD COLUMN IF NOT EXISTS "procurement_ref" character varying,
        ADD COLUMN IF NOT EXISTS "purchase_date" date,
        ADD COLUMN IF NOT EXISTS "start_date" date,
        ADD COLUMN IF NOT EXISTS "support_end_date" date,
        ADD COLUMN IF NOT EXISTS "cost_per_seat" decimal(12,2),
        ADD COLUMN IF NOT EXISTS "currency" character varying(3) DEFAULT 'NAD',
        ADD COLUMN IF NOT EXISTS "business_owner" character varying,
        ADD COLUMN IF NOT EXISTS "ict_owner" character varying,
        ADD COLUMN IF NOT EXISTS "criticality" character varying(10) DEFAULT 'medium'
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_software_licenses_tenant_name"
      ON "software_licenses" ("tenant_id", "software_name")
    `);

    await queryRunner.query(`
      ALTER TABLE "applications"
        ADD COLUMN IF NOT EXISTS "acronym" character varying,
        ADD COLUMN IF NOT EXISTS "category" character varying,
        ADD COLUMN IF NOT EXISTS "app_type" character varying(20),
        ADD COLUMN IF NOT EXISTS "status" character varying(20) NOT NULL DEFAULT 'live',
        ADD COLUMN IF NOT EXISTS "go_live_date" date,
        ADD COLUMN IF NOT EXISTS "version" character varying,
        ADD COLUMN IF NOT EXISTS "system_owner" character varying,
        ADD COLUMN IF NOT EXISTS "support_team" character varying,
        ADD COLUMN IF NOT EXISTS "support_model" character varying(20),
        ADD COLUMN IF NOT EXISTS "tier" character varying(10),
        ADD COLUMN IF NOT EXISTS "data_sensitivity" character varying(20),
        ADD COLUMN IF NOT EXISTS "availability_requirement" character varying,
        ADD COLUMN IF NOT EXISTS "rto" character varying,
        ADD COLUMN IF NOT EXISTS "rpo" character varying,
        ADD COLUMN IF NOT EXISTS "environments" character varying,
        ADD COLUMN IF NOT EXISTS "data_center" character varying,
        ADD COLUMN IF NOT EXISTS "database_type" character varying,
        ADD COLUMN IF NOT EXISTS "domain_url" character varying,
        ADD COLUMN IF NOT EXISTS "integrations" text,
        ADD COLUMN IF NOT EXISTS "auth_method" character varying,
        ADD COLUMN IF NOT EXISTS "access_control" character varying,
        ADD COLUMN IF NOT EXISTS "audit_logging" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "audit_retention_days" integer,
        ADD COLUMN IF NOT EXISTS "encryption_at_rest" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "encryption_in_transit" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "compliance_tags" character varying,
        ADD COLUMN IF NOT EXISTS "last_security_review" date,
        ADD COLUMN IF NOT EXISTS "vulnerability_status" character varying DEFAULT 'unknown',
        ADD COLUMN IF NOT EXISTS "lifecycle_stage" character varying(20),
        ADD COLUMN IF NOT EXISTS "end_of_support_date" date,
        ADD COLUMN IF NOT EXISTS "planned_upgrade_date" date,
        ADD COLUMN IF NOT EXISTS "planned_replacement" character varying,
        ADD COLUMN IF NOT EXISTS "annual_maintenance_cost" decimal(14,2),
        ADD COLUMN IF NOT EXISTS "contract_start_date" date,
        ADD COLUMN IF NOT EXISTS "contract_end_date" date,
        ADD COLUMN IF NOT EXISTS "procurement_ref" character varying,
        ADD COLUMN IF NOT EXISTS "vendor_sla_level" character varying,
        ADD COLUMN IF NOT EXISTS "uptime_percent" decimal(5,2),
        ADD COLUMN IF NOT EXISTS "open_incidents" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "open_security_issues" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "backup_success_rate" decimal(5,2),
        ADD COLUMN IF NOT EXISTS "last_review_date" date
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_applications_tenant_status"
      ON "applications" ("tenant_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_applications_tenant_health"
      ON "applications" ("tenant_id", "health_status")
    `);

    await queryRunner.query(`
      ALTER TABLE "staff_profiles"
        ADD COLUMN IF NOT EXISTS "full_name" character varying NOT NULL DEFAULT 'Unknown',
        ADD COLUMN IF NOT EXISTS "employee_number" character varying,
        ADD COLUMN IF NOT EXISTS "grade" character varying,
        ADD COLUMN IF NOT EXISTS "unit" character varying,
        ADD COLUMN IF NOT EXISTS "location" character varying,
        ADD COLUMN IF NOT EXISTS "employment_type" character varying(20),
        ADD COLUMN IF NOT EXISTS "start_date" date,
        ADD COLUMN IF NOT EXISTS "supervisor_name" character varying,
        ADD COLUMN IF NOT EXISTS "email" character varying,
        ADD COLUMN IF NOT EXISTS "phone" character varying,
        ADD COLUMN IF NOT EXISTS "role_type" character varying(20),
        ADD COLUMN IF NOT EXISTS "on_call_eligible" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "shift_hours" character varying,
        ADD COLUMN IF NOT EXISTS "operational_percent" integer,
        ADD COLUMN IF NOT EXISTS "projects_percent" integer,
        ADD COLUMN IF NOT EXISTS "admin_percent" integer,
        ADD COLUMN IF NOT EXISTS "training_percent" integer,
        ADD COLUMN IF NOT EXISTS "pdp_notes" text
    `);

    await queryRunner.query(`
      ALTER TABLE "staff_profiles"
      ALTER COLUMN "user_id" TYPE character varying USING "user_id"::text
    `);
    await queryRunner.query(`
      ALTER TABLE "staff_profiles"
      ALTER COLUMN "reports_to_user_id" TYPE character varying USING "reports_to_user_id"::text
    `);
    await queryRunner.query(`
      ALTER TABLE "staff_profiles"
      ALTER COLUMN "user_id" DROP NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_staff_profiles_tenant_full_name"
      ON "staff_profiles" ("tenant_id", "full_name")
    `);

    await queryRunner.query(`
      ALTER TABLE "staff_skills"
        ADD COLUMN IF NOT EXISTS "skill_category" character varying,
        ADD COLUMN IF NOT EXISTS "skill_level" integer NOT NULL DEFAULT 2,
        ADD COLUMN IF NOT EXISTS "last_used" date,
        ADD COLUMN IF NOT EXISTS "evidence" text,
        ADD COLUMN IF NOT EXISTS "priority" character varying(20) DEFAULT 'has_it',
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_staff_skills_tenant_profile"
      ON "staff_skills" ("tenant_id", "staff_profile_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "staff_certifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "staff_profile_id" uuid NOT NULL,
        "cert_name" character varying NOT NULL,
        "provider" character varying,
        "cert_level" character varying,
        "attained_date" date,
        "expiry_date" date,
        "mandatory" boolean NOT NULL DEFAULT false,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_staff_certifications" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "system_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "staff_profile_id" uuid NOT NULL,
        "system_name" character varying NOT NULL,
        "system_id" character varying,
        "role" character varying(20) NOT NULL DEFAULT 'primary',
        "scope" character varying(20),
        "coverage" character varying(20) DEFAULT 'business_hours',
        "sla_responsibility" boolean NOT NULL DEFAULT false,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_system_assignments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_staff_certifications_tenant_profile"
      ON "staff_certifications" ("tenant_id", "staff_profile_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_system_assignments_tenant_profile"
      ON "system_assignments" ("tenant_id", "staff_profile_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_staff_certifications_tenant') THEN
          ALTER TABLE "staff_certifications"
          ADD CONSTRAINT "FK_staff_certifications_tenant"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_staff_certifications_profile') THEN
          ALTER TABLE "staff_certifications"
          ADD CONSTRAINT "FK_staff_certifications_profile"
          FOREIGN KEY ("staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_system_assignments_tenant') THEN
          ALTER TABLE "system_assignments"
          ADD CONSTRAINT "FK_system_assignments_tenant"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_system_assignments_profile') THEN
          ALTER TABLE "system_assignments"
          ADD CONSTRAINT "FK_system_assignments_profile"
          FOREIGN KEY ("staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "system_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "staff_certifications"`);

    await queryRunner.query(`
      ALTER TABLE "staff_skills"
        DROP COLUMN IF EXISTS "updatedAt",
        DROP COLUMN IF EXISTS "priority",
        DROP COLUMN IF EXISTS "evidence",
        DROP COLUMN IF EXISTS "last_used",
        DROP COLUMN IF EXISTS "skill_level",
        DROP COLUMN IF EXISTS "skill_category"
    `);

    await queryRunner.query(`
      ALTER TABLE "staff_profiles"
        DROP COLUMN IF EXISTS "pdp_notes",
        DROP COLUMN IF EXISTS "training_percent",
        DROP COLUMN IF EXISTS "admin_percent",
        DROP COLUMN IF EXISTS "projects_percent",
        DROP COLUMN IF EXISTS "operational_percent",
        DROP COLUMN IF EXISTS "shift_hours",
        DROP COLUMN IF EXISTS "on_call_eligible",
        DROP COLUMN IF EXISTS "role_type",
        DROP COLUMN IF EXISTS "phone",
        DROP COLUMN IF EXISTS "email",
        DROP COLUMN IF EXISTS "supervisor_name",
        DROP COLUMN IF EXISTS "start_date",
        DROP COLUMN IF EXISTS "employment_type",
        DROP COLUMN IF EXISTS "location",
        DROP COLUMN IF EXISTS "unit",
        DROP COLUMN IF EXISTS "grade",
        DROP COLUMN IF EXISTS "employee_number",
        DROP COLUMN IF EXISTS "full_name"
    `);

    await queryRunner.query(`
      ALTER TABLE "applications"
        DROP COLUMN IF EXISTS "last_review_date",
        DROP COLUMN IF EXISTS "backup_success_rate",
        DROP COLUMN IF EXISTS "open_security_issues",
        DROP COLUMN IF EXISTS "open_incidents",
        DROP COLUMN IF EXISTS "uptime_percent",
        DROP COLUMN IF EXISTS "vendor_sla_level",
        DROP COLUMN IF EXISTS "procurement_ref",
        DROP COLUMN IF EXISTS "contract_end_date",
        DROP COLUMN IF EXISTS "contract_start_date",
        DROP COLUMN IF EXISTS "annual_maintenance_cost",
        DROP COLUMN IF EXISTS "planned_replacement",
        DROP COLUMN IF EXISTS "planned_upgrade_date",
        DROP COLUMN IF EXISTS "end_of_support_date",
        DROP COLUMN IF EXISTS "lifecycle_stage",
        DROP COLUMN IF EXISTS "vulnerability_status",
        DROP COLUMN IF EXISTS "last_security_review",
        DROP COLUMN IF EXISTS "compliance_tags",
        DROP COLUMN IF EXISTS "encryption_in_transit",
        DROP COLUMN IF EXISTS "encryption_at_rest",
        DROP COLUMN IF EXISTS "audit_retention_days",
        DROP COLUMN IF EXISTS "audit_logging",
        DROP COLUMN IF EXISTS "access_control",
        DROP COLUMN IF EXISTS "auth_method",
        DROP COLUMN IF EXISTS "integrations",
        DROP COLUMN IF EXISTS "domain_url",
        DROP COLUMN IF EXISTS "database_type",
        DROP COLUMN IF EXISTS "data_center",
        DROP COLUMN IF EXISTS "environments",
        DROP COLUMN IF EXISTS "rpo",
        DROP COLUMN IF EXISTS "rto",
        DROP COLUMN IF EXISTS "availability_requirement",
        DROP COLUMN IF EXISTS "data_sensitivity",
        DROP COLUMN IF EXISTS "tier",
        DROP COLUMN IF EXISTS "support_model",
        DROP COLUMN IF EXISTS "support_team",
        DROP COLUMN IF EXISTS "system_owner",
        DROP COLUMN IF EXISTS "version",
        DROP COLUMN IF EXISTS "go_live_date",
        DROP COLUMN IF EXISTS "status",
        DROP COLUMN IF EXISTS "app_type",
        DROP COLUMN IF EXISTS "category",
        DROP COLUMN IF EXISTS "acronym"
    `);

    await queryRunner.query(`
      ALTER TABLE "software_licenses"
        DROP COLUMN IF EXISTS "criticality",
        DROP COLUMN IF EXISTS "ict_owner",
        DROP COLUMN IF EXISTS "business_owner",
        DROP COLUMN IF EXISTS "currency",
        DROP COLUMN IF EXISTS "cost_per_seat",
        DROP COLUMN IF EXISTS "support_end_date",
        DROP COLUMN IF EXISTS "start_date",
        DROP COLUMN IF EXISTS "purchase_date",
        DROP COLUMN IF EXISTS "procurement_ref",
        DROP COLUMN IF EXISTS "contract_ref",
        DROP COLUMN IF EXISTS "vendor",
        DROP COLUMN IF EXISTS "version",
        DROP COLUMN IF EXISTS "software_category"
    `);
  }
}

